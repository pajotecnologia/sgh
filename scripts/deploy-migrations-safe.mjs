/**
 * Deploy seguro das migrations Prisma em ambientes existentes.
 *
 * Cenário suportado:
 * - banco criado anteriormente via db:push/db:bootstrap;
 * - schema já existente e compatível com prisma/schema.prisma;
 * - histórico _prisma_migrations ainda não inicializado.
 *
 * Nesse caso, valida o schema com migrate diff, faz baseline e então
 * executa migrate deploy normalmente. Nunca faz baseline se houver
 * diferença estrutural entre o banco e o schema atual.
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
console.log('[migrate:deploy-safe] Validando compatibilidade do schema antes do baseline...');

const diff = runPrisma(
  [
    'migrate',
    'diff',
    '--from-config-datasource',
    '--to-schema',
    'prisma/schema.prisma',
    '--exit-code',
  ],
  { capture: true },
);

if (diff.status !== 0) {
  fail(
    '[migrate:deploy-safe] O banco existente não corresponde exatamente ao schema.prisma atual. Nenhum baseline foi aplicado. Corrija a diferença do banco/migration antes de iniciar o SGH.',
    diff.output,
  );
}

if (diff.output.trim()) process.stdout.write(diff.output);

console.log('[migrate:deploy-safe] Schema compatível. Inicializando o histórico Prisma (baseline)...');
// Executa o script existente, que marca todas as migrations reais como aplicadas.
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
