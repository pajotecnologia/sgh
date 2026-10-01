/**
 * scripts/limpar-banco.mjs
 * Limpa toda a base de dados do SGH (pacientes, atendimentos, triagens, prontuários, farmácia, prescrições, auditoria),
 * preservando estritamente os usuários de acesso ao sistema (tabela usuarios),
 * configurações institucionais e catálogos básicos.
 */
import './load-env.mjs';
import pg from 'pg';
import bcrypt from 'bcryptjs';

const TABELAS_LIMPEZA = [
  // Prescrições e Enfermagem integradas
  'tb_prescricao_item_checagens',
  'tb_prescricao_item_horarios',
  'tb_farmacia_dispensacao',
  'tb_farmacia_saida_item',
  'tb_farmacia_saida',
  'tb_farmacia_entrada_nf_item',
  'tb_farmacia_entrada_nf',
  'tb_farmacia_movimentacao',
  'tb_prescricao_item',
  'tb_prescricao_cabecalho',
  
  // Prontuário, Fichas e Internação
  'aplicacoes_medicamentos',
  'itens_prescricao',
  'prescricoes',
  'itens_requisicao',
  'requisicoes_exames',
  'evolucoes_medicas',
  'laudos_internacao',
  'fichas_internacao_alta',
  'fichas_ccih',
  'fichas_multidisciplinares',
  'fichas_evolucao_turno',
  'fichas_sinais_vitais',
  'fichas_sae',
  'evolucoes_multiprofissional',
  'fichas_internacao_obstetrica',
  'fichas_bercario',
  'encaminhamentos',
  'anamneses',
  'diagnosticos',
  'prontuarios_medicos',
  
  // Painel e Triagem
  'chamadas_painel',
  'sinais_vitais',
  'triagens',
  'atendimentos',
  
  // Dados de Pacientes
  'medicamentos_continuos',
  'alergias',
  'enderecos',
  'documentos_pacientes',
  'pacientes',
  
  // Logs de segurança e sessões (mantendo os usuários)
  'sessoes_usuario',
  'tentativas_login',
  'eventos_mfa',
  'solicitacoes_titular',
  'tokens_redefinicao_senha',
  'logs_acesso_paciente',
  'logs_auditoria',
  'tb_auditoria_log',
];

async function executarLimpeza() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('❌ DATABASE_URL não configurada.');
    process.exit(1);
  }

  const client = new pg.Client({ connectionString: url });
  try {
    await client.connect();
    console.log('🔗 Conectado ao banco de dados PostgreSQL.');

    // 1. Verificar usuários existentes
    const resUsuarios = await client.query('SELECT id, email, nome, role, ativo FROM usuarios ORDER BY nome ASC');
    console.log(`\n👥 Usuários de acesso encontrados no sistema: ${resUsuarios.rowCount}`);
    for (const u of resUsuarios.rows) {
      console.log(`   • [${u.role}] ${u.nome} <${u.email}> - Ativo: ${u.ativo}`);
    }

    // Se não houver nenhum usuário, criar o usuário ADMIN padrão
    if (resUsuarios.rowCount === 0) {
      console.log('\n⚠️ Nenhum usuário encontrado. Criando usuário administrador padrão...');
      const senhaHash = await bcrypt.hash('Sgh@2024!', 12);
      await client.query(`
        INSERT INTO usuarios (id, email, "senhaHash", nome, role, ativo, "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), 'admin@hospital.com', $1, 'Administrador do Sistema', 'ADMIN', true, NOW(), NOW())
      `, [senhaHash]);
      console.log('✅ Usuário admin@hospital.com criado com sucesso (Senha: Sgh@2024!).');
    }

    // 2. Limpar todas as tabelas transacionais e clínicas
    console.log('\n🧹 Iniciando limpeza das tabelas de pacientes, atendimentos, prontuários e movimentações...');
    
    for (const tabela of TABELAS_LIMPEZA) {
      try {
        const existe = await client.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = $1
          );
        `, [tabela]);

        if (existe.rows[0]?.exists) {
          await client.query(`TRUNCATE TABLE "${tabela}" CASCADE;`);
          console.log(`   ✓ Tabela limpa: ${tabela}`);
        }
      } catch (errTabela) {
        // Tenta com DELETE se TRUNCATE falhar
        try {
          await client.query(`DELETE FROM "${tabela}";`);
          console.log(`   ✓ Tabela esvaziada (DELETE): ${tabela}`);
        } catch (e) {
          console.warn(`   ⚠️ Aviso tabela ${tabela}: ${e.message}`);
        }
      }
    }

    // 3. Resetar status dos leitos (desocupar todos os leitos)
    try {
      const existeLeitos = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name = 'leitos'
        );
      `);
      if (existeLeitos.rows[0]?.exists) {
        await client.query(`UPDATE leitos SET status = 'DISPONIVEL', "atendimentoId" = NULL WHERE true;`);
        console.log('   ✓ Status de todos os leitos resetados para DISPONÍVEL.');
      }
    } catch {
      // ignora
    }

    // 4. Resetar saldos de medicamentos da farmácia (zerar movimentação)
    try {
      const existeMeds = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name = 'tb_medicamento'
        );
      `);
      if (existeMeds.rows[0]?.exists) {
        await client.query(`UPDATE tb_medicamento SET "saldoAtual" = 0, "saldoReservado" = 0 WHERE true;`);
        console.log('   ✓ Saldos de estoque da farmácia zerados.');
      }
    } catch {
      // ignora
    }

    console.log('\n======================================================');
    console.log('✨ LIMPEZA CONCLUÍDA COM SUCESSO!');
    console.log('   Todos os dados de pacientes, atendimentos e movimentações foram removidos.');
    console.log('   Apenas os logins e acessos de usuários foram preservados.');
    console.log('======================================================\n');
  } catch (error) {
    console.error('❌ Erro durante a limpeza do banco:', error);
  } finally {
    await client.end();
  }
}

executarLimpeza();
