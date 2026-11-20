#!/usr/bin/env bash
# Restauration d'une sauvegarde knight.db dans le volume Docker.
#
#   ./deploy/restore.sh deploy/backups/knight-20261120-033000.db --yes
#
# ⚠️ DESTRUCTIF : remplace la base courante. Le script prend d'abord une
# sauvegarde de sécurité de l'état actuel (deploy/backups/pre-restore-*.db).
# Sans `--yes`, il demande une confirmation explicite.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

SOURCE="${1:-}"
[[ -n "$SOURCE" ]] || { echo "usage : $0 <fichier.db> [--yes]" >&2; exit 1; }
[[ -f "$SOURCE" ]] || { echo "❌ fichier introuvable : $SOURCE" >&2; exit 1; }
ls -l "$SOURCE"

if [[ "${2:-}" != "--yes" ]]; then
  echo "⚠️  Cette opération REMPLACE la base de production (comptes + fiches)."
  read -r -p "   Taper 'remplacer' pour continuer : " reponse
  [[ "$reponse" == "remplacer" ]] || { echo "annulé"; exit 1; }
fi

echo "== 1/4 sauvegarde de sécurité de l'état actuel =="
./deploy/backup.sh || echo "   ⚠️ sauvegarde impossible (base absente ?) — on continue"

echo "== 2/4 arrêt de l'application =="
docker compose stop app

echo "== 3/4 copie de la sauvegarde dans le volume =="
docker volume create knight_knight-data >/dev/null 2>&1 || true
VOLUME="$(docker inspect knight-app --format '{{range .Mounts}}{{if eq .Destination "/data"}}{{.Name}}{{end}}{{end}}' 2>/dev/null || true)"
VOLUME="${VOLUME:-knight_knight-data}"
echo "   volume cible : $VOLUME"
docker run --rm -v "$VOLUME":/data -v "$ROOT/$(dirname "$SOURCE")":/backup:ro alpine \
  sh -ec "rm -f /data/knight.db /data/knight.db-wal /data/knight.db-shm
          cp /backup/$(basename "$SOURCE") /data/knight.db
          chown 1000:1000 /data/knight.db && chmod 640 /data/knight.db
          ls -l /data"

echo "== 4/4 redémarrage + vérifications =="
docker compose up -d app
for _ in $(seq 1 30); do
  [[ "$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.State}}{{end}}' knight-app 2>/dev/null || echo missing)" == "healthy" ]] && break
  sleep 2
done
docker compose exec -T app node -e "
const Database=require('better-sqlite3');
const db=new Database('/data/knight.db',{readonly:true});
console.log('integrity :', Object.values(db.prepare('PRAGMA integrity_check').get())[0]);
for (const t of ['accounts','chevaliers','adversaires']) {
  console.log(t, ':', db.prepare('SELECT count(*) AS n FROM '+t).get().n);
}
db.close();"
echo "✅ restauration terminée (vérifier l'accès applicatif : https://<domaine>/)"
