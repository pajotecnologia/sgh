/**
 * Garante que o PostgreSQL esteja disponível antes de `npm run dev`.
 * 1) Testa conexão usando DATABASE_URL do .env
 * 2) Se falhar, tenta `docker compose up -d` (serviço `db`), se o Docker existir
 * 3) Re-tenta até ~60 s
 *
 * Para pular (CI sem banco ou só frontend): SKIP_DATABASE_ENSURE=1
 */
import 'dotenv/config';
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

async function main() {
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

Verifique DATABASE_URL no .env. Padrão com Docker Compose (este repositório):
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
