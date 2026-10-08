import './load-env.mjs';
import pg from 'pg';

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.warn('DATABASE_URL não definida; sincronização do schema VPS ignorada.');
    return;
  }
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

    await client.query(`
      CREATE TABLE IF NOT EXISTS "salas_atendimento" (
        "id" TEXT NOT NULL,
        "nome" TEXT NOT NULL,
        "tipo" TEXT NOT NULL DEFAULT 'CONSULTORIO',
        "setor" TEXT NOT NULL DEFAULT 'GERAL',
        "ordem" INTEGER NOT NULL DEFAULT 0,
        "ativo" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "salas_atendimento_pkey" PRIMARY KEY ("id")
      );
    `);
    await client.query('CREATE UNIQUE INDEX IF NOT EXISTS "salas_atendimento_nome_key" ON "salas_atendimento"("nome");');
    console.log('✓ Tabela salas_atendimento verificada.');

    // Inserir salas padrão se a tabela estiver vazia
    const countSalas = await client.query('SELECT COUNT(*) FROM "salas_atendimento";');
    if (parseInt(countSalas.rows[0].count, 10) === 0) {
      const salasPadrao = [
        { nome: 'Consultório 01', tipo: 'CONSULTORIO', setor: 'GERAL', ordem: 1 },
        { nome: 'Consultório 02', tipo: 'CONSULTORIO', setor: 'GERAL', ordem: 2 },
        { nome: 'Consultório 03', tipo: 'CONSULTORIO', setor: 'GERAL', ordem: 3 },
        { nome: 'Consultório 04', tipo: 'CONSULTORIO', setor: 'GERAL', ordem: 4 },
        { nome: 'Sala de Procedimentos', tipo: 'PROCEDIMENTOS', setor: 'GERAL', ordem: 5 },
        { nome: 'Sala de Emergência', tipo: 'EMERGENCIA', setor: 'EMERGENCIA', ordem: 6 },
        { nome: 'Sala de Observação', tipo: 'OBSERVACAO', setor: 'GERAL', ordem: 7 },
        { nome: 'Raio-X', tipo: 'EXAME', setor: 'GERAL', ordem: 8 },
        { nome: 'Laboratório', tipo: 'EXAME', setor: 'GERAL', ordem: 9 },
      ];
      for (const s of salasPadrao) {
        await client.query(
          'INSERT INTO "salas_atendimento" ("id", "nome", "tipo", "setor", "ordem", "ativo") VALUES (gen_random_uuid(), $1, $2, $3, $4, true) ON CONFLICT DO NOTHING;',
          [s.nome, s.tipo, s.setor, s.ordem]
        );
      }
      console.log('✓ Salas e consultórios padrão inseridos.');
    }

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
