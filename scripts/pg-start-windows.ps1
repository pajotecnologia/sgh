# Inicia PostgreSQL portatil do SGH (padrao: 127.0.0.1:5433).
#
# Como executar (escolha uma):
#   1) Na raiz do projeto (pasta que contem "scripts"):
#      powershell -ExecutionPolicy Bypass -File .\scripts\pg-start-windows.ps1
#   2) De qualquer pasta, com caminho completo:
#      powershell -ExecutionPolicy Bypass -File "C:\caminho\para\sgh\scripts\pg-start-windows.ps1"
#
# Opcional (antes de rodar): defina onde estao os binarios e os dados do cluster:
#   $env:PGROOT  = "C:\Users\SEUUSER\PostgreSQL\pgsql"
#   $env:PGDATA  = "C:\Users\SEUUSER\PostgreSQL\sgh-data-16"

$ErrorActionPreference = 'Stop'

function Find-PgCtl {
    if ($env:PGROOT) {
        $p = Join-Path $env:PGROOT 'bin\pg_ctl.exe'
        if (Test-Path -LiteralPath $p) { return $p }
    }
    $base = Join-Path $env:USERPROFILE 'PostgreSQL'
    $direct = Join-Path $base 'pgsql\bin\pg_ctl.exe'
    if (Test-Path -LiteralPath $direct) { return $direct }

    if (Test-Path -LiteralPath $base) {
        $hit = Get-ChildItem -LiteralPath $base -Recurse -Filter 'pg_ctl.exe' -ErrorAction SilentlyContinue |
            Select-Object -First 1 -ExpandProperty FullName
        if ($hit) { return $hit }
    }

    $pf = @(
        'C:\Program Files\PostgreSQL\16\bin\pg_ctl.exe'
        'C:\Program Files\PostgreSQL\17\bin\pg_ctl.exe'
        'C:\Program Files\PostgreSQL\18\bin\pg_ctl.exe'
    )
    foreach ($p in $pf) {
        if (Test-Path -LiteralPath $p) { return $p }
    }
    return $null
}

function Find-Or-Default-PgData {
    if ($env:PGDATA) {
        if (Test-Path -LiteralPath (Join-Path $env:PGDATA 'PG_VERSION')) { return $env:PGDATA }
        Write-Host "PGDATA definido mas sem PG_VERSION: $env:PGDATA" -ForegroundColor Yellow
    }
    $def = Join-Path $env:USERPROFILE 'PostgreSQL\sgh-data-16'
    if (Test-Path -LiteralPath (Join-Path $def 'PG_VERSION')) { return $def }

    $base = Join-Path $env:USERPROFILE 'PostgreSQL'
    if (Test-Path -LiteralPath $base) {
        $hit = Get-ChildItem -LiteralPath $base -Recurse -Filter 'PG_VERSION' -ErrorAction SilentlyContinue |
            Select-Object -First 1 -ExpandProperty DirectoryName
        if ($hit) { return $hit }
    }

    foreach ($ver in @('16', '17', '18')) {
        $data = "C:\Program Files\PostgreSQL\$ver\data"
        if (Test-Path -LiteralPath (Join-Path $data 'PG_VERSION')) { return $data }
    }
    return $null
}

$pgCtl = Find-PgCtl
if (-not $pgCtl) {
    Write-Host ""
    Write-Host "Nao encontrei pg_ctl.exe." -ForegroundColor Red
    Write-Host ""
    Write-Host "Opcao A — Binarios portateis (recomendado para o SGH na porta 5433):" -ForegroundColor Cyan
    Write-Host "  1. Baixe o ZIP: https://get.enterprisedb.com/postgresql/postgresql-16.13-1-windows-x64-binaries.zip"
    Write-Host "  2. Crie a pasta: $([IO.Path]::Combine($env:USERPROFILE, 'PostgreSQL'))"
    Write-Host "  3. Extraia com (PowerShell na pasta PostgreSQL):"
    Write-Host "     tar -xf `"$env:USERPROFILE\PostgreSQL\postgresql-16-binaries.zip`" -C `"$env:USERPROFILE\PostgreSQL`""
    Write-Host "  (deve existir a pasta pgsql\bin\pg_ctl.exe)"
    Write-Host ""
    Write-Host "Opcao B — Definir manualmente:" -ForegroundColor Cyan
    Write-Host '  $env:PGROOT = "C:\caminho\para\pgsql"'
    Write-Host '  $env:PGDATA = "C:\caminho\para\seu\PGDATA"'
    Write-Host "  Depois execute este script de novo."
    Write-Host ""
    exit 1
}

$pgData = Find-Or-Default-PgData
if (-not $pgData) {
    Write-Host ""
    Write-Host "Nao encontrei cluster inicializado (arquivo PG_VERSION)." -ForegroundColor Red
    Write-Host "Diretorio esperado: $([IO.Path]::Combine($env:USERPROFILE, 'PostgreSQL\sgh-data-16'))"
    Write-Host ""
    Write-Host "Crie o cluster (ajuste a senha no arquivo temporario se quiser):" -ForegroundColor Yellow
    $bin = Split-Path -Parent $pgCtl
    Write-Host "  `$pw = Join-Path `$env:TEMP 'pg-pass.txt'; Set-Content `$pw 'senha' -NoNewline -Encoding ascii"
    Write-Host "  & `"$bin\initdb.exe`" -D `"$([IO.Path]::Combine($env:USERPROFILE, 'PostgreSQL\sgh-data-16'))`" -U postgres -E UTF8 -A scram-sha-256 --pwfile=`$pw"
    Write-Host ""
    exit 1
}

# Instalacao EDB em Program Files costuma usar porta 5432 e ja vem como servico — nao passar -o nesse caso
$isPortableLike = $pgData -like "*$([IO.Path]::Combine($env:USERPROFILE, 'PostgreSQL'))*" -or $env:FORCE_PG_PORT533 -eq '1'

$extraArgs = @()
if ($isPortableLike -or $env:PG_PORT) {
    $port = if ($env:PG_PORT) { $env:PG_PORT } else { '5433' }
    Write-Host "Usando pg_ctl : $pgCtl"
    Write-Host "Usando PGDATA : $pgData"
    Write-Host "Porta/host    : ${port} / 127.0.0.1"
    $extraArgs = @('-o', "-p $port -h 127.0.0.1")
} else {
    Write-Host "Usando PostgreSQL instalado (Program Files)." -ForegroundColor Cyan
    Write-Host "  pg_ctl: $pgCtl"
    Write-Host "  PGDATA: $pgData"
    Write-Host "  Se o servico ja estiver ativo (porta 5432), nada sera alterado." -ForegroundColor Gray
}

$status = & $pgCtl -D $pgData status 2>&1 | Out-String
if ($status -match 'nenhum servidor|no server running|not running') {
    Write-Host 'Iniciando servidor...'
    $logFile = Join-Path $pgData 'postgresql.log'
    if ($extraArgs.Count -gt 0) {
        & $pgCtl -D $pgData -l $logFile start @extraArgs
    } else {
        & $pgCtl -D $pgData -l $logFile start
    }
} else {
    Write-Host $status.Trim()
}

$binDir = Split-Path -Parent $pgCtl
$portCheck = if ($env:PG_PORT) { $env:PG_PORT } elseif ($isPortableLike) { '5433' } else { '5432' }
& (Join-Path $binDir 'pg_isready.exe') -h 127.0.0.1 -p $portCheck 2>$null | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "PostgreSQL respondeu em 127.0.0.1:${portCheck}." -ForegroundColor Green
} else {
    Write-Host "Aviso: pg_isready nao confirmou 127.0.0.1:${portCheck}. Veja o log: $(Join-Path $pgData 'postgresql.log')" -ForegroundColor Yellow
}
