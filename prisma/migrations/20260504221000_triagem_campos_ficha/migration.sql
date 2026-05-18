-- Campos usados pelo formulário/API de triagem (dor, irradiação, consciência)
ALTER TABLE "triagens" ADD COLUMN IF NOT EXISTS "duracaoDor" TEXT;
ALTER TABLE "triagens" ADD COLUMN IF NOT EXISTS "localizacaoDor" TEXT;
ALTER TABLE "triagens" ADD COLUMN IF NOT EXISTS "irradiacaoDorSites" TEXT;
ALTER TABLE "triagens" ADD COLUMN IF NOT EXISTS "estadoConscienciaSinais" TEXT;
