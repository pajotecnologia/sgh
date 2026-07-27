-- Farmácia Hospitalar — Constraints SQL dedicadas (PostgreSQL)
-- Aplicar com:
--   npm run db:constraints
-- Observação: este repositório usa db:push em ambientes já existentes; esta migration é aplicada via script.

-- ============================================================================
-- tb_medicamento — saldos não-negativos
-- ============================================================================
DO $$
BEGIN
  ALTER TABLE "tb_medicamento"
    ADD CONSTRAINT "tb_medicamento_saldos_ck"
    CHECK (
      "saldoAtual" >= 0
      AND "saldoReservado" >= 0
      AND "saldoReservado" <= "saldoAtual"
    );
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END $$;

-- ============================================================================
-- tb_interacao_matriz — integridade e unicidade do par (A,B) independente da ordem
-- ============================================================================
DO $$
BEGIN
  ALTER TABLE "tb_interacao_matriz"
    ADD CONSTRAINT "tb_interacao_matriz_principios_distintos_ck"
    CHECK (trim("principioAtivoA") <> '' AND trim("principioAtivoB") <> '' AND "principioAtivoA" <> "principioAtivoB");
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "tb_interacao_matriz_par_unico_idx"
  ON "tb_interacao_matriz" (
    LEAST("principioAtivoA", "principioAtivoB"),
    GREATEST("principioAtivoA", "principioAtivoB")
  );

-- ============================================================================
-- tb_prescricao_cabecalho — apenas 1 prescrição ativa por atendimento
-- ============================================================================
CREATE UNIQUE INDEX IF NOT EXISTS "tb_prescricao_cabecalho_ativa_unica_por_atendimento_idx"
  ON "tb_prescricao_cabecalho" ("atendimentoId")
  WHERE "ativa" = true;

-- ============================================================================
-- tb_prescricao_item — quantidade solicitada válida
-- ============================================================================
DO $$
BEGIN
  ALTER TABLE "tb_prescricao_item"
    ADD CONSTRAINT "tb_prescricao_item_quantidade_ck"
    CHECK ("quantidadeSolicitada" >= 1);
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END $$;

-- ============================================================================
-- tb_farmacia_dispensacao — regras de status/validação
-- ============================================================================
DO $$
BEGIN
  ALTER TABLE "tb_farmacia_dispensacao"
    ADD CONSTRAINT "tb_farmacia_dispensacao_validacao_ck"
    CHECK (
      ("status" = 'AGUARDANDO_TRIAGEM' AND "validadoEm" IS NULL AND "validadoPorId" IS NULL)
      OR
      ("status" IN ('APROVADO','REJEITADO') AND "validadoEm" IS NOT NULL AND "validadoPorId" IS NOT NULL)
    );
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "tb_farmacia_dispensacao"
    ADD CONSTRAINT "tb_farmacia_dispensacao_rejeicao_motivo_ck"
    CHECK (
      "status" <> 'REJEITADO'
      OR ("motivoRejeicao" IS NOT NULL AND length(trim("motivoRejeicao")) >= 5)
    );
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "tb_farmacia_dispensacao"
    ADD CONSTRAINT "tb_farmacia_dispensacao_aprovado_sem_motivo_ck"
    CHECK (
      "status" <> 'APROVADO'
      OR "motivoRejeicao" IS NULL
    );
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END $$;

-- ============================================================================
-- tb_auditoria_log — campos mínimos não vazios
-- ============================================================================
DO $$
BEGIN
  ALTER TABLE "tb_auditoria_log"
    ADD CONSTRAINT "tb_auditoria_log_campos_minimos_ck"
    CHECK (length(trim("acao")) > 0 AND length(trim("entidade")) > 0);
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END $$;

-- ============================================================================
-- Trigger: bloquear alterações de status após validação e debitar estoque ao aprovar
-- ============================================================================
CREATE OR REPLACE FUNCTION "fn_tb_farmacia_validar_e_debitar_estoque"()
RETURNS trigger AS $$
DECLARE
  v_medicamento_id text;
  v_qtd integer;
BEGIN
  -- Bloquear mudança após sair do status inicial
  IF (OLD."status" <> 'AGUARDANDO_TRIAGEM') AND (NEW."status" <> OLD."status") THEN
    RAISE EXCEPTION 'Triagem farmacêutica: status já validado (%). Alteração não permitida.', OLD."status";
  END IF;

  -- Ao aprovar, debitar estoque do catálogo (se houver medicamentoId associado)
  IF (OLD."status" = 'AGUARDANDO_TRIAGEM') AND (NEW."status" = 'APROVADO') THEN
    SELECT "medicamentoId", "quantidadeSolicitada"
      INTO v_medicamento_id, v_qtd
    FROM "tb_prescricao_item"
    WHERE "id" = NEW."itemId";

    IF v_qtd IS NULL THEN
      v_qtd := 1;
    END IF;

    IF v_medicamento_id IS NOT NULL THEN
      UPDATE "tb_medicamento"
        SET "saldoAtual" = "saldoAtual" - v_qtd
      WHERE "id" = v_medicamento_id
        AND "saldoAtual" >= v_qtd;

      IF NOT FOUND THEN
        RAISE EXCEPTION 'Farmácia: saldo insuficiente para dispensar (%), quantidade %.', v_medicamento_id, v_qtd;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS "trg_tb_farmacia_validar_e_debitar_estoque" ON "tb_farmacia_dispensacao";
CREATE TRIGGER "trg_tb_farmacia_validar_e_debitar_estoque"
BEFORE UPDATE OF "status" ON "tb_farmacia_dispensacao"
FOR EACH ROW
EXECUTE FUNCTION "fn_tb_farmacia_validar_e_debitar_estoque"();
