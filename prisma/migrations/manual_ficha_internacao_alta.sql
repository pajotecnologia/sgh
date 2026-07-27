DO $$ BEGIN
  CREATE TYPE "StatusFichaInternacaoAlta" AS ENUM ('RASCUNHO', 'EM_ANDAMENTO', 'CONCLUIDA');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "fichas_internacao_alta" (
  "id" TEXT NOT NULL,
  "atendimentoId" TEXT NOT NULL,
  "status" "StatusFichaInternacaoAlta" NOT NULL DEFAULT 'RASCUNHO',
  "nomePaciente" TEXT,
  "numeroProntuario" TEXT,
  "dadosFormulario" JSONB,
  "preenchidoPorId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "fichas_internacao_alta_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "fichas_internacao_alta_atendimentoId_key" ON "fichas_internacao_alta"("atendimentoId");
CREATE INDEX IF NOT EXISTS "fichas_internacao_alta_status_idx" ON "fichas_internacao_alta"("status");
CREATE INDEX IF NOT EXISTS "fichas_internacao_alta_createdAt_idx" ON "fichas_internacao_alta"("createdAt");

DO $$ BEGIN
  ALTER TABLE "fichas_internacao_alta"
    ADD CONSTRAINT "fichas_internacao_alta_atendimentoId_fkey"
    FOREIGN KEY ("atendimentoId") REFERENCES "atendimentos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
