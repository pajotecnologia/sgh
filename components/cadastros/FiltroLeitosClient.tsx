'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

type Status = '' | 'DISPONIVEL' | 'OCUPADO' | 'INTERDITADO'
type Tipo = '' | 'UTI' | 'ENFERMARIA' | 'ISOLAMENTO' | 'OBSERVACAO'

const inputCls =
  'mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary'

export function FiltroLeitosClient() {
  const router = useRouter()
  const sp = useSearchParams()
  const [q, setQ] = useState((sp.get('q') ?? '').trim())
  const [status, setStatus] = useState<Status>(((sp.get('status') ?? '').trim() as Status) || '')
  const [tipo, setTipo] = useState<Tipo>(((sp.get('tipo') ?? '').trim() as Tipo) || '')
  const [ativo, setAtivo] = useState(sp.get('ativo') !== 'false')

  const handleAplicar = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (q.trim()) params.set('q', q.trim())
    if (status) params.set('status', status)
    if (tipo) params.set('tipo', tipo)
    if (!ativo) params.set('ativo', 'false')
    router.push(`/cadastros/leitos?${params.toString()}`)
  }

  const handleLimpar = () => {
    setQ('')
    setStatus('')
    setTipo('')
    setAtivo(true)
    router.push('/cadastros/leitos')
  }

  return (
    <form onSubmit={handleAplicar} className="no-print bg-card border border-border rounded-xl p-4 sm:p-5 space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="md:col-span-2">
          <label className="text-xs font-medium text-muted-foreground">Busca</label>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className={inputCls}
            placeholder="Ala, código ou quarto…"
            aria-label="Buscar leitos"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as Status)}
            className={inputCls}
            aria-label="Filtrar por status"
          >
            <option value="">Todos</option>
            <option value="DISPONIVEL">Disponível</option>
            <option value="OCUPADO">Ocupado</option>
            <option value="INTERDITADO">Interditado</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Tipo</label>
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value as Tipo)}
            className={inputCls}
            aria-label="Filtrar por tipo"
          >
            <option value="">Todos</option>
            <option value="ENFERMARIA">Enfermaria</option>
            <option value="UTI">UTI</option>
            <option value="ISOLAMENTO">Isolamento</option>
            <option value="OBSERVACAO">Observação</option>
          </select>
        </div>
      </div>

      <label className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <input
          type="checkbox"
          checked={ativo}
          onChange={(e) => setAtivo(e.target.checked)}
          className="h-4 w-4 rounded border-input accent-primary"
          aria-label="Mostrar apenas ativos"
        />
        Mostrar apenas leitos ativos
      </label>

      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-xl bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          Aplicar filtros
        </button>
        <button
          type="button"
          onClick={handleLimpar}
          className="inline-flex items-center justify-center rounded-xl border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
        >
          Limpar
        </button>
      </div>
    </form>
  )
}
