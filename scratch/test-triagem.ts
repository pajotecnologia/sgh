
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('--- DIAGNÓSTICO DE ERRO DE TRIAGEM ---');
  
  try {
    // 1. Tentar encontrar um atendimento que NUNCA foi triado
    const atendimento = await prisma.atendimento.findFirst({
      where: { 
        status: 'AGUARDANDO_TRIAGEM',
        triagem: { is: null } // Garantir que não tenha triagem
      }
    });

    if (!atendimento) {
      console.error('Nenhum atendimento virgem encontrado.');
      return;
    }

    console.log('Atendimento virgem encontrado:', atendimento.id);

    const triador = await prisma.usuario.findFirst({ where: { role: 'ENFERMEIRO' } });
    if (!triador) throw new Error('Sem triador.');

    // 2. Tentar criar a triagem
    const res = await prisma.$transaction(async (tx) => {
      return await tx.triagem.create({
        data: {
          atendimentoId: atendimento.id,
          triadorId: triador.id,
          corClassificacao: 'VERDE',
          queixaPrincipal: 'Teste de diagnóstico',
          doencasPreexistentes: 'Nenhuma',
          classificadoEm: new Date(),
          sinaisVitais: {
            create: {
              paSistolica: 120,
              paDiastolica: 80,
              escalaDor: 0
            }
          }
        }
      });
    });

    console.log('✅ SUCESSO NO DIAGNÓSTICO! Triagem criada:', res.id);

  } catch (error: any) {
    console.error('❌ ERRO NO DIAGNÓSTICO:');
    console.error('Mensagem:', error.message);
    if (error.code) console.error('Código Prisma:', error.code);
    if (error.meta) console.error('Metadados (campos afetados):', JSON.stringify(error.meta, null, 2));
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
