/**
 * Deploy seguro e resiliente das migrations Prisma em ambientes de produção.
 *
 * Garante que:
 * 1) As tabelas e colunas adicionais do schema existam de forma idempotente;
 * 2) O histórico de migrations (_prisma_migrations) seja sincronizado (baseline limpo);
 * 3) As migrações Prisma sejam validadas e aplicadas com sucesso.
 */
import './load-env.mjs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const prismaCli = resolve(process.cwd(), 'node_modules/prisma/build/index.js');
const env = process.env;

function runPrisma(args, options = {}) {
  const result = spawnSync(
    process.execPath,
    [prismaCli, ...args],
    {
      cwd: process.cwd(),
      env,
      encoding: 'utf8',
      stdio: options.capture ? ['ignore', 'pipe', 'pipe'] : 'inherit',
    },
  );

  if (options.capture) {
    return {
      status: result.status ?? 1,
      output: [result.stdout, result.stderr].filter(Boolean).join('\n'),
    };
  }

  return { status: result.status ?? 1, output: '' };
}

function fail(message, output = '') {
  console.error(message);
  if (output.trim()) console.error(output.trim());
  process.exit(1);
}

if (!env.DATABASE_URL) {
  fail('[migrate:deploy-safe] DATABASE_URL não está definida.');
}

console.log('[migrate:deploy-safe] 1/3 Sincronizando schema PostgreSQL de forma segura...');
const syncScript = spawnSync(
  process.execPath,
  [resolve(process.cwd(), 'scripts/sync-schema-vps.mjs')],
  {
    cwd: process.cwd(),
    env,
    stdio: 'inherit',
  },
);

if ((syncScript.status ?? 1) !== 0) {
  fail('[migrate:deploy-safe] Falha ao sincronizar schema do PostgreSQL.');
}

console.log('[migrate:deploy-safe] 2/3 Sincronizando histórico de migrações Prisma...');
const baselineScript = spawnSync(
  process.execPath,
  [resolve(process.cwd(), 'scripts/baseline-migrations.mjs')],
  {
    cwd: process.cwd(),
    env,
    stdio: 'inherit',
  },
);

if ((baselineScript.status ?? 1) !== 0) {
  fail('[migrate:deploy-safe] Falha ao sincronizar histórico de migrations Prisma.');
}

console.log('[migrate:deploy-safe] 3/3 Validando migrações com prisma migrate deploy...');
const deploy = runPrisma(['migrate', 'deploy'], { capture: true });
process.stdout.write(deploy.output);

if (deploy.status !== 0) {
  fail(
    '[migrate:deploy-safe] Prisma migrate deploy falhou após sincronização.',
    deploy.output
  );
}

console.log('[migrate:deploy-safe] ✅ Banco e migrações verificados com sucesso!');
