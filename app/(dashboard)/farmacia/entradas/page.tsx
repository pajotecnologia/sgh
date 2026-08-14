import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { FileDown, PlusCircle } from 'lucide-react'

export const metadata: Metadata = { title: 'Entradas (NF)' }

const ROLES = ['ADMIN', 'FARMACEUTICO'] as const

export default async function PaginaEntradasFarmacia() {
  const sessao = await getServerSession(authOptions)
  if (!sessao) redirect('/login')
  if (!ROLES.includes(sessao.usuario.role as (typeof ROLES)[number])) redirect('/acesso-negado')

  const entradas = await prisma.tbFarmaciaEntradaNf.findMany({
    include: { itens: true, criadoPor: { select: { nome: true } } },
    orderBy: [{ recebidaEm: 'desc' }],
    take: 200,
  })

  return (
    <div className="max-w-5xl mx-auto space-y-4 w-full min-w-0">
      <div className="min-w-0 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="page-title flex flex-wrap items-center gap-2">
            <FileDown className="h-5 w-5 text-primary shrink-0" aria-hidden />
            <span>Entradas (NF)</span>
          </h1>
          <p className="page-subtitle">Registro de entrada de estoque por nota fiscal.</p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <Link
            href="/farmacia/entradas/importar-xml"
            className="no-print inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-background text-foreground px-3 py-2 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Importar XML
          </Link>
          <Link
            href="/farmacia/entradas/nova"
            className="no-print inline-flex items-center gap-2 rounded-xl bg-primary text-white px-3 py-2 text-xs font-semibold hover:brightness-95"
          >
            <PlusCircle className="h-4 w-4" aria-hidden />
            Nova entrada
          </Link>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Notas</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{entradas.length} registros</p>
        </div>

        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {entradas.map((e) => (
            <li key={e.id} className="px-4 py-3 flex flex-col md:flex-row md:items-center gap-2 hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                  NF {e.numeroNota}
                  {e.serie ? <span className="text-xs font-normal text-slate-500 dark:text-slate-400"> • Série {e.serie}</span> : null}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Recebida em {new Intl.DateTimeFormat('pt-BR').format(new Date(e.recebidaEm))} • Itens:{' '}
                  <span className="font-mono">{e.itens.length}</span> • Qtde total:{' '}
                  <span className="font-mono">{e.itens.reduce((acc, x) => acc + x.quantidade, 0)}</span>
                  {e.criadoPor?.nome ? ` • Por ${e.criadoPor.nome.split(' ')[0]}` : ''}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <Link
                  href={`/farmacia/entradas/${e.id}`}
                  className="no-print rounded-xl px-3 py-2 text-xs font-semibold border border-slate-200 dark:border-slate-800 bg-background text-foreground hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Abrir
                </Link>
                <Link
                  href={`/farmacia/entradas/imprimir/${e.id}`}
                  className="no-print rounded-xl px-3 py-2 text-xs font-semibold border border-slate-200 dark:border-slate-800 bg-background text-foreground hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Imprimir
                </Link>
              </div>
            </li>
          ))}
          {entradas.length === 0 ? (
            <li className="px-4 py-6 text-sm text-slate-500 dark:text-slate-400">Nenhuma entrada registrada.</li>
          ) : null}
        </ul>
      </div>
    </div>
  )
}
