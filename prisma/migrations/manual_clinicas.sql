-- Cadastro de clínicas de internação
CREATE TABLE IF NOT EXISTS "clinicas" (
  "id" TEXT NOT NULL,
  "nome" TEXT NOT NULL,
  "descricao" TEXT,
  "ativo" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "clinicas_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "clinicas_nome_key" ON "clinicas" ("nome");
CREATE INDEX IF NOT EXISTS "clinicas_ativo_idx" ON "clinicas" ("ativo");

-- Relação leito -> clínica
ALTER TABLE "leitos" ADD COLUMN IF NOT EXISTS "clinicaId" TEXT;
CREATE INDEX IF NOT EXISTS "leitos_clinicaId_idx" ON "leitos" ("clinicaId");

DO $$
BEGIN
  ALTER TABLE "leitos"
    ADD CONSTRAINT "leitos_clinicaId_fkey"
    FOREIGN KEY ("clinicaId") REFERENCES "clinicas"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
