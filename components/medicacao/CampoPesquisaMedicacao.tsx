'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Search, X, Calendar } from 'lucide-react'

export function CampoPesquisaMedicacao() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const qInicial = searchParams.get('q') ?? ''
  const dataInicial = searchParams.get('data') ?? ''

  const [termo, setTermo] = useState(qInicial)
  const [data, setData] = useState(dataInicial)

  useEffect(() => {
    setTermo(qInicial)
    setData(dataInicial)
  }, [qInicial, dataInicial])

  const aplicarPesquisa = useCallback(
    (novoTermo: string, novaData: string) => {
      const params = new URLSearchParams(searchParams.toString())
      const t = novoTermo.trim()
      const d = novaData.trim()

      if (t) params.set('q', t)
      else params.delete('q')

      if (d) params.set('data', d)
      else params.delete('data')

      const query = params.toString()
      router.push(`${pathname}${query ? `?${query}` : ''}`)
    },
    [pathname, router, searchParams]
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    aplicarPesquisa(termo, data)
  }

  const handleLimpar = () => {
    setTermo('')
    setData('')
    aplicarPesquisa('', '')
  }

  const temFiltro = Boolean(qInicial || dataInicial)

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1 min-w-0">
          <Search
            className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none"
            aria-hidden
          />
          <input
            type="search"
            value={termo}
            onChange={(e) => setTermo(e.target.value)}
            placeholder="Nome ou nº do prontuário"
            className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border border-border bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Pesquisar por nome ou número do prontuário"
          />
        </div>
        <div className="relative w-full sm:w-36 shrink-0">
          <Calendar
            className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none"
            aria-hidden
          />
          <input
            type="text"
            value={data}
            onChange={(e) => setData(e.target.value)}
            placeholder="Data atend."
            className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border border-border bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Data do atendimento (dd/mm/aaaa)"
          />
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            type="submit"
            className="px-3 py-2 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
          >
            Buscar
          </button>
          {temFiltro && (
            <button
              type="button"
              onClick={handleLimpar}
              className="inline-flex items-center gap-1 px-2.5 py-2 text-xs font-medium rounded-lg border border-border text-muted-foreground hover:bg-muted/50"
              aria-label="Limpar pesquisa"
            >
              <X className="h-3.5 w-3.5" />
              Limpar
            </button>
          )}
        </div>
      </div>
      <p className="text-[10px] text-muted-foreground">
        Pesquise por nome, nº do prontuário (atendimento) ou CNS. Data no formato dd/mm/aaaa.
      </p>
    </form>
  )
}
