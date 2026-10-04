import { prisma } from '@/lib/prisma';
import { nomeCompletoParaExibicao } from '@/lib/nome-paciente-exibicao';
import { resolverSenhaETipo, ordenarFilaHospitalar, type TipoAtendimentoInfo } from '@/lib/senhas';
import type { CorTriagem, StatusAtendimento } from '@/types';

export interface ProximoChamadoItem {
  id: string;
  numeroAtendimento: string;
  senha: string;
  tipoAtendimento: TipoAtendimentoInfo;
  nomePaciente: string;
  corTriagem: CorTriagem | null;
  status: StatusAtendimento;
  etapa: 'TRIAGEM' | 'CONSULTÓRIO';
  posicao: number;
  tempoEsperaMinutos: number;
}

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
        paciente: {
          select: {
            nomeExibicao: true,
            nomeCriptografado: true,
            dataNascimento: true,
          },
        },
        triagem: { select: { corClassificacao: true, entradaTriagem: true } },
      },
      orderBy: { createdAt: 'asc' },
      take: 40,
    });

    const agora = Date.now();

    const itensBrutos = (atendimentos || [])
      .filter((a) => Boolean(a && a.paciente))
      .map((a) => {
        const corTriagem = a.triagem?.corClassificacao ?? null;
        const entrada = a.triagem?.entradaTriagem ?? a.createdAt;
        const tempoEsperaMinutos = entrada
          ? Math.max(0, Math.floor((agora - new Date(entrada).getTime()) / 60000))
          : 0;
        const etapa: 'TRIAGEM' | 'CONSULTÓRIO' = a.status === 'AGUARDANDO_TRIAGEM' ? 'TRIAGEM' : 'CONSULTÓRIO';

        const senhaInfo = resolverSenhaETipo({
          numeroAtendimento: a.numeroAtendimento,
          dataNascimento: a.paciente.dataNascimento,
          obstetrico: a.obstetrico,
        });

        return {
          id: a.id,
          numeroAtendimento: a.numeroAtendimento ?? '---',
          senha: senhaInfo.senha,
          tipoAtendimento: senhaInfo.tipo,
          tipoCodigo: senhaInfo.tipo.codigo,
          dataNascimento: a.paciente.dataNascimento,
          nomePaciente: nomeCompletoParaExibicao(a.paciente?.nomeExibicao, a.paciente?.nomeCriptografado),
          corTriagem,
          status: a.status,
          etapa,
          tempoEsperaMinutos,
          createdAt: a.createdAt,
          entradaFila: entrada,
        };
      });

    // Ordenação com rigor hospitalar: Manchester + 80+ + Prioritário Legal + Tempo de Espera
    const itensOrdenados = ordenarFilaHospitalar(itensBrutos);

    return itensOrdenados.slice(0, limite).map((item, idx) => ({
      id: item.id,
      numeroAtendimento: item.numeroAtendimento,
      senha: item.senha,
      tipoAtendimento: item.tipoAtendimento,
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
