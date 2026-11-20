#!/usr/bin/env bash
# Sauvegarde de la base Knight Sheet (SQLite, volume Docker `knight-data`).
#
#   ./deploy/backup.sh [--keep N]      # défaut : 14 jeux
#
# ⚠️ Jamais `cp` : la base est en mode WAL (3 fichiers) → un cp du seul .db
# capture un état incohérent. On utilise l'API de sauvegarde de SQLite
# (`VACUUM INTO`), exécutée DANS le conteneur, qui produit un instantané
# cohérent sans arrêter l'application.
#
# Écrit `deploy/backups/knight-<stamp>.db` puis vérifie l'intégrité.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

KEEP=14
if [[ "${1:-}" == "--keep" ]]; then
  KEEP="${2:?--keep attend un nombre}"
fi
DEST="$ROOT/deploy/backups"
STAMP="$(date +%Y%m%d-%H%M%S)"
CIBLE="/backup/knight-${STAMP}.db"

mkdir -p "$DEST"

command -v docker >/dev/null || { echo "❌ docker absent" >&2; exit 1; }
docker inspect knight-app >/dev/null 2>&1 || { echo "❌ conteneur knight-app absent" >&2; exit 1; }

echo "== sauvegarde à chaud de /data/knight.db → knight-${STAMP}.db =="
docker compose exec -T app node -e "
const Database = require('better-sqlite3');
const db = new Database('/data/knight.db', { readonly: true });
db.exec(\"VACUUM INTO '${CIBLE}'\");
const integ = db.prepare('PRAGMA integrity_check').get();
console.log('integrity_check :', Object.values(integ)[0]);
const n = (t) => db.prepare('SELECT count(*) AS n FROM ' + t).get().n;
console.log('accounts :', n('accounts'), '| chevaliers :', n('chevaliers'), '| adversaires :', n('adversaires'));
db.close();
"

FICHIER="$DEST/knight-${STAMP}.db"
[[ -s "$FICHIER" ]] || { echo "❌ sauvegarde vide ou absente : $FICHIER" >&2; exit 1; }
chmod 640 "$FICHIER" 2>/dev/null || true

# Vérifie l'instantané lui-même (pas seulement la base source)
docker compose exec -T app node -e "
const Database = require('better-sqlite3');
const db = new Database('${CIBLE}', { readonly: true });
const r = db.prepare('PRAGMA integrity_check').get();
const n = db.prepare('SELECT count(*) AS n FROM accounts').get().n;
console.log('instantané — integrity :', Object.values(r)[0], '| comptes :', n);
db.close();
"

# Rétention en NOMBRE de jeux (supporte un cron manqué). Glob large pour
# emporter les -wal/-shm orphelins laissés par une ouverture en écriture.
ls -1t "$DEST"/knight-*.db 2>/dev/null | tail -n +$((KEEP + 1)) | while read -r vieux; do
  rm -f "$vieux" "$vieux-wal" "$vieux-shm"
done
# Purge des journaux orphelins sans base correspondante
for j in "$DEST"/knight-*.db-wal "$DEST"/knight-*.db-shm; do
  [[ -e "$j" ]] || continue
  base="${j%-wal}"; base="${base%-shm}"
  [[ -e "$base" ]] || rm -f "$j"
done

echo "✅ $(basename "$FICHIER") — $(du -h "$FICHIER" | cut -f1) — jeux conservés : $(ls -1 "$DEST"/knight-*.db 2>/dev/null | wc -l)/$KEEP"
ls -1t "$DEST"/knight-*.db 2>/dev/null | head -3 | sed 's/^/   /'
