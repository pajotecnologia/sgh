// app/api/configuracoes/origens/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { ApiResponse } from '@/types';

export async function GET() {
  try {
    const origens = await prisma.origemPaciente.findMany({
      orderBy: { descricao: 'asc' },
    });
    return NextResponse.json<ApiResponse<any>>({ sucesso: true, dados: origens }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ sucesso: false, erro: 'Erro ao buscar origens.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const sessao = await getServerSession(authOptions);
    if (sessao?.usuario.role !== 'ADMIN') {
      return NextResponse.json({ sucesso: false, erro: 'Acesso negado.' }, { status: 403 });
    }

    const { descricao } = await req.json();
    if (!descricao) return NextResponse.json({ sucesso: false, erro: 'Descrição obrigatória.' }, { status: 400 });

    const origem = await prisma.origemPaciente.create({
      data: { descricao },
    });

    return NextResponse.json<ApiResponse<any>>({ sucesso: true, dados: origem }, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ sucesso: false, erro: 'Esta origem já existe.' }, { status: 409 });
    }
    return NextResponse.json({ sucesso: false, erro: 'Erro ao criar origem.' }, { status: 500 });
  }
}
