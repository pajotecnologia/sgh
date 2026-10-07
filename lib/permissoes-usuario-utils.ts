import { MENU_PERMISSOES, type ChavePermissao } from '@/lib/permissoes-menu'

/**
 * Normaliza um mapa de permissões vindo de entrada externa.
 * Mantida sem dependências server-only para permitir testes unitários isolados.
 */
export function normalizarPermissoes(
  valor: unknown
): Partial<Record<ChavePermissao, boolean>> {
  if (!valor || typeof valor !== 'object' || Array.isArray(valor)) return {}

  const resultado: Partial<Record<ChavePermissao, boolean>> = {}
  const permitidas = new Set(MENU_PERMISSOES.map((item) => item.chave))

  for (const [chave, permitido] of Object.entries(valor as Record<string, unknown>)) {
    if (permitidas.has(chave as ChavePermissao) && typeof permitido === 'boolean') {
      resultado[chave as ChavePermissao] = permitido
    }
  }

  return resultado
}
