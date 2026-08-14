import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { DocumentoEntradaNfFarmacia } from '@/components/farmacia/DocumentoEntradaNfFarmacia'

const ROLES = ['ADMIN', 'FARMACEUTICO'] as const

export default async function ImprimirEntradaNfFarmacia({ params }: { params: Promise<{ id: string }> }) {
  const sessao = await getServerSession(authOptions)
  if (!sessao) redirect('/login')
  if (!ROLES.includes(sessao.usuario.role as (typeof ROLES)[number])) redirect('/acesso-negado')

  const { id } = await params
  const instituicao = await prisma.instituicao.findFirst()
  const entrada = await prisma.tbFarmaciaEntradaNf.findUnique({
    where: { id },
    include: {
      itens: {
        include: {
          medicamento: {
            select: {
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

  return <DocumentoEntradaNfFarmacia instituicao={instituicao} entrada={entrada as never} />
}
