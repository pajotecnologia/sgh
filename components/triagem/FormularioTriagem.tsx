'use client'
// components/triagem/FormularioTriagem.tsx
// Formulário de triagem — Protocolo Manchester otimizado

import { useEffect, useState, type ComponentType } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import {
  Loader2,
  Check,
  Heart,
  Thermometer,
  Activity,
  Droplets,
  Weight,
  AlertTriangle,
  ClipboardList,
  Stethoscope,
  Printer,
} from 'lucide-react'
import { schemaRegistrarTriagem, type RegistrarTriagemForm } from '@/lib/validations/triagem'
import { registerTextoCadastro } from '@/lib/cadastro-maiusculo'
import { BadgeManchester } from './BadgeManchester'
import { SeletorCorManchester } from './SeletorCorManchester'
import { calcularImc } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { notificarFilaAtualizada } from '@/lib/fila-triagem-sync'
import type { CorTriagem } from '@/types'
import { IRRADIACAO_DOR_SITE_KEYS, IRRADIACAO_DOR_SITE_LABELS } from '@/lib/ficha-dor-irradiacao'
import {
  PARAMETROS_CLINICOS_ESTADO_KEYS,
  PARAMETROS_CLINICOS_CIRCULATORY_KEYS,
  ESTADO_CONSCIENCIA_SINAIS_LABELS,
  type EstadoConscienciaSinaisKey,
} from '@/lib/triagem-estado-consciencia-sinais'

const CATEGORIAS_QUEIXA = [
  { valor: 'dor', label: 'Dor' },
  { valor: 'dispneia', label: 'Dispneia' },
  { valor: 'alteracao_consciencia', label: 'Alt. consciência' },
  { valor: 'trauma', label: 'Trauma' },
  { valor: 'febre', label: 'Febre' },
  { valor: 'sangramento', label: 'Sangramento' },
  { valor: 'vomito', label: 'Vômito' },
  { valor: 'outro', label: 'Outro' },
] as const

interface FormularioTriagemProps {
  atendimentoId: string
  nomePaciente: string
  numeroAtendimento: string
  procedenciaTexto?: string | null
  /** Pré-preenchimento do cadastro — evita redigitar na triagem */
  alergiasPreCadastro?: string
  medicacoesPreCadastro?: string
  triagemInicial?: Omit<RegistrarTriagemForm, 'atendimentoId'>
}

export function FormularioTriagem({
  atendimentoId,
  nomePaciente,
  numeroAtendimento,
  procedenciaTexto,
  alergiasPreCadastro,
  medicacoesPreCadastro,
  triagemInicial,
}: FormularioTriagemProps) {
  const router = useRouter()
  const [imcInfo, setImcInfo] = useState<{ imc: number; classificacao: string } | null>(null)
  const [triagemConcluida, setTriagemConcluida] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegistrarTriagemForm>({
    resolver: zodResolver(schemaRegistrarTriagem),
    defaultValues: {
      atendimentoId,
      sinaisVitais: { escalaDor: 0, ...(triagemInicial?.sinaisVitais ?? {}) },
      acidenteTrabalho: triagemInicial?.acidenteTrabalho ?? false,
      irradiacaoDorSites: triagemInicial?.irradiacaoDorSites ?? [],
      corClassificacao: triagemInicial?.corClassificacao as CorTriagem | undefined,
      queixaPrincipal: triagemInicial?.queixaPrincipal ?? '',
      categoriaQueixa: triagemInicial?.categoriaQueixa,
      tempoQueixa: triagemInicial?.tempoQueixa,
      doencasPreexistentes: triagemInicial?.doencasPreexistentes,
      medicacoes: triagemInicial?.medicacoes ?? medicacoesPreCadastro ?? '',
      alergias: triagemInicial?.alergias ?? alergiasPreCadastro ?? '',
      regraDor: triagemInicial?.regraDor,
      tipoDorToracica: triagemInicial?.tipoDorToracica as RegistrarTriagemForm['tipoDorToracica'],
      duracaoDor: triagemInicial?.duracaoDor,
      localizacaoDor: triagemInicial?.localizacaoDor,
      fluxograma: triagemInicial?.fluxograma,
      discriminador: triagemInicial?.discriminador,
      especialidade: triagemInicial?.especialidade,
      estadoConscienciaSinais: triagemInicial?.estadoConscienciaSinais ?? [],
    },
  })

  const corSelecionada = watch('corClassificacao') as CorTriagem | undefined
  const categoriaQueixa = watch('categoriaQueixa')
  const escalaDorVal = watch('sinaisVitais.escalaDor') ?? 0
  const peso = watch('sinaisVitais.peso')
  const altura = watch('sinaisVitais.altura')
  const estadoConscienciaSinais = watch('estadoConscienciaSinais') ?? []
  const irradiacaoDorSites = watch('irradiacaoDorSites') ?? []
  const mostrarCamposDor = categoriaQueixa === 'dor'

  useEffect(() => {
    const p = triagemInicial?.sinaisVitais?.peso
    const a = triagemInicial?.sinaisVitais?.altura
    if (p && a) setImcInfo(calcularImc(p, a))
  }, [triagemInicial])

  useEffect(() => {
    setValue('regraDor', `ESCALA DE DOR: ${escalaDorVal}/10`, { shouldDirty: true, shouldValidate: false })
  }, [escalaDorVal, setValue])

  function atualizarImc() {
    if (peso && altura && peso > 0 && altura > 0) {
      setImcInfo(calcularImc(peso, altura))
    } else {
      setImcInfo(null)
    }
  }

  function toggleParametroClinico(key: EstadoConscienciaSinaisKey) {
    const cur = watch('estadoConscienciaSinais') ?? []
    const sel = cur.includes(key)
    setValue(
      'estadoConscienciaSinais',
      sel ? cur.filter((k) => k !== key) : [...cur, key],
      { shouldDirty: true }
    )
  }

  function toggleIrradiacaoSite(key: (typeof IRRADIACAO_DOR_SITE_KEYS)[number]) {
    const cur = watch('irradiacaoDorSites') ?? []
    const sel = cur.includes(key)
    setValue(
      'irradiacaoDorSites',
      sel ? cur.filter((k) => k !== key) : [...cur, key],
      { shouldDirty: true }
    )
  }

  async function onSubmit(dados: RegistrarTriagemForm) {
    try {
      const res = await fetch('/api/triagem', {
        method: triagemInicial ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados),
      })
      const json = await res.json()
      if (!json.sucesso) {
        toast.error(json.erro ?? 'Erro ao registrar triagem.')
        return
      }
      setTriagemConcluida(true)
      notificarFilaAtualizada('TRIAGEM_CONCLUIDA')
      toast.success(triagemInicial ? 'Triagem atualizada com sucesso!' : 'Triagem registrada com sucesso!', {
        description: `Classificação: ${dados.corClassificacao}`,
      })
      router.refresh()
    } catch {
      toast.error('Erro de conexão. Tente novamente.')
    }
  }

  const inputNum = (erro?: string) =>
    cn(
      'w-full px-3 py-2 rounded-lg border bg-background text-sm outline-none transition-all text-center font-mono',
      'focus:ring-2 focus:ring-primary/30 focus:border-primary',
      erro ? 'border-destructive' : 'border-input'
    )

  const inputText = (erro?: string) =>
    cn(
      'w-full px-3 py-2 rounded-lg border bg-background text-sm outline-none transition-all',
      'focus:ring-2 focus:ring-primary/30 focus:border-primary',
      erro ? 'border-destructive' : 'border-input'
    )

  const chipClass = (sel: boolean) =>
    cn(
      'min-h-[2.75rem] px-2 py-2 rounded-lg border text-center text-[11px] font-semibold leading-snug transition-all',
      sel
        ? 'border-primary bg-primary/15 text-primary shadow-sm ring-2 ring-primary/25'
        : 'border-border bg-background hover:bg-muted/70'
    )

  const hrefImprimirFicha = `/recepcao/imprimir/${encodeURIComponent(numeroAtendimento)}`

  if (triagemConcluida) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 pb-10">
        <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/90 dark:bg-emerald-950/40 p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <Check className="h-7 w-7" />
            </div>
            <div className="flex-1 min-w-0 space-y-2">
              <p className="text-lg font-bold text-emerald-900 dark:text-emerald-100">
                {triagemInicial ? 'Triagem atualizada' : 'Triagem registrada'}
              </p>
              <p className="text-sm text-emerald-800/90 dark:text-emerald-200/90">
                <span className="font-semibold">{nomePaciente}</span>
                <span className="text-muted-foreground"> · Atend. </span>
                <span className="font-mono">{numeroAtendimento}</span>
              </p>
              {corSelecionada ? (
                <div className="pt-1">
                  <BadgeManchester cor={corSelecionada} size="lg" />
                </div>
              ) : null}
            </div>
          </div>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:justify-end">
            <button
              type="button"
              onClick={() => router.push('/triagem')}
              className="px-6 py-3 rounded-xl border border-border bg-background text-sm font-semibold hover:bg-muted transition-colors"
            >
              Voltar à fila
            </button>
            <Link
              href={hrefImprimirFicha}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 shadow-md transition-colors"
            >
              <Printer className="h-5 w-5" />
              Imprimir ficha do paciente
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const SectionTitle = ({
    num,
    title,
    icon: Icon,
  }: {
    num: number
    title: string
    icon: ComponentType<{ className?: string }>
  }) => (
    <h3 className="text-base font-bold mb-4 flex items-center gap-2 border-b border-border pb-2">
      <span className="w-6 h-6 bg-primary text-white rounded-md text-xs flex items-center justify-center font-mono shadow-sm">
        {num}
      </span>
      <Icon className="h-5 w-5 text-muted-foreground" />
      {title}
    </h3>
  )

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-4xl mx-auto pb-10">
      <input type="hidden" {...register('regraDor')} />

      {/* Cabeçalho do paciente */}
      <div className="bg-muted/40 rounded-xl border border-border p-4 flex flex-wrap items-center gap-4 shadow-sm">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
          <span className="text-primary font-bold text-lg">
            {(nomePaciente.trim().charAt(0) || '?').toUpperCase()}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-lg leading-tight">{nomePaciente}</p>
          <p className="text-sm font-mono text-muted-foreground">Atend: {numeroAtendimento}</p>
          {procedenciaTexto?.trim() ? (
            <p className="text-xs text-muted-foreground mt-1">
              <span className="font-semibold text-foreground">Procedência:</span>{' '}
              {procedenciaTexto.trim()}
            </p>
          ) : null}
        </div>
        {corSelecionada ? (
          <BadgeManchester cor={corSelecionada} size="lg" className="shrink-0" />
        ) : null}
      </div>

      {/* 1 — Queixa principal */}
      <section className="bg-card border border-border p-6 rounded-xl shadow-sm space-y-6">
        <SectionTitle num={1} title="Queixa principal" icon={ClipboardList} />

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 flex flex-wrap items-center justify-between gap-2">
              <span>
                Queixa principal <span className="text-destructive">*</span>
              </span>
              <span className="text-xs text-muted-foreground font-normal">
                Tempo:
                <input
                  {...register('tempoQueixa', registerTextoCadastro)}
                  placeholder="EX: 3H"
                  className="ml-1.5 w-20 px-2 py-0.5 border rounded-md bg-background"
                />
              </span>
            </label>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {CATEGORIAS_QUEIXA.map((c) => (
                <button
                  key={c.valor}
                  type="button"
                  onClick={() => setValue('categoriaQueixa', c.valor, { shouldDirty: true })}
                  className={cn(
                    'px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all',
                    categoriaQueixa === c.valor
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:bg-muted'
                  )}
                >
                  {c.label}
                </button>
              ))}
            </div>
            <textarea
              {...register('queixaPrincipal', registerTextoCadastro)}
              rows={3}
              placeholder="Descreva a queixa em detalhes..."
              className={cn(inputText(errors.queixaPrincipal?.message), 'resize-none')}
            />
            {errors.queixaPrincipal ? (
              <p className="text-xs text-destructive mt-1">{errors.queixaPrincipal.message}</p>
            ) : null}
          </div>

          <details className="rounded-lg border border-border bg-muted/20 px-4 py-3">
            <summary className="text-sm font-medium cursor-pointer select-none">
              Fluxograma e destino (opcional)
            </summary>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 pt-2 border-t border-border">
              <div>
                <label className="text-xs font-medium mb-1 block">Fluxograma</label>
                <input
                  {...register('fluxograma', registerTextoCadastro)}
                  className={inputText()}
                  placeholder="EX: DOR ABDOMINAL"
                />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">Discriminador</label>
                <input
                  {...register('discriminador', registerTextoCadastro)}
                  className={inputText()}
                  placeholder="EX: DOR INTENSA"
                />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">Especialidade</label>
                <input
                  {...register('especialidade', registerTextoCadastro)}
                  className={inputText()}
                  placeholder="EX: CLÍNICA MÉDICA"
                />
              </div>
            </div>
          </details>
        </div>
      </section>

      {/* 2 — Sinais vitais + escala de dor */}
      <section className="bg-card border border-border p-6 rounded-xl shadow-sm">
        <SectionTitle num={2} title="Sinais Vitais" icon={Activity} />

        <div className="mb-5 rounded-xl border border-border bg-muted/20 p-4">
          <label className="text-sm font-medium flex items-center justify-between mb-3">
            <span>Escala de dor (EVA)</span>
            <span
              className={cn(
                'font-bold text-xl tabular-nums',
                escalaDorVal > 7 ? 'text-red-500' : escalaDorVal > 3 ? 'text-amber-500' : 'text-green-600'
              )}
            >
              {escalaDorVal}
              <span className="text-xs text-muted-foreground font-normal"> / 10</span>
            </span>
          </label>
          <input
            type="range"
            min={0}
            max={10}
            step={1}
            {...register('sinaisVitais.escalaDor', { valueAsNumber: true })}
            className="w-full accent-primary h-2 bg-muted rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground mt-2 font-semibold uppercase">
            <span>Sem dor</span>
            <span>Moderada</span>
            <span>Intensa</span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
          <div className="col-span-2 bg-muted/30 rounded-lg border border-border p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <Heart className="h-4 w-4 text-red-500" />
              <span className="text-sm font-medium">PA (mmHg)</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                {...register('sinaisVitais.paSistolica', { valueAsNumber: true })}
                placeholder="Sist."
                className={inputNum(errors.sinaisVitais?.paSistolica?.message)}
              />
              <span className="text-muted-foreground font-bold">/</span>
              <input
                type="number"
                {...register('sinaisVitais.paDiastolica', { valueAsNumber: true })}
                placeholder="Diast."
                className={inputNum(errors.sinaisVitais?.paDiastolica?.message)}
              />
            </div>
          </div>

          {[
            { icon: Activity, color: 'text-pink-500', label: 'FC (bpm)', field: 'frequenciaCardiaca' as const },
            { icon: Activity, color: 'text-teal-500', label: 'FR (irpm)', field: 'frequenciaResp' as const },
            { icon: Droplets, color: 'text-blue-500', label: 'SpO₂ (%)', field: 'spo2' as const, step: '0.1' },
            { icon: Thermometer, color: 'text-orange-500', label: 'Temp (°C)', field: 'temperatura' as const, step: '0.1' },
            { icon: Droplets, color: 'text-purple-500', label: 'Glicemia', field: 'glicemia' as const },
          ].map(({ icon: Icon, color, label, field, step }) => (
            <div key={field} className="bg-muted/30 rounded-lg border border-border p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <Icon className={cn('h-4 w-4', color)} />
                <span className="text-xs font-medium">{label}</span>
              </div>
              <input
                type="number"
                step={step}
                {...register(`sinaisVitais.${field}`, { valueAsNumber: true })}
                placeholder="—"
                className={inputNum()}
              />
            </div>
          ))}

          <div className="col-span-2 bg-muted/30 rounded-lg border border-border p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <Weight className="h-4 w-4 text-green-600" />
              <span className="text-xs font-medium">Peso (kg) / Altura (cm)</span>
            </div>
            <div className="flex gap-2">
              <input
                type="number"
                step="0.1"
                {...register('sinaisVitais.peso', { valueAsNumber: true })}
                onBlur={atualizarImc}
                placeholder="Kg"
                className={inputNum()}
              />
              <input
                type="number"
                {...register('sinaisVitais.altura', { valueAsNumber: true })}
                onBlur={atualizarImc}
                placeholder="cm"
                className={inputNum()}
              />
              {imcInfo ? (
                <div className="flex-1 px-2 py-2 bg-primary/5 rounded-lg border border-primary/20 text-center min-w-[4.5rem]">
                  <span className="text-xs font-bold text-primary">IMC {imcInfo.imc.toFixed(1)}</span>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {/* 3 — Histórico (pré-preenchido do cadastro quando disponível) */}
      <section className="bg-card border border-border p-6 rounded-xl shadow-sm">
        <SectionTitle num={3} title="Histórico Clínico" icon={ClipboardList} />
        {(alergiasPreCadastro || medicacoesPreCadastro) && !triagemInicial ? (
          <p className="text-xs text-muted-foreground mb-4 -mt-2">
            Campos pré-preenchidos com dados do cadastro — revise e ajuste se necessário.
          </p>
        ) : null}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Doenças preexistentes</label>
            <input
              {...register('doencasPreexistentes', registerTextoCadastro)}
              className={inputText()}
              placeholder="HAS, DM, ASMA..."
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Medicações em uso</label>
            <input
              {...register('medicacoes', registerTextoCadastro)}
              className={inputText()}
              placeholder="LOSARTANA, METFORMINA..."
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block text-red-600 dark:text-red-400">
              Alergias
            </label>
            <input
              {...register('alergias', registerTextoCadastro)}
              className={inputText()}
              placeholder="DIPIRONA, PENICILINA..."
            />
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer p-2.5 rounded-lg border border-border hover:bg-muted/50 w-full transition-colors">
              <input
                type="checkbox"
                {...register('acidenteTrabalho')}
                className="w-4 h-4 rounded text-primary focus:ring-primary"
              />
              <span className="text-sm font-medium">Acidente de trabalho</span>
            </label>
          </div>
        </div>
      </section>

      {/* 4 — Parâmetros clínicos (+ dor condicional) */}
      <section className="bg-card border border-border p-6 rounded-xl shadow-sm">
        <SectionTitle num={4} title="Parâmetros Clínicos" icon={Stethoscope} />

        <p className="text-xs text-muted-foreground mb-4">
          Marque os sinais presentes — várias opções ao mesmo tempo.
        </p>

        <div className="space-y-5 mb-6">
          <div>
            <p className="text-xs font-semibold mb-2">Estado de consciência e comportamento</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
              {PARAMETROS_CLINICOS_ESTADO_KEYS.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleParametroClinico(key)}
                  className={chipClass(estadoConscienciaSinais.includes(key))}
                >
                  {ESTADO_CONSCIENCIA_SINAIS_LABELS[key]}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold mb-2">Sinais circulatórios e respiratórios</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2">
              {PARAMETROS_CLINICOS_CIRCULATORY_KEYS.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleParametroClinico(key)}
                  className={chipClass(estadoConscienciaSinais.includes(key))}
                >
                  {ESTADO_CONSCIENCIA_SINAIS_LABELS[key]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {mostrarCamposDor ? (
          <div className="pt-5 border-t border-border space-y-4">
            <p className="text-sm font-semibold text-foreground">Detalhes da dor</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Tipo de dor torácica</label>
                <select {...register('tipoDorToracica')} className={inputText()}>
                  <option value="">Selecione...</option>
                  <option value="NORMAL">Normal / sem dor</option>
                  <option value="QUEIMACAO">Queimação</option>
                  <option value="APERTO">Aperto</option>
                  <option value="PONTADA">Pontada</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Localização</label>
                <input
                  {...register('localizacaoDor', registerTextoCadastro)}
                  className={inputText()}
                  placeholder="EX: PRECORDIAL"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Duração</label>
                <input
                  {...register('duracaoDor', registerTextoCadastro)}
                  className={inputText()}
                  placeholder="EX: 3 HORAS"
                />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Irradiação (marque conforme aplicável)</p>
              <div className="flex flex-wrap gap-2">
                {IRRADIACAO_DOR_SITE_KEYS.map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleIrradiacaoSite(key)}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                      irradiacaoDorSites.includes(key)
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border hover:bg-muted'
                    )}
                  >
                    {IRRADIACAO_DOR_SITE_LABELS[key]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground pt-2 border-t border-border">
            Selecione a categoria <strong>Dor</strong> na queixa principal para exibir campos específicos de dor.
          </p>
        )}
      </section>

      {/* 5 — Manchester: classificação (último passo antes de salvar) */}
      <section className="bg-card border border-border p-6 rounded-xl shadow-sm space-y-6">
        <SectionTitle num={5} title="Classificação Manchester" icon={AlertTriangle} />

        <div>
          <p className="text-sm font-semibold mb-3">
            Cor de risco <span className="text-destructive">*</span>
          </p>
          <SeletorCorManchester
            value={corSelecionada ?? null}
            onChange={(cor) => setValue('corClassificacao', cor, { shouldValidate: true })}
            error={errors.corClassificacao?.message}
          />
          <p className="text-xs text-muted-foreground mt-2">
            Defina a classificação por último para reduzir retrabalho durante a avaliação.
          </p>
        </div>
      </section>

      <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-border">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-8 py-3 border border-border rounded-xl text-sm font-bold hover:bg-muted transition-all"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting || !corSelecionada}
          className="flex items-center justify-center gap-2 px-10 py-3 bg-primary text-white rounded-xl text-sm font-black hover:bg-primary/90 disabled:opacity-60 transition-all shadow-lg shadow-primary/20"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" /> Registrando...
            </>
          ) : (
            <>
              <Check className="h-5 w-5" /> Finalizar triagem
            </>
          )}
        </button>
      </div>
    </form>
  )
}
