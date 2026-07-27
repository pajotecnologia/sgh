'use client'

import { useCallback, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import { Loader2, Plus, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { CATEGORIAS_MULTIPROFISSIONAL } from '@/lib/validations/evolucao-multiprofissional'

const inputCls =
  'mt-1 w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30'
const labelCls = 'text-sm font-medium text-foreground'
const sectionCls = 'bg-card border border-border rounded-xl p-5 sm:p-6 space-y-4'

const LABEL_CATEGORIA: Record<string, string> = {
  NUTRICAO: 'Nutrição',
  FISIOTERAPIA: 'Fisioterapia',
  SERVICO_SOCIAL: 'Serviço social',
  PSICOLOGIA: 'Psicologia',
  FARMACIA: 'Farmácia',
  FONOAUDIOLOGIA: 'Fonoaudiologia',
  PLANO_CONJUNTO: 'Plano conjunto',
  OUTRO: 'Outro',
}

type Registro = {
  id: string
  dataHora: string
  evolucao: string
  categoria: string | null
  nomeProfissional: string | null
  conselho: string | null
}

export function FormularioEvolucaoMultiprofissional({ atendimentoId }: { atendimentoId: string }) {
  const { data: session } = useSession()
  const [carregando, setCarregando] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [registros, setRegistros] = useState<Registro[]>([])

  const [dataHora, setDataHora] = useState('')
  const [categoria, setCategoria] = useState('NUTRICAO')
  const [evolucao, setEvolucao] = useState('')

  const agoraLocal = () => {
    const d = new Date()
    const off = d.getTimezoneOffset()
    return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16)
  }

  const carregar = useCallback(async () => {
    setCarregando(true)
    try {
      const res = await fetch(`/api/atendimento/${atendimentoId}/evolucao-multiprofissional`)
      const json = await res.json()
      if (!json.sucesso) {
        toast.error(json.erro ?? 'Erro ao carregar evolução multiprofissional.')
        return
      }
      setRegistros(json.dados.registros ?? [])
    } catch {
      toast.error('Erro de conexão.')
    } finally {
      setCarregando(false)
    }
  }, [atendimentoId])

  useEffect(() => {
    setDataHora(agoraLocal())
    carregar()
  }, [carregar])

  const handleAdicionar = async () => {
    if (evolucao.trim().length < 3) {
      toast.error('Descreva a evolução.')
      return
    }
    setEnviando(true)
    try {
      const res = await fetch(`/api/atendimento/${atendimentoId}/evolucao-multiprofissional`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dataHora: new Date(dataHora).toISOString(),
          evolucao,
          categoria,
        }),
      })
      const json = await res.json()
      if (!json.sucesso) {
        toast.error(json.erro ?? 'Erro ao salvar evolução.')
        return
      }
      toast.success('Evolução registrada.')
      setEvolucao('')
      setDataHora(agoraLocal())
      await carregar()
    } catch {
      toast.error('Erro de conexão ao salvar.')
    } finally {
      setEnviando(false)
    }
  }

  if (carregando) {
    return (
      <div className="flex justify-center py-12 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin" aria-hidden />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <section className={sectionCls}>
        <h3 className="text-base font-semibold border-b border-border pb-2">Nova evolução</h3>

        <div>
          <label className={labelCls}>Área / categoria</label>
          <div className="flex flex-wrap gap-2 mt-2">
            {CATEGORIAS_MULTIPROFISSIONAL.map((c) => {
              const ativo = categoria === c
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategoria(c)}
                  aria-pressed={ativo}
                  className={cn(
                    'px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors',
                    ativo
                      ? 'border-violet-500 bg-violet-500/15 text-violet-900 dark:text-violet-100'
                      : 'border-border hover:bg-muted/50'
                  )}
                >
                  {LABEL_CATEGORIA[c] ?? c}
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <label className={labelCls}>Data e hora</label>
          <input
            type="datetime-local"
            value={dataHora}
            onChange={(e) => setDataHora(e.target.value)}
            className={cn(inputCls, 'w-auto min-w-[14rem]')}
            aria-label="Data e hora"
          />
        </div>

        <div>
          <label className={labelCls}>Evolução — {LABEL_CATEGORIA[categoria] ?? categoria}</label>
          <textarea
            rows={5}
            value={evolucao}
            onChange={(e) => setEvolucao(e.target.value)}
            className={inputCls}
            placeholder="Descreva a avaliação / conduta da área selecionada…"
            aria-label="Evolução"
          />
        </div>

        {session?.usuario?.nome ? (
          <p className="text-xs text-muted-foreground">
            Será registrada por: <span className="font-medium text-foreground">{session.usuario.nome}</span>
            {session.usuario.crm || session.usuario.coren
              ? ` · ${session.usuario.crm ?? session.usuario.coren}`
              : ''}
          </p>
        ) : null}

        <button
          type="button"
          disabled={enviando}
          onClick={handleAdicionar}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50"
          aria-label="Adicionar evolução"
        >
          {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Adicionar evolução
        </button>
      </section>

      <section className={sectionCls}>
        <h3 className="text-base font-semibold border-b border-border pb-2">
          Evoluções registradas ({registros.length})
        </h3>
        {registros.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma evolução registrada ainda.</p>
        ) : (
          <ul className="space-y-3">
            {registros.map((r) => (
              <li key={r.id} className="border border-border rounded-lg p-3 bg-muted/10">
                <div className="flex flex-wrap items-center gap-2 text-xs mb-1.5">
                  <span className="inline-flex items-center gap-1 text-muted-foreground">
                    <Clock className="h-3 w-3" aria-hidden />
                    {format(new Date(r.dataHora), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </span>
                  {r.categoria ? (
                    <span className="font-semibold px-2 py-0.5 rounded bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-200">
                      {LABEL_CATEGORIA[r.categoria] ?? r.categoria}
                    </span>
                  ) : null}
                </div>
                <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{r.evolucao}</p>
                {r.nomeProfissional ? (
                  <p className="text-xs text-muted-foreground mt-1.5">
                    {r.nomeProfissional}
                    {r.conselho ? ` · ${r.conselho}` : ''}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
