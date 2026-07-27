'use client'

import { useCallback, useEffect, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Filter, X } from 'lucide-react'

type Status = '' | 'AGUARDANDO_TRIAGEM' | 'APROVADO' | 'REJEITADO'

export function FiltrosTriagemFarmacia() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const statusInicial = (searchParams.get('status') ?? '') as Status
  const alaInicial = searchParams.get('ala') ?? ''
  const leitoInicial = searchParams.get('leito') ?? ''

  const [status, setStatus] = useState<Status>(statusInicial)
  const [ala, setAla] = useState(alaInicial)
  const [leito, setLeito] = useState(leitoInicial)

  useEffect(() => {
    setStatus(statusInicial)
    setAla(alaInicial)
    setLeito(leitoInicial)
  }, [statusInicial, alaInicial, leitoInicial])

  const aplicar = useCallback(
    (s: Status, a: string, l: string) => {
      const params = new URLSearchParams(searchParams.toString())
      const aa = a.trim()
      const ll = l.trim()

      if (s) params.set('status', s)
      else params.delete('status')
      if (aa) params.set('ala', aa)
      else params.delete('ala')
      if (ll) params.set('leito', ll)
      else params.delete('leito')

      const q = params.toString()
      router.push(`${pathname}${q ? `?${q}` : ''}`)
    },
    [pathname, router, searchParams]
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    aplicar(status, ala, leito)
  }

  const handleLimpar = () => {
    setStatus('')
    setAla('')
    setLeito('')
    aplicar('', '', '')
  }

  const temFiltro = Boolean(statusInicial || alaInicial || leitoInicial)

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="flex flex-col lg:flex-row gap-2">
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div className="relative">
            <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" aria-hidden />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as Status)}
              className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border border-border bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label="Filtrar por status"
            >
              <option value="">Status (todos)</option>
              <option value="AGUARDANDO_TRIAGEM">Aguardando triagem</option>
              <option value="APROVADO">Aprovado</option>
              <option value="REJEITADO">Rejeitado</option>
            </select>
          </div>
          <input
            value={ala}
            onChange={(e) => setAla(e.target.value)}
            placeholder="Ala / Setor"
            className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Filtrar por ala"
          />
          <input
            value={leito}
            onChange={(e) => setLeito(e.target.value)}
            placeholder="Leito"
            className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Filtrar por leito"
          />
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            type="submit"
            className="px-3 py-2 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
          >
            Aplicar
          </button>
          {temFiltro ? (
            <button
              type="button"
              onClick={handleLimpar}
              className="inline-flex items-center gap-1 px-2.5 py-2 text-xs font-medium rounded-lg border border-border text-muted-foreground hover:bg-muted/50"
              aria-label="Limpar filtros"
            >
              <X className="h-3.5 w-3.5" aria-hidden />
              Limpar
            </button>
          ) : null}
        </div>
      </div>
      <p className="text-[10px] text-muted-foreground">
        Filtre por status de validação e por localização (ala/setor e leito).
      </p>
    </form>
  )
}
