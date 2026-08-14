#!/usr/bin/env bash
# ==============================================================================
# Script de Atualização Automatizada de Produção — SGH (sgh.pajotech.com.br)
# ==============================================================================

set -e

# Cores para exibição de logs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

PM2_APP_NAME="sgh.pajotech.com.br"

echo -e "${BLUE}======================================================================${NC}"
echo -e "${BLUE}     Iniciando Atualização em Produção: ${PM2_APP_NAME}${NC}"
echo -e "${BLUE}======================================================================${NC}"

# 1. Obter últimas alterações do repositório Git
echo -e "\n${YELLOW}[1/5] Atualizando código do repositório Git (origin/main)...${NC}"
git pull origin main

# 2. Instalar / Sincronizar dependências
echo -e "\n${YELLOW}[2/5] Instalando dependências...${NC}"
npm install --registry=https://registry.npmjs.org/

# 3. Aplicar migrações do banco de dados PostgreSQL
echo -e "\n${YELLOW}[3/5] Aplicando migrações do banco de dados (Prisma Migrate Deploy)...${NC}"
npm run db:migrate:deploy || npm run db:migrate:baseline

# 4. Executar build da aplicação e gerar pacote de release
echo -e "\n${YELLOW}[4/5] Compilando aplicação Next.js (npm run build:release)...${NC}"
npm run build:release

# 5. Recarregar o serviço no PM2
echo -e "\n${YELLOW}[5/5] Recarregando processo PM2 (${PM2_APP_NAME})...${NC}"
if command -v pm2 &> /dev/null; then
    pm2 reload "${PM2_APP_NAME}" || pm2 restart "${PM2_APP_NAME}"
    echo -e "\n${GREEN}Status do PM2:${NC}"
    pm2 status "${PM2_APP_NAME}"
else
    echo -e "${YELLOW}PM2 não detectado no PATH global. Tentando npx pm2...${NC}"
    npx pm2 reload "${PM2_APP_NAME}" || npx pm2 restart "${PM2_APP_NAME}"
fi

echo -e "\n${GREEN}======================================================================${NC}"
echo -e "${GREEN}  ✓ Sistema SGH (sgh.pajotech.com.br) atualizado com sucesso!${NC}"
echo -e "${GREEN}======================================================================${NC}"
