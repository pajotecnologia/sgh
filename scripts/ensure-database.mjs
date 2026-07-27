/**
 * Garante que o PostgreSQL esteja disponível antes de `npm run dev`.
 * 1) Testa conexão usando DATABASE_URL do .env
 * 2) Se falhar, tenta `docker compose up -d` (serviço `db`), se o Docker existir
 * 3) Re-tenta até ~60 s
 *
 * Para pular (CI sem banco ou só frontend): SKIP_DATABASE_ENSURE=1
 */
import './load-env.mjs';
import { spawnSync } from 'node:child_process';
import pg from 'pg';

const SKIP = process.env.SKIP_DATABASE_ENSURE === '1';
const MAX_ATTEMPTS = 35;
const SLEEP_MS = 2000;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function pingDb() {
  const url = process.env.DATABASE_URL;
  if (!url || url.includes('usuario:senha')) {
    console.error('[db] Defina DATABASE_URL no arquivo .env (veja .env.example).');
    return false;
  }
  const client = new pg.Client({
    connectionString: url,
    connectionTimeoutMillis: 4000,
  });
  try {
    await client.connect();
    await client.query('SELECT 1 AS ok');
    await client.end();
    return true;
  } catch {
    try {
      await client.end();
    } catch {
      /* ignore */
    }
    return false;
  }
}

function dockerAvailable() {
  const exe = process.platform === 'win32' ? 'docker.exe' : 'docker';
  const r = spawnSync(exe, ['version'], { encoding: 'utf8', shell: process.platform === 'win32' });
  return r.status === 0;
}

function composeUp() {
  const exe = process.platform === 'win32' ? 'docker.exe' : 'docker';
  console.warn('[db] PostgreSQL não respondeu. Tentando subir Docker (`docker compose up -d`)...');
  const r = spawnSync(exe, ['compose', 'up', '-d', 'db'], {
    cwd: process.cwd(),
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  return r.status === 0;
}

function envObrigatorioOk() {
  const secret = process.env.NEXTAUTH_SECRET?.trim() ?? '';
  const key = process.env.ENCRYPTION_KEY?.trim() ?? '';
  const secretOk =
    secret.length >= 16 && !secret.includes('sua-chave-secreta');
  const keyOk = /^[0-9a-fA-F]{64}$/.test(key);
  return { secretOk, keyOk };
}

async function main() {
  const { secretOk, keyOk } = envObrigatorioOk();
  if (!secretOk || !keyOk) {
    console.warn(`
[env] Variáveis obrigatórias ausentes ou inválidas no .env:
  NEXTAUTH_SECRET ${secretOk ? 'OK' : 'FALTANDO (login falha com error=Configuration)'}
  ENCRYPTION_KEY  ${keyOk ? 'OK' : 'FALTANDO (64 caracteres hex)'}

Copie de .env.example ou gere:
  openssl rand -base64 32   → NEXTAUTH_SECRET
  openssl rand -hex 32      → ENCRYPTION_KEY
`);
  }
  if (SKIP) {
    console.log('[db] SKIP_DATABASE_ENSURE=1 — verificação ignorada.');
    process.exit(0);
  }

  if (await pingDb()) {
    console.log('[db] Conexão com PostgreSQL OK.');
    process.exit(0);
  }

  if (dockerAvailable()) {
    if (composeUp()) {
      for (let i = 1; i <= MAX_ATTEMPTS; i++) {
        console.log(`[db] Aguardando PostgreSQL (tentativa ${i}/${MAX_ATTEMPTS})...`);
        await sleep(SLEEP_MS);
        if (await pingDb()) {
          console.log('[db] Conexão com PostgreSQL OK (via Docker Compose).');
          process.exit(0);
        }
      }
    }
  } else {
    console.warn('[db] Docker não encontrado no PATH.');
  }

  console.error(`
[db] Falha permanente ao conectar.

Host atual: ${(() => {
  try {
    const u = new URL(process.env.DATABASE_URL || '')
    return u.hostname + ':' + u.port + u.pathname
  } catch {
    return '(DATABASE_URL inválida)'
  }
})()}

Se o host for IP da VPS (ex.: 172.18.x.x), crie .env.local para desenvolvimento:
  DATABASE_URL="postgresql://postgres:senha@127.0.0.1:5432/sgh_db"
  NEXTAUTH_URL="http://localhost:3000"

Verifique DATABASE_URL. Padrão com Docker Compose (este repositório):
  postgresql://postgres:senha@127.0.0.1:5432/sgh_db

Passos típicos:
  1) npm run db:compose:up    (subir o container Postgres)
  2) npm run db:push          (criar/atualizar tabelas)
  3) npm run db:seed          (usuários iniciais; senha Sgh@2024!)

PostgreSQL só no Windows sem Docker:
  powershell -ExecutionPolicy Bypass -File .\\scripts\\pg-start-windows.ps1
  (ajuste DATABASE_URL conforme porta/senha do seu cluster.)

Para iniciar só o Next sem este bloqueio: SET SKIP_DATABASE_ENSURE=1 npm run dev
`);
  process.exit(1);
}

main().catch((e) => {
  console.error('[db]', e);
  process.exit(1);
});
