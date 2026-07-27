// lib/atendimento-prontuario.ts — Validação de prontuário pertencente ao atendimento

import { prisma } from '@/lib/prisma';

export async function obterProntuarioDoAtendimento(atendimentoId: string) {
  return prisma.prontuarioMedico.findUnique({
    where: { atendimentoId },
    select: { id: true, encerradoEm: true },
  });
}

export async function prontuarioPertenceAoAtendimento(
  atendimentoId: string,
  prontuarioId: string
): Promise<boolean> {
  const p = await prisma.prontuarioMedico.findFirst({
    where: { id: prontuarioId, atendimentoId },
    select: { id: true, encerradoEm: true },
  });
  return !!p;
}

export async function prontuarioEstaEncerrado(atendimentoId: string) {
  const row = await prisma.atendimento.findFirst({
    where: { id: atendimentoId, deletedAt: null },
    select: {
      status: true,
      prontuario: { select: { encerradoEm: true } },
    },
  })

  if (!row) return true

  // Paciente internado: prontuário ativo para evoluções, prescrições e exames
  // (append-only), mesmo com encerradoEm da fase de pronto-socorro.
  if (row.status === 'INTERNADO') return false

  return Boolean(row.prontuario?.encerradoEm)
}
