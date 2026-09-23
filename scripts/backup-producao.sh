#!/usr/bin/env bash
set -euo pipefail

: "${DATABASE_URL:?DATABASE_URL é obrigatória}"
BACKUP_ROOT="${BACKUP_DIR:-./backups}"
UPLOAD_DIR="${UPLOAD_DIR:-./storage/uploads}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
DEST="${BACKUP_ROOT}/${STAMP}"
mkdir -p "$DEST"

pg_dump "$DATABASE_URL" --format=custom --file="$DEST/database.dump"

if [ -d "$UPLOAD_DIR" ]; then
  tar -czf "$DEST/uploads.tar.gz" -C "$UPLOAD_DIR" .
fi

sha256sum "$DEST"/* > "$DEST/SHA256SUMS"
echo "Backup criado em: $DEST"
