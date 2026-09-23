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
  pacienteId: pacienteIdInformado,
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
  pacienteId?: string | null
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

  // Log dedicado a acessos a dados sensíveis do paciente. Quando o contexto
  // vem de um atendimento, resolve o paciente pelo próprio vínculo para evitar
  // duplicação de lógica nos endpoints clínicos.
  const pacienteId = pacienteIdInformado ?? (atendimentoId
    ? (await prisma.atendimento.findUnique({ where: { id: atendimentoId }, select: { pacienteId: true } }))?.pacienteId ?? null
    : null)

  if (pacienteId) {
    await prisma.logAcessoPaciente.create({
      data: {
        usuarioId,
        pacienteId,
        atendimentoId,
        acao,
        modulo: entidade,
        motivo: typeof detalhes?.motivo === 'string' ? detalhes.motivo : null,
        ipOrigem: ipOrigem ?? null,
        userAgent: userAgent ?? null,
      },
    })
  }
}
