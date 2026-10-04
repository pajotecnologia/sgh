// app/api/configuracoes/salas/[id]/route.ts
// Atualização e exclusão de Salas e Consultórios

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { ApiResponse } from '@/types';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessao = await getServerSession(authOptions);
    if (!sessao || sessao.usuario.role !== 'ADMIN') {
      return NextResponse.json({ sucesso: false, erro: 'Acesso negado.' }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();

    const data: any = {};
    if (typeof body.nome === 'string' && body.nome.trim()) data.nome = body.nome.trim();
    if (typeof body.tipo === 'string' && body.tipo.trim()) data.tipo = body.tipo.trim();
    if (typeof body.setor === 'string' && body.setor.trim()) data.setor = body.setor.trim();
    if (typeof body.ordem === 'number') data.ordem = body.ordem;
    if (typeof body.ativo === 'boolean') data.ativo = body.ativo;

    const sala = await prisma.salaAtendimento.update({
      where: { id },
      data,
    });

    return NextResponse.json<ApiResponse<typeof sala>>({
      sucesso: true,
      dados: sala,
      mensagem: 'Sala/consultório atualizado com sucesso.',
    });
  } catch (error: any) {
    console.error('[PUT /api/configuracoes/salas/[id]] Erro:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ sucesso: false, erro: 'Já existe outra sala com este nome.' }, { status: 409 });
    }
    return NextResponse.json({ sucesso: false, erro: 'Erro ao atualizar sala.' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessao = await getServerSession(authOptions);
    if (!sessao || sessao.usuario.role !== 'ADMIN') {
      return NextResponse.json({ sucesso: false, erro: 'Acesso negado.' }, { status: 403 });
    }

    const { id } = await params;

    await prisma.salaAtendimento.delete({
      where: { id },
    });

    return NextResponse.json<ApiResponse<null>>({
      sucesso: true,
      dados: null,
      mensagem: 'Sala/consultório excluído com sucesso.',
    });
  } catch (error: any) {
    console.error('[DELETE /api/configuracoes/salas/[id]] Erro:', error);
    return NextResponse.json({ sucesso: false, erro: 'Erro ao excluir sala.' }, { status: 500 });
  }
}
