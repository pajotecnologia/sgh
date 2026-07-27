#!/usr/bin/env bash
# =============================================================================
# SGH — ATUALIZACAO de uma instalacao JA EXISTENTE na VPS
#
# Use este script quando o sistema JA esta a correr e voce quer:
#   - Enviar a nova versao da aplicacao (.next, server.js, node_modules)
#   - Atualizar o banco com as tabelas/colunas novas (sem perder dados)
#
# O que ele faz, nesta ordem:
#   1. Verifica que .env existe (NAO o sobrescreve)
#   2. Faz BACKUP do banco (pg_dump) antes de qualquer alteracao
#   3. Aplica database/sgh_update_schema.sql (idempotente — so cria o que falta)
#   4. Reinicia o servico (PM2 ou systemd)
#
# NAO apaga uploads/. NAO apaga .env. NAO remove tabelas nem colunas.
#
# Uso:
#   cd /www/wwwroot/sgh.pajotech.com.br
#   chmod +x atualizar.sh && ./atualizar.sh
# =============================================================================

set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
ENV_FILE="$ROOT/.env"
SQL_UPDATE="$ROOT/database/sgh_update_schema.sql"
SQL_CONSTRAINTS="$ROOT/database/sgh_update_constraints.sql"
BACKUP_DIR="$ROOT/backups"
STAMP="$(date +%Y%m%d_%H%M%S)"

echo "=============================================="
echo "  SGH — Atualizacao (banco + aplicacao)"
echo "  Pasta: $ROOT"
echo "=============================================="

# --- Pre-requisitos -----------------------------------------------------------
if [ ! -f "$ENV_FILE" ]; then
  echo "ERRO: .env nao encontrado em $ROOT"
  echo "      Esta pasta parece uma instalacao nova — use ./instalar.sh."
  exit 1
fi

if [ ! -f "$ROOT/server.js" ] || [ ! -f "$ROOT/index.js" ]; then
  echo "ERRO: server.js / index.js nao encontrados. Copiou o pacote completo para esta pasta?"
  exit 1
fi

# Carrega DATABASE_URL do .env (sem exportar tudo)
DATABASE_URL="$(grep -E '^DATABASE_URL=' "$ENV_FILE" | head -1 | cut -d= -f2- | sed 's/^"//; s/"$//; s/\r$//')"
if [ -z "${DATABASE_URL:-}" ] || echo "$DATABASE_URL" | grep -q 'SUA_SENHA_AQUI'; then
  echo "ERRO: DATABASE_URL nao configurado no .env."
  exit 1
fi

if ! command -v psql >/dev/null 2>&1; then
  echo "ERRO: psql nao encontrado. Instale o cliente PostgreSQL:"
  echo "      Ubuntu/Debian: sudo apt install -y postgresql-client"
  exit 1
fi

# --- 1. Backup do banco -------------------------------------------------------
mkdir -p "$BACKUP_DIR"
BACKUP_FILE="$BACKUP_DIR/sgh_db_$STAMP.sql"
echo ""
echo "[1/3] Backup do banco -> $BACKUP_FILE"
if command -v pg_dump >/dev/null 2>&1; then
  if pg_dump "$DATABASE_URL" -F p -f "$BACKUP_FILE" 2>/dev/null; then
    echo "      OK: backup criado ($(du -h "$BACKUP_FILE" | cut -f1))."
  else
    echo "      AVISO: pg_dump falhou. Continuar mesmo assim? [s/N]"
    read -r RESP
    [ "${RESP:-N}" = "s" ] || { echo "Abortado pelo usuario."; exit 1; }
  fi
else
  echo "      AVISO: pg_dump ausente — pulando backup automatico."
  echo "      Recomendado fazer backup manual antes de continuar. Continuar? [s/N]"
  read -r RESP
  [ "${RESP:-N}" = "s" ] || { echo "Abortado pelo usuario."; exit 1; }
fi

# --- 2. Atualizacao do schema (idempotente, transacional) --------------------
echo ""
echo "[2/3] Aplicando atualizacao de schema (idempotente)..."
for f in "$SQL_UPDATE" "$SQL_CONSTRAINTS"; do
  if [ ! -f "$f" ]; then
    echo "      ERRO: $f nao encontrado no pacote."
    exit 1
  fi
done

# --single-transaction: ou tudo aplica, ou nada muda no banco.
if psql "$DATABASE_URL" -v ON_ERROR_STOP=1 --single-transaction \
     -f "$SQL_UPDATE" -f "$SQL_CONSTRAINTS"; then
  echo "      OK: schema e constraints atualizados."
else
  echo ""
  echo "      ERRO ao aplicar o schema. Como foi executado numa unica transacao,"
  echo "      o banco permaneceu no estado anterior (rollback automatico)."
  echo "      Backup disponivel em: $BACKUP_FILE"
  exit 1
fi

# --- 3. Reiniciar o servico ---------------------------------------------------
echo ""
echo "[3/3] Reiniciando o servico..."
RESTARTED=0

if command -v pm2 >/dev/null 2>&1; then
  cd "$ROOT"
  if pm2 describe sgh >/dev/null 2>&1; then
    pm2 restart sgh --update-env
  else
    pm2 start ecosystem.config.cjs
  fi
  pm2 save
  echo "      OK: PM2 reiniciado.  (pm2 logs sgh)"
  RESTARTED=1
fi

if [ "$RESTARTED" -eq 0 ] && command -v systemctl >/dev/null 2>&1 && [ "$(id -u)" -eq 0 ]; then
  systemctl restart sgh && echo "      OK: systemd (sgh.service) reiniciado."
  RESTARTED=1
fi

if [ "$RESTARTED" -eq 0 ]; then
  echo "      AVISO: nem PM2 nem systemd disponiveis para reinicio automatico."
  echo "      Reinicie o processo Node manualmente (ou pelo painel aaPanel)."
fi

echo ""
echo "=============================================="
echo "  Atualizacao concluida."
echo "  Backup do banco: $BACKUP_FILE"
echo "  Verifique:  ./verificar.sh"
echo "=============================================="
