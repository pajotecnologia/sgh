#!/usr/bin/env bash
set -euo pipefail

: "${DATABASE_URL:?DATABASE_URL é obrigatória}"
BACKUP_DIR="${1:?Informe o diretório do backup}"

[ -f "$BACKUP_DIR/database.dump" ] || { echo "database.dump não encontrado" >&2; exit 1; }

if [ "${CONFIRM_RESTORE:-}" != "YES" ]; then
  echo "Restauração destrutiva exige CONFIRM_RESTORE=YES" >&2
  exit 2
fi

if [ -f "$BACKUP_DIR/SHA256SUMS" ]; then
  (cd "$BACKUP_DIR" && sha256sum -c SHA256SUMS)
fi

pg_restore --clean --if-exists --no-owner --dbname="$DATABASE_URL" "$BACKUP_DIR/database.dump"
echo "Banco restaurado. Valide migrations, integridade e acesso antes de liberar o sistema."
