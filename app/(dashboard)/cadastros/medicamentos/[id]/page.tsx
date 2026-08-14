import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Package } from 'lucide-react'
import { EdicaoMedicamentoELotes } from '@/components/farmacia/EdicaoMedicamentoELotes'

export const metadata: Metadata = { title: 'Consulta e Edição de Medicamento' }

const ROLES = ['ADMIN', 'FARMACEUTICO'] as const

export default async function PaginaCadastroMedicamentoDetalhe({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const sessao = await getServerSession(authOptions)
  if (!sessao) redirect('/login')
  if (!ROLES.includes(sessao.usuario.role as (typeof ROLES)[number])) redirect('/acesso-negado')

  const { id } = await params
  const med = await prisma.tbMedicamento.findUnique({
    where: { id },
    include: {
      lotes: { orderBy: [{ validade: 'asc' }] },
      sinonimos: { where: { ativo: true }, orderBy: [{ sinonimo: 'asc' }] },
      movimentacoes: {
        take: 30,
        orderBy: [{ createdAt: 'desc' }],
        include: { lote: { select: { lote: true, validade: true } } },
      },
    },
  })
  if (!med) redirect('/cadastros/medicamentos')

  const medData = {
    ...med,
    lotes: med.lotes.map((l) => ({
      ...l,
      validade: l.validade ? l.validade.toISOString() : null,
    })),
    movimentacoes: med.movimentacoes.map((m) => ({
      ...m,
      createdAt: m.createdAt.toISOString(),
      lote: m.lote ? { ...m.lote, validade: m.lote.validade ? m.lote.validade.toISOString() : null } : null,
    })),
  }

  return (
    <div className="max-w-5xl mx-auto space-y-4 w-full min-w-0 pb-8">
      <div className="min-w-0 flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="min-w-0">
          <Link href="/cadastros/medicamentos" className="no-print text-xs text-primary font-semibold hover:underline">
            ← Voltar para Cadastro de Medicamentos
          </Link>
          <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex flex-wrap items-center gap-2 mt-1">
            <Package className="h-5 w-5 text-primary shrink-0" aria-hidden />
            <span>{med.nome}</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Princípio ativo: <span className="font-mono font-semibold">{med.principioAtivo}</span>
            {med.codigoEan ? ` • EAN: ${med.codigoEan}` : ''}
            {med.codigoAnvisa ? ` • ANVISA: ${med.codigoAnvisa}` : ''}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href={`/cadastros/sinonimos?medicamentoId=${med.id}`}
            className="no-print rounded-xl px-3 py-2 text-xs font-semibold border border-slate-200 dark:border-slate-800 bg-background text-foreground hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Sinônimos ({med.sinonimos.length})
          </Link>
          <Link
            href="/farmacia/entradas/nova"
            className="no-print rounded-xl px-3 py-2 text-xs font-semibold border border-slate-200 dark:border-slate-800 bg-background text-foreground hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            + Dar Entrada (NF)
          </Link>
        </div>
      </div>

      <EdicaoMedicamentoELotes medicamento={medData as never} />
    </div>
  )
}
