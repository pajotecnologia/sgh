// app/api/farmacia/kits/restaurar-padroes/route.ts
// Rota para restaurar e garantir todos os kits hospitalares padrão

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { KITS_HOSPITALARES_PADRAO } from '@/lib/cadastros/kits-hospitalares-padrao';

const ROLES_ESCRITA = ['ADMIN', 'FARMACEUTICO', 'DIRETOR_CLINICO'] as const;

export async function POST(req: NextRequest) {
  const sessao = await getServerSession(authOptions);
  if (!sessao) return NextResponse.json({ sucesso: false, erro: 'Não autorizado.' }, { status: 401 });
  if (!ROLES_ESCRITA.includes(sessao.usuario.role as (typeof ROLES_ESCRITA)[number])) {
    return NextResponse.json({ sucesso: false, erro: 'Sem permissão.' }, { status: 403 });
  }

  try {
    let inseridosOuAtualizados = 0;

    for (const kit of KITS_HOSPITALARES_PADRAO) {
      const existente = await prisma.tbKitProcedimento.findFirst({
        where: {
          OR: [
            { codigo: kit.codigo },
            { nome: kit.nome },
          ],
        },
      });

      if (!existente) {
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
        inseridosOuAtualizados++;
      }
    }

    return NextResponse.json({
      sucesso: true,
      mensagem: `${inseridosOuAtualizados} kits padrão foram restaurados com sucesso!`,
      total: await prisma.tbKitProcedimento.count(),
    });
  } catch (e) {
    console.error('[POST /api/farmacia/kits/restaurar-padroes]', e);
    return NextResponse.json({ sucesso: false, erro: 'Erro ao restaurar kits padrão.' }, { status: 500 });
  }
}
