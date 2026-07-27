-- Valores de enum adicionados via db:push — baseline para replay das migrations

ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'TECNICO_ENFERMAGEM';
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'FARMACEUTICO';
ALTER TYPE "StatusAtendimento" ADD VALUE IF NOT EXISTS 'INTERNADO';
