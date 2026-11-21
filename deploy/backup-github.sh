#!/usr/bin/env bash
# Backup GitHub hors site (prompt v16 §7) : snapshot knight.db dans un repo
# PRIVÉ dédié (knight-sheet-backups) via l'API GitHub — token en variable
# d'environnement (GITHUB_BACKUP_TOKEN), JAMAIS dans le repo. Rétention =
# historique de commits. À lancer après backup.sh (cron quotidien 03:30).
set -e
DB=${1:-/data/knight.db}
REPO=${KNIGHT_BACKUP_REPO:-knight-sheet-backups}
TOKEN=${GITHUB_BACKUP_TOKEN:?GITHUB_BACKUP_TOKEN requis}
USER=${GITHUB_BACKUP_USER:-mjjdr946-sketch}

[ -f "$DB" ] || { echo "knight.db introuvable : $DB"; exit 1; }

# snapshot daté + base64 pour PUT contents
STAMP=$(date -u +%Y%m%d-%H%M)
CONTENT=$(base64 -w0 "$DB")

echo "Push du snapshot $DB → $USER/$REPO ($STAMP)…"
HTTP=$(curl -s -o /tmp/gh-out.json -w "%{http_code}" \
  -X PUT \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/vnd.github+json" \
  "https://api.github.com/repos/$USER/$REPO/contents/knight-$STAMP.db" \
  -d "{\"message\":\"backup $STAMP\",\"content\":\"$CONTENT\"}")

if [ "$HTTP" = "201" ] || [ "$HTTP" = "200" ]; then
  echo "OK ($HTTP) — rétention par historique de commits."
else
  echo "Échec GitHub ($HTTP) :"; cat /tmp/gh-out.json | head -5
  exit 1
fi

# Création du repo (une fois) :
#   curl -X POST -H "Authorization: Bearer $GITHUB_BACKUP_TOKEN" https://api.github.com/user/repos \
#     -d '{"name":"knight-sheet-backups","private":true}'
# Rotation du token : PAT fine-grained, scope contents:write sur ce repo uniquement.
