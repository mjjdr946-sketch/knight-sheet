#!/usr/bin/env bash
# Déploiement Knight Sheet sur le VPS — idempotent, non destructif.
#
#   ./deploy/deploy.sh [ref]      # ref = sha, tag ou branche (défaut: origin/main)
#
# Ce que fait le script :
#   1. récupère le code depuis GitHub et se cale EXACTEMENT sur la ref demandée
#      (Dockerfile, compose et deploy/ sont versionnés dans le dépôt ; seul .env
#      reste local et survit à git reset --hard)
#   2. garantit `output: 'standalone'` dans next.config.mjs (requis par l'image ;
#      filet de sécurité si le dev l'enlève)
#   3. build l'image avec le SHA en label, (re)démarre la stack "knight"
#   4. attend le healthcheck du conteneur puis vérifie HTTP en local
#   5. si KNIGHT_DOMAIN est renseigné et le mode host : vérifie aussi en HTTPS
#
# Aucun volume de données : rien à sauvegarder côté serveur (état = localStorage).
# Il ne supprime jamais rien : pas de `down -v`, pas de prune.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

TARGET_REF="${1:-origin/main}"

fail() { echo "❌ $*" >&2; exit 1; }
envval() { grep -E "^$1=" .env 2>/dev/null | head -1 | cut -d= -f2- || true; }

command -v docker >/dev/null || fail "docker non installé"
docker compose version >/dev/null 2>&1 || fail "plugin docker compose absent"
[[ -f .env ]] || fail ".env absent — cp .env.example .env"

echo "== 1/5 code source : $TARGET_REF =="
git fetch --tags --prune origin
FULL_SHA="$(git rev-parse --verify "${TARGET_REF}^{commit}")" || fail "ref inconnue : $TARGET_REF"
git reset --hard "$FULL_SHA" >/dev/null   # .env n'est pas suivi : préservé
[[ -z "$(git status --porcelain)" ]] || { git status --short; fail "arbre de travail sale après reset"; }
echo "   commit déployé : $FULL_SHA ($(git log -1 --format=%s | cut -c1-60))"

echo "== 2/5 config Next (output: standalone) =="
if grep -q "output" next.config.mjs; then
  echo "   déjà présent (laissé tel quel)"
else
  sed -i "s/^const nextConfig = {/const nextConfig = {\n  output: 'standalone',/" next.config.mjs
  grep -q "output: 'standalone'" next.config.mjs || fail "patch standalone impossible — vérifier next.config.mjs"
  echo "   ajouté par le déploiement (à upstreamer dans le dépôt)"
fi
[[ -d public ]] || mkdir -p public

echo "== 3/5 build image ($FULL_SHA) =="
sed -i "s/^KNIGHT_GIT_SHA=.*/KNIGHT_GIT_SHA=$FULL_SHA/" .env
docker compose build --build-arg GIT_SHA="$FULL_SHA" app

echo "== 4/5 démarrage stack knight =="
PORT="$(envval KNIGHT_PORT)"; PORT="${PORT:-8011}"
TLS_MODE="$(envval KNIGHT_TLS_MODE)"; TLS_MODE="${TLS_MODE:-host}"
COMPOSE=(docker compose)
if [[ "$TLS_MODE" == "bundled" ]]; then COMPOSE+=(--profile tls); fi
"${COMPOSE[@]}" up -d --remove-orphans

echo "== 5/5 vérifications =="
state=unknown
for _ in $(seq 1 40); do
  state="$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' knight-app 2>/dev/null || echo missing)"
  [[ "$state" == "healthy" ]] && break
  sleep 3
done
echo "   healthcheck conteneur : $state"
[[ "$state" == "healthy" ]] || { docker logs --tail 40 knight-app; fail "conteneur non healthy"; }

# `/` fait un redirect() volontaire vers /personnage/combat : on vérifie une
# page réelle (200) plutôt que la racine (307 sans Location, géré par le client).
CHECK_PATH="$(envval KNIGHT_CHECK_PATH)"; CHECK_PATH="${CHECK_PATH:-/personnage/combat}"
code="$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:${PORT}${CHECK_PATH}")"
echo "   HTTP 127.0.0.1:${PORT}${CHECK_PATH} → $code"
[[ "$code" == "200" ]] || fail "l'app ne répond pas 200 sur ${CHECK_PATH} (code $code)"

DOMAIN="$(envval KNIGHT_DOMAIN)"
if [[ -n "$DOMAIN" && "$DOMAIN" != "localhost" && "$TLS_MODE" == "host" ]]; then
  hcode="$(curl -s -o /dev/null -w '%{http_code}' --max-time 15 "https://${DOMAIN}${CHECK_PATH}" || true)"
  hcode="${hcode:-000}"
  echo "   HTTPS https://${DOMAIN}${CHECK_PATH} → $hcode"
  [[ "$hcode" == "200" ]] || echo "   ⚠️  vérifier DNS + bloc Caddy système (deploy/caddy-host.conf)"
fi

echo "✅ déployé : $FULL_SHA sur 127.0.0.1:${PORT}"
docker ps --filter name=knight-app --format '   {{.Names}} {{.Status}} ({{.Image}})'