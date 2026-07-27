'use client'

import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Share2, Loader2, Printer, BedDouble, CheckCircle2, AlertTriangle, X } from 'lucide-react'
import { textoCadastroMaiusculo } from '@/lib/cadastro-maiusculo'
import { cn } from '@/lib/utils'

type Desfecho = 'INTERNACAO' | 'EXTERNO' | 'FINALIZAR'

const DESFECHOS: { v: Desfecho; l: string; icon: typeof Share2; descricao: string }[] = [
  { v: 'INTERNACAO', l: 'Internar', icon: BedDouble, descricao: 'Solicitar internação hospitalar' },
  { v: 'EXTERNO', l: 'Externo', icon: Share2, descricao: 'Encaminhar a outro serviço e finalizar' },
  { v: 'FINALIZAR', l: 'Finalizar (alta)', icon: CheckCircle2, descricao: 'Concluir o atendimento' },
]

const ROTULO_TIPO: Record<string, string> = {
  INTERNO: 'Interno',
  EXTERNO: 'Externo',
  INTERNACAO: 'Internação',
}

const rotuloImpressao = (tipo: string) => {
  if (tipo === 'INTERNACAO') return 'Imprimir solicitação de internação'
  if (tipo === 'EXTERNO') return 'Imprimir relatório externo'
  return 'Imprimir encaminhamento'
}

type EncaminhamentoRegistrado = {
  id: string
  tipo: string
  especialidade: string
  prioridade?: string | null
  resumoClinco?: string | null
  justificativa?: string | null
  createdAt: string
}

export function FormularioEncaminhamento({
  atendimentoId,
  prontuarioId,
  encaminhamentosIniciais,
  onSalvo,
  onFinalizar,
  onInternacaoSolicitada,
  somenteLeitura = false,
  bloquearFinalizar = false,
}: {
  atendimentoId: string
  prontuarioId: string
  encaminhamentosIniciais: EncaminhamentoRegistrado[]
  onSalvo: () => void
  onFinalizar?: () => void
  /** Chamado após solicitar internação — redireciona para a fila de atendimento */
  onInternacaoSolicitada?: (encaminhamentoId: string) => void
  somenteLeitura?: boolean
  /** Bloqueia desfecho "Finalizar (alta)" enquanto aguarda medicação/evolução */
  bloquearFinalizar?: boolean
}) {
  const [desfecho, setDesfecho] = useState<Desfecho>('INTERNACAO')
  const [especialidade, setEspecialidade] = useState('')
  const [prioridade, setPrioridade] = useState('')
  const [resumo, setResumo] = useState('')
  const [justificativa, setJustificativa] = useState('')
  const [cidInternacao, setCidInternacao] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [ultimoEncaminhamentoId, setUltimoEncaminhamentoId] = useState<string | null>(null)
  const [ultimoTipoSalvo, setUltimoTipoSalvo] = useState<string | null>(null)
  const [confirmarExternoAberto, setConfirmarExternoAberto] = useState(false)

  const ehInternacao = desfecho === 'INTERNACAO'
  const ehExterno = desfecho === 'EXTERNO'

  const enviarEncaminhamento = async () => {
    setEnviando(true)
    try {
      const res = await fetch(`/api/atendimento/${atendimentoId}/encaminhamento`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prontuarioId,
          tipo: desfecho,
          especialidade: especialidade.trim(),
          prioridade: prioridade || null,
          resumoClinco: resumo.trim() || undefined,
          justificativa: justificativa.trim() || undefined,
          cidInternacao: ehInternacao ? cidInternacao.trim() || undefined : undefined,
        }),
      })
      const json = await res.json()
      if (!json.sucesso) {
        toast.error(json.erro ?? 'Erro ao registrar encaminhamento.')
        return
      }
      setUltimoEncaminhamentoId(json?.dados?.id ?? null)
      setUltimoTipoSalvo(desfecho)

      setEspecialidade('')
      setPrioridade('')
      setResumo('')
      setJustificativa('')
      setCidInternacao('')

      if (ehInternacao) {
        toast.success('Solicitação enviada à enfermagem. Aguardando recepção em Admissões.')
        const encId = json?.dados?.id as string | undefined
        if (encId && onInternacaoSolicitada) {
          onInternacaoSolicitada(encId)
        } else {
          onSalvo()
        }
        return
      }

      // EXTERNO: o endpoint já finaliza o atendimento. Não recarregamos os dados
      // para manter o botão de impressão do relatório visível antes de sair da tela.
      toast.success('Encaminhamento externo registrado e atendimento finalizado.')
    } catch {
      toast.error('Erro de conexão.')
    } finally {
      setEnviando(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (desfecho === 'FINALIZAR') {
      if (bloquearFinalizar) {
        toast.error('Aguarde a medicação e registre a evolução pós-uso antes de finalizar.')
        return
      }
      if (onFinalizar) {
        onFinalizar()
        return
      }
      toast.error('Não foi possível abrir a finalização do atendimento.')
      return
    }

    if (especialidade.trim().length < 2) {
      toast.error(ehInternacao ? 'Informe o tipo de clínica.' : 'Informe o serviço de destino.')
      return
    }
    if (justificativa.trim().length < 5) {
      toast.error('Justificativa obrigatória (mín. 5 caracteres).')
      return
    }

    // Encaminhamento externo finaliza o atendimento (irreversível) — confirmar antes.
    if (ehExterno) {
      setConfirmarExternoAberto(true)
      return
    }

    await enviarEncaminhamento()
  }

  return (
    <div className="space-y-8">
      {!somenteLeitura ? (
      <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-6 space-y-5">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Share2 className="h-5 w-5 text-primary" aria-hidden />
          Desfecho do atendimento
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {DESFECHOS.map((opcao) => {
            const Icone = opcao.icon
            const ativo = desfecho === opcao.v
            return (
              <button
                key={opcao.v}
                type="button"
                onClick={() => setDesfecho(opcao.v)}
                aria-pressed={ativo}
                className={cn(
                  'flex flex-col items-start gap-1 rounded-xl border p-4 text-left transition-colors',
                  ativo
                    ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                    : 'border-border hover:bg-muted/50'
                )}
              >
                <span className="flex items-center gap-2 font-semibold text-foreground">
                  <Icone className={cn('h-4 w-4', ativo ? 'text-primary' : 'text-muted-foreground')} aria-hidden />
                  {opcao.l}
                </span>
                <span className="text-xs text-muted-foreground">{opcao.descricao}</span>
              </button>
            )
          })}
        </div>

        {desfecho === 'FINALIZAR' ? (
          <div className="space-y-4">
            {bloquearFinalizar ? (
              <p className="text-xs text-amber-900 dark:text-amber-100 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
                Finalização indisponível: aguarde retorno da medicação ou preencha a evolução pós-uso na aba
                Evolução.
              </p>
            ) : (
              <p className="text-xs text-green-800 dark:text-green-200 bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 rounded-lg px-3 py-2">
                O atendimento será concluído (alta do PS). Você poderá emitir/imprimir a receita de alta na
                confirmação.
              </p>
            )}
            <button
              type="submit"
              disabled={bloquearFinalizar}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle2 className="h-4 w-4" aria-hidden />
              Finalizar atendimento
            </button>
          </div>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">
                  {ehInternacao ? 'Tipo de clínica' : 'Serviço / instituição de destino'}
                </label>
                <input
                  value={especialidade}
                  onChange={(e) => setEspecialidade(textoCadastroMaiusculo(e.target.value))}
                  placeholder={
                    ehInternacao
                      ? 'Ex.: Clínica Médica, Cirurgia, UTI'
                      : 'Ex.: UPA Centro, Hospital de referência'
                  }
                  className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Prioridade</label>
                <select
                  value={prioridade}
                  onChange={(e) => setPrioridade(e.target.value)}
                  className="mt-1 w-full border border-input rounded-lg px-3 py-2 text-sm bg-background"
                >
                  <option value="">—</option>
                  <option value="Alta">Alta</option>
                  <option value="Média">Média</option>
                  <option value="Baixa">Baixa</option>
                </select>
              </div>
            </div>

            {ehInternacao ? (
              <div>
                <label className="text-sm font-medium">CID da internação</label>
                <input
                  value={cidInternacao}
                  onChange={(e) => setCidInternacao(textoCadastroMaiusculo(e.target.value))}
                  placeholder="Ex.: J18.9"
                  className="mt-1 w-full sm:max-w-xs rounded-lg border bg-background px-3 py-2 text-sm font-mono"
                />
              </div>
            ) : null}

            <div>
              <label className="text-sm font-medium">Resumo clínico</label>
              <textarea
                value={resumo}
                onChange={(e) => setResumo(textoCadastroMaiusculo(e.target.value))}
                rows={3}
                className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Justificativa (obrigatória)</label>
              <textarea
                value={justificativa}
                onChange={(e) => setJustificativa(textoCadastroMaiusculo(e.target.value))}
                rows={2}
                className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm"
              />
            </div>

            {ehInternacao ? (
              <p className="text-xs text-indigo-800 dark:text-indigo-200 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-lg px-3 py-2">
                A solicitação irá para a fila de <strong>Admissões — Enfermagem</strong>, que receberá o paciente,
                definirá o <strong>leito / apartamento</strong> e preencherá a ficha SUS de internamento.
              </p>
            ) : null}
            {ehExterno ? (
              <p className="text-xs text-sky-800 dark:text-sky-200 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 rounded-lg px-3 py-2">
                Ao registrar, o atendimento será <strong>finalizado</strong>. Gere o relatório de encaminhamento
                externo para entrega ao paciente.
              </p>
            ) : null}

            <button
              type="submit"
              disabled={enviando}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold text-sm disabled:opacity-60"
            >
              {enviando ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
              {ehInternacao ? 'Solicitar internação' : 'Registrar e finalizar'}
            </button>
          </>
        )}

        {ultimoEncaminhamentoId ? (
          <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
            <Link
              href={`/atendimento/encaminhamento/imprimir/${ultimoEncaminhamentoId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 border border-primary/40 text-primary rounded-lg font-semibold text-sm hover:bg-primary/5"
            >
              <Printer className="h-4 w-4" aria-hidden />
              {rotuloImpressao(ultimoTipoSalvo ?? desfecho)}
            </Link>
            {ultimoTipoSalvo === 'INTERNACAO' ? (
              <Link
                href="/internamento/admissoes"
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold text-sm hover:bg-indigo-700 transition-colors"
              >
                Ver fila de admissões
              </Link>
            ) : null}
            {ultimoTipoSalvo === 'EXTERNO' ? (
              <Link
                href="/atendimento"
                className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-lg font-semibold text-sm hover:bg-muted/50"
              >
                Voltar à fila de atendimento
              </Link>
            ) : null}
          </div>
        ) : null}
      </form>
      ) : null}

      <div>
        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Encaminhamentos registrados
        </h4>
        {encaminhamentosIniciais.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum encaminhamento.</p>
        ) : (
          <ul className="space-y-3">
            {encaminhamentosIniciais.map((en) => (
              <li key={en.id} className="border border-border rounded-lg p-4 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mb-1">
                    <span className="font-semibold text-foreground">{ROTULO_TIPO[en.tipo] ?? en.tipo}</span>
                    <span>·</span>
                    <span>{en.especialidade}</span>
                    {en.prioridade ? (
                      <>
                        <span>·</span>
                        <span>Prioridade {en.prioridade}</span>
                      </>
                    ) : null}
                    <span>·</span>
                    <span>{new Date(en.createdAt).toLocaleString('pt-BR')}</span>
                  </div>
                  <Link
                    href={`/atendimento/encaminhamento/imprimir/${en.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="no-print inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                    aria-label={rotuloImpressao(en.tipo)}
                  >
                    <Printer className="h-3.5 w-3.5" aria-hidden />
                    {en.tipo === 'EXTERNO' ? 'Relatório' : en.tipo === 'INTERNACAO' ? 'Solicitação' : 'Imprimir'}
                  </Link>
                </div>
                {en.resumoClinco ? <p className="text-xs whitespace-pre-wrap mb-1">{en.resumoClinco}</p> : null}
                {en.justificativa ? (
                  <p className="text-xs text-muted-foreground whitespace-pre-wrap">Just.: {en.justificativa}</p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>

      {confirmarExternoAberto ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-[1px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-externo-titulo"
        >
          <div className="bg-card border border-border rounded-xl max-w-md w-full p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <h2 id="modal-externo-titulo" className="text-lg font-bold text-foreground flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" aria-hidden />
                Finalizar com encaminhamento externo
              </h2>
              <button
                type="button"
                onClick={() => setConfirmarExternoAberto(false)}
                className="p-1 rounded-md hover:bg-muted text-muted-foreground"
                aria-label="Fechar"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>

            <p className="text-sm text-muted-foreground">
              Ao confirmar, o encaminhamento externo para{' '}
              <strong className="text-foreground">{especialidade.trim() || 'o serviço informado'}</strong> será
              registrado e o <strong className="text-foreground">atendimento será finalizado</strong>. Esta ação não
              pode ser desfeita.
            </p>

            <div className="flex flex-wrap gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setConfirmarExternoAberto(false)}
                disabled={enviando}
                className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted/50 disabled:opacity-60"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={async () => {
                  setConfirmarExternoAberto(false)
                  await enviarEncaminhamento()
                }}
                disabled={enviando}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 disabled:opacity-60"
              >
                {enviando ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <CheckCircle2 className="h-4 w-4" aria-hidden />}
                Confirmar e finalizar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
