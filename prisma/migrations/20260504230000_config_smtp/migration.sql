-- CreateTable
CREATE TABLE "config_smtp" (
    "id" TEXT NOT NULL,
    "host" TEXT NOT NULL DEFAULT '',
    "porta" INTEGER NOT NULL DEFAULT 587,
    "secure" BOOLEAN NOT NULL DEFAULT false,
    "usuario" TEXT NOT NULL DEFAULT '',
    "senhaCriptografada" TEXT NOT NULL DEFAULT '',
    "emailRemetente" TEXT NOT NULL DEFAULT '',
    "nomeRemetente" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "config_smtp_pkey" PRIMARY KEY ("id")
);
