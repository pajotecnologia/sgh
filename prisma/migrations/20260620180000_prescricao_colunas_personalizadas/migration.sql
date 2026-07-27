-- Colunas personalizáveis no modelo de prescrição
ALTER TABLE "prescricoes_medicas_padrao"
ADD COLUMN "nomeColunaEsquerda" TEXT NOT NULL DEFAULT 'Prescrição médica',
ADD COLUMN "nomeColunaDireita" TEXT NOT NULL DEFAULT 'Prescrição de medicamentos / enfermagem';

-- Novo padrão: linhas duplas (texto esquerda + preenchimento direita)
ALTER TABLE "itens_prescricao_medica_padrao"
ALTER COLUMN "tipoItem" SET DEFAULT 'LINHA_DUPLA';
