export const POR_PAGINA_PADRAO = 10
export const POR_PAGINA_OPCOES = [10, 20, 50, 100] as const
export const POR_PAGINA_MAX = 200

export type PaginacaoParams = {
  pagina?: string
  porPagina?: string
}

export type PaginacaoParsed = {
  pagina: number
  porPagina: number
  skip: number
  take: number
}

export function parsePaginacao(
  params: PaginacaoParams = {},
  prefixo = ''
): PaginacaoParsed {
  const chavePagina = prefixo ? `${prefixo}Pagina` : 'pagina'
  const chavePorPagina = prefixo ? `${prefixo}PorPagina` : 'porPagina'

  const rawPorPagina = parseInt(
    (params as Record<string, string | undefined>)[chavePorPagina] ?? '',
    10
  )
  const porPagina =
    Number.isFinite(rawPorPagina) && rawPorPagina > 0
      ? Math.min(rawPorPagina, POR_PAGINA_MAX)
      : POR_PAGINA_PADRAO

  const rawPagina = parseInt(
    (params as Record<string, string | undefined>)[chavePagina] ?? '',
    10
  )
  const pagina = Number.isFinite(rawPagina) && rawPagina > 0 ? rawPagina : 1
  const skip = (pagina - 1) * porPagina

  return { pagina, porPagina, skip, take: porPagina }
}

export function calcularTotalPaginas(total: number, porPagina: number) {
  if (total <= 0) return 1
  return Math.ceil(total / porPagina)
}

export function ajustarPagina(total: number, pagina: number, porPagina: number) {
  return Math.min(Math.max(1, pagina), calcularTotalPaginas(total, porPagina))
}

export function intervaloExibicao(total: number, pagina: number, porPagina: number) {
  if (total === 0) return { inicio: 0, fim: 0 }
  const inicio = (pagina - 1) * porPagina + 1
  const fim = Math.min(pagina * porPagina, total)
  return { inicio, fim }
}

export function fatiarLista<T>(items: T[], pagina: number, porPagina: number) {
  const skip = (pagina - 1) * porPagina
  return items.slice(skip, skip + porPagina)
}

export function montarUrlPaginacao(
  pathname: string,
  query: Record<string, string | undefined>,
  mudancas: { pagina?: number; porPagina?: number },
  prefixo = ''
) {
  const chavePagina = prefixo ? `${prefixo}Pagina` : 'pagina'
  const chavePorPagina = prefixo ? `${prefixo}PorPagina` : 'porPagina'

  const q = new URLSearchParams()
  for (const [k, v] of Object.entries(query)) {
    if (v && k !== chavePagina && k !== chavePorPagina) q.set(k, v)
  }

  const paginaAtual = parseInt(query[chavePagina] ?? '1', 10) || 1
  const porPaginaAtual =
    parseInt(query[chavePorPagina] ?? String(POR_PAGINA_PADRAO), 10) || POR_PAGINA_PADRAO

  const pagina = mudancas.pagina ?? paginaAtual
  const porPagina = mudancas.porPagina ?? porPaginaAtual

  if (pagina > 1) q.set(chavePagina, String(pagina))
  if (porPagina !== POR_PAGINA_PADRAO) q.set(chavePorPagina, String(porPagina))

  const s = q.toString()
  return s ? `${pathname}?${s}` : pathname
}
