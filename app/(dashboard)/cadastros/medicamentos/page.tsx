import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { PackagePlus, Package, Tags } from 'lucide-react'

export const metadata: Metadata = { title: 'Cadastro de Medicamentos' }

const ROLES = ['ADMIN', 'FARMACEUTICO'] as const

export default async function PaginaCadastrosMedicamentos() {
  const sessao = await getServerSession(authOptions)
  if (!sessao) redirect('/login')
  if (!ROLES.includes(sessao.usuario.role as (typeof ROLES)[number])) redirect('/acesso-negado')

  const meds = await prisma.tbMedicamento.findMany({
    where: { ativo: true },
    orderBy: [{ nome: 'asc' }],
    take: 500,
  })

  return (
    <div className="max-w-6xl mx-auto space-y-4 w-full min-w-0 pb-8">
      <div className="min-w-0 flex items-start justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="min-w-0">
          <h1 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Package className="h-5 w-5 text-primary shrink-0" aria-hidden />
            <span>Cadastro Mestre de Medicamentos</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Gerenciamento do catálogo hospitalar, princípios ativos, estoque mínimo e configurações de controle.
          </p>
        </div>
        <Link
          href="/cadastros/medicamentos/novo"
          className="no-print inline-flex items-center gap-2 rounded-xl bg-primary text-white px-3.5 py-2.5 text-xs font-semibold hover:brightness-95 shadow-sm shrink-0"
        >
          <PackagePlus className="h-4 w-4" aria-hidden />
          Novo Medicamento
        </Link>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Catálogo de Medicamentos</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{meds.length} cadastrados</p>
        </div>

        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {meds.map((m) => (
            <li key={m.id} className="px-4 py-3 flex flex-col md:flex-row md:items-center gap-2 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                  {m.nome}{' '}
                  <span className="text-xs font-normal text-slate-500 dark:text-slate-400">({m.principioAtivo})</span>
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Saldo: <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{m.saldoAtual}</span> • Mínimo:{' '}
                  <span className="font-mono">{m.estoqueMinimo}</span>
                  {m.estoqueMinimo > 0 && m.saldoAtual <= m.estoqueMinimo ? (
                    <span className="ml-1.5 text-red-600 dark:text-red-400 font-semibold">(abaixo do mínimo)</span>
                  ) : null}
                  {m.mav ? <span className="ml-2 px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300 text-[10px] font-bold">MAV</span> : null}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <Link
                  href={`/cadastros/medicamentos/${m.id}`}
                  className="no-print rounded-xl px-3 py-1.5 text-xs font-semibold border border-slate-200 dark:border-slate-800 bg-background text-foreground hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Editar / Detalhes
                </Link>
                <Link
                  href={`/cadastros/sinonimos?medicamentoId=${m.id}`}
                  className="no-print rounded-xl px-3 py-1.5 text-xs font-semibold border border-slate-200 dark:border-slate-800 bg-background text-foreground hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1"
                >
                  <Tags className="h-3.5 w-3.5 text-primary" /> Sinônimos
                </Link>
              </div>
            </li>
          ))}
          {meds.length === 0 ? (
            <li className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
              Nenhum medicamento cadastrado no momento.
            </li>
          ) : null}
        </ul>
      </div>
    </div>
  )
}
