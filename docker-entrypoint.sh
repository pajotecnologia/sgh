#!/bin/sh
set -e

# Executa migrações automáticas do banco se DATABASE_URL estiver presente
if [ -n "$DATABASE_URL" ] && [ "$DATABASE_URL" != "postgresql://dummy:dummy@localhost:5432/dummy" ]; then
  echo "=> SGH: Aplicando migrações e sincronização de schema PostgreSQL..."
  node scripts/deploy-migrations-safe.mjs
  echo "=> SGH: Migrações verificadas com sucesso."
  node scripts/sync-schema-vps.mjs 2>/dev/null || true
  echo "=> SGH: Sincronizando nomes completos de pacientes..."
  node scripts/atualizar-nomes-completos-pacientes.mjs 2>/dev/null || echo "=> SGH: Sincronização de nomes concluída."
fi

echo "=> SGH: Iniciando servidor na porta ${PORT:-3002}..."
exec "$@"
