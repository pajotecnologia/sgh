-- Base: tabela pode não existir no baseline antigo; criar antes do ALTER
CREATE TABLE IF NOT EXISTS "origens_pacientes" (
    "id" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "origens_pacientes_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "origens_pacientes_descricao_key" ON "origens_pacientes"("descricao");

-- AlterTable: OrigemPaciente.procedenciaFicha (ficha de urgência / config. origens)
ALTER TABLE "origens_pacientes" ADD COLUMN IF NOT EXISTS "procedenciaFicha" TEXT;
