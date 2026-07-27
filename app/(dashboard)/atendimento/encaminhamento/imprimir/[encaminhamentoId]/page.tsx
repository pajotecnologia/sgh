import { notFound, redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { DocumentoEncaminhamento } from '@/components/atendimento/DocumentoEncaminhamento'
import { enriquecerPacienteComNomeCompleto } from '@/lib/nome-paciente-exibicao'

const ROLES = ['ADMIN', 'MEDICO', 'DIRETOR_CLINICO'] as const

export default async function ImprimirEncaminhamentoPage({
  params,
}: {
  params: Promise<{ encaminhamentoId: string }>
}) {
  const sessao = await getServerSession(authOptions)
  if (!sessao) redirect('/login')
  if (!ROLES.includes(sessao.usuario.role as any)) redirect('/acesso-negado')

  const { encaminhamentoId } = await params

  const instituicao = await prisma.instituicao.findFirst()

  const enc = await prisma.encaminhamento.findUnique({
    where: { id: encaminhamentoId },
    include: {
      prontuario: {
        include: {
          atendimento: {
            include: {
              paciente: { select: { nomeExibicao: true, nomeCriptografado: true } },
              triagem: { select: { corClassificacao: true, queixaPrincipal: true } },
              medico: { select: { nome: true, crm: true } },
            },
          },
        },
      },
    },
  })

  if (!enc) notFound()

  const encaminhamentoComNome = {
    ...enc,
    prontuario: {
      ...enc.prontuario,
      atendimento: {
        ...enc.prontuario.atendimento,
        paciente: enriquecerPacienteComNomeCompleto(enc.prontuario.atendimento.paciente),
      },
    },
  }

  return <DocumentoEncaminhamento instituicao={instituicao} encaminhamento={encaminhamentoComNome as never} />
}
