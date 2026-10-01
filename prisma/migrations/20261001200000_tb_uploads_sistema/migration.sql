-- CreateTable
CREATE TABLE IF NOT EXISTS "tb_uploads_sistema" (
    "id" TEXT NOT NULL,
    "nomeArquivo" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "dadosBase64" TEXT NOT NULL,
    "tamanhoBytes" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tb_uploads_sistema_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "tb_uploads_sistema_nomeArquivo_key" ON "tb_uploads_sistema"("nomeArquivo");
