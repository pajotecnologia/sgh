-- Tabelas tb_* da farmácia criadas originalmente via db:push — baseline para replay

DO $$ BEGIN
  CREATE TYPE "RiscoInteracao" AS ENUM ('LEVE', 'MODERADO', 'CRITICO');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "StatusValidacaoFarmacia" AS ENUM ('AGUARDANDO_TRIAGEM', 'APROVADO', 'REJEITADO');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "TipoSaidaFarmacia" AS ENUM ('DISPENSACAO_PRESCRICAO', 'BAIXA_MANUAL');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "tb_medicamento" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "principioAtivo" TEXT NOT NULL,
    "forma" TEXT,
    "concentracao" TEXT,
    "unidade" TEXT,
    "saldoAtual" INTEGER NOT NULL DEFAULT 0,
    "saldoReservado" INTEGER NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tb_medicamento_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "tb_interacao_matriz" (
    "id" TEXT NOT NULL,
    "principioAtivoA" TEXT NOT NULL,
    "principioAtivoB" TEXT NOT NULL,
    "risco" "RiscoInteracao" NOT NULL,
    "efeitoClinico" TEXT NOT NULL,
    "sugestaoSistema" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tb_interacao_matriz_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "tb_prescricao_cabecalho" (
    "id" TEXT NOT NULL,
    "atendimentoId" TEXT NOT NULL,
    "criadoPorId" TEXT NOT NULL,
    "statusValidacao" "StatusValidacaoFarmacia" NOT NULL DEFAULT 'AGUARDANDO_TRIAGEM',
    "observacoes" TEXT,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tb_prescricao_cabecalho_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "tb_prescricao_item" (
    "id" TEXT NOT NULL,
    "prescricaoId" TEXT NOT NULL,
    "medicamentoId" TEXT,
    "medicamentoNome" TEXT NOT NULL,
    "principioAtivo" TEXT NOT NULL,
    "quantidadeSolicitada" INTEGER NOT NULL DEFAULT 1,
    "dose" TEXT NOT NULL,
    "via" "ViaAdministracao" NOT NULL,
    "frequencia" TEXT NOT NULL,
    "duracaoDias" INTEGER,
    "observacoes" TEXT,
    "justificativaMedica" TEXT,
    "alertasInteracao" JSONB,
    "statusValidacao" "StatusValidacaoFarmacia" NOT NULL DEFAULT 'AGUARDANDO_TRIAGEM',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tb_prescricao_item_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "tb_farmacia_dispensacao" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "validadoPorId" TEXT,
    "status" "StatusValidacaoFarmacia" NOT NULL DEFAULT 'AGUARDANDO_TRIAGEM',
    "motivoRejeicao" TEXT,
    "validadoEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tb_farmacia_dispensacao_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "tb_farmacia_entrada_nf" (
    "id" TEXT NOT NULL,
    "numeroNota" TEXT NOT NULL,
    "serie" TEXT,
    "fornecedorNome" TEXT,
    "fornecedorCnpj" TEXT,
    "emitidaEm" TIMESTAMP(3),
    "recebidaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "observacoes" TEXT,
    "criadoPorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tb_farmacia_entrada_nf_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "tb_farmacia_entrada_nf_item" (
    "id" TEXT NOT NULL,
    "entradaId" TEXT NOT NULL,
    "medicamentoId" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "custoUnitario" DECIMAL(12,2),
    "lote" TEXT,
    "validade" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tb_farmacia_entrada_nf_item_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "tb_farmacia_saida" (
    "id" TEXT NOT NULL,
    "tipo" "TipoSaidaFarmacia" NOT NULL,
    "atendimentoId" TEXT,
    "observacoes" TEXT,
    "criadoPorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tb_farmacia_saida_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "tb_farmacia_saida_item" (
    "id" TEXT NOT NULL,
    "saidaId" TEXT NOT NULL,
    "medicamentoId" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "motivo" TEXT,
    "dispensacaoId" TEXT,
    "prescricaoItemId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tb_farmacia_saida_item_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "tb_auditoria_log" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT,
    "role" "Role",
    "atendimentoId" TEXT,
    "acao" TEXT NOT NULL,
    "entidade" TEXT NOT NULL,
    "entidadeId" TEXT,
    "ipOrigem" TEXT,
    "userAgent" TEXT,
    "detalhes" JSONB,
    "registradoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tb_auditoria_log_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "tb_farmacia_dispensacao_itemId_key" ON "tb_farmacia_dispensacao"("itemId");
CREATE INDEX IF NOT EXISTS "tb_medicamento_principioAtivo_idx" ON "tb_medicamento"("principioAtivo");
CREATE INDEX IF NOT EXISTS "tb_medicamento_nome_idx" ON "tb_medicamento"("nome");
CREATE INDEX IF NOT EXISTS "tb_interacao_matriz_principioAtivoA_principioAtivoB_idx" ON "tb_interacao_matriz"("principioAtivoA", "principioAtivoB");
CREATE INDEX IF NOT EXISTS "tb_farmacia_dispensacao_status_idx" ON "tb_farmacia_dispensacao"("status");
