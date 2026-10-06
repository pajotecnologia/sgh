// components/internamento/FormularioLaudoSolicitacao.tsx
'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import Link from 'next/link'
import {
  Loader2,
  Save,
  Printer,
  FileText,
  CheckSquare,
  Square,
  Building2,
  User,
  Stethoscope,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { LaudoSolicitacaoPrefill } from '@/lib/laudo-solicitacao'
import type { LaudoSolicitacaoForm } from '@/lib/validations/laudo-solicitacao'

const inputCls =
  'w-full border border-input rounded-lg px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all'
const labelCls = 'text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1'
const cardCls = 'bg-card border border-border rounded-xl p-5 sm:p-6 space-y-4 shadow-sm'

const MODELOS_JUSTIFICATIVA = [
  {
    titulo: 'Acompanhante (Padrão)',
    texto:
      'Declaro para os devidos fins que estive acompanhando o paciente acima identificando, durante a sua internação neste hospital. Aprovo a cobrança do acompanhante junto ao HMAD.',
  },
  {
    titulo: 'Mudança de Procedimento',
    texto:
      'Solicito alteração de procedimento cirúrgico/clínico em decorrência da evolução do quadro clínico e necessidade de intervenção especializada durante a internação hospitalar.',
  },
  {
    titulo: 'Diária de UTI',
    texto:
      'Paciente necessita de cuidados intensivos, monitorização hemodinâmica contínua e suporte ventilatório/vasoativo em leito de Unidade de Terapia Intensiva (UTI).',
  },
  {
    titulo: 'Nutrição Parenteral',
    texto:
      'Indicação de Nutrição Parenteral Total (NPT) devido à impossibilidade de utilização do trato gastrointestinal para aporte calórico-proteico adequado.',
  },
  {
    titulo: 'Vacina Anti-Rh',
    texto:
      'Indicação de imunoglobulina anti-Rh (D) para profilaxia de aloimunização materna em puérpera Rh negativo com concepto Rh positivo.',
  },
]

export function FormularioLaudoSolicitacao({
  atendimentoId,
  onSalvo,
}: {
  atendimentoId: string
  onSalvo?: () => void
}) {
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [form, setForm] = useState<LaudoSolicitacaoForm>({
    status: 'RASCUNHO',
    nomeHospital: '',
    cnpjHospital: '',
    nomePaciente: '',
    numeroAih: '',
    procedimentoAnterior: '',
    procedimentoSolicitado: '',
    nomeMedicoSolicitante: '',
    crmMedicoSolicitante: '',
    cpfMedicoSolicitante: '',

    mudancaProcedimento: false,
    diariaUti: false,
    diariaAcompanhante: false,
    vacinaAntiRh: false,
    usoProteseOtica: false,
    usoFatoresCoagulacao: false,
    usoOrdenadores: false,
    nutricaoParenteral: false,

    justificativa: '',

    dataSolicitacao: new Date().toISOString().split('T')[0],
    nomeAcompanhante: '',
    dataAuditoria: '',
    parecerAuditor: '',
    nomeAuditor: '',
    crmAuditor: '',
  })

  async function carregar() {
    try {
      setCarregando(true)
      const res = await fetch(`/api/atendimento/${atendimentoId}/laudo-solicitacao`)
      const json = await res.json()
      if (json.sucesso && json.dados?.prefill) {
        setForm(json.dados.prefill)
      } else {
        toast.error(json.erro || 'Erro ao carregar dados do laudo.')
      }
    } catch {
      toast.error('Erro de conexão ao carregar laudo.')
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregar()
  }, [atendimentoId])

  async function salvar(novoStatus?: LaudoSolicitacaoForm['status']) {
    try {
      setSalvando(true)
      const payload: LaudoSolicitacaoForm = {
        ...form,
        status: novoStatus || form.status,
      }

      const res = await fetch(`/api/atendimento/${atendimentoId}/laudo-solicitacao`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const json = await res.json()
      if (!res.ok || !json.sucesso) {
        toast.error(json.erro || 'Erro ao salvar laudo de solicitação.')
        return
      }

      setForm((f) => ({ ...f, status: payload.status }))
      toast.success(
        payload.status === 'EMITIDO'
          ? 'Laudo de solicitação emitido com sucesso!'
          : 'Laudo de solicitação salvo com sucesso!'
      )
      if (onSalvo) onSalvo()
    } catch {
      toast.error('Erro de conexão ao salvar laudo.')
    } finally {
      setSalvando(false)
    }
  }

  if (carregando) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="text-sm font-medium">Carregando Laudo Médico para Solicitação...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* CABEÇALHO DE AÇÕES */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-muted/30 border border-border rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary/10 text-primary rounded-xl border border-primary/20">
            <Stethoscope className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">
              Laudo Médico para Solicitação
            </h2>
            <p className="text-xs text-muted-foreground">
              Solicitação médica de procedimentos, diárias, próteses e pareceres de internação
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              carregar()
              toast.info('Dados recarregados do sistema.')
            }}
            disabled={carregando}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-background hover:bg-muted text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
            title="Preencher com os dados mais recentes do paciente e hospital"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Preencher do Sistema
          </button>

          <Link
            href={`/internamento/laudo-solicitacao/imprimir/${atendimentoId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border bg-background hover:bg-muted text-xs font-semibold transition-colors"
          >
            <Printer className="h-4 w-4" />
            Imprimir Laudo
          </Link>

          <button
            type="button"
            onClick={() => salvar('RASCUNHO')}
            disabled={salvando}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold transition-colors"
          >
            {salvando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salvar Rascunho
          </button>

          <button
            type="button"
            onClick={() => salvar('EMITIDO')}
            disabled={salvando}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-bold shadow-md transition-all active:scale-95"
          >
            <CheckCircle2 className="h-4 w-4" />
            Emitir Laudo
          </button>
        </div>
      </div>

      {/* 1. TOPO: DADOS DO HOSPITAL, PACIENTE, PROCEDIMENTO E MÉDICO */}
      <div className={cardCls}>
        <div className="flex items-center gap-2 pb-2 border-b border-border">
          <Building2 className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
            1. Dados de Identificação (Hospital, Paciente e Profissional)
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className={labelCls}>Hospital</label>
            <input
              type="text"
              value={form.nomeHospital || ''}
              onChange={(e) => setForm((f) => ({ ...f, nomeHospital: e.target.value }))}
              className={inputCls}
              placeholder="Nome do Hospital / Unidade"
            />
          </div>

          <div>
            <label className={labelCls}>CNPJ</label>
            <input
              type="text"
              value={form.cnpjHospital || ''}
              onChange={(e) => setForm((f) => ({ ...f, cnpjHospital: e.target.value }))}
              className={inputCls}
              placeholder="00.000.000/0000-00"
            />
          </div>

          <div className="md:col-span-2">
            <label className={labelCls}>Paciente</label>
            <input
              type="text"
              value={form.nomePaciente || ''}
              onChange={(e) => setForm((f) => ({ ...f, nomePaciente: e.target.value }))}
              className={inputCls}
              placeholder="Nome completo do paciente"
            />
          </div>

          <div>
            <label className={labelCls}>Nº AIH / Atendimento</label>
            <input
              type="text"
              value={form.numeroAih || ''}
              onChange={(e) => setForm((f) => ({ ...f, numeroAih: e.target.value }))}
              className={inputCls}
              placeholder="Número da AIH ou Atendimento"
            />
          </div>

          <div className="md:col-span-1">
            <label className={labelCls}>Procedimento Anterior</label>
            <input
              type="text"
              value={form.procedimentoAnterior || ''}
              onChange={(e) => setForm((f) => ({ ...f, procedimentoAnterior: e.target.value }))}
              className={inputCls}
              placeholder="Código ou descrição anterior"
            />
          </div>

          <div className="md:col-span-2">
            <label className={labelCls}>Procedimento Solicitado</label>
            <input
              type="text"
              value={form.procedimentoSolicitado || ''}
              onChange={(e) => setForm((f) => ({ ...f, procedimentoSolicitado: e.target.value }))}
              className={inputCls}
              placeholder="Procedimento a ser executado / solicitado"
            />
          </div>

          <div>
            <label className={labelCls}>Médico Solicitante</label>
            <input
              type="text"
              value={form.nomeMedicoSolicitante || ''}
              onChange={(e) => setForm((f) => ({ ...f, nomeMedicoSolicitante: e.target.value }))}
              className={inputCls}
              placeholder="Nome do médico solicitante"
            />
          </div>

          <div>
            <label className={labelCls}>CRM</label>
            <input
              type="text"
              value={form.crmMedicoSolicitante || ''}
              onChange={(e) => setForm((f) => ({ ...f, crmMedicoSolicitante: e.target.value }))}
              className={inputCls}
              placeholder="CRM/UF"
            />
          </div>

          <div>
            <label className={labelCls}>CPF</label>
            <input
              type="text"
              value={form.cpfMedicoSolicitante || ''}
              onChange={(e) => setForm((f) => ({ ...f, cpfMedicoSolicitante: e.target.value }))}
              className={inputCls}
              placeholder="000.000.000-00"
            />
          </div>
        </div>
      </div>

      {/* 2. MEIO: OPÇÕES PARA SELEÇÃO */}
      <div className={cardCls}>
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <div className="flex items-center gap-2">
            <CheckSquare className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
              2. Opções de Solicitação (Marque as opções aplicáveis)
            </h3>
          </div>
          <span className="text-xs text-muted-foreground font-medium">
            Seleção múltipla permitida
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          {/* Coluna 1 */}
          <div className="space-y-2.5">
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, mudancaProcedimento: !f.mudancaProcedimento }))}
              className={cn(
                'w-full flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all',
                form.mudancaProcedimento
                  ? 'bg-primary/10 border-primary/40 text-primary font-bold shadow-sm'
                  : 'bg-background hover:bg-muted/50 border-input text-foreground font-medium'
              )}
            >
              {form.mudancaProcedimento ? (
                <CheckSquare className="h-5 w-5 text-primary shrink-0" />
              ) : (
                <Square className="h-5 w-5 text-muted-foreground shrink-0" />
              )}
              <span className="text-sm">Mudança de Procedimento</span>
            </button>

            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, diariaUti: !f.diariaUti }))}
              className={cn(
                'w-full flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all',
                form.diariaUti
                  ? 'bg-primary/10 border-primary/40 text-primary font-bold shadow-sm'
                  : 'bg-background hover:bg-muted/50 border-input text-foreground font-medium'
              )}
            >
              {form.diariaUti ? (
                <CheckSquare className="h-5 w-5 text-primary shrink-0" />
              ) : (
                <Square className="h-5 w-5 text-muted-foreground shrink-0" />
              )}
              <span className="text-sm">Diária de UTI</span>
            </button>

            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, diariaAcompanhante: !f.diariaAcompanhante }))}
              className={cn(
                'w-full flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all',
                form.diariaAcompanhante
                  ? 'bg-primary/10 border-primary/40 text-primary font-bold shadow-sm'
                  : 'bg-background hover:bg-muted/50 border-input text-foreground font-medium'
              )}
            >
              {form.diariaAcompanhante ? (
                <CheckSquare className="h-5 w-5 text-primary shrink-0" />
              ) : (
                <Square className="h-5 w-5 text-muted-foreground shrink-0" />
              )}
              <span className="text-sm">Diária de Acompanhante</span>
            </button>

            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, vacinaAntiRh: !f.vacinaAntiRh }))}
              className={cn(
                'w-full flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all',
                form.vacinaAntiRh
                  ? 'bg-primary/10 border-primary/40 text-primary font-bold shadow-sm'
                  : 'bg-background hover:bg-muted/50 border-input text-foreground font-medium'
              )}
            >
              {form.vacinaAntiRh ? (
                <CheckSquare className="h-5 w-5 text-primary shrink-0" />
              ) : (
                <Square className="h-5 w-5 text-muted-foreground shrink-0" />
              )}
              <span className="text-sm">Vacina Anti Rh</span>
            </button>
          </div>

          {/* Coluna 2 */}
          <div className="space-y-2.5">
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, usoProteseOtica: !f.usoProteseOtica }))}
              className={cn(
                'w-full flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all',
                form.usoProteseOtica
                  ? 'bg-primary/10 border-primary/40 text-primary font-bold shadow-sm'
                  : 'bg-background hover:bg-muted/50 border-input text-foreground font-medium'
              )}
            >
              {form.usoProteseOtica ? (
                <CheckSquare className="h-5 w-5 text-primary shrink-0" />
              ) : (
                <Square className="h-5 w-5 text-muted-foreground shrink-0" />
              )}
              <span className="text-sm">Uso de Prótese Ótica</span>
            </button>

            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, usoFatoresCoagulacao: !f.usoFatoresCoagulacao }))}
              className={cn(
                'w-full flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all',
                form.usoFatoresCoagulacao
                  ? 'bg-primary/10 border-primary/40 text-primary font-bold shadow-sm'
                  : 'bg-background hover:bg-muted/50 border-input text-foreground font-medium'
              )}
            >
              {form.usoFatoresCoagulacao ? (
                <CheckSquare className="h-5 w-5 text-primary shrink-0" />
              ) : (
                <Square className="h-5 w-5 text-muted-foreground shrink-0" />
              )}
              <span className="text-sm">Uso de Fatores de Coagulação</span>
            </button>

            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, usoOrdenadores: !f.usoOrdenadores }))}
              className={cn(
                'w-full flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all',
                form.usoOrdenadores
                  ? 'bg-primary/10 border-primary/40 text-primary font-bold shadow-sm'
                  : 'bg-background hover:bg-muted/50 border-input text-foreground font-medium'
              )}
            >
              {form.usoOrdenadores ? (
                <CheckSquare className="h-5 w-5 text-primary shrink-0" />
              ) : (
                <Square className="h-5 w-5 text-muted-foreground shrink-0" />
              )}
              <span className="text-sm">Uso de ordenadores</span>
            </button>

            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, nutricaoParenteral: !f.nutricaoParenteral }))}
              className={cn(
                'w-full flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all',
                form.nutricaoParenteral
                  ? 'bg-primary/10 border-primary/40 text-primary font-bold shadow-sm'
                  : 'bg-background hover:bg-muted/50 border-input text-foreground font-medium'
              )}
            >
              {form.nutricaoParenteral ? (
                <CheckSquare className="h-5 w-5 text-primary shrink-0" />
              ) : (
                <Square className="h-5 w-5 text-muted-foreground shrink-0" />
              )}
              <span className="text-sm">Nutrição Parenteral</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. ABAIXO: JUSTIFICATIVA ABERTA (MÉDICO DESCREVE LIVREMENTE) */}
      <div className={cardCls}>
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-border">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
              3. Justificativa Médica (Campo aberto para descrição)
            </h3>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            <span>Modelos rápidos disponíveis abaixo</span>
          </div>
        </div>

        {/* Modelos rápidos de 1-clique */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-xs text-muted-foreground font-semibold mr-1">Inserir modelo:</span>
          {MODELOS_JUSTIFICATIVA.map((mod) => (
            <button
              key={mod.titulo}
              type="button"
              onClick={() => {
                setForm((f) => ({
                  ...f,
                  justificativa: f.justificativa
                    ? `${f.justificativa}\n\n${mod.texto}`
                    : mod.texto,
                }))
                toast.success(`Modelo "${mod.titulo}" inserido!`)
              }}
              className="px-2.5 py-1 rounded-lg border border-border bg-background hover:bg-muted text-[11px] font-semibold text-foreground transition-colors"
            >
              + {mod.titulo}
            </button>
          ))}
          {form.justificativa && (
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, justificativa: '' }))}
              className="px-2.5 py-1 rounded-lg border border-red-500/20 text-red-500 hover:bg-red-500/10 text-[11px] font-semibold transition-colors ml-auto"
            >
              Limpar
            </button>
          )}
        </div>

        <div>
          <textarea
            rows={5}
            value={form.justificativa || ''}
            onChange={(e) => setForm((f) => ({ ...f, justificativa: e.target.value }))}
            placeholder="Descreva a justificativa clínica detalhada da solicitação..."
            className={cn(inputCls, 'leading-relaxed font-sans')}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div>
            <label className={labelCls}>Data da Solicitação</label>
            <input
              type="date"
              value={form.dataSolicitacao || ''}
              onChange={(e) => setForm((f) => ({ ...f, dataSolicitacao: e.target.value }))}
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>Nome do Acompanhante (se aplicável)</label>
            <input
              type="text"
              value={form.nomeAcompanhante || ''}
              onChange={(e) => setForm((f) => ({ ...f, nomeAcompanhante: e.target.value }))}
              placeholder="Nome do acompanhante responsável"
              className={inputCls}
            />
          </div>
        </div>
      </div>

      {/* 4. AUDITORIA */}
      <div className={cardCls}>
        <div className="flex items-center gap-2 pb-2 border-b border-border">
          <ShieldCheck className="h-4 w-4 text-emerald-500" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
            4. Parecer do Auditor Hospitalar
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className={labelCls}>Data da Auditoria</label>
            <input
              type="date"
              value={form.dataAuditoria || ''}
              onChange={(e) => setForm((f) => ({ ...f, dataAuditoria: e.target.value }))}
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>Auditor Responsável</label>
            <input
              type="text"
              value={form.nomeAuditor || ''}
              onChange={(e) => setForm((f) => ({ ...f, nomeAuditor: e.target.value }))}
              placeholder="Nome do Auditor"
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>CRM do Auditor</label>
            <input
              type="text"
              value={form.crmAuditor || ''}
              onChange={(e) => setForm((f) => ({ ...f, crmAuditor: e.target.value }))}
              placeholder="CRM do Auditor"
              className={inputCls}
            />
          </div>

          <div className="sm:col-span-3">
            <label className={labelCls}>Parecer / Observações da Auditoria</label>
            <textarea
              rows={2}
              value={form.parecerAuditor || ''}
              onChange={(e) => setForm((f) => ({ ...f, parecerAuditor: e.target.value }))}
              placeholder="Parecer formal do auditor hospitalar..."
              className={inputCls}
            />
          </div>
        </div>
      </div>

      {/* BARRA INFERIOR DE SALVAMENTO */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Link
          href={`/internamento/laudo-solicitacao/imprimir/${atendimentoId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-border bg-background hover:bg-muted text-sm font-semibold transition-colors"
        >
          <Printer className="h-4 w-4" />
          Imprimir Folha A4
        </Link>

        <button
          type="button"
          onClick={() => salvar('EMITIDO')}
          disabled={salvando}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-bold shadow-lg transition-all active:scale-95"
        >
          {salvando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Salvar e Emitir Laudo
        </button>
      </div>
    </div>
  )
}
