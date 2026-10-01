import { prisma } from '@/lib/prisma';
import { nomeCompletoParaExibicao } from '@/lib/nome-paciente-exibicao';
import type { CorTriagem, StatusAtendimento } from '@/types';

export interface ProximoChamadoItem {
  id: string;
  numeroAtendimento: string;
  nomePaciente: string;
  corTriagem: CorTriagem | null;
  status: StatusAtendimento;
  etapa: 'TRIAGEM' | 'CONSULTÓRIO';
  posicao: number;
  tempoEsperaMinutos: number;
}

const PESO_MANCHESTER: Record<string, number> = {
  VERMELHO: 0,
  LARANJA: 1,
  AMARELO: 2,
  VERDE: 3,
  AZUL: 4,
  CINZA: 5,
};

export async function buscarProximosChamados(
  setor: string = 'GERAL',
  limite: number = 5
): Promise<ProximoChamadoItem[]> {
  try {
    const setorUpper = (setor || 'GERAL').toUpperCase().trim();

    let statusFiltro: StatusAtendimento[];
    if (setorUpper === 'TRIAGEM') {
      statusFiltro = ['AGUARDANDO_TRIAGEM'];
    } else if (setorUpper === 'CONSULTORIOS' || setorUpper === 'MEDICO' || setorUpper === 'CONSULTORIO') {
      statusFiltro = ['AGUARDANDO_ATENDIMENTO'];
    } else {
      statusFiltro = ['AGUARDANDO_ATENDIMENTO', 'AGUARDANDO_TRIAGEM'];
    }

    const atendimentos = await prisma.atendimento.findMany({
      where: {
        deletedAt: null,
        status: { in: statusFiltro },
        paciente: { deletedAt: null },
      },
      include: {
        paciente: { select: { nomeExibicao: true, nomeCriptografado: true } },
        triagem: { select: { corClassificacao: true, entradaTriagem: true } },
      },
      orderBy: { createdAt: 'asc' },
      take: 30,
    });

    const agora = Date.now();

    const itens = (atendimentos || [])
      .filter((a) => Boolean(a && a.paciente))
      .map((a) => {
        const corTriagem = a.triagem?.corClassificacao ?? null;
        const entrada = a.triagem?.entradaTriagem ?? a.createdAt;
        const tempoEsperaMinutos = entrada
          ? Math.max(0, Math.floor((agora - new Date(entrada).getTime()) / 60000))
          : 0;
        const etapa: 'TRIAGEM' | 'CONSULTÓRIO' = a.status === 'AGUARDANDO_TRIAGEM' ? 'TRIAGEM' : 'CONSULTÓRIO';

        return {
          id: a.id,
          numeroAtendimento: a.numeroAtendimento ?? '---',
          nomePaciente: nomeCompletoParaExibicao(a.paciente?.nomeExibicao, a.paciente?.nomeCriptografado),
          corTriagem,
          status: a.status,
          etapa,
          tempoEsperaMinutos,
          createdAt: a.createdAt,
        };
      });

    // Ordenação: Protocolo de Manchester (gravidade) e ordem de chegada
    itens.sort((a, b) => {
      const pesoA = a.corTriagem
        ? (PESO_MANCHESTER[a.corTriagem] ?? 9)
        : a.status === 'AGUARDANDO_TRIAGEM'
          ? 8
          : 10;
      const pesoB = b.corTriagem
        ? (PESO_MANCHESTER[b.corTriagem] ?? 9)
        : b.status === 'AGUARDANDO_TRIAGEM'
          ? 8
          : 10;

      if (pesoA !== pesoB) return pesoA - pesoB;

      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

    return itens.slice(0, limite).map((item, idx) => ({
      id: item.id,
      numeroAtendimento: item.numeroAtendimento,
      nomePaciente: item.nomePaciente,
      corTriagem: item.corTriagem,
      status: item.status,
      etapa: item.etapa,
      posicao: idx + 1,
      tempoEsperaMinutos: item.tempoEsperaMinutos,
    }));
  } catch (err) {
    console.error('[buscarProximosChamados] Erro ao consultar fila:', err);
    return [];
  }
}
