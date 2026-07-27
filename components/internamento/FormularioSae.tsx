'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Loader2, Save, ClipboardList } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import {
  RISCOS_SAE,
  EXAME_FISICO_SAE,
  DIAGNOSTICOS_SAE,
  PRESCRICOES_SAE,
  type GrupoSae,
  type OpcaoSae,
} from '@/lib/sae-campos'

const inputCls =
  'mt-1 w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30'
const sectionCls = 'bg-card border border-border rounded-xl p-5 sm:p-6 space-y-4'
const textoInlineCls =
  'border border-input rounded-md px-2 py-1 text-xs bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 w-32'

type Selecoes = Record<string, string[]>
type Textos = Record<string, string>

export function FormularioSae({ atendimentoId }: { atendimentoId: string }) {
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [fichaId, setFichaId] = useState<string | undefined>()
  const [dataReferencia, setDataReferencia] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [nomePaciente, setNomePaciente] = useState('')
  const [numeroProntuario, setNumeroProntuario] = useState('')
  const [leitoDescricao, setLeitoDescricao] = useState('')
  const [selecoes, setSelecoes] = useState<Selecoes>({})
  const [textos, setTextos] = useState<Textos>({})
  const [diagnosticos, setDiagnosticos] = useState<string[]>([])
  const [prescricoes, setPrescricoes] = useState<string[]>([])
  const [registroDiurno, setRegistroDiurno] = useState('')
  const [registroNoturno, setRegistroNoturno] = useState('')

  const carregar = useCallback(
    async (data: string) => {
      setCarregando(true)
      try {
        const res = await fetch(`/api/atendimento/${atendimentoId}/sae?data=${data}`)
        const json = await res.json()
        if (!json.sucesso) {
          toast.error(json.erro ?? 'Erro ao carregar ficha SAE.')
          return
        }
        const p = json.dados.prefill
        setFichaId(p.id)
        setNomePaciente(p.nomePaciente ?? '')
        setNumeroProntuario(p.numeroProntuario ?? '')
        setLeitoDescricao(p.leitoDescricao ?? '')
        setSelecoes((p.selecoes ?? {}) as Selecoes)
        setTextos((p.textos ?? {}) as Textos)
        setDiagnosticos((p.diagnosticos ?? []) as string[])
        setPrescricoes((p.prescricoes ?? []) as string[])
        setRegistroDiurno(p.registroDiurno ?? '')
        setRegistroNoturno(p.registroNoturno ?? '')
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

  const setTexto = (key: string, valor: string) => setTextos((p) => ({ ...p, [key]: valor }))

  const toggleOpcao = (grupo: GrupoSae, value: string) => {
    setSelecoes((prev) => {
      const atual = prev[grupo.key] ?? []
      if (grupo.multi) {
        const novo = atual.includes(value) ? atual.filter((v) => v !== value) : [...atual, value]
        return { ...prev, [grupo.key]: novo }
      }
      return { ...prev, [grupo.key]: atual.includes(value) ? [] : [value] }
    })
  }

  const toggleLista = (
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    value: string
  ) => {
    setter((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]))
  }

  const handleSalvar = async () => {
    setSalvando(true)
    try {
      const res = await fetch(`/api/atendimento/${atendimentoId}/sae`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: fichaId,
          dataReferencia,
          nomePaciente,
          numeroProntuario,
          leitoDescricao,
          selecoes,
          textos,
          diagnosticos,
          prescricoes,
          registroDiurno,
          registroNoturno,
        }),
      })
      const json = await res.json()
      if (!json.sucesso) {
        toast.error(json.erro ?? 'Erro ao salvar ficha SAE.')
        return
      }
      setFichaId(json.dados.id)
      toast.success('Ficha SAE salva.')
    } catch {
      toast.error('Erro de conexão ao salvar.')
    } finally {
      setSalvando(false)
    }
  }

  const renderGrupo = (grupo: GrupoSae) => {
    const sel = selecoes[grupo.key] ?? []
    return (
      <div key={grupo.key} className="flex flex-wrap items-center gap-2">
        {grupo.label ? (
          <span className="text-xs font-medium text-muted-foreground w-full sm:w-auto sm:min-w-[10rem]">
            {grupo.label}
          </span>
        ) : null}
        {grupo.opcoes.map((op) => {
          const ativo = sel.includes(op.value)
          return (
            <span key={op.value} className="inline-flex items-center gap-1">
              <button
                type="button"
                onClick={() => toggleOpcao(grupo, op.value)}
                aria-pressed={ativo}
                className={cn(
                  'px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors',
                  ativo ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-muted/50'
                )}
              >
                {op.label}
              </button>
              {ativo && op.textoKey ? (
                <input
                  type="text"
                  value={textos[op.textoKey] ?? ''}
                  onChange={(e) => setTexto(op.textoKey!, e.target.value)}
                  placeholder={op.textoLabel}
                  aria-label={op.textoLabel}
                  className={textoInlineCls}
                />
              ) : null}
            </span>
          )
        })}
      </div>
    )
  }

  const renderItemLista = (
    op: OpcaoSae,
    lista: string[],
    setter: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    const ativo = lista.includes(op.value)
    return (
      <div key={op.value} className="flex items-center gap-2">
        <label className="flex items-center gap-2 text-sm cursor-pointer flex-1">
          <input
            type="checkbox"
            checked={ativo}
            onChange={() => toggleLista(setter, op.value)}
            className="rounded border-input"
          />
          <span>{op.label}</span>
        </label>
        {ativo && op.textoKey ? (
          <input
            type="text"
            value={textos[op.textoKey] ?? ''}
            onChange={(e) => setTexto(op.textoKey!, e.target.value)}
            placeholder={op.textoLabel}
            aria-label={op.textoLabel}
            className={textoInlineCls}
          />
        ) : null}
      </div>
    )
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
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-sky-500/30 bg-sky-500/5 px-4 py-3 text-sm">
        <ClipboardList className="h-5 w-5 text-sky-600 shrink-0" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-foreground">SAE — Sistematização da Assistência de Enfermagem</p>
          <p className="text-muted-foreground text-xs mt-0.5">
            {nomePaciente}
            {leitoDescricao ? ` · Leito ${leitoDescricao}` : ''}
            {numeroProntuario ? ` · Prontuário ${numeroProntuario}` : ''}
          </p>
        </div>
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

      <section className={sectionCls}>
        <h3 className="text-base font-semibold border-b border-border pb-2">Identificação de risco</h3>
        {renderGrupo(RISCOS_SAE)}
      </section>

      <section className={sectionCls}>
        <h3 className="text-base font-semibold border-b border-border pb-2">{EXAME_FISICO_SAE.titulo}</h3>
        <div className="space-y-3">{EXAME_FISICO_SAE.grupos.map(renderGrupo)}</div>
      </section>

      <section className={sectionCls}>
        <h3 className="text-base font-semibold border-b border-border pb-2">Diagnóstico de enfermagem</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
          {DIAGNOSTICOS_SAE.map((op) => renderItemLista(op, diagnosticos, setDiagnosticos))}
        </div>
        <div>
          <label className="text-sm font-medium text-foreground">Outros diagnósticos</label>
          <textarea
            rows={2}
            value={textos.diagnosticosOutros ?? ''}
            onChange={(e) => setTexto('diagnosticosOutros', e.target.value)}
            className={inputCls}
            placeholder="Adicione outros diagnósticos de enfermagem, um por linha…"
            aria-label="Outros diagnósticos"
          />
        </div>
      </section>

      <section className={sectionCls}>
        <h3 className="text-base font-semibold border-b border-border pb-2">Prescrição de enfermagem</h3>
        <div className="grid grid-cols-1 gap-y-1">
          {PRESCRICOES_SAE.map((op) => renderItemLista(op, prescricoes, setPrescricoes))}
        </div>
        <div>
          <label className="text-sm font-medium text-foreground">Outras prescrições</label>
          <textarea
            rows={2}
            value={textos.prescricoesOutros ?? ''}
            onChange={(e) => setTexto('prescricoesOutros', e.target.value)}
            className={inputCls}
            placeholder="Adicione outras prescrições de enfermagem, uma por linha…"
            aria-label="Outras prescrições"
          />
        </div>
      </section>

      <section className={sectionCls}>
        <h3 className="text-base font-semibold border-b border-border pb-2">Registros</h3>
        <div>
          <label className="text-sm font-medium text-foreground">Registro diurno</label>
          <textarea
            rows={3}
            value={registroDiurno}
            onChange={(e) => setRegistroDiurno(e.target.value)}
            className={inputCls}
            aria-label="Registro diurno"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground">Registro noturno</label>
          <textarea
            rows={3}
            value={registroNoturno}
            onChange={(e) => setRegistroNoturno(e.target.value)}
            className={inputCls}
            aria-label="Registro noturno"
          />
        </div>
      </section>

      <button
        type="button"
        disabled={salvando}
        onClick={handleSalvar}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50"
        aria-label="Salvar ficha SAE"
      >
        {salvando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Salvar ficha SAE
      </button>
    </div>
  )
}
