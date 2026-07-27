-- Adiciona status intermediário: médico solicitou internação, enfermagem ainda não recebeu
ALTER TYPE "StatusAtendimento" ADD VALUE IF NOT EXISTS 'AGUARDANDO_INTERNACAO';
