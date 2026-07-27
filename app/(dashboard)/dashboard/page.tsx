// app/(dashboard)/dashboard/page.tsx — Dashboard analítico
import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import {
  Users,
  ClipboardList,
  Activity,
  AlertTriangle,
  Stethoscope,
  FlaskConical,
  TrendingUp,
  UserCheck,
} from 'lucide-react'
import { DashboardChartCard } from '@/components/dashboard/DashboardChartCard'
import { DashboardFiltroPeriodo } from '@/components/dashboard/DashboardFiltroPeriodo'
import { obterEstatisticasDashboard, resolverPeriodo } from '@/lib/dashboard-stats'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Dashboard' }

export default async function PaginaDashboard({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string }>
}) {
  const params = await searchParams
  const sessao = await getServerSession(authOptions)
  const periodo = resolverPeriodo(params.periodo)
  const stats = await obterEstatisticasDashboard(periodo)

  const cardsResumo = [
    {
      label: 'Atendimentos no período',
      valor: stats.totalAtendimentos,
      icon: TrendingUp,
      cor: 'text-indigo-600',
      bg: 'bg-indigo-50 dark:bg-indigo-950/40',
    },
    {
      label: 'Triagens realizadas',
      valor: stats.resumo.triagens,
      icon: ClipboardList,
      cor: 'text-amber-600',
      bg: 'bg-amber-50 dark:bg-amber-950/40',
    },
    {
      label: 'Aguardando triagem',
      valor: stats.resumo.aguardandoTriagem,
      icon: Users,
      cor: 'text-yellow-600',
      bg: 'bg-yellow-50 dark:bg-yellow-950/40',
    },
    {
      label: 'Em atendimento',
      valor: stats.resumo.emAtendimento,
      icon: Activity,
      cor: 'text-green-600',
      bg: 'bg-green-50 dark:bg-green-950/40',
    },
    {
      label: 'Emergências hoje',
      valor: stats.resumo.emergencias,
      icon: AlertTriangle,
      cor: 'text-red-600',
      bg: 'bg-red-50 dark:bg-red-950/40',
    },
    {
      label: 'Exames solicitados',
      valor: stats.resumo.examesSolicitados,
      icon: FlaskConical,
      cor: 'text-cyan-600',
      bg: 'bg-cyan-50 dark:bg-cyan-950/40',
    },
    {
      label: 'Altas no período',
      valor: stats.resumo.altas,
      icon: UserCheck,
      cor: 'text-emerald-600',
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    },
    {
      label: 'Entradas hoje',
      valor: stats.resumo.pacientesHoje,
      icon: Stethoscope,
      cor: 'text-blue-600',
      bg: 'bg-blue-50 dark:bg-blue-950/40',
    },
  ]

  const primeiroNome = sessao?.usuario.nome.split(' ')[0] ?? 'Usuário'

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h2 className="page-title">Olá, {primeiroNome}!</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Indicadores clínicos e operacionais — {stats.periodoLabel.toLowerCase()}.
          </p>
        </div>
        <DashboardFiltroPeriodo periodoAtual={periodo} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {cardsResumo.map((s) => (
          <div key={s.label} className="stat-card">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[11px] sm:text-xs text-muted-foreground font-medium leading-tight">
                  {s.label}
                </p>
                <p className="text-lg sm:text-xl font-bold mt-1 tabular-nums">{s.valor}</p>
              </div>
              <div className={cn('p-2 rounded-xl shrink-0', s.bg)}>
                <s.icon className={cn('h-4 w-4 sm:h-5 sm:w-5', s.cor)} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DashboardChartCard
          titulo="Evolução diária"
          subtitulo="Atendimentos (barras) e triagens (linha) ao longo do período"
          tipo="composed"
          serie={stats.evolucaoDiaria}
          className="lg:col-span-2"
          altura={300}
        />
        <DashboardChartCard
          titulo="Entradas por hora"
          subtitulo="Volume de atendimentos abertos por hora do dia"
          tipo="line"
          itens={stats.atendimentosPorHora}
          altura={260}
        />
        <DashboardChartCard
          titulo="Classificação Manchester"
          subtitulo="Gravidade na triagem"
          tipo="donut"
          itens={stats.manchester}
          altura={260}
        />
        <DashboardChartCard
          titulo="Faixa etária"
          subtitulo="Distribuição por idade dos pacientes atendidos"
          tipo="bar"
          itens={stats.faixaEtaria}
        />
        <DashboardChartCard
          titulo="Sexo biológico"
          tipo="pie"
          itens={stats.sexo}
        />
        <DashboardChartCard
          titulo="Origem / procedência"
          subtitulo="Como o paciente chegou ao serviço"
          tipo="barHorizontal"
          itens={stats.origem}
          altura={260}
        />
        <DashboardChartCard
          titulo="Tipo de problema (triagem)"
          subtitulo="Categoria da queixa principal"
          tipo="area"
          itens={stats.categoriaQueixa}
        />
        <DashboardChartCard
          titulo="Status dos atendimentos"
          tipo="barHorizontal"
          itens={stats.statusAtendimento}
          altura={260}
        />
        <DashboardChartCard
          titulo="Exames mais solicitados"
          subtitulo="Itens de requisição no prontuário"
          tipo="barHorizontal"
          itens={stats.exames}
          altura={300}
        />
        <DashboardChartCard
          titulo="Exames por categoria"
          tipo="donut"
          itens={stats.categoriaExame}
        />
        <DashboardChartCard
          titulo="Diagnósticos (CID-10)"
          subtitulo="Principais hipóteses registradas"
          tipo="barHorizontal"
          itens={stats.diagnosticoCid}
          altura={280}
        />
        <DashboardChartCard
          titulo="Convênio / pagamento"
          tipo="pie"
          itens={stats.convenio}
        />
        <DashboardChartCard
          titulo="Setor de atendimento"
          tipo="bar"
          itens={stats.setor}
        />
      </div>

      <section className="bg-card border border-border rounded-xl p-6">
        <h3 className="font-semibold mb-4">Ações rápidas</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {['ADMIN', 'RECEPCIONISTA'].includes(sessao?.usuario.role ?? '') && (
            <a
              href="/recepcao/novo"
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border hover:bg-muted/50 transition-colors text-center"
            >
              <Users className="h-6 w-6 text-primary" />
              <span className="text-xs font-medium">Novo paciente</span>
            </a>
          )}
          {['ADMIN', 'ENFERMEIRO'].includes(sessao?.usuario.role ?? '') && (
            <a
              href="/triagem"
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border hover:bg-muted/50 transition-colors text-center"
            >
              <ClipboardList className="h-6 w-6 text-yellow-600" />
              <span className="text-xs font-medium">Triagem</span>
            </a>
          )}
          {['ADMIN', 'MEDICO', 'DIRETOR_CLINICO'].includes(sessao?.usuario.role ?? '') && (
            <a
              href="/atendimento"
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border hover:bg-muted/50 transition-colors text-center"
            >
              <Activity className="h-6 w-6 text-green-600" />
              <span className="text-xs font-medium">Atendimento</span>
            </a>
          )}
          {['ADMIN', 'DIRETOR_CLINICO'].includes(sessao?.usuario.role ?? '') && (
            <a
              href="/relatorios"
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border hover:bg-muted/50 transition-colors text-center"
            >
              <FlaskConical className="h-6 w-6 text-indigo-600" />
              <span className="text-xs font-medium">Relatórios</span>
            </a>
          )}
          <a
            href="/painel"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border hover:bg-muted/50 transition-colors text-center"
          >
            <AlertTriangle className="h-6 w-6 text-blue-600" />
            <span className="text-xs font-medium">Painel de chamada</span>
          </a>
        </div>
      </section>
    </div>
  )
}
