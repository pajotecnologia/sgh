
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  try {
    const res = await pool.query(`
      SELECT n.nspname as schema, t.typname as type, e.enumlabel as value
      FROM pg_type t 
      JOIN pg_enum e ON t.oid = e.enumtypid  
      JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
      WHERE t.typname = 'StatusAtendimento'
      ORDER BY e.enumsortorder;
    `);
    console.log('Valores do Enum no Banco de Dados:');
    console.table(res.rows);
  } catch (error: any) {
    console.error('Erro ao consultar enum:', error.message);
  } finally {
    await pool.end();
  }
}

main();
