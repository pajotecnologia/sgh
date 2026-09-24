import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function limparDados() {
  console.log('🧹 Limpando todos os cadastros de pacientes e atendimentos demo...');

  // 1. Limpeza em cascata de atendimentos, pacientes, movimentações e prontuários
  const tabelasParaLimpar = [
    'itens_requisicao_exames',
    'requisicoes_exames',
    'aplicacoes_medicamentos',
    'itens_prescricao',
    'prescricoes_medicas',
    'anamneses',
    'diagnosticos',
    'evolucoes_medicas',
    'encaminhamentos',
    'prontuarios_medicos',
    'sinais_vitais',
    'triagens',
    'chamadas_painel',
    'laudos_internacao',
    'fichas_internacao_alta',
    'fichas_ccih',
    'fichas_multidisciplinar',
    'fichas_evolucao_turno',
    'fichas_sinais_vitais',
    'fichas_sae',
    'evolucoes_multiprofissional',
    'fichas_internacao_obstetrica',
    'fichas_bercario',
    'tb_prescricao_itens',
    'tb_farmacia_dispensacoes',
    'tb_farmacia_saidas',
    'tb_farmacia_entradas_nf_itens',
    'tb_farmacia_entradas_nf',
    'tb_farmacia_lotes',
    'tb_prescricoes_cabecalho',
    'tb_auditoria_logs',
    'logs_acesso_paciente',
    'logs_auditoria',
    'tentativas_login',
    'eventos_mfa',
    'sessoes_usuario',
    'tokens_redefinicao_senha',
    'atendimentos',
    'enderecos',
    'alergias',
    'medicamentos_continuos',
    'documentos_assinados_pacientes',
    'solicitacoes_titular',
    'pacientes',
  ];

  for (const tabela of tabelasParaLimpar) {
    try {
      await pool.query(`TRUNCATE TABLE "${tabela}" CASCADE;`);
      console.log(`  ✓ Tabela limpa: ${tabela}`);
    } catch {
      try {
        await pool.query(`DELETE FROM "${tabela}";`);
        console.log(`  ✓ Registros excluídos: ${tabela}`);
      } catch {
        // Ignora tabela inexistente
      }
    }
  }

  // 2. Liberar todos os leitos (Status -> DISPONIVEL)
  try {
    await pool.query(`UPDATE "leitos" SET "status" = 'DISPONIVEL';`);
    console.log('  ✓ Leitos liberados e definidos como DISPONÍVEL');
  } catch (err) {
    console.warn('  ⚠️ Aviso ao atualizar leitos:', err.message);
  }

  // 3. Garantir que as configurações institucionais e origens mínimas existam
  console.log('\n🏥 Verificando e preservando cadastros essenciais do sistema...');

  // Instituição
  await prisma.instituicao.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      nomeMunicipio: 'Município SGH',
      nomeInstituicao: 'Hospital Geral Integrado',
      endereco: 'Av. Hospitalar, 1000',
      bairro: 'Centro',
      cidade: 'São Paulo',
      estado: 'SP',
      cep: '01001000',
    },
  });
  console.log('  ✓ Instituição configurada.');

  // Config Painel e SMTP
  const painel = await prisma.configPainel.findFirst();
  if (!painel) {
    await prisma.configPainel.create({ data: {} });
  }

  await prisma.configSmtp.upsert({
    where: { id: 'default' },
    update: {},
    create: { id: 'default' },
  });
  console.log('  ✓ Configurações de Painel e SMTP prontas.');

  // Origens de Paciente
  const origensPadrao = [
    { descricao: 'Demanda Espontânea', procedenciaFicha: 'DEMANDA_ESPONTANEA' },
    { descricao: 'SAMU 192', procedenciaFicha: 'SAMU' },
    { descricao: 'Resgate / Bombeiros 193', procedenciaFicha: 'RESGATE' },
    { descricao: 'Encaminhamento UBS / Posto de Saúde', procedenciaFicha: 'UBS' },
    { descricao: 'Transferência Inter-Hospitalar', procedenciaFicha: 'TRANSFERENCIA' },
  ];

  for (const o of origensPadrao) {
    await prisma.origemPaciente.upsert({
      where: { descricao: o.descricao },
      update: { procedenciaFicha: o.procedenciaFicha, ativo: true },
      create: { ...o, ativo: true },
    });
  }
  console.log('  ✓ Origens de atendimento prontas.');

  // Usuários do sistema
  const senhaPadrao = await hash('Sgh@2024!', 12);
  const usuarios = [
    { email: 'admin@hospital.com', nome: 'Administrador Sistema', role: 'ADMIN' },
    { email: 'medico@hospital.com', nome: 'Dr. Carlos Mendes', role: 'MEDICO', crm: '123456-SP' },
    { email: 'enfermeiro@hospital.com', nome: 'Enf. Ana Beatriz Lima', role: 'ENFERMEIRO', coren: 'COREN-SP 654321' },
    { email: 'recepcao@hospital.com', nome: 'Joana Silva Santos', role: 'RECEPCIONISTA' },
    { email: 'diretor@hospital.com', nome: 'Dr. Roberto Faria', role: 'DIRETOR_CLINICO', crm: '789012-SP' },
    { email: 'tecnico@hospital.com', nome: 'Téc. Enf. Paulo Rocha', role: 'TECNICO_ENFERMAGEM' },
    { email: 'farmacia@hospital.com', nome: 'Farmacêutico(a) — Central', role: 'FARMACEUTICO' },
  ];

  for (const u of usuarios) {
    await prisma.usuario.upsert({
      where: { email: u.email },
      update: { senhaHash: senhaPadrao, ativo: true },
      create: { ...u, senhaHash: senhaPadrao, ativo: true },
    });
  }
  console.log('  ✓ Usuários essenciais ativos (admin, médico, enfermeiro, recepção, diretor, técnico, farmácia).');

  console.log('\n✨ Limpeza concluída com sucesso!');
  console.log('Todos os pacientes, atendimentos e históricos de teste foram removidos.');
  console.log('O sistema está limpo e pronto para receber atendimentos reais.');
}

limparDados()
  .catch((e) => {
    console.error('Erro na limpeza:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
