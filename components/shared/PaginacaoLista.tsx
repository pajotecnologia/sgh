'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  POR_PAGINA_OPCOES,
  POR_PAGINA_PADRAO,
  POR_PAGINA_MAX,
  calcularTotalPaginas,
  intervaloExibicao,
  montarUrlPaginacao,
} from '@/lib/paginacao'
import { cn } from '@/lib/utils'

type PaginacaoListaProps = {
  total: number
  pagina: number
  porPagina: number
  /** Modo URL: caminho da página (ex.: /recepcao) */
  basePath?: string
  /** Modo URL: query params a preservar */
  queryPreservar?: Record<string, string | undefined>
  /** Prefixo para múltiplas paginações na mesma página (ex.: "atendidos") */
  prefixo?: string
  /** Modo local: callbacks */
  onPaginaChange?: (pagina: number) => void
  onPorPaginaChange?: (porPagina: number) => void
  className?: string
  compacto?: boolean
}

export function PaginacaoLista({
  total,
  pagina,
  porPagina,
  basePath,
  queryPreservar = {},
  prefixo = '',
  onPaginaChange,
  onPorPaginaChange,
  className,
  compacto = false,
}: PaginacaoListaProps) {
  const router = useRouter()
  const [porPaginaCustom, setPorPaginaCustom] = useState(
    POR_PAGINA_OPCOES.includes(porPagina as (typeof POR_PAGINA_OPCOES)[number])
      ? ''
      : String(porPagina)
  )

  const totalPaginas = calcularTotalPaginas(total, porPagina)
  const paginaAjustada = Math.min(Math.max(1, pagina), totalPaginas)
  const { inicio, fim } = intervaloExibicao(total, paginaAjustada, porPagina)
  const modoUrl = Boolean(basePath)

  if (total === 0) return null

  const handlePorPaginaChange = (valor: number) => {
    const limitado = Math.min(Math.max(1, valor), POR_PAGINA_MAX)
    if (modoUrl && basePath) {
      router.push(
        montarUrlPaginacao(basePath, queryPreservar, { pagina: 1, porPagina: limitado }, prefixo)
      )
      return
    }
    onPorPaginaChange?.(limitado)
    onPaginaChange?.(1)
  }

  const irParaPagina = (novaPagina: number) => {
    const p = Math.min(Math.max(1, novaPagina), totalPaginas)
    if (modoUrl && basePath) {
      router.push(montarUrlPaginacao(basePath, queryPreservar, { pagina: p, porPagina }, prefixo))
      return
    }
    onPaginaChange?.(p)
  }

  const btnNavCls =
    'inline-flex items-center justify-center rounded-md border border-border px-2 py-1 text-xs font-medium hover:bg-muted/50 disabled:opacity-40 disabled:pointer-events-none'

  const paginasVisiveis = () => {
    const paginas: number[] = []
    const maxVisiveis = compacto ? 3 : 5
    let start = Math.max(1, paginaAjustada - Math.floor(maxVisiveis / 2))
    const end = Math.min(totalPaginas, start + maxVisiveis - 1)
    start = Math.max(1, end - maxVisiveis + 1)
    for (let i = start; i <= end; i++) paginas.push(i)
    return paginas
  }

  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-3 border-t border-border bg-muted/10 px-3 py-2',
        compacto ? 'text-[10px]' : 'text-xs',
        className
      )}
      role="navigation"
      aria-label="Paginação da listagem"
    >
      <p className="text-muted-foreground">
        {total === 0 ? (
          'Nenhum registro'
        ) : (
          <>
            Exibindo <strong className="text-foreground">{inicio}–{fim}</strong> de{' '}
            <strong className="text-foreground">{total}</strong>
          </>
        )}
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-1.5 text-muted-foreground">
          <span>Por página</span>
          <select
            value={POR_PAGINA_OPCOES.includes(porPagina as (typeof POR_PAGINA_OPCOES)[number]) ? porPagina : 'custom'}
            onChange={(e) => {
              const v = e.target.value
              if (v === 'custom') return
              handlePorPaginaChange(Number(v))
              setPorPaginaCustom('')
            }}
            className="rounded-md border border-input bg-background px-1.5 py-1 text-xs"
            aria-label="Itens por página"
          >
            {POR_PAGINA_OPCOES.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
            <option value="custom">Outro</option>
          </select>
          {(porPaginaCustom ||
            !POR_PAGINA_OPCOES.includes(porPagina as (typeof POR_PAGINA_OPCOES)[number])) && (
            <input
              type="number"
              min={1}
              max={POR_PAGINA_MAX}
              value={porPaginaCustom || porPagina}
              onChange={(e) => setPorPaginaCustom(e.target.value)}
              onBlur={() => {
                const n = parseInt(porPaginaCustom || String(porPagina), 10)
                if (Number.isFinite(n) && n > 0) handlePorPaginaChange(n)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const n = parseInt(porPaginaCustom || String(porPagina), 10)
                  if (Number.isFinite(n) && n > 0) handlePorPaginaChange(n)
                }
              }}
              className="w-14 rounded-md border border-input bg-background px-1.5 py-1 text-xs"
              aria-label="Quantidade personalizada por página"
            />
          )}
        </label>

        {totalPaginas > 1 ? (
          <div className="flex items-center gap-1">
            {modoUrl && basePath ? (
              <>
                <Link
                  href={montarUrlPaginacao(
                    basePath,
                    queryPreservar,
                    { pagina: paginaAjustada - 1, porPagina },
                    prefixo
                  )}
                  className={cn(btnNavCls, paginaAjustada <= 1 && 'pointer-events-none opacity-40')}
                  aria-label="Página anterior"
                  tabIndex={paginaAjustada <= 1 ? -1 : 0}
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Link>
                {paginasVisiveis().map((p) => (
                  <Link
                    key={p}
                    href={montarUrlPaginacao(basePath, queryPreservar, { pagina: p, porPagina }, prefixo)}
                    className={cn(
                      'inline-flex min-w-[1.75rem] items-center justify-center rounded-md border px-1.5 py-1 text-xs font-medium',
                      p === paginaAjustada
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border hover:bg-muted/50'
                    )}
                    aria-label={`Página ${p}`}
                    aria-current={p === paginaAjustada ? 'page' : undefined}
                  >
                    {p}
                  </Link>
                ))}
                <Link
                  href={montarUrlPaginacao(
                    basePath,
                    queryPreservar,
                    { pagina: paginaAjustada + 1, porPagina },
                    prefixo
                  )}
                  className={cn(
                    btnNavCls,
                    paginaAjustada >= totalPaginas && 'pointer-events-none opacity-40'
                  )}
                  aria-label="Próxima página"
                  tabIndex={paginaAjustada >= totalPaginas ? -1 : 0}
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => irParaPagina(paginaAjustada - 1)}
                  disabled={paginaAjustada <= 1}
                  className={btnNavCls}
                  aria-label="Página anterior"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                {paginasVisiveis().map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => irParaPagina(p)}
                    className={cn(
                      'inline-flex min-w-[1.75rem] items-center justify-center rounded-md border px-1.5 py-1 text-xs font-medium',
                      p === paginaAjustada
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border hover:bg-muted/50'
                    )}
                    aria-label={`Página ${p}`}
                    aria-current={p === paginaAjustada ? 'page' : undefined}
                  >
                    {p}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => irParaPagina(paginaAjustada + 1)}
                  disabled={paginaAjustada >= totalPaginas}
                  className={btnNavCls}
                  aria-label="Próxima página"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </>
            )}
          </div>
        ) : null}
      </div>
    </div>
  )
}
