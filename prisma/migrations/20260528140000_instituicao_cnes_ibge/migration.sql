-- AlterTable
ALTER TABLE "instituicoes" ADD COLUMN IF NOT EXISTS "cnes" TEXT;
ALTER TABLE "instituicoes" ADD COLUMN IF NOT EXISTS "codigoIbgeMunicipio" TEXT;
