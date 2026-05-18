// app/api/triagem/fila/route.ts
// GET /api/triagem/fila — Retorna fila de espera com tempo real calculado

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PROTOCOLO_MANCHESTER } from '@/types';
import { calcularTempoEspera, alertaTempoManchester } from '@/lib/utils';
import { nomeCompletoParaExibicao } from '@/lib/nome-paciente-exibicao';

export async function GET(req: NextRequest) {
  const sessao = await getServerSession(authOptions);
  if (!sessao) {
    return NextResponse.json({ sucesso: false, erro: 'Não autorizado.' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const setor = searchParams.get('setor') ?? undefined;
    const status = searchParams.get('status') ?? 'AGUARDANDO_ATENDIMENTO';

    const atendimentos = await prisma.atendimento.findMany({
      where: {
        deletedAt: null,
        status: status as 'AGUARDANDO_TRIAGEM' | 'AGUARDANDO_ATENDIMENTO',
        ...(setor ? { setor } : {}),
      },
      include: {
        paciente: { select: { nomeExibicao: true, nomeCriptografado: true } },
        triagem: {
          select: {
            corClassificacao: true,
            entradaTriagem: true,
            classificadoEm: true,
            queixaPrincipal: true,
            sinaisVitais: {
              select: {
                escalaDor: true,
                spo2: true,
                temperatura: true,
                paSistolica: true,
                paDiastolica: true,
              },
            },
          },
        },
      },
      orderBy: [
        // Vermelhos primeiro, depois por ordem de chegada
        { createdAt: 'asc' },
      ],
    });

    const fila = atendimentos.map((a) => {
      const corTriagem = a.triagem?.corClassificacao ?? null;
      const entradaFila = a.triagem?.entradaTriagem ?? a.createdAt;
      const tempoEsperaMinutos = calcularTempoEspera(entradaFila);
      const ultrapassado = corTriagem
        ? alertaTempoManchester(corTriagem, tempoEsperaMinutos)
        : false;

      // Buscar config da cor para o limite de tempo
      const configCor = corTriagem
        ? PROTOCOLO_MANCHESTER.find((c) => c.cor === corTriagem)
        : null;

      return {
        atendimentoId: a.id,
        numeroAtendimento: a.numeroAtendimento,
        nomePaciente: nomeCompletoParaExibicao(
          a.paciente.nomeExibicao,
          a.paciente.nomeCriptografado
        ),
        corTriagem,
        labelCor: configCor?.label ?? 'Sem triagem',
        tempoMaximoMinutos: configCor?.tempoMaximoMinutos ?? null,
        entradaFila: entradaFila.toISOString(),
        tempoEsperaMinutos,
        alertaUltrapassado: ultrapassado,
        queixaPrincipal: a.triagem?.queixaPrincipal ?? null,
        sinaisVitais: a.triagem?.sinaisVitais ?? null,
        sala: a.sala,
        setor: a.setor,
      };
    });

    // Ordenar: vermelhos e laranjas primeiro; dentro do mesmo grupo, por tempo de espera
    const ORDEM_COR: Record<string, number> = {
      VERMELHO: 0,
      LARANJA: 1,
      AMARELO: 2,
      VERDE: 3,
      AZUL: 4,
      CINZA: 5,
    };

    fila.sort((a, b) => {
      const ordemA = a.corTriagem ? (ORDEM_COR[a.corTriagem] ?? 9) : 10;
      const ordemB = b.corTriagem ? (ORDEM_COR[b.corTriagem] ?? 9) : 10;
      if (ordemA !== ordemB) return ordemA - ordemB;
      return b.tempoEsperaMinutos - a.tempoEsperaMinutos; // Mais tempo esperando primeiro
    });

    return NextResponse.json({ sucesso: true, dados: fila, total: fila.length });
  } catch (erro) {
    console.error('[GET /api/triagem/fila] Erro:', erro);
    return NextResponse.json({ sucesso: false, erro: 'Erro interno.' }, { status: 500 });
  }
}
