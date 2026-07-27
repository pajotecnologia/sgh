-- Clínica onde o paciente será internado (cadastro de leitos)
ALTER TABLE "leitos"
  ADD COLUMN IF NOT EXISTS "clinica" TEXT;
