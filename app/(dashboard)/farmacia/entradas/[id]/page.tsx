import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { FileDown } from 'lucide-react'

export const metadata: Metadata = { title: 'Entrada NF' }

const ROLES = ['ADMIN', 'FARMACEUTICO'] as const

export default async function PaginaEntradaFarmacia({ params }: { params: Promise<{ id: string }> }) {
  const sessao = await getServerSession(authOptions)
  if (!sessao) redirect('/login')
  if (!ROLES.includes(sessao.usuario.role as (typeof ROLES)[number])) redirect('/acesso-negado')

  const { id } = await params
  const entrada = await prisma.tbFarmaciaEntradaNf.findUnique({
    where: { id },
    include: {
      itens: { include: { medicamento: { select: { nome: true, principioAtivo: true } } } },
      criadoPor: { select: { nome: true } },
    },
  })
  if (!entrada) redirect('/farmacia/entradas')

  return (
    <div className="max-w-4xl mx-auto space-y-4 w-full min-w-0">
      <div className="min-w-0 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link href="/farmacia/entradas" className="no-print text-xs text-primary hover:underline">
            ← Voltar
          </Link>
          <h1 className="page-title flex flex-wrap items-center gap-2 mt-2">
            <FileDown className="h-5 w-5 text-primary shrink-0" aria-hidden />
            <span>
              Entrada NF {entrada.numeroNota}
              {entrada.serie ? ` • Série ${entrada.serie}` : ''}
            </span>
          </h1>
          <p className="page-subtitle">
            Recebida em {new Intl.DateTimeFormat('pt-BR').format(new Date(entrada.recebidaEm))}{' '}
            {entrada.criadoPor?.nome ? `• Por ${entrada.criadoPor.nome}` : ''}
          </p>
        </div>
        <Link
          href={`/farmacia/entradas/imprimir/${entrada.id}`}
          className="no-print inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold hover:bg-slate-50"
        >
          Imprimir
        </Link>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-2">
        <p className="text-xs text-slate-700">
          Fornecedor: {entrada.fornecedorNome ?? '—'} • CNPJ: {entrada.fornecedorCnpj ?? '—'}
        </p>
        <p className="text-xs text-slate-500">Observações: {entrada.observacoes ?? '—'}</p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-900">Itens</p>
          <p className="text-xs text-slate-500">
            {entrada.itens.length} itens • Qtde total {entrada.itens.reduce((acc, x) => acc + x.quantidade, 0)}
          </p>
        </div>
        <ul className="divide-y divide-slate-100">
          {entrada.itens.map((it) => (
            <li key={it.id} className="px-4 py-3 flex flex-col md:flex-row md:items-center gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900 truncate">
                  {it.medicamento.nome}{' '}
                  <span className="text-xs font-normal text-slate-500">({it.medicamento.principioAtivo})</span>
                </p>
                <p className="text-xs text-slate-500">
                  Qtde: <span className="font-mono">{it.quantidade}</span>
                  {it.lote ? ` • Lote: ${it.lote}` : ''}
                  {it.validade ? ` • Val: ${new Intl.DateTimeFormat('pt-BR').format(new Date(it.validade))}` : ''}
                </p>
              </div>
              <div className="text-xs text-slate-700">
                Custo unit.: <span className="font-mono">{it.custoUnitario?.toString() ?? '—'}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
