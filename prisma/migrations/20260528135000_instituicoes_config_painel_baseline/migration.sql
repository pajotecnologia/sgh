-- Tabelas criadas originalmente via db:push — baseline para replay das migrations no shadow DB

CREATE TABLE IF NOT EXISTS "instituicoes" (
    "id" TEXT NOT NULL,
    "nomeMunicipio" TEXT NOT NULL,
    "nomeInstituicao" TEXT NOT NULL,
    "endereco" TEXT,
    "bairro" TEXT,
    "cidade" TEXT,
    "estado" CHAR(2),
    "cep" TEXT,
    "logomarcaUrl" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "instituicoes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "config_painel" (
    "id" TEXT NOT NULL,
    "vozAtiva" BOOLEAN NOT NULL DEFAULT true,
    "tipoVoz" TEXT NOT NULL DEFAULT 'feminina',
    "corPrimaria" TEXT NOT NULL DEFAULT '#2563eb',
    "corSecundaria" TEXT NOT NULL DEFAULT '#f8fafc',
    "corTexto" TEXT NOT NULL DEFAULT '#1e293b',
    "mensagemPadrao" TEXT NOT NULL DEFAULT 'Comparecer ao consultório',
    "velocidadeVoz" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "config_painel_pkey" PRIMARY KEY ("id")
);
