// app/api/configuracoes/salas/route.ts
// Gerenciamento de Salas e Consultórios para Painel de Chamadas e Atendimento

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { ApiResponse } from '@/types';

export const SALAS_PADRAO = [
  { nome: 'Consultório 01', tipo: 'CONSULTORIO', setor: 'GERAL', ordem: 1 },
  { nome: 'Consultório 02', tipo: 'CONSULTORIO', setor: 'GERAL', ordem: 2 },
  { nome: 'Consultório 03', tipo: 'CONSULTORIO', setor: 'GERAL', ordem: 3 },
  { nome: 'Consultório 04', tipo: 'CONSULTORIO', setor: 'GERAL', ordem: 4 },
  { nome: 'Sala de Procedimentos', tipo: 'PROCEDIMENTOS', setor: 'GERAL', ordem: 5 },
  { nome: 'Sala de Emergência', tipo: 'EMERGENCIA', setor: 'EMERGENCIA', ordem: 6 },
  { nome: 'Sala de Observação', tipo: 'OBSERVACAO', setor: 'GERAL', ordem: 7 },
  { nome: 'Raio-X', tipo: 'EXAME', setor: 'GERAL', ordem: 8 },
  { nome: 'Laboratório', tipo: 'EXAME', setor: 'GERAL', ordem: 9 },
];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const apenasAtivos = searchParams.get('ativos') !== 'false';
    const setor = searchParams.get('setor');

    const where: any = {};
    if (apenasAtivos) where.ativo = true;
    if (setor && setor !== 'TODOS') where.setor = setor;

    let salas = await prisma.salaAtendimento.findMany({
      where,
      orderBy: [{ ordem: 'asc' }, { nome: 'asc' }],
    });

    // Se o banco estiver vazio, faz o auto-seed inicial das salas padrão
    if (salas.length === 0 && !setor) {
      try {
        await prisma.salaAtendimento.createMany({
          data: SALAS_PADRAO,
          skipDuplicates: true,
        });
        salas = await prisma.salaAtendimento.findMany({
          where,
          orderBy: [{ ordem: 'asc' }, { nome: 'asc' }],
        });
      } catch {
        // Se der erro de concorrência ou schema, usa a lista padrão em memória
        return NextResponse.json<ApiResponse<any>>({
          sucesso: true,
          dados: SALAS_PADRAO.map((s, idx) => ({ id: `padrao-${idx}`, ...s, ativo: true })),
        });
      }
    }

    return NextResponse.json<ApiResponse<typeof salas>>({
      sucesso: true,
      dados: salas,
    });
  } catch (error) {
    console.error('[GET /api/configuracoes/salas] Erro:', error);
    // Fallback gracioso para a lista padrão caso o banco ainda não tenha a tabela em dev local
    return NextResponse.json<ApiResponse<any>>({
      sucesso: true,
      dados: SALAS_PADRAO.map((s, idx) => ({ id: `padrao-${idx}`, ...s, ativo: true })),
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sessao = await getServerSession(authOptions);
    if (!sessao || sessao.usuario.role !== 'ADMIN') {
      return NextResponse.json({ sucesso: false, erro: 'Acesso negado. Apenas administradores podem cadastrar salas.' }, { status: 403 });
    }

    const body = await req.json();
    const nome = typeof body.nome === 'string' ? body.nome.trim() : '';
    const tipo = typeof body.tipo === 'string' && body.tipo.trim() ? body.tipo.trim() : 'CONSULTORIO';
    const setor = typeof body.setor === 'string' && body.setor.trim() ? body.setor.trim() : 'GERAL';
    const ordem = typeof body.ordem === 'number' ? body.ordem : 0;
    const ativo = body.ativo !== false;

    if (!nome) {
      return NextResponse.json({ sucesso: false, erro: 'O nome da sala/consultório é obrigatório.' }, { status: 400 });
    }

    const sala = await prisma.salaAtendimento.create({
      data: {
        nome,
        tipo,
        setor,
        ordem,
        ativo,
      },
    });

    return NextResponse.json<ApiResponse<typeof sala>>({
      sucesso: true,
      dados: sala,
      mensagem: 'Sala/consultório cadastrado com sucesso.',
    }, { status: 201 });
  } catch (error: any) {
    console.error('[POST /api/configuracoes/salas] Erro:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ sucesso: false, erro: 'Já existe uma sala ou consultório cadastrado com este nome.' }, { status: 409 });
    }
    return NextResponse.json({ sucesso: false, erro: 'Erro interno ao cadastrar sala.' }, { status: 500 });
  }
}
