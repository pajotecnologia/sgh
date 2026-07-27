-- =============================================================================
-- SGH — CONSTRAINTS E TRIGGERS COMPLEMENTARES
--
-- Aplicar DEPOIS de sgh_update_schema.sql.
-- Idempotente: pode ser executado mais de uma vez.
-- =============================================================================

-- Saldos de medicamentos devem permanecer válidos
DO $$
BEGIN
  ALTER TABLE "tb_medicamento"
    ADD CONSTRAINT "tb_medicamento_saldos_ck"
    CHECK (
      "saldoAtual" >= 0
      AND "saldoReservado" >= 0
      AND "saldoReservado" <= "saldoAtual"
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Princípios ativos de uma interação devem ser diferentes e não vazios
DO $$
BEGIN
  ALTER TABLE "tb_interacao_matriz"
    ADD CONSTRAINT "tb_interacao_matriz_principios_distintos_ck"
    CHECK (
      trim("principioAtivoA") <> ''
      AND trim("principioAtivoB") <> ''
      AND "principioAtivoA" <> "principioAtivoB"
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "tb_interacao_matriz_par_unico_idx"
  ON "tb_interacao_matriz" (
    LEAST("principioAtivoA", "principioAtivoB"),
    GREATEST("principioAtivoA", "principioAtivoB")
  );

-- Apenas uma prescrição hospitalar ativa por atendimento
CREATE UNIQUE INDEX IF NOT EXISTS "tb_prescricao_cabecalho_ativa_unica_por_atendimento_idx"
  ON "tb_prescricao_cabecalho" ("atendimentoId")
  WHERE "ativa" = true;

DO $$
BEGIN
  ALTER TABLE "tb_prescricao_item"
    ADD CONSTRAINT "tb_prescricao_item_quantidade_ck"
    CHECK ("quantidadeSolicitada" >= 1);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Coerência da validação farmacêutica
DO $$
BEGIN
  ALTER TABLE "tb_farmacia_dispensacao"
    ADD CONSTRAINT "tb_farmacia_dispensacao_validacao_ck"
    CHECK (
      ("status" = 'AGUARDANDO_TRIAGEM' AND "validadoEm" IS NULL AND "validadoPorId" IS NULL)
      OR
      ("status" IN ('APROVADO', 'REJEITADO') AND "validadoEm" IS NOT NULL AND "validadoPorId" IS NOT NULL)
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "tb_farmacia_dispensacao"
    ADD CONSTRAINT "tb_farmacia_dispensacao_rejeicao_motivo_ck"
    CHECK (
      "status" <> 'REJEITADO'
      OR ("motivoRejeicao" IS NOT NULL AND length(trim("motivoRejeicao")) >= 5)
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "tb_farmacia_dispensacao"
    ADD CONSTRAINT "tb_farmacia_dispensacao_aprovado_sem_motivo_ck"
    CHECK ("status" <> 'APROVADO' OR "motivoRejeicao" IS NULL);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "tb_auditoria_log"
    ADD CONSTRAINT "tb_auditoria_log_campos_minimos_ck"
    CHECK (length(trim("acao")) > 0 AND length(trim("entidade")) > 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "tb_medicamento_lote"
    ADD CONSTRAINT "tb_medicamento_lote_quantidade_ck"
    CHECK ("quantidade" >= 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "tb_medicamento"
    ADD CONSTRAINT "tb_medicamento_estoque_minimo_ck"
    CHECK ("estoqueMinimo" >= 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- O débito FEFO é feito pela aplicação. O trigger apenas impede mudança de
-- status depois que a triagem farmacêutica já foi concluída.
CREATE OR REPLACE FUNCTION "fn_tb_farmacia_validar_e_debitar_estoque"()
RETURNS trigger AS $$
BEGIN
  IF (OLD."status" <> 'AGUARDANDO_TRIAGEM') AND (NEW."status" <> OLD."status") THEN
    RAISE EXCEPTION 'Triagem farmacêutica: status já validado (%). Alteração não permitida.', OLD."status";
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS "trg_tb_farmacia_validar_e_debitar_estoque"
  ON "tb_farmacia_dispensacao";

CREATE TRIGGER "trg_tb_farmacia_validar_e_debitar_estoque"
BEFORE UPDATE OF "status" ON "tb_farmacia_dispensacao"
FOR EACH ROW
EXECUTE FUNCTION "fn_tb_farmacia_validar_e_debitar_estoque"();
