import type { Prisma } from '@prisma/client'

/** Pacientes que ainda não iniciaram triagem (fila da recepção → triagem) */
export const whereAguardandoTriagem: Prisma.AtendimentoWhereInput = {
  deletedAt: null,
  status: 'AGUARDANDO_TRIAGEM',
  paciente: { deletedAt: null },
  OR: [{ triagem: { is: null } }, { triagem: { classificadoEm: null } }],
}

/** Pacientes com triagem iniciada (chamados / formulário aberto) */
export const whereEmTriagem: Prisma.AtendimentoWhereInput = {
  deletedAt: null,
  status: 'EM_TRIAGEM',
  paciente: { deletedAt: null },
}

export const includePacienteFilaPreTriagem = {
  paciente: {
    select: {
      nomeExibicao: true,
      nomeCriptografado: true,
      dataNascimento: true,
      sexoBiologico: true,
      convenio: true,
      alergias: { select: { descricao: true } },
    },
  },
} as const
