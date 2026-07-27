import type { PrismaClient } from '@prisma/client'

export const ROLES_PRESCRICAO_MODELO_LEITURA = [
  'ADMIN',
  'MEDICO',
  'DIRETOR_CLINICO',
] as const

export type RolePrescricaoModeloLeitura = (typeof ROLES_PRESCRICAO_MODELO_LEITURA)[number]

export const podeLerModelosPrescricaoMedica = (role: string): role is RolePrescricaoModeloLeitura =>
  ROLES_PRESCRICAO_MODELO_LEITURA.includes(role as RolePrescricaoModeloLeitura)

const includeItens = {
  itens: { orderBy: { ordem: 'asc' as const } },
}

export async function listarPrescricoesMedicasPadraoAtivas(
  prisma: PrismaClient,
  opcoes?: { q?: string; limite?: number }
) {
  const q = opcoes?.q?.trim() ?? ''

  return prisma.prescricaoMedicaPadrao.findMany({
    where: {
      ativo: true,
      ...(q
        ? {
            OR: [
              { nome: { contains: q, mode: 'insensitive' } },
              { descricao: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    include: includeItens,
    orderBy: { nome: 'asc' },
    take: opcoes?.limite ?? 200,
  })
}
