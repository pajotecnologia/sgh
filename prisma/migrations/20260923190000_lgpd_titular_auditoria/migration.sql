-- LGPD: solicitações de titulares e índices de consulta de auditoria.
CREATE TABLE IF NOT EXISTS "solicitacoes_titular" (
  "id" TEXT NOT NULL,
  "protocolo" TEXT NOT NULL,
  "tipo" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'RECEBIDA',
  "pacienteId" TEXT,
  "solicitanteNome" TEXT NOT NULL,
  "solicitanteContato" TEXT,
  "descricao" TEXT,
  "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizadoEm" TIMESTAMP(3) NOT NULL,
  "prazoEm" TIMESTAMP(3),
  "concluidoEm" TIMESTAMP(3),
  "concluidoPorId" TEXT,
  "resposta" TEXT,
  CONSTRAINT "solicitacoes_titular_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "solicitacoes_titular_protocolo_key" UNIQUE ("protocolo")
);

CREATE INDEX IF NOT EXISTS "solicitacoes_titular_status_criadoEm_idx" ON "solicitacoes_titular" ("status", "criadoEm");
CREATE INDEX IF NOT EXISTS "solicitacoes_titular_pacienteId_idx" ON "solicitacoes_titular" ("pacienteId");
CREATE INDEX IF NOT EXISTS "solicitacoes_titular_tipo_criadoEm_idx" ON "solicitacoes_titular" ("tipo", "criadoEm");
CREATE INDEX IF NOT EXISTS "logs_auditoria_acao_registradoEm_idx" ON "logs_auditoria" ("acao", "registradoEm");
CREATE INDEX IF NOT EXISTS "logs_acesso_paciente_modulo_acessadoEm_idx" ON "logs_acesso_paciente" ("modulo", "acessadoEm");

DO $$ BEGIN
  ALTER TABLE "solicitacoes_titular"
    ADD CONSTRAINT "solicitacoes_titular_pacienteId_fkey"
    FOREIGN KEY ("pacienteId") REFERENCES "pacientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "solicitacoes_titular"
    ADD CONSTRAINT "solicitacoes_titular_concluidoPorId_fkey"
    FOREIGN KEY ("concluidoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
