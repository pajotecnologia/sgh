-- Tabela de evolução multiprofissional — log cronológico (append-only) por atendimento
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

CREATE INDEX IF NOT EXISTS "evolucoes_multiprofissional_atendimentoId_idx"
  ON "evolucoes_multiprofissional" ("atendimentoId");

CREATE INDEX IF NOT EXISTS "evolucoes_multiprofissional_dataHora_idx"
  ON "evolucoes_multiprofissional" ("dataHora");

DO $$
BEGIN
  ALTER TABLE "evolucoes_multiprofissional"
    ADD CONSTRAINT "evolucoes_multiprofissional_atendimentoId_fkey"
    FOREIGN KEY ("atendimentoId") REFERENCES "atendimentos"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
