
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('--- REPARO DE STATUS DE ATENDIMENTO ---');
  
  // 1. Corrigir atendimentos que já têm triagem mas estão com status errado
  const inconsistentes = await prisma.atendimento.findMany({
    where: { 
      status: 'AGUARDANDO_TRIAGEM',
      triagem: { isNot: null } 
    }
  });

  console.log(`Corrigindo ${inconsistentes.length} registros...`);

  for (const a of inconsistentes) {
    await prisma.atendimento.update({
      where: { id: a.id },
      data: { status: 'AGUARDANDO_ATENDIMENTO' }
    });
    console.log(`✅ Atendimento ${a.numeroAtendimento} atualizado para AGUARDANDO_ATENDIMENTO.`);
  }

  // 2. Limpar triagens de teste sem sinais vitais (opcional, para limpar o banco)
  // await prisma.triagem.deleteMany({ where: { queixaPrincipal: { contains: 'Teste' } } });

  console.log('--- REPARO CONCLUÍDO ---');

  await prisma.$disconnect();
  await pool.end();
}

main();
