-- Farmácia: sinônimos para matching de catálogo

CREATE TABLE IF NOT EXISTS "tb_medicamento_sinonimo" (
  "id" TEXT NOT NULL,
  "medicamentoId" TEXT NOT NULL,
  "sinonimo" TEXT NOT NULL,
  "sinonimoNorm" TEXT NOT NULL,
  "ativo" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "tb_medicamento_sinonimo_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "tb_medicamento_sinonimo_sinonimoNorm_idx"
ON "tb_medicamento_sinonimo" ("sinonimoNorm");

CREATE INDEX IF NOT EXISTS "tb_medicamento_sinonimo_medicamentoId_idx"
ON "tb_medicamento_sinonimo" ("medicamentoId");

CREATE UNIQUE INDEX IF NOT EXISTS "tb_medicamento_sinonimo_medicamentoId_sinonimoNorm_key"
ON "tb_medicamento_sinonimo" ("medicamentoId", "sinonimoNorm");

DO $$
BEGIN
  ALTER TABLE "tb_medicamento_sinonimo"
    ADD CONSTRAINT "tb_medicamento_sinonimo_medicamentoId_fkey"
    FOREIGN KEY ("medicamentoId") REFERENCES "tb_medicamento"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END $$;
