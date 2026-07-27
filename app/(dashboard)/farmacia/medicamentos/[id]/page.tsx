import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Package } from 'lucide-react'

export const metadata: Metadata = { title: 'Medicamento' }

const ROLES = ['ADMIN', 'FARMACEUTICO'] as const

export default async function PaginaMedicamentoFarmacia({
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
    include: { sinonimos: { orderBy: [{ updatedAt: 'desc' }], take: 50 } },
  })
  if (!med) redirect('/farmacia/medicamentos')

  return (
    <div className="max-w-3xl mx-auto space-y-4 w-full min-w-0">
      <div className="min-w-0">
        <Link href="/farmacia/medicamentos" className="no-print text-xs text-primary hover:underline">
          ← Voltar
        </Link>
        <h1 className="page-title flex flex-wrap items-center gap-2 mt-2">
          <Package className="h-5 w-5 text-primary shrink-0" aria-hidden />
          <span>{med.nome}</span>
        </h1>
        <p className="page-subtitle">
          Princípio ativo: <span className="font-mono">{med.principioAtivo}</span>
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-2">
        <p className="text-xs text-slate-700">
          Saldo atual: <span className="font-mono font-bold">{med.saldoAtual}</span> • Reservado:{' '}
          <span className="font-mono font-bold">{med.saldoReservado}</span>
        </p>
        <p className="text-xs text-slate-500">
          Forma: {med.forma ?? '—'} • Concentração: {med.concentracao ?? '—'} • Unidade: {med.unidade ?? '—'}
        </p>
        <div className="flex flex-wrap gap-2 pt-2">
          <Link
            href={`/farmacia/sinonimos?medicamentoId=${med.id}`}
            className="no-print rounded-xl px-3 py-2 text-xs font-semibold border border-slate-200 bg-white hover:bg-slate-50"
          >
            Gerenciar sinônimos
          </Link>
          <Link
            href="/farmacia/entradas"
            className="no-print rounded-xl px-3 py-2 text-xs font-semibold border border-slate-200 bg-white hover:bg-slate-50"
          >
            Registrar entrada (NF)
          </Link>
          <Link
            href="/farmacia/saidas"
            className="no-print rounded-xl px-3 py-2 text-xs font-semibold border border-slate-200 bg-white hover:bg-slate-50"
          >
            Registrar saída
          </Link>
        </div>
      </div>
    </div>
  )
}
