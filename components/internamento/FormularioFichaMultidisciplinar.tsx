'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Loader2, Save, Users, Printer } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { FichaMultidisciplinarPrefill } from '@/lib/multidisciplinar-internacao'
import { LABEL_STATUS_FICHA_MULTIDISCIPLINAR } from '@/lib/multidisciplinar-internacao'
import type { FichaMultidisciplinarForm } from '@/lib/validations/multidisciplinar'
import { CampoIdentificacaoLeitura } from '@/components/internamento/CampoIdentificacaoLeitura'

const inputCls =
  'mt-1 w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30'
const labelCls = 'text-sm font-medium text-foreground'
const sectionCls = 'bg-card border border-border rounded-xl p-5 sm:p-6 space-y-4'

function SecaoTitulo({ titulo }: { titulo: string }) {
  return (
    <h3 className="text-base font-semibold text-foreground border-b border-border pb-2">{titulo}</h3>
  )
}

function CampoTexto({
  label,
  value,
  onChange,
  rows = 1,
  required,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  rows?: number
  required?: boolean
}) {
  const id = label.replace(/\s/g, '-').toLowerCase()
  if (rows > 1) {
    return (
      <div>
        <label htmlFor={id} className={labelCls}>
          {label}
        </label>
        <textarea
          id={id}
          rows={rows}
          required={required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={inputCls}
        />
      </div>
    )
  }
  return (
    <div>
      <label htmlFor={id} className={labelCls}>
        {label}
      </label>
      <input
        id={id}
        type="text"
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={inputCls}
      />
    </div>
  )
}

function RodapeProfissional({
  nome,
  setNome,
  conselho,
  setConselho,
  data,
  setData,
}: {
  nome: string
  setNome: (v: string) => void
  conselho: string
  setConselho: (v: string) => void
  data: string
  setData: (v: string) => void
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-border/60">
      <CampoTexto label="Profissional" value={nome} onChange={setNome} />
      <CampoTexto label="Conselho" value={conselho} onChange={setConselho} />
      <div>
        <label className={labelCls}>Data da avaliação</label>
        <input
          type="date"
          value={data}
          onChange={(e) => setData(e.target.value)}
          className={inputCls}
          aria-label="Data da avaliação"
        />
      </div>
    </div>
  )
}

export function FormularioFichaMultidisciplinar({ atendimentoId }: { atendimentoId: string }) {
  const router = useRouter()
  const [carregando, setCarregando] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [status, setStatus] = useState('RASCUNHO')
  const [numeroAtendimento, setNumeroAtendimento] = useState('')
  const [diasInternacao, setDiasInternacao] = useState<number | null>(null)

  const [nomePaciente, setNomePaciente] = useState('')
  const [numeroProntuario, setNumeroProntuario] = useState('')
  const [dataNascimento, setDataNascimento] = useState('')
  const [sexo, setSexo] = useState('NAO_INFORMADO')
  const [setorUnidade, setSetorUnidade] = useState('')
  const [leitoDescricao, setLeitoDescricao] = useState('')
  const [dataInternacao, setDataInternacao] = useState('')
  const [diagnosticoPrincipal, setDiagnosticoPrincipal] = useState('')
  const [cidPrincipal, setCidPrincipal] = useState('')

  const [medico, setMedico] = useState<FichaMultidisciplinarForm['medico']>({})
  const [enfermagem, setEnfermagem] = useState<FichaMultidisciplinarForm['enfermagem']>({})
  const [nutricao, setNutricao] = useState<FichaMultidisciplinarForm['nutricao']>({})
  const [fisioterapia, setFisioterapia] = useState<FichaMultidisciplinarForm['fisioterapia']>({})
  const [psicologia, setPsicologia] = useState<FichaMultidisciplinarForm['psicologia']>({})
  const [farmacia, setFarmacia] = useState<FichaMultidisciplinarForm['farmacia']>({})
  const [planoConjunto, setPlanoConjunto] = useState<FichaMultidisciplinarForm['planoConjunto']>({})

  const aplicarPrefill = (p: FichaMultidisciplinarPrefill) => {
    setStatus(p.status)
    setNumeroAtendimento(p.numeroAtendimento)
    setDiasInternacao(p.diasInternacao ?? null)
    setNomePaciente(p.nomePaciente)
    setNumeroProntuario(p.numeroProntuario ?? '')
    setDataNascimento(p.dataNascimento)
    setSexo(p.sexo)
    setSetorUnidade(p.setorUnidade ?? '')
    setLeitoDescricao(p.leitoDescricao ?? '')
    setDataInternacao(p.dataInternacao ?? '')
    setDiagnosticoPrincipal(p.diagnosticoPrincipal ?? '')
    setCidPrincipal(p.cidPrincipal ?? '')
    if (p.medico) setMedico(p.medico)
    if (p.enfermagem) setEnfermagem(p.enfermagem)
    if (p.nutricao) setNutricao(p.nutricao)
    if (p.fisioterapia) setFisioterapia(p.fisioterapia)
    if (p.psicologia) setPsicologia(p.psicologia)
    if (p.farmacia) setFarmacia(p.farmacia)
    if (p.planoConjunto) setPlanoConjunto(p.planoConjunto)
  }

  useEffect(() => {
    async function carregar() {
      setCarregando(true)
      try {
        const res = await fetch(`/api/atendimento/${atendimentoId}/multidisciplinar`)
        const json = await res.json()
        if (!json.sucesso) {
          toast.error(json.erro ?? 'Erro ao carregar ficha.')
          return
        }
        aplicarPrefill(json.dados.prefill as FichaMultidisciplinarPrefill)
      } catch {
        toast.error('Erro de conexão.')
      } finally {
        setCarregando(false)
      }
    }
    carregar()
  }, [atendimentoId])

  const montarPayload = (statusEnvio: string): FichaMultidisciplinarForm => ({
    status: statusEnvio as FichaMultidisciplinarForm['status'],
    nomePaciente,
    numeroProntuario,
    dataNascimento,
    sexo: sexo as FichaMultidisciplinarForm['sexo'],
    setorUnidade,
    leitoDescricao,
    dataInternacao,
    diagnosticoPrincipal,
    cidPrincipal,
    medico,
    enfermagem,
    nutricao,
    fisioterapia,
    psicologia,
    farmacia,
    planoConjunto,
  })

  const handleSalvar = async (statusEnvio: string) => {
    setEnviando(true)
    try {
      const res = await fetch(`/api/atendimento/${atendimentoId}/multidisciplinar`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(montarPayload(statusEnvio)),
      })
      const json = await res.json()
      if (!json.sucesso) {
        const det = json.detalhes
          ? Object.entries(json.detalhes as Record<string, string[]>)
              .map(([k, v]) => `${k}: ${v.join(', ')}`)
              .join(' | ')
          : ''
        toast.error(det ? `${json.erro} — ${det}` : (json.erro ?? 'Erro ao salvar.'))
        return
      }
      setStatus(statusEnvio)
      toast.success(
        statusEnvio === 'CONCLUIDA'
          ? 'Ficha multidisciplinar concluída.'
          : statusEnvio === 'EM_ANDAMENTO'
            ? 'Ficha salva — em andamento.'
            : 'Rascunho salvo.'
      )
      router.refresh()
    } catch {
      toast.error('Erro de conexão ao salvar.')
    } finally {
      setEnviando(false)
    }
  }

  const m = medico ?? {}
  const e = enfermagem ?? {}
  const n = nutricao ?? {}
  const f = fisioterapia ?? {}
  const p = psicologia ?? {}
  const fa = farmacia ?? {}
  const pl = planoConjunto ?? {}

  if (carregando) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin" aria-hidden />
        <p className="text-sm">Carregando ficha multidisciplinar…</p>
      </div>
    )
  }

  return (
    <form className="space-y-6 pb-16" onSubmit={(ev) => ev.preventDefault()}>
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-violet-500/30 bg-violet-500/5 px-4 py-3 text-sm">
        <Users className="h-5 w-5 text-violet-600 shrink-0" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-foreground">Ficha Multidisciplinar de Internação</p>
          <p className="text-muted-foreground text-xs mt-0.5">
            Atendimento {numeroAtendimento}
            {diasInternacao != null ? ` — ${diasInternacao} dia(s) de internação` : ''}. Avaliação
            conjunta: médico, enfermagem, nutrição, fisioterapia, psicologia e farmácia.
          </p>
        </div>
        <span
          className={cn(
            'text-xs font-bold px-2.5 py-1 rounded-md shrink-0',
            status === 'CONCLUIDA'
              ? 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200'
              : status === 'EM_ANDAMENTO'
                ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200'
                : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200'
          )}
        >
          {LABEL_STATUS_FICHA_MULTIDISCIPLINAR[status] ?? status}
        </span>
      </div>

      <section className={sectionCls}>
        <SecaoTitulo titulo="Identificação" />
        <p className="text-xs text-muted-foreground mb-3">Dados do paciente e da internação — somente leitura.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <CampoIdentificacaoLeitura label="Nome do paciente *" value={nomePaciente} col="sm:col-span-2 lg:col-span-3" />
          <CampoIdentificacaoLeitura label="Nº prontuário" value={numeroProntuario} mono />
          <CampoIdentificacaoLeitura label="Data de nascimento *" value={dataNascimento} />
          <CampoIdentificacaoLeitura label="Sexo *" value={sexo} />
          <CampoIdentificacaoLeitura label="Setor / unidade" value={setorUnidade} />
          <CampoIdentificacaoLeitura label="Leito" value={leitoDescricao} />
          <CampoIdentificacaoLeitura label="Data da internação" value={dataInternacao} />
          <CampoIdentificacaoLeitura label="Diagnóstico principal" value={diagnosticoPrincipal} col="sm:col-span-2" />
          <CampoIdentificacaoLeitura label="CID" value={cidPrincipal} mono />
        </div>
      </section>

      <section className={sectionCls}>
        <SecaoTitulo titulo="Avaliação médica" />
        <div className="space-y-4">
          <CampoTexto label="Resumo clínico" value={m.resumoClinico ?? ''} onChange={(v) => setMedico({ ...m, resumoClinico: v })} rows={4} />
          <CampoTexto label="Conduta" value={m.conduta ?? ''} onChange={(v) => setMedico({ ...m, conduta: v })} rows={3} />
          <CampoTexto label="Prognóstico" value={m.prognostico ?? ''} onChange={(v) => setMedico({ ...m, prognostico: v })} rows={2} />
          <CampoTexto label="Observações" value={m.observacoes ?? ''} onChange={(v) => setMedico({ ...m, observacoes: v })} rows={2} />
          <RodapeProfissional
            nome={m.nomeProfissional ?? ''}
            setNome={(v) => setMedico({ ...m, nomeProfissional: v })}
            conselho={m.conselho ?? ''}
            setConselho={(v) => setMedico({ ...m, conselho: v })}
            data={m.dataAvaliacao ?? ''}
            setData={(v) => setMedico({ ...m, dataAvaliacao: v })}
          />
        </div>
      </section>

      <section className={sectionCls}>
        <SecaoTitulo titulo="Avaliação de enfermagem" />
        <div className="space-y-4">
          <CampoTexto label="Diagnóstico de enfermagem" value={e.diagnosticoEnfermagem ?? ''} onChange={(v) => setEnfermagem({ ...e, diagnosticoEnfermagem: v })} rows={3} />
          <CampoTexto label="Intervenções" value={e.intervencoes ?? ''} onChange={(v) => setEnfermagem({ ...e, intervencoes: v })} rows={3} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <CampoTexto label="Integridade da pele" value={e.integridadePele ?? ''} onChange={(v) => setEnfermagem({ ...e, integridadePele: v })} />
            <CampoTexto label="Mobilidade / deambulação" value={e.mobilidade ?? ''} onChange={(v) => setEnfermagem({ ...e, mobilidade: v })} />
            <CampoTexto label="Eliminações" value={e.eliminacoes ?? ''} onChange={(v) => setEnfermagem({ ...e, eliminacoes: v })} />
            <CampoTexto label="Escala de Braden" value={e.escalaBraden ?? ''} onChange={(v) => setEnfermagem({ ...e, escalaBraden: v })} />
          </div>
          <CampoTexto label="Observações" value={e.observacoes ?? ''} onChange={(v) => setEnfermagem({ ...e, observacoes: v })} rows={2} />
          <RodapeProfissional
            nome={e.nomeProfissional ?? ''}
            setNome={(v) => setEnfermagem({ ...e, nomeProfissional: v })}
            conselho={e.conselho ?? ''}
            setConselho={(v) => setEnfermagem({ ...e, conselho: v })}
            data={e.dataAvaliacao ?? ''}
            setData={(v) => setEnfermagem({ ...e, dataAvaliacao: v })}
          />
        </div>
      </section>

      <section className={sectionCls}>
        <SecaoTitulo titulo="Nutrição" />
        <div className="space-y-4">
          <CampoTexto label="Risco nutricional" value={n.riscoNutricional ?? ''} onChange={(v) => setNutricao({ ...n, riscoNutricional: v })} />
          <CampoTexto label="Dieta atual" value={n.dietaAtual ?? ''} onChange={(v) => setNutricao({ ...n, dietaAtual: v })} />
          <CampoTexto label="Restrições alimentares" value={n.restricoes ?? ''} onChange={(v) => setNutricao({ ...n, restricoes: v })} />
          <CampoTexto label="Conduta / metas" value={n.condutaMetas ?? ''} onChange={(v) => setNutricao({ ...n, condutaMetas: v })} rows={3} />
          <CampoTexto label="Observações" value={n.observacoes ?? ''} onChange={(v) => setNutricao({ ...n, observacoes: v })} rows={2} />
          <RodapeProfissional
            nome={n.nomeProfissional ?? ''}
            setNome={(v) => setNutricao({ ...n, nomeProfissional: v })}
            conselho={n.conselho ?? ''}
            setConselho={(v) => setNutricao({ ...n, conselho: v })}
            data={n.dataAvaliacao ?? ''}
            setData={(v) => setNutricao({ ...n, dataAvaliacao: v })}
          />
        </div>
      </section>

      <section className={sectionCls}>
        <SecaoTitulo titulo="Fisioterapia" />
        <div className="space-y-4">
          <CampoTexto label="Avaliação funcional" value={f.avaliacaoFuncional ?? ''} onChange={(v) => setFisioterapia({ ...f, avaliacaoFuncional: v })} rows={4} />
          <CampoTexto label="Conduta / metas" value={f.condutaMetas ?? ''} onChange={(v) => setFisioterapia({ ...f, condutaMetas: v })} rows={3} />
          <CampoTexto label="Observações" value={f.observacoes ?? ''} onChange={(v) => setFisioterapia({ ...f, observacoes: v })} rows={2} />
          <RodapeProfissional
            nome={f.nomeProfissional ?? ''}
            setNome={(v) => setFisioterapia({ ...f, nomeProfissional: v })}
            conselho={f.conselho ?? ''}
            setConselho={(v) => setFisioterapia({ ...f, conselho: v })}
            data={f.dataAvaliacao ?? ''}
            setData={(v) => setFisioterapia({ ...f, dataAvaliacao: v })}
          />
        </div>
      </section>

      <section className={sectionCls}>
        <SecaoTitulo titulo="Psicologia / Serviço social" />
        <div className="space-y-4">
          <CampoTexto label="Aspectos psicossociais" value={p.aspectosPsicossociais ?? ''} onChange={(v) => setPsicologia({ ...p, aspectosPsicossociais: v })} rows={3} />
          <CampoTexto label="Rede de apoio" value={p.redeApoio ?? ''} onChange={(v) => setPsicologia({ ...p, redeApoio: v })} rows={2} />
          <CampoTexto label="Conduta / orientações" value={p.condutaOrientacoes ?? ''} onChange={(v) => setPsicologia({ ...p, condutaOrientacoes: v })} rows={3} />
          <CampoTexto label="Observações" value={p.observacoes ?? ''} onChange={(v) => setPsicologia({ ...p, observacoes: v })} rows={2} />
          <RodapeProfissional
            nome={p.nomeProfissional ?? ''}
            setNome={(v) => setPsicologia({ ...p, nomeProfissional: v })}
            conselho={p.conselho ?? ''}
            setConselho={(v) => setPsicologia({ ...p, conselho: v })}
            data={p.dataAvaliacao ?? ''}
            setData={(v) => setPsicologia({ ...p, dataAvaliacao: v })}
          />
        </div>
      </section>

      <section className={sectionCls}>
        <SecaoTitulo titulo="Farmácia clínica" />
        <div className="space-y-4">
          <CampoTexto label="Reconciliação medicamentosa" value={fa.reconciliacaoMedicamentosa ?? ''} onChange={(v) => setFarmacia({ ...fa, reconciliacaoMedicamentosa: v })} rows={4} />
          <CampoTexto label="Interações / alertas" value={fa.interacoesAlertas ?? ''} onChange={(v) => setFarmacia({ ...fa, interacoesAlertas: v })} rows={2} />
          <CampoTexto label="Orientações" value={fa.orientacoes ?? ''} onChange={(v) => setFarmacia({ ...fa, orientacoes: v })} rows={3} />
          <CampoTexto label="Observações" value={fa.observacoes ?? ''} onChange={(v) => setFarmacia({ ...fa, observacoes: v })} rows={2} />
          <RodapeProfissional
            nome={fa.nomeProfissional ?? ''}
            setNome={(v) => setFarmacia({ ...fa, nomeProfissional: v })}
            conselho={fa.conselho ?? ''}
            setConselho={(v) => setFarmacia({ ...fa, conselho: v })}
            data={fa.dataAvaliacao ?? ''}
            setData={(v) => setFarmacia({ ...fa, dataAvaliacao: v })}
          />
        </div>
      </section>

      <section className={sectionCls}>
        <SecaoTitulo titulo="Plano conjunto da equipe" />
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Data da reunião multidisciplinar</label>
              <input type="date" value={pl.dataReuniao ?? ''} onChange={(ev) => setPlanoConjunto({ ...pl, dataReuniao: ev.target.value })} className={inputCls} aria-label="Data reunião" />
            </div>
            <div>
              <label className={labelCls}>Próxima revisão</label>
              <input type="date" value={pl.dataProximaRevisao ?? ''} onChange={(ev) => setPlanoConjunto({ ...pl, dataProximaRevisao: ev.target.value })} className={inputCls} aria-label="Próxima revisão" />
            </div>
          </div>
          <CampoTexto label="Metas da equipe" value={pl.metasEquipe ?? ''} onChange={(v) => setPlanoConjunto({ ...pl, metasEquipe: v })} rows={4} />
          <CampoTexto label="Encaminhamentos pendentes" value={pl.encaminhamentos ?? ''} onChange={(v) => setPlanoConjunto({ ...pl, encaminhamentos: v })} rows={3} />
          <CampoTexto label="Observações gerais" value={pl.observacoesGerais ?? ''} onChange={(v) => setPlanoConjunto({ ...pl, observacoesGerais: v })} rows={3} />
          <div>
            <label className={labelCls}>Status da ficha</label>
            <select value={status} onChange={(ev) => setStatus(ev.target.value)} className={inputCls} aria-label="Status">
              <option value="RASCUNHO">Rascunho</option>
              <option value="EM_ANDAMENTO">Em andamento</option>
              <option value="CONCLUIDA">Concluída</option>
            </select>
          </div>
        </div>
      </section>

      <div className="flex flex-wrap gap-3 sticky bottom-0 bg-background/95 backdrop-blur border-t border-border py-4">
        <Link
          href={`/internamento/multidisciplinar/imprimir/${atendimentoId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-muted"
        >
          <Printer className="h-4 w-4" aria-hidden />
          Imprimir ficha
        </Link>
        <button
          type="button"
          disabled={enviando}
          onClick={() => handleSalvar(status)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-muted disabled:opacity-50"
        >
          {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Salvar
        </button>
        <button
          type="button"
          disabled={enviando}
          onClick={() => handleSalvar('EM_ANDAMENTO')}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-primary/40 text-sm font-medium text-primary hover:bg-primary/5 disabled:opacity-50"
        >
          Marcar em andamento
        </button>
        <button
          type="button"
          disabled={enviando}
          onClick={() => handleSalvar('CONCLUIDA')}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50"
        >
          Concluir ficha
        </button>
      </div>
    </form>
  )
}
