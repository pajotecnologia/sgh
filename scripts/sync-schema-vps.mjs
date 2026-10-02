import './load-env.mjs';
import pg from 'pg';

async function main() {
  const url = process.env.DATABASE_URL || 'postgresql://postgres:JwxhBE6vwcBnsyzZI9RFJ03geeh0xwiVjTdNLuNukzeAHMHzYKtNhJz8lECEiHMm@169.58.246.70:5432/sgh';
  const client = new pg.Client({ connectionString: url, connectionTimeoutMillis: 5000 });
  
  try {
    await client.connect();
    console.log('Conectado ao PostgreSQL...');

    await client.query('ALTER TABLE "instituicoes" ADD COLUMN IF NOT EXISTS "mfaHabilitado" BOOLEAN NOT NULL DEFAULT true;');
    console.log('✓ Coluna mfaHabilitado adicionada em instituicoes.');

    await client.query(`
      CREATE TABLE IF NOT EXISTS "tb_uploads_sistema" (
        "id" TEXT NOT NULL,
        "nomeArquivo" TEXT NOT NULL,
        "mimeType" TEXT NOT NULL,
        "tamanhoBytes" INTEGER NOT NULL,
        "dadosBase64" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "tb_uploads_sistema_pkey" PRIMARY KEY ("id")
      );
    `);
    await client.query('CREATE UNIQUE INDEX IF NOT EXISTS "tb_uploads_sistema_nomeArquivo_key" ON "tb_uploads_sistema"("nomeArquivo");');
    console.log('✓ Tabela tb_uploads_sistema verificada.');

    await client.query(`
      CREATE TABLE IF NOT EXISTS "sessoes_usuario" (
        "id" TEXT NOT NULL,
        "usuarioId" TEXT NOT NULL,
        "sessionTokenHash" TEXT NOT NULL,
        "ipOrigem" TEXT,
        "userAgent" TEXT,
        "dispositivo" TEXT,
        "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "ultimoAcesso" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "expiraEm" TIMESTAMP(3) NOT NULL,
        "revogadoEm" TIMESTAMP(3),
        "motivoRevogacao" TEXT,
        CONSTRAINT "sessoes_usuario_pkey" PRIMARY KEY ("id")
      );
    `);
    await client.query('CREATE UNIQUE INDEX IF NOT EXISTS "sessoes_usuario_sessionTokenHash_key" ON "sessoes_usuario"("sessionTokenHash");');
    console.log('✓ Tabela sessoes_usuario verificada.');

    await client.query(`
      CREATE TABLE IF NOT EXISTS "tentativas_login" (
        "id" TEXT NOT NULL,
        "email" TEXT,
        "usuarioId" TEXT,
        "sucesso" BOOLEAN NOT NULL,
        "ipOrigem" TEXT,
        "userAgent" TEXT,
        "motivo" TEXT,
        "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "tentativas_login_pkey" PRIMARY KEY ("id")
      );
    `);
    console.log('✓ Tabela tentativas_login verificada.');

    await client.query(`
      CREATE TABLE IF NOT EXISTS "eventos_mfa" (
        "id" TEXT NOT NULL,
        "usuarioId" TEXT NOT NULL,
        "tipo" TEXT NOT NULL,
        "sucesso" BOOLEAN NOT NULL,
        "ipOrigem" TEXT,
        "userAgent" TEXT,
        "detalhes" TEXT,
        "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "eventos_mfa_pkey" PRIMARY KEY ("id")
      );
    `);
    console.log('✓ Tabela eventos_mfa verificada.');

    await client.query(`
      CREATE TABLE IF NOT EXISTS "solicitacoes_titular" (
        "id" TEXT NOT NULL,
        "tipo" TEXT NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'RECEBIDA',
        "nomeTitular" TEXT NOT NULL,
        "cpfHash" TEXT NOT NULL,
        "emailContato" TEXT NOT NULL,
        "telefoneContato" TEXT,
        "descricao" TEXT NOT NULL,
        "resposta" TEXT,
        "atendidoPorId" TEXT,
        "respondidoEm" TIMESTAMP(3),
        "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "solicitacoes_titular_pkey" PRIMARY KEY ("id")
      );
    `);
    console.log('✓ Tabela solicitacoes_titular verificada.');

    await client.query(`
      CREATE TABLE IF NOT EXISTS "logs_acesso_paciente" (
        "id" TEXT NOT NULL,
        "usuarioId" TEXT,
        "pacienteId" TEXT,
        "atendimentoId" TEXT,
        "acao" TEXT NOT NULL,
        "modulo" TEXT NOT NULL,
        "motivo" TEXT,
        "ipOrigem" TEXT,
        "userAgent" TEXT,
        "acessadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "logs_acesso_paciente_pkey" PRIMARY KEY ("id")
      );
    `);
    console.log('✓ Tabela logs_acesso_paciente verificada.');

    console.log('✨ Sincronização concluída com sucesso!');
  } catch (err) {
    console.warn('Aviso durante sync-schema-vps:', err?.message || err);
  } finally {
    try {
      await client.end();
    } catch {
      /* ignore */
    }
  }
}

main().then(() => process.exit(0)).catch((err) => {
  console.warn('Aviso fatal no sync:', err);
  process.exit(0);
});
