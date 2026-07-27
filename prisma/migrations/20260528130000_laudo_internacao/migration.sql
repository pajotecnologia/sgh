-- CreateEnum
CREATE TYPE "StatusLaudoInternacao" AS ENUM ('RASCUNHO', 'SOLICITADO', 'AUTORIZADO');

-- CreateTable
CREATE TABLE "laudos_internacao" (
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

-- CreateIndex
CREATE UNIQUE INDEX "laudos_internacao_atendimentoId_key" ON "laudos_internacao"("atendimentoId");

-- CreateIndex
CREATE INDEX "laudos_internacao_status_idx" ON "laudos_internacao"("status");

-- CreateIndex
CREATE INDEX "laudos_internacao_createdAt_idx" ON "laudos_internacao"("createdAt");

-- AddForeignKey
ALTER TABLE "laudos_internacao" ADD CONSTRAINT "laudos_internacao_atendimentoId_fkey" FOREIGN KEY ("atendimentoId") REFERENCES "atendimentos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
