'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Loader2, Save, Shield, Printer, Send, Plus, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { FichaCcihPrefill } from '@/lib/ccih-internacao'
import { LABEL_STATUS_FICHA_CCIH, formularioCcihVazio } from '@/lib/ccih-internacao'
import type { FichaCcihForm, FormularioCcihNotificacao } from '@/lib/validations/ccih'
import { inputLeituraCls } from '@/components/internamento/CampoIdentificacaoLeitura'

const inputCls =
  'mt-1 w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30'
const inputIdentificacaoCls = cn(inputCls, inputLeituraCls.replace('mt-1 ', ''))
const labelCls = 'text-sm font-medium text-foreground'
const sectionCls = 'bg-card border border-border rounded-xl p-5 sm:p-6 space-y-4'

function SecaoTitulo({ titulo }: { titulo: string }) {
  return (
    <h3 className="text-base font-semibold text-foreground border-b border-border pb-2">{titulo}</h3>
  )
}

function Check({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className="flex items-center gap-2 text-sm cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="rounded border-input"
        aria-label={label}
      />
      <span>{label}</span>
    </label>
  )
}

const PROCEDIMENTOS_RISCO: { key: keyof NonNullable<FormularioCcihNotificacao['procedimentos_risco_realizados']>; label: string }[] = [
  { key: 'assistencia_ventilatoria', label: 'Assistência ventilatória' },
  { key: 'disseccao_venosa', label: 'Dissecção venosa' },
  { key: 'puncao_lombar', label: 'Punção lombar' },
  { key: 'biopsia', label: 'Biópsia' },
  { key: 'entubacao', label: 'Entubação' },
  { key: 'puncao_toracica', label: 'Punção torácica' },
  { key: 'cateterismo_vesical', label: 'Cateterismo vesical' },
  { key: 'npt', label: 'NPT / Nutrição parenteral' },
  { key: 'hemotransfusao', label: 'Hemotransfusão' },
  { key: 'cateterismo_venoso', label: 'Cateterismo venoso' },
  { key: 'nebulizacao', label: 'Nebulização' },
  { key: 'traqueostomia', label: 'Traqueostomia' },
  { key: 'puncao_venosa', label: 'Punção venosa' },
]

const INFECCAO_OPCOES: { value: 'SIM' | 'NAO' | 'COMUNITARIA' | 'HOSPITALAR' | 'AMBAS'; label: string }[] = [
  { value: 'SIM', label: 'Sim' },
  { value: 'NAO', label: 'Não' },
  { value: 'COMUNITARIA', label: 'Comunitária' },
  { value: 'HOSPITALAR', label: 'Hospitalar' },
  { value: 'AMBAS', label: 'Ambas' },
]

const TOPOGRAFIAS: { key: keyof NonNullable<NonNullable<FormularioCcihNotificacao['infeccao_notificada']>['localizacao_topografica']>; label: string }[] = [
  { key: 'coto_umbilical', label: 'Coto umbilical' },
  { key: 'ocular', label: 'Ocular' },
  { key: 'puerperal', label: 'Puerperal' },
  { key: 'cutanea_nao_cirurgica', label: 'Cutânea não cirúrgica' },
  { key: 'ouvido', label: 'Ouvido' },
  { key: 'respiratoria', label: 'Respiratória' },
  { key: 'ferida_cirurgica', label: 'Ferida cirúrgica' },
  { key: 'oral', label: 'Oral' },
  { key: 'urinaria', label: 'Urinária' },
  { key: 'gastro_intestinal', label: 'Gastrointestinal' },
  { key: 'peritonial', label: 'Peritoneal' },
  { key: 'venosa_flebite', label: 'Venosa / flebite' },
]

export function FormularioFichaCcih({ atendimentoId }: { atendimentoId: string }) {
  const router = useRouter()
  const [carregando, setCarregando] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [germeAtivo, setGermeAtivo] = useState<1 | 2 | 3>(1)
  const [antiDraft, setAntiDraft] = useState({
    tipo_nome: '',
    dose: '',
    data_inicio: '',
    data_termino: '',
  })
  const [antiEditando, setAntiEditando] = useState<number | null>(null)
  const [meta, setMeta] = useState({ numeroAtendimento: '', diasInternacao: null as number | null })
  const [dados, setDados] = useState<FichaCcihForm>(() => ({
    status: 'RASCUNHO',
    formulario: formularioCcihVazio(),
    observacoesEquipe: '',
    parecerCcih: '',
  }))

  const f = dados.formulario
  const setForm = useCallback((patch: Partial<FormularioCcihNotificacao>) => {
    setDados((prev) => ({ ...prev, formulario: { ...prev.formulario, ...patch } }))
  }, [])

  const aplicarPrefill = useCallback((p: FichaCcihPrefill) => {
    setMeta({ numeroAtendimento: p.numeroAtendimento, diasInternacao: p.diasInternacao ?? null })
    setDados({
      status: p.status,
      formulario: p.formulario,
      observacoesEquipe: p.observacoesEquipe ?? '',
      parecerCcih: p.parecerCcih ?? '',
    })
  }, [])

  useEffect(() => {
    async function carregar() {
      setCarregando(true)
      try {
        const res = await fetch(`/api/atendimento/${atendimentoId}/ccih`)
        const json = await res.json()
        if (!json.sucesso) {
          toast.error(json.erro ?? 'Erro ao carregar ficha CCIH.')
          return
        }
        aplicarPrefill(json.dados.prefill as FichaCcihPrefill)
      } catch {
        toast.error('Erro de conexão.')
      } finally {
        setCarregando(false)
      }
    }
    carregar()
  }, [atendimentoId, aplicarPrefill])

  const handleSalvar = async (statusEnvio: string) => {
    setEnviando(true)
    try {
      const payload: FichaCcihForm = { ...dados, status: statusEnvio as FichaCcihForm['status'] }
      const res = await fetch(`/api/atendimento/${atendimentoId}/ccih`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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
      setDados((prev) => ({ ...prev, status: statusEnvio as FichaCcihForm['status'] }))
      toast.success(statusEnvio === 'NOTIFICADO' ? 'Ficha notificada à CCIH.' : 'Rascunho salvo.')
      router.refresh()
    } catch {
      toast.error('Erro de conexão ao salvar.')
    } finally {
      setEnviando(false)
    }
  }

  const incluirAntimicrobiano = () => {
    if (!antiDraft.tipo_nome.trim()) {
      toast.error('Informe o antimicrobiano.')
      return
    }
    const meds = [...(f.uso_antimicrobianos?.medicamentos ?? [])]
    const item = {
      ...antiDraft,
      nome_antimicrobiano: antiDraft.tipo_nome.trim(),
      dose_posologia: antiDraft.dose.trim(),
    }
    if (antiEditando !== null) {
      meds[antiEditando] = item
    } else {
      meds.push(item)
    }
    setForm({
      uso_antimicrobianos: {
        ...f.uso_antimicrobianos!,
        houve_uso: true,
        medicamentos: meds,
      },
    })
    setAntiDraft({ tipo_nome: '', dose: '', data_inicio: '', data_termino: '' })
    setAntiEditando(null)
  }

  const editarAntimicrobiano = (idx: number) => {
    const med = f.uso_antimicrobianos?.medicamentos?.[idx]
    if (!med) return
    setAntiDraft({
      tipo_nome: med.tipo_nome ?? med.nome_antimicrobiano ?? '',
      dose: med.dose ?? med.dose_posologia ?? '',
      data_inicio: med.data_inicio ?? '',
      data_termino: med.data_termino ?? '',
    })
    setAntiEditando(idx)
  }

  const removerAntimicrobiano = (idx: number) => {
    const meds = (f.uso_antimicrobianos?.medicamentos ?? []).filter((_, i) => i !== idx)
    setForm({
      uso_antimicrobianos: {
        ...f.uso_antimicrobianos!,
        medicamentos: meds,
        houve_uso: meds.length > 0,
      },
    })
    if (antiEditando === idx) {
      setAntiDraft({ tipo_nome: '', dose: '', data_inicio: '', data_termino: '' })
      setAntiEditando(null)
    }
  }

  if (carregando) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin" aria-hidden />
        <p className="text-sm">Carregando ficha CCIH…</p>
      </div>
    )
  }

  const proc = f.procedimentos_risco_realizados ?? formularioCcihVazio().procedimentos_risco_realizados!
  const inf = f.infeccao_notificada ?? formularioCcihVazio().infeccao_notificada!
  const topo = inf.localizacao_topografica ?? formularioCcihVazio().infeccao_notificada!.localizacao_topografica!

  return (
    <form className="space-y-6 pb-16" onSubmit={(e) => e.preventDefault()}>
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm">
        <Shield className="h-5 w-5 text-amber-600 shrink-0" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-foreground">Ficha de Notificação à CCIH — IRAS</p>
          <p className="text-muted-foreground text-xs mt-0.5">
            Atendimento {meta.numeroAtendimento}
            {meta.diasInternacao != null ? ` — ${meta.diasInternacao} dia(s) de internação` : ''}. Campos
            pré-preenchidos com dados do paciente e prontuário.
          </p>
        </div>
        <span
          className={cn(
            'text-xs font-bold px-2.5 py-1 rounded-md shrink-0',
            dados.status === 'CONCLUIDO'
              ? 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200'
              : dados.status === 'NOTIFICADO' || dados.status === 'EM_ANALISE'
                ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200'
                : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200'
          )}
        >
          {LABEL_STATUS_FICHA_CCIH[dados.status] ?? dados.status}
        </span>
      </div>

      <section className={sectionCls}>
        <SecaoTitulo titulo="Controle interno e hospital" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className={labelCls}>Nº controle</label>
            <input
              type="text"
              value={f.controle_interno?.numero_controle ?? ''}
              onChange={(e) =>
                setForm({ controle_interno: { ...f.controle_interno!, numero_controle: e.target.value } })
              }
              className={cn(inputCls, 'font-mono')}
              aria-label="Número de controle"
            />
          </div>
          <div>
            <label className={labelCls}>Nº registro</label>
            <input
              type="text"
              value={f.controle_interno?.numero_registro ?? ''}
              onChange={(e) =>
                setForm({ controle_interno: { ...f.controle_interno!, numero_registro: e.target.value } })
              }
              className={cn(inputCls, 'font-mono')}
              aria-label="Número de registro"
            />
          </div>
          <div>
            <label className={labelCls}>Data da notificação</label>
            <input
              type="date"
              value={f.data_notificacao ?? ''}
              onChange={(e) => setForm({ data_notificacao: e.target.value })}
              className={inputCls}
              aria-label="Data da notificação"
            />
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <label className={labelCls}>Hospital</label>
            <input
              type="text"
              value={f.hospital ?? ''}
              onChange={(e) => setForm({ hospital: e.target.value })}
              className={inputCls}
              aria-label="Hospital"
            />
          </div>
          <div>
            <label className={labelCls}>Clínica / serviço</label>
            <input
              type="text"
              value={f.hospital_unidade?.clinica_servico ?? ''}
              onChange={(e) =>
                setForm({
                  hospital_unidade: { ...f.hospital_unidade!, clinica_servico: e.target.value },
                  paciente_internacao: { ...f.paciente_internacao, clinica: e.target.value },
                })
              }
              className={inputCls}
              aria-label="Clínica ou serviço"
            />
          </div>
          <div>
            <label className={labelCls}>Andar / ala</label>
            <input
              type="text"
              value={f.hospital_unidade?.andar_ala ?? ''}
              onChange={(e) =>
                setForm({
                  hospital_unidade: { ...f.hospital_unidade!, andar_ala: e.target.value },
                  paciente_internacao: { ...f.paciente_internacao, andar: e.target.value },
                })
              }
              className={inputCls}
              aria-label="Andar ou ala"
            />
          </div>
          <div>
            <label className={labelCls}>Enfermaria / leito</label>
            <input
              type="text"
              readOnly
              tabIndex={-1}
              value={f.hospital_unidade?.enfermaria_leito ?? 'Definido na admissão'}
              className={inputIdentificacaoCls}
              aria-label="Enfermaria ou leito"
            />
          </div>
        </div>
      </section>

      <section className={sectionCls}>
        <SecaoTitulo titulo="Paciente e internação" />
        <p className="text-xs text-muted-foreground">Identificação do paciente — somente leitura.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="sm:col-span-2 lg:col-span-3">
            <label className={labelCls}>Nome *</label>
            <input
              type="text"
              readOnly
              tabIndex={-1}
              value={f.paciente_internacao.nome}
              className={inputIdentificacaoCls}
              aria-label="Nome do paciente"
            />
          </div>
          <div>
            <label className={labelCls}>Prontuário</label>
            <input
              type="text"
              readOnly
              tabIndex={-1}
              value={f.paciente_internacao.prontuario ?? ''}
              className={cn(inputIdentificacaoCls, 'font-mono')}
              aria-label="Prontuário"
            />
          </div>
          <div>
            <label className={labelCls}>Sexo</label>
            <input
              type="text"
              readOnly
              tabIndex={-1}
              value={f.paciente_internacao.sexo ?? ''}
              className={inputIdentificacaoCls}
              aria-label="Sexo"
            />
          </div>
          <div>
            <label className={labelCls}>Idade</label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                tabIndex={-1}
                value={
                  f.paciente_internacao.idade != null
                    ? `${f.paciente_internacao.idade} ${f.paciente_internacao.idade_unidade ?? 'anos'}`
                    : '—'
                }
                className={cn(inputIdentificacaoCls, 'flex-1')}
                aria-label="Idade"
              />
            </div>
          </div>
          <div>
            <label className={labelCls}>Data da internação</label>
            <input
              type="date"
              value={f.paciente_internacao.data_internacao ?? ''}
              onChange={(e) =>
                setForm({
                  paciente_internacao: { ...f.paciente_internacao, data_internacao: e.target.value },
                })
              }
              className={inputCls}
              aria-label="Data da internação"
            />
          </div>
          <div>
            <label className={labelCls}>Alta em</label>
            <input
              type="date"
              value={f.paciente_internacao.alta_em ?? ''}
              onChange={(e) =>
                setForm({
                  paciente_internacao: { ...f.paciente_internacao, alta_em: e.target.value },
                })
              }
              className={inputCls}
              aria-label="Data da alta"
            />
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <label className={labelCls}>Diagnóstico na admissão</label>
            <textarea
              rows={2}
              value={f.paciente_internacao.diagnostico ?? ''}
              onChange={(e) =>
                setForm({
                  paciente_internacao: { ...f.paciente_internacao, diagnostico: e.target.value },
                })
              }
              className={inputCls}
              aria-label="Diagnóstico na admissão"
            />
          </div>
          <div className="sm:col-span-2 lg:col-span-3 flex flex-wrap gap-4">
            <Check
              label="Houve óbito"
              checked={Boolean(f.paciente_internacao.obito?.houve_obito)}
              onChange={(v) =>
                setForm({
                  paciente_internacao: {
                    ...f.paciente_internacao,
                    obito: {
                      ...f.paciente_internacao.obito!,
                      houve_obito: v,
                      data: v ? f.paciente_internacao.obito?.data ?? '' : '',
                      causa: v ? f.paciente_internacao.obito?.causa ?? '' : '',
                    },
                  },
                })
              }
            />
            {f.paciente_internacao.obito?.houve_obito ? (
              <Check
                label="Causa relacionada à infecção"
                checked={Boolean(f.paciente_internacao.obito?.causa_relacionada_infeccao)}
                onChange={(v) =>
                  setForm({
                    paciente_internacao: {
                      ...f.paciente_internacao,
                      obito: { ...f.paciente_internacao.obito!, causa_relacionada_infeccao: v },
                    },
                  })
                }
              />
            ) : null}
          </div>
          {f.paciente_internacao.obito?.houve_obito ? (
            <>
              <div>
                <label className={labelCls}>Data do óbito</label>
                <input
                  type="date"
                  value={f.paciente_internacao.obito?.data ?? ''}
                  onChange={(e) =>
                    setForm({
                      paciente_internacao: {
                        ...f.paciente_internacao,
                        obito: { ...f.paciente_internacao.obito!, data: e.target.value },
                      },
                    })
                  }
                  className={inputCls}
                  aria-label="Data do óbito"
                />
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>Causa do óbito</label>
                <input
                  type="text"
                  value={f.paciente_internacao.obito?.causa ?? ''}
                  onChange={(e) =>
                    setForm({
                      paciente_internacao: {
                        ...f.paciente_internacao,
                        obito: { ...f.paciente_internacao.obito!, causa: e.target.value },
                      },
                    })
                  }
                  className={inputCls}
                  aria-label="Causa do óbito"
                />
              </div>
            </>
          ) : null}
        </div>
      </section>

      <section className={sectionCls}>
        <SecaoTitulo titulo="Dados cirúrgicos" />
        <Check
          label="Houve cirurgia"
          checked={Boolean(f.dados_cirurgicos?.houve_cirurgia)}
          onChange={(v) => setForm({ dados_cirurgicos: { ...f.dados_cirurgicos!, houve_cirurgia: v } })}
        />
        {f.dados_cirurgicos?.houve_cirurgia ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className={labelCls}>Nome da cirurgia</label>
              <input
                type="text"
                value={f.dados_cirurgicos?.nome_cirurgia ?? f.dados_cirurgicos?.descricao_cirurgia ?? ''}
                onChange={(e) =>
                  setForm({
                    dados_cirurgicos: {
                      ...f.dados_cirurgicos!,
                      nome_cirurgia: e.target.value,
                      descricao_cirurgia: e.target.value,
                    },
                  })
                }
                className={inputCls}
                aria-label="Nome da cirurgia"
              />
            </div>
            <div>
              <label className={labelCls}>Duração (h/min)</label>
              <input
                type="text"
                value={f.dados_cirurgicos?.duracao_horas_minutos ?? ''}
                onChange={(e) =>
                  setForm({ dados_cirurgicos: { ...f.dados_cirurgicos!, duracao_horas_minutos: e.target.value } })
                }
                className={inputCls}
                placeholder="Ex.: 2h30"
                aria-label="Duração da cirurgia"
              />
            </div>
            <div>
              <label className={labelCls}>Data</label>
              <input
                type="date"
                value={f.dados_cirurgicos?.data_cirurgia ?? ''}
                onChange={(e) =>
                  setForm({ dados_cirurgicos: { ...f.dados_cirurgicos!, data_cirurgia: e.target.value } })
                }
                className={inputCls}
                aria-label="Data da cirurgia"
              />
            </div>
            <div>
              <label className={labelCls}>Cirurgião</label>
              <input
                type="text"
                value={f.dados_cirurgicos?.cirurgiao ?? ''}
                onChange={(e) =>
                  setForm({ dados_cirurgicos: { ...f.dados_cirurgicos!, cirurgiao: e.target.value } })
                }
                className={inputCls}
                aria-label="Cirurgião"
              />
            </div>
            <div className="sm:col-span-2">
              <p className={labelCls}>Tipo</p>
              <div className="flex flex-wrap gap-x-4 gap-y-2 mt-2" role="radiogroup" aria-label="Tipo de cirurgia">
                {[
                  { value: 'LIMPA', label: 'Limpa' },
                  { value: 'NAO_LIMPA', label: 'Não limpa' },
                ].map(({ value, label }) => (
                  <label key={value} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="tipo-cirurgia-ccih"
                      value={value}
                      checked={(f.dados_cirurgicos?.classificacao_cirurgia ?? '') === value}
                      onChange={() =>
                        setForm({
                          dados_cirurgicos: {
                            ...f.dados_cirurgicos!,
                            classificacao_cirurgia: value,
                            tipo_cirurgia: value,
                          },
                        })
                      }
                      className="border-input"
                      aria-label={`Cirurgia ${label}`}
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </div>
            <Check
              label="Utilizou implante / prótese"
              checked={Boolean(f.dados_cirurgicos?.utilizou_implante_protese)}
              onChange={(v) =>
                setForm({ dados_cirurgicos: { ...f.dados_cirurgicos!, utilizou_implante_protese: v } })
              }
            />
            <div>
              <label className={labelCls}>Anestesista</label>
              <input
                type="text"
                value={f.dados_cirurgicos?.anestesista ?? ''}
                onChange={(e) =>
                  setForm({ dados_cirurgicos: { ...f.dados_cirurgicos!, anestesista: e.target.value } })
                }
                className={inputCls}
                aria-label="Anestesista"
              />
            </div>
            <div>
              <label className={labelCls}>Tipo de anestesia</label>
              <input
                type="text"
                value={f.dados_cirurgicos?.tipo_anestesia ?? ''}
                onChange={(e) =>
                  setForm({ dados_cirurgicos: { ...f.dados_cirurgicos!, tipo_anestesia: e.target.value } })
                }
                className={inputCls}
                aria-label="Tipo de anestesia"
              />
            </div>
          </div>
        ) : null}
      </section>

      <section className={sectionCls}>
        <SecaoTitulo titulo="Dados obstétricos" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Check
            label="Parto transpelvico"
            checked={Boolean(f.dados_obstetricos?.parto_transpelvico)}
            onChange={(v) =>
              setForm({ dados_obstetricos: { ...f.dados_obstetricos!, parto_transpelvico: v } })
            }
          />
          <Check
            label="Episiorrafia"
            checked={Boolean(f.dados_obstetricos?.episiorrafia)}
            onChange={(v) => setForm({ dados_obstetricos: { ...f.dados_obstetricos!, episiorrafia: v } })}
          />
          <div>
            <label className={labelCls}>Obstetra</label>
            <input
              type="text"
              value={f.dados_obstetricos?.obstetra ?? ''}
              onChange={(e) =>
                setForm({ dados_obstetricos: { ...f.dados_obstetricos!, obstetra: e.target.value } })
              }
              className={inputCls}
              aria-label="Obstetra"
            />
          </div>
          <div>
            <label className={labelCls}>Data do parto</label>
            <input
              type="date"
              value={f.dados_obstetricos?.data_parto ?? f.dados_obstetricos?.data ?? ''}
              onChange={(e) =>
                setForm({
                  dados_obstetricos: {
                    ...f.dados_obstetricos!,
                    data: e.target.value,
                    data_parto: e.target.value,
                  },
                })
              }
              className={inputCls}
              aria-label="Data do parto"
            />
          </div>
          <Check
            label="Bolsa rota"
            checked={Boolean(f.dados_obstetricos?.bolsa_rota?.apresentou)}
            onChange={(v) =>
              setForm({
                dados_obstetricos: {
                  ...f.dados_obstetricos!,
                  bolsa_rota: { ...f.dados_obstetricos!.bolsa_rota!, apresentou: v },
                },
              })
            }
          />
          {f.dados_obstetricos?.bolsa_rota?.apresentou ? (
            <div>
              <label className={labelCls}>Horas (bolsa rota)</label>
              <input
                type="number"
                min={0}
                value={f.dados_obstetricos?.bolsa_rota?.numero_horas ?? ''}
                onChange={(e) =>
                  setForm({
                    dados_obstetricos: {
                      ...f.dados_obstetricos!,
                      bolsa_rota: {
                        ...f.dados_obstetricos!.bolsa_rota!,
                        numero_horas: e.target.value === '' ? null : Number(e.target.value),
                        tempo_horas: e.target.value === '' ? null : Number(e.target.value),
                      },
                    },
                  })
                }
                className={inputCls}
                aria-label="Número de horas bolsa rota"
              />
            </div>
          ) : null}
          <div className="sm:col-span-2">
            <p className={labelCls}>Placenta</p>
            <div className="flex flex-wrap gap-x-4 gap-y-2 mt-2" role="radiogroup" aria-label="Placenta">
              {[
                { value: true, label: 'Completa' },
                { value: false, label: 'Incompleta' },
              ].map(({ value, label }) => (
                <label key={label} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="placenta-ccih"
                    checked={f.dados_obstetricos?.placenta_completa === value}
                    onChange={() =>
                      setForm({ dados_obstetricos: { ...f.dados_obstetricos!, placenta_completa: value } })
                    }
                    className="border-input"
                    aria-label={`Placenta ${label}`}
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className={sectionCls}>
        <SecaoTitulo titulo="Procedimentos de risco realizados" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {PROCEDIMENTOS_RISCO.map(({ key, label }) => (
            <Check
              key={key}
              label={label}
              checked={Boolean(proc[key])}
              onChange={(v) => {
                const patch = { ...proc, [key]: v }
                if (key === 'npt') patch.npt_nutricao_parenteral = v
                setForm({ procedimentos_risco_realizados: patch })
              }}
            />
          ))}
        </div>

        <Check
          label="Punção abdominal"
          checked={Boolean(proc.puncao_abdominal)}
          onChange={(v) =>
            setForm({
              procedimentos_risco_realizados: { ...proc, puncao_abdominal: v },
            })
          }
        />

        <div>
          <label className={labelCls} htmlFor="procedimento-complemento-ccih">
            Outros / complemento (campo aberto)
          </label>
          <textarea
            id="procedimento-complemento-ccih"
            rows={2}
            value={proc.procedimento_complemento_texto ?? ''}
            onChange={(e) =>
              setForm({
                procedimentos_risco_realizados: { ...proc, procedimento_complemento_texto: e.target.value },
              })
            }
            className={inputCls}
            placeholder="Descreva outros procedimentos ou observações…"
            aria-label="Complemento de procedimentos"
          />
        </div>

        <div className="pt-2 border-t border-border/60 space-y-3">
          <p className={labelCls}>Infecção</p>
          <div
            className="flex flex-wrap gap-x-4 gap-y-2"
            role="radiogroup"
            aria-label="Classificação da infecção"
          >
            {INFECCAO_OPCOES.map(({ value, label }) => (
              <label key={value} className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  name="infeccao-opcao-ccih"
                  value={value}
                  checked={(inf.infeccao_opcao ?? '') === value}
                  onChange={() =>
                    setForm({
                      infeccao_notificada: {
                        ...inf,
                        infeccao_opcao: value,
                        origem_infeccao: value,
                        apresenta_infeccao: value !== 'NAO',
                      },
                    })
                  }
                  className="border-input"
                  aria-label={`Infecção ${label}`}
                />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </div>
      </section>

      <section className={sectionCls}>
        <SecaoTitulo titulo="Infecção notificada" />
        <div>
          <label className={labelCls}>Classificação</label>
          <input
            type="text"
            value={inf.classificacao ?? ''}
            onChange={(e) =>
              setForm({ infeccao_notificada: { ...inf, classificacao: e.target.value } })
            }
            className={inputCls}
            placeholder="Ex.: ITU, PAVM, ISC…"
            aria-label="Classificação da infecção"
          />
        </div>
        <div>
          <p className={labelCls}>Localização topográfica</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-2">
            {TOPOGRAFIAS.map(({ key, label }) => (
              <Check
                key={key}
                label={label}
                checked={Boolean(topo[key])}
                onChange={(v) =>
                  setForm({
                    infeccao_notificada: {
                      ...inf,
                      localizacao_topografica: { ...topo, [key]: v },
                    },
                  })
                }
              />
            ))}
          </div>
          <div className="mt-3">
            <label className={labelCls}>Outras topografias</label>
            <input
              type="text"
              value={topo.outras_topografias_texto ?? ''}
              onChange={(e) =>
                setForm({
                  infeccao_notificada: {
                    ...inf,
                    localizacao_topografica: { ...topo, outras_topografias_texto: e.target.value },
                  },
                })
              }
              className={inputCls}
              aria-label="Outras topografias"
            />
          </div>
        </div>
      </section>

      <section className={sectionCls}>
        <SecaoTitulo titulo="Uso de antimicrobianos" />
        <Check
          label="Houve uso de antimicrobianos"
          checked={Boolean(f.uso_antimicrobianos?.houve_uso)}
          onChange={(v) =>
            setForm({ uso_antimicrobianos: { ...f.uso_antimicrobianos!, houve_uso: v } })
          }
        />
        {f.uso_antimicrobianos?.houve_uso ? (
          <div className="space-y-4">
            <div>
              <p className={labelCls}>Finalidade</p>
              <div className="flex flex-wrap gap-x-4 gap-y-2 mt-2" role="radiogroup" aria-label="Finalidade do antimicrobiano">
                {[
                  { value: 'PROFILATICO', label: 'Profilático' },
                  { value: 'TERAPEUTICO', label: 'Terapêutico' },
                  { value: 'AMBOS', label: 'Ambos' },
                ].map(({ value, label }) => (
                  <label key={value} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="finalidade-antimicrobiano-ccih"
                      value={value}
                      checked={(f.uso_antimicrobianos?.finalidade ?? '') === value}
                      onChange={() =>
                        setForm({ uso_antimicrobianos: { ...f.uso_antimicrobianos!, finalidade: value } })
                      }
                      className="border-input"
                      aria-label={`Finalidade ${label}`}
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-border p-3 space-y-3 bg-muted/10">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {antiEditando !== null ? `Editando item ${antiEditando + 1}` : 'Novo antimicrobiano'}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-xs text-muted-foreground">Antimicrobiano</label>
                  <input
                    type="text"
                    value={antiDraft.tipo_nome}
                    onChange={(e) => setAntiDraft((d) => ({ ...d, tipo_nome: e.target.value }))}
                    className={inputCls}
                    placeholder="Ex.: ceftriaxona"
                    aria-label="Nome do antimicrobiano"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Dose / posologia</label>
                  <input
                    type="text"
                    value={antiDraft.dose}
                    onChange={(e) => setAntiDraft((d) => ({ ...d, dose: e.target.value }))}
                    className={inputCls}
                    placeholder="Ex.: 1g 12/12h"
                    aria-label="Dose do antimicrobiano"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Início</label>
                  <input
                    type="date"
                    value={antiDraft.data_inicio}
                    onChange={(e) => setAntiDraft((d) => ({ ...d, data_inicio: e.target.value }))}
                    className={inputCls}
                    aria-label="Data de início"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Término</label>
                  <input
                    type="date"
                    value={antiDraft.data_termino}
                    onChange={(e) => setAntiDraft((d) => ({ ...d, data_termino: e.target.value }))}
                    className={inputCls}
                    aria-label="Data de término"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={incluirAntimicrobiano}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold"
                >
                  <Plus className="h-3.5 w-3.5" aria-hidden />
                  {antiEditando !== null ? 'Salvar alteração' : 'Incluir na lista'}
                </button>
                {antiEditando !== null ? (
                  <button
                    type="button"
                    onClick={() => {
                      setAntiDraft({ tipo_nome: '', dose: '', data_inicio: '', data_termino: '' })
                      setAntiEditando(null)
                    }}
                    className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-muted/50"
                  >
                    Cancelar edição
                  </button>
                ) : null}
              </div>
            </div>

            <div>
              <p className={labelCls}>Antimicrobianos registrados</p>
              {(f.uso_antimicrobianos?.medicamentos ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground mt-1">Nenhum antimicrobiano lançado ainda.</p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {(f.uso_antimicrobianos?.medicamentos ?? []).map((med, idx) => (
                    <li
                      key={`${med.tipo_nome}-${idx}`}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 bg-background"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {med.tipo_nome || med.nome_antimicrobiano || `Item ${idx + 1}`}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {[med.dose || med.dose_posologia, med.data_inicio, med.data_termino]
                            .filter(Boolean)
                            .join(' · ') || 'Sem detalhes'}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => editarAntimicrobiano(idx)}
                          className="px-2 py-1 text-xs font-semibold text-primary hover:bg-primary/10 rounded-md"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => removerAntimicrobiano(idx)}
                          className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
                          aria-label={`Remover antimicrobiano ${idx + 1}`}
                        >
                          <Trash2 className="h-4 w-4" aria-hidden />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ) : null}
      </section>

      <section className={sectionCls}>
        <SecaoTitulo titulo="Dados de cultura" />
        <Check
          label="Cultura realizada"
          checked={Boolean(f.dados_cultura?.realizada ?? f.dados_cultura?.cultura_realizada)}
          onChange={(v) =>
            setForm({
              dados_cultura: { ...f.dados_cultura!, realizada: v, cultura_realizada: v },
            })
          }
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Tipo / material coletado</label>
            <input
              type="text"
              value={f.dados_cultura?.tipo_material_coletado ?? f.dados_cultura?.tipos ?? ''}
              onChange={(e) =>
                setForm({
                  dados_cultura: {
                    ...f.dados_cultura!,
                    tipo_material_coletado: e.target.value,
                    tipos: e.target.value,
                  },
                })
              }
              className={inputCls}
              aria-label="Tipo ou material coletado"
            />
          </div>
          <div>
            <label className={labelCls}>Data da coleta</label>
            <input
              type="date"
              value={f.dados_cultura?.data_coleta ?? ''}
              onChange={(e) =>
                setForm({ dados_cultura: { ...f.dados_cultura!, data_coleta: e.target.value } })
              }
              className={inputCls}
              aria-label="Data da coleta"
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Resultados</label>
            <textarea
              rows={4}
              value={f.dados_cultura?.resultados ?? ''}
              onChange={(e) =>
                setForm({ dados_cultura: { ...f.dados_cultura!, resultados: e.target.value } })
              }
              className={inputCls}
              placeholder="Descreva o resultado da cultura…"
              aria-label="Resultados da cultura"
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Observações do laboratório</label>
            <textarea
              rows={3}
              value={f.dados_cultura?.observacoes_laboratorio ?? ''}
              onChange={(e) =>
                setForm({
                  dados_cultura: { ...f.dados_cultura!, observacoes_laboratorio: e.target.value },
                })
              }
              className={inputCls}
              aria-label="Observações do laboratório"
            />
          </div>
          <div className="sm:col-span-2 space-y-3">
            <div className="flex flex-wrap gap-1 border-b border-border pb-2" role="tablist" aria-label="Germes identificados">
              {([1, 2, 3] as const).map((n) => (
                <button
                  key={n}
                  type="button"
                  role="tab"
                  aria-selected={germeAtivo === n}
                  onClick={() => setGermeAtivo(n)}
                  className={cn(
                    'px-3 py-1.5 rounded-md text-xs font-semibold transition-colors',
                    germeAtivo === n
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted/50'
                  )}
                >
                  Germe {n}
                </button>
              ))}
            </div>
            {(() => {
              const key = `germe_${germeAtivo}` as const
              const germe = f.dados_cultura?.germes?.[key]
              return (
                <div className="space-y-3">
                  <div>
                    <label className={labelCls}>Microorganismo</label>
                    <input
                      type="text"
                      value={germe?.nome_microorganismo ?? ''}
                      onChange={(e) => {
                        const germes = { ...f.dados_cultura!.germes! }
                        germes[key] = { ...germes[key]!, nome_microorganismo: e.target.value }
                        setForm({ dados_cultura: { ...f.dados_cultura!, germes } })
                      }}
                      className={inputCls}
                      aria-label={`Germe ${germeAtivo} — microorganismo`}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Antibiograma / sensibilidade</label>
                    <textarea
                      rows={3}
                      value={germe?.antibiograma_sensibilidade ?? ''}
                      onChange={(e) => {
                        const germes = { ...f.dados_cultura!.germes! }
                        germes[key] = { ...germes[key]!, antibiograma_sensibilidade: e.target.value }
                        setForm({ dados_cultura: { ...f.dados_cultura!, germes } })
                      }}
                      className={inputCls}
                      aria-label={`Germe ${germeAtivo} — antibiograma`}
                    />
                  </div>
                </div>
              )
            })()}
          </div>
        </div>
      </section>

      <section className={sectionCls}>
        <SecaoTitulo titulo="Registro da equipe CCIH" />
        <div className="space-y-4">
          <div>
            <label className={labelCls}>Observações da equipe</label>
            <textarea
              rows={3}
              value={dados.observacoesEquipe ?? ''}
              onChange={(e) => setDados((prev) => ({ ...prev, observacoesEquipe: e.target.value }))}
              className={inputCls}
              aria-label="Observações equipe"
            />
          </div>
          <div>
            <label className={labelCls}>Parecer CCIH</label>
            <textarea
              rows={3}
              value={dados.parecerCcih ?? ''}
              onChange={(e) => setDados((prev) => ({ ...prev, parecerCcih: e.target.value }))}
              className={inputCls}
              aria-label="Parecer CCIH"
            />
          </div>
          <div>
            <label className={labelCls}>Status do registro</label>
            <select
              value={dados.status}
              onChange={(e) => setDados((prev) => ({ ...prev, status: e.target.value as FichaCcihForm['status'] }))}
              className={inputCls}
              aria-label="Status da ficha"
            >
              <option value="RASCUNHO">Rascunho</option>
              <option value="NOTIFICADO">Notificado à CCIH</option>
              <option value="EM_ANALISE">Em análise</option>
              <option value="CONCLUIDO">Concluído</option>
            </select>
          </div>
        </div>
      </section>

      <div className="flex flex-wrap gap-3 sticky bottom-0 bg-background/95 backdrop-blur border-t border-border py-4">
        <Link
          href={`/internamento/ccih/imprimir/${atendimentoId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-muted"
          aria-label="Imprimir ficha CCIH"
        >
          <Printer className="h-4 w-4" aria-hidden />
          Imprimir ficha
        </Link>
        <button
          type="button"
          disabled={enviando}
          onClick={() => handleSalvar(dados.status)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-muted disabled:opacity-50"
          aria-label="Salvar ficha CCIH"
        >
          {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Salvar
        </button>
        <button
          type="button"
          disabled={enviando}
          onClick={() => handleSalvar('NOTIFICADO')}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50"
          aria-label="Notificar CCIH"
        >
          {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Notificar CCIH
        </button>
      </div>
    </form>
  )
}
