'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { BedDouble, CheckCircle2, Loader2, Printer, Pill, X } from 'lucide-react'
import { filtrarPrescricoesReceitaAlta } from '@/lib/prescricao-tipo'

type ModalFinalizarAtendimentoProps = {
  aberto: boolean
  onFechar: () => void
  atendimentoId: string
  nomePaciente: string
  prescricoes: { id: string; tipo?: string; numeroPrescricao?: number }[]
  /** Paciente com solicitação de internação — oculta receita de alta */
  modoInternacao?: boolean
  encaminhamentoInternacaoId?: string | null
}

export const ModalFinalizarAtendimento = ({
  aberto,
  onFechar,
  atendimentoId,
  nomePaciente,
  prescricoes,
  modoInternacao = false,
  encaminhamentoInternacaoId = null,
}: ModalFinalizarAtendimentoProps) => {
  const router = useRouter()
  const [finalizando, setFinalizando] = useState(false)
  const receitas = filtrarPrescricoesReceitaAlta(prescricoes)
  const ultimaReceita = receitas[0]

  if (!aberto) return null

  const handleFinalizar = async () => {
    setFinalizando(true)
    try {
      const statusDestino = modoInternacao ? 'AGUARDANDO_INTERNACAO' : 'CONCLUIDO'
      const res = await fetch(`/api/atendimento/${atendimentoId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: statusDestino }),
      })
      const json = await res.json()
      if (!json.sucesso) {
        toast.error(json.erro ?? 'Erro ao finalizar atendimento.')
        return
      }
      toast.success(
        modoInternacao
          ? 'Paciente encaminhado para internação. Aguardando recepção em Admissões.'
          : 'Atendimento finalizado com sucesso!'
      )
      onFechar()
      router.push('/atendimento')
      router.refresh()
    } catch {
      toast.error('Erro de conexão ao finalizar atendimento.')
    } finally {
      setFinalizando(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-finalizar-titulo"
    >
      <div className="bg-card border border-border rounded-xl max-w-md w-full p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <h2 id="modal-finalizar-titulo" className="text-lg font-bold text-foreground">
            {modoInternacao ? 'Confirmar paciente para internamento' : 'Finalizar atendimento'}
          </h2>
          <button
            type="button"
            onClick={onFechar}
            className="p-1 rounded-md hover:bg-muted text-muted-foreground"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="text-sm text-muted-foreground">
          Paciente: <strong className="text-foreground">{nomePaciente}</strong>
        </p>

        {modoInternacao ? (
          <div className="rounded-lg border border-indigo-200 dark:border-indigo-800 bg-indigo-50/80 dark:bg-indigo-950/30 p-3 space-y-2 text-sm">
            <p className="font-semibold text-foreground flex items-center gap-2">
              <BedDouble className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              Encaminhamento para internação
            </p>
            <p className="text-xs text-muted-foreground">
              O atendimento no PS será encerrado. O paciente seguirá para a fila de{' '}
              <strong className="text-foreground">Admissões — Enfermagem</strong>, onde será recebido,
              alocado em leito e terá a ficha SUS preenchida. Não há receita de alta neste desfecho.
            </p>
            {encaminhamentoInternacaoId ? (
              <Link
                href={`/atendimento/encaminhamento/imprimir/${encaminhamentoInternacaoId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 text-xs font-semibold hover:bg-indigo-100/60 dark:hover:bg-indigo-900/40"
              >
                <Printer className="h-3.5 w-3.5" />
                Imprimir solicitação de internação
              </Link>
            ) : null}
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-2 text-sm">
            <p className="font-semibold text-foreground flex items-center gap-2">
              <Pill className="h-4 w-4 text-primary" />
              Receita de alta
            </p>
            {ultimaReceita ? (
              <p className="text-xs text-muted-foreground">
                Receita #{ultimaReceita.numeroPrescricao} já registrada. Imprima para entrega ao paciente.
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Nenhuma receita de alta registrada. Você pode emitir depois em Atendidos hoje.
              </p>
            )}
            <div className="flex flex-wrap gap-2 pt-1">
              {ultimaReceita ? (
                <Link
                  href={`/atendimento/receita/imprimir/${ultimaReceita.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary/40 text-primary text-xs font-semibold hover:bg-primary/5"
                >
                  <Printer className="h-3.5 w-3.5" />
                  Imprimir receita
                </Link>
              ) : null}
              <Link
                href={`/atendimento/${atendimentoId}?aba=RECEITA_ALTA`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-primary hover:underline"
                onClick={onFechar}
              >
                {ultimaReceita ? 'Nova receita' : 'Emitir receita de alta'}
              </Link>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2 justify-end pt-2">
          <button
            type="button"
            onClick={onFechar}
            className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted/50"
          >
            Voltar
          </button>
          <button
            type="button"
            onClick={handleFinalizar}
            disabled={finalizando}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-semibold disabled:opacity-60 ${
              modoInternacao
                ? 'bg-indigo-600 hover:bg-indigo-700'
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {finalizando ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : modoInternacao ? (
              <BedDouble className="h-4 w-4" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            {modoInternacao ? 'Confirmar paciente para internamento' : 'Confirmar alta do PS'}
          </button>
        </div>
      </div>
    </div>
  )
}
