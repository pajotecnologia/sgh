
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function resetSystem() {
  console.log('🚀 Iniciando RESET TOTAL do sistema (mantendo apenas usuários e configurações)...');
  
  try {
    // Ordem de deleção para evitar erros de FK
    console.log('1/4 Deletando dados de prontuário e prescrições...');
    await prisma.itemRequisicao.deleteMany({});
    await prisma.requisicaoExame.deleteMany({});
    await prisma.aplicacaoMedicamento.deleteMany({});
    await prisma.itemPrescricao.deleteMany({});
    await prisma.prescricao.deleteMany({});
    await prisma.diagnostico.deleteMany({});
    await prisma.anamnese.deleteMany({});
    await prisma.evolucaoMedica.deleteMany({});
    await prisma.encaminhamento.deleteMany({});
    
    console.log('2/4 Deletando dados de triagem e atendimento...');
    await prisma.chamadaPainel.deleteMany({});
    await prisma.sinaisVitais.deleteMany({});
    await prisma.triagem.deleteMany({});
    await prisma.prontuarioMedico.deleteMany({});
    await prisma.atendimento.deleteMany({});
    
    console.log('3/4 Deletando dados de pacientes e registros sensíveis...');
    await prisma.alergia.deleteMany({});
    await prisma.medicamentoContinuo.deleteMany({});
    await prisma.documentoPaciente.deleteMany({});
    await prisma.endereco.deleteMany({});
    await prisma.paciente.deleteMany({});
    
    console.log('4/4 Limpando logs de auditoria...');
    await prisma.logAuditoria.deleteMany({});

    console.log('✅ RESET CONCLUÍDO COM SUCESSO!');
    
    // Verificar se sobrou algo importante
    const usuarios = await prisma.usuario.count();
    console.log(`🔒 Profissionais preservados: ${usuarios}`);
    
  } catch (error: any) {
    console.error('❌ ERRO DURANTE O RESET:', error.message);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

resetSystem();
