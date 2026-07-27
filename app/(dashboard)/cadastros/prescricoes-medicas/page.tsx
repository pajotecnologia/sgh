import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ClipboardList, PlusCircle } from 'lucide-react'

export const metadata: Metadata = { title: 'Prescrições Médicas' }

export default async function PaginaPrescricoesMedicas({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; ativo?: string }>
}) {
  const sessao = await getServerSession(authOptions)
  if (!sessao) redirect('/login')
  if (sessao.usuario.role !== 'ADMIN') redirect('/acesso-negado')

  const params = await searchParams
  const q = (params.q ?? '').trim()
  const ativo = (params.ativo ?? 'true').trim() !== 'false'

  const modelos = await prisma.prescricaoMedicaPadrao.findMany({
    where: {
      ativo,
      ...(q
        ? {
            OR: [
              { nome: { contains: q, mode: 'insensitive' } },
              { descricao: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    include: { _count: { select: { itens: true } } },
    orderBy: { nome: 'asc' },
    take: 200,
  })

  return (
    <div className="max-w-5xl mx-auto space-y-4 w-full min-w-0">
      <div className="min-w-0 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="page-title flex flex-wrap items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary shrink-0" aria-hidden />
            <span>Prescrições Médicas</span>
          </h1>
          <p className="page-subtitle">
            Modelos reutilizáveis no prontuário médico. Cadastre medicamentos e pré-visualize antes de usar na internação.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <Link
            href="/cadastros/prescricoes-medicas/novo"
            className="no-print inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-3 py-2 text-xs font-semibold hover:bg-primary/90 transition-colors"
          >
            <PlusCircle className="h-4 w-4" aria-hidden />
            Nova
          </Link>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground">Modelos cadastrados</p>
          <p className="text-xs text-muted-foreground">{modelos.length} prescrições</p>
        </div>
        <ul className="divide-y divide-border">
          {modelos.map((m) => (
            <li key={m.id} className="px-4 py-3 flex flex-col md:flex-row md:items-center gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground truncate">{m.nome}</p>
                <p className="text-xs text-muted-foreground flex flex-wrap items-center gap-2">
                  {m.descricao?.trim() ? <span>{m.descricao}</span> : null}
                  <span>
                    {m._count.itens} {m._count.itens === 1 ? 'medicamento' : 'medicamentos'}
                  </span>
                  {!m.ativo ? (
                    <span className="text-amber-700 dark:text-amber-300 font-semibold">Inativo</span>
                  ) : null}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/cadastros/prescricoes-medicas/${m.id}/relatorio`}
                  className="no-print rounded-xl px-3 py-2 text-xs font-semibold border border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 transition-colors"
                >
                  Pré-visualizar
                </Link>
                <Link
                  href={`/cadastros/prescricoes-medicas/${m.id}`}
                  className="no-print rounded-xl px-3 py-2 text-xs font-semibold border border-border bg-background hover:bg-muted text-foreground transition-colors"
                >
                  Editar
                </Link>
              </div>
            </li>
          ))}
          {modelos.length === 0 ? (
            <li className="px-4 py-6 text-sm text-muted-foreground">
              Nenhuma prescrição padrão cadastrada.
            </li>
          ) : null}
        </ul>
      </div>
    </div>
  )
}
