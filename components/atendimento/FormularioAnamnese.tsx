'use client';
// components/atendimento/FormularioAnamnese.tsx

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Save, Loader2, Cigarette, Wine, Dumbbell } from 'lucide-react';
import { schemaAnamnese, type AnamneseForm } from '@/lib/validations/atendimento';
import { cn } from '@/lib/utils';

interface AnamneseExistente {
  queixaPrincipal?: string;
  hda?: string | null;
  antecedentesP?: string | null;
  antecedentesF?: string | null;
  antecedentesC?: string | null;
  habitosVida?: { tabagismo?: boolean; etilismo?: boolean; atividadeFisica?: string; alimentacao?: string } | null;
}

interface FormularioAnamneseProps {
  atendimentoId: string;
  queixaTriagem?: string;
  dadosExistentes?: AnamneseExistente | null;
  onSalvo?: () => void;
}

const SISTEMAS = [
  { id: 'cardiovascular', label: 'Cardiovascular' },
  { id: 'respiratorio', label: 'Respiratório' },
  { id: 'gastrointestinal', label: 'Gastrointestinal' },
  { id: 'geniturinario', label: 'Genitourinário' },
  { id: 'neurologico', label: 'Neurológico' },
  { id: 'musculoesqueletico', label: 'Musculoesquelético' },
  { id: 'endocrino', label: 'Endócrino' },
  { id: 'pele', label: 'Pele / Tegumento' },
];

export function FormularioAnamnese({
  atendimentoId,
  queixaTriagem,
  dadosExistentes,
  onSalvo,
}: FormularioAnamneseProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<AnamneseForm>({
    resolver: zodResolver(schemaAnamnese),
    defaultValues: {
      atendimentoId,
      queixaPrincipal: dadosExistentes?.queixaPrincipal ?? queixaTriagem ?? '',
      hda: dadosExistentes?.hda ?? '',
      antecedentesP: dadosExistentes?.antecedentesP ?? '',
      antecedentesF: dadosExistentes?.antecedentesF ?? '',
      antecedentesC: dadosExistentes?.antecedentesC ?? '',
      habitosVida: {
        tabagismo: dadosExistentes?.habitosVida?.tabagismo ?? false,
        etilismo: dadosExistentes?.habitosVida?.etilismo ?? false,
        atividadeFisica: dadosExistentes?.habitosVida?.atividadeFisica ?? '',
        alimentacao: dadosExistentes?.habitosVida?.alimentacao ?? '',
      },
    },
  });

  // Auto-save a cada 2 minutos (rascunho)
  useEffect(() => {
    const timer = setInterval(() => {
      if (isDirty) {
        handleSubmit(salvar)();
        toast.info('Anamnese salva automaticamente.', { duration: 2000 });
      }
    }, 120_000);
    return () => clearInterval(timer);
  }, [isDirty]);

  async function salvar(dados: AnamneseForm) {
    const res = await fetch(`/api/atendimento/${atendimentoId}/anamnese`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados),
    });
    const json = await res.json();
    if (!json.sucesso) throw new Error(json.erro);
    return json;
  }

  async function onSubmit(dados: AnamneseForm) {
    try {
      await salvar(dados);
      toast.success('Anamnese salva com sucesso!');
      onSalvo?.();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erro ao salvar anamnese.');
    }
  }

  const txtArea = (erro?: string) => cn(
    'w-full px-3.5 py-2.5 rounded-lg border bg-background text-sm outline-none transition-all resize-none',
    'focus:ring-2 focus:ring-primary/30 focus:border-primary',
    erro ? 'border-destructive' : 'border-input'
  );

  const SectionHeader = ({ title, step }: { title: string; step: string }) => (
    <h4 className="text-sm font-semibold flex items-center gap-2 mb-3">
      <span className="w-5 h-5 bg-primary/10 text-primary rounded-full text-xs flex items-center justify-center font-bold">{step}</span>
      {title}
    </h4>
  );

  const tabagismo = watch('habitosVida.tabagismo');
  const etilismo = watch('habitosVida.etilismo');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* 1. Queixa Principal */}
      <div className="bg-card border border-border rounded-xl p-5">
        <SectionHeader title="Queixa Principal" step="1" />
        <textarea
          {...register('queixaPrincipal')}
          rows={3}
          placeholder="Motivo da consulta em palavras do paciente..."
          className={txtArea(errors.queixaPrincipal?.message)}
          id="queixa-principal-anamnese"
        />
        {errors.queixaPrincipal && <p className="text-xs text-destructive mt-1">{errors.queixaPrincipal.message}</p>}
      </div>

      {/* 2. HDA */}
      <div className="bg-card border border-border rounded-xl p-5">
        <SectionHeader title="História da Doença Atual (HDA)" step="2" />
        <textarea
          {...register('hda')}
          rows={5}
          placeholder="Descreva a evolução cronológica dos sintomas, fatores desencadeantes, agravantes e atenuantes..."
          className={txtArea()}
          id="hda"
        />
      </div>

      {/* 3. Antecedentes */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <SectionHeader title="Antecedentes" step="3" />
        <div className="grid gap-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Pessoais (doenças prévias, cirurgias, hospitalizações)</label>
            <textarea {...register('antecedentesP')} rows={3} className={txtArea()} id="antecedentes-pessoais" placeholder="Ex: HAS, DM2, Cirurgia de apendicite em 2018..." />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Familiares</label>
            <textarea {...register('antecedentesF')} rows={2} className={txtArea()} id="antecedentes-familiares" placeholder="Ex: Pai — IAM; Mãe — DM2..." />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Cirúrgicos / Obstétricos / Outros</label>
            <textarea {...register('antecedentesC')} rows={2} className={txtArea()} id="antecedentes-outros" />
          </div>
        </div>
      </div>

      {/* 4. Hábitos de Vida */}
      <div className="bg-card border border-border rounded-xl p-5">
        <SectionHeader title="Hábitos de Vida" step="4" />
        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* Tabagismo */}
          <button
            type="button"
            onClick={() => setValue('habitosVida.tabagismo', !tabagismo)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all',
              tabagismo
                ? 'border-orange-400 bg-orange-50 text-orange-700'
                : 'border-border hover:bg-muted'
            )}
          >
            <Cigarette className="h-4 w-4" />
            Tabagismo {tabagismo ? '✓' : ''}
          </button>
          {/* Etilismo */}
          <button
            type="button"
            onClick={() => setValue('habitosVida.etilismo', !etilismo)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all',
              etilismo
                ? 'border-amber-400 bg-amber-50 text-amber-700'
                : 'border-border hover:bg-muted'
            )}
          >
            <Wine className="h-4 w-4" />
            Etilismo {etilismo ? '✓' : ''}
          </button>
        </div>
        <div className="grid gap-3">
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1.5">
              <Dumbbell className="h-3.5 w-3.5" /> Atividade Física
            </label>
            <input {...register('habitosVida.atividadeFisica')} className={cn(txtArea(), 'h-10')} placeholder="Frequência e tipo..." id="atividade-fisica" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Alimentação</label>
            <input {...register('habitosVida.alimentacao')} className={cn(txtArea(), 'h-10')} placeholder="Padrão alimentar..." id="alimentacao" />
          </div>
        </div>
      </div>

      {/* 5. Revisão de Sistemas */}
      <div className="bg-card border border-border rounded-xl p-5">
        <SectionHeader title="Revisão de Sistemas" step="5" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {SISTEMAS.map((s) => (
            <div key={s.id}>
              <label className="text-[10px] font-medium text-muted-foreground block mb-1">{s.label}</label>
              <input
                {...register(`revisaoSistemas.${s.id}` as `revisaoSistemas.${string}`)}
                className="w-full px-2.5 py-2 border border-input rounded-lg bg-background text-xs outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary"
                placeholder="Sem queixas"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Botão Salvar */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          id="btn-salvar-anamnese"
          className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 transition-colors"
        >
          {isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin" />Salvando...</> : <><Save className="h-4 w-4" />Salvar Anamnese</>}
        </button>
      </div>
    </form>
  );
}
