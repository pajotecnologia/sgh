import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { PackagePlus, Package } from 'lucide-react'

export const metadata: Metadata = { title: 'Medicamentos' }

const ROLES = ['ADMIN', 'FARMACEUTICO'] as const

export default async function PaginaMedicamentosFarmacia() {
  const sessao = await getServerSession(authOptions)
  if (!sessao) redirect('/login')
  if (!ROLES.includes(sessao.usuario.role as (typeof ROLES)[number])) redirect('/acesso-negado')

  const meds = await prisma.tbMedicamento.findMany({
    where: { ativo: true },
    orderBy: [{ nome: 'asc' }],
    take: 500,
  })

  return (
    <div className="max-w-5xl mx-auto space-y-4 w-full min-w-0">
      <div className="min-w-0 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="page-title flex flex-wrap items-center gap-2">
            <Package className="h-5 w-5 text-primary shrink-0" aria-hidden />
            <span>Medicamentos</span>
          </h1>
          <p className="page-subtitle">Cadastro e gerenciamento do catálogo (estoque simplificado).</p>
        </div>
        <Link
          href="/farmacia/medicamentos/novo"
          className="no-print inline-flex items-center gap-2 rounded-xl bg-primary text-white px-3 py-2 text-xs font-semibold hover:brightness-95"
        >
          <PackagePlus className="h-4 w-4" aria-hidden />
          Novo
        </Link>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-900">Catálogo</p>
          <p className="text-xs text-slate-500">{meds.length} itens</p>
        </div>

        <ul className="divide-y divide-slate-100">
          {meds.map((m) => (
            <li key={m.id} className="px-4 py-3 flex flex-col md:flex-row md:items-center gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900 truncate">
                  {m.nome}{' '}
                  <span className="text-xs font-normal text-slate-500">({m.principioAtivo})</span>
                </p>
                <p className="text-xs text-slate-500">
                  Saldo: <span className="font-mono">{m.saldoAtual}</span> • Mínimo:{' '}
                  <span className="font-mono">{m.estoqueMinimo}</span>
                  {m.estoqueMinimo > 0 && m.saldoAtual <= m.estoqueMinimo ? (
                    <span className="ml-1 text-red-700 font-semibold">(abaixo do mínimo)</span>
                  ) : null}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <Link
                  href={`/farmacia/medicamentos/${m.id}`}
                  className="no-print rounded-xl px-3 py-2 text-xs font-semibold border border-slate-200 bg-white hover:bg-slate-50"
                >
                  Abrir
                </Link>
                <Link
                  href={`/farmacia/sinonimos?medicamentoId=${m.id}`}
                  className="no-print rounded-xl px-3 py-2 text-xs font-semibold border border-slate-200 bg-white hover:bg-slate-50"
                >
                  Sinônimos
                </Link>
              </div>
            </li>
          ))}
          {meds.length === 0 ? (
            <li className="px-4 py-6 text-sm text-slate-500">Nenhum medicamento cadastrado.</li>
          ) : null}
        </ul>
      </div>
    </div>
  )
}
