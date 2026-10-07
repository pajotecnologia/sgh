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

-- Corrige registros antigos já encerrados na ficha de alta, retirando-os da lista de ativos.
UPDATE "leitos" l
SET "status" = 'DISPONIVEL'
WHERE l."id" IN (
  SELECT a."leitoId"
  FROM "atendimentos" a
  INNER JOIN "fichas_internacao_alta" f ON f."atendimentoId" = a."id"
  WHERE a."status" = 'INTERNADO'
    AND f."statusAlta" = 'CONCLUIDA'
    AND a."leitoId" IS NOT NULL
);

UPDATE "atendimentos" a
SET
  "status" = CASE
    WHEN f."dadosFormulario"->>'obito' = 'true' THEN 'OBITO'::"StatusAtendimento"
    WHEN f."dadosFormulario"->>'motivoTransferencia' = 'true' THEN 'TRANSFERIDO'::"StatusAtendimento"
    ELSE 'ALTA'::"StatusAtendimento"
  END,
  "leitoId" = NULL
FROM "fichas_internacao_alta" f
WHERE f."atendimentoId" = a."id"
  AND a."status" = 'INTERNADO'
  AND f."statusAlta" = 'CONCLUIDA';
