'use client';
// components/triagem/FormularioTriagem.tsx
// Formulário de triagem com protocolo de Manchester completo - Layout Vertical

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
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
} from 'lucide-react';
import { schemaRegistrarTriagem, type RegistrarTriagemForm } from '@/lib/validations/triagem';
import { registerTextoCadastro } from '@/lib/cadastro-maiusculo';
import { BadgeManchester } from './BadgeManchester';
import { calcularImc } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { CorTriagem } from '@/types';
import { IRRADIACAO_DOR_SITE_KEYS, IRRADIACAO_DOR_SITE_LABELS } from '@/lib/ficha-dor-irradiacao';
import {
  PARAMETROS_CLINICOS_ESTADO_KEYS,
  PARAMETROS_CLINICOS_CIRCULATORY_KEYS,
  ESTADO_CONSCIENCIA_SINAIS_LABELS,
} from '@/lib/triagem-estado-consciencia-sinais';

const CATEGORIAS_QUEIXA = [
  { valor: 'dor', label: '🩹 Dor' },
  { valor: 'dispneia', label: '🫁 Dispneia' },
  { valor: 'alteracao_consciencia', label: '🧠 Alt. Consciência' },
  { valor: 'trauma', label: '🚑 Trauma' },
  { valor: 'febre', label: '🌡️ Febre' },
  { valor: 'sangramento', label: '🩸 Sangramento' },
  { valor: 'vomito', label: '🤢 Vômito' },
  { valor: 'outro', label: '❓ Outro' },
] as const;

const CORES_MANCHESTER: { cor: CorTriagem; label: string; descricao: string }[] = [
  { cor: 'VERMELHO', label: 'Vermelho', descricao: 'Emergência (Imediato)' },
  { cor: 'LARANJA', label: 'Laranja', descricao: 'Muito Urgente (≤ 10 min)' },
  { cor: 'AMARELO', label: 'Amarelo', descricao: 'Urgente (≤ 30 min)' },
  { cor: 'VERDE', label: 'Verde', descricao: 'Pouco Urgente (≤ 120 min)' },
  { cor: 'AZUL', label: 'Azul', descricao: 'Não Urgente (≤ 240 min)' },
  { cor: 'CINZA', label: 'Cinza', descricao: 'Observação' },
];

interface FormularioTriagemProps {
  atendimentoId: string;
  nomePaciente: string;
  numeroAtendimento: string;
  /** Texto da procedência (origem do atendimento ou cadastro do paciente). */
  procedenciaTexto?: string | null;
  triagemInicial?: Omit<RegistrarTriagemForm, 'atendimentoId'>;
}

export function FormularioTriagem({
  atendimentoId,
  nomePaciente,
  numeroAtendimento,
  procedenciaTexto,
  triagemInicial,
}: FormularioTriagemProps) {
  const router = useRouter();
  const [corSelecionada, setCorSelecionada] = useState<CorTriagem | null>(null);
  const [imcInfo, setImcInfo] = useState<{ imc: number; classificacao: string } | null>(null);
  const [triagemConcluida, setTriagemConcluida] = useState(false);

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
      corClassificacao: triagemInicial?.corClassificacao as any,
      queixaPrincipal: triagemInicial?.queixaPrincipal ?? '',
      categoriaQueixa: triagemInicial?.categoriaQueixa,
      tempoQueixa: triagemInicial?.tempoQueixa,
      doencasPreexistentes: triagemInicial?.doencasPreexistentes,
      medicacoes: triagemInicial?.medicacoes,
      alergias: triagemInicial?.alergias,
      regraDor: triagemInicial?.regraDor,
      tipoDorToracica: triagemInicial?.tipoDorToracica as any,
      irradiacao: triagemInicial?.irradiacao as any,
      duracaoDor: triagemInicial?.duracaoDor,
      localizacaoDor: triagemInicial?.localizacaoDor,
      fluxograma: triagemInicial?.fluxograma,
      discriminador: triagemInicial?.discriminador,
      especialidade: triagemInicial?.especialidade,
      estadoConscienciaSinais: triagemInicial?.estadoConscienciaSinais ?? [],
    },
  });

  const peso = watch('sinaisVitais.peso');
  const altura = watch('sinaisVitais.altura');

  useEffect(() => {
    if (triagemInicial?.corClassificacao) {
      setCorSelecionada(triagemInicial.corClassificacao as CorTriagem);
      setValue('corClassificacao', triagemInicial.corClassificacao as any);
    }
    // recalcular IMC quando abrindo em modo edição
    const p = triagemInicial?.sinaisVitais?.peso;
    const a = triagemInicial?.sinaisVitais?.altura;
    if (p && a) {
      setImcInfo(calcularImc(p, a));
    }
  }, [setValue, triagemInicial]);

  const escalaDorVal = watch('sinaisVitais.escalaDor');
  useEffect(() => {
    const v = escalaDorVal ?? 0;
    setValue('regraDor', `ESCALA DE DOR: ${v}/10`, { shouldDirty: true, shouldValidate: false });
  }, [escalaDorVal, setValue]);

  function atualizarImc() {
    const p = peso;
    const a = altura;
    if (p && a && p > 0 && a > 0) {
      setImcInfo(calcularImc(p, a));
    } else {
      setImcInfo(null);
    }
  }

  function selecionarCor(cor: CorTriagem) {
    setCorSelecionada(cor);
    setValue('corClassificacao', cor);
  }

  async function onSubmit(dados: RegistrarTriagemForm) {
    try {
      const res = await fetch('/api/triagem', {
        method: triagemInicial ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados),
      });
      const json = await res.json();
      if (!json.sucesso) {
        toast.error(json.erro ?? 'Erro ao registrar triagem.');
        return;
      }
      setTriagemConcluida(true);
      toast.success(triagemInicial ? 'Triagem atualizada com sucesso!' : 'Triagem registrada com sucesso!', {
        description: `Classificação: ${dados.corClassificacao}`,
      });
      router.refresh();
    } catch {
      toast.error('Erro de conexão. Tente novamente.');
    }
  }

  const inputNum = (erro?: string) => cn(
    'w-full px-3 py-2 rounded-lg border bg-background text-sm outline-none transition-all text-center font-mono',
    'focus:ring-2 focus:ring-primary/30 focus:border-primary',
    erro ? 'border-destructive' : 'border-input'
  );

  const inputText = (erro?: string) => cn(
    'w-full px-3 py-2 rounded-lg border bg-background text-sm outline-none transition-all',
    'focus:ring-2 focus:ring-primary/30 focus:border-primary',
    erro ? 'border-destructive' : 'border-input'
  );

  const hrefImprimirFicha = `/recepcao/imprimir/${encodeURIComponent(numeroAtendimento)}`;

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
              <p className="text-xs text-muted-foreground pt-2">
                Abra a ficha em nova aba para revisar ou imprimir os dados da triagem.
              </p>
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
    );
  }

  const SectionTitle = ({ num, title, icon: Icon }: { num: number, title: string, icon: any }) => (
    <h3 className="text-base font-bold mb-4 flex items-center gap-2 border-b border-border pb-2">
      <span className="w-6 h-6 bg-primary text-white rounded-md text-xs flex items-center justify-center font-mono shadow-sm">
        {num}
      </span>
      <Icon className="h-5 w-5 text-muted-foreground" />
      {title}
    </h3>
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-4xl mx-auto pb-10">
      {/* Info do paciente */}
      <div className="bg-muted/40 rounded-xl border border-border p-4 flex items-center gap-4 shadow-sm">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
          <span className="text-primary font-bold text-lg">{nomePaciente.charAt(0)}</span>
        </div>
        <div>
          <p className="font-bold text-lg leading-tight">{nomePaciente}</p>
          <p className="text-sm font-mono text-muted-foreground">Atend: {numeroAtendimento}</p>
          {procedenciaTexto?.trim() ? (
            <p className="text-xs text-muted-foreground mt-1">
              <span className="font-semibold text-foreground">Procedência:</span> {procedenciaTexto.trim()}
            </p>
          ) : null}
        </div>
        {corSelecionada && <div className="ml-auto"><BadgeManchester cor={corSelecionada} size="lg" /></div>}
      </div>

      <div className="space-y-8">
        {/* BLOCO 1: HISTÓRICO RÁPIDO */}
        <section className="bg-card border border-border p-6 rounded-xl shadow-sm">
          <SectionTitle num={1} title="Histórico Rápido" icon={ClipboardList} />
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Doenças Preexistentes</label>
                <input {...register('doencasPreexistentes', registerTextoCadastro)} className={inputText()} placeholder="HAS, DM, ASMA..." />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Medicações em uso</label>
                <input {...register('medicacoes', registerTextoCadastro)} className={inputText()} placeholder="LOSARTANA, METFORMINA..." />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium mb-1.5 block text-red-600 dark:text-red-400">Alergias</label>
                <input {...register('alergias', registerTextoCadastro)} className={inputText()} placeholder="DIPIRONA, PENICILINA..." />
              </div>
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2 cursor-pointer p-2.5 rounded-lg border border-border hover:bg-muted/50 w-full transition-colors">
                  <input type="checkbox" {...register('acidenteTrabalho')} className="w-4 h-4 rounded text-primary focus:ring-primary" />
                  <span className="text-sm font-medium">Acidente de Trabalho?</span>
                </label>
              </div>
            </div>
          </div>
        </section>

        {/* BLOCO 2: SINAIS VITAIS */}
        <section className="bg-card border border-border p-6 rounded-xl shadow-sm">
          <SectionTitle num={2} title="Sinais Vitais" icon={Activity} />
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            <div className="col-span-2 bg-muted/30 rounded-lg border border-border p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <Heart className="h-4 w-4 text-red-500" />
                <span className="text-sm font-medium">PA (mmHg)</span>
              </div>
              <div className="flex items-center gap-2">
                <input type="number" {...register('sinaisVitais.paSistolica', { valueAsNumber: true })} placeholder="Sist." className={inputNum(errors.sinaisVitais?.paSistolica?.message)} />
                <span className="text-muted-foreground font-bold">/</span>
                <input type="number" {...register('sinaisVitais.paDiastolica', { valueAsNumber: true })} placeholder="Diast." className={inputNum(errors.sinaisVitais?.paDiastolica?.message)} />
              </div>
            </div>

            <div className="bg-muted/30 rounded-lg border border-border p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <Activity className="h-4 w-4 text-pink-500" />
                <span className="text-xs font-medium">FC (bpm)</span>
              </div>
              <input type="number" {...register('sinaisVitais.frequenciaCardiaca', { valueAsNumber: true })} placeholder="—" className={inputNum()} />
            </div>

            <div className="bg-muted/30 rounded-lg border border-border p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <Activity className="h-4 w-4 text-teal-500" />
                <span className="text-xs font-medium">FR (irpm)</span>
              </div>
              <input type="number" {...register('sinaisVitais.frequenciaResp', { valueAsNumber: true })} placeholder="—" className={inputNum()} />
            </div>

            <div className="bg-muted/30 rounded-lg border border-border p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <Droplets className="h-4 w-4 text-blue-500" />
                <span className="text-xs font-medium">SpO₂ (%)</span>
              </div>
              <input type="number" step="0.1" {...register('sinaisVitais.spo2', { valueAsNumber: true })} placeholder="—" className={inputNum()} />
            </div>

            <div className="bg-muted/30 rounded-lg border border-border p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <Thermometer className="h-4 w-4 text-orange-500" />
                <span className="text-xs font-medium">Temp (°C)</span>
              </div>
              <input type="number" step="0.1" {...register('sinaisVitais.temperatura', { valueAsNumber: true })} placeholder="—" className={inputNum()} />
            </div>

            <div className="bg-muted/30 rounded-lg border border-border p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <Droplets className="h-4 w-4 text-purple-500" />
                <span className="text-xs font-medium">Glicemia</span>
              </div>
              <input type="number" {...register('sinaisVitais.glicemia', { valueAsNumber: true })} placeholder="—" className={inputNum()} />
            </div>

            <div className="col-span-2 bg-muted/30 rounded-lg border border-border p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <Weight className="h-4 w-4 text-green-600" />
                <span className="text-xs font-medium">Peso (Kg) / Altura (cm)</span>
              </div>
              <div className="flex gap-2">
                <input type="number" step="0.1" {...register('sinaisVitais.peso', { valueAsNumber: true })} onBlur={atualizarImc} placeholder="Kg" className={inputNum()} />
                <input type="number" {...register('sinaisVitais.altura', { valueAsNumber: true })} onBlur={atualizarImc} placeholder="cm" className={inputNum()} />
                {imcInfo && (
                  <div className="flex-1 px-3 py-2 bg-primary/5 rounded-lg border border-primary/20 text-center">
                    <span className="text-xs font-bold text-primary">IMC: {imcInfo.imc.toFixed(1)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* BLOCO 3: PARÂMETROS CLÍNICOS */}
        <section className="bg-card border border-border p-6 rounded-xl shadow-sm">
          <SectionTitle num={3} title="Parâmetros Clínicos" icon={Stethoscope} />

          <div className="mb-8 pb-6 border-b border-border space-y-6">
            <p className="text-sm font-semibold uppercase tracking-wide">
              Parâmetros clínicos (marque o que se aplica)
            </p>
            <p className="text-xs text-muted-foreground -mt-4 mb-0">
              Clique para marcar ou desmarcar — várias opções ao mesmo tempo.
            </p>

            <div>
              <p className="text-xs font-semibold text-foreground mb-2">
                Estado de consciência e comportamento
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                {PARAMETROS_CLINICOS_ESTADO_KEYS.map((key) => {
                  const sel = (watch('estadoConscienciaSinais') ?? []).includes(key);
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        const cur = watch('estadoConscienciaSinais') ?? [];
                        setValue(
                          'estadoConscienciaSinais',
                          sel ? cur.filter((k) => k !== key) : [...cur, key],
                          { shouldDirty: true }
                        );
                      }}
                      className={cn(
                        'min-h-[2.75rem] px-2 py-2 rounded-lg border text-center text-[11px] font-semibold leading-snug transition-all',
                        sel
                          ? 'border-primary bg-primary/15 text-primary shadow-sm ring-2 ring-primary/25'
                          : 'border-border bg-background hover:bg-muted/70'
                      )}
                    >
                      {ESTADO_CONSCIENCIA_SINAIS_LABELS[key]}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-foreground mb-2">
                Sinais circulatórios e respiratórios
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2">
                {PARAMETROS_CLINICOS_CIRCULATORY_KEYS.map((key) => {
                  const sel = (watch('estadoConscienciaSinais') ?? []).includes(key);
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        const cur = watch('estadoConscienciaSinais') ?? [];
                        setValue(
                          'estadoConscienciaSinais',
                          sel ? cur.filter((k) => k !== key) : [...cur, key],
                          { shouldDirty: true }
                        );
                      }}
                      className={cn(
                        'min-h-[2.75rem] px-2 py-2 rounded-lg border text-center text-[11px] font-semibold leading-snug transition-all',
                        sel
                          ? 'border-primary bg-primary/15 text-primary shadow-sm ring-2 ring-primary/25'
                          : 'border-border bg-background hover:bg-muted/70'
                      )}
                    >
                      {ESTADO_CONSCIENCIA_SINAIS_LABELS[key]}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Tipo de Dor Torácica</label>
              <select {...register('tipoDorToracica')} className={inputText()}>
                <option value="">Selecione...</option>
                <option value="NORMAL">Normal / Sem dor</option>
                <option value="QUEIMACAO">Queimação</option>
                <option value="APERTO">Aperto</option>
                <option value="PONTADA">Pontada</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Irradiação da Dor</label>
              <select {...register('irradiacao')} className={inputText()}>
                <option value="">Selecione...</option>
                <option value="NORMAL">Normal / Sem irradiação</option>
                <option value="MEMBROS_SUPERIORES">Membros Superiores</option>
                <option value="MEMBROS_INFERIORES">Membros Inferiores</option>
                <option value="PESCOCO">Pescoço</option>
                <option value="COSTAS">Costas</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-4 border-t border-border">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Duração da dor</label>
              <input
                {...register('duracaoDor', registerTextoCadastro)}
                className={inputText()}
                placeholder="EX: 3 HORAS"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Localização da dor</label>
              <input
                {...register('localizacaoDor', registerTextoCadastro)}
                className={inputText()}
                placeholder="EX: PRECORDIAL"
              />
            </div>
          </div>

          <div className="mt-4">
            <p className="text-sm font-medium mb-2">Irradiação da dor (marque conforme aplicável)</p>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {IRRADIACAO_DOR_SITE_KEYS.map((key) => (
                <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={(watch('irradiacaoDorSites') ?? []).includes(key)}
                    onChange={(e) => {
                      const cur = watch('irradiacaoDorSites') ?? [];
                      if (e.target.checked) setValue('irradiacaoDorSites', [...cur, key]);
                      else setValue(
                        'irradiacaoDorSites',
                        cur.filter((k) => k !== key)
                      );
                    }}
                    className="rounded border-input"
                  />
                  {IRRADIACAO_DOR_SITE_LABELS[key]}
                </label>
              ))}
            </div>
          </div>
        </section>

        {/* BLOCO 4: MANCHESTER E AVALIAÇÃO DE RISCO */}
        <section className="bg-card border border-border p-6 rounded-xl shadow-sm">
          <SectionTitle num={4} title="Avaliação de Risco (Manchester)" icon={AlertTriangle} />
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <label className="text-sm font-medium mb-1.5 flex justify-between">
                  <span>Queixa Principal <span className="text-destructive">*</span></span>
                  <span className="text-xs text-muted-foreground font-normal italic">
                    Tempo: <input {...register('tempoQueixa', registerTextoCadastro)} placeholder="EX: 3H" className="ml-1 w-20 px-2 py-0.5 border rounded" />
                  </span>
                </label>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {CATEGORIAS_QUEIXA.map((c) => (
                    <button key={c.valor} type="button" onClick={() => setValue('categoriaQueixa', c.valor)}
                      className={cn('px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all', watch('categoriaQueixa') === c.valor ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-muted')}>
                      {c.label}
                    </button>
                  ))}
                </div>
                <textarea {...register('queixaPrincipal', registerTextoCadastro)} rows={3} placeholder="DESCREVA A QUEIXA EM DETALHES..." className={cn(inputText(errors.queixaPrincipal?.message), 'resize-none')} />
                {errors.queixaPrincipal && <p className="text-xs text-destructive mt-1">{errors.queixaPrincipal.message}</p>}
              </div>

              <div className="bg-muted/20 p-5 rounded-xl border border-border">
                <label className="text-sm font-medium block mb-4 flex items-center justify-between">
                  <span>Escala de Dor Visual</span>
                  <span className={cn("font-bold text-xl", (watch('sinaisVitais.escalaDor') ?? 0) > 7 ? 'text-red-500' : (watch('sinaisVitais.escalaDor') ?? 0) > 3 ? 'text-orange-500' : 'text-green-500')}>
                    {watch('sinaisVitais.escalaDor') ?? 0} <span className="text-xs text-muted-foreground font-normal">/ 10</span>
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
                <div className="flex justify-between text-[10px] text-muted-foreground mt-3 font-semibold uppercase tracking-wider">
                  <span>Sem dor</span>
                  <span>Moderada</span>
                  <span>Insuportável</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-4 border-t border-border/50">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Regra de Dor</label>
                <input {...register('regraDor', registerTextoCadastro)} className={inputText()} placeholder="EX: DOR TORÁCICA" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Especialidade (Destino)</label>
                <input {...register('especialidade', registerTextoCadastro)} className={inputText()} placeholder="EX: CLÍNICA MÉDICA" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Fluxograma Utilizado</label>
                <input {...register('fluxograma', registerTextoCadastro)} className={inputText()} placeholder="EX: DOR ABDOMINAL" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Discriminador Escolhido</label>
                <input {...register('discriminador', registerTextoCadastro)} className={inputText()} placeholder="EX: DOR INTENSA" />
              </div>
            </div>

            <div className="pt-6 border-t border-border">
              <label className="text-sm font-bold mb-4 block text-center lg:text-left">Classificação Final (Cor) <span className="text-destructive">*</span></label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {CORES_MANCHESTER.map(({ cor, label, descricao }) => {
                  const ativo = corSelecionada === cor;
                  const corHex: Record<CorTriagem, string> = { VERMELHO: '#DC2626', LARANJA: '#EA580C', AMARELO: '#CA8A04', VERDE: '#16A34A', AZUL: '#2563EB', CINZA: '#6B7280' };
                  return (
                    <button key={cor} type="button" onClick={() => selecionarCor(cor)} className={cn('relative flex flex-col p-3 rounded-xl border-2 text-left transition-all duration-150', ativo ? 'border-current shadow-md scale-[1.05] z-10' : 'border-transparent bg-muted/50 hover:bg-muted')} style={ativo ? { borderColor: corHex[cor], backgroundColor: `${corHex[cor]}10` } : {}}>
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="w-3.5 h-3.5 rounded-full shadow-sm" style={{ backgroundColor: corHex[cor] }} />
                        <p className="text-xs font-black" style={ativo ? { color: corHex[cor] } : {}}>{label}</p>
                      </div>
                      <p className="text-[9px] text-muted-foreground font-medium leading-tight">{descricao}</p>
                    </button>
                  );
                })}
              </div>
              {errors.corClassificacao && <p className="text-xs text-destructive mt-3 text-center lg:text-left font-medium">{errors.corClassificacao.message}</p>}
            </div>
          </div>
        </section>
      </div>

      {/* Botões de Ação Final */}
      <div className="flex flex-col sm:flex-row justify-end gap-4 pt-6 border-t border-border">
        <button type="button" onClick={() => router.back()} className="px-8 py-3.5 border border-border rounded-xl text-sm font-bold hover:bg-muted transition-all active:scale-95">
          Cancelar e Sair
        </button>
        <button type="submit" disabled={isSubmitting || !corSelecionada} className="flex items-center justify-center gap-2 px-12 py-3.5 bg-primary text-white rounded-xl text-sm font-black hover:bg-primary/90 disabled:opacity-60 transition-all shadow-lg shadow-primary/20 active:scale-95">
          {isSubmitting ? <><Loader2 className="h-5 w-5 animate-spin" /> Registrando...</> : <><Check className="h-6 w-6" /> Finalizar Triagem</>}
        </button>
      </div>
    </form>
  );
}
