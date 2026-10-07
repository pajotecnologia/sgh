CREATE TABLE "permissoes_usuarios" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "chave" TEXT NOT NULL,
    "permitido" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "permissoes_usuarios_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "permissoes_usuarios_usuarioId_chave_key" ON "permissoes_usuarios"("usuarioId", "chave");
CREATE INDEX "permissoes_usuarios_usuarioId_idx" ON "permissoes_usuarios"("usuarioId");
CREATE INDEX "permissoes_usuarios_chave_permitido_idx" ON "permissoes_usuarios"("chave", "permitido");

ALTER TABLE "permissoes_usuarios" ADD CONSTRAINT "permissoes_usuarios_usuarioId_fkey"
FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
