import type { Role, StatusAtendimento } from '@prisma/client'

const transicoes: Record<StatusAtendimento, StatusAtendimento[]> = {
  AGUARDANDO_TRIAGEM: ['EM_TRIAGEM'],
  EM_TRIAGEM: ['AGUARDANDO_ATENDIMENTO'],
  AGUARDANDO_ATENDIMENTO: ['EM_ATENDIMENTO'],
  EM_ATENDIMENTO: ['CONCLUIDO', 'AGUARDANDO_INTERNACAO'],
  CONCLUIDO: [],
  AGUARDANDO_INTERNACAO: ['INTERNADO'],
  INTERNADO: ['ALTA', 'TRANSFERIDO', 'OBITO'],
  TRANSFERIDO: [],
  ALTA: [],
  OBITO: [],
}

export function transicaoAtendimentoPermitida(de: StatusAtendimento, para: StatusAtendimento) {
  return transicoes[de]?.includes(para) ?? false
}

/**
 * Define quem pode executar cada transição operacional/assistencial.
 * A regra fica centralizada para que APIs e UI não criem fluxos divergentes.
 */
export function usuarioPodeExecutarTransicao(
  role: Role,
  de: StatusAtendimento,
  para: StatusAtendimento
) {
  if (!transicaoAtendimentoPermitida(de, para)) return false
  if (role === 'ADMIN') return true

  if (role === 'ENFERMEIRO') {
    return (
      (de === 'AGUARDANDO_TRIAGEM' && para === 'EM_TRIAGEM') ||
      (de === 'AGUARDANDO_ATENDIMENTO' && para === 'EM_ATENDIMENTO')
    )
  }

  if (role === 'MEDICO' || role === 'DIRETOR_CLINICO') {
    return (
      (de === 'AGUARDANDO_TRIAGEM' && para === 'EM_TRIAGEM') ||
      (de === 'AGUARDANDO_ATENDIMENTO' && para === 'EM_ATENDIMENTO') ||
      (de === 'EM_ATENDIMENTO' && (para === 'CONCLUIDO' || para === 'AGUARDANDO_INTERNACAO')) ||
      (de === 'AGUARDANDO_INTERNACAO' && para === 'INTERNADO') ||
      (de === 'INTERNADO' && ['ALTA', 'TRANSFERIDO', 'OBITO'].includes(para))
    )
  }

  return false
}

export function statusFinaisInternacao(status: StatusAtendimento) {
  return status === 'ALTA' || status === 'TRANSFERIDO' || status === 'OBITO'
}

export function statusExigeLeito(status: StatusAtendimento) {
  return status === 'INTERNADO'
}
