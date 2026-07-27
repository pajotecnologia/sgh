'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Loader2, Save, SunMoon, Sun, Moon, Printer, FileCheck, Clock, Eye, Pencil } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import type { FichaEvolucaoTurnoForm } from '@/lib/validations/evolucao-turno'
import { LABEL_STATUS_EVOLUCAO_TURNO, LABEL_TURNO } from '@/lib/evolucao-turno-internacao'
import { SISTEMAS_AVALIACAO } from '@/lib/evolucao-turno-avaliacao'

const inputCls =
  'mt-1 w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30'
const labelCls = 'text-sm font-medium text-foreground'
const sectionCls = 'bg-card border border-border rounded-xl p-5 sm:p-6 space-y-4'

type FichaLista = {
  id: string
  turno: string
  dataReferencia: string
  status: string
  nomeProfissional: string | null
  conselhoProfissional: string | null
  evolucaoClinica: string | null
  registradoEm: string | null
  updatedAt: string
}

function labelFuncao(role?: string | null): { funcao: FichaEvolucaoTurnoForm['funcaoProfissional']; texto: string } {
  if (role === 'MEDICO') return { funcao: 'MEDICO', texto: 'Médico(a)' }
  if (role === 'ENFERMEIRO') return { funcao: 'ENFERMEIRO', texto: 'Enfermeiro(a)' }
  if (role === 'TECNICO_ENFERMAGEM') return { funcao: 'TECNICO_ENFERMAGEM', texto: 'Téc. enfermagem' }
  return { funcao: 'OUTRO', texto: 'Profissional' }
}

export function FormularioEvolucaoDiurnaNoturna({ atendimentoId }: { atendimentoId: string }) {
  const router = useRouter()
  const { data: session } = useSession()
  const [carregando, setCarregando] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [fichaId, setFichaId] = useState<string | undefined>()
  const [turno, setTurno] = useState<'DIURNA' | 'NOTURNA'>('DIURNA')
  const [dataReferencia, setDataReferencia] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [status, setStatus] = useState('RASCUNHO')
  const [numeroAtendimento, setNumeroAtendimento] = useState('')
  const [historico, setHistorico] = useState<FichaLista[]>([])

  const [nomePaciente, setNomePaciente] = useState('')
  const [numeroProntuario, setNumeroProntuario] = useState('')
  const [setorUnidade, setSetorUnidade] = useState('')
  const [leitoDescricao, setLeitoDescricao] = useState('')
  const [estadoGeral, setEstadoGeral] = useState('')
  const [evolucaoClinica, setEvolucaoClinica] = useState('')
  const [exameFisico, setExameFisico] = useState('')
  const [sv, setSv] = useState({
    paSistolica: '',
    paDiastolica: '',
    frequenciaCardiaca: '',
    frequenciaResp: '',
    spo2: '',
    temperatura: '',
    glicemia: '',
  })
  const [dietaEliminacoes, setDietaEliminacoes] = useState('')
  const [medicamentosProcedimentos, setMedicamentosProcedimentos] = useState('')
  const [intercorrencias, setIntercorrencias] = useState('')
  const [condutaProximoTurno, setCondutaProximoTurno] = useState('')
  const [avaliacaoSistemas, setAvaliacaoSistemas] = useState<Record<string, string>>({})

  const setAv = (key: string, value: string) =>
    setAvaliacaoSistemas((prev) => ({ ...prev, [key]: value }))
  const toggleAv = (key: string, value: string) =>
    setAvaliacaoSistemas((prev) => ({ ...prev, [key]: prev[key] === value ? '' : value }))

  const profissionalNome = session?.usuario?.nome ?? ''
  const profissional = labelFuncao(session?.usuario?.role)
  const profissionalConselho = session?.usuario?.crm ?? session?.usuario?.coren ?? ''

  const aplicarForm = (p: FichaEvolucaoTurnoForm) => {
    setFichaId(p.id)
    setTurno(p.turno)
    setDataReferencia(p.dataReferencia)
    setStatus(p.status)
    setNomePaciente(p.nomePaciente)
    setNumeroProntuario(p.numeroProntuario ?? '')
    setSetorUnidade(p.setorUnidade ?? '')
    setLeitoDescricao(p.leitoDescricao ?? '')
    setEstadoGeral(p.estadoGeral ?? '')
    setEvolucaoClinica(p.evolucaoClinica ?? '')
    setExameFisico(p.exameFisico ?? '')
    if (p.sinaisVitais) {
      setSv({
        paSistolica: p.sinaisVitais.paSistolica ?? '',
        paDiastolica: p.sinaisVitais.paDiastolica ?? '',
        frequenciaCardiaca: p.sinaisVitais.frequenciaCardiaca ?? '',
        frequenciaResp: p.sinaisVitais.frequenciaResp ?? '',
        spo2: p.sinaisVitais.spo2 ?? '',
        temperatura: p.sinaisVitais.temperatura ?? '',
        glicemia: p.sinaisVitais.glicemia ?? '',
      })
    }
    setDietaEliminacoes(p.dietaEliminacoes ?? '')
    setMedicamentosProcedimentos(p.medicamentosProcedimentos ?? '')
    setIntercorrencias(p.intercorrencias ?? '')
    setCondutaProximoTurno(p.condutaProximoTurno ?? '')
    setAvaliacaoSistemas(p.avaliacaoSistemas ?? {})
  }

  const carregar = useCallback(
    async (t: 'DIURNA' | 'NOTURNA', data: string) => {
      setCarregando(true)
      try {
        const res = await fetch(
          `/api/atendimento/${atendimentoId}/evolucao-turno?turno=${t}&data=${data}`
        )
        const json = await res.json()
        if (!json.sucesso) {
          toast.error(json.erro ?? 'Erro ao carregar ficha.')
          return
        }
        aplicarForm(json.dados.prefill as FichaEvolucaoTurnoForm)
        setNumeroAtendimento(json.dados.paciente.numeroAtendimento)
        setHistorico(json.dados.fichas ?? [])
      } catch {
        toast.error('Erro de conexão.')
      } finally {
        setCarregando(false)
      }
    },
    [atendimentoId]
  )

  useEffect(() => {
    const hora = new Date().getHours()
    const turnoInicial = hora >= 7 && hora < 19 ? 'DIURNA' : 'NOTURNA'
    setTurno(turnoInicial)
    carregar(turnoInicial, format(new Date(), 'yyyy-MM-dd'))
  }, [carregar])

  const handleTrocarTurnoData = () => {
    carregar(turno, dataReferencia)
  }

  const limparCampos = () => {
    setFichaId(undefined)
    setStatus('RASCUNHO')
    setEstadoGeral('')
    setEvolucaoClinica('')
    setExameFisico('')
    setSv({
      paSistolica: '',
      paDiastolica: '',
      frequenciaCardiaca: '',
      frequenciaResp: '',
      spo2: '',
      temperatura: '',
      glicemia: '',
    })
    setDietaEliminacoes('')
    setMedicamentosProcedimentos('')
    setIntercorrencias('')
    setCondutaProximoTurno('')
    setAvaliacaoSistemas({})
  }

  const handleSelecionarTurno = (novoTurno: 'DIURNA' | 'NOTURNA') => {
    if (novoTurno === turno) return
    setTurno(novoTurno)
    limparCampos()
  }

  const handleCarregarAvaliacaoDiurna = async () => {
    setCarregando(true)
    try {
      const res = await fetch(
        `/api/atendimento/${atendimentoId}/evolucao-turno?turno=DIURNA&data=${dataReferencia}`
      )
      const json = await res.json()
      if (!json.sucesso) {
        toast.error(json.erro ?? 'Erro ao carregar avaliação diurna.')
        return
      }
      const p = json.dados.prefill as FichaEvolucaoTurnoForm
      const av = p.avaliacaoSistemas ?? {}
      const temAlgo = Object.values(av).some((v) => String(v ?? '').trim())
      if (!temAlgo && !(p.evolucaoClinica ?? '').trim()) {
        toast.warning('Nenhuma avaliação diurna registrada nesta data.')
        return
      }
      setAvaliacaoSistemas(av)
      setEstadoGeral(p.estadoGeral ?? '')
      setEvolucaoClinica(p.evolucaoClinica ?? '')
      setExameFisico(p.exameFisico ?? '')
      setDietaEliminacoes(p.dietaEliminacoes ?? '')
      setMedicamentosProcedimentos(p.medicamentosProcedimentos ?? '')
      setIntercorrencias(p.intercorrencias ?? '')
      setCondutaProximoTurno(p.condutaProximoTurno ?? '')
      toast.success('Avaliação diurna carregada. Revise antes de registrar a noturna.')
    } catch {
      toast.error('Erro de conexão.')
    } finally {
      setCarregando(false)
    }
  }

  const montarPayload = (statusEnvio: string): FichaEvolucaoTurnoForm => ({
    id: fichaId,
    turno,
    dataReferencia,
    status: statusEnvio as FichaEvolucaoTurnoForm['status'],
    nomePaciente,
    numeroProntuario,
    setorUnidade,
    leitoDescricao,
    estadoGeral,
    evolucaoClinica,
    exameFisico,
    sinaisVitais: sv,
    avaliacaoSistemas,
    dietaEliminacoes,
    medicamentosProcedimentos,
    intercorrencias,
    condutaProximoTurno,
    nomeProfissional: profissionalNome,
    conselhoProfissional: profissionalConselho,
    funcaoProfissional: profissional.funcao,
  })

  const handleSalvar = async (statusEnvio: string) => {
    setEnviando(true)
    try {
      const res = await fetch(`/api/atendimento/${atendimentoId}/evolucao-turno`, {
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
      setFichaId(json.dados.id)
      setStatus(statusEnvio)
      toast.success(
        statusEnvio === 'REGISTRADA'
          ? `Evolução ${turno === 'DIURNA' ? 'diurna' : 'noturna'} registrada.`
          : 'Rascunho salvo.'
      )
      router.refresh()
      await carregar(turno, dataReferencia)
    } catch {
      toast.error('Erro de conexão ao salvar.')
    } finally {
      setEnviando(false)
    }
  }

  const handleAbrirHistorico = (item: FichaLista) => {
    const data = format(new Date(item.dataReferencia), 'yyyy-MM-dd')
    setTurno(item.turno as 'DIURNA' | 'NOTURNA')
    setDataReferencia(data)
    carregar(item.turno as 'DIURNA' | 'NOTURNA', data)
  }

  return (
    <div className="space-y-6 pb-16">
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-sky-500/30 bg-sky-500/5 px-4 py-3 text-sm">
        <SunMoon className="h-5 w-5 text-sky-600 shrink-0" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-foreground">Ficha de Evolução — Turno Diurno ou Noturno</p>
          <p className="text-muted-foreground text-xs mt-0.5">
            Atendimento {numeroAtendimento}. Uma ficha por data e turno (diurna 07h–19h / noturna 19h–07h).
          </p>
        </div>
        <span
          className={cn(
            'text-xs font-bold px-2.5 py-1 rounded-md shrink-0',
            status === 'REGISTRADA'
              ? 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200'
              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200'
          )}
        >
          {LABEL_STATUS_EVOLUCAO_TURNO[status] ?? status}
        </span>
      </div>

      <section className={cn(sectionCls, 'space-y-4')}>
        <h3 className="text-base font-semibold text-foreground border-b border-border pb-2">
          Seleção do turno
        </h3>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => handleSelecionarTurno('DIURNA')}
            className={cn(
              'inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-semibold transition-colors',
              turno === 'DIURNA'
                ? 'border-amber-500 bg-amber-500/15 text-amber-900 dark:text-amber-100'
                : 'border-border hover:bg-muted/50'
            )}
            aria-pressed={turno === 'DIURNA'}
          >
            <Sun className="h-4 w-4" aria-hidden />
            Diurna
          </button>
          <button
            type="button"
            onClick={() => handleSelecionarTurno('NOTURNA')}
            className={cn(
              'inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-semibold transition-colors',
              turno === 'NOTURNA'
                ? 'border-indigo-500 bg-indigo-500/15 text-indigo-900 dark:text-indigo-100'
                : 'border-border hover:bg-muted/50'
            )}
            aria-pressed={turno === 'NOTURNA'}
          >
            <Moon className="h-4 w-4" aria-hidden />
            Noturna
          </button>
        </div>
        <p className="text-xs text-muted-foreground">{LABEL_TURNO[turno]}</p>

        {turno === 'NOTURNA' ? (
          <button
            type="button"
            onClick={handleCarregarAvaliacaoDiurna}
            disabled={carregando}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-amber-500/50 bg-amber-500/10 text-sm font-medium text-amber-900 dark:text-amber-100 hover:bg-amber-500/20 disabled:opacity-50"
          >
            {carregando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sun className="h-4 w-4" aria-hidden />}
            Carregar avaliação diurna
          </button>
        ) : null}

        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className={labelCls}>Data do turno</label>
            <input
              type="date"
              value={dataReferencia}
              onChange={(e) => setDataReferencia(e.target.value)}
              className={cn(inputCls, 'w-auto min-w-[10rem]')}
              aria-label="Data do turno"
            />
          </div>
          <button
            type="button"
            onClick={handleTrocarTurnoData}
            disabled={carregando}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted disabled:opacity-50"
          >
            {carregando ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Carregar ficha
          </button>
        </div>
      </section>

      {carregando ? (
        <div className="flex justify-center py-12 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
          <section className={sectionCls}>
            <h3 className="text-base font-semibold border-b border-border pb-2">Avaliação de enfermagem</h3>
            <div className="space-y-5">
              {SISTEMAS_AVALIACAO.map((sistema) => (
                <div key={sistema.key} className="space-y-2">
                  <h4 className="text-sm font-semibold text-foreground">{sistema.titulo}</h4>
                  <div className="space-y-2">
                    {sistema.grupos.map((grupo) => (
                      <div key={grupo.key} className="flex flex-wrap items-center gap-2">
                        {grupo.label ? (
                          <span className="text-xs font-medium text-muted-foreground w-full sm:w-auto sm:min-w-[8rem]">
                            {grupo.label}
                          </span>
                        ) : null}
                        {grupo.opcoes.map((op) => {
                          const ativo = avaliacaoSistemas[grupo.key] === op.value
                          return (
                            <span key={op.value} className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => toggleAv(grupo.key, op.value)}
                                aria-pressed={ativo}
                                className={cn(
                                  'px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors',
                                  ativo
                                    ? 'border-primary bg-primary/10 text-primary'
                                    : 'border-border hover:bg-muted/50'
                                )}
                              >
                                {op.label}
                              </button>
                              {ativo && op.textoKey ? (
                                <input
                                  type="text"
                                  value={avaliacaoSistemas[op.textoKey] ?? ''}
                                  onChange={(e) => setAv(op.textoKey!, e.target.value)}
                                  placeholder={op.textoLabel}
                                  aria-label={op.textoLabel}
                                  className="w-28 border border-input rounded-lg px-2 py-1 text-xs bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                                />
                              ) : null}
                            </span>
                          )
                        })}
                      </div>
                    ))}
                    {sistema.camposTexto?.map((campo) => (
                      <div key={campo.key} className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-medium text-muted-foreground w-full sm:w-auto sm:min-w-[8rem]">
                          {campo.label}
                        </span>
                        <input
                          type="text"
                          value={avaliacaoSistemas[campo.key] ?? ''}
                          onChange={(e) => setAv(campo.key, e.target.value)}
                          aria-label={campo.label}
                          className="flex-1 min-w-[10rem] border border-input rounded-lg px-2 py-1 text-xs bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className={sectionCls}>
            <h3 className="text-base font-semibold border-b border-border pb-2">Intervenções de enfermagem</h3>
            <textarea
              rows={6}
              value={evolucaoClinica}
              onChange={(e) => setEvolucaoClinica(e.target.value)}
              className={inputCls}
              placeholder="Descreva as intervenções de enfermagem realizadas no turno…"
              aria-label="Intervenções de enfermagem"
            />
          </section>

          <section className={sectionCls}>
            <h3 className="text-base font-semibold border-b border-border pb-2">Profissional responsável</h3>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
              <span className="font-medium text-foreground">{profissionalNome || '—'}</span>
              <span className="text-muted-foreground">·</span>
              <span className="text-muted-foreground">{profissional.texto}</span>
              {profissionalConselho ? (
                <>
                  <span className="text-muted-foreground">·</span>
                  <span className="font-mono text-muted-foreground">{profissionalConselho}</span>
                </>
              ) : null}
            </div>
          </section>

          <div className="flex flex-wrap gap-3 sticky bottom-0 bg-background/95 backdrop-blur border-t border-border py-4">
            {fichaId ? (
              <Link
                href={`/internamento/evolucao-turno/imprimir/${fichaId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-muted"
              >
                <Printer className="h-4 w-4" aria-hidden />
                Imprimir
              </Link>
            ) : null}
            <button
              type="button"
              disabled={enviando}
              onClick={() => handleSalvar('RASCUNHO')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-muted disabled:opacity-50"
            >
              {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Salvar rascunho
            </button>
            <button
              type="button"
              disabled={enviando}
              onClick={() => handleSalvar('REGISTRADA')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50"
            >
              {enviando ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileCheck className="h-4 w-4" />
              )}
              Registrar evolução {turno === 'DIURNA' ? 'diurna' : 'noturna'}
            </button>
          </div>
        </form>
      )}

      {historico.length > 0 ? (
        <section className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Histórico de evoluções por turno
          </h3>
          <ul className="divide-y divide-border max-h-80 overflow-y-auto">
            {historico.map((item) => (
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
                  <span
                    className={cn(
                      'font-medium',
                      item.status === 'REGISTRADA' ? 'text-green-700' : 'text-muted-foreground'
                    )}
                  >
                    {LABEL_STATUS_EVOLUCAO_TURNO[item.status] ?? item.status}
                  </span>
                  <Link
                    href={`/internamento/evolucao-turno/imprimir/${item.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                  >
                    <Eye className="h-3.5 w-3.5" aria-hidden />
                    Visualizar
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleAbrirHistorico(item)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
                  >
                    <Pencil className="h-3.5 w-3.5" aria-hidden />
                    Abrir no formulário
                  </button>
                </div>
                <p className="text-sm text-foreground line-clamp-2 mt-1">
                  {item.evolucaoClinica ?? '—'}
                </p>
                {item.nomeProfissional ? (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {item.nomeProfissional}
                    {item.conselhoProfissional ? ` · ${item.conselhoProfissional}` : ''}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}
