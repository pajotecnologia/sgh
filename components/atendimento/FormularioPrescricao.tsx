'use client';
// components/atendimento/FormularioPrescricao.tsx
// Adição de medicamentos, envio e exibição de alertas de interação/alergia

import { useState, useMemo, useEffect, useRef } from 'react';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Plus, Trash2, AlertOctagon, AlertTriangle, FileSignature, Loader2 } from 'lucide-react';
import { schemaCriarPrescricao, type CriarPrescricaoForm } from '@/lib/validations/atendimento';
import { cn } from '@/lib/utils';
import { ModalInteracaoCritica, type InteracaoCritica } from '@/components/farmacia/ModalInteracaoCritica';
import { ModalPrescricaoDuplicada, type PrescricaoDuplicada } from '@/components/prescricao/ModalPrescricaoDuplicada';
import {
  VIAS_ADMINISTRACAO,
  FREQUENCIAS_RAPIDAS,
  labelVia,
} from '@/lib/prescricao-ui';

type VariantPrescricao = 'ps' | 'internacao' | 'receita_alta';

interface FormularioPrescricaoProps {
  atendimentoId: string
  prontuarioId: string
  tipoPrescricao?: 'PS' | 'RECEITA_ALTA'
  variant?: VariantPrescricao
  onPrescricaoCriada?: (prescricaoId?: string) => void
  /** Observações pré-preenchidas (alergias, medicamentos contínuos, diagnóstico) */
  prefillObservacoes?: string
  /** Itens pré-preenchidos (medicamentos contínuos / última prescrição) */
  prefillItens?: CriarPrescricaoForm['itens']
  /** Oculta cabeçalho da seção de medicamentos (quando embutido em outro painel) */
  ocultarCabecalhoSecao?: boolean
}

const LABEL_SECAO: Record<VariantPrescricao, string> = {
  ps: 'Medicamentos (pronto-socorro)',
  internacao: 'Medicamentos da internação',
  receita_alta: 'Medicamentos para alta',
};

const LABEL_BOTAO: Record<VariantPrescricao, string> = {
  ps: 'Assinar e Salvar Prescrição',
  internacao: 'Assinar e emitir prescrição',
  receita_alta: 'Salvar receita de alta',
};

function itemVazio(): CriarPrescricaoForm['itens'][number] {
  return {
    nomeMedicamento: '',
    principioAtivo: '',
    dose: '',
    via: 'ORAL',
    frequencia: '',
    quantidadeSolicitada: 1,
    duracaoDias: undefined,
    observacoes: '',
  };
}

function itemPrescricaoVazio(prontuarioId: string, tipo: 'PS' | 'RECEITA_ALTA'): CriarPrescricaoForm {
  return {
    prontuarioId,
    tipo,
    observacoes: '',
    justificativaMedicaCritica: '',
    itens: [itemVazio()],
  };
}

export function FormularioPrescricao({
  atendimentoId,
  prontuarioId,
  tipoPrescricao = 'PS',
  variant,
  onPrescricaoCriada,
  prefillObservacoes,
  prefillItens,
  ocultarCabecalhoSecao = false,
}: FormularioPrescricaoProps) {
  const variantEfetivo: VariantPrescricao =
    variant ?? (tipoPrescricao === 'RECEITA_ALTA' ? 'receita_alta' : 'ps');

  const [alertas, setAlertas] = useState<{
    alergias?: { medicamento: string; alergias: string[] }[];
    interacoes?: { medicamento1: string; medicamento2: string; gravidade: string; descricao: string }[];
    bloqueado: boolean;
  } | null>(null);

  const [modalCritico, setModalCritico] = useState<{
    aberto: boolean
    itemNovo: { nomeMedicamento: string; principioAtivo?: string }
    interacoes: InteracaoCritica[]
    payload: CriarPrescricaoForm | null
  }>({ aberto: false, itemNovo: { nomeMedicamento: '' }, interacoes: [], payload: null })

  const [modalDuplicada, setModalDuplicada] = useState<{
    aberto: boolean
    duplicada: PrescricaoDuplicada | null
    payload: CriarPrescricaoForm | null
  }>({ aberto: false, duplicada: null, payload: null })

  const defaults = useMemo(
    () => itemPrescricaoVazio(prontuarioId, tipoPrescricao),
    [prontuarioId, tipoPrescricao]
  );

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CriarPrescricaoForm>({
    resolver: zodResolver(schemaCriarPrescricao),
    defaultValues: defaults,
    shouldUnregister: false,
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'itens',
  });
  const itensWatch = useWatch({ control, name: 'itens' }) ?? [];
  const [itemEmEdicao, setItemEmEdicao] = useState(0);
  const itemErrors = errors.itens?.[itemEmEdicao];

  useEffect(() => {
    const base = itemPrescricaoVazio(prontuarioId, tipoPrescricao)
    const temObs = Boolean(prefillObservacoes?.trim())
    const temItens = Boolean(prefillItens?.length)
    if (!temObs && !temItens) return

    reset({
      ...base,
      observacoes: temObs ? prefillObservacoes!.trim() : base.observacoes,
      itens: temItens ? prefillItens! : base.itens,
    })
    setItemEmEdicao(0)
  }, [prefillObservacoes, prefillItens, prontuarioId, tipoPrescricao, reset])

  const prontuarioIdRef = useRef(prontuarioId);
  useEffect(() => {
    if (prontuarioIdRef.current !== prontuarioId) {
      prontuarioIdRef.current = prontuarioId;
      reset(itemPrescricaoVazio(prontuarioId, tipoPrescricao));
      setItemEmEdicao(0);
    }
  }, [prontuarioId, tipoPrescricao, reset]);

  useEffect(() => {
    if (itemEmEdicao > fields.length - 1) {
      setItemEmEdicao(Math.max(0, fields.length - 1));
    }
  }, [fields.length, itemEmEdicao]);

  async function onSubmit(dados: CriarPrescricaoForm) {
    setAlertas(null);

    try {
      const res = await fetch(`/api/atendimento/${atendimentoId}/prescricao`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...dados, tipo: tipoPrescricao }),
      });
      const json = await res.json();
      if (res.status === 409 && json.tipo === 'INTERACAO_CRITICA') {
        const interacoes = (json.interacoesCriticas ?? []) as InteracaoCritica[]
        setModalCritico({
          aberto: true,
          itemNovo: {
            nomeMedicamento: dados.itens[dados.itens.length - 1]?.nomeMedicamento ?? 'Medicamento',
            principioAtivo: dados.itens[dados.itens.length - 1]?.principioAtivo ?? '',
          },
          interacoes,
          payload: dados,
        })
        toast.error('Interação crítica detectada', {
          description: 'Informe justificativa médica para prosseguir.',
        })
        return
      }

      if (res.status === 409 && json.tipo === 'PRESCRICAO_DUPLICADA') {
        setModalDuplicada({
          aberto: true,
          duplicada: json.duplicada as PrescricaoDuplicada,
          payload: dados,
        })
        toast.warning('Prescrição idêntica já emitida hoje.')
        return
      }

      if (res.status === 400 && json.detalhes) {
        const flat = Object.values(json.detalhes as Record<string, string[] | undefined>).flat().filter(Boolean);
        toast.error(flat[0] ?? json.erro ?? 'Dados inválidos.');
        return;
      }

      if (res.status === 422) {
        toast.error('Prescrição bloqueada: Alergia detectada!');
        setAlertas({ alergias: json.alertasAlergia, interacoes: json.interacoes, bloqueado: true });
        return;
      }

      if (!json.sucesso) {
        toast.error(json.erro ?? 'Erro ao criar prescrição.');
        return;
      }

      if (json.avisos) {
        toast.warning('Prescrição salva, mas com alertas de interação medicamentosa.');
        setAlertas({ interacoes: json.avisos.interacoes, bloqueado: false });
      } else {
        toast.success(
          variantEfetivo === 'receita_alta' ? 'Receita de alta salva!' : 'Prescrição salva com sucesso!'
        );
      }

      reset(itemPrescricaoVazio(prontuarioId, tipoPrescricao));
      setItemEmEdicao(0);
      onPrescricaoCriada?.(json.dados?.id);

    } catch {
      toast.error('Erro de conexão ao salvar prescrição.');
    }
  }

  async function confirmarInteracaoCritica(justificativa: string) {
    const payload = modalCritico.payload
    if (!payload) {
      setModalCritico((p) => ({ ...p, aberto: false }))
      return
    }

    try {
      const res = await fetch(`/api/atendimento/${atendimentoId}/prescricao`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          tipo: tipoPrescricao,
          justificativaMedicaCritica: justificativa,
        }),
      })
      const json = await res.json()
      if (!json.sucesso) {
        toast.error(json.erro ?? 'Erro ao salvar prescrição.')
        return
      }
      toast.success('Prescrição salva com justificativa.')
      setModalCritico((p) => ({ ...p, aberto: false, payload: null }))
      reset(itemPrescricaoVazio(prontuarioId, tipoPrescricao));
      setItemEmEdicao(0);
      onPrescricaoCriada?.();
    } catch {
      toast.error('Erro de conexão ao salvar prescrição.')
    }
  }

  async function confirmarPrescricaoDuplicada() {
    const payload = modalDuplicada.payload
    if (!payload) {
      setModalDuplicada((p) => ({ ...p, aberto: false }))
      return
    }

    try {
      const res = await fetch(`/api/atendimento/${atendimentoId}/prescricao`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          tipo: tipoPrescricao,
          confirmarDuplicada: true,
        }),
      })
      const json = await res.json()
      if (!json.sucesso) {
        toast.error(json.erro ?? 'Erro ao salvar prescrição.')
        return
      }
      toast.success(
        variantEfetivo === 'receita_alta' ? 'Receita de alta salva!' : 'Prescrição salva com sucesso!'
      )
      setModalDuplicada((p) => ({ ...p, aberto: false, payload: null }))
      reset(itemPrescricaoVazio(prontuarioId, tipoPrescricao));
      setItemEmEdicao(0);
      onPrescricaoCriada?.(json.dados?.id);
    } catch {
      toast.error('Erro de conexão ao salvar prescrição.')
    }
  }

  const inputClass = (erro?: { message?: string }) => cn(
    'w-full px-3 py-2 text-sm border rounded-md bg-background outline-none transition-all',
    'focus:ring-2 focus:ring-primary/30 focus:border-primary',
    erro ? 'border-destructive' : 'border-input'
  );

  return (
    <div className="space-y-5">
      <ModalInteracaoCritica
        aberto={modalCritico.aberto}
        onClose={() => setModalCritico((p) => ({ ...p, aberto: false }))}
        itemNovo={modalCritico.itemNovo}
        interacoes={modalCritico.interacoes}
        onConfirmar={confirmarInteracaoCritica}
      />

      <ModalPrescricaoDuplicada
        aberto={modalDuplicada.aberto}
        onClose={() => setModalDuplicada((p) => ({ ...p, aberto: false }))}
        duplicada={modalDuplicada.duplicada}
        onConfirmar={confirmarPrescricaoDuplicada}
      />

      {alertas ? (
        <div className="space-y-3">
          {alertas.alergias && alertas.alergias.length > 0 ? (
            <div className="bg-red-50 dark:bg-red-950/30 border-l-4 border-red-500 p-4 rounded-r-xl">
              <div className="flex items-center gap-2 text-red-700 dark:text-red-300 font-bold mb-2 text-sm">
                <AlertOctagon className="h-5 w-5 shrink-0" aria-hidden />
                Conflito de alergia — prescrição bloqueada
              </div>
              <ul className="list-disc list-inside text-sm text-red-600 dark:text-red-400 space-y-1">
                {alertas.alergias.map((a, i) => (
                  <li key={i}>
                    <strong>{a.medicamento}</strong> conflita com alergia a: {a.alergias.join(', ')}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {alertas.interacoes && alertas.interacoes.length > 0 ? (
            <div className={cn(
              'p-4 rounded-r-xl border-l-4',
              alertas.bloqueado ? 'bg-orange-50 dark:bg-orange-950/30 border-orange-500' : 'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-500'
            )}>
              <div className={cn(
                'flex items-center gap-2 font-bold mb-2 text-sm',
                alertas.bloqueado ? 'text-orange-700 dark:text-orange-300' : 'text-yellow-700 dark:text-yellow-300'
              )}>
                <AlertTriangle className="h-5 w-5 shrink-0" aria-hidden />
                Alerta de interação medicamentosa
              </div>
              <ul className="space-y-2 text-sm">
                {alertas.interacoes.map((int, i) => (
                  <li key={i} className={alertas.bloqueado ? 'text-orange-800 dark:text-orange-200' : 'text-yellow-800 dark:text-yellow-200'}>
                    <span className="font-semibold">{int.medicamento1} + {int.medicamento2}</span> ({int.gravidade})
                    <br />
                    <span className="text-xs opacity-80">{int.descricao}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <input type="hidden" {...register('prontuarioId')} />

        <div className="space-y-3">
          {!ocultarCabecalhoSecao ? (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="text-sm font-semibold text-foreground">{LABEL_SECAO[variantEfetivo]}</h4>
              <button
                type="button"
                onClick={() => {
                  const proximoIndice = fields.length;
                  append(itemVazio());
                  setItemEmEdicao(proximoIndice);
                }}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:bg-primary/10 px-2.5 py-1.5 rounded-lg transition-colors"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden />
                Adicionar medicamento
              </button>
            </div>
          ) : (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  const proximoIndice = fields.length;
                  append(itemVazio());
                  setItemEmEdicao(proximoIndice);
                }}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:bg-primary/10 px-2.5 py-1.5 rounded-lg transition-colors"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden />
                Adicionar medicamento
              </button>
            </div>
          )}

          {fields.map((field, index) =>
            index !== itemEmEdicao ? (
              <div key={`persist-${field.id}`} className="hidden" aria-hidden>
                <input type="hidden" {...register(`itens.${index}.nomeMedicamento`)} />
                <input type="hidden" {...register(`itens.${index}.principioAtivo`)} />
                <input type="hidden" {...register(`itens.${index}.dose`)} />
                <input type="hidden" {...register(`itens.${index}.via`)} />
                <input type="hidden" {...register(`itens.${index}.frequencia`)} />
                <input type="hidden" {...register(`itens.${index}.observacoes`)} />
                <input
                  type="hidden"
                  {...register(`itens.${index}.duracaoDias`, {
                    setValueAs: (v) => {
                      if (v === '' || v == null) return undefined
                      const n = typeof v === 'number' ? v : Number(v)
                      return Number.isNaN(n) ? undefined : n
                    },
                  })}
                />
                <input
                  type="hidden"
                  {...register(`itens.${index}.quantidadeSolicitada`, {
                    setValueAs: (v) => {
                      const n = typeof v === 'number' ? v : Number(v)
                      return Number.isNaN(n) ? 1 : n
                    },
                  })}
                />
              </div>
            ) : null
          )}

          {fields[itemEmEdicao] ? (
            <div className="p-4 bg-muted/15 border border-border rounded-xl relative">
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Editando item {itemEmEdicao + 1}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (fields.length === 1) return;
                    remove(itemEmEdicao);
                  }}
                  disabled={fields.length === 1}
                  className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors disabled:opacity-30"
                  title="Remover medicamento"
                  aria-label={`Remover medicamento ${itemEmEdicao + 1}`}
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
                <div className="lg:col-span-4">
                  <label className="text-[11px] font-medium text-muted-foreground mb-1 block">
                    Medicamento *
                  </label>
                  <input
                    {...register(`itens.${itemEmEdicao}.nomeMedicamento`)}
                    placeholder="Ex.: Dipirona, Losartana"
                    className={inputClass(itemErrors?.nomeMedicamento)}
                  />
                  {itemErrors?.nomeMedicamento ? (
                    <span className="text-[10px] text-destructive">{itemErrors.nomeMedicamento.message}</span>
                  ) : null}
                </div>

                <div className="lg:col-span-3">
                  <label className="text-[11px] font-medium text-muted-foreground mb-1 block">
                    Princípio ativo
                    <span className="font-normal text-muted-foreground/70"> (interações)</span>
                  </label>
                  <input
                    {...register(`itens.${itemEmEdicao}.principioAtivo`)}
                    placeholder="Ex.: dipirona, losartana"
                    className={inputClass(itemErrors?.principioAtivo)}
                  />
                </div>

                <div className="sm:col-span-1 lg:col-span-2">
                  <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Dose *</label>
                  <input
                    {...register(`itens.${itemEmEdicao}.dose`)}
                    placeholder="500 mg, 1 cp"
                    className={inputClass(itemErrors?.dose)}
                  />
                  {itemErrors?.dose ? (
                    <span className="text-[10px] text-destructive">{itemErrors.dose.message}</span>
                  ) : null}
                </div>

                <div className="sm:col-span-1 lg:col-span-3">
                  <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Via *</label>
                  <select
                    {...register(`itens.${itemEmEdicao}.via`)}
                    className={inputClass(itemErrors?.via)}
                  >
                    {VIAS_ADMINISTRACAO.map((v) => (
                      <option key={v} value={v}>{labelVia(v)} — {v.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                </div>

                <div className="lg:col-span-5">
                  <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Frequência *</label>
                  <input
                    {...register(`itens.${itemEmEdicao}.frequencia`)}
                    placeholder="Ex.: 8/8h, Se dor"
                    className={inputClass(itemErrors?.frequencia)}
                  />
                  {itemErrors?.frequencia ? (
                    <span className="text-[10px] text-destructive">{itemErrors.frequencia.message}</span>
                  ) : null}
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {FREQUENCIAS_RAPIDAS.map((f) => (
                      <button
                        key={f.valor}
                        type="button"
                        onClick={() => setValue(`itens.${itemEmEdicao}.frequencia`, f.valor, { shouldValidate: true })}
                        className="px-2 py-0.5 rounded-md border border-border text-[10px] font-medium text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="lg:col-span-2">
                  <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Duração (dias)</label>
                  <input
                    type="number"
                    min={1}
                    max={365}
                    {...register(`itens.${itemEmEdicao}.duracaoDias`, {
                      setValueAs: (v) => {
                        if (v === '' || v == null) return undefined;
                        const n = typeof v === 'number' ? v : Number(v);
                        return Number.isNaN(n) ? undefined : n;
                      },
                    })}
                    placeholder="Contínuo"
                    className={inputClass(itemErrors?.duracaoDias)}
                  />
                </div>

                <div className="lg:col-span-5">
                  <label className="text-[11px] font-medium text-muted-foreground mb-1 block">
                    Observações do item
                  </label>
                  <input
                    {...register(`itens.${itemEmEdicao}.observacoes`)}
                    placeholder="Instruções específicas"
                    className={inputClass()}
                  />
                </div>
              </div>
            </div>
          ) : null}

          <div className="p-4 bg-muted/5 border border-border rounded-xl space-y-2">
            <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Medicações prescritas
            </h5>
            <ul className="space-y-2">
              {fields.map((field, index) => {
                const item = itensWatch[index]
                const nome = item?.nomeMedicamento?.trim()
                const titulo = nome || `Medicamento ${index + 1} (sem nome)`
                const detalhe = [item?.dose?.trim(), item?.via ? labelVia(item.via) : '', item?.frequencia?.trim()]
                  .filter(Boolean)
                  .join(' · ')
                return (
                  <li
                    key={field.id}
                    className={cn(
                      'rounded-lg border px-3 py-2 flex items-center justify-between gap-3',
                      itemEmEdicao === index ? 'border-primary/40 bg-primary/5' : 'border-border bg-background'
                    )}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{titulo}</p>
                      <p className="text-xs text-muted-foreground truncate">{detalhe || 'Sem detalhes preenchidos'}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setItemEmEdicao(index)}
                        className="px-2 py-1 text-xs font-semibold text-primary hover:bg-primary/10 rounded-md transition-colors"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        disabled={fields.length === 1}
                        className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors disabled:opacity-30"
                        title="Remover medicamento"
                        aria-label={`Remover medicamento ${index + 1}`}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">
            Observações gerais {variantEfetivo === 'internacao' ? '(dieta, repouso, cuidados)' : '(opcional)'}
          </label>
          <textarea
            {...register('observacoes')}
            rows={variantEfetivo === 'internacao' ? 3 : 2}
            className={cn(inputClass(), 'resize-none')}
            placeholder={
              variantEfetivo === 'internacao'
                ? 'Orientações gerais para a equipe de enfermagem…'
                : 'Orientações gerais, repouso, dieta…'
            }
          />
        </div>

        {errors.itens?.root ? (
          <p className="text-sm text-destructive font-medium">{errors.itens.root.message}</p>
        ) : null}

        <div className="flex flex-wrap justify-end gap-2 pt-3 border-t border-border">
          <button
            type="submit"
            disabled={isSubmitting}
            id="btn-salvar-prescricao"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-60 transition-opacity"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Verificando e salvando…
              </>
            ) : (
              <>
                <FileSignature className="h-4 w-4" aria-hidden />
                {LABEL_BOTAO[variantEfetivo]}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
