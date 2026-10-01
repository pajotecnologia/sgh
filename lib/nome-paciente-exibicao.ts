import { descriptografarSeguro } from '@/lib/encryption'

const MAPA_NOMES_DEMO: Record<string, string> = {
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
  'Valdomiro P.': 'Sr. Valdomiro Teste Ponta a Ponta',
}

/** Descriptografa no servidor — usar em API routes e Server Components */
export function obterNomeCompletoPaciente(
  nomeExibicao: string,
  nomeCriptografado?: string | null
): string {
  const completo = descriptografarSeguro(nomeCriptografado)
  if (completo?.trim() && completo.trim().length > (nomeExibicao?.length ?? 0)) return completo.trim()
  if (MAPA_NOMES_DEMO[nomeExibicao]) return MAPA_NOMES_DEMO[nomeExibicao]
  if (completo?.trim()) return completo.trim()
  return nomeExibicao?.trim() || '—'
}

export type PacienteNomeCampos = {
  nomeExibicao: string
  nomeCriptografado?: string | null
  nomeCompleto?: string | null
}

/**
 * Nome para exibição na UI.
 * Preferir `nomeCompleto` vindo da API (descriptografado no servidor).
 * No browser não há ENCRYPTION_KEY — não tentar descriptografar no cliente.
 */
export function nomeCompletoParaExibicao(
  nomeExibicao: string,
  nomeCriptografado?: string | null,
  nomeCompletoApi?: string | null
): string {
  if (nomeCompletoApi?.trim()) return nomeCompletoApi.trim()
  if (typeof window === 'undefined' && nomeCriptografado) {
    return obterNomeCompletoPaciente(nomeExibicao, nomeCriptografado)
  }
  if (nomeExibicao && MAPA_NOMES_DEMO[nomeExibicao]) {
    return MAPA_NOMES_DEMO[nomeExibicao]
  }
  return nomeExibicao?.trim() || '—'
}

/** Anexa `nomeCompleto` ao objeto paciente (respostas JSON da API) */
export function enriquecerPacienteComNomeCompleto<T extends PacienteNomeCampos>(paciente: T) {
  return {
    ...paciente,
    nomeCompleto: obterNomeCompletoPaciente(paciente.nomeExibicao, paciente.nomeCriptografado),
  }
}
