// app/api/atendimento/[atendimentoId]/exames/route.ts
// GET — Lista requisições de exames | POST — Nova requisição

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { schemaCriarRequisicaoExame } from '@/lib/validations/atendimento';
import { prontuarioPertenceAoAtendimento, prontuarioEstaEncerrado } from '@/lib/atendimento-prontuario';

const ROLES_MEDICO = ['ADMIN', 'MEDICO', 'DIRETOR_CLINICO'] as const;
const ROLES_LEITURA = [...ROLES_MEDICO, 'ENFERMEIRO', 'TECNICO_ENFERMAGEM'] as const;

async function carregarRequisicoes(atendimentoId: string) {
  const prontuario = await prisma.prontuarioMedico.findUnique({
    where: { atendimentoId },
    include: {
      requisicoes: {
        include: { itens: true },
        orderBy: { createdAt: 'desc' },
      },
    },
  });
  return prontuario?.requisicoes ?? [];
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ atendimentoId: string }> }
) {
  const { atendimentoId } = await params;
  const sessao = await getServerSession(authOptions);
  if (!sessao) return NextResponse.json({ sucesso: false, erro: 'Não autorizado.' }, { status: 401 });
  if (!ROLES_LEITURA.includes(sessao.usuario.role as (typeof ROLES_LEITURA)[number])) {
    return NextResponse.json({ sucesso: false, erro: 'Sem permissão.' }, { status: 403 });
  }

  const atendimento = await prisma.atendimento.findFirst({
    where: { id: atendimentoId, deletedAt: null },
    select: { id: true },
  });
  if (!atendimento) return NextResponse.json({ sucesso: false, erro: 'Atendimento não encontrado.' }, { status: 404 });

  const dados = await carregarRequisicoes(atendimentoId);
  return NextResponse.json({ sucesso: true, dados });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ atendimentoId: string }> }
) {
  const { atendimentoId } = await params;
  const sessao = await getServerSession(authOptions);
  if (!sessao) return NextResponse.json({ sucesso: false, erro: 'Não autorizado.' }, { status: 401 });
  if (!ROLES_MEDICO.includes(sessao.usuario.role as (typeof ROLES_MEDICO)[number])) {
    return NextResponse.json({ sucesso: false, erro: 'Sem permissão.' }, { status: 403 });
  }

  try {
    if (await prontuarioEstaEncerrado(atendimentoId)) {
      return NextResponse.json({ sucesso: false, erro: 'Prontuário encerrado. Edição não permitida.' }, { status: 409 })
    }

    const body = await req.json();
    const validacao = schemaCriarRequisicaoExame.safeParse(body);
    if (!validacao.success) {
      return NextResponse.json(
        { sucesso: false, erro: 'Dados inválidos.', detalhes: validacao.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { prontuarioId, categoria, urgencia, indicacao, itens } = validacao.data;

    const ok = await prontuarioPertenceAoAtendimento(atendimentoId, prontuarioId);
    if (!ok) {
      return NextResponse.json({ sucesso: false, erro: 'Prontuário inválido para este atendimento.' }, { status: 400 });
    }

    const criada = await prisma.requisicaoExame.create({
      data: {
        prontuarioId,
        categoria,
        urgencia,
        indicacao,
        itens: {
          create: itens.map((i) => ({
            nomeExame: i.nomeExame,
            codigoTuss: i.codigoTuss?.trim() || null,
            observacoes: i.observacoes?.trim() || null,
          })),
        },
      },
      include: { itens: true },
    });

    await prisma.logAuditoria.create({
      data: {
        usuarioId: sessao.usuario.id,
        acao: 'CRIACAO',
        entidade: 'RequisicaoExame',
        entidadeId: criada.id,
        valorNovo: categoria,
        ipOrigem: req.headers.get('x-forwarded-for') ?? null,
      },
    });

    return NextResponse.json({ sucesso: true, dados: criada }, { status: 201 });
  } catch (erro) {
    console.error('[POST exames]', erro);
    return NextResponse.json({ sucesso: false, erro: 'Erro interno.' }, { status: 500 });
  }
}
