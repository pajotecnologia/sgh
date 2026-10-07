-- Separa o status da admissão do status do desfecho/alta hospitalar.
CREATE TYPE "StatusAltaHospitalar" AS ENUM ('RASCUNHO', 'EM_ANDAMENTO', 'CONCLUIDA');

ALTER TABLE "fichas_internacao_alta"
ADD COLUMN "statusAlta" "StatusAltaHospitalar" NOT NULL DEFAULT 'RASCUNHO';

-- Compatibilidade para fichas antigas: somente registros com evidência de dados
-- de alta concluída recebem o novo status. O status da admissão permanece intacto.
UPDATE "fichas_internacao_alta"
SET "statusAlta" = 'CONCLUIDA'
WHERE "status" = 'CONCLUIDA'
  AND (
    COALESCE("dadosFormulario"->>'dataAlta', '') <> ''
    OR "dadosFormulario"->>'altaCurado' = 'true'
    OR "dadosFormulario"->>'altaMelhorado' = 'true'
    OR "dadosFormulario"->>'altaPiorado' = 'true'
    OR "dadosFormulario"->>'obito' = 'true'
    OR "dadosFormulario"->>'motivoDecisaoMedica' = 'true'
    OR "dadosFormulario"->>'motivoAltaPedida' = 'true'
    OR "dadosFormulario"->>'motivoTransferencia' = 'true'
    OR "dadosFormulario"->>'motivoIndisciplina' = 'true'
  );
