'use client'

import { useState, useMemo, useEffect } from 'react'
import {
  POR_PAGINA_PADRAO,
  ajustarPagina,
  calcularTotalPaginas,
  fatiarLista,
  intervaloExibicao,
} from '@/lib/paginacao'

export function usePaginacaoLocal<T>(items: T[], chaveReset?: string | number) {
  const [pagina, setPagina] = useState(1)
  const [porPagina, setPorPagina] = useState(POR_PAGINA_PADRAO)

  useEffect(() => {
    setPagina(1)
  }, [chaveReset, porPagina])

  const total = items.length
  const totalPaginas = calcularTotalPaginas(total, porPagina)
  const paginaAjustada = ajustarPagina(total, pagina, porPagina)

  useEffect(() => {
    if (paginaAjustada !== pagina) setPagina(paginaAjustada)
  }, [paginaAjustada, pagina])

  const fatia = useMemo(
    () => fatiarLista(items, paginaAjustada, porPagina),
    [items, paginaAjustada, porPagina]
  )

  const { inicio, fim } = intervaloExibicao(total, paginaAjustada, porPagina)

  return {
    pagina: paginaAjustada,
    porPagina,
    total,
    totalPaginas,
    fatia,
    inicio,
    fim,
    setPagina,
    setPorPagina,
  }
}
