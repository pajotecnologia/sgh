-- Encaminhamento médico: leito/apartamento passam a ser definidos pela enfermagem em Admissões.
-- Remove colunas de logística de leito do encaminhamento.
ALTER TABLE "encaminhamentos" DROP COLUMN IF EXISTS "tipoLeito";
ALTER TABLE "encaminhamentos" DROP COLUMN IF EXISTS "setor";

-- Remove o valor não utilizado 'INTERNO' do enum TipoEncaminhamento (recriação do tipo).
ALTER TYPE "TipoEncaminhamento" RENAME TO "TipoEncaminhamento_old";
CREATE TYPE "TipoEncaminhamento" AS ENUM ('EXTERNO', 'INTERNACAO');
ALTER TABLE "encaminhamentos"
  ALTER COLUMN "tipo" TYPE "TipoEncaminhamento"
  USING ("tipo"::text::"TipoEncaminhamento");
DROP TYPE "TipoEncaminhamento_old";
