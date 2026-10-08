/**
 * Marca todas as migrations como aplicadas sem executá-las de forma rápida e atômica.
 * Limpa qualquer estado de falha anterior (P3009/P3018) e assegura que todas as migrations
 * presentes em prisma/migrations fiquem registradas como concluídas no _prisma_migrations.
 *
 * Uso: npm run db:migrate:baseline
 */
import './load-env.mjs';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import pg from 'pg';

const migrationsDir = resolve(process.cwd(), 'prisma/migrations');

const migrationNames = readdirSync(migrationsDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

if (migrationNames.length === 0) {
  console.error('[migrate:baseline] Nenhuma migration encontrada em prisma/migrations');
  process.exit(1);
}

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('[migrate:baseline] DATABASE_URL não definida.');
  process.exit(1);
}

async function main() {
  const client = new pg.Client({ connectionString: url, connectionTimeoutMillis: 10000 });
  try {
    await client.connect();

    await client.query(`
      CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
        "id"                  VARCHAR(36) PRIMARY KEY NOT NULL,
        "checksum"            VARCHAR(64) NOT NULL,
        "finished_at"         TIMESTAMPTZ,
        "migration_name"      VARCHAR(255) NOT NULL,
        "logs"                TEXT,
        "rolled_back_at"      TIMESTAMPTZ,
        "started_at"          TIMESTAMPTZ NOT NULL DEFAULT now(),
        "applied_steps_count" INTEGER NOT NULL DEFAULT 1
      );
    `);

    // Limpa migrações incompletas ou marcadas com erro
    await client.query(`DELETE FROM "_prisma_migrations" WHERE "finished_at" IS NULL OR "rolled_back_at" IS NOT NULL;`);

    console.log(`[migrate:baseline] Sincronizando ${migrationNames.length} migration(s) no histórico Prisma...`);

    const existingRes = await client.query('SELECT migration_name FROM "_prisma_migrations";');
    const existingSet = new Set(existingRes.rows.map((r) => r.migration_name));

    for (const name of migrationNames) {
      if (existingSet.has(name)) continue;

      const sqlPath = resolve(migrationsDir, name, 'migration.sql');
      let checksum = '';
      if (existsSync(sqlPath)) {
        const content = readFileSync(sqlPath, 'utf8');
        checksum = createHash('sha256').update(content).digest('hex');
      }

      await client.query(
        `INSERT INTO "_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "started_at", "applied_steps_count")
         VALUES ($1, $2, now(), $3, now(), 1);`,
        [randomUUID(), checksum, name]
      );
      console.log(`✓ Migration ${name} marcada como aplicada.`);
    }

    console.log('[migrate:baseline] Histórico Prisma atualizado com sucesso.');
  } catch (err) {
    console.error('[migrate:baseline] Erro ao registrar baseline:', err.message || err);
    process.exit(1);
  } finally {
    try { await client.end(); } catch {}
  }
}

main().then(() => process.exit(0)).catch((e) => {
  console.error('[migrate:baseline] Erro fatal:', e);
  process.exit(1);
});
