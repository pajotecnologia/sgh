/**
 * scripts/atualizar-nomes-completos-pacientes.mjs
 * Atualiza o campo `nomeExibicao` de todos os pacientes no banco de dados para o Nome Completo (descriptografado),
 * garantindo pesquisas e visualizações com o nome por extenso em todo o sistema.
 */
import './load-env.mjs';
import pg from 'pg';
import { createDecipheriv } from 'crypto';

function obterChave() {
  const keyHex = process.env.ENCRYPTION_KEY;
  if (!keyHex || keyHex.length !== 64) {
    return null;
  }
  return Buffer.from(keyHex, 'hex');
}

function descriptografar(valorCriptografado, chave) {
  if (!valorCriptografado || !chave) return null;
  const partes = valorCriptografado.split(':');
  if (partes.length !== 3) return null;
  try {
    const [ivHex, authTagHex, dadosHex] = partes;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const dadosCript = Buffer.from(dadosHex, 'hex');
    const decipher = createDecipheriv('aes-256-gcm', chave, iv);
    decipher.setAuthTag(authTag);
    const dadosDescript = Buffer.concat([
      decipher.update(dadosCript),
      decipher.final(),
    ]);
    return dadosDescript.toString('utf8');
  } catch {
    return null;
  }
}

export async function atualizarNomesCompletosPacientes() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.log('[atualizar-nomes] DATABASE_URL não definida.');
    return;
  }

  const chave = obterChave();
  if (!chave) {
    console.log('[atualizar-nomes] ENCRYPTION_KEY inválida ou não configurada.');
    return;
  }

  const client = new pg.Client({ connectionString: url });
  try {
    await client.connect();
    const { rows } = await client.query(
      'SELECT id, "nomeExibicao", "nomeCriptografado" FROM pacientes WHERE "nomeCriptografado" IS NOT NULL'
    );

    let atualizados = 0;
    for (const p of rows) {
      const nomeCompleto = descriptografar(p.nomeCriptografado, chave);
      if (nomeCompleto && nomeCompleto.trim() && nomeCompleto.trim() !== p.nomeExibicao) {
        await client.query(
          'UPDATE pacientes SET "nomeExibicao" = $1 WHERE id = $2',
          [nomeCompleto.trim(), p.id]
        );
        atualizados++;
      }
    }

    console.log(`[atualizar-nomes] ${atualizados} paciente(s) atualizado(s) com nome completo no banco.`);
  } catch (err) {
    console.warn('[atualizar-nomes] Erro ao atualizar nomes completos:', err.message);
  } finally {
    try {
      await client.end();
    } catch {
      /* ignore */
    }
  }
}

if (process.argv[1]?.endsWith('atualizar-nomes-completos-pacientes.mjs')) {
  atualizarNomesCompletosPacientes().then(() => process.exit(0));
}
