// app/api/atendimento/[atendimentoId]/anamnese/route.ts
// POST — Salvar/atualizar anamnese

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { schemaAnamnese } from '@/lib/validations/atendimento';
import { prontuarioEstaEncerrado } from '@/lib/atendimento-prontuario'

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
    if (await prontuarioEstaEncerrado(atendimentoId)) {
      return NextResponse.json({ sucesso: false, erro: 'Prontuário encerrado. Edição não permitida.' }, { status: 409 })
    }

    const body = await req.json();
    const validacao = schemaAnamnese.safeParse({ ...body, atendimentoId });

    if (!validacao.success) {
      return NextResponse.json(
        { sucesso: false, erro: 'Dados inválidos.', detalhes: validacao.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { queixaPrincipal, hda, antecedentesP, antecedentesF,
            antecedentesC, habitosVida, revisaoSistemas, exameFisico } = validacao.data;

    // Garantir que prontuário existe
    const prontuario = await prisma.prontuarioMedico.upsert({
      where: { atendimentoId },
      create: { atendimentoId },
      update: {},
    });

    // Upsert anamnese (criar ou atualizar)
    const anamnese = await prisma.anamnese.upsert({
      where: { prontuarioId: prontuario.id },
      create: {
        prontuarioId: prontuario.id,
        queixaPrincipal,
        hda: hda || null,
        antecedentesP: antecedentesP || null,
        antecedentesF: antecedentesF || null,
        antecedentesC: antecedentesC || null,
        habitosVida: habitosVida ?? undefined,
        revisaoSistemas: revisaoSistemas ?? undefined,
        exameFisico: exameFisico ?? undefined,
      },
      update: {
        queixaPrincipal,
        hda: hda || null,
        antecedentesP: antecedentesP || null,
        antecedentesF: antecedentesF || null,
        antecedentesC: antecedentesC || null,
        habitosVida: habitosVida ?? undefined,
        revisaoSistemas: revisaoSistemas ?? undefined,
        exameFisico: exameFisico ?? undefined,
      },
    });

    await prisma.logAuditoria.create({
      data: {
        usuarioId: sessao.usuario.id,
        acao: 'ATUALIZACAO',
        entidade: 'Anamnese',
        entidadeId: anamnese.id,
        ipOrigem: req.headers.get('x-forwarded-for') ?? null,
      },
    });

    return NextResponse.json({ sucesso: true, dados: { id: anamnese.id }, mensagem: 'Anamnese salva.' });
  } catch (erro) {
    console.error('[POST /api/atendimento/anamnese]', erro);
    return NextResponse.json({ sucesso: false, erro: 'Erro interno.' }, { status: 500 });
  }
}
