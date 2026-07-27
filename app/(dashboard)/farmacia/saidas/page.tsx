import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { FileUp, PlusCircle } from 'lucide-react'

export const metadata: Metadata = { title: 'Saídas' }

const ROLES = ['ADMIN', 'FARMACEUTICO'] as const

const LABEL_TIPO: Record<string, string> = {
  BAIXA_MANUAL: 'Baixa manual',
  DISPENSACAO_PRESCRICAO: 'Dispensação (prescrição)',
}

export default async function PaginaSaidasFarmacia() {
  const sessao = await getServerSession(authOptions)
  if (!sessao) redirect('/login')
  if (!ROLES.includes(sessao.usuario.role as (typeof ROLES)[number])) redirect('/acesso-negado')

  const saidas = await prisma.tbFarmaciaSaida.findMany({
    include: { itens: true, criadoPor: { select: { nome: true } }, atendimento: { select: { numeroAtendimento: true } } },
    orderBy: [{ createdAt: 'desc' }],
    take: 200,
  })

  return (
    <div className="max-w-5xl mx-auto space-y-4 w-full min-w-0">
      <div className="min-w-0 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="page-title flex flex-wrap items-center gap-2">
            <FileUp className="h-5 w-5 text-primary shrink-0" aria-hidden />
            <span>Saídas</span>
          </h1>
          <p className="page-subtitle">Registro de saídas (baixa manual e dispensações aprovadas).</p>
        </div>
        <Link
          href="/farmacia/saidas/nova"
          className="no-print inline-flex items-center gap-2 rounded-xl bg-primary text-white px-3 py-2 text-xs font-semibold hover:brightness-95"
        >
          <PlusCircle className="h-4 w-4" aria-hidden />
          Nova baixa manual
        </Link>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-900">Registros</p>
          <p className="text-xs text-slate-500">{saidas.length} registros</p>
        </div>

        <ul className="divide-y divide-slate-100">
          {saidas.map((s) => (
            <li key={s.id} className="px-4 py-3 flex flex-col md:flex-row md:items-center gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900 truncate">{LABEL_TIPO[s.tipo] ?? s.tipo}</p>
                <p className="text-xs text-slate-500">
                  {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(
                    new Date(s.createdAt)
                  )}{' '}
                  • Itens: <span className="font-mono">{s.itens.length}</span> • Qtde total:{' '}
                  <span className="font-mono">{s.itens.reduce((acc, x) => acc + x.quantidade, 0)}</span>
                  {s.atendimento?.numeroAtendimento ? ` • Atendimento ${s.atendimento.numeroAtendimento}` : ''}
                  {s.criadoPor?.nome ? ` • Por ${s.criadoPor.nome.split(' ')[0]}` : ''}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <Link
                  href={`/farmacia/saidas/${s.id}`}
                  className="no-print rounded-xl px-3 py-2 text-xs font-semibold border border-slate-200 bg-white hover:bg-slate-50"
                >
                  Abrir
                </Link>
                <Link
                  href={`/farmacia/saidas/imprimir/${s.id}`}
                  className="no-print rounded-xl px-3 py-2 text-xs font-semibold border border-slate-200 bg-white hover:bg-slate-50"
                >
                  Imprimir
                </Link>
              </div>
            </li>
          ))}
          {saidas.length === 0 ? (
            <li className="px-4 py-6 text-sm text-slate-500">Nenhuma saída registrada.</li>
          ) : null}
        </ul>
      </div>
    </div>
  )
}
