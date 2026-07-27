'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { FileText, Loader2, Save, UserCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { camposPosInternacaoVazios, type FichaInternacaoAltaPrefill } from '@/lib/ficha-internacao-alta'
import type { FichaInternacaoAltaForm } from '@/lib/validations/ficha-internacao-alta'

const inputCls =
  'mt-1 w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors'
const labelCls = 'text-xs font-semibold text-muted-foreground uppercase tracking-wide'
const checkCls = 'rounded border-input text-primary focus:ring-primary/30'

function Campo({
  label,
  children,
  col,
}: {
  label: string
  children: React.ReactNode
  col?: string
}) {
  return (
    <div className={cn('space-y-1', col)}>
      <label className={labelCls}>{label}</label>
      {children}
    </div>
  )
}

function CheckField({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className={checkCls}
      />
      {label}
    </label>
  )
}

export function FormularioCondicoesAlta({
  atendimentoId,
  numeroAtendimento,
}: {
  atendimentoId: string
  numeroAtendimento: string
}) {
  const [carregando, setCarregando] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [status, setStatus] = useState<FichaInternacaoAltaForm['status']>('RASCUNHO')
  const [nomePaciente, setNomePaciente] = useState('')

  const posInicial = camposPosInternacaoVazios()
  const [altaCurado, setAltaCurado] = useState(posInicial.altaCurado ?? false)
  const [altaMelhorado, setAltaMelhorado] = useState(posInicial.altaMelhorado ?? false)
  const [altaInternado, setAltaInternado] = useState(posInicial.altaInternado ?? false)
  const [altaPiorado, setAltaPiorado] = useState(posInicial.altaPiorado ?? false)
  const [obito, setObito] = useState(posInicial.obito ?? false)
  const [obitoData, setObitoData] = useState(posInicial.obitoData ?? '')
  const [obitoHora, setObitoHora] = useState(posInicial.obitoHora ?? '')
  const [obitoMais48h, setObitoMais48h] = useState(posInicial.obitoMais48h ?? false)
  const [obitoMenos48h, setObitoMenos48h] = useState(posInicial.obitoMenos48h ?? false)
  const [motivoDecisaoMedica, setMotivoDecisaoMedica] = useState(posInicial.motivoDecisaoMedica ?? false)
  const [motivoAltaPedida, setMotivoAltaPedida] = useState(posInicial.motivoAltaPedida ?? false)
  const [motivoTransferencia, setMotivoTransferencia] = useState(posInicial.motivoTransferencia ?? false)
  const [motivoIndisciplina, setMotivoIndisciplina] = useState(posInicial.motivoIndisciplina ?? false)
  const [transferenciaPara, setTransferenciaPara] = useState(posInicial.transferenciaPara ?? '')
  const [diagnosticoDefinitivo, setDiagnosticoDefinitivo] = useState(posInicial.diagnosticoDefinitivo ?? '')
  const [observacaoAlta, setObservacaoAlta] = useState(posInicial.observacaoAlta ?? '')
  const [dataAlta, setDataAlta] = useState(posInicial.dataAlta ?? '')
  const [medicoCremepeAlta, setMedicoCremepeAlta] = useState(posInicial.medicoCremepeAlta ?? '')

  useEffect(() => {
    async function carregar() {
      setCarregando(true)
      try {
        const res = await fetch(`/api/atendimento/${atendimentoId}/ficha-internacao-alta`)
        const json = await res.json()
        if (!json.sucesso) {
          toast.error(json.erro ?? 'Erro ao carregar dados da alta.')
          return
        }
        const prefill = json.dados.prefill as FichaInternacaoAltaPrefill
        setStatus(prefill.status ?? 'RASCUNHO')
        setNomePaciente(prefill.nome ?? '')
        setAltaCurado(prefill.altaCurado ?? false)
        setAltaMelhorado(prefill.altaMelhorado ?? false)
        setAltaInternado(prefill.altaInternado ?? false)
        setAltaPiorado(prefill.altaPiorado ?? false)
        setObito(prefill.obito ?? false)
        setObitoData(prefill.obitoData ?? '')
        setObitoHora(prefill.obitoHora ?? '')
        setObitoMais48h(prefill.obitoMais48h ?? false)
        setObitoMenos48h(prefill.obitoMenos48h ?? false)
        setMotivoDecisaoMedica(prefill.motivoDecisaoMedica ?? false)
        setMotivoAltaPedida(prefill.motivoAltaPedida ?? false)
        setMotivoTransferencia(prefill.motivoTransferencia ?? false)
        setMotivoIndisciplina(prefill.motivoIndisciplina ?? false)
        setTransferenciaPara(prefill.transferenciaPara ?? '')
        setDiagnosticoDefinitivo(prefill.diagnosticoDefinitivo ?? '')
        setObservacaoAlta(prefill.observacaoAlta ?? '')
        setDataAlta(prefill.dataAlta ?? '')
        setMedicoCremepeAlta(prefill.medicoCremepeAlta ?? '')
      } finally {
        setCarregando(false)
      }
    }
    carregar()
  }, [atendimentoId])

  async function salvar(statusSalvar: FichaInternacaoAltaForm['status']) {
    setEnviando(true)
    try {
      const res = await fetch(`/api/atendimento/${atendimentoId}/ficha-internacao-alta`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secaoSalvar: 'ALTA',
          status: statusSalvar,
          nome: nomePaciente || 'Paciente',
          ...camposPosInternacaoVazios(),
          altaCurado,
          altaMelhorado,
          altaInternado,
          altaPiorado,
          obito,
          obitoData,
          obitoHora,
          obitoMais48h,
          obitoMenos48h,
          motivoDecisaoMedica,
          motivoAltaPedida,
          motivoTransferencia,
          motivoIndisciplina,
          transferenciaPara,
          diagnosticoDefinitivo,
          observacaoAlta,
          dataAlta,
          medicoCremepeAlta,
        }),
      })
      const json = await res.json()
      if (!json.sucesso) {
        toast.error(json.erro ?? 'Erro ao salvar condições de alta.')
        return
      }
      setStatus(statusSalvar)
      toast.success(
        statusSalvar === 'CONCLUIDA'
          ? 'Condições de alta registradas.'
          : 'Dados de alta salvos.'
      )
    } catch {
      toast.error('Erro de conexão ao salvar.')
    } finally {
      setEnviando(false)
    }
  }

  if (carregando) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
        Carregando condições de alta…
      </div>
    )
  }

  const statusLabel =
    status === 'CONCLUIDA' ? 'Concluída' : status === 'EM_ANDAMENTO' ? 'Em andamento' : 'Rascunho'

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 rounded-xl border border-teal-500/20 bg-teal-500/5 px-4 py-3">
        <FileText className="h-5 w-5 text-teal-600 shrink-0" aria-hidden />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">Condições de alta e encerramento</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Atendimento {numeroAtendimento}
            {nomePaciente ? ` — ${nomePaciente}` : ''}
          </p>
        </div>
        <span className="shrink-0 text-xs font-bold px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
          {statusLabel}
        </span>
      </div>

      <div className="rounded-xl border border-dashed border-muted-foreground/30 bg-muted/20 px-5 py-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">Evolução clínica e relatório de enfermagem</p>
        <p className="mt-1">
          Registre as evoluções no menu{' '}
          <Link
            href={`/evolucoes/${atendimentoId}?aba=EVOLUCAO_DIURNA_NOTURNA`}
            className="text-primary font-medium hover:underline"
          >
            Evolução Noite/Dia
          </Link>{' '}
          e em{' '}
          <Link
            href={`/evolucoes/${atendimentoId}?aba=INSTRUCOES_ENFERMAGEM`}
            className="text-primary font-medium hover:underline"
          >
            Enfermagem
          </Link>
          . Os dados serão agregados automaticamente na ficha hospitalar.
        </p>
      </div>

      <section className="bg-card border border-border rounded-xl p-5 space-y-4 shadow-sm">
        <div>
          <p className={labelCls}>Condições de alta</p>
          <div className="mt-2 flex flex-wrap gap-4">
            <CheckField label="Curado" checked={altaCurado} onChange={setAltaCurado} />
            <CheckField label="Melhorado" checked={altaMelhorado} onChange={setAltaMelhorado} />
            <CheckField label="Internado" checked={altaInternado} onChange={setAltaInternado} />
            <CheckField label="Piorado" checked={altaPiorado} onChange={setAltaPiorado} />
          </div>
        </div>

        <div className="space-y-2">
          <CheckField label="Óbito" checked={obito} onChange={setObito} />
          {obito ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pl-6">
              <Campo label="Data óbito">
                <input
                  type="date"
                  value={obitoData}
                  onChange={(e) => setObitoData(e.target.value)}
                  className={inputCls}
                  aria-label="Data óbito"
                />
              </Campo>
              <Campo label="Hora óbito">
                <input
                  type="time"
                  value={obitoHora}
                  onChange={(e) => setObitoHora(e.target.value)}
                  className={inputCls}
                  aria-label="Hora óbito"
                />
              </Campo>
              <div className="sm:col-span-2 flex flex-wrap items-end gap-4 pb-1">
                <CheckField label="+ 48 horas" checked={obitoMais48h} onChange={setObitoMais48h} />
                <CheckField label="- 48 horas" checked={obitoMenos48h} onChange={setObitoMenos48h} />
              </div>
            </div>
          ) : null}
        </div>

        <div>
          <p className={labelCls}>Motivo da alta</p>
          <div className="mt-2 flex flex-wrap gap-4">
            <CheckField label="Decisão médica" checked={motivoDecisaoMedica} onChange={setMotivoDecisaoMedica} />
            <CheckField label="Alta pedida" checked={motivoAltaPedida} onChange={setMotivoAltaPedida} />
            <CheckField label="Transferência" checked={motivoTransferencia} onChange={setMotivoTransferencia} />
            <CheckField label="Indisciplina" checked={motivoIndisciplina} onChange={setMotivoIndisciplina} />
          </div>
        </div>

        <Campo label="Transferência para">
          <input
            type="text"
            value={transferenciaPara}
            onChange={(e) => setTransferenciaPara(e.target.value)}
            className={inputCls}
            aria-label="Transferência para"
          />
        </Campo>
        <Campo label="Diagnóstico definitivo">
          <textarea
            rows={4}
            value={diagnosticoDefinitivo}
            onChange={(e) => setDiagnosticoDefinitivo(e.target.value)}
            className={cn(inputCls, 'resize-y')}
            aria-label="Diagnóstico definitivo"
          />
        </Campo>
        <Campo label="Observação">
          <textarea
            rows={3}
            value={observacaoAlta}
            onChange={(e) => setObservacaoAlta(e.target.value)}
            className={cn(inputCls, 'resize-y')}
            aria-label="Observação alta"
          />
        </Campo>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Campo label="Data">
            <input
              type="date"
              value={dataAlta}
              onChange={(e) => setDataAlta(e.target.value)}
              className={inputCls}
              aria-label="Data alta"
            />
          </Campo>
          <Campo label="Médico — CREMEPE (alta)">
            <input
              type="text"
              value={medicoCremepeAlta}
              onChange={(e) => setMedicoCremepeAlta(e.target.value)}
              className={inputCls}
              aria-label="Médico alta"
            />
          </Campo>
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={enviando}
          onClick={() => salvar('EM_ANDAMENTO')}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-muted disabled:opacity-50"
          aria-label="Salvar condições de alta"
        >
          {enviando ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Save className="h-4 w-4" aria-hidden />}
          Salvar
        </button>
        <button
          type="button"
          disabled={enviando}
          onClick={() => salvar('CONCLUIDA')}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 ml-auto"
          aria-label="Concluir alta"
        >
          {enviando ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <UserCheck className="h-4 w-4" aria-hidden />}
          Concluir alta
        </button>
      </div>
    </div>
  )
}
