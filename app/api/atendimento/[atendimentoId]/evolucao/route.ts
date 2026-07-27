// app/api/atendimento/[atendimentoId]/evolucao/route.ts
// GET — Lista evoluções | POST — Registrar evolução médica (append-only)

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { schemaEvolucao } from '@/lib/validations/atendimento';
import { prontuarioPertenceAoAtendimento, prontuarioEstaEncerrado } from '@/lib/atendimento-prontuario';

const ROLES_ESCREVER = ['ADMIN', 'MEDICO', 'DIRETOR_CLINICO'] as const;
const ROLES_LER = ROLES_ESCREVER;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ atendimentoId: string }> }
) {
  const { atendimentoId } = await params;
  const sessao = await getServerSession(authOptions);
  if (!sessao) return NextResponse.json({ sucesso: false, erro: 'Não autorizado.' }, { status: 401 });
  if (!ROLES_LER.includes(sessao.usuario.role as (typeof ROLES_LER)[number])) {
    return NextResponse.json({ sucesso: false, erro: 'Sem permissão.' }, { status: 403 });
  }

  const prontuario = await prisma.prontuarioMedico.findUnique({
    where: { atendimentoId },
    include: {
      evolucoes: {
        orderBy: { registradoEm: 'desc' },
        take: 50,
        include: { autor: { select: { nome: true, crm: true } } },
      },
    },
  });

  return NextResponse.json({
    sucesso: true,
    dados: prontuario?.evolucoes ?? [],
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ atendimentoId: string }> }
) {
  const { atendimentoId } = await params;
  const sessao = await getServerSession(authOptions);
  if (!sessao) return NextResponse.json({ sucesso: false, erro: 'Não autorizado.' }, { status: 401 });
  if (!ROLES_ESCREVER.includes(sessao.usuario.role as (typeof ROLES_ESCREVER)[number])) {
    return NextResponse.json({ sucesso: false, erro: 'Sem permissão.' }, { status: 403 });
  }

  try {
    if (await prontuarioEstaEncerrado(atendimentoId)) {
      return NextResponse.json({ sucesso: false, erro: 'Prontuário encerrado. Edição não permitida.' }, { status: 409 })
    }

    const body = await req.json();
    const validacao = schemaEvolucao.safeParse(body);
    if (!validacao.success) {
      return NextResponse.json(
        { sucesso: false, erro: 'Dados inválidos.', detalhes: validacao.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { prontuarioId, conteudo, template } = validacao.data;

    const ok = await prontuarioPertenceAoAtendimento(atendimentoId, prontuarioId);
    if (!ok) {
      return NextResponse.json({ sucesso: false, erro: 'Prontuário inválido para este atendimento.' }, { status: 400 });
    }

    const evolucao = await prisma.evolucaoMedica.create({
      data: {
        prontuarioId,
        autorId: sessao.usuario.id,
        conteudo,
        template,
      },
      include: { autor: { select: { nome: true, crm: true } } },
    });

    await prisma.logAuditoria.create({
      data: {
        usuarioId: sessao.usuario.id,
        acao: 'CRIACAO',
        entidade: 'EvolucaoMedica',
        entidadeId: evolucao.id,
        valorNovo: template ?? 'LIVRE',
        ipOrigem: req.headers.get('x-forwarded-for') ?? null,
      },
    });

    return NextResponse.json(
      {
        sucesso: true,
        dados: {
          id: evolucao.id,
          conteudo: evolucao.conteudo,
          template: evolucao.template,
          registradoEm: evolucao.registradoEm,
          autor: evolucao.autor,
        },
      },
      { status: 201 }
    );
  } catch (erro) {
    console.error('[POST /api/atendimento/evolucao]', erro);
    return NextResponse.json({ sucesso: false, erro: 'Erro interno.' }, { status: 500 });
  }
}
