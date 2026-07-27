#!/usr/bin/env bash
# SGH — Configura .env, banco (opcional) e inicia o serviço automaticamente (PM2 ou systemd)
# Uso: cd /www/wwwroot/sgh.pajotech.com.br && chmod +x instalar.sh && ./instalar.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
ENV_FILE="$ROOT/.env"
ENV_EXAMPLE="$ROOT/.env.example"
SQL_SCHEMA="$ROOT/database/sgh_schema_completo.sql"
SQL_SEED="$ROOT/database/seed_usuarios_iniciais.sql"
UPLOADS_DIR="$ROOT/uploads"

echo "=============================================="
echo "  SGH — Instalador automático"
echo "  Pasta: $ROOT"
echo "=============================================="

if ! command -v node >/dev/null 2>&1; then
  echo "ERRO: Node.js não encontrado. Instale Node.js 20 ou 22 (aaPanel → App Store → Node)."
  exit 1
fi

if [ ! -f "$ROOT/index.js" ] || [ ! -f "$ROOT/server.js" ]; then
  echo "ERRO: Ficheiros index.js / server.js não encontrados nesta pasta."
  exit 1
fi

# --- .env ---
if [ ! -f "$ENV_FILE" ]; then
  cp "$ENV_EXAMPLE" "$ENV_FILE"
  echo "OK: criado .env — edite DATABASE_URL e NEXTAUTH_URL se ainda não configurou."
fi

gen_secret() {
  if command -v openssl >/dev/null 2>&1; then openssl rand -base64 32 | tr -d '\n'
  else node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"; fi
}

gen_hex() {
  if command -v openssl >/dev/null 2>&1; then openssl rand -hex 32 | tr -d '\n'
  else node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"; fi
}

if grep -qE 'NEXTAUTH_SECRET=""|^NEXTAUTH_SECRET=$' "$ENV_FILE"; then
  SEC="$(gen_secret)"
  sed -i.bak "s|^NEXTAUTH_SECRET=.*|NEXTAUTH_SECRET=\"$SEC\"|" "$ENV_FILE" && rm -f "$ENV_FILE.bak"
  echo "OK: NEXTAUTH_SECRET gerado."
fi

if grep -qE 'ENCRYPTION_KEY=""|^ENCRYPTION_KEY=$' "$ENV_FILE"; then
  HEX="$(gen_hex)"
  sed -i.bak "s|^ENCRYPTION_KEY=.*|ENCRYPTION_KEY=\"$HEX\"|" "$ENV_FILE" && rm -f "$ENV_FILE.bak"
  echo "OK: ENCRYPTION_KEY gerado."
fi

if grep -q 'SUA_SENHA_AQUI' "$ENV_FILE"; then
  echo ""
  echo "AVISO: Edite .env e defina DATABASE_URL antes de usar o sistema."
  echo '  Ex.: DATABASE_URL="postgresql://sgh_user:senha@127.0.0.1:5432/sgh_db"'
  echo ""
fi

mkdir -p "$UPLOADS_DIR"
echo "OK: pasta uploads/"

# --- Banco (opcional, silencioso se psql ausente) ---
if command -v psql >/dev/null 2>&1 && [ -f "$SQL_SCHEMA" ] && ! grep -q 'SUA_SENHA_AQUI' "$ENV_FILE"; then
  set -a
  # shellcheck disable=SC1090
  source <(grep -E '^[A-Z_]+=' "$ENV_FILE" | sed 's/\r$//')
  set +a
  if [ -n "${DATABASE_URL:-}" ]; then
    if ! psql "$DATABASE_URL" -c "SELECT 1 FROM usuarios LIMIT 1" >/dev/null 2>&1; then
      echo "Importando schema PostgreSQL..."
      psql "$DATABASE_URL" -f "$SQL_SCHEMA" && echo "OK: schema importado."
      if [ -f "$SQL_SEED" ]; then
        psql "$DATABASE_URL" -f "$SQL_SEED" && echo "OK: usuários iniciais (admin@hospital.com / Sgh@2024!)."
      fi
    else
      echo "INFO: banco já possui tabelas — schema não reimportado."
    fi
  fi
fi

# --- Iniciar serviço automaticamente ---
STARTED=0

if command -v pm2 >/dev/null 2>&1; then
  cd "$ROOT"
  pm2 delete sgh 2>/dev/null || true
  pm2 start ecosystem.config.cjs
  pm2 save
  echo "OK: SGH iniciado com PM2 (reinicia automaticamente)."
  echo "    Comandos: pm2 status | pm2 logs sgh | pm2 restart sgh"
  STARTED=1
fi

if [ "$STARTED" -eq 0 ] && command -v systemctl >/dev/null 2>&1 && [ "$(id -u)" -eq 0 ]; then
  SERVICE="/etc/systemd/system/sgh.service"
  sed "s|/www/wwwroot/sgh.pajotech.com.br|$ROOT|g" "$ROOT/sgh.service.example" > "$SERVICE"
  systemctl daemon-reload
  systemctl enable sgh
  systemctl restart sgh
  echo "OK: SGH iniciado com systemd (sgh.service)."
  STARTED=1
fi

if [ "$STARTED" -eq 0 ]; then
  echo ""
  echo "Configure no aaPanel (uma vez):"
  echo "  Site → Node → Projeto Node → pasta: $ROOT"
  echo "  Ficheiro de arranque: index.js   Porta: 3000"
  echo "  Proxy reverso: http://127.0.0.1:3000  (ver nginx.example.conf)"
  echo ""
  echo "Ou instale PM2: npm i -g pm2 && ./instalar.sh"
fi

echo ""
echo "=============================================="
echo "  Acesso: https://seu-dominio/login"
echo "  index.html redireciona para /login"
echo "=============================================="
echo ""
