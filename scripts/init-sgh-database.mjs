/**
 * Bootstrap do PostgreSQL para o SGH:
 * 1) Garante o database (nome vindo da DATABASE_URL)
 * 2) npm run db:push (schema Prisma)
 * 3) Concede privilégios no schema public ao usuário da URL (uso típico: postgres superuser / app)
 * 4) npm run db:seed
 *
 * Pré-requisito: servidor PostgreSQL em pé e DATABASE_URL válida no .env
 */
import 'dotenv/config';
import { spawnSync } from 'node:child_process';
import pg from 'pg';

function parseUrl(cs) {
  if (!cs) return null;
  const normalized = cs.replace(/^postgres(ql)?:\/\//, 'http://');
  const u = new URL(normalized);
  const database = decodeURIComponent(u.pathname.replace(/^\//, '') || 'postgres');
  return {
    user: decodeURIComponent(u.username || 'postgres'),
    password: decodeURIComponent(u.password || ''),
    host: u.hostname || '127.0.0.1',
    port: Number(u.port || 5432),
    database,
  };
}

function buildConn(p, dbName) {
  const u = new URL('http://x');
  u.username = encodeURIComponent(p.user);
  u.password = encodeURIComponent(p.password);
  u.hostname = p.host;
  u.port = String(p.port);
  u.pathname = `/${encodeURIComponent(dbName)}`;
  return `postgresql://${u.username}:${u.password}@${u.hostname}:${u.port}${u.pathname}`;
}

async function main() {
  const cs = process.env.DATABASE_URL;
  const p = parseUrl(cs);
  if (!p) {
    console.error('Defina DATABASE_URL no .env.');
    process.exit(1);
  }

  const adminUrl = buildConn(p, 'postgres');

  console.log('[init] Verificando / criando database:', p.database);
  const admin = new pg.Client({ connectionString: adminUrl, connectionTimeoutMillis: 15_000 });
  await admin.connect();

  const { rows } = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [p.database]);
  if (rows.length === 0) {
    const safeDb = `"${String(p.database).replace(/"/g, '""')}"`;
    const safeOwner = `"${String(p.user).replace(/"/g, '""')}"`;
    await admin.query(`CREATE DATABASE ${safeDb} OWNER ${safeOwner} ENCODING 'UTF8'`);
    console.log('[init] Database criado:', p.database);
  } else {
    console.log('[init] Database já existe:', p.database);
  }
  await admin.end();

  console.log('[init] Aplicando schema (db:push)...');
  const push = spawnSync(process.execPath, ['scripts/run-prisma.mjs', 'db', 'push'], {
    cwd: process.cwd(),
    stdio: 'inherit',
    env: process.env,
  });
  if (push.status !== 0) {
    console.error('[init] db:push falhou.');
    process.exit(push.status ?? 1);
  }

  const qi = (id) => pg.escapeIdentifier(id);
  console.log('[init] Privilégios em public (usuário', p.user + ')…');
  const app = new pg.Client({ connectionString: cs, connectionTimeoutMillis: 15_000 });
  await app.connect();
  await app.query(`GRANT CONNECT ON DATABASE ${qi(p.database)} TO ${qi(p.user)}`);
  await app.query(`GRANT USAGE, CREATE ON SCHEMA public TO ${qi(p.user)}`);
  await app.query(`GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ${qi(p.user)}`);
  await app.query(`GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ${qi(p.user)}`);
  await app.query(`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO ${qi(p.user)}`);
  await app.query(`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO ${qi(p.user)}`);
  await app.end();
  console.log('[init] Permissões aplicadas.');

  console.log('[init] Usuários de acesso ao sistema (db:seed)...');
  const seed = spawnSync(process.execPath, ['scripts/run-tsx.mjs', 'prisma/seed.ts'], {
    cwd: process.cwd(),
    stdio: 'inherit',
    env: process.env,
  });
  process.exit(seed.status === null ? 1 : seed.status);
}

main().catch((err) => {
  console.error('[init]', err.message);
  console.error(`
O servidor PostgreSQL nao esta acessivel com a DATABASE_URL do .env.
1) Docker: npm run db:compose:up
2) Ou inicie seu Postgres manualmente e confira host/porta/senha.
`);
  process.exit(1);
});
