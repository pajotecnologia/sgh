
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('--- AUDITORIA DE STATUS DE ATENDIMENTO ---');
  
  const atendimentos = await prisma.atendimento.findMany({
    where: { status: 'AGUARDANDO_TRIAGEM' },
    include: { triagem: true }
  });

  console.log(`Encontrados ${atendimentos.length} atendimentos como AGUARDANDO_TRIAGEM.`);

  for (const a of atendimentos) {
    if (a.triagem) {
      console.log(`⚠️ INCONSISTÊNCIA: Atendimento ${a.numeroAtendimento} (ID: ${a.id}) já possui triagem (ID: ${a.triagem.id}) mas o status é AGUARDANDO_TRIAGEM.`);
    } else {
      console.log(`✅ OK: Atendimento ${a.numeroAtendimento} (ID: ${a.id}) está aguardando triagem e não possui triagem vinculada.`);
    }
  }

  await prisma.$disconnect();
  await pool.end();
}

main();
