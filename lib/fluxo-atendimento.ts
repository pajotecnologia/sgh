import type { StatusAtendimento } from '@prisma/client'

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

export function statusFinaisInternacao(status: StatusAtendimento) {
  return status === 'ALTA' || status === 'TRANSFERIDO' || status === 'OBITO'
}

export function statusExigeLeito(status: StatusAtendimento) {
  return status === 'INTERNADO'
}
