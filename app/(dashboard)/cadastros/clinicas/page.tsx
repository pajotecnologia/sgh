import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Building2, PlusCircle } from 'lucide-react'

export const metadata: Metadata = { title: 'Clínicas' }

export default async function PaginaClinicas() {
  const sessao = await getServerSession(authOptions)
  if (!sessao) redirect('/login')
  if (sessao.usuario.role !== 'ADMIN') redirect('/acesso-negado')

  const clinicas = await prisma.clinica.findMany({
    orderBy: { nome: 'asc' },
    include: { _count: { select: { leitos: true } } },
    take: 500,
  })

  return (
    <div className="max-w-5xl mx-auto space-y-4 w-full min-w-0">
      <div className="min-w-0 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="page-title flex flex-wrap items-center gap-2">
            <Building2 className="h-5 w-5 text-primary shrink-0" aria-hidden />
            <span>Clínicas</span>
          </h1>
          <p className="page-subtitle">Cadastre as clínicas/especialidades para relacionar aos leitos.</p>
        </div>
        <Link
          href="/cadastros/clinicas/novo"
          className="no-print inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-3 py-2 text-xs font-semibold hover:bg-primary/90 transition-colors"
        >
          <PlusCircle className="h-4 w-4" aria-hidden />
          Nova
        </Link>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground">Lista</p>
          <p className="text-xs text-muted-foreground">{clinicas.length} clínicas</p>
        </div>
        <ul className="divide-y divide-border">
          {clinicas.map((c) => (
            <li key={c.id} className="px-4 py-3 flex flex-col md:flex-row md:items-center gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground truncate">
                  {c.nome}
                  {!c.ativo ? <span className="ml-2 text-[11px] font-normal text-muted-foreground">(inativa)</span> : null}
                </p>
                <p className="text-xs text-muted-foreground">
                  {c.descricao ? `${c.descricao} • ` : ''}
                  {c._count.leitos} leito{c._count.leitos === 1 ? '' : 's'}
                </p>
              </div>
              <Link
                href={`/cadastros/clinicas/${c.id}`}
                className="no-print rounded-xl px-3 py-2 text-xs font-semibold border border-border bg-background hover:bg-muted text-foreground transition-colors"
              >
                Editar
              </Link>
            </li>
          ))}
          {clinicas.length === 0 ? <li className="px-4 py-6 text-sm text-muted-foreground">Nenhuma clínica cadastrada.</li> : null}
        </ul>
      </div>
    </div>
  )
}
