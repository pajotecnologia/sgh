#!/usr/bin/env bash
# Diagnóstico SGH — 404 nginx / site não abre
set -uo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
PORT="${PORT:-3002}"

echo "=============================================="
echo "  SGH — Diagnóstico"
echo "  Pasta: $ROOT"
echo "=============================================="
echo ""

ok() { echo "  [OK] $1"; }
fail() { echo "  [FALHA] $1"; }
warn() { echo "  [AVISO] $1"; }

# Ficheiros
for f in index.js server.js index.html .next package.json; do
  if [ -e "$ROOT/$f" ]; then ok "$f existe"
  else fail "$f NÃO encontrado — copie o instalador completo para esta pasta"; fi
done

if [ -f "$ROOT/.env" ]; then ok ".env existe"
else warn ".env ausente — copie: cp .env.example .env"; fi

echo ""
echo "--- Node.js ---"
if command -v node >/dev/null 2>&1; then
  ok "Node $(node -v)"
else
  fail "Node.js não instalado"
fi

echo ""
echo "--- PM2 / processo na porta $PORT ---"
if command -v pm2 >/dev/null 2>&1; then
  pm2 list 2>/dev/null | grep -E "sgh|online|stopped" || warn "PM2: projeto 'sgh' não listado — execute ./instalar.sh"
else
  warn "PM2 não instalado (aaPanel → App Store → PM2 Manager)"
fi

if command -v ss >/dev/null 2>&1; then
  ss -tlnp 2>/dev/null | grep ":$PORT " && ok "Porta $PORT em escuta" || fail "Nada escuta na porta $PORT — Node NÃO está a correr"
elif command -v netstat >/dev/null 2>&1; then
  netstat -tlnp 2>/dev/null | grep ":$PORT " && ok "Porta $PORT em escuta" || fail "Nada escuta na porta $PORT"
fi

echo ""
echo "--- Teste HTTP local (Node) ---"
if command -v curl >/dev/null 2>&1; then
  CODE="$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:$PORT/login" 2>/dev/null || echo '000')"
  if [ "$CODE" = "200" ] || [ "$CODE" = "307" ] || [ "$CODE" = "308" ]; then
    ok "http://127.0.0.1:$PORT/login → HTTP $CODE (Node OK)"
  else
    fail "http://127.0.0.1:$PORT/login → HTTP $CODE"
    echo "       Inicie: cd $ROOT && pm2 start ecosystem.config.cjs"
    echo "       Ou:     cd $ROOT && ./instalar.sh"
  fi
else
  warn "curl não disponível para teste"
fi

if [ -d "$ROOT/.next/static/chunks" ]; then
  CHUNK_COUNT="$(find "$ROOT/.next/static/chunks" -name '*.js' 2>/dev/null | wc -l | tr -d ' ')"
  if [ "${CHUNK_COUNT:-0}" -gt 0 ]; then ok ".next/static/chunks ($CHUNK_COUNT ficheiros JS)"
  else fail ".next/static/chunks vazio — refaça npm run build:instalador e copie a pasta completa"; fi
else
  fail ".next/static/chunks ausente — deploy incompleto (faltou copiar .next/static)"
fi

if [ -f "$ROOT/.next/BUILD_ID" ]; then ok "BUILD_ID: $(cat "$ROOT/.next/BUILD_ID")"
else warn ".next/BUILD_ID ausente — pode ser build antigo ou pasta .next incompleta"; fi

echo ""
echo "--- Modo de execução (NÃO use 'npm run dev' em produção) ---"
if command -v pm2 >/dev/null 2>&1; then
  PM2_SCRIPT="$(pm2 jlist 2>/dev/null | grep -o '"pm_exec_path":"[^"]*"' | head -1 || true)"
  if echo "$PM2_SCRIPT" | grep -qiE 'next/dist/bin/next|npm|dev'; then
    fail "PM2 parece estar em modo DEV — use index.js (produção): pm2 delete sgh && pm2 start ecosystem.config.cjs"
  elif [ -n "$PM2_SCRIPT" ]; then
    ok "PM2 script: ${PM2_SCRIPT#*\"}"
  fi
fi

echo ""
echo "--- Manifest e chunks (causa comum: nginx sem proxy ou build errado) ---"
if command -v curl >/dev/null 2>&1; then
  MANIFEST_BODY="$(curl -s "http://127.0.0.1:$PORT/manifest.webmanifest" 2>/dev/null | head -c 80 || true)"
  if echo "$MANIFEST_BODY" | grep -q '^{'; then
    ok "/manifest.webmanifest → JSON válido"
  else
    fail "/manifest.webmanifest não retorna JSON (provável HTML/404 do nginx)"
    echo "       Resposta: ${MANIFEST_BODY:0:60}..."
  fi

  # Primeiro chunk .js em disco — testar se o Node o serve
  SAMPLE_CHUNK="$(find "$ROOT/.next/static/chunks" -name '*.js' 2>/dev/null | head -1)"
  if [ -n "$SAMPLE_CHUNK" ] && [ -f "$SAMPLE_CHUNK" ]; then
    REL="${SAMPLE_CHUNK#*$ROOT/.next/}"
    CHUNK_CODE="$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:$PORT/_next/static/$REL" 2>/dev/null || echo '000')"
    CHUNK_TYPE="$(curl -sI "http://127.0.0.1:$PORT/_next/static/$REL" 2>/dev/null | grep -i '^content-type:' | tr -d '\r' || true)"
    if [ "$CHUNK_CODE" = "200" ] && echo "$CHUNK_TYPE" | grep -qi 'javascript'; then
      ok "/_next/static/... → HTTP 200 (JavaScript)"
    else
      fail "/_next/static/... → HTTP $CHUNK_CODE ($CHUNK_TYPE)"
      echo "       Chunk testado: _next/static/$REL"
    fi
  fi
else
  warn "curl não disponível para testar manifest/chunks"
fi

echo ""
echo "=============================================="
echo "  Erros no browser (Manifest syntax / ChunkLoadError / MIME text/plain):"
echo "  → Quase sempre: PM2 em 'npm run dev' OU pasta .next/static incompleta"
echo "  → Solução: npm run build:instalador (local), enviar instalador/ inteiro,"
echo "             pm2 delete sgh && pm2 start ecosystem.config.cjs"
echo ""
echo "  Se Node responde localmente mas o site dá 404:"
echo "  → Nginx NÃO está a fazer proxy para :$PORT"
echo ""
echo "  aaPanel: Website → sgh.pajotech.com.br"
echo "           → Reverse proxy → http://127.0.0.1:$PORT"
echo ""
echo "  Ver ficheiro: nginx-aapanel-CORRIGIR-404.conf"
echo "=============================================="
