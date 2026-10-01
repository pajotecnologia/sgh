-- Migration: 20261001220000_limpar_base_manter_usuarios
-- Limpa todos os dados operacionais, pacientes, atendimentos, fichas e movimentações,
-- preservando estritamente os logins de usuários (tabela usuarios) e configurações institucionais.

-- 1. Limpeza em cascata de tabelas dependentes
TRUNCATE TABLE "tb_prescricao_item_checagens" CASCADE;
TRUNCATE TABLE "tb_prescricao_item_horarios" CASCADE;
TRUNCATE TABLE "tb_farmacia_dispensacao_itens" CASCADE;
TRUNCATE TABLE "tb_farmacia_dispensacoes" CASCADE;
TRUNCATE TABLE "tb_farmacia_saida_itens" CASCADE;
TRUNCATE TABLE "tb_farmacia_saidas" CASCADE;
TRUNCATE TABLE "tb_farmacia_entrada_itens" CASCADE;
TRUNCATE TABLE "tb_farmacia_entradas_nf" CASCADE;
TRUNCATE TABLE "tb_farmacia_movimentacao" CASCADE;
TRUNCATE TABLE "tb_prescricao_itens" CASCADE;
TRUNCATE TABLE "tb_prescricao_cabecalhos" CASCADE;
TRUNCATE TABLE "tb_prescricao_item" CASCADE;
TRUNCATE TABLE "tb_prescricao_cabecalho" CASCADE;
TRUNCATE TABLE "tb_farmacia_dispensacao" CASCADE;
TRUNCATE TABLE "tb_farmacia_saida_item" CASCADE;
TRUNCATE TABLE "tb_farmacia_saida" CASCADE;
TRUNCATE TABLE "tb_farmacia_entrada_nf_item" CASCADE;
TRUNCATE TABLE "tb_farmacia_entrada_nf" CASCADE;

-- 2. Limpeza clínica e prontuários
TRUNCATE TABLE "aplicacoes_medicamentos" CASCADE;
TRUNCATE TABLE "itens_prescricao" CASCADE;
TRUNCATE TABLE "prescricoes" CASCADE;
TRUNCATE TABLE "itens_requisicao" CASCADE;
TRUNCATE TABLE "requisicoes_exames" CASCADE;
TRUNCATE TABLE "evolucoes_medicas" CASCADE;
TRUNCATE TABLE "laudos_internacao" CASCADE;
TRUNCATE TABLE "fichas_internacao_alta" CASCADE;
TRUNCATE TABLE "fichas_ccih" CASCADE;
TRUNCATE TABLE "fichas_multidisciplinares" CASCADE;
TRUNCATE TABLE "fichas_evolucao_turno" CASCADE;
TRUNCATE TABLE "fichas_sinais_vitais" CASCADE;
TRUNCATE TABLE "fichas_sae" CASCADE;
TRUNCATE TABLE "evolucoes_multiprofissional" CASCADE;
TRUNCATE TABLE "fichas_internacao_obstetrica" CASCADE;
TRUNCATE TABLE "fichas_bercario" CASCADE;
TRUNCATE TABLE "encaminhamentos" CASCADE;
TRUNCATE TABLE "anamneses" CASCADE;
TRUNCATE TABLE "diagnosticos" CASCADE;
TRUNCATE TABLE "prontuarios_medicos" CASCADE;

-- 3. Limpeza de chamadas, triagens e atendimentos
TRUNCATE TABLE "chamadas_painel" CASCADE;
TRUNCATE TABLE "sinais_vitais" CASCADE;
TRUNCATE TABLE "triagens" CASCADE;
TRUNCATE TABLE "atendimentos" CASCADE;

-- 4. Limpeza de pacientes
TRUNCATE TABLE "medicamentos_continuos" CASCADE;
TRUNCATE TABLE "alergias" CASCADE;
TRUNCATE TABLE "enderecos" CASCADE;
TRUNCATE TABLE "documentos_pacientes" CASCADE;
TRUNCATE TABLE "pacientes" CASCADE;

-- 5. Limpeza de sessões e auditoria (usuários preservados)
TRUNCATE TABLE "sessoes_usuario" CASCADE;
TRUNCATE TABLE "tentativas_login" CASCADE;
TRUNCATE TABLE "eventos_mfa" CASCADE;
TRUNCATE TABLE "solicitacoes_titular" CASCADE;
TRUNCATE TABLE "tokens_redefinicao_senha" CASCADE;
TRUNCATE TABLE "logs_acesso_paciente" CASCADE;
TRUNCATE TABLE "logs_auditoria" CASCADE;
TRUNCATE TABLE "tb_auditoria_log" CASCADE;

-- 6. Reset de leitos
UPDATE "leitos" SET "status" = 'DISPONIVEL', "atendimentoId" = NULL WHERE TRUE;

-- 7. Reset de estoque de farmácia
UPDATE "tb_medicamento" SET "saldoAtual" = 0, "saldoReservado" = 0 WHERE TRUE;
