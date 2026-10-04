// app/api/configuracoes/salas/seed/route.ts
// Restaurar ou povoar salas e consultórios padrão do hospital

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { SALAS_PADRAO } from '../route';
import type { ApiResponse } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const sessao = await getServerSession(authOptions);
    if (!sessao || sessao.usuario.role !== 'ADMIN') {
      return NextResponse.json({ sucesso: false, erro: 'Acesso negado.' }, { status: 403 });
    }

    let criadas = 0;
    for (const s of SALAS_PADRAO) {
      await prisma.salaAtendimento.upsert({
        where: { nome: s.nome },
        update: {
          tipo: s.tipo,
          setor: s.setor,
          ordem: s.ordem,
          ativo: true,
        },
        create: {
          nome: s.nome,
          tipo: s.tipo,
          setor: s.setor,
          ordem: s.ordem,
          ativo: true,
        },
      });
      criadas++;
    }

    const todas = await prisma.salaAtendimento.findMany({
      orderBy: [{ ordem: 'asc' }, { nome: 'asc' }],
    });

    return NextResponse.json<ApiResponse<typeof todas>>({
      sucesso: true,
      dados: todas,
      mensagem: `${criadas} salas/consultórios padrão sincronizados com sucesso.`,
    });
  } catch (error) {
    console.error('[POST /api/configuracoes/salas/seed] Erro:', error);
    return NextResponse.json({ sucesso: false, erro: 'Erro ao sincronizar salas padrão.' }, { status: 500 });
  }
}
