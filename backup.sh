#!/usr/bin/env bash
# Sauvegarde knight.db (recette point 8 — prompt v13 §2 : integrity ok)
set -e
DB=${1:-/data/knight.db}
DEST=${2:-$(dirname "$DB")/knight.db.bak}
cp "$DB" "$DEST"
echo "Sauvegarde : $DB → $DEST"
# intégrité
python3 - <<EOF
import sqlite3
c = sqlite3.connect("$DEST")
print("integrity", c.execute("PRAGMA integrity_check").fetchone()[0])
print("chevaliers:", c.execute("SELECT COUNT(*) FROM chevaliers").fetchone()[0])
EOF
