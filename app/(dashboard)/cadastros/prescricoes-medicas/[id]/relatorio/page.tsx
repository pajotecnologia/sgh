import type { Metadata } from 'next'
import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { redirect, notFound } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ClipboardList, Pencil } from 'lucide-react'
import { VisualizacaoPrescricaoModelo } from '@/components/prescricao/VisualizacaoPrescricaoModelo'
import { colunasPrescricaoFromModelo } from '@/lib/prescricao-modelo-colunas'
import { mapItensModeloParaVisualizacao } from '@/lib/relatorio-prescricao-dinamico'

export const metadata: Metadata = { title: 'Pré-visualização da prescrição' }

export default async function PaginaRelatorioPrescricaoModelo({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const sessao = await getServerSession(authOptions)
  if (!sessao) redirect('/login')
  if (sessao.usuario.role !== 'ADMIN') redirect('/acesso-negado')

  const { id } = await params
  const modelo = await prisma.prescricaoMedicaPadrao.findUnique({
    where: { id },
    include: { itens: { orderBy: { ordem: 'asc' } } },
  })
  if (!modelo) notFound()

  const itens = mapItensModeloParaVisualizacao(modelo.itens)
  const colunas = colunasPrescricaoFromModelo(modelo)

  return (
    <div className="max-w-5xl mx-auto space-y-5 w-full min-w-0">
      <div className="min-w-0 space-y-2">
        <nav className="no-print text-xs text-muted-foreground flex flex-wrap items-center gap-1.5">
          <Link href="/cadastros/prescricoes-medicas" className="text-primary hover:underline">
            Prescrições Médicas
          </Link>
          <span aria-hidden>/</span>
          <Link href={`/cadastros/prescricoes-medicas/${modelo.id}`} className="text-primary hover:underline">
            {modelo.nome}
          </Link>
          <span aria-hidden>/</span>
          <span>Pré-visualização</span>
        </nav>

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="page-title flex flex-wrap items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary shrink-0" aria-hidden />
              <span>{modelo.nome}</span>
            </h1>
            {modelo.descricao?.trim() ? (
              <p className="page-subtitle">{modelo.descricao}</p>
            ) : (
              <p className="page-subtitle">Pré-visualização dos medicamentos deste modelo.</p>
            )}
          </div>
          <Link
            href={`/cadastros/prescricoes-medicas/${modelo.id}`}
            className="no-print inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold hover:bg-muted text-foreground transition-colors shrink-0"
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden />
            Editar modelo
          </Link>
        </div>
      </div>

      <VisualizacaoPrescricaoModelo
        itens={itens}
        colunas={colunas}
        observacoesPadrao={modelo.observacoesPadrao}
      />
    </div>
  )
}
