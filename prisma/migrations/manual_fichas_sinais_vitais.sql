-- Tabela de ficha de sinais vitais (controle horário 24h + balanço hídrico)
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

CREATE UNIQUE INDEX IF NOT EXISTS "fichas_sinais_vitais_atendimentoId_dataReferencia_key"
  ON "fichas_sinais_vitais" ("atendimentoId", "dataReferencia");

CREATE INDEX IF NOT EXISTS "fichas_sinais_vitais_atendimentoId_idx"
  ON "fichas_sinais_vitais" ("atendimentoId");

CREATE INDEX IF NOT EXISTS "fichas_sinais_vitais_dataReferencia_idx"
  ON "fichas_sinais_vitais" ("dataReferencia");

DO $$
BEGIN
  ALTER TABLE "fichas_sinais_vitais"
    ADD CONSTRAINT "fichas_sinais_vitais_atendimentoId_fkey"
    FOREIGN KEY ("atendimentoId") REFERENCES "atendimentos"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
