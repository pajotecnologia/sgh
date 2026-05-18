-- =============================================================================
-- SGH — Sistema de Gerenciamento Hospitalar
-- Schema PostgreSQL completo (DDL): enums, tabelas, índices e FKs.
--
-- Origem: gerado a partir de prisma/schema.prisma (espelho do modelo atual).
-- Regenerar no projeto: npm run db:schema:sql
--
-- Uso típico:
--   - Base nova (greenfield): criar database vazia e executar este ficheiro com psql.
--   - Projeto em desenvolvimento: prefira npm run db:migrate && npm run db:seed
--     para manter a tabela _prisma_migrations e dados iniciais.
--
-- Não inclui dados (INSERT). Utilizadores iniciais: npm run db:seed (senhas bcrypt).
-- =============================================================================

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'MEDICO', 'ENFERMEIRO', 'TECNICO_ENFERMAGEM', 'RECEPCIONISTA', 'DIRETOR_CLINICO');

-- CreateEnum
CREATE TYPE "CorTriagem" AS ENUM ('VERMELHO', 'LARANJA', 'AMARELO', 'VERDE', 'AZUL', 'CINZA');

-- CreateEnum
CREATE TYPE "StatusAtendimento" AS ENUM ('AGUARDANDO_TRIAGEM', 'EM_TRIAGEM', 'AGUARDANDO_ATENDIMENTO', 'EM_ATENDIMENTO', 'CONCLUIDO', 'INTERNADO', 'TRANSFERIDO', 'ALTA', 'OBITO');

-- CreateEnum
CREATE TYPE "TipoSanguineo" AS ENUM ('A_POSITIVO', 'A_NEGATIVO', 'B_POSITIVO', 'B_NEGATIVO', 'AB_POSITIVO', 'AB_NEGATIVO', 'O_POSITIVO', 'O_NEGATIVO', 'DESCONHECIDO');

-- CreateEnum
CREATE TYPE "SexoBiologico" AS ENUM ('MASCULINO', 'FEMININO', 'INTERSEXO');

-- CreateEnum
CREATE TYPE "ViaAdministracao" AS ENUM ('ORAL', 'INTRAVENOSA', 'INTRAMUSCULAR', 'SUBCUTANEA', 'TOPICA', 'INALATORIA', 'SUBLINGUAL', 'RETAL', 'OFTALMICA', 'OTOLOGICA', 'NASAL');

-- CreateEnum
CREATE TYPE "StatusPrescricaoItem" AS ENUM ('PENDENTE', 'APLICADO', 'RECUSADO', 'SUSPENSO');

-- CreateEnum
CREATE TYPE "UrgenciaExame" AS ENUM ('ROTINA', 'URGENTE', 'EMERGENCIAL');

-- CreateEnum
CREATE TYPE "CategoriaExame" AS ENUM ('LABORATORIO', 'IMAGEM', 'CARDIOLOGIA', 'PROCEDIMENTO', 'OUTRO');

-- CreateEnum
CREATE TYPE "TipoEncaminhamento" AS ENUM ('INTERNO', 'EXTERNO', 'INTERNACAO');

-- CreateEnum
CREATE TYPE "TipoAcaoAuditoria" AS ENUM ('CRIACAO', 'ATUALIZACAO', 'EXCLUSAO', 'VISUALIZACAO', 'LOGIN', 'LOGOUT', 'CHAMADA_PAINEL');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "crm" TEXT,
    "coren" TEXT,
    "cpf" TEXT,
    "telefone" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "mfaSecret" TEXT,
    "mfaAtivo" BOOLEAN NOT NULL DEFAULT false,
    "ultimoAcesso" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tokens_redefinicao_senha" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tokens_redefinicao_senha_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pacientes" (
    "id" TEXT NOT NULL,
    "cpfCriptografado" TEXT NOT NULL,
    "cpfHash" TEXT NOT NULL,
    "nomeCriptografado" TEXT NOT NULL,
    "nomeExibicao" TEXT NOT NULL,
    "rgCriptografado" TEXT,
    "dataNascimento" TIMESTAMP(3) NOT NULL,
    "sexoBiologico" "SexoBiologico" NOT NULL,
    "genero" TEXT,
    "telefoneCriptografado" TEXT,
    "tipoSanguineo" "TipoSanguineo" NOT NULL DEFAULT 'DESCONHECIDO',
    "convenio" TEXT,
    "numeroCarteirinha" TEXT,
    "observacoesIniciais" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "acompanhanteNome" TEXT,
    "acompanhanteTelefone" TEXT,
    "cns" TEXT,
    "escolaridade" TEXT,
    "naturalidade" TEXT,
    "nomeMae" TEXT,
    "profissao" TEXT,
    "racaCor" TEXT,

    CONSTRAINT "pacientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enderecos" (
    "id" TEXT NOT NULL,
    "pacienteId" TEXT NOT NULL,
    "cep" TEXT NOT NULL,
    "logradouro" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "complemento" TEXT,
    "bairro" TEXT NOT NULL,
    "cidade" TEXT NOT NULL,
    "estado" CHAR(2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "enderecos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alergias" (
    "id" TEXT NOT NULL,
    "pacienteId" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "gravidade" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alergias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medicamentos_continuos" (
    "id" TEXT NOT NULL,
    "pacienteId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "dose" TEXT NOT NULL,
    "frequencia" TEXT NOT NULL,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "medicamentos_continuos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documentos_pacientes" (
    "id" TEXT NOT NULL,
    "pacienteId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "nomeArquivo" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "tamanhoBytes" INTEGER NOT NULL,
    "caminhoArquivo" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documentos_pacientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "atendimentos" (
    "id" TEXT NOT NULL,
    "numeroAtendimento" TEXT NOT NULL,
    "pacienteId" TEXT NOT NULL,
    "medicoId" TEXT,
    "status" "StatusAtendimento" NOT NULL DEFAULT 'AGUARDANDO_TRIAGEM',
    "setor" TEXT,
    "sala" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "origemId" TEXT,

    CONSTRAINT "atendimentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "triagens" (
    "id" TEXT NOT NULL,
    "atendimentoId" TEXT NOT NULL,
    "triadorId" TEXT NOT NULL,
    "corClassificacao" "CorTriagem" NOT NULL,
    "queixaPrincipal" TEXT NOT NULL,
    "categoriaQueixa" TEXT,
    "entradaTriagem" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "classificadoEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "acidenteTrabalho" BOOLEAN NOT NULL DEFAULT false,
    "alergias" TEXT,
    "discriminador" TEXT,
    "doencasPreexistentes" TEXT,
    "especialidade" TEXT,
    "fluxograma" TEXT,
    "irradiacao" TEXT,
    "medicacoes" TEXT,
    "nivelConsciencia" TEXT,
    "regraDor" TEXT,
    "ritmo" TEXT,
    "tempoQueixa" TEXT,
    "tipoDorToracica" TEXT,
    "duracaoDor" TEXT,
    "localizacaoDor" TEXT,
    "irradiacaoDorSites" TEXT,
    "estadoConscienciaSinais" TEXT,

    CONSTRAINT "triagens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sinais_vitais" (
    "id" TEXT NOT NULL,
    "triagemId" TEXT NOT NULL,
    "paSistolica" INTEGER,
    "paDiastolica" INTEGER,
    "frequenciaCardiaca" INTEGER,
    "frequenciaResp" INTEGER,
    "spo2" DECIMAL(5,2),
    "temperatura" DECIMAL(4,1),
    "glicemia" INTEGER,
    "escalaDor" INTEGER,
    "peso" DECIMAL(5,2),
    "altura" INTEGER,
    "imc" DECIMAL(4,2),
    "coletadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sinais_vitais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chamadas_painel" (
    "id" TEXT NOT NULL,
    "atendimentoId" TEXT NOT NULL,
    "chamadoPorId" TEXT NOT NULL,
    "salaDestino" TEXT NOT NULL,
    "setorPainel" TEXT NOT NULL DEFAULT 'GERAL',
    "chamadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chamadas_painel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prontuarios_medicos" (
    "id" TEXT NOT NULL,
    "atendimentoId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prontuarios_medicos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "anamneses" (
    "id" TEXT NOT NULL,
    "prontuarioId" TEXT NOT NULL,
    "queixaPrincipal" TEXT NOT NULL,
    "hda" TEXT,
    "antecedentesP" TEXT,
    "antecedentesF" TEXT,
    "antecedentesC" TEXT,
    "habitosVida" JSONB,
    "revisaoSistemas" JSONB,
    "exameFisico" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "anamneses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "diagnosticos" (
    "id" TEXT NOT NULL,
    "prontuarioId" TEXT NOT NULL,
    "codigoCid" TEXT NOT NULL,
    "descricaoCid" TEXT NOT NULL,
    "hipotese" TEXT,
    "principal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "diagnosticos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prescricoes" (
    "id" TEXT NOT NULL,
    "prontuarioId" TEXT NOT NULL,
    "numeroPrescricao" INTEGER NOT NULL DEFAULT 1,
    "emitidaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validaAte" TIMESTAMP(3),
    "observacoes" TEXT,
    "pdfCaminho" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prescricoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itens_prescricao" (
    "id" TEXT NOT NULL,
    "prescricaoId" TEXT NOT NULL,
    "nomeMedicamento" TEXT NOT NULL,
    "dose" TEXT NOT NULL,
    "via" "ViaAdministracao" NOT NULL,
    "frequencia" TEXT NOT NULL,
    "duracaoDias" INTEGER,
    "observacoes" TEXT,
    "status" "StatusPrescricaoItem" NOT NULL DEFAULT 'PENDENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "itens_prescricao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "aplicacoes_medicamentos" (
    "id" TEXT NOT NULL,
    "itemPrescricaoId" TEXT NOT NULL,
    "aplicadoPorId" TEXT NOT NULL,
    "doseAplicada" TEXT NOT NULL,
    "via" "ViaAdministracao" NOT NULL,
    "aplicadoEm" TIMESTAMP(3) NOT NULL,
    "checklistConfirmado" JSONB NOT NULL,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "aplicacoes_medicamentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "requisicoes_exames" (
    "id" TEXT NOT NULL,
    "prontuarioId" TEXT NOT NULL,
    "categoria" "CategoriaExame" NOT NULL,
    "urgencia" "UrgenciaExame" NOT NULL DEFAULT 'ROTINA',
    "indicacao" TEXT NOT NULL,
    "pdfCaminho" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "requisicoes_exames_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itens_requisicao" (
    "id" TEXT NOT NULL,
    "requisicaoId" TEXT NOT NULL,
    "nomeExame" TEXT NOT NULL,
    "codigoTuss" TEXT,
    "observacoes" TEXT,
    "resultado" TEXT,
    "resultadoPdf" TEXT,
    "realizadoEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "itens_requisicao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evolucoes_medicas" (
    "id" TEXT NOT NULL,
    "prontuarioId" TEXT NOT NULL,
    "autorId" TEXT NOT NULL,
    "conteudo" TEXT NOT NULL,
    "template" TEXT,
    "registradoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evolucoes_medicas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "encaminhamentos" (
    "id" TEXT NOT NULL,
    "prontuarioId" TEXT NOT NULL,
    "tipo" "TipoEncaminhamento" NOT NULL,
    "especialidade" TEXT NOT NULL,
    "medicoDestinoId" TEXT,
    "prioridade" TEXT,
    "resumoClinco" TEXT,
    "justificativa" TEXT,
    "tipoLeito" TEXT,
    "setor" TEXT,
    "cidInternacao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "encaminhamentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "logs_auditoria" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT,
    "acao" "TipoAcaoAuditoria" NOT NULL,
    "entidade" TEXT NOT NULL,
    "entidadeId" TEXT,
    "campo" TEXT,
    "valorAnterior" TEXT,
    "valorNovo" TEXT,
    "ipOrigem" TEXT,
    "userAgent" TEXT,
    "registradoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "logs_auditoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "instituicoes" (
    "id" TEXT NOT NULL,
    "nomeMunicipio" TEXT NOT NULL,
    "nomeInstituicao" TEXT NOT NULL,
    "endereco" TEXT,
    "bairro" TEXT,
    "cidade" TEXT,
    "estado" CHAR(2),
    "cep" TEXT,
    "logomarcaUrl" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "instituicoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "config_painel" (
    "id" TEXT NOT NULL,
    "vozAtiva" BOOLEAN NOT NULL DEFAULT true,
    "tipoVoz" TEXT NOT NULL DEFAULT 'feminina',
    "corPrimaria" TEXT NOT NULL DEFAULT '#2563eb',
    "corSecundaria" TEXT NOT NULL DEFAULT '#f8fafc',
    "corTexto" TEXT NOT NULL DEFAULT '#1e293b',
    "mensagemPadrao" TEXT NOT NULL DEFAULT 'Comparecer ao consultório',
    "velocidadeVoz" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "config_painel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "config_smtp" (
    "id" TEXT NOT NULL,
    "host" TEXT NOT NULL DEFAULT '',
    "porta" INTEGER NOT NULL DEFAULT 587,
    "secure" BOOLEAN NOT NULL DEFAULT false,
    "usuario" TEXT NOT NULL DEFAULT '',
    "senhaCriptografada" TEXT NOT NULL DEFAULT '',
    "emailRemetente" TEXT NOT NULL DEFAULT '',
    "nomeRemetente" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "config_smtp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "origens_pacientes" (
    "id" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "procedenciaFicha" TEXT,

    CONSTRAINT "origens_pacientes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_cpf_key" ON "usuarios"("cpf");

-- CreateIndex
CREATE INDEX "usuarios_email_idx" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "tokens_redefinicao_senha_tokenHash_key" ON "tokens_redefinicao_senha"("tokenHash");

-- CreateIndex
CREATE INDEX "tokens_redefinicao_senha_usuarioId_idx" ON "tokens_redefinicao_senha"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "pacientes_cpfCriptografado_key" ON "pacientes"("cpfCriptografado");

-- CreateIndex
CREATE UNIQUE INDEX "pacientes_cpfHash_key" ON "pacientes"("cpfHash");

-- CreateIndex
CREATE INDEX "pacientes_cpfHash_idx" ON "pacientes"("cpfHash");

-- CreateIndex
CREATE INDEX "pacientes_nomeExibicao_idx" ON "pacientes"("nomeExibicao");

-- CreateIndex
CREATE INDEX "pacientes_createdAt_idx" ON "pacientes"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "enderecos_pacienteId_key" ON "enderecos"("pacienteId");

-- CreateIndex
CREATE INDEX "alergias_pacienteId_idx" ON "alergias"("pacienteId");

-- CreateIndex
CREATE INDEX "medicamentos_continuos_pacienteId_idx" ON "medicamentos_continuos"("pacienteId");

-- CreateIndex
CREATE INDEX "documentos_pacientes_pacienteId_idx" ON "documentos_pacientes"("pacienteId");

-- CreateIndex
CREATE UNIQUE INDEX "atendimentos_numeroAtendimento_key" ON "atendimentos"("numeroAtendimento");

-- CreateIndex
CREATE INDEX "atendimentos_pacienteId_idx" ON "atendimentos"("pacienteId");

-- CreateIndex
CREATE INDEX "atendimentos_numeroAtendimento_idx" ON "atendimentos"("numeroAtendimento");

-- CreateIndex
CREATE INDEX "atendimentos_status_idx" ON "atendimentos"("status");

-- CreateIndex
CREATE INDEX "atendimentos_createdAt_idx" ON "atendimentos"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "triagens_atendimentoId_key" ON "triagens"("atendimentoId");

-- CreateIndex
CREATE INDEX "triagens_corClassificacao_idx" ON "triagens"("corClassificacao");

-- CreateIndex
CREATE INDEX "triagens_createdAt_idx" ON "triagens"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "sinais_vitais_triagemId_key" ON "sinais_vitais"("triagemId");

-- CreateIndex
CREATE INDEX "chamadas_painel_setorPainel_idx" ON "chamadas_painel"("setorPainel");

-- CreateIndex
CREATE INDEX "chamadas_painel_chamadoEm_idx" ON "chamadas_painel"("chamadoEm");

-- CreateIndex
CREATE UNIQUE INDEX "prontuarios_medicos_atendimentoId_key" ON "prontuarios_medicos"("atendimentoId");

-- CreateIndex
CREATE INDEX "prontuarios_medicos_atendimentoId_idx" ON "prontuarios_medicos"("atendimentoId");

-- CreateIndex
CREATE UNIQUE INDEX "anamneses_prontuarioId_key" ON "anamneses"("prontuarioId");

-- CreateIndex
CREATE INDEX "diagnosticos_prontuarioId_idx" ON "diagnosticos"("prontuarioId");

-- CreateIndex
CREATE INDEX "diagnosticos_codigoCid_idx" ON "diagnosticos"("codigoCid");

-- CreateIndex
CREATE INDEX "prescricoes_prontuarioId_idx" ON "prescricoes"("prontuarioId");

-- CreateIndex
CREATE INDEX "itens_prescricao_prescricaoId_idx" ON "itens_prescricao"("prescricaoId");

-- CreateIndex
CREATE INDEX "aplicacoes_medicamentos_itemPrescricaoId_idx" ON "aplicacoes_medicamentos"("itemPrescricaoId");

-- CreateIndex
CREATE INDEX "aplicacoes_medicamentos_aplicadoEm_idx" ON "aplicacoes_medicamentos"("aplicadoEm");

-- CreateIndex
CREATE INDEX "requisicoes_exames_prontuarioId_idx" ON "requisicoes_exames"("prontuarioId");

-- CreateIndex
CREATE INDEX "itens_requisicao_requisicaoId_idx" ON "itens_requisicao"("requisicaoId");

-- CreateIndex
CREATE INDEX "evolucoes_medicas_prontuarioId_idx" ON "evolucoes_medicas"("prontuarioId");

-- CreateIndex
CREATE INDEX "evolucoes_medicas_registradoEm_idx" ON "evolucoes_medicas"("registradoEm");

-- CreateIndex
CREATE INDEX "encaminhamentos_prontuarioId_idx" ON "encaminhamentos"("prontuarioId");

-- CreateIndex
CREATE INDEX "logs_auditoria_usuarioId_idx" ON "logs_auditoria"("usuarioId");

-- CreateIndex
CREATE INDEX "logs_auditoria_entidade_entidadeId_idx" ON "logs_auditoria"("entidade", "entidadeId");

-- CreateIndex
CREATE INDEX "logs_auditoria_registradoEm_idx" ON "logs_auditoria"("registradoEm");

-- CreateIndex
CREATE UNIQUE INDEX "origens_pacientes_descricao_key" ON "origens_pacientes"("descricao");

-- AddForeignKey
ALTER TABLE "tokens_redefinicao_senha" ADD CONSTRAINT "tokens_redefinicao_senha_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enderecos" ADD CONSTRAINT "enderecos_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "pacientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alergias" ADD CONSTRAINT "alergias_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "pacientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medicamentos_continuos" ADD CONSTRAINT "medicamentos_continuos_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "pacientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentos_pacientes" ADD CONSTRAINT "documentos_pacientes_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "pacientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atendimentos" ADD CONSTRAINT "atendimentos_medicoId_fkey" FOREIGN KEY ("medicoId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atendimentos" ADD CONSTRAINT "atendimentos_origemId_fkey" FOREIGN KEY ("origemId") REFERENCES "origens_pacientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atendimentos" ADD CONSTRAINT "atendimentos_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "pacientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "triagens" ADD CONSTRAINT "triagens_atendimentoId_fkey" FOREIGN KEY ("atendimentoId") REFERENCES "atendimentos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "triagens" ADD CONSTRAINT "triagens_triadorId_fkey" FOREIGN KEY ("triadorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sinais_vitais" ADD CONSTRAINT "sinais_vitais_triagemId_fkey" FOREIGN KEY ("triagemId") REFERENCES "triagens"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chamadas_painel" ADD CONSTRAINT "chamadas_painel_atendimentoId_fkey" FOREIGN KEY ("atendimentoId") REFERENCES "atendimentos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chamadas_painel" ADD CONSTRAINT "chamadas_painel_chamadoPorId_fkey" FOREIGN KEY ("chamadoPorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prontuarios_medicos" ADD CONSTRAINT "prontuarios_medicos_atendimentoId_fkey" FOREIGN KEY ("atendimentoId") REFERENCES "atendimentos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anamneses" ADD CONSTRAINT "anamneses_prontuarioId_fkey" FOREIGN KEY ("prontuarioId") REFERENCES "prontuarios_medicos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diagnosticos" ADD CONSTRAINT "diagnosticos_prontuarioId_fkey" FOREIGN KEY ("prontuarioId") REFERENCES "prontuarios_medicos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescricoes" ADD CONSTRAINT "prescricoes_prontuarioId_fkey" FOREIGN KEY ("prontuarioId") REFERENCES "prontuarios_medicos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_prescricao" ADD CONSTRAINT "itens_prescricao_prescricaoId_fkey" FOREIGN KEY ("prescricaoId") REFERENCES "prescricoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aplicacoes_medicamentos" ADD CONSTRAINT "aplicacoes_medicamentos_aplicadoPorId_fkey" FOREIGN KEY ("aplicadoPorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aplicacoes_medicamentos" ADD CONSTRAINT "aplicacoes_medicamentos_itemPrescricaoId_fkey" FOREIGN KEY ("itemPrescricaoId") REFERENCES "itens_prescricao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requisicoes_exames" ADD CONSTRAINT "requisicoes_exames_prontuarioId_fkey" FOREIGN KEY ("prontuarioId") REFERENCES "prontuarios_medicos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_requisicao" ADD CONSTRAINT "itens_requisicao_requisicaoId_fkey" FOREIGN KEY ("requisicaoId") REFERENCES "requisicoes_exames"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evolucoes_medicas" ADD CONSTRAINT "evolucoes_medicas_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evolucoes_medicas" ADD CONSTRAINT "evolucoes_medicas_prontuarioId_fkey" FOREIGN KEY ("prontuarioId") REFERENCES "prontuarios_medicos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "encaminhamentos" ADD CONSTRAINT "encaminhamentos_prontuarioId_fkey" FOREIGN KEY ("prontuarioId") REFERENCES "prontuarios_medicos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "logs_auditoria" ADD CONSTRAINT "logs_auditoria_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
