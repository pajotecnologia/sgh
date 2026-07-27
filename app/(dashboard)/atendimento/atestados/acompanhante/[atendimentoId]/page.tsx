import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { EmissorAtestadoAcompanhante } from '@/components/atendimento/EmissorAtestadoAcompanhante'

const ROLES = ['ADMIN', 'MEDICO', 'DIRETOR_CLINICO'] as const

export default async function PaginaAtestadoAcompanhante({
  params,
}: {
  params: Promise<{ atendimentoId: string }>
}) {
  const sessao = await getServerSession(authOptions)
  if (!sessao) redirect('/login')
  if (!ROLES.includes(sessao.usuario.role as any)) redirect('/acesso-negado')

  const { atendimentoId } = await params

  const [instituicao, atendimento, prontuario] = await Promise.all([
    prisma.instituicao.findFirst(),
    prisma.atendimento.findFirst({
      where: { id: atendimentoId, deletedAt: null },
      select: {
        id: true,
        numeroAtendimento: true,
        status: true,
        paciente: { select: { nomeExibicao: true } },
        medico: { select: { nome: true, crm: true } },
      },
    }),
    prisma.prontuarioMedico.findUnique({
      where: { atendimentoId },
      select: { encerradoEm: true },
    }),
  ])

  if (!atendimento) redirect('/atendimento')
  if (!prontuario?.encerradoEm && atendimento.status !== 'CONCLUIDO') redirect('/atendimento')

  return (
    <EmissorAtestadoAcompanhante
      instituicao={instituicao}
      atendimento={{
        id: atendimento.id,
        numeroAtendimento: atendimento.numeroAtendimento,
        pacienteNome: atendimento.paciente.nomeExibicao,
        medicoNome: atendimento.medico?.nome ?? null,
        medicoCrm: atendimento.medico?.crm ?? null,
        encerradoEmIso: (prontuario?.encerradoEm ?? null)?.toISOString() ?? null,
      }}
    />
  )
}
