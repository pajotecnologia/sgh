'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { format, isValid } from 'date-fns'
import {
  ClipboardList, Clock, Stethoscope, AlertTriangle,
  RefreshCw, ChevronRight, Monitor,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { ModalChamarPaciente } from '@/components/triagem/ModalChamarPaciente'
import { getPusherCliente, CANAIS_PUSHER, EVENTOS_PUSHER } from '@/lib/pusher'
import { escutarFilaAtualizada, fetchFilaTriagem } from '@/lib/fila-triagem-sync'
import { EnvoltorioListaPaginada } from '@/components/shared/EnvoltorioListaPaginada'

export interface PacienteAguardando {
  atendimentoId: string
  numeroAtendimento: string
  nomePaciente: string
  dataNascimento: string
  sexoBiologico: string
  convenio: string | null
  alergias: string[]
  entradaFila: string
  status?: string
}

interface Props {
  pacientesIniciais?: PacienteAguardando[]
  emTriagemIniciais?: PacienteAguardando[]
  podeChamar: boolean
  podeTriar: boolean
}

type PacienteFilaTriagem = PacienteAguardando & { _emTriagem?: boolean }

const URL_AGUARDANDO = '/api/triagem/fila?tipo=pre-triagem'
const URL_EM_TRIAGEM = '/api/triagem/fila?tipo=em-triagem'
const INTERVALO_POLLING_MS = 3_000

function minutosDesde(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
}

function formatarTempo(min: number): string {
  if (min < 60) return `${min}min`
  return `${Math.floor(min / 60)}h${min % 60 > 0 ? ` ${min % 60}min` : ''}`
}

function normalizarResposta(dados: unknown): PacienteAguardando[] {
  if (!Array.isArray(dados)) return []
  return dados.filter((item): item is PacienteAguardando => {
    if (!item || typeof item !== 'object') return false
    const p = item as Record<string, unknown>
    return typeof p.atendimentoId === 'string' && typeof p.entradaFila === 'string'
  })
}

function CardPaciente({
  p,
  podeChamar,
  podeTriar,
  onChamar,
  onTriar,
  destaqueEmTriagem,
}: {
  p: PacienteAguardando
  podeChamar: boolean
  podeTriar: boolean
  onChamar: (id: string) => void
  onTriar: (id: string) => void
  destaqueEmTriagem?: boolean
}) {
  const tempoEspera = minutosDesde(p.entradaFila)
  const temAlergias = (p.alergias ?? []).length > 0
  const nascimento = p.dataNascimento ? new Date(p.dataNascimento) : null

  return (
    <div
      className={cn(
        'p-2.5 hover:bg-muted/30 transition-colors',
        destaqueEmTriagem && 'bg-sky-50/50 dark:bg-sky-950/20'
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-[11px] text-foreground truncate">{p.nomePaciente}</p>
          <p className="text-[10px] font-mono text-muted-foreground">{p.numeroAtendimento}</p>
        </div>
        <div className="flex flex-col items-end gap-0.5 shrink-0">
          {destaqueEmTriagem && (
            <span className="text-[9px] font-semibold text-sky-700 dark:text-sky-400">Em triagem</span>
          )}
          <div className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
            <Clock className="h-2.5 w-2.5" />
            <span className={cn(tempoEspera > 30 && 'text-orange-500 font-semibold')}>
              {formatarTempo(tempoEspera)}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-[10px] text-muted-foreground mb-1.5">
        <span>{nascimento && isValid(nascimento) ? format(nascimento, 'dd/MM/yyyy') : '—'}</span>
        {p.sexoBiologico && (
          <span>{p.sexoBiologico.charAt(0) + p.sexoBiologico.slice(1).toLowerCase()}</span>
        )}
        <span>{p.convenio ?? 'Particular'}</span>
      </div>

      {temAlergias && (
        <div className="flex items-center gap-1 mb-1.5">
          <AlertTriangle className="h-2.5 w-2.5 text-red-500 shrink-0" />
          <div className="flex flex-wrap gap-0.5">
            {(p.alergias ?? []).map((a, i) => (
              <span
                key={i}
                className="px-1 py-0.5 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-[9px] font-medium rounded"
              >
                {a}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-1.5">
        {podeChamar && (
          <button
            type="button"
            onClick={() => onChamar(p.atendimentoId)}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-[10px] font-semibold bg-sky-600 text-white hover:bg-sky-700 transition-colors"
          >
            <Monitor className="h-3 w-3" />
            Chamar
          </button>
        )}
        {podeTriar && (
          <button
            type="button"
            onClick={() => onTriar(p.atendimentoId)}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-[10px] font-semibold bg-primary text-white hover:bg-primary/90 transition-colors"
          >
            <Stethoscope className="h-3 w-3" />
            {destaqueEmTriagem ? 'Continuar' : 'Triagem'}
            <ChevronRight className="h-2.5 w-2.5" />
          </button>
        )}
      </div>
    </div>
  )
}

export function FilaAguardandoTriagem({
  pacientesIniciais = [],
  emTriagemIniciais = [],
  podeChamar,
  podeTriar,
}: Props) {
  const router = useRouter()
  const [aguardando, setAguardando] = useState<PacienteAguardando[]>(pacientesIniciais)
  const [emTriagem, setEmTriagem] = useState<PacienteAguardando[]>(emTriagemIniciais)
  const [carregando, setCarregando] = useState(
    pacientesIniciais.length === 0 && emTriagemIniciais.length === 0
  )
  const [atendimentoParaChamar, setAtendimentoParaChamar] = useState<string | null>(null)
  const [, setTick] = useState(0)

  const totalFila = aguardando.length + emTriagem.length

  const carregarFila = useCallback(async (silencioso = false) => {
    if (!silencioso) setCarregando(true)

    try {
      const [resAguardando, resEmTriagem] = await Promise.all([
        fetchFilaTriagem(URL_AGUARDANDO),
        fetchFilaTriagem(URL_EM_TRIAGEM),
      ])

      if (!resAguardando.ok || !resEmTriagem.ok) {
        if (!silencioso) toast.error('Erro ao carregar fila de triagem.')
        return
      }

      const [jsonAguardando, jsonEmTriagem] = await Promise.all([
        resAguardando.json(),
        resEmTriagem.json(),
      ])

      if (jsonAguardando.sucesso) {
        setAguardando(normalizarResposta(jsonAguardando.dados))
      }
      if (jsonEmTriagem.sucesso) {
        setEmTriagem(normalizarResposta(jsonEmTriagem.dados))
      }
    } catch {
      if (!silencioso) toast.error('Erro ao carregar fila de triagem.')
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    carregarFila()
  }, [carregarFila])

  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 30_000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const polling = setInterval(() => carregarFila(true), INTERVALO_POLLING_MS)
    const pararEscuta = escutarFilaAtualizada(() => carregarFila(true))
    return () => {
      clearInterval(polling)
      pararEscuta()
    }
  }, [carregarFila])

  useEffect(() => {
    const pusher = getPusherCliente()
    if (!pusher) return

    const canal = pusher.subscribe(CANAIS_PUSHER.filaTriagem)
    const handler = () => carregarFila(true)
    canal.bind(EVENTOS_PUSHER.FILA_ATUALIZADA, handler)

    return () => {
      canal.unbind(EVENTOS_PUSHER.FILA_ATUALIZADA, handler)
      pusher.unsubscribe(CANAIS_PUSHER.filaTriagem)
    }
  }, [carregarFila])

  const handleTriar = (id: string) => router.push(`/triagem/${id}`)

  return (
    <>
      <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm text-xs">
        <div className="px-3 py-2 border-b border-border bg-amber-50 dark:bg-amber-950/20 flex items-center justify-between">
          <h3 className="font-semibold text-[11px] text-amber-800 dark:text-amber-400 flex items-center gap-1.5">
            <ClipboardList className="h-3.5 w-3.5" />
            Aguardando Triagem
            <span className="px-1 py-0.5 bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100 text-[9px] font-bold rounded-full">
              {aguardando.length}
            </span>
          </h3>
          <button
            type="button"
            onClick={() => carregarFila()}
            className="p-1 hover:bg-amber-100 dark:hover:bg-amber-900/30 rounded-md transition-colors"
            title="Atualizar"
            aria-label="Atualizar lista"
          >
            <RefreshCw className={cn('h-3 w-3 text-amber-600', carregando && 'animate-spin')} />
          </button>
        </div>

        <div className="divide-y divide-border max-h-[calc(100vh-280px)] overflow-y-auto">
          {carregando && totalFila === 0 ? (
            <div className="p-4 space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 bg-muted rounded-lg animate-pulse" />
              ))}
            </div>
          ) : aguardando.length === 0 && emTriagem.length === 0 ? (
            <div className="p-6 text-center">
              <ClipboardList className="h-8 w-8 mx-auto mb-2 text-muted-foreground/30" />
              <p className="text-[11px] text-muted-foreground">Nenhum paciente aguardando triagem.</p>
              <p className="text-[10px] text-muted-foreground mt-1">
                Na recepção, use <strong>+ Atendimento</strong> após o cadastro.
              </p>
            </div>
          ) : (
            <EnvoltorioListaPaginada<PacienteFilaTriagem>
              items={
                [
                  ...aguardando,
                  ...emTriagem.map((p): PacienteFilaTriagem => ({ ...p, _emTriagem: true })),
                ] satisfies PacienteFilaTriagem[]
              }
              chaveReset={totalFila}
              compacto
            >
              {(fatia) => (
            <div className="divide-y divide-border">
              {fatia.map((p) => (
                <CardPaciente
                  key={p.atendimentoId}
                  p={p}
                  podeChamar={podeChamar}
                  podeTriar={podeTriar}
                  onChamar={setAtendimentoParaChamar}
                  onTriar={handleTriar}
                  destaqueEmTriagem={Boolean(p._emTriagem)}
                />
              ))}
            </div>
              )}
            </EnvoltorioListaPaginada>
          )}
        </div>
      </div>

      {atendimentoParaChamar && (
        <ModalChamarPaciente
          atendimentoId={atendimentoParaChamar}
          onClose={() => setAtendimentoParaChamar(null)}
          onSuccess={() => {
            setAtendimentoParaChamar(null)
            carregarFila(true)
          }}
        />
      )}
    </>
  )
}
