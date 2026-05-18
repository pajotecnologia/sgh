// app/api/configuracoes/origens/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const sessao = await getServerSession(authOptions);
  if (sessao?.usuario.role !== 'ADMIN') {
    return NextResponse.json({ sucesso: false, erro: 'Acesso negado.' }, { status: 403 });
  }
  const { id } = await params;
  try {
    const body = await req.json();
    const { descricao, procedenciaFicha } = body as {
      descricao?: string;
      procedenciaFicha?: 'RESIDENCIA' | 'VIA_PUBLICA' | 'TRABALHO' | 'UNIDADE_SAUDE' | null;
    };
    const atualizado = await prisma.origemPaciente.update({
      where: { id },
      data: {
        ...(descricao != null && descricao.trim() ? { descricao: descricao.trim() } : {}),
        ...(procedenciaFicha !== undefined ? { procedenciaFicha } : {}),
      },
    });
    return NextResponse.json({ sucesso: true, dados: atualizado });
  } catch (e: any) {
    if (e.code === 'P2002') {
      return NextResponse.json({ sucesso: false, erro: 'Já existe origem com esta descrição.' }, { status: 409 });
    }
    return NextResponse.json({ sucesso: false, erro: 'Erro ao atualizar origem.' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sessao = await getServerSession(authOptions);
    if (sessao?.usuario.role !== 'ADMIN') {
      return NextResponse.json({ sucesso: false, erro: 'Acesso negado.' }, { status: 403 });
    }

    await prisma.origemPaciente.delete({
      where: { id },
    });

    return NextResponse.json({ sucesso: true, dados: null }, { status: 200 });
  } catch (error: any) {
    if (error.code === 'P2003') {
      return NextResponse.json({ sucesso: false, erro: 'Não é possível excluir: existem atendimentos vinculados a esta origem.' }, { status: 409 });
    }
    return NextResponse.json({ sucesso: false, erro: 'Erro ao excluir origem.' }, { status: 500 });
  }
}
