// app/api/atendimento/[atendimentoId]/prescricao/route.ts
// POST — Criar prescrição com verificação de alergias e interações

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { schemaCriarPrescricao } from '@/lib/validations/atendimento';
import { verificarInteracoes, verificarAlergiaMedicamento } from '@/lib/interacoes-medicamentosas';
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
    const validacao = schemaCriarPrescricao.safeParse(body);

    if (!validacao.success) {
      return NextResponse.json(
        { sucesso: false, erro: 'Dados inválidos.', detalhes: validacao.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { prontuarioId, observacoes, itens } = validacao.data;

    const pertence = await prontuarioPertenceAoAtendimento(atendimentoId, prontuarioId);
    if (!pertence) {
      return NextResponse.json({ sucesso: false, erro: 'Prontuário inválido para este atendimento.' }, { status: 400 });
    }

    // Buscar alergias do paciente para verificação
    const prontuario = await prisma.prontuarioMedico.findUnique({
      where: { id: prontuarioId },
      include: {
        atendimento: {
          include: {
            paciente: { select: { alergias: { select: { descricao: true } } } },
          },
        },
      },
    });

    if (!prontuario) {
      return NextResponse.json({ sucesso: false, erro: 'Prontuário não encontrado.' }, { status: 404 });
    }

    const alergiasPaciente = prontuario.atendimento.paciente.alergias.map((a) => a.descricao);
    const nomesMedicamentos = itens.map((i) => i.nomeMedicamento);

    // === Verificação de alergias ===
    const alertasAlergia: Array<{ medicamento: string; alergias: string[] }> = [];
    for (const med of nomesMedicamentos) {
      const conflitos = verificarAlergiaMedicamento(med, alergiasPaciente);
      if (conflitos.length > 0) {
        alertasAlergia.push({ medicamento: med, alergias: conflitos });
      }
    }

    // === Verificação de interações ===
    const { interacoes } = verificarInteracoes(nomesMedicamentos);

    // Bloquear apenas se houver alergia GRAVE detectada
    // (interações são avisos, não bloqueios — médico decide)
    if (alertasAlergia.length > 0) {
      return NextResponse.json({
        sucesso: false,
        erro: 'ALERTA: Medicamento(s) incompatível(is) com alergias do paciente.',
        alertasAlergia,
        interacoes,
        // Incluir flag para que o frontend saiba que pode forçar (com justificativa)
        podeForcar: true,
      }, { status: 422 }); // Unprocessable Entity
    }

    // Contar prescrições anteriores para numeração sequencial
    const totalPrescricoes = await prisma.prescricao.count({ where: { prontuarioId } });

    // Criar prescrição com todos os itens em transação
    const prescricao = await prisma.$transaction(async (tx) => {
      const nova = await tx.prescricao.create({
        data: {
          prontuarioId,
          numeroPrescricao: totalPrescricoes + 1,
          observacoes: observacoes || null,
          itens: {
            createMany: {
              data: itens.map((item) => ({
                nomeMedicamento: item.nomeMedicamento,
                dose: item.dose,
                via: item.via,
                frequencia: item.frequencia,
                duracaoDias: item.duracaoDias ?? null,
                observacoes: item.observacoes || null,
              })),
            },
          },
        },
        include: { itens: true },
      });

      await tx.logAuditoria.create({
        data: {
          usuarioId: sessao.usuario.id,
          acao: 'CRIACAO',
          entidade: 'Prescricao',
          entidadeId: nova.id,
          valorNovo: `${itens.length} item(s)`,
          ipOrigem: req.headers.get('x-forwarded-for') ?? null,
        },
      });

      return nova;
    });

    return NextResponse.json({
      sucesso: true,
      dados: { id: prescricao.id, numeroPrescricao: prescricao.numeroPrescricao },
      // Retornar interações como avisos (não bloquearam)
      avisos: interacoes.length > 0 ? { interacoes } : undefined,
      mensagem: 'Prescrição criada com sucesso.',
    }, { status: 201 });
  } catch (erro) {
    console.error('[POST /api/atendimento/prescricao]', erro);
    return NextResponse.json({ sucesso: false, erro: 'Erro interno.' }, { status: 500 });
  }
}

// GET — Listar prescrições do atendimento
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
      include: {
        prescricoes: {
          include: { itens: { orderBy: { createdAt: 'asc' } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    return NextResponse.json({ sucesso: true, dados: prontuario?.prescricoes ?? [] });
  } catch (erro) {
    console.error('[GET /api/atendimento/prescricao]', erro);
    return NextResponse.json({ sucesso: false, erro: 'Erro interno.' }, { status: 500 });
  }
}
