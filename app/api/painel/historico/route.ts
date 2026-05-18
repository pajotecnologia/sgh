// app/api/painel/historico/route.ts
// GET /api/painel/historico — Últimas N chamadas (para o painel de chamada)

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Rota pública — o painel é uma TV sem login
// Rate limiting via Vercel Edge ou middleware externo (não implementado aqui)
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
            paciente: { select: { nomeExibicao: true } },
            triagem: { select: { corClassificacao: true } },
          },
        },
      },
      orderBy: { chamadoEm: 'desc' },
      take: limite,
    });

    const dados = chamadas.map((c) => ({
      id: c.id,
      nomePaciente: c.atendimento.paciente.nomeExibicao,
      numeroAtendimento: c.atendimento.numeroAtendimento,
      salaDestino: c.salaDestino,
      corTriagem: c.atendimento.triagem?.corClassificacao ?? null,
      chamadoEm: c.chamadoEm.toISOString(),
      setorPainel: c.setorPainel,
    }));

    return NextResponse.json(
      { sucesso: true, dados },
      {
        status: 200,
        // Cache mínimo — dados mudam frequentemente
        headers: { 'Cache-Control': 'no-store' },
      }
    );
  } catch (erro) {
    console.error('[GET /api/painel/historico] Erro:', erro);
    return NextResponse.json({ sucesso: false, erro: 'Erro interno.' }, { status: 500 });
  }
}
