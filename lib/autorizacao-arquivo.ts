import { prisma } from '@/lib/prisma'
import type { Role } from '@prisma/client'

const ROLES_ARQUIVO_CLINICO: Role[] = [
  'ADMIN',
  'MEDICO',
  'DIRETOR_CLINICO',
  'ENFERMEIRO',
  'TECNICO_ENFERMAGEM',
]

export type AutorizacaoArquivo = {
  permitido: boolean
  pacienteId: string | null
  atendimentoId: string | null
  entidade: string
  entidadeId: string | null
}

export function normalizarCaminhoRelativo(caminho: string): string | null {
  const normalizado = caminho
    .replace(/\\/g, '/')
    .replace(/^\/+/, '')
    .split('/')
    .filter(Boolean)
    .join('/')

  if (!normalizado || normalizado.includes('..') || normalizado.includes('\0')) {
    return null
  }

  return normalizado
}

export function caminhoExamePrivadoValido(caminho: string): boolean {
  return /^exames\/[a-f0-9-]+\.pdf$/i.test(caminho)
}

export async function autorizarArquivoClinico({
  caminho,
  usuarioId,
  role,
}: {
  caminho: string
  usuarioId: string
  role: Role
}): Promise<AutorizacaoArquivo> {
  const caminhoNormalizado = normalizarCaminhoRelativo(caminho)

  if (!caminhoNormalizado || !ROLES_ARQUIVO_CLINICO.includes(role) || !caminhoExamePrivadoValido(caminhoNormalizado)) {
    return {
      permitido: false,
      pacienteId: null,
      atendimentoId: null,
      entidade: 'ArquivoClinico',
      entidadeId: null,
    }
  }

  const resultadoPdf = `/api/uploads/${caminhoNormalizado}`
  const [usuario, item] = await Promise.all([
    prisma.usuario.findFirst({
      where: { id: usuarioId, ativo: true, deletedAt: null },
      select: { id: true },
    }),
    prisma.itemRequisicao.findFirst({
    where: { resultadoPdf },
    select: {
      id: true,
      requisicao: {
        select: {
          prontuario: {
            select: {
              atendimento: {
                select: {
                  id: true,
                  deletedAt: true,
                  pacienteId: true,
                  paciente: { select: { deletedAt: true } },
                },
              },
            },
          },
        },
      },
    },
    }),
  ])

  const atendimento = item?.requisicao.prontuario.atendimento
  if (!usuario || !item || !atendimento || atendimento.deletedAt !== null || atendimento.paciente.deletedAt !== null) {
    return {
      permitido: false,
      pacienteId: null,
      atendimentoId: null,
      entidade: 'ItemRequisicao',
      entidadeId: item?.id ?? null,
    }
  }

  return {
    permitido: true,
    pacienteId: atendimento.pacienteId,
    atendimentoId: atendimento.id,
    entidade: 'ItemRequisicao',
    entidadeId: item.id,
  }
}
