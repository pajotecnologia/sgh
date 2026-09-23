import type { Role, StatusAtendimento } from '@prisma/client'

export type AcaoClinica =
  | 'VISUALIZAR_PRONTUARIO'
  | 'EDITAR_PRONTUARIO'
  | 'PRESCREVER'
  | 'REGISTRAR_EVOLUCAO'
  | 'TRIAR'
  | 'ADMINISTRAR_ATENDIMENTO'

const POLITICA: Record<AcaoClinica, Role[]> = {
  VISUALIZAR_PRONTUARIO: ['ADMIN', 'MEDICO', 'DIRETOR_CLINICO', 'ENFERMEIRO', 'TECNICO_ENFERMAGEM', 'FARMACEUTICO', 'RECEPCIONISTA'],
  EDITAR_PRONTUARIO: ['ADMIN', 'MEDICO', 'DIRETOR_CLINICO'],
  PRESCREVER: ['ADMIN', 'MEDICO', 'DIRETOR_CLINICO'],
  REGISTRAR_EVOLUCAO: ['ADMIN', 'MEDICO', 'DIRETOR_CLINICO', 'ENFERMEIRO', 'TECNICO_ENFERMAGEM'],
  TRIAR: ['ADMIN', 'ENFERMEIRO'],
  ADMINISTRAR_ATENDIMENTO: ['ADMIN', 'MEDICO', 'DIRETOR_CLINICO'],
}

export function podeExecutarAcaoClinica(role: Role, acao: AcaoClinica): boolean {
  return POLITICA[acao].includes(role)
}

export function medicoPodeAcessarAtendimento(role: Role, usuarioId: string, medicoId: string | null): boolean {
  if (role === 'ADMIN' || role === 'DIRETOR_CLINICO') return true
  if (role !== 'MEDICO') return false
  return medicoId === usuarioId
}

export function atendimentoPodeSerEditado(status: StatusAtendimento): boolean {
  return !['CONCLUIDO', 'TRANSFERIDO', 'ALTA', 'OBITO'].includes(status)
}
