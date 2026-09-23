import { prisma } from '@/lib/prisma'

export type IndicadoresGovernanca = {
  acessosPacienteHoje: number
  auditoriasHoje: number
  falhasLoginHoje: number
  sessoesAtivas: number
  eventosMfaHoje: number
  acessosSensíveisRecentes: Array<{
    id: string
    acao: string
    modulo: string | null
    acessadoEm: Date
    usuarioNome: string
    pacienteId: string
  }>
}

export async function obterIndicadoresGovernanca(): Promise<IndicadoresGovernanca> {
  const inicioHoje = new Date()
  inicioHoje.setHours(0, 0, 0, 0)
  const agora = new Date()

  const [acessosPacienteHoje, auditoriasHoje, falhasLoginHoje, sessoesAtivas, eventosMfaHoje, acessosSensíveisRecentes] =
    await Promise.all([
      prisma.logAcessoPaciente.count({ where: { acessadoEm: { gte: inicioHoje } } }),
      prisma.logAuditoria.count({ where: { registradoEm: { gte: inicioHoje } } }),
      prisma.tentativaLogin.count({ where: { sucesso: false, criadoEm: { gte: inicioHoje } } }),
      prisma.sessaoUsuario.count({ where: { revogadoEm: null, expiraEm: { gt: agora } } }),
      prisma.eventoMfa.count({ where: { criadoEm: { gte: inicioHoje } } }),
      prisma.logAcessoPaciente.findMany({
        orderBy: { acessadoEm: 'desc' },
        take: 10,
        select: {
          id: true,
          acao: true,
          modulo: true,
          acessadoEm: true,
          pacienteId: true,
          usuario: { select: { nome: true } },
        },
      }),
    ])

  return {
    acessosPacienteHoje,
    auditoriasHoje,
    falhasLoginHoje,
    sessoesAtivas,
    eventosMfaHoje,
    acessosSensíveisRecentes: acessosSensíveisRecentes.map((item) => ({
      ...item,
      usuarioNome: item.usuario?.nome ?? 'Usuário removido',
    })),
  }
}
