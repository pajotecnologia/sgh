#!/bin/sh
set -e

# Executa migrações automáticas do banco se DATABASE_URL estiver presente
if [ -n "$DATABASE_URL" ] && [ "$DATABASE_URL" != "postgresql://dummy:dummy@localhost:5432/dummy" ]; then
  echo "=> SGH: Aplicando migrações do banco de dados PostgreSQL..."
  npx prisma migrate deploy 2>/dev/null || echo "=> SGH: Migrações verificadas/puladas."
fi

echo "=> SGH: Iniciando servidor na porta ${PORT:-3002}..."
exec "$@"
