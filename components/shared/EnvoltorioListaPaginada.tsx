'use client'

import type { ReactNode } from 'react'
import { usePaginacaoLocal } from '@/hooks/usePaginacaoLocal'
import { PaginacaoLista } from '@/components/shared/PaginacaoLista'

type EnvoltorioListaPaginadaProps<T> = {
  items: T[]
  chaveReset?: string | number
  compacto?: boolean
  className?: string
  children: (fatia: T[]) => ReactNode
}

export function EnvoltorioListaPaginada<T>({
  items,
  chaveReset,
  compacto = false,
  className,
  children,
}: EnvoltorioListaPaginadaProps<T>) {
  const pag = usePaginacaoLocal(items, chaveReset ?? items.length)

  return (
    <>
      {children(pag.fatia)}
      <PaginacaoLista
        total={pag.total}
        pagina={pag.pagina}
        porPagina={pag.porPagina}
        onPaginaChange={pag.setPagina}
        onPorPaginaChange={pag.setPorPagina}
        compacto={compacto}
        className={className}
      />
    </>
  )
}
