import { Activity, AlertTriangle, ClipboardList, Pill, ShieldCheck, Stethoscope, Users } from 'lucide-react'
import type { Role } from '@prisma/client'

type DashboardPerfilResumoProps = {
  role: Role
  resumo: {
    totalAtendimentos: number
    triagens: number
    aguardandoTriagem: number
    emAtendimento: number
    emergencias: number
    pacientesHoje: number
  }
}

const CONFIG: Record<
  Role,
  {
    titulo: string
    descricao: string
    foco: string
    icone: typeof Activity
    indicadores: Array<{ label: string; chave: keyof DashboardPerfilResumoProps['resumo']; icone: typeof Activity }>
  }
> = {
  ADMIN: {
    titulo: 'Visão geral da operação',
    descricao: 'Acompanhe o funcionamento assistencial e os principais pontos que exigem atenção.',
    foco: 'Gestão e supervisão',
    icone: ShieldCheck,
    indicadores: [
      { label: 'Atendimentos no período', chave: 'totalAtendimentos', icone: Activity },
      { label: 'Em atendimento', chave: 'emAtendimento', icone: Stethoscope },
      { label: 'Emergências', chave: 'emergencias', icone: AlertTriangle },
    ],
  },
  DIRETOR_CLINICO: {
    titulo: 'Visão assistencial',
    descricao: 'Priorize o fluxo clínico, a demanda e os casos de maior gravidade.',
    foco: 'Gestão clínica',
    icone: Stethoscope,
    indicadores: [
      { label: 'Atendimentos no período', chave: 'totalAtendimentos', icone: Activity },
      { label: 'Triagens realizadas', chave: 'triagens', icone: ClipboardList },
      { label: 'Emergências', chave: 'emergencias', icone: AlertTriangle },
    ],
  },
  MEDICO: {
    titulo: 'Minha operação clínica',
    descricao: 'Tenha uma leitura rápida da demanda antes de iniciar os atendimentos.',
    foco: 'Atendimento médico',
    icone: Stethoscope,
    indicadores: [
      { label: 'Aguardando atendimento', chave: 'aguardandoTriagem', icone: Users },
      { label: 'Em atendimento', chave: 'emAtendimento', icone: Activity },
      { label: 'Emergências', chave: 'emergencias', icone: AlertTriangle },
    ],
  },
  ENFERMEIRO: {
    titulo: 'Fluxo de enfermagem',
    descricao: 'Monitore triagem, espera e prioridades assistenciais do turno.',
    foco: 'Triagem e fluxo',
    icone: ClipboardList,
    indicadores: [
      { label: 'Aguardando triagem', chave: 'aguardandoTriagem', icone: Users },
      { label: 'Triagens realizadas', chave: 'triagens', icone: ClipboardList },
      { label: 'Emergências', chave: 'emergencias', icone: AlertTriangle },
    ],
  },
  TECNICO_ENFERMAGEM: {
    titulo: 'Fluxo assistencial',
    descricao: 'Acompanhe rapidamente a movimentação dos pacientes e as prioridades do setor.',
    foco: 'Apoio assistencial',
    icone: Activity,
    indicadores: [
      { label: 'Aguardando triagem', chave: 'aguardandoTriagem', icone: Users },
      { label: 'Em atendimento', chave: 'emAtendimento', icone: Activity },
      { label: 'Entradas hoje', chave: 'pacientesHoje', icone: Users },
    ],
  },
  RECEPCIONISTA: {
    titulo: 'Fluxo da recepção',
    descricao: 'Acompanhe a entrada de pacientes e o volume que segue para triagem.',
    foco: 'Recepção e entrada',
    icone: Users,
    indicadores: [
      { label: 'Entradas hoje', chave: 'pacientesHoje', icone: Users },
      { label: 'Aguardando triagem', chave: 'aguardandoTriagem', icone: ClipboardList },
      { label: 'Atendimentos no período', chave: 'totalAtendimentos', icone: Activity },
    ],
  },
  FARMACEUTICO: {
    titulo: 'Operação da farmácia',
    descricao: 'Acompanhe a demanda assistencial relacionada às prescrições.',
    foco: 'Farmácia hospitalar',
    icone: Pill,
    indicadores: [
      { label: 'Atendimentos no período', chave: 'totalAtendimentos', icone: Activity },
      { label: 'Em atendimento', chave: 'emAtendimento', icone: Stethoscope },
      { label: 'Entradas hoje', chave: 'pacientesHoje', icone: Users },
    ],
  },
}

export function DashboardPerfilResumo({ role, resumo }: DashboardPerfilResumoProps) {
  const config = CONFIG[role]
  const Icone = config.icone

  return (
    <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex gap-3 min-w-0">
          <div className="rounded-xl bg-primary/10 p-2.5 shrink-0">
            <Icone className="h-5 w-5 text-primary" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">{config.foco}</p>
            <h3 className="text-base sm:text-lg font-semibold mt-0.5">{config.titulo}</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-2xl">{config.descricao}</p>
          </div>
        </div>
        <span className="inline-flex w-fit items-center rounded-full border border-border bg-muted/40 px-2.5 py-1 text-xs font-medium">
          Perfil: {role.replaceAll('_', ' ')}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
        {config.indicadores.map((indicador) => {
          const IndicadorIcone = indicador.icone
          return (
            <div key={indicador.label} className="rounded-lg border border-border/80 bg-muted/20 p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground">{indicador.label}</span>
                <IndicadorIcone className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              </div>
              <p className="text-xl font-bold tabular-nums mt-1">{resumo[indicador.chave]}</p>
            </div>
          )
        })}
      </div>
    </section>
  )
}
