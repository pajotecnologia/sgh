// lib/cadastros/garantir-kits-padrao.ts
// Sincroniza e garante a existência dos kits hospitalares padrão no banco de dados.

import { prisma } from '@/lib/prisma';
import { KITS_HOSPITALARES_PADRAO } from './kits-hospitalares-padrao';

export async function garantirKitsHospitalaresPadrao(): Promise<{ inseridos: number; total: number }> {
  const totalExistentes = await prisma.tbKitProcedimento.count();
  if (totalExistentes > 0) {
    return { inseridos: 0, total: totalExistentes };
  }

  let inseridos = 0;
  for (const kit of KITS_HOSPITALARES_PADRAO) {
    await prisma.tbKitProcedimento.create({
      data: {
        codigo: kit.codigo,
        nome: kit.nome,
        descricao: kit.descricao,
        tipoVinculo: kit.tipoVinculo,
        viaAdministracao: kit.viaAdministracao ?? null,
        procedimentoNome: kit.procedimentoNome ?? null,
        ativo: true,
        itens: {
          create: kit.itens.map((it) => ({
            descricaoItem: it.descricaoItem,
            quantidadePadrao: it.quantidadePadrao,
            unidade: it.unidade,
            obrigatorio: it.obrigatorio ?? true,
          })),
        },
      },
    });
    inseridos++;
  }

  return { inseridos, total: await prisma.tbKitProcedimento.count() };
}
