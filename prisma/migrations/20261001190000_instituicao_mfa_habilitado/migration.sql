-- Adiciona flag global para ativar/desativar suporte ao 2FA (MFA) na instituição
ALTER TABLE "instituicoes" ADD COLUMN IF NOT EXISTS "mfaHabilitado" BOOLEAN NOT NULL DEFAULT true;
