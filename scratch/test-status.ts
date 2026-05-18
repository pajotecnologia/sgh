
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('--- TESTE DE ATUALIZAÇÃO DE STATUS ---');
  
  try {
    // 1. Buscar um atendimento qualquer
    const atendimento = await prisma.atendimento.findFirst({
      where: { deletedAt: null }
    });

    if (!atendimento) {
      console.error('Nenhum atendimento encontrado.');
      return;
    }

    console.log(`Atendimento original: ${atendimento.numeroAtendimento} - Status: ${atendimento.status}`);

    // 2. Tentar mudar para CONCLUIDO
    console.log('Tentando mudar para CONCLUIDO...');
    const att1 = await prisma.atendimento.update({
      where: { id: atendimento.id },
      data: { status: 'CONCLUIDO' }
    });
    console.log('✅ Sucesso: Mudou para CONCLUIDO');

    // 3. Tentar mudar para INTERNADO
    console.log('Tentando mudar para INTERNADO...');
    const att2 = await prisma.atendimento.update({
      where: { id: atendimento.id },
      data: { status: 'INTERNADO' }
    });
    console.log('✅ Sucesso: Mudou para INTERNADO');

    // 4. Voltar para o status original
    await prisma.atendimento.update({
      where: { id: atendimento.id },
      data: { status: atendimento.status }
    });
    console.log('Restaurado status original.');

  } catch (error: any) {
    console.error('❌ FALHA NO TESTE DE STATUS:', error.message);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
