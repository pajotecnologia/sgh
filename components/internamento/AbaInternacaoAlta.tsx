'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Loader2, BedDouble } from 'lucide-react'

type Leito = { id: string; ala: string; quarto: string | null; codigo: string; tipo: string; status: string }

export function AbaInternacaoAlta({
  atendimentoId,
  leitoAtualId,
  leitoAtual,
  setorUnidade,
  dataInternacao,
}: {
  atendimentoId: string
  leitoAtualId: string | null
  leitoAtual?: { ala: string; quarto: string | null; codigo: string; tipo: string } | null
  setorUnidade?: string | null
  dataInternacao?: string | null
}) {
  const [leitos, setLeitos] = useState<Leito[]>([])
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [leitoId, setLeitoId] = useState(leitoAtualId ?? '')

  useEffect(() => {
    setLeitoId(leitoAtualId ?? '')
  }, [leitoAtualId])

  useEffect(() => {
    async function carregar() {
      setCarregando(true)
      try {
        const res = await fetch('/api/cadastros/leitos?ativo=true')
        const json = await res.json()
        if (!json?.sucesso) {
          toast.error(json?.erro ?? 'Erro ao carregar leitos.')
          setLeitos([])
          return
        }
        const all = (json.dados ?? []) as Leito[]
        setLeitos(all)
      } catch {
        toast.error('Erro de conexão.')
        setLeitos([])
      } finally {
        setCarregando(false)
      }
    }
    carregar()
  }, [])

  const handleSalvar = async () => {
    setSalvando(true)
    try {
      const res = await fetch('/api/internamento/leito', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ atendimentoId, leitoId: leitoId ? leitoId : null }),
      })
      const json = await res.json()
      if (!res.ok || !json?.sucesso) {
        toast.error(json?.erro ?? 'Erro ao salvar leito.')
        return
      }
      toast.success('Leito atualizado.')
    } catch {
      toast.error('Erro de conexão.')
    } finally {
      setSalvando(false)
    }
  }

  const leitoDescricao = leitoAtual
    ? [leitoAtual.ala, leitoAtual.codigo, leitoAtual.quarto ? `Quarto ${leitoAtual.quarto}` : null, leitoAtual.tipo.replace(/_/g, ' ')]
        .filter(Boolean)
        .join(' • ')
    : null

  return (
    <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
      <div className="flex items-start gap-3">
        <BedDouble className="h-5 w-5 text-primary shrink-0 mt-0.5" aria-hidden />
        <div>
          <p className="text-sm font-semibold text-foreground">Leito do paciente</p>
          <p className="text-xs text-muted-foreground">
            Selecione o leito em que o paciente ficará durante a internação.
          </p>
        </div>
      </div>

      {(setorUnidade || dataInternacao || leitoDescricao) ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-xl border border-border/60 bg-muted/20 p-4 text-sm">
          {setorUnidade ? (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Setor / unidade</p>
              <p className="mt-1 text-foreground">{setorUnidade}</p>
            </div>
          ) : null}
          {dataInternacao ? (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Data da internação</p>
              <p className="mt-1 text-foreground">
                {new Date(`${dataInternacao}T12:00:00`).toLocaleDateString('pt-BR')}
              </p>
            </div>
          ) : null}
          {leitoDescricao ? (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Leito atual</p>
              <p className="mt-1 text-foreground">{leitoDescricao}</p>
            </div>
          ) : null}
        </div>
      ) : null}

      {carregando ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          Carregando leitos…
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <div className="md:col-span-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Leito</label>
            <select
              value={leitoId}
              onChange={(e) => setLeitoId(e.target.value)}
              className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              aria-label="Selecionar leito"
            >
              <option value="">— Sem leito definido —</option>
              {leitos.map((l) => (
                <option
                  key={l.id}
                  value={l.id}
                  disabled={l.status !== 'DISPONIVEL' && l.id !== leitoAtualId}
                >
                  {l.ala} • {l.codigo}
                  {l.quarto ? ` (Quarto ${l.quarto})` : ''} • {l.tipo}
                  {l.status && l.status !== 'DISPONIVEL' ? ` • ${l.status}` : ''}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-muted-foreground mt-1">
              Dica: leitos <strong>OCUPADO</strong> ou <strong>INTERDITADO</strong> não podem ser atribuídos.
            </p>
          </div>

          <button
            type="button"
            onClick={handleSalvar}
            disabled={salvando}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-white px-4 py-2 text-sm font-semibold hover:brightness-95 disabled:opacity-50"
          >
            {salvando ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
            Salvar
          </button>
        </div>
      )}
    </div>
  )
}
