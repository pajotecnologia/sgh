// lib/atendimento-prontuario.ts — Validação de prontuário pertencente ao atendimento

import { prisma } from '@/lib/prisma';

export async function obterProntuarioDoAtendimento(atendimentoId: string) {
  return prisma.prontuarioMedico.findUnique({
    where: { atendimentoId },
    select: { id: true },
  });
}

export async function prontuarioPertenceAoAtendimento(
  atendimentoId: string,
  prontuarioId: string
): Promise<boolean> {
  const p = await prisma.prontuarioMedico.findFirst({
    where: { id: prontuarioId, atendimentoId },
    select: { id: true },
  });
  return !!p;
}
