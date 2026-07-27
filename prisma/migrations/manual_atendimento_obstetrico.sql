-- Flags obstétrico e indicação de internação no atendimento
ALTER TABLE "atendimentos"
  ADD COLUMN IF NOT EXISTS "obstetrico" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "atendimentos"
  ADD COLUMN IF NOT EXISTS "vaiInternar" BOOLEAN NOT NULL DEFAULT false;
