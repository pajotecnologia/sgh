'use client'

import { useMemo } from 'react'
import {
  Clock,
  Sun,
  Moon,
  Syringe,
  Activity,
  SunMoon,
  ClipboardList,
  Shield,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Pill,
} from 'lucide-react'
import type { AbaInternacaoId } from '@/lib/internacao-abas'

interface PainelPlantaoEnfermagemProps {
  atendimentoId: string
  abaAtual: AbaInternacaoId
  onSelecionarAba: (aba: AbaInternacaoId) => void
  prescricoes?: any[]
  dataInternacao?: string | Date | null
  leitoDescricao?: string | null
  setorUnidade?: string | null
  alergiasQtd?: number
}

export function PainelPlantaoEnfermagem({
  abaAtual,
  onSelecionarAba,
  prescricoes = [],
  dataInternacao,
  leitoDescricao,
  setorUnidade,
  alergiasQtd = 0,
}: PainelPlantaoEnfermagemProps) {
  const agora = new Date()
  const hora = agora.getHours()
  const ehDiurno = hora >= 7 && hora < 19
  const labelPlantao = ehDiurno ? 'Plantão Diurno (07h às 19h)' : 'Plantão Noturno (19h às 07h)'

  const diasInternado = useMemo(() => {
    if (!dataInternacao) return 1
    const dt = new Date(dataInternacao)
    if (Number.isNaN(dt.getTime())) return 1
    const diffMs = agora.getTime() - dt.getTime()
    const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    return Math.max(1, diffDias + 1)
  }, [dataInternacao])

  const totalItensPrescricao = useMemo(() => {
    return prescricoes.flatMap((p) => p.itens ?? [])
  }, [prescricoes])

  const pendentesCount = useMemo(() => {
    return totalItensPrescricao.filter((it: any) => it.status === 'PENDENTE').length
  }, [totalItensPrescricao])

  const aplicadosCount = useMemo(() => {
    return totalItensPrescricao.filter((it: any) => it.status === 'APLICADO').length
  }, [totalItensPrescricao])

  const botoesAcao = [
    {
      id: 'INSTRUCOES_ENFERMAGEM' as AbaInternacaoId,
      label: 'Medicamentos & Checagem',
      badge: pendentesCount > 0 ? `${pendentesCount} pendente(s)` : `${aplicadosCount} checado(s)`,
      badgeCor: pendentesCount > 0 ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300' : 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300',
      icon: Syringe,
    },
    {
      id: 'SINAIS_VITAIS' as AbaInternacaoId,
      label: 'Sinais Vitais 24h & Balanço',
      badge: 'Controle Horário',
      badgeCor: 'bg-blue-500/20 text-blue-700 dark:text-blue-300',
      icon: Activity,
    },
    {
      id: 'EVOLUCAO_DIURNA_NOTURNA' as AbaInternacaoId,
      label: 'Evolução Turno / Plantão',
      badge: ehDiurno ? '☀️ Dia' : '🌙 Noite',
      badgeCor: ehDiurno ? 'bg-amber-500/20 text-amber-800 dark:text-amber-300' : 'bg-violet-500/20 text-violet-800 dark:text-violet-300',
      icon: SunMoon,
    },
    {
      id: 'SAE' as AbaInternacaoId,
      label: 'SAE (NANDA / NIC)',
      badge: 'Assistência',
      badgeCor: 'bg-purple-500/20 text-purple-700 dark:text-purple-300',
      icon: ClipboardList,
    },
    {
      id: 'CCIH' as AbaInternacaoId,
      label: 'CCIH & Dispositivos',
      badge: 'Vigilância',
      badgeCor: 'bg-rose-500/20 text-rose-700 dark:text-rose-300',
      icon: Shield,
    },
  ]

  return (
    <div className="bg-card border border-border rounded-xl p-4 shadow-2xs space-y-3">
      {/* Barra de Status do Plantão & Indicadores do Paciente */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border/70">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
            {ehDiurno ? <Sun className="h-3.5 w-3.5 text-amber-500" /> : <Moon className="h-3.5 w-3.5 text-violet-400" />}
            {labelPlantao}
          </div>

          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
            <Clock className="h-3.5 w-3.5" />
            D+{diasInternado} Internação
          </span>

          {leitoDescricao ? (
            <span className="text-xs font-medium text-muted-foreground">
              Leito: <strong className="text-foreground">{leitoDescricao}</strong>
            </span>
          ) : null}

          {setorUnidade ? (
            <span className="text-xs font-medium text-muted-foreground">
              Setor: <strong className="text-foreground">{setorUnidade}</strong>
            </span>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          {alergiasQtd > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300">
              <AlertCircle className="h-3 w-3" />
              {alergiasQtd} Alergia(s)
            </span>
          )}
          {pendentesCount > 0 ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
              <Pill className="h-3 w-3" />
              {pendentesCount} Med. a Checar
            </span>
          ) : totalItensPrescricao.length > 0 ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              <CheckCircle2 className="h-3 w-3" />
              Medicações em Dia
            </span>
          ) : null}
        </div>
      </div>

      {/* Atalhos Rápidos da Linha de Cuidado da Enfermagem */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
          Linha de Cuidado & Ações Imediatas no Leito
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {botoesAcao.map((btn) => {
            const Icone = btn.icon
            const ativo = abaAtual === btn.id
            return (
              <button
                key={btn.id}
                type="button"
                onClick={() => onSelecionarAba(btn.id)}
                className={`flex flex-col items-start p-2.5 rounded-xl border text-left transition-all ${
                  ativo
                    ? 'border-primary bg-primary/10 text-primary shadow-2xs ring-1 ring-primary/30'
                    : 'border-border bg-background hover:bg-muted/60 text-foreground'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1.5">
                  <Icone className={`h-4 w-4 ${ativo ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${btn.badgeCor}`}>
                    {btn.badge}
                  </span>
                </div>
                <span className="text-xs font-semibold leading-tight line-clamp-1">{btn.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
