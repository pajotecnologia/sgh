-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "StatusLaudoSolicitacao" AS ENUM ('RASCUNHO', 'SOLICITADO', 'AUTORIZADO', 'REJEITADO');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "laudos_solicitacao" (
    "id" TEXT NOT NULL,
    "atendimentoId" TEXT NOT NULL,
    "status" "StatusLaudoSolicitacao" NOT NULL DEFAULT 'RASCUNHO',
    "nomeHospital" TEXT,
    "cnpjHospital" TEXT,
    "nomePaciente" TEXT,
    "numeroAih" TEXT,
    "procedimentoAnterior" TEXT,
    "procedimentoSolicitado" TEXT,
    "nomeMedicoSolicitante" TEXT,
    "crmMedicoSolicitante" TEXT,
    "cpfMedicoSolicitante" TEXT,
    "mudancaProcedimento" BOOLEAN NOT NULL DEFAULT false,
    "diariaUti" BOOLEAN NOT NULL DEFAULT false,
    "diariaAcompanhante" BOOLEAN NOT NULL DEFAULT false,
    "vacinaAntiRh" BOOLEAN NOT NULL DEFAULT false,
    "usoProteseOtica" BOOLEAN NOT NULL DEFAULT false,
    "usoFatoresCoagulacao" BOOLEAN NOT NULL DEFAULT false,
    "usoOrdenadores" BOOLEAN NOT NULL DEFAULT false,
    "nutricaoParenteral" BOOLEAN NOT NULL DEFAULT false,
    "justificativa" TEXT,
    "dataSolicitacao" TIMESTAMP(3),
    "nomeAcompanhante" TEXT,
    "dataAuditoria" TIMESTAMP(3),
    "parecerAuditor" TEXT,
    "nomeAuditor" TEXT,
    "crmAuditor" TEXT,
    "preenchidoPorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "laudos_solicitacao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "laudos_solicitacao_atendimentoId_key" ON "laudos_solicitacao"("atendimentoId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "laudos_solicitacao_status_idx" ON "laudos_solicitacao"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "laudos_solicitacao_createdAt_idx" ON "laudos_solicitacao"("createdAt");

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "laudos_solicitacao" ADD CONSTRAINT "laudos_solicitacao_atendimentoId_fkey"
    FOREIGN KEY ("atendimentoId") REFERENCES "atendimentos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
