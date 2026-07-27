import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { BedDouble, PlusCircle } from 'lucide-react'
import { FiltroLeitosClient } from '@/components/cadastros/FiltroLeitosClient'

export const metadata: Metadata = { title: 'Leitos' }

function BadgeStatus({ status }: { status: string }) {
  const cls =
    status === 'DISPONIVEL'
      ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-300 dark:border-emerald-800/60'
      : status === 'OCUPADO'
        ? 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/20 dark:text-amber-300 dark:border-amber-800/60'
        : 'bg-red-50 text-red-800 border-red-200 dark:bg-red-950/20 dark:text-red-300 dark:border-red-800/60'
  const label =
    status === 'DISPONIVEL' ? 'Disponível' : status === 'OCUPADO' ? 'Ocupado' : 'Interditado'
  return <span className={`inline-flex items-center px-2 py-1 text-[11px] font-bold rounded-md border ${cls}`}>{label}</span>
}

export default async function PaginaLeitos({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; tipo?: string; ativo?: string }>
}) {
  const sessao = await getServerSession(authOptions)
  if (!sessao) redirect('/login')
  if (sessao.usuario.role !== 'ADMIN') redirect('/acesso-negado')

  const params = await searchParams
  const q = (params.q ?? '').trim()
  const status = (params.status ?? '').trim()
  const tipo = (params.tipo ?? '').trim()
  const ativo = (params.ativo ?? 'true').trim() !== 'false'

  const leitos = await prisma.leito.findMany({
    where: {
      ativo,
      ...(status === 'DISPONIVEL' || status === 'OCUPADO' || status === 'INTERDITADO' ? { status } : {}),
      ...(tipo === 'UTI' || tipo === 'ENFERMARIA' || tipo === 'ISOLAMENTO' || tipo === 'OBSERVACAO' ? { tipo } : {}),
      ...(q
        ? {
            OR: [
              { ala: { contains: q, mode: 'insensitive' } },
              { codigo: { contains: q, mode: 'insensitive' } },
              { quarto: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    orderBy: [{ ala: 'asc' }, { codigo: 'asc' }],
    take: 500,
    include: { clinicaRef: { select: { nome: true } } },
  })

  return (
    <div className="max-w-5xl mx-auto space-y-4 w-full min-w-0">
      <div className="min-w-0 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="page-title flex flex-wrap items-center gap-2">
            <BedDouble className="h-5 w-5 text-primary shrink-0" aria-hidden />
            <span>Leitos</span>
          </h1>
          <p className="page-subtitle">Cadastre os leitos para uso no Internamento.</p>
        </div>
        <Link
          href="/cadastros/leitos/novo"
          className="no-print inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-3 py-2 text-xs font-semibold hover:bg-primary/90 transition-colors"
        >
          <PlusCircle className="h-4 w-4" aria-hidden />
          Novo
        </Link>
      </div>

      <FiltroLeitosClient />

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground">Lista</p>
          <p className="text-xs text-muted-foreground">{leitos.length} leitos</p>
        </div>
        <ul className="divide-y divide-border">
          {leitos.map((l) => (
            <li key={l.id} className="px-4 py-3 flex flex-col md:flex-row md:items-center gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground truncate">
                  {l.clinicaRef?.nome ? <span className="text-primary">{l.clinicaRef.nome} • </span> : null}
                  {l.ala} • {l.codigo}
                  {l.quarto ? <span className="text-xs font-normal text-muted-foreground"> • Quarto {l.quarto}</span> : null}
                </p>
                <p className="text-xs text-muted-foreground flex flex-wrap items-center gap-2">
                  <span>Tipo: {l.tipo}</span>
                  <BadgeStatus status={l.status} />
                </p>
              </div>
              <Link
                href={`/cadastros/leitos/${l.id}`}
                className="no-print rounded-xl px-3 py-2 text-xs font-semibold border border-border bg-background hover:bg-muted text-foreground transition-colors"
              >
                Editar
              </Link>
            </li>
          ))}
          {leitos.length === 0 ? <li className="px-4 py-6 text-sm text-muted-foreground">Nenhum leito cadastrado.</li> : null}
        </ul>
      </div>
    </div>
  )
}
