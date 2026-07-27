-- Painel: tela dividida e mídias rotativas
ALTER TABLE "config_painel" ADD COLUMN IF NOT EXISTS "layoutDividido" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "config_painel" ADD COLUMN IF NOT EXISTS "intervaloRotacaoSegundos" INTEGER NOT NULL DEFAULT 8;
ALTER TABLE "config_painel" ADD COLUMN IF NOT EXISTS "posicaoMidia" TEXT NOT NULL DEFAULT 'esquerda';
ALTER TABLE "config_painel" ADD COLUMN IF NOT EXISTS "imagensRotativas" JSONB NOT NULL DEFAULT '[]';
