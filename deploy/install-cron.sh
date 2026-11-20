#!/usr/bin/env bash
# Installe la sauvegarde quotidienne de knight.db (cron root, idempotent).
#
#   ./deploy/install-cron.sh            # 03:30 tous les jours
#   ./deploy/install-cron.sh "45 2 * * *"
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

SCHEDULE="${1:-30 3 * * *}"
MARKER="# knight-backup"
LINE="$SCHEDULE $ROOT/deploy/backup.sh >> $ROOT/deploy/backups/cron.log 2>&1 $MARKER"

mkdir -p "$ROOT/deploy/backups"
chmod +x "$ROOT/deploy/backup.sh"
# Le conteneur tourne en uid 1000 : il doit pouvoir écrire dans son /backup.
chown 1000:1000 "$ROOT/deploy/backups" 2>/dev/null || true
chmod 750 "$ROOT/deploy/backups"

crontab -l 2>/dev/null | grep -v -- "$MARKER" | sed '/^$/d' | { cat; echo "$LINE"; } | crontab -
echo "✅ cron installé : $SCHEDULE"
crontab -l | grep -- "$MARKER"
