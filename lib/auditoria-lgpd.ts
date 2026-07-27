// lib/auditoria-lgpd.ts
// Auditoria LGPD (tb_auditoria_log) — registrar leituras e ações sensíveis

import { prisma } from '@/lib/prisma'
import type { Role } from '@prisma/client'

export async function auditarLgpd({
  usuarioId,
  role,
  atendimentoId,
  acao,
  entidade,
  entidadeId,
  ipOrigem,
  userAgent,
  detalhes,
}: {
  usuarioId: string | null
  role: Role | null
  atendimentoId: string | null
  acao: string
  entidade: string
  entidadeId?: string | null
  ipOrigem?: string | null
  userAgent?: string | null
  detalhes?: Record<string, unknown> | null
}) {
  await prisma.tbAuditoriaLog.create({
    data: {
      usuarioId,
      role,
      atendimentoId,
      acao,
      entidade,
      entidadeId: entidadeId ?? null,
      ipOrigem: ipOrigem ?? null,
      userAgent: userAgent ?? null,
      detalhes: (detalhes ?? undefined) as any,
    },
  })
}
