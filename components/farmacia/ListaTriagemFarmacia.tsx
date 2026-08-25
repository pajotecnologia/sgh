'use client'

import { useMemo, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { CheckCircle2, XCircle, Loader2, AlertTriangle, Bell } from 'lucide-react'
import { cn } from '@/lib/utils'
import { EnvoltorioListaPaginada } from '@/components/shared/EnvoltorioListaPaginada'
import { nomeCompletoParaExibicao } from '@/lib/nome-paciente-exibicao'
import { getPusherCliente, CANAIS_PUSHER, EVENTOS_PUSHER } from '@/lib/pusher'
import type { InteracaoCritica } from '@/components/farmacia/ModalInteracaoCritica'

type SaldoInfo = {
  saldoAtual: number | null
  saldoSuficiente: boolean
  mensagemSaldo: string | null
  alocacaoFefo: Array<{ lote: string; validade: string | null; quantidade: number }> | null
}

type Linha = {
  id: string
  status: 'AGUARDANDO_TRIAGEM' | 'APROVADO' | 'REJEITADO'
  motivoRejeicao: string | null
  validadoEm: string | null
  validadoPor: { nome: string } | null
  saldoInfo?: SaldoInfo
  item: {
    id: string
    medicamentoNome: string
    principioAtivo: string
    dose: string
    via: string
    frequencia: string
    quantidadeSolicitada: number
    justificativaMedica: string | null
    alertasInteracao: any
    medicamento?: { id: string; nome: string; saldoAtual: number; estoqueMinimo: number } | null
    prescricao: {
      atendimento: {
        id: string
        numeroAtendimento: string
        setor: string | null
        sala: string | null
        paciente: { nomeExibicao: string; nomeCriptografado: string | null; nomeCompleto?: string | null }
        triagem: { corClassificacao: string } | null
      }
    }
  }
}

function BadgeStatus({ status }: { status: Linha['status'] }) {
  const cls =
    status === 'APROVADO'
      ? 'bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-200'
      : status === 'REJEITADO'
        ? 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-200'
        : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-200'
  const label =
    status === 'APROVADO' ? 'Aprovado' : status === 'REJEITADO' ? 'Rejeitado' : 'Aguardando'
  return <span className={cn('text-[11px] font-bold px-2 py-1 rounded-md', cls)}>{label}</span>
}

export function ListaTriagemFarmacia({
  itens,
}: {
  itens: Linha[]
}) {
  const router = useRouter()
  const [itemModal, setItemModal] = useState<Linha | null>(null)
  const [motivo, setMotivo] = useState('')
  const [salvando, setSalvando] = useState(false)
  useEffect(() => {
    const pusher = getPusherCliente()
    if (!pusher) return

    const channel = pusher.subscribe(CANAIS_PUSHER.farmaciaTriagem)
    channel.bind(EVENTOS_PUSHER.NOVA_PRESCRICAO, (data: { criadoPor?: string; totalItens?: number }) => {
      toast.info('Nova prescrição recebida do PS!', {
        description: `Emitida por ${data.criadoPor ?? 'médico'} (${data.totalItens ?? 1} item(s)). Atualizando fila...`,
        icon: <Bell className="h-4 w-4 text-blue-600" />,
      })
      router.refresh()
    })

    return () => {
      channel.unbind_all()
      pusher.unsubscribe(CANAIS_PUSHER.farmaciaTriagem)
    }
  }, [router])

  const interacoesCriticas: InteracaoCritica[] = useMemo(() => {
    const raw = (itemModal?.item.alertasInteracao as any)?.criticas
    return Array.isArray(raw) ? (raw as InteracaoCritica[]) : []
  }, [itemModal])

  async function atualizar(status: 'APROVADO' | 'REJEITADO') {
    if (!itemModal) return
    if (status === 'REJEITADO' && motivo.trim().length < 5) {
      toast.error('Motivo de rejeição obrigatório (mín. 5 caracteres).')
      return
    }
    if (status === 'APROVADO' && itemModal.saldoInfo && !itemModal.saldoInfo.saldoSuficiente) {
      toast.error(itemModal.saldoInfo.mensagemSaldo ?? 'Saldo insuficiente para dispensar.')
      return
    }
    setSalvando(true)
    try {
      const res = await fetch('/api/farmacia/triagem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: itemModal.item.id,
          status,
          motivoRejeicao: motivo,
        }),
      })
      const json = await res.json()
      if (!json.sucesso) {
        toast.error(json.erro ?? 'Erro ao atualizar triagem.')
        return
      }
      toast.success(status === 'APROVADO' ? 'Item aprovado.' : 'Item rejeitado.')
      setItemModal(null)
      setMotivo('')
      router.refresh()
    } catch {
      toast.error('Erro de conexão.')
    } finally {
      setSalvando(false)
    }
  }

  if (itens.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground text-sm">
        Nenhum item encontrado para os filtros selecionados.
      </div>
    )
  }

  return (
    <>
      <EnvoltorioListaPaginada items={itens} chaveReset={itens.length}>
        {(fatia) => (
      <ul className="divide-y divide-border rounded-xl border border-border bg-card overflow-hidden">
        {fatia.map((l) => {
          const a = l.item.prescricao.atendimento
          const nomePaciente = nomeCompletoParaExibicao(
            a.paciente.nomeExibicao,
            a.paciente.nomeCriptografado ?? '',
            a.paciente.nomeCompleto
          )
          const temCritico = Boolean((l.item.alertasInteracao as any)?.criticas?.length)
          const semSaldo = l.status === 'AGUARDANDO_TRIAGEM' && l.saldoInfo && !l.saldoInfo.saldoSuficiente
          return (
            <li key={l.id} className="p-4 flex flex-col lg:flex-row lg:items-center gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-foreground truncate">{nomePaciente}</p>
                  <BadgeStatus status={l.status} />
                  {semSaldo ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 dark:text-red-200 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 px-2 py-1 rounded-md">
                      <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
                      Sem saldo
                    </span>
                  ) : null}
                  {temCritico ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 dark:text-red-200 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 px-2 py-1 rounded-md">
                      <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
                      Interação crítica
                    </span>
                  ) : null}
                </div>
                <p className="text-xs font-mono text-muted-foreground mt-0.5">{a.numeroAtendimento}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  <span className="font-medium text-foreground">{l.item.medicamentoNome}</span>
                  <span className="mx-1">•</span>
                  {l.item.dose} • {l.item.via} • {l.item.frequencia} • Qtde {l.item.quantidadeSolicitada}
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {a.setor ? `Ala/Setor: ${a.setor}` : 'Ala/Setor: —'} • {a.sala ? `Leito: ${a.sala}` : 'Leito: —'}
                  {l.item.medicamento ? ` • Saldo: ${l.item.medicamento.saldoAtual}` : ''}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setItemModal(l)}
                  className="px-3 py-2 rounded-lg border border-border text-xs font-semibold hover:bg-muted/50"
                >
                  Abrir triagem
                </button>
              </div>
            </li>
          )
        })}
      </ul>
        )}
      </EnvoltorioListaPaginada>

      {itemModal ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget && !salvando) setItemModal(null)
          }}
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-card w-full max-w-2xl rounded-2xl shadow-2xl border border-border m-4">
            <div className="p-6 border-b border-border flex items-start justify-between">
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Triagem Farmacêutica</p>
                <h3 className="text-base font-bold text-foreground mt-0.5">
                  {nomeCompletoParaExibicao(
                    itemModal.item.prescricao.atendimento.paciente.nomeExibicao,
                    itemModal.item.prescricao.atendimento.paciente.nomeCriptografado ?? '',
                    itemModal.item.prescricao.atendimento.paciente.nomeCompleto
                  )}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Atendimento: <span className="font-mono font-medium text-foreground">{itemModal.item.prescricao.atendimento.numeroAtendimento}</span>
                  {itemModal.item.prescricao.atendimento.setor ? ` • Ala/Setor: ${itemModal.item.prescricao.atendimento.setor}` : ''}
                  {itemModal.item.prescricao.atendimento.sala ? ` • Leito: ${itemModal.item.prescricao.atendimento.sala}` : ''}
                </p>
              </div>
              <BadgeStatus status={itemModal.status} />
            </div>
            <div className="p-6 space-y-4">
              {/* Alerta Crítico de Estoque Insuficiente */}
              {itemModal.saldoInfo && (!itemModal.saldoInfo.saldoSuficiente || (itemModal.saldoInfo.saldoAtual ?? 0) < itemModal.item.quantidadeSolicitada) ? (
                <div className="rounded-xl border-2 border-red-500 bg-red-50 dark:bg-red-950/40 p-4 space-y-3 shadow-sm">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400 shrink-0 mt-0.5" aria-hidden />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-red-800 dark:text-red-200 uppercase tracking-wide">
                        🚨 ESTOQUE INSUFICIENTE PARA DISPENSAÇÃO
                      </h4>
                      <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                        O medicamento <strong>{itemModal.item.medicamentoNome}</strong> não possui saldo disponível suficiente no estoque da farmácia.
                      </p>
                      <div className="mt-2.5 grid grid-cols-3 gap-2 text-xs font-mono text-center">
                        <div className="bg-white/80 dark:bg-slate-900/80 p-2 rounded-lg border border-red-200 dark:border-red-900">
                          <span className="text-[10px] text-slate-500 block font-sans">SOLICITADO</span>
                          <strong className="text-sm text-slate-900 dark:text-slate-100">{itemModal.item.quantidadeSolicitada} un.</strong>
                        </div>
                        <div className="bg-white/80 dark:bg-slate-900/80 p-2 rounded-lg border border-red-200 dark:border-red-900">
                          <span className="text-[10px] text-slate-500 block font-sans">EM ESTOQUE</span>
                          <strong className="text-sm text-red-600 dark:text-red-400">{itemModal.saldoInfo.saldoAtual ?? 0} un.</strong>
                        </div>
                        <div className="bg-white/80 dark:bg-slate-900/80 p-2 rounded-lg border border-red-200 dark:border-red-900">
                          <span className="text-[10px] text-slate-500 block font-sans">FALTANTE</span>
                          <strong className="text-sm text-red-600 dark:text-red-400">
                            -{Math.max(0, itemModal.item.quantidadeSolicitada - (itemModal.saldoInfo.saldoAtual ?? 0))} un.
                          </strong>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const qtdReq = itemModal.item.quantidadeSolicitada
                          const qtdDisp = itemModal.saldoInfo?.saldoAtual ?? 0
                          setMotivo(`REJEIÇÃO POR FALTA DE ESTOQUE: Solicitado ${qtdReq} un., saldo disponível em estoque apenas ${qtdDisp} un.`)
                        }}
                        className="mt-3 text-xs font-bold text-red-800 dark:text-red-200 bg-red-200/80 dark:bg-red-900/60 hover:bg-red-300 dark:hover:bg-red-800 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                      >
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Preencher motivo de rejeição por Falta de Estoque
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}

              {interacoesCriticas.length > 0 ? (
                <div className="rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50/60 dark:bg-red-950/20 p-4">
                  <p className="text-xs font-bold text-red-700 dark:text-red-200 uppercase tracking-wide">
                    Interação crítica (alerta)
                  </p>
                  <ul className="mt-2 space-y-2">
                    {interacoesCriticas.map((i, idx) => (
                      <li key={idx} className="text-xs text-red-800 dark:text-red-200">
                        <strong>{i.principioAtivoNovo} × {i.principioAtivoExistente}:</strong> {i.efeitoClinico}
                      </li>
                    ))}
                  </ul>
                  {itemModal.item.justificativaMedica ? (
                    <p className="text-xs text-muted-foreground mt-2">
                      <strong>Justificativa médica:</strong> {itemModal.item.justificativaMedica}
                    </p>
                  ) : null}
                </div>
              ) : null}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-muted/40 border border-border rounded-lg p-3">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Medicamento</p>
                  <p className="text-sm font-semibold text-foreground mt-1">{itemModal.item.medicamentoNome}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {itemModal.item.dose} • {itemModal.item.via} • {itemModal.item.frequencia}
                  </p>
                </div>
                <div className="bg-muted/40 border border-border rounded-lg p-3">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Princípio ativo</p>
                  <p className="text-sm font-mono text-foreground mt-1">{itemModal.item.principioAtivo}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Qtde solicitada: {itemModal.item.quantidadeSolicitada}
                  </p>
                  {itemModal.saldoInfo ? (
                    <p className={`text-[11px] mt-1 font-semibold ${itemModal.saldoInfo.saldoSuficiente ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                      Saldo: {itemModal.saldoInfo.saldoAtual ?? '—'}
                      {!itemModal.saldoInfo.saldoSuficiente && itemModal.saldoInfo.mensagemSaldo
                        ? ` — ${itemModal.saldoInfo.mensagemSaldo}`
                        : ''}
                    </p>
                  ) : null}
                </div>
              </div>

              {itemModal.saldoInfo?.alocacaoFefo && itemModal.saldoInfo.alocacaoFefo.length > 0 ? (
                <div className="rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/60 dark:bg-blue-950/30 p-3">
                  <p className="text-xs font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wide">
                    Alocação Automática FEFO (Lote com vencimento mais próximo)
                  </p>
                  <ul className="mt-2 space-y-1">
                    {itemModal.saldoInfo.alocacaoFefo.map((a, idx) => {
                      const dtValidade = a.validade ? new Date(a.validade) : null
                      const estaVencido = dtValidade ? dtValidade < new Date() : false
                      return (
                        <li key={idx} className={`text-xs ${estaVencido ? 'text-red-700 font-bold' : 'text-blue-900 dark:text-blue-200'}`}>
                          Lote <span className="font-mono">{a.lote}</span>: {a.quantidade} un.
                          {a.validade ? ` (val. ${a.validade.slice(0, 10)})` : ''}
                          {estaVencido ? <span className="ml-1 text-red-600 dark:text-red-400 font-bold">⛔ LOTE VENCIDO!</span> : null}
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ) : null}

              <div>
                <label className="text-sm font-medium text-foreground">Motivo da rejeição (se rejeitar)</label>
                <textarea
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  rows={3}
                  className="mt-1 w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                />
              </div>
            </div>
            <div className="p-6 pt-0 flex flex-wrap gap-2 justify-end">
              <button
                type="button"
                onClick={() => setItemModal(null)}
                disabled={salvando}
                className="px-4 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-muted disabled:opacity-50"
              >
                Fechar
              </button>
              <button
                type="button"
                onClick={() => atualizar('REJEITADO')}
                disabled={salvando}
                className="px-4 py-2.5 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50 inline-flex items-center gap-2"
              >
                {salvando ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <XCircle className="h-4 w-4" aria-hidden />}
                Rejeitar
              </button>
              <button
                type="button"
                onClick={() => atualizar('APROVADO')}
                disabled={salvando || (itemModal.saldoInfo != null && !itemModal.saldoInfo.saldoSuficiente)}
                className="px-4 py-2.5 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 disabled:opacity-50 inline-flex items-center gap-2"
                title={itemModal.saldoInfo && !itemModal.saldoInfo.saldoSuficiente ? 'Saldo insuficiente' : undefined}
              >
                {salvando ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <CheckCircle2 className="h-4 w-4" aria-hidden />}
                Aprovar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
