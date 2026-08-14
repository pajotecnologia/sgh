// app/api/atendimento/[atendimentoId]/prontuario/route.ts
// GET — Busca ou cria prontuário do atendimento (lazy creation)

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { enriquecerPacienteComNomeCompleto } from '@/lib/nome-paciente-exibicao';
import { auditarLgpd } from '@/lib/auditoria-lgpd';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ atendimentoId: string }> }
) {
  const { atendimentoId } = await params;
  const sessao = await getServerSession(authOptions);
  if (!sessao) return NextResponse.json({ sucesso: false, erro: 'Não autorizado.' }, { status: 401 });

  if (
    !['ADMIN', 'MEDICO', 'DIRETOR_CLINICO', 'ENFERMEIRO', 'TECNICO_ENFERMAGEM'].includes(sessao.usuario.role)
  ) {
    return NextResponse.json({ sucesso: false, erro: 'Sem permissão.' }, { status: 403 });
  }

  try {
    const atendimento = await prisma.atendimento.findFirst({
      where: { id: atendimentoId, deletedAt: null },
      include: {
        origem: { select: { id: true, descricao: true, procedenciaFicha: true } },
        medico: { select: { nome: true, crm: true } },
        leito: { select: { ala: true, quarto: true, codigo: true, tipo: true } },
        paciente: {
          select: {
            id: true,
            nomeExibicao: true,
            nomeCriptografado: true,
            dataNascimento: true,
            sexoBiologico: true,
            tipoSanguineo: true,
            alergias: { select: { descricao: true, gravidade: true } },
            medicamentosCont: { select: { nome: true, dose: true, frequencia: true } },
          },
        },
        triagem: {
          select: {
            corClassificacao: true,
            queixaPrincipal: true,
            sinaisVitais: true,
          },
        },
      },
    });

    if (!atendimento) {
      return NextResponse.json({ sucesso: false, erro: 'Atendimento não encontrado.' }, { status: 404 });
    }

    const papelEnfermagem = ['ENFERMEIRO', 'TECNICO_ENFERMAGEM'].includes(sessao.usuario.role);
    if (papelEnfermagem && atendimento.status !== 'INTERNADO') {
      return NextResponse.json(
        {
          sucesso: false,
          erro: 'Enfermagem: acesso ao prontuário permitido apenas para pacientes internados.',
        },
        { status: 403 }
      );
    }

    // Início automático do atendimento médico (não dispara para enfermagem)
    if (
      atendimento.status === 'AGUARDANDO_ATENDIMENTO' &&
      ['MEDICO', 'ADMIN', 'DIRETOR_CLINICO'].includes(sessao.usuario.role)
    ) {
      await prisma.atendimento.update({
        where: { id: atendimentoId },
        data: {
          status: 'EM_ATENDIMENTO',
          medicoId: atendimento.medicoId ?? sessao.usuario.id,
        },
      });

      await prisma.logAuditoria.create({
        data: {
          usuarioId: sessao.usuario.id,
          acao: 'ATUALIZACAO',
          entidade: 'Atendimento',
          entidadeId: atendimentoId,
          valorAnterior: 'AGUARDANDO_ATENDIMENTO',
          valorNovo: 'EM_ATENDIMENTO',
        },
      });
    }

    // Criar prontuário automaticamente se ainda não existir (lazy creation)
    let prontuario = await prisma.prontuarioMedico.findUnique({
      where: { atendimentoId },
      include: {
        anamnese: true,
        diagnosticos: { orderBy: { principal: 'desc' } },
        prescricoes: {
          orderBy: { createdAt: 'desc' },
          include: {
            itens: {
              include: {
                aplicacoes: {
                  orderBy: { aplicadoEm: 'asc' },
                  include: { aplicadoPor: { select: { nome: true } } },
                },
              },
            },
          },
        },
        evolucoes: {
          orderBy: { registradoEm: 'desc' },
          take: 20,
          include: { autor: { select: { nome: true, crm: true } } },
        },
        encaminhamentos: { orderBy: { createdAt: 'desc' } },
        requisicoes: {
          orderBy: { createdAt: 'desc' },
          include: { itens: true },
        },
      },
    });

    if (!prontuario) {
      prontuario = await prisma.prontuarioMedico.create({
        data: { atendimentoId },
        include: {
          anamnese: true,
          diagnosticos: true,
          prescricoes: { include: { itens: { include: { aplicacoes: true } } } },
          evolucoes: { include: { autor: { select: { nome: true, crm: true } } } },
          encaminhamentos: true,
          requisicoes: { include: { itens: true } },
        },
      });
    }

    const atendimentoResposta = {
      ...atendimento,
      paciente: enriquecerPacienteComNomeCompleto(atendimento.paciente),
    };

    await auditarLgpd({
      usuarioId: sessao.usuario.id,
      role: sessao.usuario.role,
      atendimentoId,
      acao: 'VISUALIZACAO',
      entidade: 'ProntuarioMedico',
      entidadeId: prontuario.id,
      ipOrigem: req.headers.get('x-forwarded-for') ?? null,
      userAgent: req.headers.get('user-agent') ?? null,
    });

    return NextResponse.json({ sucesso: true, dados: { atendimento: atendimentoResposta, prontuario } });
  } catch (erro) {
    console.error('[GET /api/atendimento/prontuario]', erro);
    return NextResponse.json({ sucesso: false, erro: 'Erro interno.' }, { status: 500 });
  }
}
