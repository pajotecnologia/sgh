/**
 * Deploy seguro das migrations Prisma em ambientes existentes.
 *
 * Cenário suportado:
 * - banco criado anteriormente via db:push/db:bootstrap;
 * - schema já existente e compatível com prisma/schema.prisma;
 * - histórico _prisma_migrations ainda não inicializado (P3005).
 *
 * Nesse caso, sincroniza as tabelas com segurança (IF NOT EXISTS),
 * inicializa o baseline no _prisma_migrations de forma rápida e atômica,
 * e então executa migrate deploy normalmente.
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

console.log('[migrate:deploy-safe] Executando prisma migrate deploy...');
const deploy = runPrisma(['migrate', 'deploy'], { capture: true });

if (deploy.status === 0) {
  process.stdout.write(deploy.output);
  console.log('[migrate:deploy-safe] Migrações aplicadas com sucesso.');
  process.exit(0);
}

process.stdout.write(deploy.output);

if (!deploy.output.includes('P3005')) {
  fail(
    '[migrate:deploy-safe] Prisma migrate deploy falhou. O deploy será interrompido para evitar iniciar o SGH com schema inconsistente.',
  );
}

console.log('[migrate:deploy-safe] Banco existente sem histórico Prisma detectado (P3005).');
console.log('[migrate:deploy-safe] Sincronizando tabelas e estruturas com o banco de dados...');

// 1. Executa o sincronizador nativo seguro com IF NOT EXISTS
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

console.log('[migrate:deploy-safe] Inicializando o histórico Prisma (baseline rápido)...');
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
  fail('[migrate:deploy-safe] Falha ao inicializar o histórico de migrations Prisma.');
}

console.log('[migrate:deploy-safe] Histórico inicializado. Validando com migrate deploy...');

const finalDeploy = runPrisma(['migrate', 'deploy'], { capture: true });
process.stdout.write(finalDeploy.output);

if (finalDeploy.status !== 0) {
  fail('[migrate:deploy-safe] O deploy das migrations falhou após o baseline. O SGH não será iniciado.');
}

console.log('[migrate:deploy-safe] Migrações verificadas com sucesso.');
