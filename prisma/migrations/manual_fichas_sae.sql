-- Tabela da ficha SAE (Sistematização da Assistência de Enfermagem) — uma por dia
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

CREATE UNIQUE INDEX IF NOT EXISTS "fichas_sae_atendimentoId_dataReferencia_key"
  ON "fichas_sae" ("atendimentoId", "dataReferencia");

CREATE INDEX IF NOT EXISTS "fichas_sae_atendimentoId_idx"
  ON "fichas_sae" ("atendimentoId");

CREATE INDEX IF NOT EXISTS "fichas_sae_dataReferencia_idx"
  ON "fichas_sae" ("dataReferencia");

DO $$
BEGIN
  ALTER TABLE "fichas_sae"
    ADD CONSTRAINT "fichas_sae_atendimentoId_fkey"
    FOREIGN KEY ("atendimentoId") REFERENCES "atendimentos"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
