
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('--- TESTE DE CRIAÇÃO DE ATENDIMENTO NA RECEPÇÃO ---');
  
  try {
    const paciente = await prisma.paciente.findFirst();
    const origem = await prisma.origemPaciente.findFirst();

    if (!paciente || !origem) {
      console.error('Dados insuficientes para teste (paciente ou origem).');
      return;
    }

    console.log('Paciente:', paciente.id);
    console.log('Origem:', origem.descricao, 'ID:', origem.id);

    const res = await prisma.atendimento.create({
      data: {
        pacienteId: paciente.id,
        origemId: origem.id,
        numeroAtendimento: 'TESTE-' + Date.now(),
        status: 'AGUARDANDO_TRIAGEM'
      }
    });

    console.log('✅ Atendimento criado com sucesso! ID:', res.id);

    // Testar com origem nula
    const res2 = await prisma.atendimento.create({
      data: {
        pacienteId: paciente.id,
        origemId: null,
        numeroAtendimento: 'TESTE-NULL-' + Date.now(),
        status: 'AGUARDANDO_TRIAGEM'
      }
    });
    console.log('✅ Atendimento com origem nula criado!');

  } catch (error: any) {
    console.error('❌ ERRO NO TESTE:', error.message);
    if (error.code) console.error('Código:', error.code);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
