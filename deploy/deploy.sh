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
# deploy.sh peut être modifié par son propre `git reset --hard` : bash lit le
# script au fil de l'eau, donc on le relance une fois si son contenu a changé.
SELF="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/$(basename "${0}")"
sum_self() { sha256sum "$SELF" 2>/dev/null | cut -d' ' -f1 || echo none; }
SUM_BEFORE="$(sum_self)"

fail() { echo "❌ $*" >&2; exit 1; }
envval() { grep -E "^$1=" .env 2>/dev/null | head -1 | cut -d= -f2- || true; }

command -v docker >/dev/null || fail "docker non installé"
docker compose version >/dev/null 2>&1 || fail "plugin docker compose absent"
[[ -f .env ]] || fail ".env absent — cp .env.example .env"

echo "== 1/6 code source : $TARGET_REF =="
git fetch --tags --prune origin
FULL_SHA="$(git rev-parse --verify "${TARGET_REF}^{commit}")" || fail "ref inconnue : $TARGET_REF"
git reset --hard "$FULL_SHA" >/dev/null   # .env n'est pas suivi : préservé
if [[ "${KNIGHT_DEPLOY_REEXEC:-0}" != "1" && "$(sum_self)" != "$SUM_BEFORE" ]]; then
  echo "   deploy.sh mis à jour par le reset → relance du script"
  exec env KNIGHT_DEPLOY_REEXEC=1 "$SELF" "$@"
fi
[[ -z "$(git status --porcelain)" ]] || { git status --short; fail "arbre de travail sale après reset"; }
echo "   commit déployé : $FULL_SHA ($(git log -1 --format=%s | cut -c1-60))"

echo "== 2/6 config Next (output: standalone) =="
if grep -q "output" next.config.mjs; then
  echo "   déjà présent (laissé tel quel)"
else
  sed -i "s/^const nextConfig = {/const nextConfig = {\n  output: 'standalone',/" next.config.mjs
  grep -q "output: 'standalone'" next.config.mjs || fail "patch standalone impossible — vérifier next.config.mjs"
  echo "   ajouté par le déploiement (à upstreamer dans le dépôt)"
fi
[[ -d public ]] || mkdir -p public

echo "== 3/6 build image ($FULL_SHA) =="
# Mot de passe d'accès : OBLIGATOIRE en prod (sinon le site resterait ouvert,
# cf. middleware.ts). Jamais un build-arg : secret BuildKit via fichier 600.
PW="$(envval SHEET_PASSWORD)"
[[ ${#PW} -ge 16 ]] || fail "SHEET_PASSWORD absent ou trop court (${#PW} caractères, minimum 16) — renseigner .env"
umask 077
printf '%s' "$PW" > .sheet_password
chmod 600 .sheet_password
trap 'rm -f "$ROOT/.sheet_password"' EXIT
sed -i "s/^KNIGHT_GIT_SHA=.*/KNIGHT_GIT_SHA=$FULL_SHA/" .env
# Un secret BuildKit n'invalide pas le cache : on casse le cache avec le sha256
# du mot de passe (jamais le secret lui-même) quand il change.
PW_HASH="$(printf '%s' "$PW" | sha256sum | cut -d' ' -f1)"
docker compose build --build-arg GIT_SHA="$FULL_SHA" --build-arg SHEET_PASSWORD_HASH="$PW_HASH" app

echo "== 4/6 démarrage stack knight =="
PORT="$(envval KNIGHT_PORT)"; PORT="${PORT:-8011}"
TLS_MODE="$(envval KNIGHT_TLS_MODE)"; TLS_MODE="${TLS_MODE:-host}"
COMPOSE=(docker compose)
if [[ "$TLS_MODE" == "bundled" ]]; then COMPOSE+=(--profile tls); fi
"${COMPOSE[@]}" up -d --remove-orphans

echo "== 5/6 vérifications (auth) =="
state=unknown
for _ in $(seq 1 40); do
  state="$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' knight-app 2>/dev/null || echo missing)"
  [[ "$state" == "healthy" ]] && break
  sleep 3
done
echo "   healthcheck conteneur : $state"
[[ "$state" == "healthy" ]] || { docker logs --tail 40 knight-app; fail "conteneur non healthy"; }

CHECK_PATH="$(envval KNIGHT_CHECK_PATH)"; CHECK_PATH="${CHECK_PATH:-/personnage/combat}"

# a) page de login publique
code="$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:${PORT}/login")"
echo "   /login (public) → $code"
[[ "$code" == "200" ]] || fail "/login ne répond pas 200 (code $code)"

# b) page protégée SANS session : doit rediriger (jamais 200)
code="$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:${PORT}${CHECK_PATH}")"
echo "   ${CHECK_PATH} sans cookie → $code (attendu 3xx/401, jamais 200)"
case "$code" in 3*|401) ;; *) fail "page protégée accessible sans mot de passe (code $code) — SÉCURITÉ";; esac

# c) mauvais mot de passe : refusé
code="$(curl -s -o /dev/null -w '%{http_code}' -X POST -H 'Content-Type: application/json' \
  -d '{"password":"mauvais-mot-de-passe-de-test"}' "http://127.0.0.1:${PORT}/api/login")"
echo "   /api/login mauvais mot de passe → $code (attendu 401)"
[[ "$code" == "401" ]] || fail "mot de passe erroné accepté (code $code) — SÉCURITÉ"

# d) la variable est bien injectée dans le conteneur (sinon fail-open prouvé)
docker exec knight-app sh -c '[ -n "$SHEET_PASSWORD" ]' \
  || fail "SHEET_PASSWORD absente de l'environnement du conteneur — le site serait ouvert"
echo "   SHEET_PASSWORD présente dans le conteneur (${#PW} car.)"

# e) bon mot de passe : cookie posé avec les bons attributs
jar="$(mktemp)"
resp="$(printf '{"password":"%s"}' "$PW" | curl -s -D - -o /dev/null -c "$jar" -X POST \
  -H 'Content-Type: application/json' --data-binary @- "http://127.0.0.1:${PORT}/api/login")"
echo "   /api/login bon mot de passe → $(printf '%s' "$resp" | head -1 | tr -d '\r')"
printf '%s' "$resp" | grep -qi '^set-cookie: sheet-auth=' || { rm -f "$jar"; fail "aucun cookie sheet-auth posé"; }
printf '%s' "$resp" | grep -qi 'httponly' || echo "   ⚠️  cookie sans HttpOnly"
printf '%s' "$resp" | grep -qi 'secure'   || echo "   ⚠️  cookie sans Secure"
code="$(curl -s -o /dev/null -w '%{http_code}' -b "$jar" "http://127.0.0.1:${PORT}${CHECK_PATH}")"
rm -f "$jar"
echo "   ${CHECK_PATH} avec cookie (http local) → $code"
[[ "$code" == "200" ]] || echo "   ↳ normal en local : l'attribut Secure empêche l'envoi du cookie en http, parcours complet testé en HTTPS"


DOMAIN="$(envval KNIGHT_DOMAIN)"
if [[ -n "$DOMAIN" && "$DOMAIN" != "localhost" && "$TLS_MODE" == "host" ]]; then
  # --resolve : le résolveur du VPS peut garder un NXDOMAIN/NXDOMAIN+TTL en cache
  # (le certificat et le SNI sont toujours validés, seul le DNS est forcé).
  R=(--resolve "${DOMAIN}:443:127.0.0.1")
  hcode="$(curl -s "${R[@]}" -o /dev/null -w '%{http_code}' --max-time 15 "https://${DOMAIN}/login" || true)"
  echo "   HTTPS https://${DOMAIN}/login → ${hcode:-000}"

  # parcours authentifié de bout en bout À TRAVERS Caddy (cookie Secure inclus)
  jar2="$(mktemp)"
  printf '{"password":"%s"}' "$PW" | curl -s "${R[@]}" -o /dev/null -c "$jar2" -X POST \
    -H 'Content-Type: application/json' --data-binary @- "https://${DOMAIN}/api/login"
  h2="$(curl -s "${R[@]}" -b "$jar2" -o /dev/null -w '%{http_code}' --max-time 15 "https://${DOMAIN}${CHECK_PATH}" || true)"
  h3="$(curl -s "${R[@]}" -o /dev/null -w '%{http_code}' --max-time 15 "https://${DOMAIN}${CHECK_PATH}" || true)"
  rm -f "$jar2"
  echo "   HTTPS ${CHECK_PATH} avec cookie → ${h2:-000} (attendu 200)"
  echo "   HTTPS ${CHECK_PATH} sans cookie → ${h3:-000} (attendu 3xx)"
  [[ "${h2:-000}" == "200" ]] || echo "   ⚠️  parcours HTTPS authentifié à vérifier (DNS, Caddy, cookie Secure)"
  case "${h3:-000}" in 3*|401|000) ;; *) echo "   ⚠️  page protégée accessible sans cookie en HTTPS (code $h3) — SÉCURITÉ";; esac
fi

echo "✅ déployé : $FULL_SHA sur 127.0.0.1:${PORT}"
docker ps --filter name=knight-app --format '   {{.Names}} {{.Status}} ({{.Image}})'