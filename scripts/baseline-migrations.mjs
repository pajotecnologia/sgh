/**
 * Marca todas as migrations como aplicadas sem executá-las.
 * Use quando o banco foi criado com `db:push` / `db:bootstrap` e ainda não tem histórico Prisma.
 *
 * Uso: npm run db:migrate:baseline
 */
import './load-env.mjs';
import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const migrationsDir = resolve(process.cwd(), 'prisma/migrations');
const prismaCli = resolve(process.cwd(), 'node_modules/prisma/build/index.js');

const migrationNames = readdirSync(migrationsDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

if (migrationNames.length === 0) {
  console.error('[migrate:baseline] Nenhuma migration encontrada em prisma/migrations');
  process.exit(1);
}

console.log(`[migrate:baseline] Marcando ${migrationNames.length} migration(s) como aplicadas...`);

for (const name of migrationNames) {
  const result = spawnSync(
    process.execPath,
    [prismaCli, 'migrate', 'resolve', '--applied', name],
    { stdio: 'inherit', env: process.env, cwd: process.cwd() },
  );

  if (result.status !== 0) {
    console.error(`[migrate:baseline] Falha ao marcar ${name}`);
    process.exit(result.status ?? 1);
  }
}

console.log('[migrate:baseline] Concluído. Verifique com: npm run db:migrate:status');
