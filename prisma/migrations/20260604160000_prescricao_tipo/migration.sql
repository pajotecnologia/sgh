-- CreateEnum
CREATE TYPE "TipoPrescricao" AS ENUM ('PS', 'RECEITA_ALTA');

-- AlterTable
ALTER TABLE "prescricoes" ADD COLUMN "tipo" "TipoPrescricao" NOT NULL DEFAULT 'PS';

CREATE INDEX "prescricoes_prontuarioId_tipo_idx" ON "prescricoes"("prontuarioId", "tipo");
