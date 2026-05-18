// lib/montar-dados-ficha-atendimento.ts
// `include` do Prisma para carregar atendimento completo na ficha de urgência (impressão).

import type { Prisma } from '@prisma/client';

export const atendimentoIncludeFichaUrgencia = {
  paciente: {
    include: {
      endereco: true,
    },
  },
  origem: true,
  medico: {
    select: { id: true, nome: true, email: true },
  },
  triagem: {
    include: {
      sinaisVitais: true,
      triador: { select: { nome: true } },
    },
  },
  prontuario: {
    include: {
      anamnese: true,
      diagnosticos: { orderBy: { createdAt: 'desc' as const } },
      prescricoes: {
        orderBy: { createdAt: 'desc' as const },
        include: { itens: { orderBy: { createdAt: 'asc' as const } } },
      },
    },
  },
} satisfies Prisma.AtendimentoInclude;
