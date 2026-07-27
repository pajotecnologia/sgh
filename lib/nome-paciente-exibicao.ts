import { descriptografarSeguro } from '@/lib/encryption'

/** Descriptografa no servidor — usar em API routes e Server Components */
export function obterNomeCompletoPaciente(
  nomeExibicao: string,
  nomeCriptografado?: string | null
): string {
  const completo = descriptografarSeguro(nomeCriptografado)
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
  return nomeExibicao?.trim() || '—'
}

/** Anexa `nomeCompleto` ao objeto paciente (respostas JSON da API) */
export function enriquecerPacienteComNomeCompleto<T extends PacienteNomeCampos>(paciente: T) {
  return {
    ...paciente,
    nomeCompleto: obterNomeCompletoPaciente(paciente.nomeExibicao, paciente.nomeCriptografado),
  }
}
