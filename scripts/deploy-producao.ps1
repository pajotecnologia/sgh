# ==============================================================================
# Script PowerShell de Atualização Automatizada de Produção — SGH (sgh.pajotech.com.br)
# ==============================================================================

$ErrorActionPreference = "Stop"

$Pm2AppName = "sgh.pajotech.com.br"

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "     Iniciando Atualização em Produção: $Pm2AppName" -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan

# 1. Pull Git
Write-Host "`n[1/5] Atualizando código do repositório Git (origin/main)..." -ForegroundColor Yellow
git pull origin main

# 2. npm ci
Write-Host "`n[2/5] Instalando dependências (npm ci)..." -ForegroundColor Yellow
npm ci

# 3. Prisma Migrate Deploy & Generate
Write-Host "`n[3/5] Aplicando migrações do banco de dados e gerando Prisma Client..." -ForegroundColor Yellow
npm run db:migrate:deploy
npm run db:generate

# 4. Build
Write-Host "`n[4/5] Compilando aplicação Next.js (npm run build:release)..." -ForegroundColor Yellow
npm run build:release

# 5. PM2 Reload
Write-Host "`n[5/5] Recarregando processo PM2 ($Pm2AppName)..." -ForegroundColor Yellow
try {
    pm2 reload $Pm2AppName
} catch {
    Write-Host "Falha no reload, tentando restart..." -ForegroundColor Warning
    pm2 restart $Pm2AppName
}

Write-Host "`n======================================================================" -ForegroundColor Green
Write-Host "  ✓ Sistema SGH ($Pm2AppName) atualizado com sucesso!" -ForegroundColor Green
Write-Host "======================================================================" -ForegroundColor Green
