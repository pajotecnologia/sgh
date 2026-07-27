import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ClipboardList } from 'lucide-react'
import { FormularioPrescricaoMedicaPadrao } from '@/components/cadastros/FormularioPrescricaoMedicaPadrao'
import { itemDbParaPrescricaoMedicaPadraoForm } from '@/lib/prescricao-medica-padrao-map'

export const metadata: Metadata = { title: 'Editar prescrição padrão' }

export default async function PaginaEditarPrescricaoMedica({ params }: { params: Promise<{ id: string }> }) {
  const sessao = await getServerSession(authOptions)
  if (!sessao) redirect('/login')
  if (sessao.usuario.role !== 'ADMIN') redirect('/acesso-negado')

  const { id } = await params
  const modelo = await prisma.prescricaoMedicaPadrao.findUnique({
    where: { id },
    include: { itens: { orderBy: { ordem: 'asc' } } },
  })
  if (!modelo) redirect('/cadastros/prescricoes-medicas')

  const itens = modelo.itens.map((item) => itemDbParaPrescricaoMedicaPadraoForm(item))

  return (
    <div className="max-w-4xl mx-auto space-y-4 w-full min-w-0">
      <div className="min-w-0">
        <Link href="/cadastros/prescricoes-medicas" className="no-print text-xs text-primary hover:underline">
          ← Voltar
        </Link>
        <h1 className="page-title flex flex-wrap items-center gap-2 mt-2">
          <ClipboardList className="h-5 w-5 text-primary shrink-0" aria-hidden />
          <span>Editar: {modelo.nome}</span>
        </h1>
        <p className="page-subtitle">Cadastre linhas em duas colunas — texto fixo à esquerda e preenchimento à direita na prescrição.</p>
        <div className="flex flex-wrap gap-2 mt-2">
          <Link
            href={`/cadastros/prescricoes-medicas/${modelo.id}/relatorio`}
            className="no-print inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
          >
            Pré-visualizar medicamentos
          </Link>
        </div>
      </div>

      <FormularioPrescricaoMedicaPadrao
        modo="editar"
        prescricaoInicial={{
          id: modelo.id,
          nome: modelo.nome,
          descricao: modelo.descricao,
          observacoesPadrao: modelo.observacoesPadrao,
          nomeColunaEsquerda: modelo.nomeColunaEsquerda,
          nomeColunaDireita: modelo.nomeColunaDireita,
          ativo: modelo.ativo,
          itens,
        }}
      />
    </div>
  )
}
