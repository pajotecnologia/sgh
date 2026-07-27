import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { DocumentoSaidaFarmacia } from '@/components/farmacia/DocumentoSaidaFarmacia'

const ROLES = ['ADMIN', 'FARMACEUTICO'] as const

export default async function ImprimirSaidaFarmacia({ params }: { params: Promise<{ id: string }> }) {
  const sessao = await getServerSession(authOptions)
  if (!sessao) redirect('/login')
  if (!ROLES.includes(sessao.usuario.role as (typeof ROLES)[number])) redirect('/acesso-negado')

  const { id } = await params
  const instituicao = await prisma.instituicao.findFirst()
  const saida = await prisma.tbFarmaciaSaida.findUnique({
    where: { id },
    include: {
      itens: { include: { medicamento: { select: { nome: true, principioAtivo: true } } } },
      criadoPor: { select: { nome: true } },
      atendimento: { select: { id: true, numeroAtendimento: true, setor: true, sala: true } },
    },
  })
  if (!saida) redirect('/farmacia/saidas')

  return <DocumentoSaidaFarmacia instituicao={instituicao} saida={saida as never} />
}
