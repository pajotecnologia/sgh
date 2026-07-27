-- Folha de internação e alta hospitalar em obstetrícia
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

CREATE UNIQUE INDEX IF NOT EXISTS "fichas_internacao_obstetrica_atendimentoId_key"
  ON "fichas_internacao_obstetrica" ("atendimentoId");

CREATE INDEX IF NOT EXISTS "fichas_internacao_obstetrica_atendimentoId_idx"
  ON "fichas_internacao_obstetrica" ("atendimentoId");

DO $$
BEGIN
  ALTER TABLE "fichas_internacao_obstetrica"
    ADD CONSTRAINT "fichas_internacao_obstetrica_atendimentoId_fkey"
    FOREIGN KEY ("atendimentoId") REFERENCES "atendimentos"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Ficha médica de berçário (recém-nascido)
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

CREATE UNIQUE INDEX IF NOT EXISTS "fichas_bercario_atendimentoId_key"
  ON "fichas_bercario" ("atendimentoId");

CREATE INDEX IF NOT EXISTS "fichas_bercario_atendimentoId_idx"
  ON "fichas_bercario" ("atendimentoId");

DO $$
BEGIN
  ALTER TABLE "fichas_bercario"
    ADD CONSTRAINT "fichas_bercario_atendimentoId_fkey"
    FOREIGN KEY ("atendimentoId") REFERENCES "atendimentos"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
