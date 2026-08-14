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
      itens: {
        include: {
          medicamento: {
            select: {
              id: true,
              nome: true,
              principioAtivo: true,
              codigoEan: true,
              codigoAnvisa: true,
              saldoAtual: true,
              unidade: true,
            },
          },
        },
      },
      criadoPor: { select: { nome: true } },
    },
  })
  if (!entrada) redirect('/farmacia/entradas')

  const totalItens = entrada.itens.length
  const totalQtd = entrada.itens.reduce((acc, x) => acc + x.quantidade, 0)
  const custoTotal = entrada.itens.reduce((acc, x) => {
    const unit = x.custoUnitario ? Number(x.custoUnitario) : 0
    return acc + unit * x.quantidade
  }, 0)

  const BADGE_TIPO: Record<string, { label: string; bg: string }> = {
    ENTRADA_NF: { label: 'Nota Fiscal (NF-e)', bg: 'bg-blue-100 text-blue-800 border-blue-200' },
    ENTRADA_SEM_NOTA: { label: 'Entrada sem Nota (Avulsa)', bg: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
    EMPRESTIMO_ENTRADA: { label: 'Empréstimo Recebido', bg: 'bg-purple-100 text-purple-800 border-purple-200' },
    DEVOLUCAO_PACIENTE: { label: 'Devolução de Paciente', bg: 'bg-amber-100 text-amber-800 border-amber-200' },
    OUTRAS_ENTRADAS: { label: 'Outras Entradas', bg: 'bg-slate-100 text-slate-800 border-slate-200' },
  }

  const badgeConfig = BADGE_TIPO[entrada.tipo] ?? BADGE_TIPO.ENTRADA_NF

  return (
    <div className="max-w-5xl mx-auto space-y-4 w-full min-w-0 pb-8">
      <div className="min-w-0 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link href="/farmacia/entradas" className="no-print text-xs text-primary hover:underline">
            ← Voltar para Histórico de Entradas
          </Link>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <h1 className="page-title flex items-center gap-2">
              <FileDown className="h-5 w-5 text-primary shrink-0" aria-hidden />
              <span>
                Entrada {entrada.numeroNota !== 'SEM-NF' ? `NF ${entrada.numeroNota}` : 'de Estoque'}
                {entrada.serie ? ` • Série ${entrada.serie}` : ''}
              </span>
            </h1>
            <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full border ${badgeConfig.bg}`}>
              {badgeConfig.label}
            </span>
          </div>
          <p className="page-subtitle mt-1">
            Recebida em {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(entrada.recebidaEm))}{' '}
            {entrada.criadoPor?.nome ? `• Registrada por ${entrada.criadoPor.nome}` : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/farmacia/entradas/imprimir/${entrada.id}`}
            className="no-print inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-background text-foreground px-3 py-2 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Imprimir Comprovante
          </Link>
        </div>
      </div>

      {/* Resumo da Nota / Entrada */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Fornecedor / Origem</p>
          <p className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1">{entrada.fornecedorNome ?? '—'}</p>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">CNPJ: {entrada.fornecedorCnpj ?? 'Não informado'}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Resumo da Movimentação</p>
          <p className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1">
            {totalItens} item(ns) distintos • <span className="text-green-700 dark:text-green-400">+{totalQtd} un creditadas</span>
          </p>
          {custoTotal > 0 ? (
            <p className="text-xs font-mono font-semibold text-slate-700 dark:text-slate-300 mt-0.5">
              Custo Total: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(custoTotal)}
            </p>
          ) : null}
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Chave NF-e / Observações</p>
          {entrada.chaveNfe ? (
            <p className="text-[11px] font-mono text-slate-700 dark:text-slate-300 truncate mt-1" title={entrada.chaveNfe}>
              Chave: {entrada.chaveNfe}
            </p>
          ) : (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Chave NF-e: Não aplicável</p>
          )}
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 truncate">Obs: {entrada.observacoes ?? 'Nenhuma observação registrada.'}</p>
        </div>
      </div>

      {/* Tabela Completa dos Itens que Deram Entrada */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Itens Creditados no Estoque</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Relação completa dos medicamentos, lotes, validades e saldos atualizados.</p>
          </div>
          <span className="text-xs font-semibold text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950/60 px-2.5 py-1 rounded-full border border-green-200 dark:border-green-800">
            +{totalQtd} unidades em estoque
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Medicamento / Princípio Ativo</th>
                <th className="px-3 py-3">EAN / ANVISA</th>
                <th className="px-3 py-3 text-center">Qtde Entrada</th>
                <th className="px-3 py-3">Lote</th>
                <th className="px-3 py-3">Validade</th>
                <th className="px-3 py-3 text-right">Custo Unit.</th>
                <th className="px-3 py-3 text-right">Subtotal</th>
                <th className="px-4 py-3 text-right">Saldo Atual</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {entrada.itens.map((it) => {
                const unit = it.custoUnitario ? Number(it.custoUnitario) : 0
                const subtotal = unit * it.quantidade
                return (
                  <tr key={it.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900">{it.medicamento.nome}</div>
                      <div className="text-[11px] text-slate-500">{it.medicamento.principioAtivo}</div>
                    </td>
                    <td className="px-3 py-3 font-mono text-[11px] text-slate-600">
                      {it.medicamento.codigoEan ? <div>EAN: {it.medicamento.codigoEan}</div> : null}
                      {it.medicamento.codigoAnvisa ? <div>ANVISA: {it.medicamento.codigoAnvisa}</div> : null}
                      {!it.medicamento.codigoEan && !it.medicamento.codigoAnvisa ? '—' : null}
                    </td>
                    <td className="px-3 py-3 text-center font-mono font-bold text-green-700 bg-green-50/50">
                      +{it.quantidade} {it.medicamento.unidade ?? 'un'}
                    </td>
                    <td className="px-3 py-3 font-mono font-semibold text-slate-800">
                      {it.lote ?? 'SEM-LOTE'}
                    </td>
                    <td className="px-3 py-3 text-slate-700">
                      {it.validade ? new Intl.DateTimeFormat('pt-BR').format(new Date(it.validade)) : '—'}
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-slate-700">
                      {unit > 0 ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(unit) : '—'}
                    </td>
                    <td className="px-3 py-3 text-right font-mono font-semibold text-slate-900">
                      {subtotal > 0 ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(subtotal) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-600">
                      {it.medicamento.saldoAtual} un
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
