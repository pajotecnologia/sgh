# SGH — Procedimentos de Backup e Restauração

Este documento estabelece o protocolo operacional de backup, retenção e recuperação de desastres (Disaster Recovery) para a base de dados PostgreSQL do **SGH**.

---

## 1. Estratégia de Backup

O SGH utiliza uma política de backup em três níveis:
1. **Backup Diário Completo (Lógico)**: Dump consistente com `pg_dump` em formato customizado comprimido (`.dump`).
2. **Retenção Automatizada**:
   - Diários: Mantidos por 7 dias.
   - Semanais: Mantidos por 4 semanas.
   - Mensais: Mantidos por 12 meses.
3. **Criptografia de Backup**: Os arquivos gerados devem ser cifrados com GPG/AES antes do envio para armazenamento secundário externo (ex.: S3 / Cold Storage).

---

## 2. Comandos Operacionais

### 2.1 Realizar Backup Manual Imediato

```bash
# Definir variáveis de ambiente do PostgreSQL
export PGHOST="localhost"
export PGPORT="5432"
export PGDATABASE="sgh_db"
export PGUSER="postgres"
export PGPASSWORD="sua_senha"

# Executar dump lógico consistente com compressão
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
pg_dump -Fc -b -v -f "/var/backups/sgh/sgh_backup_${TIMESTAMP}.dump"
```

### 2.2 Restaurar Backup a Partir de um Arquivo

```bash
# 1. Finalizar conexões ativas na base antes da restauração (se necessário)
psql -U postgres -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'sgh_db' AND pid <> pg_backend_pid();"

# 2. Restaurar o banco com pg_restore em modo limpo (--clean)
pg_restore -U postgres -d sgh_db -v --clean --no-owner --no-privileges "/var/backups/sgh/sgh_backup_ARQUIVO.dump"

# 3. Aplicar migrações pendentes do Prisma (se o dump for de versão anterior)
npx prisma migrate deploy
```

---

## 3. Script de Automação via Cron (`scripts/backup.sh`)

```bash
#!/bin/bash
set -e

BACKUP_DIR="/var/backups/sgh"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/sgh_${DATE}.dump"

mkdir -p "${BACKUP_DIR}"

echo "[$(date)] Iniciando backup do SGH..."
pg_dump -Fc -b -d "${DATABASE_URL}" -f "${BACKUP_FILE}"

# Remover backups com mais de 7 dias
find "${BACKUP_DIR}" -name "sgh_*.dump" -mtime +7 -exec rm {} \;

echo "[$(date)] Backup concluído com sucesso: ${BACKUP_FILE}"
```

---

## 4. Teste Periódico de Recuperação (DR Drill)

Recomenda-se executar trimestralmente uma simulação de restauração em ambiente isolado (staging) para validar:
1. Integridade do arquivo de backup (ausência de corrupção).
2. Tempo de recuperação objetivo (**RTO** < 30 minutos).
3. Ponto de recuperação objetivo (**RPO** < 24 horas).
4. Integridade da chave de criptografia de dados (`NEXTAUTH_SECRET` / `ENCRYPTION_KEY`).
