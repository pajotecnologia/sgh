/**
 * scripts/atualizar-nomes-completos-pacientes.mjs
 * Atualiza o campo `nomeExibicao` de todos os pacientes no banco de dados para o Nome Completo,
 * garantindo pesquisas e visualizações com o nome por extenso em todo o sistema.
 */
import './load-env.mjs';
import pg from 'pg';
import { createDecipheriv } from 'crypto';

const CHAVES_POSSIVEIS = [
  process.env.ENCRYPTION_KEY,
  '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
].filter((k) => k && k.length === 64);

const MAPA_NOMES_DEMO = {
  'Maria S.': 'Maria Aparecida Santos',
  'João O.': 'João Carlos Oliveira',
  'Ana L.': 'Ana Beatriz Ferreira Lima',
  'Pedro S.': 'Pedro Henrique Souza',
  'Lucia C.': 'Lucia Helena Costa',
  'Roberto P.': 'Roberto Almeida Pereira',
  'Fernanda M.': 'Fernanda Rodrigues Martins',
  'Marcos R.': 'Marcos Antônio Ribeiro',
  'Juliana N.': 'Juliana Cristina Nunes',
  'Antonio B.': 'Antonio José Barbosa',
  'Camila S.': 'Camila Duarte Silveira',
  'Ricardo G.': 'Ricardo Mendes Gomes',
  'Patricia C.': 'Patricia Alves Carvalho',
  'Eduardo R.': 'Eduardo Pinto Rocha',
  'Silvia T.': 'Silvia Regina Teixeira',
  'Felipe M.': 'Felipe Augusto Moura',
  'Renata C.': 'Renata Oliveira Cavalcanti',
  'Geraldo D.': 'Geraldo Francisco Dias',
  'Vanessa C.': 'Vanessa Lima Cardoso',
  'Paulo M.': 'Paulo Sergio Monteiro',
  'Amanda F.': 'Amanda Cristina Freitas',
  'Sérgio A.': 'Sérgio Luiz Azevedo',
  'Helena V.': 'Helena Moura Vasconcelos',
  'Bruno L.': 'Bruno Henrique Lopes',
  'Carla M.': 'Carla Beatriz Mendonça',
};

function tentarDescriptografar(valorCriptografado) {
  if (!valorCriptografado) return null;
  const partes = valorCriptografado.split(':');
  if (partes.length !== 3) return null;

  for (const keyHex of CHAVES_POSSIVEIS) {
    try {
      const chave = Buffer.from(keyHex, 'hex');
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
      const res = dadosDescript.toString('utf8');
      if (res && res.trim()) return res.trim();
    } catch {
      /* tenta próxima chave */
    }
  }
  return null;
}

export async function atualizarNomesCompletosPacientes() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.log('[atualizar-nomes] DATABASE_URL não definida.');
    return;
  }

  const client = new pg.Client({ connectionString: url });
  try {
    await client.connect();
    const { rows } = await client.query(
      'SELECT id, "nomeExibicao", "nomeCriptografado" FROM pacientes'
    );

    let atualizados = 0;
    for (const p of rows) {
      let nomeCompleto = tentarDescriptografar(p.nomeCriptografado);

      // Se não conseguiu descriptografar ou nome ainda está abreviado (ex: "Maria S.")
      if (!nomeCompleto || nomeCompleto.length <= (p.nomeExibicao?.length ?? 0)) {
        if (MAPA_NOMES_DEMO[p.nomeExibicao]) {
          nomeCompleto = MAPA_NOMES_DEMO[p.nomeExibicao];
        }
      }

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
