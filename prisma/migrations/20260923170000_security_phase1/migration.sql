-- Phase 1 security hardening: session, login, MFA and LGPD patient-access audit.
CREATE TABLE "sessoes_usuario" (
  "id" TEXT NOT NULL,
  "usuarioId" TEXT NOT NULL,
  "sessionTokenHash" TEXT NOT NULL,
  "ipOrigem" TEXT,
  "userAgent" TEXT,
  "dispositivo" TEXT,
  "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "ultimoAcesso" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiraEm" TIMESTAMP(3) NOT NULL,
  "revogadoEm" TIMESTAMP(3),
  "motivoRevogacao" TEXT,
  CONSTRAINT "sessoes_usuario_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "sessoes_usuario_sessionTokenHash_key" ON "sessoes_usuario"("sessionTokenHash");
CREATE INDEX "sessoes_usuario_usuarioId_idx" ON "sessoes_usuario"("usuarioId");
CREATE INDEX "sessoes_usuario_expiraEm_idx" ON "sessoes_usuario"("expiraEm");
CREATE INDEX "sessoes_usuario_revogadoEm_idx" ON "sessoes_usuario"("revogadoEm");
ALTER TABLE "sessoes_usuario" ADD CONSTRAINT "sessoes_usuario_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "tentativas_login" (
  "id" TEXT NOT NULL,
  "email" TEXT,
  "usuarioId" TEXT,
  "sucesso" BOOLEAN NOT NULL,
  "ipOrigem" TEXT,
  "userAgent" TEXT,
  "motivo" TEXT,
  "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "tentativas_login_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "tentativas_login_email_criadoEm_idx" ON "tentativas_login"("email","criadoEm");
CREATE INDEX "tentativas_login_ipOrigem_criadoEm_idx" ON "tentativas_login"("ipOrigem","criadoEm");
CREATE INDEX "tentativas_login_usuarioId_criadoEm_idx" ON "tentativas_login"("usuarioId","criadoEm");
ALTER TABLE "tentativas_login" ADD CONSTRAINT "tentativas_login_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "eventos_mfa" (
  "id" TEXT NOT NULL,
  "usuarioId" TEXT NOT NULL,
  "evento" TEXT NOT NULL,
  "ipOrigem" TEXT,
  "userAgent" TEXT,
  "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "eventos_mfa_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "eventos_mfa_usuarioId_criadoEm_idx" ON "eventos_mfa"("usuarioId","criadoEm");
CREATE INDEX "eventos_mfa_evento_criadoEm_idx" ON "eventos_mfa"("evento","criadoEm");
ALTER TABLE "eventos_mfa" ADD CONSTRAINT "eventos_mfa_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "logs_acesso_paciente" (
  "id" TEXT NOT NULL,
  "usuarioId" TEXT,
  "pacienteId" TEXT NOT NULL,
  "atendimentoId" TEXT,
  "acao" TEXT NOT NULL,
  "modulo" TEXT,
  "motivo" TEXT,
  "ipOrigem" TEXT,
  "userAgent" TEXT,
  "acessadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "logs_acesso_paciente_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "logs_acesso_paciente_pacienteId_acessadoEm_idx" ON "logs_acesso_paciente"("pacienteId","acessadoEm");
CREATE INDEX "logs_acesso_paciente_usuarioId_acessadoEm_idx" ON "logs_acesso_paciente"("usuarioId","acessadoEm");
CREATE INDEX "logs_acesso_paciente_atendimentoId_acessadoEm_idx" ON "logs_acesso_paciente"("atendimentoId","acessadoEm");
CREATE INDEX "logs_acesso_paciente_acao_acessadoEm_idx" ON "logs_acesso_paciente"("acao","acessadoEm");
ALTER TABLE "logs_acesso_paciente" ADD CONSTRAINT "logs_acesso_paciente_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "logs_acesso_paciente" ADD CONSTRAINT "logs_acesso_paciente_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "pacientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "logs_acesso_paciente" ADD CONSTRAINT "logs_acesso_paciente_atendimentoId_fkey" FOREIGN KEY ("atendimentoId") REFERENCES "atendimentos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
