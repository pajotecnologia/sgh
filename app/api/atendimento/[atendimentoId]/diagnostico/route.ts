// app/api/atendimento/[atendimentoId]/diagnostico/route.ts
// POST/GET/DELETE — Diagnósticos com CID-10

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { schemaDiagnostico } from '@/lib/validations/atendimento';
import { prontuarioPertenceAoAtendimento, prontuarioEstaEncerrado } from '@/lib/atendimento-prontuario';
import { medicoPodeAcessarAtendimento } from '@/lib/rbac-clinico';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ atendimentoId: string }> }
) {
  const { atendimentoId } = await params;
  const sessao = await getServerSession(authOptions);
  if (!sessao) return NextResponse.json({ sucesso: false, erro: 'Não autorizado.' }, { status: 401 });
  if (!['ADMIN', 'MEDICO', 'DIRETOR_CLINICO'].includes(sessao.usuario.role)) {
    return NextResponse.json({ sucesso: false, erro: 'Sem permissão.' }, { status: 403 });
  }

  const atendimento = await prisma.atendimento.findUnique({
    where: { id: atendimentoId },
    select: { medicoId: true, deletedAt: true },
  });
  if (!atendimento || atendimento.deletedAt !== null || !medicoPodeAcessarAtendimento(sessao.usuario.role, sessao.usuario.id, atendimento.medicoId)) {
    return NextResponse.json({ sucesso: false, erro: 'Atendimento não autorizado para este usuário.' }, { status: 403 });
  }

  try {
    if (await prontuarioEstaEncerrado(atendimentoId)) {
      return NextResponse.json({ sucesso: false, erro: 'Prontuário encerrado. Edição não permitida.' }, { status: 409 });
    }

    const body = await req.json();
    const validacao = schemaDiagnostico.safeParse(body);
    if (!validacao.success) {
      return NextResponse.json(
        { sucesso: false, erro: 'Dados inválidos.', detalhes: validacao.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { prontuarioId: prontuarioIdInformado, codigoCid, descricaoCid, hipotese, principal } = validacao.data;

    // Vincular médico ao atendimento se ainda não estiver atribuído
    if (!atendimento.medicoId) {
      await prisma.atendimento.update({
        where: { id: atendimentoId },
        data: { medicoId: sessao.usuario.id },
      });
    }

    // Garantir prontuário existente para este atendimento
    let prontuario = await prisma.prontuarioMedico.findUnique({
      where: { atendimentoId },
      select: { id: true },
    });

    if (!prontuario) {
      prontuario = await prisma.prontuarioMedico.create({
        data: {
          atendimentoId,
        },
        select: { id: true },
      });
    }

    const idProntuarioFinal = prontuario.id;

    if (prontuarioIdInformado && prontuarioIdInformado !== idProntuarioFinal) {
      const pertence = await prontuarioPertenceAoAtendimento(atendimentoId, prontuarioIdInformado);
      if (!pertence) {
        return NextResponse.json({ sucesso: false, erro: 'Prontuário inválido para este atendimento.' }, { status: 400 });
      }
    }

    // Se for principal, remover o flag principal dos outros diagnósticos deste prontuário
    if (principal) {
      await prisma.diagnostico.updateMany({
        where: { prontuarioId: idProntuarioFinal, principal: true },
        data: { principal: false },
      });
    }

    const diagnostico = await prisma.diagnostico.create({
      data: {
        prontuarioId: idProntuarioFinal,
        codigoCid,
        descricaoCid,
        hipotese: hipotese || null,
        principal: Boolean(principal),
      },
    });

    return NextResponse.json({ sucesso: true, dados: diagnostico }, { status: 201 });
  } catch (erro) {
    console.error('[POST /api/atendimento/diagnostico]', erro);
    return NextResponse.json({ sucesso: false, erro: 'Erro interno ao salvar diagnóstico.' }, { status: 500 });
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ atendimentoId: string }> }
) {
  const { atendimentoId } = await params;
  const sessao = await getServerSession(authOptions);
  if (!sessao) return NextResponse.json({ sucesso: false, erro: 'Não autorizado.' }, { status: 401 });
  if (!['ADMIN', 'MEDICO', 'DIRETOR_CLINICO'].includes(sessao.usuario.role)) return NextResponse.json({ sucesso: false, erro: 'Sem permissão.' }, { status: 403 });
  const atendimento = await prisma.atendimento.findUnique({ where: { id: atendimentoId }, select: { medicoId: true, deletedAt: true } });
  if (!atendimento || atendimento.deletedAt !== null || !medicoPodeAcessarAtendimento(sessao.usuario.role, sessao.usuario.id, atendimento.medicoId)) return NextResponse.json({ sucesso: false, erro: 'Atendimento não autorizado para este usuário.' }, { status: 403 });

  try {
    const prontuario = await prisma.prontuarioMedico.findUnique({
      where: { atendimentoId },
      include: { diagnosticos: { orderBy: [{ principal: 'desc' }, { createdAt: 'asc' }] } },
    });
    return NextResponse.json({ sucesso: true, dados: prontuario?.diagnosticos ?? [] });
  } catch (erro) {
    return NextResponse.json({ sucesso: false, erro: 'Erro interno ao buscar diagnósticos.' }, { status: 500 });
  }
}

// DELETE — Remover diagnóstico
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ atendimentoId: string }> }
) {
  const { atendimentoId } = await params;
  const sessao = await getServerSession(authOptions);
  if (!sessao) return NextResponse.json({ sucesso: false, erro: 'Não autorizado.' }, { status: 401 });
  if (!['ADMIN', 'MEDICO', 'DIRETOR_CLINICO'].includes(sessao.usuario.role)) return NextResponse.json({ sucesso: false, erro: 'Sem permissão.' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ sucesso: false, erro: 'ID do diagnóstico é obrigatório.' }, { status: 400 });

  const atendimento = await prisma.atendimento.findUnique({
    where: { id: atendimentoId },
    select: { medicoId: true, deletedAt: true },
  });
  if (!atendimento || atendimento.deletedAt !== null || !medicoPodeAcessarAtendimento(sessao.usuario.role, sessao.usuario.id, atendimento.medicoId)) {
    return NextResponse.json({ sucesso: false, erro: 'Atendimento não autorizado.' }, { status: 403 });
  }

  if (await prontuarioEstaEncerrado(atendimentoId)) {
    return NextResponse.json({ sucesso: false, erro: 'Prontuário encerrado. Exclusão não permitida.' }, { status: 409 });
  }

  const diagnostico = await prisma.diagnostico.findUnique({
    where: { id },
    select: { prontuarioId: true },
  });
  if (!diagnostico || !(await prontuarioPertenceAoAtendimento(atendimentoId, diagnostico.prontuarioId))) {
    return NextResponse.json({ sucesso: false, erro: 'Diagnóstico não pertence a este atendimento.' }, { status: 403 });
  }

  await prisma.diagnostico.delete({ where: { id } });
  return NextResponse.json({ sucesso: true, mensagem: 'Diagnóstico removido com sucesso.' });
}

