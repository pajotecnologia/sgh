import { notFound, redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { DocumentoReceitaAlta } from '@/components/atendimento/DocumentoReceitaAlta'
import { enriquecerPacienteComNomeCompleto } from '@/lib/nome-paciente-exibicao'

const ROLES = ['ADMIN', 'MEDICO', 'DIRETOR_CLINICO'] as const

export default async function PaginaImprimirReceitaAlta({
  params,
}: {
  params: Promise<{ prescricaoId: string }>
}) {
  const sessao = await getServerSession(authOptions)
  if (!sessao) redirect('/login')
  if (!ROLES.includes(sessao.usuario.role as (typeof ROLES)[number])) redirect('/acesso-negado')

  const { prescricaoId } = await params

  const [instituicao, prescricao] = await Promise.all([
    prisma.instituicao.findFirst(),
    prisma.prescricao.findFirst({
      where: { id: prescricaoId, tipo: 'RECEITA_ALTA' },
      include: {
        itens: { orderBy: { createdAt: 'asc' } },
        prontuario: {
          include: {
            atendimento: {
              include: {
                paciente: { select: { nomeExibicao: true, nomeCriptografado: true } },
                medico: { select: { nome: true, crm: true } },
                triagem: { select: { queixaPrincipal: true } },
              },
            },
          },
        },
      },
    }),
  ])

  if (!prescricao) notFound()

  const prescricaoComNome = {
    ...prescricao,
    prontuario: {
      ...prescricao.prontuario,
      atendimento: {
        ...prescricao.prontuario.atendimento,
        paciente: enriquecerPacienteComNomeCompleto(prescricao.prontuario.atendimento.paciente),
      },
    },
  }

  return <DocumentoReceitaAlta instituicao={instituicao} prescricao={prescricaoComNome as never} />
}
