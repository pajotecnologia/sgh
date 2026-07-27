'use client'

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { cn } from '@/lib/utils'
import type { ItemContagem, SerieTemporal } from '@/lib/dashboard-stats'

export type TipoGraficoDashboard =
  | 'bar'
  | 'barHorizontal'
  | 'line'
  | 'area'
  | 'pie'
  | 'donut'
  | 'composed'

type DashboardChartCardProps = {
  titulo: string
  subtitulo?: string
  tipo: TipoGraficoDashboard
  itens?: ItemContagem[]
  serie?: SerieTemporal[]
  vazio?: string
  className?: string
  altura?: number
}

const PALETA = [
  '#2563eb',
  '#16a34a',
  '#ca8a04',
  '#dc2626',
  '#9333ea',
  '#0891b2',
  '#ea580c',
  '#64748b',
  '#0d9488',
  '#c026d3',
]

function corItem(item: ItemContagem, idx: number): string {
  return item.cor ?? PALETA[idx % PALETA.length]
}

function prepararItens(itens: ItemContagem[]) {
  return itens.map((item, idx) => ({
    name: item.label.length > 28 ? `${item.label.slice(0, 26)}…` : item.label,
    nameCompleto: item.label,
    value: item.valor,
    fill: corItem(item, idx),
  }))
}

function TooltipCustom({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: { payload?: { nameCompleto?: string; value?: number; atendimentos?: number; triagens?: number }; name?: string; value?: number; color?: string }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  const p = payload[0]?.payload
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-md">
      <p className="font-medium text-foreground mb-1">{p?.nameCompleto ?? label}</p>
      {payload.map((entry) => (
        <p key={entry.name} className="text-muted-foreground tabular-nums">
          <span style={{ color: entry.color }}>{entry.name}: </span>
          {entry.value ?? p?.value ?? 0}
        </p>
      ))}
    </div>
  )
}

function EstadoVazio({ mensagem }: { mensagem: string }) {
  return <p className="text-sm text-muted-foreground py-10 text-center">{mensagem}</p>
}

export function DashboardChartCard({
  titulo,
  subtitulo,
  tipo,
  itens = [],
  serie = [],
  vazio = 'Sem dados no período selecionado.',
  className,
  altura = 280,
}: DashboardChartCardProps) {
  const dados = prepararItens(itens)
  const temItens = dados.some((d) => d.value > 0)
  const temSerie = serie.some((s) => s.atendimentos > 0 || s.triagens > 0)

  const eixoTick = { fill: 'hsl(var(--muted-foreground))', fontSize: 11 }
  const gridStroke = 'hsl(var(--border))'

  const renderGrafico = () => {
    if (tipo === 'composed') {
      if (!temSerie) return <EstadoVazio mensagem={vazio} />
      return (
        <ResponsiveContainer width="100%" height={altura}>
          <ComposedChart data={serie} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
            <XAxis dataKey="label" tick={eixoTick} tickLine={false} axisLine={false} />
            <YAxis tick={eixoTick} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip content={<TooltipCustom />} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="atendimentos" name="Atendimentos" fill="#2563eb" radius={[4, 4, 0, 0]} maxBarSize={32} />
            <Line
              type="monotone"
              dataKey="triagens"
              name="Triagens"
              stroke="#16a34a"
              strokeWidth={2}
              dot={{ r: 3, fill: '#16a34a' }}
              activeDot={{ r: 5 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      )
    }

    if (tipo === 'line' || tipo === 'area') {
      const serieLinha = serie.length
        ? serie.map((s) => ({
            name: s.label,
            nameCompleto: s.label,
            value: s.atendimentos,
          }))
        : dados

      if (!serieLinha.some((d) => d.value > 0)) return <EstadoVazio mensagem={vazio} />

      const Chart = tipo === 'area' ? AreaChart : LineChart
      return (
        <ResponsiveContainer width="100%" height={altura}>
          <Chart data={serieLinha} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
            <XAxis dataKey="name" tick={eixoTick} tickLine={false} axisLine={false} />
            <YAxis tick={eixoTick} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip content={<TooltipCustom />} />
            {tipo === 'area' ? (
              <Area
                type="monotone"
                dataKey="value"
                name="Quantidade"
                stroke="#2563eb"
                fill="#2563eb"
                fillOpacity={0.2}
                strokeWidth={2}
              />
            ) : (
              <Line
                type="monotone"
                dataKey="value"
                name="Quantidade"
                stroke="#2563eb"
                strokeWidth={2}
                dot={{ r: 3, fill: '#2563eb' }}
                activeDot={{ r: 5 }}
              />
            )}
          </Chart>
        </ResponsiveContainer>
      )
    }

    if (tipo === 'pie' || tipo === 'donut') {
      if (!temItens) return <EstadoVazio mensagem={vazio} />
      return (
        <ResponsiveContainer width="100%" height={altura}>
          <PieChart>
            <Pie
              data={dados}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={tipo === 'donut' ? 56 : 0}
              outerRadius={96}
              paddingAngle={tipo === 'donut' ? 2 : 1}
              label={({ name, percent }) =>
                (percent ?? 0) >= 0.08 ? `${name} (${Math.round((percent ?? 0) * 100)}%)` : ''
              }
              labelLine={false}
            >
              {dados.map((entry, idx) => (
                <Cell key={entry.nameCompleto} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip content={<TooltipCustom />} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
          </PieChart>
        </ResponsiveContainer>
      )
    }

    if (tipo === 'barHorizontal') {
      if (!temItens) return <EstadoVazio mensagem={vazio} />
      return (
        <ResponsiveContainer width="100%" height={Math.max(altura, dados.length * 36)}>
          <BarChart
            data={dados}
            layout="vertical"
            margin={{ top: 4, right: 16, left: 4, bottom: 4 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} horizontal={false} />
            <XAxis type="number" tick={eixoTick} tickLine={false} axisLine={false} allowDecimals={false} />
            <YAxis
              type="category"
              dataKey="name"
              width={120}
              tick={eixoTick}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<TooltipCustom />} />
            <Bar dataKey="value" name="Quantidade" radius={[0, 4, 4, 0]} maxBarSize={22}>
              {dados.map((entry) => (
                <Cell key={entry.nameCompleto} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )
    }

    if (!temItens) return <EstadoVazio mensagem={vazio} />

    return (
      <ResponsiveContainer width="100%" height={altura}>
        <BarChart data={dados} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
          <XAxis dataKey="name" tick={eixoTick} tickLine={false} axisLine={false} interval={0} angle={dados.length > 6 ? -25 : 0} textAnchor={dados.length > 6 ? 'end' : 'middle'} height={dados.length > 6 ? 56 : 30} />
          <YAxis tick={eixoTick} tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip content={<TooltipCustom />} />
          <Bar dataKey="value" name="Quantidade" radius={[4, 4, 0, 0]} maxBarSize={40}>
            {dados.map((entry) => (
              <Cell key={entry.nameCompleto} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    )
  }

  return (
    <section
      className={cn('stat-card flex flex-col', className)}
      aria-label={`Gráfico: ${titulo}`}
    >
      <div className="mb-3">
        <h3 className="font-semibold text-foreground">{titulo}</h3>
        {subtitulo ? <p className="text-xs text-muted-foreground mt-0.5">{subtitulo}</p> : null}
      </div>
      <div className="flex-1 min-h-0">{renderGrafico()}</div>
    </section>
  )
}
