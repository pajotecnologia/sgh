'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Activity, Loader2, Save, Eye, Clock } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import {
  HORAS_FICHA_SINAIS,
  LINHAS_CONTROLE_HORARIO,
  LINHAS_GANHOS,
  LINHAS_PERDAS,
} from '@/lib/validations/sinais-vitais'

type Grid = Record<string, Record<string, string>>

type EvolucaoDia = {
  id: string
  turno: string
  dataReferencia: string
  status: string
  registradoEm: string | null
  nomeProfissional: string | null
  evolucaoClinica: string | null
}

const cellCls =
  'w-full h-8 border-0 text-center text-xs bg-transparent font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-primary/5 rounded'

const somaLinha = (linha: Record<string, string> | undefined): number => {
  if (!linha) return 0
  return Object.values(linha).reduce((acc, v) => {
    const n = parseFloat(String(v).replace(',', '.'))
    return acc + (Number.isFinite(n) ? n : 0)
  }, 0)
}

const somaGrid = (grid: Grid | undefined): number => {
  if (!grid) return 0
  return Object.values(grid).reduce((acc, linha) => acc + somaLinha(linha), 0)
}

export function AbaSinaisVitaisInternacao({ atendimentoId }: { atendimentoId: string }) {
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [fichaId, setFichaId] = useState<string | undefined>()
  const [dataReferencia, setDataReferencia] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [nomePaciente, setNomePaciente] = useState('')
  const [numeroProntuario, setNumeroProntuario] = useState('')
  const [leitoDescricao, setLeitoDescricao] = useState('')
  const [controle, setControle] = useState<Grid>({})
  const [ganhos, setGanhos] = useState<Grid>({})
  const [perdas, setPerdas] = useState<Grid>({})
  const [evolucoes, setEvolucoes] = useState<EvolucaoDia[]>([])

  const carregar = useCallback(
    async (data: string) => {
      setCarregando(true)
      try {
        const res = await fetch(`/api/atendimento/${atendimentoId}/sinais-vitais?data=${data}`)
        const json = await res.json()
        if (!json.sucesso) {
          toast.error(json.erro ?? 'Erro ao carregar ficha de sinais vitais.')
          return
        }
        const p = json.dados.prefill
        setFichaId(p.id)
        setNomePaciente(p.nomePaciente ?? '')
        setNumeroProntuario(p.numeroProntuario ?? '')
        setLeitoDescricao(p.leitoDescricao ?? '')
        setControle((p.controleHorario ?? {}) as Grid)
        setGanhos((p.balancoHidrico?.ganhos ?? {}) as Grid)
        setPerdas((p.balancoHidrico?.perdas ?? {}) as Grid)

        const resEvol = await fetch(`/api/atendimento/${atendimentoId}/evolucao-turno?data=${data}`)
        const jsonEvol = await resEvol.json()
        if (jsonEvol.sucesso) setEvolucoes(jsonEvol.dados.fichas ?? [])
      } catch {
        toast.error('Erro de conexão.')
      } finally {
        setCarregando(false)
      }
    },
    [atendimentoId]
  )

  useEffect(() => {
    carregar(format(new Date(), 'yyyy-MM-dd'))
  }, [carregar])

  const setCelula = (
    setter: React.Dispatch<React.SetStateAction<Grid>>,
    rowKey: string,
    hora: number,
    valor: string
  ) => {
    setter((prev) => ({
      ...prev,
      [rowKey]: { ...(prev[rowKey] ?? {}), [String(hora)]: valor },
    }))
  }

  const handleSalvar = async () => {
    setSalvando(true)
    try {
      const res = await fetch(`/api/atendimento/${atendimentoId}/sinais-vitais`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: fichaId,
          dataReferencia,
          nomePaciente,
          numeroProntuario,
          leitoDescricao,
          controleHorario: controle,
          balancoHidrico: { ganhos, perdas },
        }),
      })
      const json = await res.json()
      if (!json.sucesso) {
        toast.error(json.erro ?? 'Erro ao salvar ficha de sinais vitais.')
        return
      }
      setFichaId(json.dados.id)
      toast.success('Ficha de sinais vitais salva.')
    } catch {
      toast.error('Erro de conexão ao salvar.')
    } finally {
      setSalvando(false)
    }
  }

  if (carregando) {
    return (
      <div className="flex justify-center py-12 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin" aria-hidden />
      </div>
    )
  }

  const totalGanhos = somaGrid(ganhos)
  const totalPerdas = somaGrid(perdas)
  const balanco = totalGanhos - totalPerdas

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-sky-500/30 bg-sky-500/5 px-4 py-3 text-sm">
        <Activity className="h-5 w-5 text-sky-600 shrink-0" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-foreground">Ficha de Sinais Vitais — controle horário</p>
          <p className="text-muted-foreground text-xs mt-0.5">
            {nomePaciente}
            {leitoDescricao ? ` · Leito ${leitoDescricao}` : ''}
            {numeroProntuario ? ` · Prontuário ${numeroProntuario}` : ''}
          </p>
        </div>
        <div className="flex items-end gap-2">
          <div>
            <label className="text-xs font-medium text-foreground">Data</label>
            <input
              type="date"
              value={dataReferencia}
              onChange={(e) => {
                setDataReferencia(e.target.value)
                carregar(e.target.value)
              }}
              className="mt-1 block border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              aria-label="Data da ficha"
            />
          </div>
        </div>
      </div>

      <section className="bg-card border border-border rounded-xl p-4 overflow-x-auto">
        <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground mb-3">
          Controle horário
        </h3>
        <table className="border-collapse text-xs min-w-max">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-card border border-border px-2 py-1 text-left font-semibold min-w-[8rem]">
                Plano de cuidados
              </th>
              {HORAS_FICHA_SINAIS.map((h) => (
                <th key={h} className="border border-border px-1 py-1 font-semibold w-12 text-center">
                  {h}h
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {LINHAS_CONTROLE_HORARIO.map((linha) => (
              <tr key={linha.key}>
                <td className="sticky left-0 z-10 bg-card border border-border px-2 py-1 font-medium">
                  {linha.label}
                </td>
                {HORAS_FICHA_SINAIS.map((h) => (
                  <td key={h} className="border border-border p-0 w-12">
                    <input
                      type="text"
                      value={controle[linha.key]?.[String(h)] ?? ''}
                      onChange={(e) => setCelula(setControle, linha.key, h, e.target.value)}
                      className={cellCls}
                      aria-label={`${linha.label} ${h}h`}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="bg-card border border-border rounded-xl p-4 overflow-x-auto">
        <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground mb-3">
          Balanço hídrico
        </h3>
        <table className="border-collapse text-xs min-w-max">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-card border border-border px-2 py-1 text-left font-semibold min-w-[8rem]">
                Item
              </th>
              {HORAS_FICHA_SINAIS.map((h) => (
                <th key={h} className="border border-border px-1 py-1 font-semibold w-12 text-center">
                  {h}h
                </th>
              ))}
              <th className="border border-border px-2 py-1 font-semibold w-16 text-center bg-muted/40">
                Subtotal
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td
                colSpan={HORAS_FICHA_SINAIS.length + 2}
                className="sticky left-0 bg-emerald-50 dark:bg-emerald-950/30 border border-border px-2 py-1 font-bold text-emerald-800 dark:text-emerald-200 uppercase text-[11px]"
              >
                Ganhos
              </td>
            </tr>
            {LINHAS_GANHOS.map((linha) => (
              <tr key={linha.key}>
                <td className="sticky left-0 z-10 bg-card border border-border px-2 py-1 font-medium">
                  {linha.label}
                </td>
                {HORAS_FICHA_SINAIS.map((h) => (
                  <td key={h} className="border border-border p-0 w-12">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={ganhos[linha.key]?.[String(h)] ?? ''}
                      onChange={(e) => setCelula(setGanhos, linha.key, h, e.target.value)}
                      className={cellCls}
                      aria-label={`${linha.label} ${h}h`}
                    />
                  </td>
                ))}
                <td className="border border-border px-2 py-1 text-center font-mono tabular-nums font-semibold bg-muted/30">
                  {somaLinha(ganhos[linha.key]) || ''}
                </td>
              </tr>
            ))}
            <tr>
              <td
                colSpan={HORAS_FICHA_SINAIS.length + 2}
                className="sticky left-0 bg-rose-50 dark:bg-rose-950/30 border border-border px-2 py-1 font-bold text-rose-800 dark:text-rose-200 uppercase text-[11px]"
              >
                Perdas
              </td>
            </tr>
            {LINHAS_PERDAS.map((linha) => (
              <tr key={linha.key}>
                <td className="sticky left-0 z-10 bg-card border border-border px-2 py-1 font-medium">
                  {linha.label}
                </td>
                {HORAS_FICHA_SINAIS.map((h) => (
                  <td key={h} className="border border-border p-0 w-12">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={perdas[linha.key]?.[String(h)] ?? ''}
                      onChange={(e) => setCelula(setPerdas, linha.key, h, e.target.value)}
                      className={cellCls}
                      aria-label={`${linha.label} ${h}h`}
                    />
                  </td>
                ))}
                <td className="border border-border px-2 py-1 text-center font-mono tabular-nums font-semibold bg-muted/30">
                  {somaLinha(perdas[linha.key]) || ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex flex-wrap gap-4 mt-4 text-sm">
          <span className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 px-3 py-1.5">
            Ganhos: <b className="font-mono tabular-nums">{totalGanhos}</b>
          </span>
          <span className="rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 px-3 py-1.5">
            Perdas: <b className="font-mono tabular-nums">{totalPerdas}</b>
          </span>
          <span className="rounded-lg bg-primary/10 border border-primary/30 px-3 py-1.5">
            Total geral 24h (balanço): <b className="font-mono tabular-nums">{balanco}</b>
          </span>
        </div>
      </section>

      <button
        type="button"
        disabled={salvando}
        onClick={handleSalvar}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50"
        aria-label="Salvar ficha de sinais vitais"
      >
        {salvando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Salvar ficha de sinais vitais
      </button>

      {evolucoes.length > 0 ? (
        <section className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Evoluções por dia
          </h3>
          <ul className="divide-y divide-border max-h-80 overflow-y-auto">
            {evolucoes.map((item) => (
              <li key={item.id} className="py-3 px-1">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span
                    className={cn(
                      'font-bold px-2 py-0.5 rounded',
                      item.turno === 'DIURNA'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200'
                        : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-200'
                    )}
                  >
                    {item.turno === 'DIURNA' ? 'Diurna' : 'Noturna'}
                  </span>
                  <span className="text-muted-foreground">
                    {format(new Date(item.dataReferencia), 'dd/MM/yyyy')}
                  </span>
                  {item.registradoEm ? (
                    <span className="text-muted-foreground inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" aria-hidden />
                      {format(new Date(item.registradoEm), "dd/MM 'às' HH:mm")}
                    </span>
                  ) : null}
                  <Link
                    href={`/internamento/evolucao-turno/imprimir/${item.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                  >
                    <Eye className="h-3.5 w-3.5" aria-hidden />
                    Visualizar
                  </Link>
                </div>
                <p className="text-sm text-foreground line-clamp-2 mt-1">
                  {item.evolucaoClinica ?? '—'}
                </p>
                {item.nomeProfissional ? (
                  <p className="text-xs text-muted-foreground mt-0.5">{item.nomeProfissional}</p>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}
