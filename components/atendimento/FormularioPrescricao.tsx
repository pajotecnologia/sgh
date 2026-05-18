'use client';
// components/atendimento/FormularioPrescricao.tsx
// Adição de medicamentos, envio e exibição de alertas de interação/alergia

import { useState, useMemo, useEffect, useRef } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Plus, Trash2, AlertOctagon, AlertTriangle, FileSignature, Loader2 } from 'lucide-react';
import { schemaCriarPrescricao, type CriarPrescricaoForm } from '@/lib/validations/atendimento';
import { cn } from '@/lib/utils';

interface FormularioPrescricaoProps {
  atendimentoId: string;
  prontuarioId: string;
  onPrescricaoCriada?: () => void;
}

const VIAS_ADMINISTRACAO = [
  'ORAL', 'INTRAVENOSA', 'INTRAMUSCULAR', 'SUBCUTANEA',
  'TOPICA', 'INALATORIA', 'SUBLINGUAL', 'RETAL', 'OFTALMICA', 'OTOLOGICA', 'NASAL'
];

function itemPrescricaoVazio(prontuarioId: string): CriarPrescricaoForm {
  return {
    prontuarioId,
    observacoes: '',
    itens: [
      {
        nomeMedicamento: '',
        dose: '',
        via: 'ORAL',
        frequencia: '',
        duracaoDias: undefined,
        observacoes: '',
      },
    ],
  };
}

export function FormularioPrescricao({
  atendimentoId,
  prontuarioId,
  onPrescricaoCriada,
}: FormularioPrescricaoProps) {
  const [alertas, setAlertas] = useState<{
    alergias?: { medicamento: string; alergias: string[] }[];
    interacoes?: { medicamento1: string; medicamento2: string; gravidade: string; descricao: string }[];
    bloqueado: boolean;
  } | null>(null);

  const defaults = useMemo(() => itemPrescricaoVazio(prontuarioId), [prontuarioId]);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CriarPrescricaoForm>({
    resolver: zodResolver(schemaCriarPrescricao),
    defaultValues: defaults,
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'itens',
  });

  const prontuarioIdRef = useRef(prontuarioId);
  useEffect(() => {
    if (prontuarioIdRef.current !== prontuarioId) {
      prontuarioIdRef.current = prontuarioId;
      reset(itemPrescricaoVazio(prontuarioId));
    }
  }, [prontuarioId, reset]);

  async function onSubmit(dados: CriarPrescricaoForm) {
    setAlertas(null); // Limpar alertas anteriores

    try {
      const res = await fetch(`/api/atendimento/${atendimentoId}/prescricao`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados),
      });
      const json = await res.json();

      if (res.status === 400 && json.detalhes) {
        const flat = Object.values(json.detalhes as Record<string, string[] | undefined>).flat().filter(Boolean);
        toast.error(flat[0] ?? json.erro ?? 'Dados inválidos.');
        return;
      }

      if (res.status === 422) {
        // Bloqueado por alergia grave
        toast.error('Prescrição bloqueada: Alergia detectada!');
        setAlertas({ alergias: json.alertasAlergia, interacoes: json.interacoes, bloqueado: true });
        return;
      }

      if (!json.sucesso) {
        toast.error(json.erro ?? 'Erro ao criar prescrição.');
        return;
      }

      if (json.avisos) {
        // Avisos de interação (não bloqueiam)
        toast.warning('Prescrição salva, mas com alertas de interação medicamentosa.');
        setAlertas({ interacoes: json.avisos.interacoes, bloqueado: false });
      } else {
        toast.success('Prescrição salva com sucesso!');
      }

      reset(itemPrescricaoVazio(prontuarioId));
      onPrescricaoCriada?.();

    } catch {
      toast.error('Erro de conexão ao salvar prescrição.');
    }
  }

  const inputClass = (erro?: any) => cn(
    'w-full px-3 py-2 text-sm border rounded-md bg-background outline-none transition-all',
    'focus:ring-2 focus:ring-primary/30 focus:border-primary',
    erro ? 'border-destructive' : 'border-input'
  );

  return (
    <div className="space-y-6">
      {/* Exibição de Alertas (Alergias / Interações) */}
      {alertas && (
        <div className="space-y-3 animate-fade-in-up">
          {alertas.alergias && alertas.alergias.length > 0 && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl">
              <div className="flex items-center gap-2 text-red-700 font-bold mb-2">
                <AlertOctagon className="h-5 w-5" />
                CONFLITO DE ALERGIA (PRESCRICÃO BLOQUEADA)
              </div>
              <ul className="list-disc list-inside text-sm text-red-600 space-y-1">
                {alertas.alergias.map((a, i) => (
                  <li key={i}>
                    <strong>{a.medicamento}</strong> tem conflito com alergia a: {a.alergias.join(', ')}
                  </li>
                ))}
              </ul>
              <p className="text-xs mt-3 text-red-700 font-medium">
                Remova os medicamentos conflitantes para poder prosseguir.
              </p>
            </div>
          )}

          {alertas.interacoes && alertas.interacoes.length > 0 && (
            <div className={cn('p-4 rounded-r-xl border-l-4', alertas.bloqueado ? 'bg-orange-50 border-orange-500' : 'bg-yellow-50 border-yellow-500')}>
              <div className={cn('flex items-center gap-2 font-bold mb-2', alertas.bloqueado ? 'text-orange-700' : 'text-yellow-700')}>
                <AlertTriangle className="h-5 w-5" />
                ALERTA DE INTERAÇÃO MEDICAMENTOSA
              </div>
              <ul className="space-y-2 text-sm">
                {alertas.interacoes.map((int, i) => (
                  <li key={i} className={cn(alertas.bloqueado ? 'text-orange-800' : 'text-yellow-800')}>
                    <span className="font-semibold">{int.medicamento1} + {int.medicamento2}</span> ({int.gravidade})
                    <br />
                    <span className="text-xs opacity-80">{int.descricao}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Formulário de Prescrição */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        
        {/* Itens da Prescrição */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-muted-foreground">Medicamentos</h4>
            <button
              type="button"
              onClick={() =>
                append({
                  nomeMedicamento: '',
                  dose: '',
                  via: 'ORAL',
                  frequencia: '',
                  duracaoDias: undefined,
                  observacoes: '',
                })
              }
              className="flex items-center gap-1.5 text-xs text-primary hover:bg-primary/10 px-2 py-1 rounded transition-colors"
            >
              <Plus className="h-3.5 w-3.5" /> Adicionar Medicamento
            </button>
          </div>

          {fields.map((field, index) => {
            const itemErrors = errors.itens?.[index];
            return (
              <div key={field.id} className="p-4 bg-muted/20 border border-border rounded-xl relative group">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                  
                  {/* Medicamento */}
                  <div className="md:col-span-4">
                    <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Nome do Medicamento *</label>
                    <input
                      {...register(`itens.${index}.nomeMedicamento`)}
                      placeholder="Ex: Dipirona, Losartana"
                      className={inputClass(itemErrors?.nomeMedicamento)}
                    />
                    {itemErrors?.nomeMedicamento && <span className="text-[10px] text-destructive">{itemErrors.nomeMedicamento.message}</span>}
                  </div>

                  {/* Dose */}
                  <div className="md:col-span-2">
                    <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Dose *</label>
                    <input
                      {...register(`itens.${index}.dose`)}
                      placeholder="Ex: 500mg, 1 cp"
                      className={inputClass(itemErrors?.dose)}
                    />
                    {itemErrors?.dose && <span className="text-[10px] text-destructive">{itemErrors.dose.message}</span>}
                  </div>

                  {/* Via */}
                  <div className="md:col-span-3">
                    <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Via *</label>
                    <select
                      {...register(`itens.${index}.via`)}
                      className={inputClass(itemErrors?.via)}
                    >
                      {VIAS_ADMINISTRACAO.map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>

                  {/* Frequência */}
                  <div className="md:col-span-3">
                    <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Frequência *</label>
                    <input
                      {...register(`itens.${index}.frequencia`)}
                      placeholder="Ex: 8/8h, Se dor"
                      className={inputClass(itemErrors?.frequencia)}
                    />
                    {itemErrors?.frequencia && <span className="text-[10px] text-destructive">{itemErrors.frequencia.message}</span>}
                  </div>

                  {/* Duração e Observações (Linha 2) */}
                  <div className="md:col-span-3">
                    <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Duração (dias)</label>
                    <input
                      type="number"
                      min={1}
                      max={365}
                      {...register(`itens.${index}.duracaoDias`, {
                        setValueAs: (v) => {
                          if (v === '' || v == null) return undefined;
                          const n = typeof v === 'number' ? v : Number(v);
                          return Number.isNaN(n) ? undefined : n;
                        },
                      })}
                      placeholder="Contínuo se vazio"
                      className={inputClass(itemErrors?.duracaoDias)}
                    />
                  </div>
                  
                  <div className="md:col-span-8">
                    <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Observações do Item</label>
                    <input
                      {...register(`itens.${index}.observacoes`)}
                      placeholder="Instruções específicas para este medicamento"
                      className={inputClass()}
                    />
                  </div>

                  {/* Remover */}
                  <div className="md:col-span-1 flex items-end justify-center pb-1">
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      disabled={fields.length === 1}
                      className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors disabled:opacity-30"
                      title="Remover medicamento"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                </div>
              </div>
            );
          })}
        </div>

        {/* Observações Gerais */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Observações Gerais da Receita (Opcional)</label>
          <textarea
            {...register('observacoes')}
            rows={2}
            className={cn(inputClass(), 'resize-none')}
            placeholder="Orientações gerais, repouso, dieta..."
          />
        </div>

        {errors.itens?.root && (
          <p className="text-sm text-destructive font-medium">{errors.itens.root.message}</p>
        )}

        {/* Botão Salvar */}
        <div className="flex justify-end pt-4 border-t border-border mt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            id="btn-salvar-prescricao"
            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 transition-colors"
          >
            {isSubmitting ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Verificando e Salvando...</>
            ) : (
              <><FileSignature className="h-4 w-4" /> Assinar e Salvar Prescrição</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
