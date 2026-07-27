-- =============================================================================
-- SGH — ATUALIZACAO DE SCHEMA (idempotente)
--
-- Gerado por scripts/generate-update-sql.mjs a partir de
-- database/sgh_schema_completo.sql (que por sua vez vem de prisma/schema.prisma).
--
-- Seguro para rodar num banco JA EXISTENTE e com dados. Pode ser reexecutado.
-- Apenas CRIA o que falta (tipos, tabelas, colunas, indices, chaves).
-- NUNCA remove nem altera colunas/tabelas existentes.
--
-- Uso:  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f sgh_update_schema.sql
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS "public";

-- ------------------------------------------------------------------
-- 1. Tipos enumerados
-- ------------------------------------------------------------------

DO $$ BEGIN
  CREATE TYPE "TipoLeitoHospitalar" AS ENUM ('UTI', 'ENFERMARIA', 'ISOLAMENTO', 'OBSERVACAO');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
ALTER TYPE "TipoLeitoHospitalar" ADD VALUE IF NOT EXISTS 'UTI';
ALTER TYPE "TipoLeitoHospitalar" ADD VALUE IF NOT EXISTS 'ENFERMARIA';
ALTER TYPE "TipoLeitoHospitalar" ADD VALUE IF NOT EXISTS 'ISOLAMENTO';
ALTER TYPE "TipoLeitoHospitalar" ADD VALUE IF NOT EXISTS 'OBSERVACAO';

DO $$ BEGIN
  CREATE TYPE "StatusLeitoHospitalar" AS ENUM ('DISPONIVEL', 'OCUPADO', 'INTERDITADO');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
ALTER TYPE "StatusLeitoHospitalar" ADD VALUE IF NOT EXISTS 'DISPONIVEL';
ALTER TYPE "StatusLeitoHospitalar" ADD VALUE IF NOT EXISTS 'OCUPADO';
ALTER TYPE "StatusLeitoHospitalar" ADD VALUE IF NOT EXISTS 'INTERDITADO';

DO $$ BEGIN
  CREATE TYPE "TipoPrescricao" AS ENUM ('PS', 'RECEITA_ALTA');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
ALTER TYPE "TipoPrescricao" ADD VALUE IF NOT EXISTS 'PS';
ALTER TYPE "TipoPrescricao" ADD VALUE IF NOT EXISTS 'RECEITA_ALTA';

DO $$ BEGIN
  CREATE TYPE "Role" AS ENUM ('ADMIN', 'MEDICO', 'ENFERMEIRO', 'TECNICO_ENFERMAGEM', 'RECEPCIONISTA', 'DIRETOR_CLINICO', 'FARMACEUTICO');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'ADMIN';
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'MEDICO';
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'ENFERMEIRO';
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'TECNICO_ENFERMAGEM';
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'RECEPCIONISTA';
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'DIRETOR_CLINICO';
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'FARMACEUTICO';

DO $$ BEGIN
  CREATE TYPE "TipoMovimentacaoFarmacia" AS ENUM ('ENTRADA_NF', 'ENTRADA_MANUAL', 'SAIDA_DISPENSACAO', 'SAIDA_MANUAL', 'AJUSTE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
ALTER TYPE "TipoMovimentacaoFarmacia" ADD VALUE IF NOT EXISTS 'ENTRADA_NF';
ALTER TYPE "TipoMovimentacaoFarmacia" ADD VALUE IF NOT EXISTS 'ENTRADA_MANUAL';
ALTER TYPE "TipoMovimentacaoFarmacia" ADD VALUE IF NOT EXISTS 'SAIDA_DISPENSACAO';
ALTER TYPE "TipoMovimentacaoFarmacia" ADD VALUE IF NOT EXISTS 'SAIDA_MANUAL';
ALTER TYPE "TipoMovimentacaoFarmacia" ADD VALUE IF NOT EXISTS 'AJUSTE';

DO $$ BEGIN
  CREATE TYPE "TipoSaidaFarmacia" AS ENUM ('DISPENSACAO_PRESCRICAO', 'BAIXA_MANUAL');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
ALTER TYPE "TipoSaidaFarmacia" ADD VALUE IF NOT EXISTS 'DISPENSACAO_PRESCRICAO';
ALTER TYPE "TipoSaidaFarmacia" ADD VALUE IF NOT EXISTS 'BAIXA_MANUAL';

DO $$ BEGIN
  CREATE TYPE "RiscoInteracao" AS ENUM ('LEVE', 'MODERADO', 'CRITICO');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
ALTER TYPE "RiscoInteracao" ADD VALUE IF NOT EXISTS 'LEVE';
ALTER TYPE "RiscoInteracao" ADD VALUE IF NOT EXISTS 'MODERADO';
ALTER TYPE "RiscoInteracao" ADD VALUE IF NOT EXISTS 'CRITICO';

DO $$ BEGIN
  CREATE TYPE "StatusValidacaoFarmacia" AS ENUM ('AGUARDANDO_TRIAGEM', 'APROVADO', 'REJEITADO');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
ALTER TYPE "StatusValidacaoFarmacia" ADD VALUE IF NOT EXISTS 'AGUARDANDO_TRIAGEM';
ALTER TYPE "StatusValidacaoFarmacia" ADD VALUE IF NOT EXISTS 'APROVADO';
ALTER TYPE "StatusValidacaoFarmacia" ADD VALUE IF NOT EXISTS 'REJEITADO';

DO $$ BEGIN
  CREATE TYPE "CorTriagem" AS ENUM ('VERMELHO', 'LARANJA', 'AMARELO', 'VERDE', 'AZUL', 'CINZA');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
ALTER TYPE "CorTriagem" ADD VALUE IF NOT EXISTS 'VERMELHO';
ALTER TYPE "CorTriagem" ADD VALUE IF NOT EXISTS 'LARANJA';
ALTER TYPE "CorTriagem" ADD VALUE IF NOT EXISTS 'AMARELO';
ALTER TYPE "CorTriagem" ADD VALUE IF NOT EXISTS 'VERDE';
ALTER TYPE "CorTriagem" ADD VALUE IF NOT EXISTS 'AZUL';
ALTER TYPE "CorTriagem" ADD VALUE IF NOT EXISTS 'CINZA';

DO $$ BEGIN
  CREATE TYPE "StatusAtendimento" AS ENUM ('AGUARDANDO_TRIAGEM', 'EM_TRIAGEM', 'AGUARDANDO_ATENDIMENTO', 'EM_ATENDIMENTO', 'CONCLUIDO', 'AGUARDANDO_INTERNACAO', 'INTERNADO', 'TRANSFERIDO', 'ALTA', 'OBITO');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
ALTER TYPE "StatusAtendimento" ADD VALUE IF NOT EXISTS 'AGUARDANDO_TRIAGEM';
ALTER TYPE "StatusAtendimento" ADD VALUE IF NOT EXISTS 'EM_TRIAGEM';
ALTER TYPE "StatusAtendimento" ADD VALUE IF NOT EXISTS 'AGUARDANDO_ATENDIMENTO';
ALTER TYPE "StatusAtendimento" ADD VALUE IF NOT EXISTS 'EM_ATENDIMENTO';
ALTER TYPE "StatusAtendimento" ADD VALUE IF NOT EXISTS 'CONCLUIDO';
ALTER TYPE "StatusAtendimento" ADD VALUE IF NOT EXISTS 'AGUARDANDO_INTERNACAO';
ALTER TYPE "StatusAtendimento" ADD VALUE IF NOT EXISTS 'INTERNADO';
ALTER TYPE "StatusAtendimento" ADD VALUE IF NOT EXISTS 'TRANSFERIDO';
ALTER TYPE "StatusAtendimento" ADD VALUE IF NOT EXISTS 'ALTA';
ALTER TYPE "StatusAtendimento" ADD VALUE IF NOT EXISTS 'OBITO';

DO $$ BEGIN
  CREATE TYPE "TipoSanguineo" AS ENUM ('A_POSITIVO', 'A_NEGATIVO', 'B_POSITIVO', 'B_NEGATIVO', 'AB_POSITIVO', 'AB_NEGATIVO', 'O_POSITIVO', 'O_NEGATIVO', 'DESCONHECIDO');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
ALTER TYPE "TipoSanguineo" ADD VALUE IF NOT EXISTS 'A_POSITIVO';
ALTER TYPE "TipoSanguineo" ADD VALUE IF NOT EXISTS 'A_NEGATIVO';
ALTER TYPE "TipoSanguineo" ADD VALUE IF NOT EXISTS 'B_POSITIVO';
ALTER TYPE "TipoSanguineo" ADD VALUE IF NOT EXISTS 'B_NEGATIVO';
ALTER TYPE "TipoSanguineo" ADD VALUE IF NOT EXISTS 'AB_POSITIVO';
ALTER TYPE "TipoSanguineo" ADD VALUE IF NOT EXISTS 'AB_NEGATIVO';
ALTER TYPE "TipoSanguineo" ADD VALUE IF NOT EXISTS 'O_POSITIVO';
ALTER TYPE "TipoSanguineo" ADD VALUE IF NOT EXISTS 'O_NEGATIVO';
ALTER TYPE "TipoSanguineo" ADD VALUE IF NOT EXISTS 'DESCONHECIDO';

DO $$ BEGIN
  CREATE TYPE "SexoBiologico" AS ENUM ('MASCULINO', 'FEMININO', 'INTERSEXO');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
ALTER TYPE "SexoBiologico" ADD VALUE IF NOT EXISTS 'MASCULINO';
ALTER TYPE "SexoBiologico" ADD VALUE IF NOT EXISTS 'FEMININO';
ALTER TYPE "SexoBiologico" ADD VALUE IF NOT EXISTS 'INTERSEXO';

DO $$ BEGIN
  CREATE TYPE "ViaAdministracao" AS ENUM ('ORAL', 'INTRAVENOSA', 'INTRAMUSCULAR', 'SUBCUTANEA', 'TOPICA', 'INALATORIA', 'SUBLINGUAL', 'RETAL', 'OFTALMICA', 'OTOLOGICA', 'NASAL');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
ALTER TYPE "ViaAdministracao" ADD VALUE IF NOT EXISTS 'ORAL';
ALTER TYPE "ViaAdministracao" ADD VALUE IF NOT EXISTS 'INTRAVENOSA';
ALTER TYPE "ViaAdministracao" ADD VALUE IF NOT EXISTS 'INTRAMUSCULAR';
ALTER TYPE "ViaAdministracao" ADD VALUE IF NOT EXISTS 'SUBCUTANEA';
ALTER TYPE "ViaAdministracao" ADD VALUE IF NOT EXISTS 'TOPICA';
ALTER TYPE "ViaAdministracao" ADD VALUE IF NOT EXISTS 'INALATORIA';
ALTER TYPE "ViaAdministracao" ADD VALUE IF NOT EXISTS 'SUBLINGUAL';
ALTER TYPE "ViaAdministracao" ADD VALUE IF NOT EXISTS 'RETAL';
ALTER TYPE "ViaAdministracao" ADD VALUE IF NOT EXISTS 'OFTALMICA';
ALTER TYPE "ViaAdministracao" ADD VALUE IF NOT EXISTS 'OTOLOGICA';
ALTER TYPE "ViaAdministracao" ADD VALUE IF NOT EXISTS 'NASAL';

DO $$ BEGIN
  CREATE TYPE "StatusPrescricaoItem" AS ENUM ('PENDENTE', 'APLICADO', 'RECUSADO', 'SUSPENSO');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
ALTER TYPE "StatusPrescricaoItem" ADD VALUE IF NOT EXISTS 'PENDENTE';
ALTER TYPE "StatusPrescricaoItem" ADD VALUE IF NOT EXISTS 'APLICADO';
ALTER TYPE "StatusPrescricaoItem" ADD VALUE IF NOT EXISTS 'RECUSADO';
ALTER TYPE "StatusPrescricaoItem" ADD VALUE IF NOT EXISTS 'SUSPENSO';

DO $$ BEGIN
  CREATE TYPE "UrgenciaExame" AS ENUM ('ROTINA', 'URGENTE', 'EMERGENCIAL');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
ALTER TYPE "UrgenciaExame" ADD VALUE IF NOT EXISTS 'ROTINA';
ALTER TYPE "UrgenciaExame" ADD VALUE IF NOT EXISTS 'URGENTE';
ALTER TYPE "UrgenciaExame" ADD VALUE IF NOT EXISTS 'EMERGENCIAL';

DO $$ BEGIN
  CREATE TYPE "CategoriaExame" AS ENUM ('LABORATORIO', 'IMAGEM', 'CARDIOLOGIA', 'PROCEDIMENTO', 'OUTRO');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
ALTER TYPE "CategoriaExame" ADD VALUE IF NOT EXISTS 'LABORATORIO';
ALTER TYPE "CategoriaExame" ADD VALUE IF NOT EXISTS 'IMAGEM';
ALTER TYPE "CategoriaExame" ADD VALUE IF NOT EXISTS 'CARDIOLOGIA';
ALTER TYPE "CategoriaExame" ADD VALUE IF NOT EXISTS 'PROCEDIMENTO';
ALTER TYPE "CategoriaExame" ADD VALUE IF NOT EXISTS 'OUTRO';

DO $$ BEGIN
  CREATE TYPE "TipoEncaminhamento" AS ENUM ('EXTERNO', 'INTERNACAO');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
ALTER TYPE "TipoEncaminhamento" ADD VALUE IF NOT EXISTS 'EXTERNO';
ALTER TYPE "TipoEncaminhamento" ADD VALUE IF NOT EXISTS 'INTERNACAO';

DO $$ BEGIN
  CREATE TYPE "StatusLaudoInternacao" AS ENUM ('RASCUNHO', 'SOLICITADO', 'AUTORIZADO');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
ALTER TYPE "StatusLaudoInternacao" ADD VALUE IF NOT EXISTS 'RASCUNHO';
ALTER TYPE "StatusLaudoInternacao" ADD VALUE IF NOT EXISTS 'SOLICITADO';
ALTER TYPE "StatusLaudoInternacao" ADD VALUE IF NOT EXISTS 'AUTORIZADO';

DO $$ BEGIN
  CREATE TYPE "StatusFichaInternacaoAlta" AS ENUM ('RASCUNHO', 'EM_ANDAMENTO', 'CONCLUIDA');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
ALTER TYPE "StatusFichaInternacaoAlta" ADD VALUE IF NOT EXISTS 'RASCUNHO';
ALTER TYPE "StatusFichaInternacaoAlta" ADD VALUE IF NOT EXISTS 'EM_ANDAMENTO';
ALTER TYPE "StatusFichaInternacaoAlta" ADD VALUE IF NOT EXISTS 'CONCLUIDA';

DO $$ BEGIN
  CREATE TYPE "StatusFichaCcih" AS ENUM ('RASCUNHO', 'NOTIFICADO', 'EM_ANALISE', 'CONCLUIDO');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
ALTER TYPE "StatusFichaCcih" ADD VALUE IF NOT EXISTS 'RASCUNHO';
ALTER TYPE "StatusFichaCcih" ADD VALUE IF NOT EXISTS 'NOTIFICADO';
ALTER TYPE "StatusFichaCcih" ADD VALUE IF NOT EXISTS 'EM_ANALISE';
ALTER TYPE "StatusFichaCcih" ADD VALUE IF NOT EXISTS 'CONCLUIDO';

DO $$ BEGIN
  CREATE TYPE "TipoInfeccaoCcih" AS ENUM ('ITU', 'PNEUMONIA_VENTILACAO', 'ISC', 'ICS', 'BACTERIEMIA_PRIMARIA', 'MENINGITE', 'INFECCAO_CATETER', 'OUTRA');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
ALTER TYPE "TipoInfeccaoCcih" ADD VALUE IF NOT EXISTS 'ITU';
ALTER TYPE "TipoInfeccaoCcih" ADD VALUE IF NOT EXISTS 'PNEUMONIA_VENTILACAO';
ALTER TYPE "TipoInfeccaoCcih" ADD VALUE IF NOT EXISTS 'ISC';
ALTER TYPE "TipoInfeccaoCcih" ADD VALUE IF NOT EXISTS 'ICS';
ALTER TYPE "TipoInfeccaoCcih" ADD VALUE IF NOT EXISTS 'BACTERIEMIA_PRIMARIA';
ALTER TYPE "TipoInfeccaoCcih" ADD VALUE IF NOT EXISTS 'MENINGITE';
ALTER TYPE "TipoInfeccaoCcih" ADD VALUE IF NOT EXISTS 'INFECCAO_CATETER';
ALTER TYPE "TipoInfeccaoCcih" ADD VALUE IF NOT EXISTS 'OUTRA';

DO $$ BEGIN
  CREATE TYPE "StatusFichaMultidisciplinar" AS ENUM ('RASCUNHO', 'EM_ANDAMENTO', 'CONCLUIDA');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
ALTER TYPE "StatusFichaMultidisciplinar" ADD VALUE IF NOT EXISTS 'RASCUNHO';
ALTER TYPE "StatusFichaMultidisciplinar" ADD VALUE IF NOT EXISTS 'EM_ANDAMENTO';
ALTER TYPE "StatusFichaMultidisciplinar" ADD VALUE IF NOT EXISTS 'CONCLUIDA';

DO $$ BEGIN
  CREATE TYPE "TurnoEvolucaoInternacao" AS ENUM ('DIURNA', 'NOTURNA');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
ALTER TYPE "TurnoEvolucaoInternacao" ADD VALUE IF NOT EXISTS 'DIURNA';
ALTER TYPE "TurnoEvolucaoInternacao" ADD VALUE IF NOT EXISTS 'NOTURNA';

DO $$ BEGIN
  CREATE TYPE "StatusFichaEvolucaoTurno" AS ENUM ('RASCUNHO', 'REGISTRADA');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
ALTER TYPE "StatusFichaEvolucaoTurno" ADD VALUE IF NOT EXISTS 'RASCUNHO';
ALTER TYPE "StatusFichaEvolucaoTurno" ADD VALUE IF NOT EXISTS 'REGISTRADA';

DO $$ BEGIN
  CREATE TYPE "TipoAcaoAuditoria" AS ENUM ('CRIACAO', 'ATUALIZACAO', 'EXCLUSAO', 'VISUALIZACAO', 'LOGIN', 'LOGOUT', 'CHAMADA_PAINEL');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
ALTER TYPE "TipoAcaoAuditoria" ADD VALUE IF NOT EXISTS 'CRIACAO';
ALTER TYPE "TipoAcaoAuditoria" ADD VALUE IF NOT EXISTS 'ATUALIZACAO';
ALTER TYPE "TipoAcaoAuditoria" ADD VALUE IF NOT EXISTS 'EXCLUSAO';
ALTER TYPE "TipoAcaoAuditoria" ADD VALUE IF NOT EXISTS 'VISUALIZACAO';
ALTER TYPE "TipoAcaoAuditoria" ADD VALUE IF NOT EXISTS 'LOGIN';
ALTER TYPE "TipoAcaoAuditoria" ADD VALUE IF NOT EXISTS 'LOGOUT';
ALTER TYPE "TipoAcaoAuditoria" ADD VALUE IF NOT EXISTS 'CHAMADA_PAINEL';

-- ------------------------------------------------------------------
-- 2. Tabelas (cria as que faltam) e colunas (adiciona as que faltam)
-- ------------------------------------------------------------------

-- usuarios
CREATE TABLE IF NOT EXISTS "usuarios" (
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
ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "id" TEXT;
ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "email" TEXT;
ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "senhaHash" TEXT;
ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "nome" TEXT;
ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "role" "Role";
ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "crm" TEXT;
ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "coren" TEXT;
ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "cpf" TEXT;
ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "telefone" TEXT;
ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "ativo" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "mfaSecret" TEXT;
ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "mfaAtivo" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "ultimoAcesso" TIMESTAMP(3);
ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

-- tokens_redefinicao_senha
CREATE TABLE IF NOT EXISTS "tokens_redefinicao_senha" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tokens_redefinicao_senha_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "tokens_redefinicao_senha" ADD COLUMN IF NOT EXISTS "id" TEXT;
ALTER TABLE "tokens_redefinicao_senha" ADD COLUMN IF NOT EXISTS "tokenHash" TEXT;
ALTER TABLE "tokens_redefinicao_senha" ADD COLUMN IF NOT EXISTS "usuarioId" TEXT;
ALTER TABLE "tokens_redefinicao_senha" ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "tokens_redefinicao_senha" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- pacientes
CREATE TABLE IF NOT EXISTS "pacientes" (
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
ALTER TABLE "pacientes" ADD COLUMN IF NOT EXISTS "id" TEXT;
ALTER TABLE "pacientes" ADD COLUMN IF NOT EXISTS "cpfCriptografado" TEXT;
ALTER TABLE "pacientes" ADD COLUMN IF NOT EXISTS "cpfHash" TEXT;
ALTER TABLE "pacientes" ADD COLUMN IF NOT EXISTS "nomeCriptografado" TEXT;
ALTER TABLE "pacientes" ADD COLUMN IF NOT EXISTS "nomeExibicao" TEXT;
ALTER TABLE "pacientes" ADD COLUMN IF NOT EXISTS "rgCriptografado" TEXT;
ALTER TABLE "pacientes" ADD COLUMN IF NOT EXISTS "dataNascimento" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "pacientes" ADD COLUMN IF NOT EXISTS "sexoBiologico" "SexoBiologico";
ALTER TABLE "pacientes" ADD COLUMN IF NOT EXISTS "genero" TEXT;
ALTER TABLE "pacientes" ADD COLUMN IF NOT EXISTS "telefoneCriptografado" TEXT;
ALTER TABLE "pacientes" ADD COLUMN IF NOT EXISTS "tipoSanguineo" "TipoSanguineo" NOT NULL DEFAULT 'DESCONHECIDO';
ALTER TABLE "pacientes" ADD COLUMN IF NOT EXISTS "convenio" TEXT;
ALTER TABLE "pacientes" ADD COLUMN IF NOT EXISTS "numeroCarteirinha" TEXT;
ALTER TABLE "pacientes" ADD COLUMN IF NOT EXISTS "observacoesIniciais" TEXT;
ALTER TABLE "pacientes" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "pacientes" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "pacientes" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
ALTER TABLE "pacientes" ADD COLUMN IF NOT EXISTS "acompanhanteNome" TEXT;
ALTER TABLE "pacientes" ADD COLUMN IF NOT EXISTS "acompanhanteTelefone" TEXT;
ALTER TABLE "pacientes" ADD COLUMN IF NOT EXISTS "cns" TEXT;
ALTER TABLE "pacientes" ADD COLUMN IF NOT EXISTS "escolaridade" TEXT;
ALTER TABLE "pacientes" ADD COLUMN IF NOT EXISTS "naturalidade" TEXT;
ALTER TABLE "pacientes" ADD COLUMN IF NOT EXISTS "nomeMae" TEXT;
ALTER TABLE "pacientes" ADD COLUMN IF NOT EXISTS "profissao" TEXT;
ALTER TABLE "pacientes" ADD COLUMN IF NOT EXISTS "racaCor" TEXT;

-- enderecos
CREATE TABLE IF NOT EXISTS "enderecos" (
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
ALTER TABLE "enderecos" ADD COLUMN IF NOT EXISTS "id" TEXT;
ALTER TABLE "enderecos" ADD COLUMN IF NOT EXISTS "pacienteId" TEXT;
ALTER TABLE "enderecos" ADD COLUMN IF NOT EXISTS "cep" TEXT;
ALTER TABLE "enderecos" ADD COLUMN IF NOT EXISTS "logradouro" TEXT;
ALTER TABLE "enderecos" ADD COLUMN IF NOT EXISTS "numero" TEXT;
ALTER TABLE "enderecos" ADD COLUMN IF NOT EXISTS "complemento" TEXT;
ALTER TABLE "enderecos" ADD COLUMN IF NOT EXISTS "bairro" TEXT;
ALTER TABLE "enderecos" ADD COLUMN IF NOT EXISTS "cidade" TEXT;
ALTER TABLE "enderecos" ADD COLUMN IF NOT EXISTS "estado" CHAR(2);
ALTER TABLE "enderecos" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "enderecos" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- alergias
CREATE TABLE IF NOT EXISTS "alergias" (
    "id" TEXT NOT NULL,
    "pacienteId" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "gravidade" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alergias_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "alergias" ADD COLUMN IF NOT EXISTS "id" TEXT;
ALTER TABLE "alergias" ADD COLUMN IF NOT EXISTS "pacienteId" TEXT;
ALTER TABLE "alergias" ADD COLUMN IF NOT EXISTS "descricao" TEXT;
ALTER TABLE "alergias" ADD COLUMN IF NOT EXISTS "gravidade" TEXT;
ALTER TABLE "alergias" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- medicamentos_continuos
CREATE TABLE IF NOT EXISTS "medicamentos_continuos" (
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
ALTER TABLE "medicamentos_continuos" ADD COLUMN IF NOT EXISTS "id" TEXT;
ALTER TABLE "medicamentos_continuos" ADD COLUMN IF NOT EXISTS "pacienteId" TEXT;
ALTER TABLE "medicamentos_continuos" ADD COLUMN IF NOT EXISTS "nome" TEXT;
ALTER TABLE "medicamentos_continuos" ADD COLUMN IF NOT EXISTS "dose" TEXT;
ALTER TABLE "medicamentos_continuos" ADD COLUMN IF NOT EXISTS "frequencia" TEXT;
ALTER TABLE "medicamentos_continuos" ADD COLUMN IF NOT EXISTS "observacoes" TEXT;
ALTER TABLE "medicamentos_continuos" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "medicamentos_continuos" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- documentos_pacientes
CREATE TABLE IF NOT EXISTS "documentos_pacientes" (
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
ALTER TABLE "documentos_pacientes" ADD COLUMN IF NOT EXISTS "id" TEXT;
ALTER TABLE "documentos_pacientes" ADD COLUMN IF NOT EXISTS "pacienteId" TEXT;
ALTER TABLE "documentos_pacientes" ADD COLUMN IF NOT EXISTS "tipo" TEXT;
ALTER TABLE "documentos_pacientes" ADD COLUMN IF NOT EXISTS "nomeArquivo" TEXT;
ALTER TABLE "documentos_pacientes" ADD COLUMN IF NOT EXISTS "mimeType" TEXT;
ALTER TABLE "documentos_pacientes" ADD COLUMN IF NOT EXISTS "tamanhoBytes" INTEGER;
ALTER TABLE "documentos_pacientes" ADD COLUMN IF NOT EXISTS "caminhoArquivo" TEXT;
ALTER TABLE "documentos_pacientes" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- atendimentos
CREATE TABLE IF NOT EXISTS "atendimentos" (
    "id" TEXT NOT NULL,
    "numeroAtendimento" TEXT NOT NULL,
    "pacienteId" TEXT NOT NULL,
    "medicoId" TEXT,
    "status" "StatusAtendimento" NOT NULL DEFAULT 'AGUARDANDO_TRIAGEM',
    "setor" TEXT,
    "sala" TEXT,
    "leitoId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "origemId" TEXT,
    "obstetrico" BOOLEAN NOT NULL DEFAULT false,
    "vaiInternar" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "atendimentos_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "atendimentos" ADD COLUMN IF NOT EXISTS "id" TEXT;
ALTER TABLE "atendimentos" ADD COLUMN IF NOT EXISTS "numeroAtendimento" TEXT;
ALTER TABLE "atendimentos" ADD COLUMN IF NOT EXISTS "pacienteId" TEXT;
ALTER TABLE "atendimentos" ADD COLUMN IF NOT EXISTS "medicoId" TEXT;
ALTER TABLE "atendimentos" ADD COLUMN IF NOT EXISTS "status" "StatusAtendimento" NOT NULL DEFAULT 'AGUARDANDO_TRIAGEM';
ALTER TABLE "atendimentos" ADD COLUMN IF NOT EXISTS "setor" TEXT;
ALTER TABLE "atendimentos" ADD COLUMN IF NOT EXISTS "sala" TEXT;
ALTER TABLE "atendimentos" ADD COLUMN IF NOT EXISTS "leitoId" TEXT;
ALTER TABLE "atendimentos" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "atendimentos" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "atendimentos" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
ALTER TABLE "atendimentos" ADD COLUMN IF NOT EXISTS "origemId" TEXT;
ALTER TABLE "atendimentos" ADD COLUMN IF NOT EXISTS "obstetrico" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "atendimentos" ADD COLUMN IF NOT EXISTS "vaiInternar" BOOLEAN NOT NULL DEFAULT false;

-- clinicas
CREATE TABLE IF NOT EXISTS "clinicas" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clinicas_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "clinicas" ADD COLUMN IF NOT EXISTS "id" TEXT;
ALTER TABLE "clinicas" ADD COLUMN IF NOT EXISTS "nome" TEXT;
ALTER TABLE "clinicas" ADD COLUMN IF NOT EXISTS "descricao" TEXT;
ALTER TABLE "clinicas" ADD COLUMN IF NOT EXISTS "ativo" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "clinicas" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "clinicas" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- leitos
CREATE TABLE IF NOT EXISTS "leitos" (
    "id" TEXT NOT NULL,
    "clinica" TEXT,
    "clinicaId" TEXT,
    "ala" TEXT NOT NULL,
    "quarto" TEXT,
    "codigo" TEXT NOT NULL,
    "tipo" "TipoLeitoHospitalar" NOT NULL DEFAULT 'ENFERMARIA',
    "status" "StatusLeitoHospitalar" NOT NULL DEFAULT 'DISPONIVEL',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leitos_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "leitos" ADD COLUMN IF NOT EXISTS "id" TEXT;
ALTER TABLE "leitos" ADD COLUMN IF NOT EXISTS "clinica" TEXT;
ALTER TABLE "leitos" ADD COLUMN IF NOT EXISTS "clinicaId" TEXT;
ALTER TABLE "leitos" ADD COLUMN IF NOT EXISTS "ala" TEXT;
ALTER TABLE "leitos" ADD COLUMN IF NOT EXISTS "quarto" TEXT;
ALTER TABLE "leitos" ADD COLUMN IF NOT EXISTS "codigo" TEXT;
ALTER TABLE "leitos" ADD COLUMN IF NOT EXISTS "tipo" "TipoLeitoHospitalar" NOT NULL DEFAULT 'ENFERMARIA';
ALTER TABLE "leitos" ADD COLUMN IF NOT EXISTS "status" "StatusLeitoHospitalar" NOT NULL DEFAULT 'DISPONIVEL';
ALTER TABLE "leitos" ADD COLUMN IF NOT EXISTS "ativo" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "leitos" ADD COLUMN IF NOT EXISTS "observacoes" TEXT;
ALTER TABLE "leitos" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "leitos" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- prescricoes_medicas_padrao
CREATE TABLE IF NOT EXISTS "prescricoes_medicas_padrao" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "observacoesPadrao" TEXT,
    "nomeColunaEsquerda" TEXT NOT NULL DEFAULT 'Prescrição médica',
    "nomeColunaDireita" TEXT NOT NULL DEFAULT 'Prescrição de medicamentos / enfermagem',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prescricoes_medicas_padrao_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "prescricoes_medicas_padrao" ADD COLUMN IF NOT EXISTS "id" TEXT;
ALTER TABLE "prescricoes_medicas_padrao" ADD COLUMN IF NOT EXISTS "nome" TEXT;
ALTER TABLE "prescricoes_medicas_padrao" ADD COLUMN IF NOT EXISTS "descricao" TEXT;
ALTER TABLE "prescricoes_medicas_padrao" ADD COLUMN IF NOT EXISTS "observacoesPadrao" TEXT;
ALTER TABLE "prescricoes_medicas_padrao" ADD COLUMN IF NOT EXISTS "nomeColunaEsquerda" TEXT NOT NULL DEFAULT 'Prescrição médica';
ALTER TABLE "prescricoes_medicas_padrao" ADD COLUMN IF NOT EXISTS "nomeColunaDireita" TEXT NOT NULL DEFAULT 'Prescrição de medicamentos / enfermagem';
ALTER TABLE "prescricoes_medicas_padrao" ADD COLUMN IF NOT EXISTS "ativo" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "prescricoes_medicas_padrao" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "prescricoes_medicas_padrao" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- itens_prescricao_medica_padrao
CREATE TABLE IF NOT EXISTS "itens_prescricao_medica_padrao" (
    "id" TEXT NOT NULL,
    "prescricaoMedicaPadraoId" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "tipoItem" TEXT NOT NULL DEFAULT 'LINHA_DUPLA',
    "nomeMedicamento" TEXT NOT NULL,
    "principioAtivo" TEXT,
    "dose" TEXT NOT NULL,
    "unidadeMedida" TEXT,
    "via" TEXT NOT NULL,
    "frequencia" TEXT NOT NULL,
    "quantidadeSolicitada" INTEGER NOT NULL DEFAULT 1,
    "duracaoDias" INTEGER,
    "observacoes" TEXT,

    CONSTRAINT "itens_prescricao_medica_padrao_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "itens_prescricao_medica_padrao" ADD COLUMN IF NOT EXISTS "id" TEXT;
ALTER TABLE "itens_prescricao_medica_padrao" ADD COLUMN IF NOT EXISTS "prescricaoMedicaPadraoId" TEXT;
ALTER TABLE "itens_prescricao_medica_padrao" ADD COLUMN IF NOT EXISTS "ordem" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "itens_prescricao_medica_padrao" ADD COLUMN IF NOT EXISTS "tipoItem" TEXT NOT NULL DEFAULT 'LINHA_DUPLA';
ALTER TABLE "itens_prescricao_medica_padrao" ADD COLUMN IF NOT EXISTS "nomeMedicamento" TEXT;
ALTER TABLE "itens_prescricao_medica_padrao" ADD COLUMN IF NOT EXISTS "principioAtivo" TEXT;
ALTER TABLE "itens_prescricao_medica_padrao" ADD COLUMN IF NOT EXISTS "dose" TEXT;
ALTER TABLE "itens_prescricao_medica_padrao" ADD COLUMN IF NOT EXISTS "unidadeMedida" TEXT;
ALTER TABLE "itens_prescricao_medica_padrao" ADD COLUMN IF NOT EXISTS "via" TEXT;
ALTER TABLE "itens_prescricao_medica_padrao" ADD COLUMN IF NOT EXISTS "frequencia" TEXT;
ALTER TABLE "itens_prescricao_medica_padrao" ADD COLUMN IF NOT EXISTS "quantidadeSolicitada" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "itens_prescricao_medica_padrao" ADD COLUMN IF NOT EXISTS "duracaoDias" INTEGER;
ALTER TABLE "itens_prescricao_medica_padrao" ADD COLUMN IF NOT EXISTS "observacoes" TEXT;

-- triagens
CREATE TABLE IF NOT EXISTS "triagens" (
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
ALTER TABLE "triagens" ADD COLUMN IF NOT EXISTS "id" TEXT;
ALTER TABLE "triagens" ADD COLUMN IF NOT EXISTS "atendimentoId" TEXT;
ALTER TABLE "triagens" ADD COLUMN IF NOT EXISTS "triadorId" TEXT;
ALTER TABLE "triagens" ADD COLUMN IF NOT EXISTS "corClassificacao" "CorTriagem";
ALTER TABLE "triagens" ADD COLUMN IF NOT EXISTS "queixaPrincipal" TEXT;
ALTER TABLE "triagens" ADD COLUMN IF NOT EXISTS "categoriaQueixa" TEXT;
ALTER TABLE "triagens" ADD COLUMN IF NOT EXISTS "entradaTriagem" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "triagens" ADD COLUMN IF NOT EXISTS "classificadoEm" TIMESTAMP(3);
ALTER TABLE "triagens" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "triagens" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "triagens" ADD COLUMN IF NOT EXISTS "acidenteTrabalho" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "triagens" ADD COLUMN IF NOT EXISTS "alergias" TEXT;
ALTER TABLE "triagens" ADD COLUMN IF NOT EXISTS "discriminador" TEXT;
ALTER TABLE "triagens" ADD COLUMN IF NOT EXISTS "doencasPreexistentes" TEXT;
ALTER TABLE "triagens" ADD COLUMN IF NOT EXISTS "especialidade" TEXT;
ALTER TABLE "triagens" ADD COLUMN IF NOT EXISTS "fluxograma" TEXT;
ALTER TABLE "triagens" ADD COLUMN IF NOT EXISTS "irradiacao" TEXT;
ALTER TABLE "triagens" ADD COLUMN IF NOT EXISTS "medicacoes" TEXT;
ALTER TABLE "triagens" ADD COLUMN IF NOT EXISTS "nivelConsciencia" TEXT;
ALTER TABLE "triagens" ADD COLUMN IF NOT EXISTS "regraDor" TEXT;
ALTER TABLE "triagens" ADD COLUMN IF NOT EXISTS "ritmo" TEXT;
ALTER TABLE "triagens" ADD COLUMN IF NOT EXISTS "tempoQueixa" TEXT;
ALTER TABLE "triagens" ADD COLUMN IF NOT EXISTS "tipoDorToracica" TEXT;
ALTER TABLE "triagens" ADD COLUMN IF NOT EXISTS "duracaoDor" TEXT;
ALTER TABLE "triagens" ADD COLUMN IF NOT EXISTS "localizacaoDor" TEXT;
ALTER TABLE "triagens" ADD COLUMN IF NOT EXISTS "irradiacaoDorSites" TEXT;
ALTER TABLE "triagens" ADD COLUMN IF NOT EXISTS "estadoConscienciaSinais" TEXT;

-- sinais_vitais
CREATE TABLE IF NOT EXISTS "sinais_vitais" (
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
ALTER TABLE "sinais_vitais" ADD COLUMN IF NOT EXISTS "id" TEXT;
ALTER TABLE "sinais_vitais" ADD COLUMN IF NOT EXISTS "triagemId" TEXT;
ALTER TABLE "sinais_vitais" ADD COLUMN IF NOT EXISTS "paSistolica" INTEGER;
ALTER TABLE "sinais_vitais" ADD COLUMN IF NOT EXISTS "paDiastolica" INTEGER;
ALTER TABLE "sinais_vitais" ADD COLUMN IF NOT EXISTS "frequenciaCardiaca" INTEGER;
ALTER TABLE "sinais_vitais" ADD COLUMN IF NOT EXISTS "frequenciaResp" INTEGER;
ALTER TABLE "sinais_vitais" ADD COLUMN IF NOT EXISTS "spo2" DECIMAL(5,2);
ALTER TABLE "sinais_vitais" ADD COLUMN IF NOT EXISTS "temperatura" DECIMAL(4,1);
ALTER TABLE "sinais_vitais" ADD COLUMN IF NOT EXISTS "glicemia" INTEGER;
ALTER TABLE "sinais_vitais" ADD COLUMN IF NOT EXISTS "escalaDor" INTEGER;
ALTER TABLE "sinais_vitais" ADD COLUMN IF NOT EXISTS "peso" DECIMAL(5,2);
ALTER TABLE "sinais_vitais" ADD COLUMN IF NOT EXISTS "altura" INTEGER;
ALTER TABLE "sinais_vitais" ADD COLUMN IF NOT EXISTS "imc" DECIMAL(4,2);
ALTER TABLE "sinais_vitais" ADD COLUMN IF NOT EXISTS "coletadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "sinais_vitais" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- chamadas_painel
CREATE TABLE IF NOT EXISTS "chamadas_painel" (
    "id" TEXT NOT NULL,
    "atendimentoId" TEXT NOT NULL,
    "chamadoPorId" TEXT NOT NULL,
    "salaDestino" TEXT NOT NULL,
    "setorPainel" TEXT NOT NULL DEFAULT 'GERAL',
    "chamadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chamadas_painel_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "chamadas_painel" ADD COLUMN IF NOT EXISTS "id" TEXT;
ALTER TABLE "chamadas_painel" ADD COLUMN IF NOT EXISTS "atendimentoId" TEXT;
ALTER TABLE "chamadas_painel" ADD COLUMN IF NOT EXISTS "chamadoPorId" TEXT;
ALTER TABLE "chamadas_painel" ADD COLUMN IF NOT EXISTS "salaDestino" TEXT;
ALTER TABLE "chamadas_painel" ADD COLUMN IF NOT EXISTS "setorPainel" TEXT NOT NULL DEFAULT 'GERAL';
ALTER TABLE "chamadas_painel" ADD COLUMN IF NOT EXISTS "chamadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- prontuarios_medicos
CREATE TABLE IF NOT EXISTS "prontuarios_medicos" (
    "id" TEXT NOT NULL,
    "atendimentoId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "encerradoEm" TIMESTAMP(3),
    "encerradoPorId" TEXT,

    CONSTRAINT "prontuarios_medicos_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "prontuarios_medicos" ADD COLUMN IF NOT EXISTS "id" TEXT;
ALTER TABLE "prontuarios_medicos" ADD COLUMN IF NOT EXISTS "atendimentoId" TEXT;
ALTER TABLE "prontuarios_medicos" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "prontuarios_medicos" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "prontuarios_medicos" ADD COLUMN IF NOT EXISTS "encerradoEm" TIMESTAMP(3);
ALTER TABLE "prontuarios_medicos" ADD COLUMN IF NOT EXISTS "encerradoPorId" TEXT;

-- anamneses
CREATE TABLE IF NOT EXISTS "anamneses" (
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
ALTER TABLE "anamneses" ADD COLUMN IF NOT EXISTS "id" TEXT;
ALTER TABLE "anamneses" ADD COLUMN IF NOT EXISTS "prontuarioId" TEXT;
ALTER TABLE "anamneses" ADD COLUMN IF NOT EXISTS "queixaPrincipal" TEXT;
ALTER TABLE "anamneses" ADD COLUMN IF NOT EXISTS "hda" TEXT;
ALTER TABLE "anamneses" ADD COLUMN IF NOT EXISTS "antecedentesP" TEXT;
ALTER TABLE "anamneses" ADD COLUMN IF NOT EXISTS "antecedentesF" TEXT;
ALTER TABLE "anamneses" ADD COLUMN IF NOT EXISTS "antecedentesC" TEXT;
ALTER TABLE "anamneses" ADD COLUMN IF NOT EXISTS "habitosVida" JSONB;
ALTER TABLE "anamneses" ADD COLUMN IF NOT EXISTS "revisaoSistemas" JSONB;
ALTER TABLE "anamneses" ADD COLUMN IF NOT EXISTS "exameFisico" JSONB;
ALTER TABLE "anamneses" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "anamneses" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- diagnosticos
CREATE TABLE IF NOT EXISTS "diagnosticos" (
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
ALTER TABLE "diagnosticos" ADD COLUMN IF NOT EXISTS "id" TEXT;
ALTER TABLE "diagnosticos" ADD COLUMN IF NOT EXISTS "prontuarioId" TEXT;
ALTER TABLE "diagnosticos" ADD COLUMN IF NOT EXISTS "codigoCid" TEXT;
ALTER TABLE "diagnosticos" ADD COLUMN IF NOT EXISTS "descricaoCid" TEXT;
ALTER TABLE "diagnosticos" ADD COLUMN IF NOT EXISTS "hipotese" TEXT;
ALTER TABLE "diagnosticos" ADD COLUMN IF NOT EXISTS "principal" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "diagnosticos" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "diagnosticos" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- prescricoes
CREATE TABLE IF NOT EXISTS "prescricoes" (
    "id" TEXT NOT NULL,
    "prontuarioId" TEXT NOT NULL,
    "tipo" "TipoPrescricao" NOT NULL DEFAULT 'PS',
    "numeroPrescricao" INTEGER NOT NULL DEFAULT 1,
    "emitidaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validaAte" TIMESTAMP(3),
    "observacoes" TEXT,
    "pdfCaminho" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prescricoes_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "prescricoes" ADD COLUMN IF NOT EXISTS "id" TEXT;
ALTER TABLE "prescricoes" ADD COLUMN IF NOT EXISTS "prontuarioId" TEXT;
ALTER TABLE "prescricoes" ADD COLUMN IF NOT EXISTS "tipo" "TipoPrescricao" NOT NULL DEFAULT 'PS';
ALTER TABLE "prescricoes" ADD COLUMN IF NOT EXISTS "numeroPrescricao" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "prescricoes" ADD COLUMN IF NOT EXISTS "emitidaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "prescricoes" ADD COLUMN IF NOT EXISTS "validaAte" TIMESTAMP(3);
ALTER TABLE "prescricoes" ADD COLUMN IF NOT EXISTS "observacoes" TEXT;
ALTER TABLE "prescricoes" ADD COLUMN IF NOT EXISTS "pdfCaminho" TEXT;
ALTER TABLE "prescricoes" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "prescricoes" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- itens_prescricao
CREATE TABLE IF NOT EXISTS "itens_prescricao" (
    "id" TEXT NOT NULL,
    "prescricaoId" TEXT NOT NULL,
    "nomeMedicamento" TEXT NOT NULL,
    "dose" TEXT NOT NULL,
    "unidadeMedida" TEXT,
    "via" "ViaAdministracao" NOT NULL,
    "frequencia" TEXT NOT NULL,
    "duracaoDias" INTEGER,
    "observacoes" TEXT,
    "status" "StatusPrescricaoItem" NOT NULL DEFAULT 'PENDENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "itens_prescricao_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "itens_prescricao" ADD COLUMN IF NOT EXISTS "id" TEXT;
ALTER TABLE "itens_prescricao" ADD COLUMN IF NOT EXISTS "prescricaoId" TEXT;
ALTER TABLE "itens_prescricao" ADD COLUMN IF NOT EXISTS "nomeMedicamento" TEXT;
ALTER TABLE "itens_prescricao" ADD COLUMN IF NOT EXISTS "dose" TEXT;
ALTER TABLE "itens_prescricao" ADD COLUMN IF NOT EXISTS "unidadeMedida" TEXT;
ALTER TABLE "itens_prescricao" ADD COLUMN IF NOT EXISTS "via" "ViaAdministracao";
ALTER TABLE "itens_prescricao" ADD COLUMN IF NOT EXISTS "frequencia" TEXT;
ALTER TABLE "itens_prescricao" ADD COLUMN IF NOT EXISTS "duracaoDias" INTEGER;
ALTER TABLE "itens_prescricao" ADD COLUMN IF NOT EXISTS "observacoes" TEXT;
ALTER TABLE "itens_prescricao" ADD COLUMN IF NOT EXISTS "status" "StatusPrescricaoItem" NOT NULL DEFAULT 'PENDENTE';
ALTER TABLE "itens_prescricao" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "itens_prescricao" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- aplicacoes_medicamentos
CREATE TABLE IF NOT EXISTS "aplicacoes_medicamentos" (
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
ALTER TABLE "aplicacoes_medicamentos" ADD COLUMN IF NOT EXISTS "id" TEXT;
ALTER TABLE "aplicacoes_medicamentos" ADD COLUMN IF NOT EXISTS "itemPrescricaoId" TEXT;
ALTER TABLE "aplicacoes_medicamentos" ADD COLUMN IF NOT EXISTS "aplicadoPorId" TEXT;
ALTER TABLE "aplicacoes_medicamentos" ADD COLUMN IF NOT EXISTS "doseAplicada" TEXT;
ALTER TABLE "aplicacoes_medicamentos" ADD COLUMN IF NOT EXISTS "via" "ViaAdministracao";
ALTER TABLE "aplicacoes_medicamentos" ADD COLUMN IF NOT EXISTS "aplicadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "aplicacoes_medicamentos" ADD COLUMN IF NOT EXISTS "checklistConfirmado" JSONB;
ALTER TABLE "aplicacoes_medicamentos" ADD COLUMN IF NOT EXISTS "observacoes" TEXT;
ALTER TABLE "aplicacoes_medicamentos" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- requisicoes_exames
CREATE TABLE IF NOT EXISTS "requisicoes_exames" (
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
ALTER TABLE "requisicoes_exames" ADD COLUMN IF NOT EXISTS "id" TEXT;
ALTER TABLE "requisicoes_exames" ADD COLUMN IF NOT EXISTS "prontuarioId" TEXT;
ALTER TABLE "requisicoes_exames" ADD COLUMN IF NOT EXISTS "categoria" "CategoriaExame";
ALTER TABLE "requisicoes_exames" ADD COLUMN IF NOT EXISTS "urgencia" "UrgenciaExame" NOT NULL DEFAULT 'ROTINA';
ALTER TABLE "requisicoes_exames" ADD COLUMN IF NOT EXISTS "indicacao" TEXT;
ALTER TABLE "requisicoes_exames" ADD COLUMN IF NOT EXISTS "pdfCaminho" TEXT;
ALTER TABLE "requisicoes_exames" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "requisicoes_exames" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- itens_requisicao
CREATE TABLE IF NOT EXISTS "itens_requisicao" (
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
ALTER TABLE "itens_requisicao" ADD COLUMN IF NOT EXISTS "id" TEXT;
ALTER TABLE "itens_requisicao" ADD COLUMN IF NOT EXISTS "requisicaoId" TEXT;
ALTER TABLE "itens_requisicao" ADD COLUMN IF NOT EXISTS "nomeExame" TEXT;
ALTER TABLE "itens_requisicao" ADD COLUMN IF NOT EXISTS "codigoTuss" TEXT;
ALTER TABLE "itens_requisicao" ADD COLUMN IF NOT EXISTS "observacoes" TEXT;
ALTER TABLE "itens_requisicao" ADD COLUMN IF NOT EXISTS "resultado" TEXT;
ALTER TABLE "itens_requisicao" ADD COLUMN IF NOT EXISTS "resultadoPdf" TEXT;
ALTER TABLE "itens_requisicao" ADD COLUMN IF NOT EXISTS "realizadoEm" TIMESTAMP(3);
ALTER TABLE "itens_requisicao" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "itens_requisicao" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- evolucoes_medicas
CREATE TABLE IF NOT EXISTS "evolucoes_medicas" (
    "id" TEXT NOT NULL,
    "prontuarioId" TEXT NOT NULL,
    "autorId" TEXT NOT NULL,
    "conteudo" TEXT NOT NULL,
    "template" TEXT,
    "registradoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evolucoes_medicas_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "evolucoes_medicas" ADD COLUMN IF NOT EXISTS "id" TEXT;
ALTER TABLE "evolucoes_medicas" ADD COLUMN IF NOT EXISTS "prontuarioId" TEXT;
ALTER TABLE "evolucoes_medicas" ADD COLUMN IF NOT EXISTS "autorId" TEXT;
ALTER TABLE "evolucoes_medicas" ADD COLUMN IF NOT EXISTS "conteudo" TEXT;
ALTER TABLE "evolucoes_medicas" ADD COLUMN IF NOT EXISTS "template" TEXT;
ALTER TABLE "evolucoes_medicas" ADD COLUMN IF NOT EXISTS "registradoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- laudos_internacao
CREATE TABLE IF NOT EXISTS "laudos_internacao" (
    "id" TEXT NOT NULL,
    "atendimentoId" TEXT NOT NULL,
    "status" "StatusLaudoInternacao" NOT NULL DEFAULT 'RASCUNHO',
    "nomeEstabelecimentoSolicitante" TEXT,
    "cnesSolicitante" TEXT,
    "nomeEstabelecimentoExecutante" TEXT,
    "cnesExecutante" TEXT,
    "nomePaciente" TEXT,
    "numeroProntuario" TEXT,
    "cns" TEXT,
    "dataNascimento" TIMESTAMP(3),
    "sexoCodigo" TEXT,
    "nomeMae" TEXT,
    "telefoneDdd" TEXT,
    "telefoneNumero" TEXT,
    "enderecoCompleto" TEXT,
    "municipioResidencia" TEXT,
    "codigoIbgeMunicipio" TEXT,
    "uf" CHAR(2),
    "cep" TEXT,
    "sinaisSintomas" TEXT,
    "condicoesJustificativa" TEXT,
    "resultadosDiagnosticos" TEXT,
    "diagnosticoInicial" TEXT,
    "cidPrincipal" TEXT,
    "cidSecundario" TEXT,
    "cidAssociadas" TEXT,
    "descricaoProcedimento" TEXT,
    "codigoProcedimento" TEXT,
    "clinica" TEXT,
    "caraterInternacao" TEXT,
    "documentoProfissionalTipo" TEXT,
    "documentoProfissionalNumero" TEXT,
    "nomeProfissionalSolicitante" TEXT,
    "dataSolicitacao" TIMESTAMP(3),
    "registroConselho" TEXT,
    "causasExternas" JSONB,
    "autorizacao" JSONB,
    "preenchidoPorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "laudos_internacao_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "laudos_internacao" ADD COLUMN IF NOT EXISTS "id" TEXT;
ALTER TABLE "laudos_internacao" ADD COLUMN IF NOT EXISTS "atendimentoId" TEXT;
ALTER TABLE "laudos_internacao" ADD COLUMN IF NOT EXISTS "status" "StatusLaudoInternacao" NOT NULL DEFAULT 'RASCUNHO';
ALTER TABLE "laudos_internacao" ADD COLUMN IF NOT EXISTS "nomeEstabelecimentoSolicitante" TEXT;
ALTER TABLE "laudos_internacao" ADD COLUMN IF NOT EXISTS "cnesSolicitante" TEXT;
ALTER TABLE "laudos_internacao" ADD COLUMN IF NOT EXISTS "nomeEstabelecimentoExecutante" TEXT;
ALTER TABLE "laudos_internacao" ADD COLUMN IF NOT EXISTS "cnesExecutante" TEXT;
ALTER TABLE "laudos_internacao" ADD COLUMN IF NOT EXISTS "nomePaciente" TEXT;
ALTER TABLE "laudos_internacao" ADD COLUMN IF NOT EXISTS "numeroProntuario" TEXT;
ALTER TABLE "laudos_internacao" ADD COLUMN IF NOT EXISTS "cns" TEXT;
ALTER TABLE "laudos_internacao" ADD COLUMN IF NOT EXISTS "dataNascimento" TIMESTAMP(3);
ALTER TABLE "laudos_internacao" ADD COLUMN IF NOT EXISTS "sexoCodigo" TEXT;
ALTER TABLE "laudos_internacao" ADD COLUMN IF NOT EXISTS "nomeMae" TEXT;
ALTER TABLE "laudos_internacao" ADD COLUMN IF NOT EXISTS "telefoneDdd" TEXT;
ALTER TABLE "laudos_internacao" ADD COLUMN IF NOT EXISTS "telefoneNumero" TEXT;
ALTER TABLE "laudos_internacao" ADD COLUMN IF NOT EXISTS "enderecoCompleto" TEXT;
ALTER TABLE "laudos_internacao" ADD COLUMN IF NOT EXISTS "municipioResidencia" TEXT;
ALTER TABLE "laudos_internacao" ADD COLUMN IF NOT EXISTS "codigoIbgeMunicipio" TEXT;
ALTER TABLE "laudos_internacao" ADD COLUMN IF NOT EXISTS "uf" CHAR(2);
ALTER TABLE "laudos_internacao" ADD COLUMN IF NOT EXISTS "cep" TEXT;
ALTER TABLE "laudos_internacao" ADD COLUMN IF NOT EXISTS "sinaisSintomas" TEXT;
ALTER TABLE "laudos_internacao" ADD COLUMN IF NOT EXISTS "condicoesJustificativa" TEXT;
ALTER TABLE "laudos_internacao" ADD COLUMN IF NOT EXISTS "resultadosDiagnosticos" TEXT;
ALTER TABLE "laudos_internacao" ADD COLUMN IF NOT EXISTS "diagnosticoInicial" TEXT;
ALTER TABLE "laudos_internacao" ADD COLUMN IF NOT EXISTS "cidPrincipal" TEXT;
ALTER TABLE "laudos_internacao" ADD COLUMN IF NOT EXISTS "cidSecundario" TEXT;
ALTER TABLE "laudos_internacao" ADD COLUMN IF NOT EXISTS "cidAssociadas" TEXT;
ALTER TABLE "laudos_internacao" ADD COLUMN IF NOT EXISTS "descricaoProcedimento" TEXT;
ALTER TABLE "laudos_internacao" ADD COLUMN IF NOT EXISTS "codigoProcedimento" TEXT;
ALTER TABLE "laudos_internacao" ADD COLUMN IF NOT EXISTS "clinica" TEXT;
ALTER TABLE "laudos_internacao" ADD COLUMN IF NOT EXISTS "caraterInternacao" TEXT;
ALTER TABLE "laudos_internacao" ADD COLUMN IF NOT EXISTS "documentoProfissionalTipo" TEXT;
ALTER TABLE "laudos_internacao" ADD COLUMN IF NOT EXISTS "documentoProfissionalNumero" TEXT;
ALTER TABLE "laudos_internacao" ADD COLUMN IF NOT EXISTS "nomeProfissionalSolicitante" TEXT;
ALTER TABLE "laudos_internacao" ADD COLUMN IF NOT EXISTS "dataSolicitacao" TIMESTAMP(3);
ALTER TABLE "laudos_internacao" ADD COLUMN IF NOT EXISTS "registroConselho" TEXT;
ALTER TABLE "laudos_internacao" ADD COLUMN IF NOT EXISTS "causasExternas" JSONB;
ALTER TABLE "laudos_internacao" ADD COLUMN IF NOT EXISTS "autorizacao" JSONB;
ALTER TABLE "laudos_internacao" ADD COLUMN IF NOT EXISTS "preenchidoPorId" TEXT;
ALTER TABLE "laudos_internacao" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "laudos_internacao" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- fichas_internacao_alta
CREATE TABLE IF NOT EXISTS "fichas_internacao_alta" (
    "id" TEXT NOT NULL,
    "atendimentoId" TEXT NOT NULL,
    "status" "StatusFichaInternacaoAlta" NOT NULL DEFAULT 'RASCUNHO',
    "nomePaciente" TEXT,
    "numeroProntuario" TEXT,
    "dadosFormulario" JSONB,
    "preenchidoPorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fichas_internacao_alta_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "fichas_internacao_alta" ADD COLUMN IF NOT EXISTS "id" TEXT;
ALTER TABLE "fichas_internacao_alta" ADD COLUMN IF NOT EXISTS "atendimentoId" TEXT;
ALTER TABLE "fichas_internacao_alta" ADD COLUMN IF NOT EXISTS "status" "StatusFichaInternacaoAlta" NOT NULL DEFAULT 'RASCUNHO';
ALTER TABLE "fichas_internacao_alta" ADD COLUMN IF NOT EXISTS "nomePaciente" TEXT;
ALTER TABLE "fichas_internacao_alta" ADD COLUMN IF NOT EXISTS "numeroProntuario" TEXT;
ALTER TABLE "fichas_internacao_alta" ADD COLUMN IF NOT EXISTS "dadosFormulario" JSONB;
ALTER TABLE "fichas_internacao_alta" ADD COLUMN IF NOT EXISTS "preenchidoPorId" TEXT;
ALTER TABLE "fichas_internacao_alta" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "fichas_internacao_alta" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- fichas_ccih
CREATE TABLE IF NOT EXISTS "fichas_ccih" (
    "id" TEXT NOT NULL,
    "atendimentoId" TEXT NOT NULL,
    "status" "StatusFichaCcih" NOT NULL DEFAULT 'RASCUNHO',
    "nomePaciente" TEXT,
    "numeroProntuario" TEXT,
    "dataNascimento" TIMESTAMP(3),
    "sexo" TEXT,
    "setorUnidade" TEXT,
    "leitoDescricao" TEXT,
    "dataInternacao" TIMESTAMP(3),
    "diagnosticoPrincipal" TEXT,
    "cidPrincipal" TEXT,
    "procedimentoRelacionado" TEXT,
    "tipoInfeccao" "TipoInfeccaoCcih",
    "tipoInfeccaoOutro" TEXT,
    "topografia" TEXT,
    "dataInicioSinais" TIMESTAMP(3),
    "sinaisSintomas" TEXT,
    "resultadosLaboratorio" TEXT,
    "microorganismoIdentificado" TEXT,
    "sensibilidadeAntimicrobianos" TEXT,
    "fatoresRisco" JSONB,
    "dispositivos" JSONB,
    "antibioticoterapiaEmUso" TEXT,
    "antibioticoterapiaPrevio" TEXT,
    "dataNotificacao" TIMESTAMP(3),
    "nomeProfissionalNotificador" TEXT,
    "conselhoProfissional" TEXT,
    "funcaoProfissional" TEXT,
    "observacoesEquipe" TEXT,
    "parecerCcih" TEXT,
    "dadosFormulario" JSONB,
    "preenchidoPorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fichas_ccih_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "fichas_ccih" ADD COLUMN IF NOT EXISTS "id" TEXT;
ALTER TABLE "fichas_ccih" ADD COLUMN IF NOT EXISTS "atendimentoId" TEXT;
ALTER TABLE "fichas_ccih" ADD COLUMN IF NOT EXISTS "status" "StatusFichaCcih" NOT NULL DEFAULT 'RASCUNHO';
ALTER TABLE "fichas_ccih" ADD COLUMN IF NOT EXISTS "nomePaciente" TEXT;
ALTER TABLE "fichas_ccih" ADD COLUMN IF NOT EXISTS "numeroProntuario" TEXT;
ALTER TABLE "fichas_ccih" ADD COLUMN IF NOT EXISTS "dataNascimento" TIMESTAMP(3);
ALTER TABLE "fichas_ccih" ADD COLUMN IF NOT EXISTS "sexo" TEXT;
ALTER TABLE "fichas_ccih" ADD COLUMN IF NOT EXISTS "setorUnidade" TEXT;
ALTER TABLE "fichas_ccih" ADD COLUMN IF NOT EXISTS "leitoDescricao" TEXT;
ALTER TABLE "fichas_ccih" ADD COLUMN IF NOT EXISTS "dataInternacao" TIMESTAMP(3);
ALTER TABLE "fichas_ccih" ADD COLUMN IF NOT EXISTS "diagnosticoPrincipal" TEXT;
ALTER TABLE "fichas_ccih" ADD COLUMN IF NOT EXISTS "cidPrincipal" TEXT;
ALTER TABLE "fichas_ccih" ADD COLUMN IF NOT EXISTS "procedimentoRelacionado" TEXT;
ALTER TABLE "fichas_ccih" ADD COLUMN IF NOT EXISTS "tipoInfeccao" "TipoInfeccaoCcih";
ALTER TABLE "fichas_ccih" ADD COLUMN IF NOT EXISTS "tipoInfeccaoOutro" TEXT;
ALTER TABLE "fichas_ccih" ADD COLUMN IF NOT EXISTS "topografia" TEXT;
ALTER TABLE "fichas_ccih" ADD COLUMN IF NOT EXISTS "dataInicioSinais" TIMESTAMP(3);
ALTER TABLE "fichas_ccih" ADD COLUMN IF NOT EXISTS "sinaisSintomas" TEXT;
ALTER TABLE "fichas_ccih" ADD COLUMN IF NOT EXISTS "resultadosLaboratorio" TEXT;
ALTER TABLE "fichas_ccih" ADD COLUMN IF NOT EXISTS "microorganismoIdentificado" TEXT;
ALTER TABLE "fichas_ccih" ADD COLUMN IF NOT EXISTS "sensibilidadeAntimicrobianos" TEXT;
ALTER TABLE "fichas_ccih" ADD COLUMN IF NOT EXISTS "fatoresRisco" JSONB;
ALTER TABLE "fichas_ccih" ADD COLUMN IF NOT EXISTS "dispositivos" JSONB;
ALTER TABLE "fichas_ccih" ADD COLUMN IF NOT EXISTS "antibioticoterapiaEmUso" TEXT;
ALTER TABLE "fichas_ccih" ADD COLUMN IF NOT EXISTS "antibioticoterapiaPrevio" TEXT;
ALTER TABLE "fichas_ccih" ADD COLUMN IF NOT EXISTS "dataNotificacao" TIMESTAMP(3);
ALTER TABLE "fichas_ccih" ADD COLUMN IF NOT EXISTS "nomeProfissionalNotificador" TEXT;
ALTER TABLE "fichas_ccih" ADD COLUMN IF NOT EXISTS "conselhoProfissional" TEXT;
ALTER TABLE "fichas_ccih" ADD COLUMN IF NOT EXISTS "funcaoProfissional" TEXT;
ALTER TABLE "fichas_ccih" ADD COLUMN IF NOT EXISTS "observacoesEquipe" TEXT;
ALTER TABLE "fichas_ccih" ADD COLUMN IF NOT EXISTS "parecerCcih" TEXT;
ALTER TABLE "fichas_ccih" ADD COLUMN IF NOT EXISTS "dadosFormulario" JSONB;
ALTER TABLE "fichas_ccih" ADD COLUMN IF NOT EXISTS "preenchidoPorId" TEXT;
ALTER TABLE "fichas_ccih" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "fichas_ccih" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- fichas_multidisciplinares
CREATE TABLE IF NOT EXISTS "fichas_multidisciplinares" (
    "id" TEXT NOT NULL,
    "atendimentoId" TEXT NOT NULL,
    "status" "StatusFichaMultidisciplinar" NOT NULL DEFAULT 'RASCUNHO',
    "nomePaciente" TEXT,
    "numeroProntuario" TEXT,
    "dataNascimento" TIMESTAMP(3),
    "sexo" TEXT,
    "setorUnidade" TEXT,
    "leitoDescricao" TEXT,
    "dataInternacao" TIMESTAMP(3),
    "diagnosticoPrincipal" TEXT,
    "cidPrincipal" TEXT,
    "medico" JSONB,
    "enfermagem" JSONB,
    "nutricao" JSONB,
    "fisioterapia" JSONB,
    "psicologia" JSONB,
    "farmacia" JSONB,
    "planoConjunto" JSONB,
    "preenchidoPorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fichas_multidisciplinares_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "fichas_multidisciplinares" ADD COLUMN IF NOT EXISTS "id" TEXT;
ALTER TABLE "fichas_multidisciplinares" ADD COLUMN IF NOT EXISTS "atendimentoId" TEXT;
ALTER TABLE "fichas_multidisciplinares" ADD COLUMN IF NOT EXISTS "status" "StatusFichaMultidisciplinar" NOT NULL DEFAULT 'RASCUNHO';
ALTER TABLE "fichas_multidisciplinares" ADD COLUMN IF NOT EXISTS "nomePaciente" TEXT;
ALTER TABLE "fichas_multidisciplinares" ADD COLUMN IF NOT EXISTS "numeroProntuario" TEXT;
ALTER TABLE "fichas_multidisciplinares" ADD COLUMN IF NOT EXISTS "dataNascimento" TIMESTAMP(3);
ALTER TABLE "fichas_multidisciplinares" ADD COLUMN IF NOT EXISTS "sexo" TEXT;
ALTER TABLE "fichas_multidisciplinares" ADD COLUMN IF NOT EXISTS "setorUnidade" TEXT;
ALTER TABLE "fichas_multidisciplinares" ADD COLUMN IF NOT EXISTS "leitoDescricao" TEXT;
ALTER TABLE "fichas_multidisciplinares" ADD COLUMN IF NOT EXISTS "dataInternacao" TIMESTAMP(3);
ALTER TABLE "fichas_multidisciplinares" ADD COLUMN IF NOT EXISTS "diagnosticoPrincipal" TEXT;
ALTER TABLE "fichas_multidisciplinares" ADD COLUMN IF NOT EXISTS "cidPrincipal" TEXT;
ALTER TABLE "fichas_multidisciplinares" ADD COLUMN IF NOT EXISTS "medico" JSONB;
ALTER TABLE "fichas_multidisciplinares" ADD COLUMN IF NOT EXISTS "enfermagem" JSONB;
ALTER TABLE "fichas_multidisciplinares" ADD COLUMN IF NOT EXISTS "nutricao" JSONB;
ALTER TABLE "fichas_multidisciplinares" ADD COLUMN IF NOT EXISTS "fisioterapia" JSONB;
ALTER TABLE "fichas_multidisciplinares" ADD COLUMN IF NOT EXISTS "psicologia" JSONB;
ALTER TABLE "fichas_multidisciplinares" ADD COLUMN IF NOT EXISTS "farmacia" JSONB;
ALTER TABLE "fichas_multidisciplinares" ADD COLUMN IF NOT EXISTS "planoConjunto" JSONB;
ALTER TABLE "fichas_multidisciplinares" ADD COLUMN IF NOT EXISTS "preenchidoPorId" TEXT;
ALTER TABLE "fichas_multidisciplinares" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "fichas_multidisciplinares" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- fichas_evolucao_turno
CREATE TABLE IF NOT EXISTS "fichas_evolucao_turno" (
    "id" TEXT NOT NULL,
    "atendimentoId" TEXT NOT NULL,
    "turno" "TurnoEvolucaoInternacao" NOT NULL,
    "dataReferencia" TIMESTAMP(3) NOT NULL,
    "status" "StatusFichaEvolucaoTurno" NOT NULL DEFAULT 'RASCUNHO',
    "nomePaciente" TEXT,
    "numeroProntuario" TEXT,
    "setorUnidade" TEXT,
    "leitoDescricao" TEXT,
    "estadoGeral" TEXT,
    "evolucaoClinica" TEXT,
    "exameFisico" TEXT,
    "sinaisVitais" JSONB,
    "avaliacaoSistemas" JSONB,
    "dietaEliminacoes" TEXT,
    "medicamentosProcedimentos" TEXT,
    "intercorrencias" TEXT,
    "condutaProximoTurno" TEXT,
    "nomeProfissional" TEXT,
    "conselhoProfissional" TEXT,
    "funcaoProfissional" TEXT,
    "preenchidoPorId" TEXT,
    "registradoEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fichas_evolucao_turno_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "fichas_evolucao_turno" ADD COLUMN IF NOT EXISTS "id" TEXT;
ALTER TABLE "fichas_evolucao_turno" ADD COLUMN IF NOT EXISTS "atendimentoId" TEXT;
ALTER TABLE "fichas_evolucao_turno" ADD COLUMN IF NOT EXISTS "turno" "TurnoEvolucaoInternacao";
ALTER TABLE "fichas_evolucao_turno" ADD COLUMN IF NOT EXISTS "dataReferencia" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "fichas_evolucao_turno" ADD COLUMN IF NOT EXISTS "status" "StatusFichaEvolucaoTurno" NOT NULL DEFAULT 'RASCUNHO';
ALTER TABLE "fichas_evolucao_turno" ADD COLUMN IF NOT EXISTS "nomePaciente" TEXT;
ALTER TABLE "fichas_evolucao_turno" ADD COLUMN IF NOT EXISTS "numeroProntuario" TEXT;
ALTER TABLE "fichas_evolucao_turno" ADD COLUMN IF NOT EXISTS "setorUnidade" TEXT;
ALTER TABLE "fichas_evolucao_turno" ADD COLUMN IF NOT EXISTS "leitoDescricao" TEXT;
ALTER TABLE "fichas_evolucao_turno" ADD COLUMN IF NOT EXISTS "estadoGeral" TEXT;
ALTER TABLE "fichas_evolucao_turno" ADD COLUMN IF NOT EXISTS "evolucaoClinica" TEXT;
ALTER TABLE "fichas_evolucao_turno" ADD COLUMN IF NOT EXISTS "exameFisico" TEXT;
ALTER TABLE "fichas_evolucao_turno" ADD COLUMN IF NOT EXISTS "sinaisVitais" JSONB;
ALTER TABLE "fichas_evolucao_turno" ADD COLUMN IF NOT EXISTS "avaliacaoSistemas" JSONB;
ALTER TABLE "fichas_evolucao_turno" ADD COLUMN IF NOT EXISTS "dietaEliminacoes" TEXT;
ALTER TABLE "fichas_evolucao_turno" ADD COLUMN IF NOT EXISTS "medicamentosProcedimentos" TEXT;
ALTER TABLE "fichas_evolucao_turno" ADD COLUMN IF NOT EXISTS "intercorrencias" TEXT;
ALTER TABLE "fichas_evolucao_turno" ADD COLUMN IF NOT EXISTS "condutaProximoTurno" TEXT;
ALTER TABLE "fichas_evolucao_turno" ADD COLUMN IF NOT EXISTS "nomeProfissional" TEXT;
ALTER TABLE "fichas_evolucao_turno" ADD COLUMN IF NOT EXISTS "conselhoProfissional" TEXT;
ALTER TABLE "fichas_evolucao_turno" ADD COLUMN IF NOT EXISTS "funcaoProfissional" TEXT;
ALTER TABLE "fichas_evolucao_turno" ADD COLUMN IF NOT EXISTS "preenchidoPorId" TEXT;
ALTER TABLE "fichas_evolucao_turno" ADD COLUMN IF NOT EXISTS "registradoEm" TIMESTAMP(3);
ALTER TABLE "fichas_evolucao_turno" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "fichas_evolucao_turno" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- fichas_sinais_vitais
CREATE TABLE IF NOT EXISTS "fichas_sinais_vitais" (
    "id" TEXT NOT NULL,
    "atendimentoId" TEXT NOT NULL,
    "dataReferencia" TIMESTAMP(3) NOT NULL,
    "nomePaciente" TEXT,
    "numeroProntuario" TEXT,
    "leitoDescricao" TEXT,
    "controleHorario" JSONB,
    "balancoHidrico" JSONB,
    "preenchidoPorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fichas_sinais_vitais_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "fichas_sinais_vitais" ADD COLUMN IF NOT EXISTS "id" TEXT;
ALTER TABLE "fichas_sinais_vitais" ADD COLUMN IF NOT EXISTS "atendimentoId" TEXT;
ALTER TABLE "fichas_sinais_vitais" ADD COLUMN IF NOT EXISTS "dataReferencia" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "fichas_sinais_vitais" ADD COLUMN IF NOT EXISTS "nomePaciente" TEXT;
ALTER TABLE "fichas_sinais_vitais" ADD COLUMN IF NOT EXISTS "numeroProntuario" TEXT;
ALTER TABLE "fichas_sinais_vitais" ADD COLUMN IF NOT EXISTS "leitoDescricao" TEXT;
ALTER TABLE "fichas_sinais_vitais" ADD COLUMN IF NOT EXISTS "controleHorario" JSONB;
ALTER TABLE "fichas_sinais_vitais" ADD COLUMN IF NOT EXISTS "balancoHidrico" JSONB;
ALTER TABLE "fichas_sinais_vitais" ADD COLUMN IF NOT EXISTS "preenchidoPorId" TEXT;
ALTER TABLE "fichas_sinais_vitais" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "fichas_sinais_vitais" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- fichas_sae
CREATE TABLE IF NOT EXISTS "fichas_sae" (
    "id" TEXT NOT NULL,
    "atendimentoId" TEXT NOT NULL,
    "dataReferencia" TIMESTAMP(3) NOT NULL,
    "nomePaciente" TEXT,
    "numeroProntuario" TEXT,
    "leitoDescricao" TEXT,
    "selecoes" JSONB,
    "textos" JSONB,
    "diagnosticos" JSONB,
    "prescricoes" JSONB,
    "registroDiurno" TEXT,
    "registroNoturno" TEXT,
    "preenchidoPorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fichas_sae_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "fichas_sae" ADD COLUMN IF NOT EXISTS "id" TEXT;
ALTER TABLE "fichas_sae" ADD COLUMN IF NOT EXISTS "atendimentoId" TEXT;
ALTER TABLE "fichas_sae" ADD COLUMN IF NOT EXISTS "dataReferencia" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "fichas_sae" ADD COLUMN IF NOT EXISTS "nomePaciente" TEXT;
ALTER TABLE "fichas_sae" ADD COLUMN IF NOT EXISTS "numeroProntuario" TEXT;
ALTER TABLE "fichas_sae" ADD COLUMN IF NOT EXISTS "leitoDescricao" TEXT;
ALTER TABLE "fichas_sae" ADD COLUMN IF NOT EXISTS "selecoes" JSONB;
ALTER TABLE "fichas_sae" ADD COLUMN IF NOT EXISTS "textos" JSONB;
ALTER TABLE "fichas_sae" ADD COLUMN IF NOT EXISTS "diagnosticos" JSONB;
ALTER TABLE "fichas_sae" ADD COLUMN IF NOT EXISTS "prescricoes" JSONB;
ALTER TABLE "fichas_sae" ADD COLUMN IF NOT EXISTS "registroDiurno" TEXT;
ALTER TABLE "fichas_sae" ADD COLUMN IF NOT EXISTS "registroNoturno" TEXT;
ALTER TABLE "fichas_sae" ADD COLUMN IF NOT EXISTS "preenchidoPorId" TEXT;
ALTER TABLE "fichas_sae" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "fichas_sae" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- evolucoes_multiprofissional
CREATE TABLE IF NOT EXISTS "evolucoes_multiprofissional" (
    "id" TEXT NOT NULL,
    "atendimentoId" TEXT NOT NULL,
    "dataHora" TIMESTAMP(3) NOT NULL,
    "evolucao" TEXT NOT NULL,
    "categoria" TEXT,
    "nomeProfissional" TEXT,
    "conselho" TEXT,
    "registradoPorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evolucoes_multiprofissional_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "evolucoes_multiprofissional" ADD COLUMN IF NOT EXISTS "id" TEXT;
ALTER TABLE "evolucoes_multiprofissional" ADD COLUMN IF NOT EXISTS "atendimentoId" TEXT;
ALTER TABLE "evolucoes_multiprofissional" ADD COLUMN IF NOT EXISTS "dataHora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "evolucoes_multiprofissional" ADD COLUMN IF NOT EXISTS "evolucao" TEXT;
ALTER TABLE "evolucoes_multiprofissional" ADD COLUMN IF NOT EXISTS "categoria" TEXT;
ALTER TABLE "evolucoes_multiprofissional" ADD COLUMN IF NOT EXISTS "nomeProfissional" TEXT;
ALTER TABLE "evolucoes_multiprofissional" ADD COLUMN IF NOT EXISTS "conselho" TEXT;
ALTER TABLE "evolucoes_multiprofissional" ADD COLUMN IF NOT EXISTS "registradoPorId" TEXT;
ALTER TABLE "evolucoes_multiprofissional" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- fichas_internacao_obstetrica
CREATE TABLE IF NOT EXISTS "fichas_internacao_obstetrica" (
    "id" TEXT NOT NULL,
    "atendimentoId" TEXT NOT NULL,
    "nomePaciente" TEXT,
    "numeroProntuario" TEXT,
    "leitoDescricao" TEXT,
    "campos" JSONB,
    "trabalhoParto" JSONB,
    "puerperio" JSONB,
    "recemNascido" JSONB,
    "condicoesAlta" JSONB,
    "preenchidoPorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fichas_internacao_obstetrica_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "fichas_internacao_obstetrica" ADD COLUMN IF NOT EXISTS "id" TEXT;
ALTER TABLE "fichas_internacao_obstetrica" ADD COLUMN IF NOT EXISTS "atendimentoId" TEXT;
ALTER TABLE "fichas_internacao_obstetrica" ADD COLUMN IF NOT EXISTS "nomePaciente" TEXT;
ALTER TABLE "fichas_internacao_obstetrica" ADD COLUMN IF NOT EXISTS "numeroProntuario" TEXT;
ALTER TABLE "fichas_internacao_obstetrica" ADD COLUMN IF NOT EXISTS "leitoDescricao" TEXT;
ALTER TABLE "fichas_internacao_obstetrica" ADD COLUMN IF NOT EXISTS "campos" JSONB;
ALTER TABLE "fichas_internacao_obstetrica" ADD COLUMN IF NOT EXISTS "trabalhoParto" JSONB;
ALTER TABLE "fichas_internacao_obstetrica" ADD COLUMN IF NOT EXISTS "puerperio" JSONB;
ALTER TABLE "fichas_internacao_obstetrica" ADD COLUMN IF NOT EXISTS "recemNascido" JSONB;
ALTER TABLE "fichas_internacao_obstetrica" ADD COLUMN IF NOT EXISTS "condicoesAlta" JSONB;
ALTER TABLE "fichas_internacao_obstetrica" ADD COLUMN IF NOT EXISTS "preenchidoPorId" TEXT;
ALTER TABLE "fichas_internacao_obstetrica" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "fichas_internacao_obstetrica" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- fichas_bercario
CREATE TABLE IF NOT EXISTS "fichas_bercario" (
    "id" TEXT NOT NULL,
    "atendimentoId" TEXT NOT NULL,
    "nomePaciente" TEXT,
    "numeroProntuario" TEXT,
    "leitoDescricao" TEXT,
    "campos" JSONB,
    "evolucao" JSONB,
    "preenchidoPorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fichas_bercario_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "fichas_bercario" ADD COLUMN IF NOT EXISTS "id" TEXT;
ALTER TABLE "fichas_bercario" ADD COLUMN IF NOT EXISTS "atendimentoId" TEXT;
ALTER TABLE "fichas_bercario" ADD COLUMN IF NOT EXISTS "nomePaciente" TEXT;
ALTER TABLE "fichas_bercario" ADD COLUMN IF NOT EXISTS "numeroProntuario" TEXT;
ALTER TABLE "fichas_bercario" ADD COLUMN IF NOT EXISTS "leitoDescricao" TEXT;
ALTER TABLE "fichas_bercario" ADD COLUMN IF NOT EXISTS "campos" JSONB;
ALTER TABLE "fichas_bercario" ADD COLUMN IF NOT EXISTS "evolucao" JSONB;
ALTER TABLE "fichas_bercario" ADD COLUMN IF NOT EXISTS "preenchidoPorId" TEXT;
ALTER TABLE "fichas_bercario" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "fichas_bercario" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- encaminhamentos
CREATE TABLE IF NOT EXISTS "encaminhamentos" (
    "id" TEXT NOT NULL,
    "prontuarioId" TEXT NOT NULL,
    "tipo" "TipoEncaminhamento" NOT NULL,
    "especialidade" TEXT NOT NULL,
    "medicoDestinoId" TEXT,
    "prioridade" TEXT,
    "resumoClinco" TEXT,
    "justificativa" TEXT,
    "cidInternacao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "encaminhamentos_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "encaminhamentos" ADD COLUMN IF NOT EXISTS "id" TEXT;
ALTER TABLE "encaminhamentos" ADD COLUMN IF NOT EXISTS "prontuarioId" TEXT;
ALTER TABLE "encaminhamentos" ADD COLUMN IF NOT EXISTS "tipo" "TipoEncaminhamento";
ALTER TABLE "encaminhamentos" ADD COLUMN IF NOT EXISTS "especialidade" TEXT;
ALTER TABLE "encaminhamentos" ADD COLUMN IF NOT EXISTS "medicoDestinoId" TEXT;
ALTER TABLE "encaminhamentos" ADD COLUMN IF NOT EXISTS "prioridade" TEXT;
ALTER TABLE "encaminhamentos" ADD COLUMN IF NOT EXISTS "resumoClinco" TEXT;
ALTER TABLE "encaminhamentos" ADD COLUMN IF NOT EXISTS "justificativa" TEXT;
ALTER TABLE "encaminhamentos" ADD COLUMN IF NOT EXISTS "cidInternacao" TEXT;
ALTER TABLE "encaminhamentos" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "encaminhamentos" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- logs_auditoria
CREATE TABLE IF NOT EXISTS "logs_auditoria" (
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
ALTER TABLE "logs_auditoria" ADD COLUMN IF NOT EXISTS "id" TEXT;
ALTER TABLE "logs_auditoria" ADD COLUMN IF NOT EXISTS "usuarioId" TEXT;
ALTER TABLE "logs_auditoria" ADD COLUMN IF NOT EXISTS "acao" "TipoAcaoAuditoria";
ALTER TABLE "logs_auditoria" ADD COLUMN IF NOT EXISTS "entidade" TEXT;
ALTER TABLE "logs_auditoria" ADD COLUMN IF NOT EXISTS "entidadeId" TEXT;
ALTER TABLE "logs_auditoria" ADD COLUMN IF NOT EXISTS "campo" TEXT;
ALTER TABLE "logs_auditoria" ADD COLUMN IF NOT EXISTS "valorAnterior" TEXT;
ALTER TABLE "logs_auditoria" ADD COLUMN IF NOT EXISTS "valorNovo" TEXT;
ALTER TABLE "logs_auditoria" ADD COLUMN IF NOT EXISTS "ipOrigem" TEXT;
ALTER TABLE "logs_auditoria" ADD COLUMN IF NOT EXISTS "userAgent" TEXT;
ALTER TABLE "logs_auditoria" ADD COLUMN IF NOT EXISTS "registradoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- instituicoes
CREATE TABLE IF NOT EXISTS "instituicoes" (
    "id" TEXT NOT NULL,
    "nomeMunicipio" TEXT NOT NULL,
    "nomeInstituicao" TEXT NOT NULL,
    "cnes" TEXT,
    "codigoIbgeMunicipio" TEXT,
    "endereco" TEXT,
    "bairro" TEXT,
    "cidade" TEXT,
    "estado" CHAR(2),
    "cep" TEXT,
    "logomarcaUrl" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "instituicoes_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "instituicoes" ADD COLUMN IF NOT EXISTS "id" TEXT;
ALTER TABLE "instituicoes" ADD COLUMN IF NOT EXISTS "nomeMunicipio" TEXT;
ALTER TABLE "instituicoes" ADD COLUMN IF NOT EXISTS "nomeInstituicao" TEXT;
ALTER TABLE "instituicoes" ADD COLUMN IF NOT EXISTS "cnes" TEXT;
ALTER TABLE "instituicoes" ADD COLUMN IF NOT EXISTS "codigoIbgeMunicipio" TEXT;
ALTER TABLE "instituicoes" ADD COLUMN IF NOT EXISTS "endereco" TEXT;
ALTER TABLE "instituicoes" ADD COLUMN IF NOT EXISTS "bairro" TEXT;
ALTER TABLE "instituicoes" ADD COLUMN IF NOT EXISTS "cidade" TEXT;
ALTER TABLE "instituicoes" ADD COLUMN IF NOT EXISTS "estado" CHAR(2);
ALTER TABLE "instituicoes" ADD COLUMN IF NOT EXISTS "cep" TEXT;
ALTER TABLE "instituicoes" ADD COLUMN IF NOT EXISTS "logomarcaUrl" TEXT;
ALTER TABLE "instituicoes" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- config_painel
CREATE TABLE IF NOT EXISTS "config_painel" (
    "id" TEXT NOT NULL,
    "vozAtiva" BOOLEAN NOT NULL DEFAULT true,
    "tipoVoz" TEXT NOT NULL DEFAULT 'feminina',
    "corPrimaria" TEXT NOT NULL DEFAULT '#2563eb',
    "corSecundaria" TEXT NOT NULL DEFAULT '#f8fafc',
    "corTexto" TEXT NOT NULL DEFAULT '#1e293b',
    "mensagemPadrao" TEXT NOT NULL DEFAULT 'Comparecer ao consultório',
    "velocidadeVoz" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "layoutDividido" BOOLEAN NOT NULL DEFAULT false,
    "intervaloRotacaoSegundos" INTEGER NOT NULL DEFAULT 8,
    "posicaoMidia" TEXT NOT NULL DEFAULT 'esquerda',
    "imagensRotativas" JSONB NOT NULL DEFAULT '[]',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "config_painel_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "config_painel" ADD COLUMN IF NOT EXISTS "id" TEXT;
ALTER TABLE "config_painel" ADD COLUMN IF NOT EXISTS "vozAtiva" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "config_painel" ADD COLUMN IF NOT EXISTS "tipoVoz" TEXT NOT NULL DEFAULT 'feminina';
ALTER TABLE "config_painel" ADD COLUMN IF NOT EXISTS "corPrimaria" TEXT NOT NULL DEFAULT '#2563eb';
ALTER TABLE "config_painel" ADD COLUMN IF NOT EXISTS "corSecundaria" TEXT NOT NULL DEFAULT '#f8fafc';
ALTER TABLE "config_painel" ADD COLUMN IF NOT EXISTS "corTexto" TEXT NOT NULL DEFAULT '#1e293b';
ALTER TABLE "config_painel" ADD COLUMN IF NOT EXISTS "mensagemPadrao" TEXT NOT NULL DEFAULT 'Comparecer ao consultório';
ALTER TABLE "config_painel" ADD COLUMN IF NOT EXISTS "velocidadeVoz" DOUBLE PRECISION NOT NULL DEFAULT 1.0;
ALTER TABLE "config_painel" ADD COLUMN IF NOT EXISTS "layoutDividido" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "config_painel" ADD COLUMN IF NOT EXISTS "intervaloRotacaoSegundos" INTEGER NOT NULL DEFAULT 8;
ALTER TABLE "config_painel" ADD COLUMN IF NOT EXISTS "posicaoMidia" TEXT NOT NULL DEFAULT 'esquerda';
ALTER TABLE "config_painel" ADD COLUMN IF NOT EXISTS "imagensRotativas" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "config_painel" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- config_smtp
CREATE TABLE IF NOT EXISTS "config_smtp" (
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
ALTER TABLE "config_smtp" ADD COLUMN IF NOT EXISTS "id" TEXT;
ALTER TABLE "config_smtp" ADD COLUMN IF NOT EXISTS "host" TEXT NOT NULL DEFAULT '';
ALTER TABLE "config_smtp" ADD COLUMN IF NOT EXISTS "porta" INTEGER NOT NULL DEFAULT 587;
ALTER TABLE "config_smtp" ADD COLUMN IF NOT EXISTS "secure" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "config_smtp" ADD COLUMN IF NOT EXISTS "usuario" TEXT NOT NULL DEFAULT '';
ALTER TABLE "config_smtp" ADD COLUMN IF NOT EXISTS "senhaCriptografada" TEXT NOT NULL DEFAULT '';
ALTER TABLE "config_smtp" ADD COLUMN IF NOT EXISTS "emailRemetente" TEXT NOT NULL DEFAULT '';
ALTER TABLE "config_smtp" ADD COLUMN IF NOT EXISTS "nomeRemetente" TEXT;
ALTER TABLE "config_smtp" ADD COLUMN IF NOT EXISTS "ativo" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "config_smtp" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "config_smtp" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- origens_pacientes
CREATE TABLE IF NOT EXISTS "origens_pacientes" (
    "id" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "procedenciaFicha" TEXT,

    CONSTRAINT "origens_pacientes_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "origens_pacientes" ADD COLUMN IF NOT EXISTS "id" TEXT;
ALTER TABLE "origens_pacientes" ADD COLUMN IF NOT EXISTS "descricao" TEXT;
ALTER TABLE "origens_pacientes" ADD COLUMN IF NOT EXISTS "ativo" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "origens_pacientes" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "origens_pacientes" ADD COLUMN IF NOT EXISTS "procedenciaFicha" TEXT;

-- tb_medicamento
CREATE TABLE IF NOT EXISTS "tb_medicamento" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "principioAtivo" TEXT NOT NULL,
    "forma" TEXT,
    "concentracao" TEXT,
    "unidade" TEXT,
    "saldoAtual" INTEGER NOT NULL DEFAULT 0,
    "saldoReservado" INTEGER NOT NULL DEFAULT 0,
    "estoqueMinimo" INTEGER NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tb_medicamento_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "tb_medicamento" ADD COLUMN IF NOT EXISTS "id" TEXT;
ALTER TABLE "tb_medicamento" ADD COLUMN IF NOT EXISTS "nome" TEXT;
ALTER TABLE "tb_medicamento" ADD COLUMN IF NOT EXISTS "principioAtivo" TEXT;
ALTER TABLE "tb_medicamento" ADD COLUMN IF NOT EXISTS "forma" TEXT;
ALTER TABLE "tb_medicamento" ADD COLUMN IF NOT EXISTS "concentracao" TEXT;
ALTER TABLE "tb_medicamento" ADD COLUMN IF NOT EXISTS "unidade" TEXT;
ALTER TABLE "tb_medicamento" ADD COLUMN IF NOT EXISTS "saldoAtual" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "tb_medicamento" ADD COLUMN IF NOT EXISTS "saldoReservado" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "tb_medicamento" ADD COLUMN IF NOT EXISTS "estoqueMinimo" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "tb_medicamento" ADD COLUMN IF NOT EXISTS "ativo" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "tb_medicamento" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "tb_medicamento" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- tb_medicamento_lote
CREATE TABLE IF NOT EXISTS "tb_medicamento_lote" (
    "id" TEXT NOT NULL,
    "medicamentoId" TEXT NOT NULL,
    "lote" TEXT NOT NULL,
    "validade" TIMESTAMP(3),
    "quantidade" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tb_medicamento_lote_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "tb_medicamento_lote" ADD COLUMN IF NOT EXISTS "id" TEXT;
ALTER TABLE "tb_medicamento_lote" ADD COLUMN IF NOT EXISTS "medicamentoId" TEXT;
ALTER TABLE "tb_medicamento_lote" ADD COLUMN IF NOT EXISTS "lote" TEXT;
ALTER TABLE "tb_medicamento_lote" ADD COLUMN IF NOT EXISTS "validade" TIMESTAMP(3);
ALTER TABLE "tb_medicamento_lote" ADD COLUMN IF NOT EXISTS "quantidade" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "tb_medicamento_lote" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "tb_medicamento_lote" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- tb_farmacia_movimentacao
CREATE TABLE IF NOT EXISTS "tb_farmacia_movimentacao" (
    "id" TEXT NOT NULL,
    "medicamentoId" TEXT NOT NULL,
    "loteId" TEXT,
    "tipo" "TipoMovimentacaoFarmacia" NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "saldoAnterior" INTEGER NOT NULL,
    "saldoPosterior" INTEGER NOT NULL,
    "referenciaTipo" TEXT,
    "referenciaId" TEXT,
    "usuarioId" TEXT,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tb_farmacia_movimentacao_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "tb_farmacia_movimentacao" ADD COLUMN IF NOT EXISTS "id" TEXT;
ALTER TABLE "tb_farmacia_movimentacao" ADD COLUMN IF NOT EXISTS "medicamentoId" TEXT;
ALTER TABLE "tb_farmacia_movimentacao" ADD COLUMN IF NOT EXISTS "loteId" TEXT;
ALTER TABLE "tb_farmacia_movimentacao" ADD COLUMN IF NOT EXISTS "tipo" "TipoMovimentacaoFarmacia";
ALTER TABLE "tb_farmacia_movimentacao" ADD COLUMN IF NOT EXISTS "quantidade" INTEGER;
ALTER TABLE "tb_farmacia_movimentacao" ADD COLUMN IF NOT EXISTS "saldoAnterior" INTEGER;
ALTER TABLE "tb_farmacia_movimentacao" ADD COLUMN IF NOT EXISTS "saldoPosterior" INTEGER;
ALTER TABLE "tb_farmacia_movimentacao" ADD COLUMN IF NOT EXISTS "referenciaTipo" TEXT;
ALTER TABLE "tb_farmacia_movimentacao" ADD COLUMN IF NOT EXISTS "referenciaId" TEXT;
ALTER TABLE "tb_farmacia_movimentacao" ADD COLUMN IF NOT EXISTS "usuarioId" TEXT;
ALTER TABLE "tb_farmacia_movimentacao" ADD COLUMN IF NOT EXISTS "observacoes" TEXT;
ALTER TABLE "tb_farmacia_movimentacao" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- tb_medicamento_sinonimo
CREATE TABLE IF NOT EXISTS "tb_medicamento_sinonimo" (
    "id" TEXT NOT NULL,
    "medicamentoId" TEXT NOT NULL,
    "sinonimo" TEXT NOT NULL,
    "sinonimoNorm" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tb_medicamento_sinonimo_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "tb_medicamento_sinonimo" ADD COLUMN IF NOT EXISTS "id" TEXT;
ALTER TABLE "tb_medicamento_sinonimo" ADD COLUMN IF NOT EXISTS "medicamentoId" TEXT;
ALTER TABLE "tb_medicamento_sinonimo" ADD COLUMN IF NOT EXISTS "sinonimo" TEXT;
ALTER TABLE "tb_medicamento_sinonimo" ADD COLUMN IF NOT EXISTS "sinonimoNorm" TEXT;
ALTER TABLE "tb_medicamento_sinonimo" ADD COLUMN IF NOT EXISTS "ativo" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "tb_medicamento_sinonimo" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "tb_medicamento_sinonimo" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- tb_interacao_matriz
CREATE TABLE IF NOT EXISTS "tb_interacao_matriz" (
    "id" TEXT NOT NULL,
    "principioAtivoA" TEXT NOT NULL,
    "principioAtivoB" TEXT NOT NULL,
    "risco" "RiscoInteracao" NOT NULL,
    "efeitoClinico" TEXT NOT NULL,
    "sugestaoSistema" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tb_interacao_matriz_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "tb_interacao_matriz" ADD COLUMN IF NOT EXISTS "id" TEXT;
ALTER TABLE "tb_interacao_matriz" ADD COLUMN IF NOT EXISTS "principioAtivoA" TEXT;
ALTER TABLE "tb_interacao_matriz" ADD COLUMN IF NOT EXISTS "principioAtivoB" TEXT;
ALTER TABLE "tb_interacao_matriz" ADD COLUMN IF NOT EXISTS "risco" "RiscoInteracao";
ALTER TABLE "tb_interacao_matriz" ADD COLUMN IF NOT EXISTS "efeitoClinico" TEXT;
ALTER TABLE "tb_interacao_matriz" ADD COLUMN IF NOT EXISTS "sugestaoSistema" TEXT;
ALTER TABLE "tb_interacao_matriz" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "tb_interacao_matriz" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- tb_prescricao_cabecalho
CREATE TABLE IF NOT EXISTS "tb_prescricao_cabecalho" (
    "id" TEXT NOT NULL,
    "atendimentoId" TEXT NOT NULL,
    "criadoPorId" TEXT NOT NULL,
    "statusValidacao" "StatusValidacaoFarmacia" NOT NULL DEFAULT 'AGUARDANDO_TRIAGEM',
    "observacoes" TEXT,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tb_prescricao_cabecalho_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "tb_prescricao_cabecalho" ADD COLUMN IF NOT EXISTS "id" TEXT;
ALTER TABLE "tb_prescricao_cabecalho" ADD COLUMN IF NOT EXISTS "atendimentoId" TEXT;
ALTER TABLE "tb_prescricao_cabecalho" ADD COLUMN IF NOT EXISTS "criadoPorId" TEXT;
ALTER TABLE "tb_prescricao_cabecalho" ADD COLUMN IF NOT EXISTS "statusValidacao" "StatusValidacaoFarmacia" NOT NULL DEFAULT 'AGUARDANDO_TRIAGEM';
ALTER TABLE "tb_prescricao_cabecalho" ADD COLUMN IF NOT EXISTS "observacoes" TEXT;
ALTER TABLE "tb_prescricao_cabecalho" ADD COLUMN IF NOT EXISTS "ativa" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "tb_prescricao_cabecalho" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "tb_prescricao_cabecalho" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- tb_prescricao_item
CREATE TABLE IF NOT EXISTS "tb_prescricao_item" (
    "id" TEXT NOT NULL,
    "prescricaoId" TEXT NOT NULL,
    "medicamentoId" TEXT,
    "medicamentoNome" TEXT NOT NULL,
    "principioAtivo" TEXT NOT NULL,
    "quantidadeSolicitada" INTEGER NOT NULL DEFAULT 1,
    "dose" TEXT NOT NULL,
    "via" "ViaAdministracao" NOT NULL,
    "frequencia" TEXT NOT NULL,
    "duracaoDias" INTEGER,
    "observacoes" TEXT,
    "justificativaMedica" TEXT,
    "alertasInteracao" JSONB,
    "statusValidacao" "StatusValidacaoFarmacia" NOT NULL DEFAULT 'AGUARDANDO_TRIAGEM',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tb_prescricao_item_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "tb_prescricao_item" ADD COLUMN IF NOT EXISTS "id" TEXT;
ALTER TABLE "tb_prescricao_item" ADD COLUMN IF NOT EXISTS "prescricaoId" TEXT;
ALTER TABLE "tb_prescricao_item" ADD COLUMN IF NOT EXISTS "medicamentoId" TEXT;
ALTER TABLE "tb_prescricao_item" ADD COLUMN IF NOT EXISTS "medicamentoNome" TEXT;
ALTER TABLE "tb_prescricao_item" ADD COLUMN IF NOT EXISTS "principioAtivo" TEXT;
ALTER TABLE "tb_prescricao_item" ADD COLUMN IF NOT EXISTS "quantidadeSolicitada" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "tb_prescricao_item" ADD COLUMN IF NOT EXISTS "dose" TEXT;
ALTER TABLE "tb_prescricao_item" ADD COLUMN IF NOT EXISTS "via" "ViaAdministracao";
ALTER TABLE "tb_prescricao_item" ADD COLUMN IF NOT EXISTS "frequencia" TEXT;
ALTER TABLE "tb_prescricao_item" ADD COLUMN IF NOT EXISTS "duracaoDias" INTEGER;
ALTER TABLE "tb_prescricao_item" ADD COLUMN IF NOT EXISTS "observacoes" TEXT;
ALTER TABLE "tb_prescricao_item" ADD COLUMN IF NOT EXISTS "justificativaMedica" TEXT;
ALTER TABLE "tb_prescricao_item" ADD COLUMN IF NOT EXISTS "alertasInteracao" JSONB;
ALTER TABLE "tb_prescricao_item" ADD COLUMN IF NOT EXISTS "statusValidacao" "StatusValidacaoFarmacia" NOT NULL DEFAULT 'AGUARDANDO_TRIAGEM';
ALTER TABLE "tb_prescricao_item" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "tb_prescricao_item" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- tb_farmacia_dispensacao
CREATE TABLE IF NOT EXISTS "tb_farmacia_dispensacao" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "validadoPorId" TEXT,
    "status" "StatusValidacaoFarmacia" NOT NULL DEFAULT 'AGUARDANDO_TRIAGEM',
    "motivoRejeicao" TEXT,
    "validadoEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tb_farmacia_dispensacao_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "tb_farmacia_dispensacao" ADD COLUMN IF NOT EXISTS "id" TEXT;
ALTER TABLE "tb_farmacia_dispensacao" ADD COLUMN IF NOT EXISTS "itemId" TEXT;
ALTER TABLE "tb_farmacia_dispensacao" ADD COLUMN IF NOT EXISTS "validadoPorId" TEXT;
ALTER TABLE "tb_farmacia_dispensacao" ADD COLUMN IF NOT EXISTS "status" "StatusValidacaoFarmacia" NOT NULL DEFAULT 'AGUARDANDO_TRIAGEM';
ALTER TABLE "tb_farmacia_dispensacao" ADD COLUMN IF NOT EXISTS "motivoRejeicao" TEXT;
ALTER TABLE "tb_farmacia_dispensacao" ADD COLUMN IF NOT EXISTS "validadoEm" TIMESTAMP(3);
ALTER TABLE "tb_farmacia_dispensacao" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "tb_farmacia_dispensacao" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- tb_farmacia_entrada_nf
CREATE TABLE IF NOT EXISTS "tb_farmacia_entrada_nf" (
    "id" TEXT NOT NULL,
    "numeroNota" TEXT NOT NULL,
    "serie" TEXT,
    "fornecedorNome" TEXT,
    "fornecedorCnpj" TEXT,
    "emitidaEm" TIMESTAMP(3),
    "recebidaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "importadaXml" BOOLEAN NOT NULL DEFAULT false,
    "chaveNfe" TEXT,
    "observacoes" TEXT,
    "criadoPorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tb_farmacia_entrada_nf_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "tb_farmacia_entrada_nf" ADD COLUMN IF NOT EXISTS "id" TEXT;
ALTER TABLE "tb_farmacia_entrada_nf" ADD COLUMN IF NOT EXISTS "numeroNota" TEXT;
ALTER TABLE "tb_farmacia_entrada_nf" ADD COLUMN IF NOT EXISTS "serie" TEXT;
ALTER TABLE "tb_farmacia_entrada_nf" ADD COLUMN IF NOT EXISTS "fornecedorNome" TEXT;
ALTER TABLE "tb_farmacia_entrada_nf" ADD COLUMN IF NOT EXISTS "fornecedorCnpj" TEXT;
ALTER TABLE "tb_farmacia_entrada_nf" ADD COLUMN IF NOT EXISTS "emitidaEm" TIMESTAMP(3);
ALTER TABLE "tb_farmacia_entrada_nf" ADD COLUMN IF NOT EXISTS "recebidaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "tb_farmacia_entrada_nf" ADD COLUMN IF NOT EXISTS "importadaXml" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "tb_farmacia_entrada_nf" ADD COLUMN IF NOT EXISTS "chaveNfe" TEXT;
ALTER TABLE "tb_farmacia_entrada_nf" ADD COLUMN IF NOT EXISTS "observacoes" TEXT;
ALTER TABLE "tb_farmacia_entrada_nf" ADD COLUMN IF NOT EXISTS "criadoPorId" TEXT;
ALTER TABLE "tb_farmacia_entrada_nf" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "tb_farmacia_entrada_nf" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- tb_farmacia_entrada_nf_item
CREATE TABLE IF NOT EXISTS "tb_farmacia_entrada_nf_item" (
    "id" TEXT NOT NULL,
    "entradaId" TEXT NOT NULL,
    "medicamentoId" TEXT NOT NULL,
    "loteId" TEXT,
    "quantidade" INTEGER NOT NULL,
    "custoUnitario" DECIMAL(12,2),
    "lote" TEXT,
    "validade" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tb_farmacia_entrada_nf_item_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "tb_farmacia_entrada_nf_item" ADD COLUMN IF NOT EXISTS "id" TEXT;
ALTER TABLE "tb_farmacia_entrada_nf_item" ADD COLUMN IF NOT EXISTS "entradaId" TEXT;
ALTER TABLE "tb_farmacia_entrada_nf_item" ADD COLUMN IF NOT EXISTS "medicamentoId" TEXT;
ALTER TABLE "tb_farmacia_entrada_nf_item" ADD COLUMN IF NOT EXISTS "loteId" TEXT;
ALTER TABLE "tb_farmacia_entrada_nf_item" ADD COLUMN IF NOT EXISTS "quantidade" INTEGER;
ALTER TABLE "tb_farmacia_entrada_nf_item" ADD COLUMN IF NOT EXISTS "custoUnitario" DECIMAL(12,2);
ALTER TABLE "tb_farmacia_entrada_nf_item" ADD COLUMN IF NOT EXISTS "lote" TEXT;
ALTER TABLE "tb_farmacia_entrada_nf_item" ADD COLUMN IF NOT EXISTS "validade" TIMESTAMP(3);
ALTER TABLE "tb_farmacia_entrada_nf_item" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- tb_farmacia_saida
CREATE TABLE IF NOT EXISTS "tb_farmacia_saida" (
    "id" TEXT NOT NULL,
    "tipo" "TipoSaidaFarmacia" NOT NULL,
    "atendimentoId" TEXT,
    "observacoes" TEXT,
    "criadoPorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tb_farmacia_saida_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "tb_farmacia_saida" ADD COLUMN IF NOT EXISTS "id" TEXT;
ALTER TABLE "tb_farmacia_saida" ADD COLUMN IF NOT EXISTS "tipo" "TipoSaidaFarmacia";
ALTER TABLE "tb_farmacia_saida" ADD COLUMN IF NOT EXISTS "atendimentoId" TEXT;
ALTER TABLE "tb_farmacia_saida" ADD COLUMN IF NOT EXISTS "observacoes" TEXT;
ALTER TABLE "tb_farmacia_saida" ADD COLUMN IF NOT EXISTS "criadoPorId" TEXT;
ALTER TABLE "tb_farmacia_saida" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "tb_farmacia_saida" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- tb_farmacia_saida_item
CREATE TABLE IF NOT EXISTS "tb_farmacia_saida_item" (
    "id" TEXT NOT NULL,
    "saidaId" TEXT NOT NULL,
    "medicamentoId" TEXT NOT NULL,
    "loteId" TEXT,
    "quantidade" INTEGER NOT NULL,
    "motivo" TEXT,
    "dispensacaoId" TEXT,
    "prescricaoItemId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tb_farmacia_saida_item_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "tb_farmacia_saida_item" ADD COLUMN IF NOT EXISTS "id" TEXT;
ALTER TABLE "tb_farmacia_saida_item" ADD COLUMN IF NOT EXISTS "saidaId" TEXT;
ALTER TABLE "tb_farmacia_saida_item" ADD COLUMN IF NOT EXISTS "medicamentoId" TEXT;
ALTER TABLE "tb_farmacia_saida_item" ADD COLUMN IF NOT EXISTS "loteId" TEXT;
ALTER TABLE "tb_farmacia_saida_item" ADD COLUMN IF NOT EXISTS "quantidade" INTEGER;
ALTER TABLE "tb_farmacia_saida_item" ADD COLUMN IF NOT EXISTS "motivo" TEXT;
ALTER TABLE "tb_farmacia_saida_item" ADD COLUMN IF NOT EXISTS "dispensacaoId" TEXT;
ALTER TABLE "tb_farmacia_saida_item" ADD COLUMN IF NOT EXISTS "prescricaoItemId" TEXT;
ALTER TABLE "tb_farmacia_saida_item" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- tb_auditoria_log
CREATE TABLE IF NOT EXISTS "tb_auditoria_log" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT,
    "role" "Role",
    "atendimentoId" TEXT,
    "acao" TEXT NOT NULL,
    "entidade" TEXT NOT NULL,
    "entidadeId" TEXT,
    "ipOrigem" TEXT,
    "userAgent" TEXT,
    "detalhes" JSONB,
    "registradoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tb_auditoria_log_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "tb_auditoria_log" ADD COLUMN IF NOT EXISTS "id" TEXT;
ALTER TABLE "tb_auditoria_log" ADD COLUMN IF NOT EXISTS "usuarioId" TEXT;
ALTER TABLE "tb_auditoria_log" ADD COLUMN IF NOT EXISTS "role" "Role";
ALTER TABLE "tb_auditoria_log" ADD COLUMN IF NOT EXISTS "atendimentoId" TEXT;
ALTER TABLE "tb_auditoria_log" ADD COLUMN IF NOT EXISTS "acao" TEXT;
ALTER TABLE "tb_auditoria_log" ADD COLUMN IF NOT EXISTS "entidade" TEXT;
ALTER TABLE "tb_auditoria_log" ADD COLUMN IF NOT EXISTS "entidadeId" TEXT;
ALTER TABLE "tb_auditoria_log" ADD COLUMN IF NOT EXISTS "ipOrigem" TEXT;
ALTER TABLE "tb_auditoria_log" ADD COLUMN IF NOT EXISTS "userAgent" TEXT;
ALTER TABLE "tb_auditoria_log" ADD COLUMN IF NOT EXISTS "detalhes" JSONB;
ALTER TABLE "tb_auditoria_log" ADD COLUMN IF NOT EXISTS "registradoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- ------------------------------------------------------------------
-- 3. Indices e restricoes de unicidade
-- ------------------------------------------------------------------

CREATE UNIQUE INDEX IF NOT EXISTS "usuarios_email_key" ON "usuarios"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "usuarios_cpf_key" ON "usuarios"("cpf");
CREATE INDEX IF NOT EXISTS "usuarios_email_idx" ON "usuarios"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "tokens_redefinicao_senha_tokenHash_key" ON "tokens_redefinicao_senha"("tokenHash");
CREATE INDEX IF NOT EXISTS "tokens_redefinicao_senha_usuarioId_idx" ON "tokens_redefinicao_senha"("usuarioId");
CREATE UNIQUE INDEX IF NOT EXISTS "pacientes_cpfCriptografado_key" ON "pacientes"("cpfCriptografado");
CREATE UNIQUE INDEX IF NOT EXISTS "pacientes_cpfHash_key" ON "pacientes"("cpfHash");
CREATE INDEX IF NOT EXISTS "pacientes_cpfHash_idx" ON "pacientes"("cpfHash");
CREATE INDEX IF NOT EXISTS "pacientes_nomeExibicao_idx" ON "pacientes"("nomeExibicao");
CREATE INDEX IF NOT EXISTS "pacientes_createdAt_idx" ON "pacientes"("createdAt");
CREATE UNIQUE INDEX IF NOT EXISTS "enderecos_pacienteId_key" ON "enderecos"("pacienteId");
CREATE INDEX IF NOT EXISTS "alergias_pacienteId_idx" ON "alergias"("pacienteId");
CREATE INDEX IF NOT EXISTS "medicamentos_continuos_pacienteId_idx" ON "medicamentos_continuos"("pacienteId");
CREATE INDEX IF NOT EXISTS "documentos_pacientes_pacienteId_idx" ON "documentos_pacientes"("pacienteId");
CREATE UNIQUE INDEX IF NOT EXISTS "atendimentos_numeroAtendimento_key" ON "atendimentos"("numeroAtendimento");
CREATE INDEX IF NOT EXISTS "atendimentos_pacienteId_idx" ON "atendimentos"("pacienteId");
CREATE INDEX IF NOT EXISTS "atendimentos_numeroAtendimento_idx" ON "atendimentos"("numeroAtendimento");
CREATE INDEX IF NOT EXISTS "atendimentos_status_idx" ON "atendimentos"("status");
CREATE INDEX IF NOT EXISTS "atendimentos_leitoId_idx" ON "atendimentos"("leitoId");
CREATE INDEX IF NOT EXISTS "atendimentos_createdAt_idx" ON "atendimentos"("createdAt");
CREATE UNIQUE INDEX IF NOT EXISTS "clinicas_nome_key" ON "clinicas"("nome");
CREATE INDEX IF NOT EXISTS "clinicas_ativo_idx" ON "clinicas"("ativo");
CREATE INDEX IF NOT EXISTS "leitos_ala_idx" ON "leitos"("ala");
CREATE INDEX IF NOT EXISTS "leitos_tipo_idx" ON "leitos"("tipo");
CREATE INDEX IF NOT EXISTS "leitos_status_idx" ON "leitos"("status");
CREATE INDEX IF NOT EXISTS "leitos_ativo_idx" ON "leitos"("ativo");
CREATE INDEX IF NOT EXISTS "leitos_clinicaId_idx" ON "leitos"("clinicaId");
CREATE UNIQUE INDEX IF NOT EXISTS "leitos_ala_codigo_key" ON "leitos"("ala", "codigo");
CREATE INDEX IF NOT EXISTS "prescricoes_medicas_padrao_ativo_idx" ON "prescricoes_medicas_padrao"("ativo");
CREATE INDEX IF NOT EXISTS "prescricoes_medicas_padrao_nome_idx" ON "prescricoes_medicas_padrao"("nome");
CREATE INDEX IF NOT EXISTS "itens_prescricao_medica_padrao_prescricaoMedicaPadraoId_idx" ON "itens_prescricao_medica_padrao"("prescricaoMedicaPadraoId");
CREATE UNIQUE INDEX IF NOT EXISTS "triagens_atendimentoId_key" ON "triagens"("atendimentoId");
CREATE INDEX IF NOT EXISTS "triagens_corClassificacao_idx" ON "triagens"("corClassificacao");
CREATE INDEX IF NOT EXISTS "triagens_createdAt_idx" ON "triagens"("createdAt");
CREATE UNIQUE INDEX IF NOT EXISTS "sinais_vitais_triagemId_key" ON "sinais_vitais"("triagemId");
CREATE INDEX IF NOT EXISTS "chamadas_painel_setorPainel_idx" ON "chamadas_painel"("setorPainel");
CREATE INDEX IF NOT EXISTS "chamadas_painel_chamadoEm_idx" ON "chamadas_painel"("chamadoEm");
CREATE UNIQUE INDEX IF NOT EXISTS "prontuarios_medicos_atendimentoId_key" ON "prontuarios_medicos"("atendimentoId");
CREATE INDEX IF NOT EXISTS "prontuarios_medicos_atendimentoId_idx" ON "prontuarios_medicos"("atendimentoId");
CREATE INDEX IF NOT EXISTS "prontuarios_medicos_encerradoEm_idx" ON "prontuarios_medicos"("encerradoEm");
CREATE UNIQUE INDEX IF NOT EXISTS "anamneses_prontuarioId_key" ON "anamneses"("prontuarioId");
CREATE INDEX IF NOT EXISTS "diagnosticos_prontuarioId_idx" ON "diagnosticos"("prontuarioId");
CREATE INDEX IF NOT EXISTS "diagnosticos_codigoCid_idx" ON "diagnosticos"("codigoCid");
CREATE INDEX IF NOT EXISTS "prescricoes_prontuarioId_idx" ON "prescricoes"("prontuarioId");
CREATE INDEX IF NOT EXISTS "prescricoes_prontuarioId_tipo_idx" ON "prescricoes"("prontuarioId", "tipo");
CREATE INDEX IF NOT EXISTS "itens_prescricao_prescricaoId_idx" ON "itens_prescricao"("prescricaoId");
CREATE INDEX IF NOT EXISTS "aplicacoes_medicamentos_itemPrescricaoId_idx" ON "aplicacoes_medicamentos"("itemPrescricaoId");
CREATE INDEX IF NOT EXISTS "aplicacoes_medicamentos_aplicadoEm_idx" ON "aplicacoes_medicamentos"("aplicadoEm");
CREATE INDEX IF NOT EXISTS "requisicoes_exames_prontuarioId_idx" ON "requisicoes_exames"("prontuarioId");
CREATE INDEX IF NOT EXISTS "itens_requisicao_requisicaoId_idx" ON "itens_requisicao"("requisicaoId");
CREATE INDEX IF NOT EXISTS "evolucoes_medicas_prontuarioId_idx" ON "evolucoes_medicas"("prontuarioId");
CREATE INDEX IF NOT EXISTS "evolucoes_medicas_registradoEm_idx" ON "evolucoes_medicas"("registradoEm");
CREATE UNIQUE INDEX IF NOT EXISTS "laudos_internacao_atendimentoId_key" ON "laudos_internacao"("atendimentoId");
CREATE INDEX IF NOT EXISTS "laudos_internacao_status_idx" ON "laudos_internacao"("status");
CREATE INDEX IF NOT EXISTS "laudos_internacao_createdAt_idx" ON "laudos_internacao"("createdAt");
CREATE UNIQUE INDEX IF NOT EXISTS "fichas_internacao_alta_atendimentoId_key" ON "fichas_internacao_alta"("atendimentoId");
CREATE INDEX IF NOT EXISTS "fichas_internacao_alta_status_idx" ON "fichas_internacao_alta"("status");
CREATE INDEX IF NOT EXISTS "fichas_internacao_alta_createdAt_idx" ON "fichas_internacao_alta"("createdAt");
CREATE UNIQUE INDEX IF NOT EXISTS "fichas_ccih_atendimentoId_key" ON "fichas_ccih"("atendimentoId");
CREATE INDEX IF NOT EXISTS "fichas_ccih_status_idx" ON "fichas_ccih"("status");
CREATE INDEX IF NOT EXISTS "fichas_ccih_createdAt_idx" ON "fichas_ccih"("createdAt");
CREATE UNIQUE INDEX IF NOT EXISTS "fichas_multidisciplinares_atendimentoId_key" ON "fichas_multidisciplinares"("atendimentoId");
CREATE INDEX IF NOT EXISTS "fichas_multidisciplinares_status_idx" ON "fichas_multidisciplinares"("status");
CREATE INDEX IF NOT EXISTS "fichas_multidisciplinares_createdAt_idx" ON "fichas_multidisciplinares"("createdAt");
CREATE INDEX IF NOT EXISTS "fichas_evolucao_turno_atendimentoId_idx" ON "fichas_evolucao_turno"("atendimentoId");
CREATE INDEX IF NOT EXISTS "fichas_evolucao_turno_turno_idx" ON "fichas_evolucao_turno"("turno");
CREATE INDEX IF NOT EXISTS "fichas_evolucao_turno_dataReferencia_idx" ON "fichas_evolucao_turno"("dataReferencia");
CREATE UNIQUE INDEX IF NOT EXISTS "fichas_evolucao_turno_atendimentoId_dataReferencia_turno_key" ON "fichas_evolucao_turno"("atendimentoId", "dataReferencia", "turno");
CREATE INDEX IF NOT EXISTS "fichas_sinais_vitais_atendimentoId_idx" ON "fichas_sinais_vitais"("atendimentoId");
CREATE INDEX IF NOT EXISTS "fichas_sinais_vitais_dataReferencia_idx" ON "fichas_sinais_vitais"("dataReferencia");
CREATE UNIQUE INDEX IF NOT EXISTS "fichas_sinais_vitais_atendimentoId_dataReferencia_key" ON "fichas_sinais_vitais"("atendimentoId", "dataReferencia");
CREATE INDEX IF NOT EXISTS "fichas_sae_atendimentoId_idx" ON "fichas_sae"("atendimentoId");
CREATE INDEX IF NOT EXISTS "fichas_sae_dataReferencia_idx" ON "fichas_sae"("dataReferencia");
CREATE UNIQUE INDEX IF NOT EXISTS "fichas_sae_atendimentoId_dataReferencia_key" ON "fichas_sae"("atendimentoId", "dataReferencia");
CREATE INDEX IF NOT EXISTS "evolucoes_multiprofissional_atendimentoId_idx" ON "evolucoes_multiprofissional"("atendimentoId");
CREATE INDEX IF NOT EXISTS "evolucoes_multiprofissional_dataHora_idx" ON "evolucoes_multiprofissional"("dataHora");
CREATE UNIQUE INDEX IF NOT EXISTS "fichas_internacao_obstetrica_atendimentoId_key" ON "fichas_internacao_obstetrica"("atendimentoId");
CREATE INDEX IF NOT EXISTS "fichas_internacao_obstetrica_atendimentoId_idx" ON "fichas_internacao_obstetrica"("atendimentoId");
CREATE UNIQUE INDEX IF NOT EXISTS "fichas_bercario_atendimentoId_key" ON "fichas_bercario"("atendimentoId");
CREATE INDEX IF NOT EXISTS "fichas_bercario_atendimentoId_idx" ON "fichas_bercario"("atendimentoId");
CREATE INDEX IF NOT EXISTS "encaminhamentos_prontuarioId_idx" ON "encaminhamentos"("prontuarioId");
CREATE INDEX IF NOT EXISTS "logs_auditoria_usuarioId_idx" ON "logs_auditoria"("usuarioId");
CREATE INDEX IF NOT EXISTS "logs_auditoria_entidade_entidadeId_idx" ON "logs_auditoria"("entidade", "entidadeId");
CREATE INDEX IF NOT EXISTS "logs_auditoria_registradoEm_idx" ON "logs_auditoria"("registradoEm");
CREATE UNIQUE INDEX IF NOT EXISTS "origens_pacientes_descricao_key" ON "origens_pacientes"("descricao");
CREATE INDEX IF NOT EXISTS "tb_medicamento_principioAtivo_idx" ON "tb_medicamento"("principioAtivo");
CREATE INDEX IF NOT EXISTS "tb_medicamento_nome_idx" ON "tb_medicamento"("nome");
CREATE INDEX IF NOT EXISTS "tb_medicamento_lote_medicamentoId_idx" ON "tb_medicamento_lote"("medicamentoId");
CREATE INDEX IF NOT EXISTS "tb_medicamento_lote_validade_idx" ON "tb_medicamento_lote"("validade");
CREATE UNIQUE INDEX IF NOT EXISTS "tb_medicamento_lote_medicamentoId_lote_key" ON "tb_medicamento_lote"("medicamentoId", "lote");
CREATE INDEX IF NOT EXISTS "tb_farmacia_movimentacao_medicamentoId_idx" ON "tb_farmacia_movimentacao"("medicamentoId");
CREATE INDEX IF NOT EXISTS "tb_farmacia_movimentacao_loteId_idx" ON "tb_farmacia_movimentacao"("loteId");
CREATE INDEX IF NOT EXISTS "tb_farmacia_movimentacao_tipo_idx" ON "tb_farmacia_movimentacao"("tipo");
CREATE INDEX IF NOT EXISTS "tb_farmacia_movimentacao_createdAt_idx" ON "tb_farmacia_movimentacao"("createdAt");
CREATE INDEX IF NOT EXISTS "tb_medicamento_sinonimo_sinonimoNorm_idx" ON "tb_medicamento_sinonimo"("sinonimoNorm");
CREATE INDEX IF NOT EXISTS "tb_medicamento_sinonimo_medicamentoId_idx" ON "tb_medicamento_sinonimo"("medicamentoId");
CREATE UNIQUE INDEX IF NOT EXISTS "tb_medicamento_sinonimo_medicamentoId_sinonimoNorm_key" ON "tb_medicamento_sinonimo"("medicamentoId", "sinonimoNorm");
CREATE INDEX IF NOT EXISTS "tb_interacao_matriz_principioAtivoA_principioAtivoB_idx" ON "tb_interacao_matriz"("principioAtivoA", "principioAtivoB");
CREATE INDEX IF NOT EXISTS "tb_interacao_matriz_risco_idx" ON "tb_interacao_matriz"("risco");
CREATE INDEX IF NOT EXISTS "tb_prescricao_cabecalho_atendimentoId_idx" ON "tb_prescricao_cabecalho"("atendimentoId");
CREATE INDEX IF NOT EXISTS "tb_prescricao_cabecalho_statusValidacao_idx" ON "tb_prescricao_cabecalho"("statusValidacao");
CREATE INDEX IF NOT EXISTS "tb_prescricao_item_prescricaoId_idx" ON "tb_prescricao_item"("prescricaoId");
CREATE INDEX IF NOT EXISTS "tb_prescricao_item_principioAtivo_idx" ON "tb_prescricao_item"("principioAtivo");
CREATE INDEX IF NOT EXISTS "tb_prescricao_item_statusValidacao_idx" ON "tb_prescricao_item"("statusValidacao");
CREATE UNIQUE INDEX IF NOT EXISTS "tb_farmacia_dispensacao_itemId_key" ON "tb_farmacia_dispensacao"("itemId");
CREATE INDEX IF NOT EXISTS "tb_farmacia_dispensacao_status_idx" ON "tb_farmacia_dispensacao"("status");
CREATE INDEX IF NOT EXISTS "tb_farmacia_dispensacao_validadoEm_idx" ON "tb_farmacia_dispensacao"("validadoEm");
CREATE INDEX IF NOT EXISTS "tb_farmacia_entrada_nf_numeroNota_idx" ON "tb_farmacia_entrada_nf"("numeroNota");
CREATE INDEX IF NOT EXISTS "tb_farmacia_entrada_nf_recebidaEm_idx" ON "tb_farmacia_entrada_nf"("recebidaEm");
CREATE INDEX IF NOT EXISTS "tb_farmacia_entrada_nf_item_entradaId_idx" ON "tb_farmacia_entrada_nf_item"("entradaId");
CREATE INDEX IF NOT EXISTS "tb_farmacia_entrada_nf_item_medicamentoId_idx" ON "tb_farmacia_entrada_nf_item"("medicamentoId");
CREATE INDEX IF NOT EXISTS "tb_farmacia_entrada_nf_item_loteId_idx" ON "tb_farmacia_entrada_nf_item"("loteId");
CREATE INDEX IF NOT EXISTS "tb_farmacia_saida_tipo_idx" ON "tb_farmacia_saida"("tipo");
CREATE INDEX IF NOT EXISTS "tb_farmacia_saida_createdAt_idx" ON "tb_farmacia_saida"("createdAt");
CREATE INDEX IF NOT EXISTS "tb_farmacia_saida_atendimentoId_idx" ON "tb_farmacia_saida"("atendimentoId");
CREATE INDEX IF NOT EXISTS "tb_farmacia_saida_item_saidaId_idx" ON "tb_farmacia_saida_item"("saidaId");
CREATE INDEX IF NOT EXISTS "tb_farmacia_saida_item_medicamentoId_idx" ON "tb_farmacia_saida_item"("medicamentoId");
CREATE INDEX IF NOT EXISTS "tb_farmacia_saida_item_loteId_idx" ON "tb_farmacia_saida_item"("loteId");
CREATE INDEX IF NOT EXISTS "tb_farmacia_saida_item_dispensacaoId_idx" ON "tb_farmacia_saida_item"("dispensacaoId");
CREATE INDEX IF NOT EXISTS "tb_farmacia_saida_item_prescricaoItemId_idx" ON "tb_farmacia_saida_item"("prescricaoItemId");
CREATE INDEX IF NOT EXISTS "tb_auditoria_log_usuarioId_idx" ON "tb_auditoria_log"("usuarioId");
CREATE INDEX IF NOT EXISTS "tb_auditoria_log_atendimentoId_idx" ON "tb_auditoria_log"("atendimentoId");
CREATE INDEX IF NOT EXISTS "tb_auditoria_log_entidade_entidadeId_idx" ON "tb_auditoria_log"("entidade", "entidadeId");
CREATE INDEX IF NOT EXISTS "tb_auditoria_log_registradoEm_idx" ON "tb_auditoria_log"("registradoEm");

-- ------------------------------------------------------------------
-- 4. Chaves estrangeiras
-- ------------------------------------------------------------------

DO $$ BEGIN
  ALTER TABLE "tokens_redefinicao_senha" ADD CONSTRAINT "tokens_redefinicao_senha_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "enderecos" ADD CONSTRAINT "enderecos_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "pacientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "alergias" ADD CONSTRAINT "alergias_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "pacientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "medicamentos_continuos" ADD CONSTRAINT "medicamentos_continuos_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "pacientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "documentos_pacientes" ADD CONSTRAINT "documentos_pacientes_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "pacientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "atendimentos" ADD CONSTRAINT "atendimentos_medicoId_fkey" FOREIGN KEY ("medicoId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "atendimentos" ADD CONSTRAINT "atendimentos_origemId_fkey" FOREIGN KEY ("origemId") REFERENCES "origens_pacientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "atendimentos" ADD CONSTRAINT "atendimentos_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "pacientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "atendimentos" ADD CONSTRAINT "atendimentos_leitoId_fkey" FOREIGN KEY ("leitoId") REFERENCES "leitos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "leitos" ADD CONSTRAINT "leitos_clinicaId_fkey" FOREIGN KEY ("clinicaId") REFERENCES "clinicas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "itens_prescricao_medica_padrao" ADD CONSTRAINT "itens_prescricao_medica_padrao_prescricaoMedicaPadraoId_fkey" FOREIGN KEY ("prescricaoMedicaPadraoId") REFERENCES "prescricoes_medicas_padrao"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "triagens" ADD CONSTRAINT "triagens_atendimentoId_fkey" FOREIGN KEY ("atendimentoId") REFERENCES "atendimentos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "triagens" ADD CONSTRAINT "triagens_triadorId_fkey" FOREIGN KEY ("triadorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "sinais_vitais" ADD CONSTRAINT "sinais_vitais_triagemId_fkey" FOREIGN KEY ("triagemId") REFERENCES "triagens"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "chamadas_painel" ADD CONSTRAINT "chamadas_painel_atendimentoId_fkey" FOREIGN KEY ("atendimentoId") REFERENCES "atendimentos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "chamadas_painel" ADD CONSTRAINT "chamadas_painel_chamadoPorId_fkey" FOREIGN KEY ("chamadoPorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "prontuarios_medicos" ADD CONSTRAINT "prontuarios_medicos_atendimentoId_fkey" FOREIGN KEY ("atendimentoId") REFERENCES "atendimentos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "prontuarios_medicos" ADD CONSTRAINT "prontuarios_medicos_encerradoPorId_fkey" FOREIGN KEY ("encerradoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "anamneses" ADD CONSTRAINT "anamneses_prontuarioId_fkey" FOREIGN KEY ("prontuarioId") REFERENCES "prontuarios_medicos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "diagnosticos" ADD CONSTRAINT "diagnosticos_prontuarioId_fkey" FOREIGN KEY ("prontuarioId") REFERENCES "prontuarios_medicos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "prescricoes" ADD CONSTRAINT "prescricoes_prontuarioId_fkey" FOREIGN KEY ("prontuarioId") REFERENCES "prontuarios_medicos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "itens_prescricao" ADD CONSTRAINT "itens_prescricao_prescricaoId_fkey" FOREIGN KEY ("prescricaoId") REFERENCES "prescricoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "aplicacoes_medicamentos" ADD CONSTRAINT "aplicacoes_medicamentos_aplicadoPorId_fkey" FOREIGN KEY ("aplicadoPorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "aplicacoes_medicamentos" ADD CONSTRAINT "aplicacoes_medicamentos_itemPrescricaoId_fkey" FOREIGN KEY ("itemPrescricaoId") REFERENCES "itens_prescricao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "requisicoes_exames" ADD CONSTRAINT "requisicoes_exames_prontuarioId_fkey" FOREIGN KEY ("prontuarioId") REFERENCES "prontuarios_medicos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "itens_requisicao" ADD CONSTRAINT "itens_requisicao_requisicaoId_fkey" FOREIGN KEY ("requisicaoId") REFERENCES "requisicoes_exames"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "evolucoes_medicas" ADD CONSTRAINT "evolucoes_medicas_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "evolucoes_medicas" ADD CONSTRAINT "evolucoes_medicas_prontuarioId_fkey" FOREIGN KEY ("prontuarioId") REFERENCES "prontuarios_medicos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "laudos_internacao" ADD CONSTRAINT "laudos_internacao_atendimentoId_fkey" FOREIGN KEY ("atendimentoId") REFERENCES "atendimentos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "fichas_internacao_alta" ADD CONSTRAINT "fichas_internacao_alta_atendimentoId_fkey" FOREIGN KEY ("atendimentoId") REFERENCES "atendimentos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "fichas_ccih" ADD CONSTRAINT "fichas_ccih_atendimentoId_fkey" FOREIGN KEY ("atendimentoId") REFERENCES "atendimentos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "fichas_multidisciplinares" ADD CONSTRAINT "fichas_multidisciplinares_atendimentoId_fkey" FOREIGN KEY ("atendimentoId") REFERENCES "atendimentos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "fichas_evolucao_turno" ADD CONSTRAINT "fichas_evolucao_turno_atendimentoId_fkey" FOREIGN KEY ("atendimentoId") REFERENCES "atendimentos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "fichas_sinais_vitais" ADD CONSTRAINT "fichas_sinais_vitais_atendimentoId_fkey" FOREIGN KEY ("atendimentoId") REFERENCES "atendimentos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "fichas_sae" ADD CONSTRAINT "fichas_sae_atendimentoId_fkey" FOREIGN KEY ("atendimentoId") REFERENCES "atendimentos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "evolucoes_multiprofissional" ADD CONSTRAINT "evolucoes_multiprofissional_atendimentoId_fkey" FOREIGN KEY ("atendimentoId") REFERENCES "atendimentos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "fichas_internacao_obstetrica" ADD CONSTRAINT "fichas_internacao_obstetrica_atendimentoId_fkey" FOREIGN KEY ("atendimentoId") REFERENCES "atendimentos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "fichas_bercario" ADD CONSTRAINT "fichas_bercario_atendimentoId_fkey" FOREIGN KEY ("atendimentoId") REFERENCES "atendimentos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "encaminhamentos" ADD CONSTRAINT "encaminhamentos_prontuarioId_fkey" FOREIGN KEY ("prontuarioId") REFERENCES "prontuarios_medicos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "logs_auditoria" ADD CONSTRAINT "logs_auditoria_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "tb_medicamento_lote" ADD CONSTRAINT "tb_medicamento_lote_medicamentoId_fkey" FOREIGN KEY ("medicamentoId") REFERENCES "tb_medicamento"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "tb_farmacia_movimentacao" ADD CONSTRAINT "tb_farmacia_movimentacao_medicamentoId_fkey" FOREIGN KEY ("medicamentoId") REFERENCES "tb_medicamento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "tb_farmacia_movimentacao" ADD CONSTRAINT "tb_farmacia_movimentacao_loteId_fkey" FOREIGN KEY ("loteId") REFERENCES "tb_medicamento_lote"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "tb_medicamento_sinonimo" ADD CONSTRAINT "tb_medicamento_sinonimo_medicamentoId_fkey" FOREIGN KEY ("medicamentoId") REFERENCES "tb_medicamento"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "tb_prescricao_cabecalho" ADD CONSTRAINT "tb_prescricao_cabecalho_atendimentoId_fkey" FOREIGN KEY ("atendimentoId") REFERENCES "atendimentos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "tb_prescricao_cabecalho" ADD CONSTRAINT "tb_prescricao_cabecalho_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "tb_prescricao_item" ADD CONSTRAINT "tb_prescricao_item_prescricaoId_fkey" FOREIGN KEY ("prescricaoId") REFERENCES "tb_prescricao_cabecalho"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "tb_prescricao_item" ADD CONSTRAINT "tb_prescricao_item_medicamentoId_fkey" FOREIGN KEY ("medicamentoId") REFERENCES "tb_medicamento"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "tb_farmacia_dispensacao" ADD CONSTRAINT "tb_farmacia_dispensacao_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "tb_prescricao_item"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "tb_farmacia_dispensacao" ADD CONSTRAINT "tb_farmacia_dispensacao_validadoPorId_fkey" FOREIGN KEY ("validadoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "tb_farmacia_entrada_nf" ADD CONSTRAINT "tb_farmacia_entrada_nf_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "tb_farmacia_entrada_nf_item" ADD CONSTRAINT "tb_farmacia_entrada_nf_item_entradaId_fkey" FOREIGN KEY ("entradaId") REFERENCES "tb_farmacia_entrada_nf"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "tb_farmacia_entrada_nf_item" ADD CONSTRAINT "tb_farmacia_entrada_nf_item_medicamentoId_fkey" FOREIGN KEY ("medicamentoId") REFERENCES "tb_medicamento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "tb_farmacia_entrada_nf_item" ADD CONSTRAINT "tb_farmacia_entrada_nf_item_loteId_fkey" FOREIGN KEY ("loteId") REFERENCES "tb_medicamento_lote"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "tb_farmacia_saida" ADD CONSTRAINT "tb_farmacia_saida_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "tb_farmacia_saida" ADD CONSTRAINT "tb_farmacia_saida_atendimentoId_fkey" FOREIGN KEY ("atendimentoId") REFERENCES "atendimentos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "tb_farmacia_saida_item" ADD CONSTRAINT "tb_farmacia_saida_item_saidaId_fkey" FOREIGN KEY ("saidaId") REFERENCES "tb_farmacia_saida"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "tb_farmacia_saida_item" ADD CONSTRAINT "tb_farmacia_saida_item_medicamentoId_fkey" FOREIGN KEY ("medicamentoId") REFERENCES "tb_medicamento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "tb_farmacia_saida_item" ADD CONSTRAINT "tb_farmacia_saida_item_loteId_fkey" FOREIGN KEY ("loteId") REFERENCES "tb_medicamento_lote"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "tb_farmacia_saida_item" ADD CONSTRAINT "tb_farmacia_saida_item_dispensacaoId_fkey" FOREIGN KEY ("dispensacaoId") REFERENCES "tb_farmacia_dispensacao"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "tb_farmacia_saida_item" ADD CONSTRAINT "tb_farmacia_saida_item_prescricaoItemId_fkey" FOREIGN KEY ("prescricaoItemId") REFERENCES "tb_prescricao_item"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "tb_auditoria_log" ADD CONSTRAINT "tb_auditoria_log_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "tb_auditoria_log" ADD CONSTRAINT "tb_auditoria_log_atendimentoId_fkey" FOREIGN KEY ("atendimentoId") REFERENCES "atendimentos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ------------------------------------------------------------------
-- AVISOS (colunas relaxadas para permitir aplicacao em tabela com dados)
--   usuarios.id — adicionada como NULL (NOT NULL sem DEFAULT)
--   usuarios.email — adicionada como NULL (NOT NULL sem DEFAULT)
--   usuarios.senhaHash — adicionada como NULL (NOT NULL sem DEFAULT)
--   usuarios.nome — adicionada como NULL (NOT NULL sem DEFAULT)
--   usuarios.role — adicionada como NULL (NOT NULL sem DEFAULT)
--   tokens_redefinicao_senha.id — adicionada como NULL (NOT NULL sem DEFAULT)
--   tokens_redefinicao_senha.tokenHash — adicionada como NULL (NOT NULL sem DEFAULT)
--   tokens_redefinicao_senha.usuarioId — adicionada como NULL (NOT NULL sem DEFAULT)
--   pacientes.id — adicionada como NULL (NOT NULL sem DEFAULT)
--   pacientes.cpfCriptografado — adicionada como NULL (NOT NULL sem DEFAULT)
--   pacientes.cpfHash — adicionada como NULL (NOT NULL sem DEFAULT)
--   pacientes.nomeCriptografado — adicionada como NULL (NOT NULL sem DEFAULT)
--   pacientes.nomeExibicao — adicionada como NULL (NOT NULL sem DEFAULT)
--   pacientes.sexoBiologico — adicionada como NULL (NOT NULL sem DEFAULT)
--   enderecos.id — adicionada como NULL (NOT NULL sem DEFAULT)
--   enderecos.pacienteId — adicionada como NULL (NOT NULL sem DEFAULT)
--   enderecos.cep — adicionada como NULL (NOT NULL sem DEFAULT)
--   enderecos.logradouro — adicionada como NULL (NOT NULL sem DEFAULT)
--   enderecos.numero — adicionada como NULL (NOT NULL sem DEFAULT)
--   enderecos.bairro — adicionada como NULL (NOT NULL sem DEFAULT)
--   enderecos.cidade — adicionada como NULL (NOT NULL sem DEFAULT)
--   enderecos.estado — adicionada como NULL (NOT NULL sem DEFAULT)
--   alergias.id — adicionada como NULL (NOT NULL sem DEFAULT)
--   alergias.pacienteId — adicionada como NULL (NOT NULL sem DEFAULT)
--   alergias.descricao — adicionada como NULL (NOT NULL sem DEFAULT)
--   medicamentos_continuos.id — adicionada como NULL (NOT NULL sem DEFAULT)
--   medicamentos_continuos.pacienteId — adicionada como NULL (NOT NULL sem DEFAULT)
--   medicamentos_continuos.nome — adicionada como NULL (NOT NULL sem DEFAULT)
--   medicamentos_continuos.dose — adicionada como NULL (NOT NULL sem DEFAULT)
--   medicamentos_continuos.frequencia — adicionada como NULL (NOT NULL sem DEFAULT)
--   documentos_pacientes.id — adicionada como NULL (NOT NULL sem DEFAULT)
--   documentos_pacientes.pacienteId — adicionada como NULL (NOT NULL sem DEFAULT)
--   documentos_pacientes.tipo — adicionada como NULL (NOT NULL sem DEFAULT)
--   documentos_pacientes.nomeArquivo — adicionada como NULL (NOT NULL sem DEFAULT)
--   documentos_pacientes.mimeType — adicionada como NULL (NOT NULL sem DEFAULT)
--   documentos_pacientes.tamanhoBytes — adicionada como NULL (NOT NULL sem DEFAULT)
--   documentos_pacientes.caminhoArquivo — adicionada como NULL (NOT NULL sem DEFAULT)
--   atendimentos.id — adicionada como NULL (NOT NULL sem DEFAULT)
--   atendimentos.numeroAtendimento — adicionada como NULL (NOT NULL sem DEFAULT)
--   atendimentos.pacienteId — adicionada como NULL (NOT NULL sem DEFAULT)
--   clinicas.id — adicionada como NULL (NOT NULL sem DEFAULT)
--   clinicas.nome — adicionada como NULL (NOT NULL sem DEFAULT)
--   leitos.id — adicionada como NULL (NOT NULL sem DEFAULT)
--   leitos.ala — adicionada como NULL (NOT NULL sem DEFAULT)
--   leitos.codigo — adicionada como NULL (NOT NULL sem DEFAULT)
--   prescricoes_medicas_padrao.id — adicionada como NULL (NOT NULL sem DEFAULT)
--   prescricoes_medicas_padrao.nome — adicionada como NULL (NOT NULL sem DEFAULT)
--   itens_prescricao_medica_padrao.id — adicionada como NULL (NOT NULL sem DEFAULT)
--   itens_prescricao_medica_padrao.prescricaoMedicaPadraoId — adicionada como NULL (NOT NULL sem DEFAULT)
--   itens_prescricao_medica_padrao.nomeMedicamento — adicionada como NULL (NOT NULL sem DEFAULT)
--   itens_prescricao_medica_padrao.dose — adicionada como NULL (NOT NULL sem DEFAULT)
--   itens_prescricao_medica_padrao.via — adicionada como NULL (NOT NULL sem DEFAULT)
--   itens_prescricao_medica_padrao.frequencia — adicionada como NULL (NOT NULL sem DEFAULT)
--   triagens.id — adicionada como NULL (NOT NULL sem DEFAULT)
--   triagens.atendimentoId — adicionada como NULL (NOT NULL sem DEFAULT)
--   triagens.triadorId — adicionada como NULL (NOT NULL sem DEFAULT)
--   triagens.corClassificacao — adicionada como NULL (NOT NULL sem DEFAULT)
--   triagens.queixaPrincipal — adicionada como NULL (NOT NULL sem DEFAULT)
--   sinais_vitais.id — adicionada como NULL (NOT NULL sem DEFAULT)
--   sinais_vitais.triagemId — adicionada como NULL (NOT NULL sem DEFAULT)
--   chamadas_painel.id — adicionada como NULL (NOT NULL sem DEFAULT)
--   chamadas_painel.atendimentoId — adicionada como NULL (NOT NULL sem DEFAULT)
--   chamadas_painel.chamadoPorId — adicionada como NULL (NOT NULL sem DEFAULT)
--   chamadas_painel.salaDestino — adicionada como NULL (NOT NULL sem DEFAULT)
--   prontuarios_medicos.id — adicionada como NULL (NOT NULL sem DEFAULT)
--   prontuarios_medicos.atendimentoId — adicionada como NULL (NOT NULL sem DEFAULT)
--   anamneses.id — adicionada como NULL (NOT NULL sem DEFAULT)
--   anamneses.prontuarioId — adicionada como NULL (NOT NULL sem DEFAULT)
--   anamneses.queixaPrincipal — adicionada como NULL (NOT NULL sem DEFAULT)
--   diagnosticos.id — adicionada como NULL (NOT NULL sem DEFAULT)
--   diagnosticos.prontuarioId — adicionada como NULL (NOT NULL sem DEFAULT)
--   diagnosticos.codigoCid — adicionada como NULL (NOT NULL sem DEFAULT)
--   diagnosticos.descricaoCid — adicionada como NULL (NOT NULL sem DEFAULT)
--   prescricoes.id — adicionada como NULL (NOT NULL sem DEFAULT)
--   prescricoes.prontuarioId — adicionada como NULL (NOT NULL sem DEFAULT)
--   itens_prescricao.id — adicionada como NULL (NOT NULL sem DEFAULT)
--   itens_prescricao.prescricaoId — adicionada como NULL (NOT NULL sem DEFAULT)
--   itens_prescricao.nomeMedicamento — adicionada como NULL (NOT NULL sem DEFAULT)
--   itens_prescricao.dose — adicionada como NULL (NOT NULL sem DEFAULT)
--   itens_prescricao.via — adicionada como NULL (NOT NULL sem DEFAULT)
--   itens_prescricao.frequencia — adicionada como NULL (NOT NULL sem DEFAULT)
--   aplicacoes_medicamentos.id — adicionada como NULL (NOT NULL sem DEFAULT)
--   aplicacoes_medicamentos.itemPrescricaoId — adicionada como NULL (NOT NULL sem DEFAULT)
--   aplicacoes_medicamentos.aplicadoPorId — adicionada como NULL (NOT NULL sem DEFAULT)
--   aplicacoes_medicamentos.doseAplicada — adicionada como NULL (NOT NULL sem DEFAULT)
--   aplicacoes_medicamentos.via — adicionada como NULL (NOT NULL sem DEFAULT)
--   aplicacoes_medicamentos.checklistConfirmado — adicionada como NULL (NOT NULL sem DEFAULT)
--   requisicoes_exames.id — adicionada como NULL (NOT NULL sem DEFAULT)
--   requisicoes_exames.prontuarioId — adicionada como NULL (NOT NULL sem DEFAULT)
--   requisicoes_exames.categoria — adicionada como NULL (NOT NULL sem DEFAULT)
--   requisicoes_exames.indicacao — adicionada como NULL (NOT NULL sem DEFAULT)
--   itens_requisicao.id — adicionada como NULL (NOT NULL sem DEFAULT)
--   itens_requisicao.requisicaoId — adicionada como NULL (NOT NULL sem DEFAULT)
--   itens_requisicao.nomeExame — adicionada como NULL (NOT NULL sem DEFAULT)
--   evolucoes_medicas.id — adicionada como NULL (NOT NULL sem DEFAULT)
--   evolucoes_medicas.prontuarioId — adicionada como NULL (NOT NULL sem DEFAULT)
--   evolucoes_medicas.autorId — adicionada como NULL (NOT NULL sem DEFAULT)
--   evolucoes_medicas.conteudo — adicionada como NULL (NOT NULL sem DEFAULT)
--   laudos_internacao.id — adicionada como NULL (NOT NULL sem DEFAULT)
--   laudos_internacao.atendimentoId — adicionada como NULL (NOT NULL sem DEFAULT)
--   fichas_internacao_alta.id — adicionada como NULL (NOT NULL sem DEFAULT)
--   fichas_internacao_alta.atendimentoId — adicionada como NULL (NOT NULL sem DEFAULT)
--   fichas_ccih.id — adicionada como NULL (NOT NULL sem DEFAULT)
--   fichas_ccih.atendimentoId — adicionada como NULL (NOT NULL sem DEFAULT)
--   fichas_multidisciplinares.id — adicionada como NULL (NOT NULL sem DEFAULT)
--   fichas_multidisciplinares.atendimentoId — adicionada como NULL (NOT NULL sem DEFAULT)
--   fichas_evolucao_turno.id — adicionada como NULL (NOT NULL sem DEFAULT)
--   fichas_evolucao_turno.atendimentoId — adicionada como NULL (NOT NULL sem DEFAULT)
--   fichas_evolucao_turno.turno — adicionada como NULL (NOT NULL sem DEFAULT)
--   fichas_sinais_vitais.id — adicionada como NULL (NOT NULL sem DEFAULT)
--   fichas_sinais_vitais.atendimentoId — adicionada como NULL (NOT NULL sem DEFAULT)
--   fichas_sae.id — adicionada como NULL (NOT NULL sem DEFAULT)
--   fichas_sae.atendimentoId — adicionada como NULL (NOT NULL sem DEFAULT)
--   evolucoes_multiprofissional.id — adicionada como NULL (NOT NULL sem DEFAULT)
--   evolucoes_multiprofissional.atendimentoId — adicionada como NULL (NOT NULL sem DEFAULT)
--   evolucoes_multiprofissional.evolucao — adicionada como NULL (NOT NULL sem DEFAULT)
--   fichas_internacao_obstetrica.id — adicionada como NULL (NOT NULL sem DEFAULT)
--   fichas_internacao_obstetrica.atendimentoId — adicionada como NULL (NOT NULL sem DEFAULT)
--   fichas_bercario.id — adicionada como NULL (NOT NULL sem DEFAULT)
--   fichas_bercario.atendimentoId — adicionada como NULL (NOT NULL sem DEFAULT)
--   encaminhamentos.id — adicionada como NULL (NOT NULL sem DEFAULT)
--   encaminhamentos.prontuarioId — adicionada como NULL (NOT NULL sem DEFAULT)
--   encaminhamentos.tipo — adicionada como NULL (NOT NULL sem DEFAULT)
--   encaminhamentos.especialidade — adicionada como NULL (NOT NULL sem DEFAULT)
--   logs_auditoria.id — adicionada como NULL (NOT NULL sem DEFAULT)
--   logs_auditoria.acao — adicionada como NULL (NOT NULL sem DEFAULT)
--   logs_auditoria.entidade — adicionada como NULL (NOT NULL sem DEFAULT)
--   instituicoes.id — adicionada como NULL (NOT NULL sem DEFAULT)
--   instituicoes.nomeMunicipio — adicionada como NULL (NOT NULL sem DEFAULT)
--   instituicoes.nomeInstituicao — adicionada como NULL (NOT NULL sem DEFAULT)
--   config_painel.id — adicionada como NULL (NOT NULL sem DEFAULT)
--   config_smtp.id — adicionada como NULL (NOT NULL sem DEFAULT)
--   origens_pacientes.id — adicionada como NULL (NOT NULL sem DEFAULT)
--   origens_pacientes.descricao — adicionada como NULL (NOT NULL sem DEFAULT)
--   tb_medicamento.id — adicionada como NULL (NOT NULL sem DEFAULT)
--   tb_medicamento.nome — adicionada como NULL (NOT NULL sem DEFAULT)
--   tb_medicamento.principioAtivo — adicionada como NULL (NOT NULL sem DEFAULT)
--   tb_medicamento_lote.id — adicionada como NULL (NOT NULL sem DEFAULT)
--   tb_medicamento_lote.medicamentoId — adicionada como NULL (NOT NULL sem DEFAULT)
--   tb_medicamento_lote.lote — adicionada como NULL (NOT NULL sem DEFAULT)
--   tb_farmacia_movimentacao.id — adicionada como NULL (NOT NULL sem DEFAULT)
--   tb_farmacia_movimentacao.medicamentoId — adicionada como NULL (NOT NULL sem DEFAULT)
--   tb_farmacia_movimentacao.tipo — adicionada como NULL (NOT NULL sem DEFAULT)
--   tb_farmacia_movimentacao.quantidade — adicionada como NULL (NOT NULL sem DEFAULT)
--   tb_farmacia_movimentacao.saldoAnterior — adicionada como NULL (NOT NULL sem DEFAULT)
--   tb_farmacia_movimentacao.saldoPosterior — adicionada como NULL (NOT NULL sem DEFAULT)
--   tb_medicamento_sinonimo.id — adicionada como NULL (NOT NULL sem DEFAULT)
--   tb_medicamento_sinonimo.medicamentoId — adicionada como NULL (NOT NULL sem DEFAULT)
--   tb_medicamento_sinonimo.sinonimo — adicionada como NULL (NOT NULL sem DEFAULT)
--   tb_medicamento_sinonimo.sinonimoNorm — adicionada como NULL (NOT NULL sem DEFAULT)
--   tb_interacao_matriz.id — adicionada como NULL (NOT NULL sem DEFAULT)
--   tb_interacao_matriz.principioAtivoA — adicionada como NULL (NOT NULL sem DEFAULT)
--   tb_interacao_matriz.principioAtivoB — adicionada como NULL (NOT NULL sem DEFAULT)
--   tb_interacao_matriz.risco — adicionada como NULL (NOT NULL sem DEFAULT)
--   tb_interacao_matriz.efeitoClinico — adicionada como NULL (NOT NULL sem DEFAULT)
--   tb_interacao_matriz.sugestaoSistema — adicionada como NULL (NOT NULL sem DEFAULT)
--   tb_prescricao_cabecalho.id — adicionada como NULL (NOT NULL sem DEFAULT)
--   tb_prescricao_cabecalho.atendimentoId — adicionada como NULL (NOT NULL sem DEFAULT)
--   tb_prescricao_cabecalho.criadoPorId — adicionada como NULL (NOT NULL sem DEFAULT)
--   tb_prescricao_item.id — adicionada como NULL (NOT NULL sem DEFAULT)
--   tb_prescricao_item.prescricaoId — adicionada como NULL (NOT NULL sem DEFAULT)
--   tb_prescricao_item.medicamentoNome — adicionada como NULL (NOT NULL sem DEFAULT)
--   tb_prescricao_item.principioAtivo — adicionada como NULL (NOT NULL sem DEFAULT)
--   tb_prescricao_item.dose — adicionada como NULL (NOT NULL sem DEFAULT)
--   tb_prescricao_item.via — adicionada como NULL (NOT NULL sem DEFAULT)
--   tb_prescricao_item.frequencia — adicionada como NULL (NOT NULL sem DEFAULT)
--   tb_farmacia_dispensacao.id — adicionada como NULL (NOT NULL sem DEFAULT)
--   tb_farmacia_dispensacao.itemId — adicionada como NULL (NOT NULL sem DEFAULT)
--   tb_farmacia_entrada_nf.id — adicionada como NULL (NOT NULL sem DEFAULT)
--   tb_farmacia_entrada_nf.numeroNota — adicionada como NULL (NOT NULL sem DEFAULT)
--   tb_farmacia_entrada_nf_item.id — adicionada como NULL (NOT NULL sem DEFAULT)
--   tb_farmacia_entrada_nf_item.entradaId — adicionada como NULL (NOT NULL sem DEFAULT)
--   tb_farmacia_entrada_nf_item.medicamentoId — adicionada como NULL (NOT NULL sem DEFAULT)
--   tb_farmacia_entrada_nf_item.quantidade — adicionada como NULL (NOT NULL sem DEFAULT)
--   tb_farmacia_saida.id — adicionada como NULL (NOT NULL sem DEFAULT)
--   tb_farmacia_saida.tipo — adicionada como NULL (NOT NULL sem DEFAULT)
--   tb_farmacia_saida_item.id — adicionada como NULL (NOT NULL sem DEFAULT)
--   tb_farmacia_saida_item.saidaId — adicionada como NULL (NOT NULL sem DEFAULT)
--   tb_farmacia_saida_item.medicamentoId — adicionada como NULL (NOT NULL sem DEFAULT)
--   tb_farmacia_saida_item.quantidade — adicionada como NULL (NOT NULL sem DEFAULT)
--   tb_auditoria_log.id — adicionada como NULL (NOT NULL sem DEFAULT)
--   tb_auditoria_log.acao — adicionada como NULL (NOT NULL sem DEFAULT)
--   tb_auditoria_log.entidade — adicionada como NULL (NOT NULL sem DEFAULT)
-- ------------------------------------------------------------------
