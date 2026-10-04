// app/api/painel/historico/route.ts
// GET /api/painel/historico — Últimas N chamadas (para o painel de chamada)

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { resolverSenhaETipo } from '@/lib/senhas';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const setor = searchParams.get('setor') ?? 'GERAL';
    const limite = Math.min(10, parseInt(searchParams.get('limite') ?? '5'));

    const chamadas = await prisma.chamadaPainel.findMany({
      where: { setorPainel: setor },
      include: {
        atendimento: {
          include: {
            paciente: {
              select: {
                nomeExibicao: true,
                dataNascimento: true,
              },
            },
            triagem: { select: { corClassificacao: true } },
          },
        },
      },
      orderBy: { chamadoEm: 'desc' },
      take: limite,
    });

    const dados = (chamadas || [])
      .filter((c) => Boolean(c && c.atendimento && c.atendimento.paciente))
      .map((c) => {
        const senhaInfo = resolverSenhaETipo({
          numeroAtendimento: c.atendimento.numeroAtendimento,
          dataNascimento: c.atendimento.paciente.dataNascimento,
          obstetrico: c.atendimento.obstetrico,
        });

        const etapa = c.atendimento.status === 'AGUARDANDO_TRIAGEM' || !c.atendimento.triagem?.corClassificacao
          ? 'TRIAGEM'
          : 'CONSULTÓRIO';

        return {
          id: c.id,
          nomePaciente: c.atendimento.paciente.nomeExibicao || 'Paciente',
          numeroAtendimento: c.atendimento.numeroAtendimento ?? '---',
          senha: senhaInfo.senha,
          tipoAtendimento: senhaInfo.tipo,
          etapa,
          salaDestino: c.salaDestino ?? 'Consultório',
          corTriagem: c.atendimento.triagem?.corClassificacao ?? null,
          chamadoEm: c.chamadoEm ? new Date(c.chamadoEm).toISOString() : new Date().toISOString(),
          setorPainel: c.setorPainel ?? setor,
        };
      });

    return NextResponse.json(
      { sucesso: true, dados },
      {
        status: 200,
        headers: { 'Cache-Control': 'no-store' },
      }
    );
  } catch (erro) {
    console.error('[GET /api/painel/historico] Erro:', erro);
    return NextResponse.json({ sucesso: false, erro: 'Erro interno.' }, { status: 500 });
  }
}
