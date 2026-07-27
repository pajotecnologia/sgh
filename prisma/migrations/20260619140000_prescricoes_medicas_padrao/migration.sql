-- CreateTable
CREATE TABLE "prescricoes_medicas_padrao" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "observacoesPadrao" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prescricoes_medicas_padrao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itens_prescricao_medica_padrao" (
    "id" TEXT NOT NULL,
    "prescricaoMedicaPadraoId" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "nomeMedicamento" TEXT NOT NULL,
    "principioAtivo" TEXT,
    "dose" TEXT NOT NULL,
    "unidadeMedida" TEXT,
    "via" TEXT NOT NULL,
    "frequencia" TEXT NOT NULL,
    "quantidadeSolicitada" INTEGER NOT NULL DEFAULT 1,
    "duracaoDias" INTEGER,
    "observacoes" TEXT,

    CONSTRAINT "itens_prescricao_medica_padrao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "prescricoes_medicas_padrao_ativo_idx" ON "prescricoes_medicas_padrao"("ativo");

-- CreateIndex
CREATE INDEX "prescricoes_medicas_padrao_nome_idx" ON "prescricoes_medicas_padrao"("nome");

-- CreateIndex
CREATE INDEX "itens_prescricao_medica_padrao_prescricaoMedicaPadraoId_idx" ON "itens_prescricao_medica_padrao"("prescricaoMedicaPadraoId");

-- AddForeignKey
ALTER TABLE "itens_prescricao_medica_padrao" ADD CONSTRAINT "itens_prescricao_medica_padrao_prescricaoMedicaPadraoId_fkey" FOREIGN KEY ("prescricaoMedicaPadraoId") REFERENCES "prescricoes_medicas_padrao"("id") ON DELETE CASCADE ON UPDATE CASCADE;
