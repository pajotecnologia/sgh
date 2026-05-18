// app/api/atendimento/[atendimentoId]/diagnostico/route.ts
// POST/GET — Diagnósticos com CID-10

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { schemaDiagnostico } from '@/lib/validations/atendimento';
import { prontuarioPertenceAoAtendimento } from '@/lib/atendimento-prontuario';

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

  try {
    const body = await req.json();
    const validacao = schemaDiagnostico.safeParse(body);
    if (!validacao.success) {
      return NextResponse.json(
        { sucesso: false, erro: 'Dados inválidos.', detalhes: validacao.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { prontuarioId, codigoCid, descricaoCid, hipotese, principal } = validacao.data;

    const pertence = await prontuarioPertenceAoAtendimento(atendimentoId, prontuarioId);
    if (!pertence) {
      return NextResponse.json({ sucesso: false, erro: 'Prontuário inválido para este atendimento.' }, { status: 400 });
    }

    // Se for principal, remover o flag principal dos outros
    if (principal) {
      await prisma.diagnostico.updateMany({
        where: { prontuarioId, principal: true },
        data: { principal: false },
      });
    }

    const diagnostico = await prisma.diagnostico.create({
      data: { prontuarioId, codigoCid, descricaoCid, hipotese: hipotese || null, principal },
    });

    return NextResponse.json({ sucesso: true, dados: diagnostico }, { status: 201 });
  } catch (erro) {
    console.error('[POST /api/atendimento/diagnostico]', erro);
    return NextResponse.json({ sucesso: false, erro: 'Erro interno.' }, { status: 500 });
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ atendimentoId: string }> }
) {
  const { atendimentoId } = await params;
  const sessao = await getServerSession(authOptions);
  if (!sessao) return NextResponse.json({ sucesso: false, erro: 'Não autorizado.' }, { status: 401 });

  try {
    const prontuario = await prisma.prontuarioMedico.findUnique({
      where: { atendimentoId },
      include: { diagnosticos: { orderBy: [{ principal: 'desc' }, { createdAt: 'asc' }] } },
    });
    return NextResponse.json({ sucesso: true, dados: prontuario?.diagnosticos ?? [] });
  } catch (erro) {
    return NextResponse.json({ sucesso: false, erro: 'Erro interno.' }, { status: 500 });
  }
}

// DELETE — Remover diagnóstico
export async function DELETE(req: NextRequest) {
  const sessao = await getServerSession(authOptions);
  if (!sessao || !['ADMIN', 'MEDICO'].includes(sessao.usuario.role)) {
    return NextResponse.json({ sucesso: false, erro: 'Sem permissão.' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ sucesso: false, erro: 'ID obrigatório.' }, { status: 400 });

  await prisma.diagnostico.delete({ where: { id } });
  return NextResponse.json({ sucesso: true, mensagem: 'Diagnóstico removido.' });
}
