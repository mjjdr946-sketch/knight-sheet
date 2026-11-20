#!/usr/bin/env bash
# Sauvegarde de knight.db — le script livré avec l'it. 11 faisait un `cp` du
# fichier SQLite : sur une base en mode WAL (celle de production), c'est un
# instantané incohérent (les écritures vivent dans knight.db-wal).
#
# Remplacé par le script d'exploitation (instantané cohérent `VACUUM INTO`
# exécuté dans le conteneur, integrity_check sur la source ET la copie,
# rétention, droits 640) :
#
#   ./backup.sh            → identique à ./deploy/backup.sh
#   ./deploy/backup.sh     → script réel (voir deploy/README.md)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec "$ROOT/deploy/backup.sh" "$@"
