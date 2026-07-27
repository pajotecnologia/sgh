-- Farmácia — Lotes, movimentações e trigger atualizado (FEFO no app)

-- estoqueMinimo em tb_medicamento
ALTER TABLE "tb_medicamento" ADD COLUMN IF NOT EXISTS "estoqueMinimo" INTEGER NOT NULL DEFAULT 0;

-- importadaXml e chaveNfe em tb_farmacia_entrada_nf
ALTER TABLE "tb_farmacia_entrada_nf" ADD COLUMN IF NOT EXISTS "importadaXml" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "tb_farmacia_entrada_nf" ADD COLUMN IF NOT EXISTS "chaveNfe" TEXT;

-- loteId em itens de entrada/saída
ALTER TABLE "tb_farmacia_entrada_nf_item" ADD COLUMN IF NOT EXISTS "loteId" TEXT;
ALTER TABLE "tb_farmacia_saida_item" ADD COLUMN IF NOT EXISTS "loteId" TEXT;

-- tb_medicamento_lote
CREATE TABLE IF NOT EXISTS "tb_medicamento_lote" (
  "id" TEXT NOT NULL,
  "medicamentoId" TEXT NOT NULL,
  "lote" TEXT NOT NULL,
  "validade" TIMESTAMP(3),
  "quantidade" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "tb_medicamento_lote_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "tb_medicamento_lote_medicamentoId_lote_key"
  ON "tb_medicamento_lote"("medicamentoId", "lote");
CREATE INDEX IF NOT EXISTS "tb_medicamento_lote_medicamentoId_idx" ON "tb_medicamento_lote"("medicamentoId");
CREATE INDEX IF NOT EXISTS "tb_medicamento_lote_validade_idx" ON "tb_medicamento_lote"("validade");

DO $$
BEGIN
  ALTER TABLE "tb_medicamento_lote"
    ADD CONSTRAINT "tb_medicamento_lote_medicamentoId_fkey"
    FOREIGN KEY ("medicamentoId") REFERENCES "tb_medicamento"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "tb_medicamento_lote"
    ADD CONSTRAINT "tb_medicamento_lote_quantidade_ck"
    CHECK ("quantidade" >= 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- tb_farmacia_movimentacao
CREATE TABLE IF NOT EXISTS "tb_farmacia_movimentacao" (
  "id" TEXT NOT NULL,
  "medicamentoId" TEXT NOT NULL,
  "loteId" TEXT,
  "tipo" TEXT NOT NULL,
  "quantidade" INTEGER NOT NULL,
  "saldoAnterior" INTEGER NOT NULL,
  "saldoPosterior" INTEGER NOT NULL,
  "referenciaTipo" TEXT,
  "referenciaId" TEXT,
  "usuarioId" TEXT,
  "observacoes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "tb_farmacia_movimentacao_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "tb_farmacia_movimentacao_medicamentoId_idx" ON "tb_farmacia_movimentacao"("medicamentoId");
CREATE INDEX IF NOT EXISTS "tb_farmacia_movimentacao_loteId_idx" ON "tb_farmacia_movimentacao"("loteId");
CREATE INDEX IF NOT EXISTS "tb_farmacia_movimentacao_tipo_idx" ON "tb_farmacia_movimentacao"("tipo");
CREATE INDEX IF NOT EXISTS "tb_farmacia_movimentacao_createdAt_idx" ON "tb_farmacia_movimentacao"("createdAt");

DO $$
BEGIN
  ALTER TABLE "tb_farmacia_movimentacao"
    ADD CONSTRAINT "tb_farmacia_movimentacao_medicamentoId_fkey"
    FOREIGN KEY ("medicamentoId") REFERENCES "tb_medicamento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "tb_farmacia_movimentacao"
    ADD CONSTRAINT "tb_farmacia_movimentacao_loteId_fkey"
    FOREIGN KEY ("loteId") REFERENCES "tb_medicamento_lote"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "tb_farmacia_entrada_nf_item"
    ADD CONSTRAINT "tb_farmacia_entrada_nf_item_loteId_fkey"
    FOREIGN KEY ("loteId") REFERENCES "tb_medicamento_lote"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "tb_farmacia_saida_item"
    ADD CONSTRAINT "tb_farmacia_saida_item_loteId_fkey"
    FOREIGN KEY ("loteId") REFERENCES "tb_medicamento_lote"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "tb_medicamento"
    ADD CONSTRAINT "tb_medicamento_estoque_minimo_ck"
    CHECK ("estoqueMinimo" >= 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Trigger: apenas bloqueia alteração de status após validação (estoque debitado no app com FEFO)
CREATE OR REPLACE FUNCTION "fn_tb_farmacia_validar_e_debitar_estoque"()
RETURNS trigger AS $$
BEGIN
  IF (OLD."status" <> 'AGUARDANDO_TRIAGEM') AND (NEW."status" <> OLD."status") THEN
    RAISE EXCEPTION 'Triagem farmacêutica: status já validado (%). Alteração não permitida.', OLD."status";
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS "trg_tb_farmacia_validar_e_debitar_estoque" ON "tb_farmacia_dispensacao";
CREATE TRIGGER "trg_tb_farmacia_validar_e_debitar_estoque"
BEFORE UPDATE OF "status" ON "tb_farmacia_dispensacao"
FOR EACH ROW
EXECUTE FUNCTION "fn_tb_farmacia_validar_e_debitar_estoque"();
