import { descriptografar } from '@/lib/encryption';

/** Nome completo (campo criptografado) para listas e painel; fallback para nomeExibicao. */
export function nomeCompletoParaExibicao(nomeExibicao: string, nomeCriptografado: string): string {
  try {
    if (nomeCriptografado) return descriptografar(nomeCriptografado);
  } catch {
    /* mantém nomeExibicao */
  }
  return nomeExibicao;
}
