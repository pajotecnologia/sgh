import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { FileUp } from 'lucide-react'

export const metadata: Metadata = { title: 'Saída' }

const ROLES = ['ADMIN', 'FARMACEUTICO'] as const

const LABEL_TIPO: Record<string, string> = {
  BAIXA_MANUAL: 'Baixa manual',
  DISPENSACAO_PRESCRICAO: 'Dispensação (prescrição)',
}

export default async function PaginaSaidaFarmacia({ params }: { params: Promise<{ id: string }> }) {
  const sessao = await getServerSession(authOptions)
  if (!sessao) redirect('/login')
  if (!ROLES.includes(sessao.usuario.role as (typeof ROLES)[number])) redirect('/acesso-negado')

  const { id } = await params
  const saida = await prisma.tbFarmaciaSaida.findUnique({
    where: { id },
    include: {
      itens: { include: { medicamento: { select: { nome: true, principioAtivo: true } } } },
      criadoPor: { select: { nome: true } },
      atendimento: { select: { id: true, numeroAtendimento: true, setor: true, sala: true } },
    },
  })
  if (!saida) redirect('/farmacia/saidas')

  return (
    <div className="max-w-4xl mx-auto space-y-4 w-full min-w-0">
      <div className="min-w-0 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link href="/farmacia/saidas" className="no-print text-xs text-primary hover:underline">
            ← Voltar
          </Link>
          <h1 className="page-title flex flex-wrap items-center gap-2 mt-2">
            <FileUp className="h-5 w-5 text-primary shrink-0" aria-hidden />
            <span>{LABEL_TIPO[saida.tipo] ?? saida.tipo}</span>
          </h1>
          <p className="page-subtitle">
            Criada em{' '}
            {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(saida.createdAt))}{' '}
            {saida.criadoPor?.nome ? `• Por ${saida.criadoPor.nome}` : ''}
          </p>
        </div>
        <Link
          href={`/farmacia/saidas/imprimir/${saida.id}`}
          className="no-print inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold hover:bg-slate-50"
        >
          Imprimir
        </Link>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-2">
        <p className="text-xs text-slate-700">
          Atendimento:{' '}
          {saida.atendimento?.numeroAtendimento
            ? `${saida.atendimento.numeroAtendimento} (${saida.atendimento.setor ?? '—'} / ${saida.atendimento.sala ?? '—'})`
            : '—'}
        </p>
        <p className="text-xs text-slate-500">Observações: {saida.observacoes ?? '—'}</p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-900">Itens</p>
          <p className="text-xs text-slate-500">
            {saida.itens.length} itens • Qtde total {saida.itens.reduce((acc, x) => acc + x.quantidade, 0)}
          </p>
        </div>
        <ul className="divide-y divide-slate-100">
          {saida.itens.map((it) => (
            <li key={it.id} className="px-4 py-3 flex flex-col md:flex-row md:items-center gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900 truncate">
                  {it.medicamento.nome}{' '}
                  <span className="text-xs font-normal text-slate-500">({it.medicamento.principioAtivo})</span>
                </p>
                <p className="text-xs text-slate-500">
                  Qtde: <span className="font-mono">{it.quantidade}</span> • Motivo: {it.motivo ?? '—'}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
