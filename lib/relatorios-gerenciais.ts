import { prisma } from '@/lib/prisma';

export interface FiltrosRelatorioGerencial {
  dataInicio?: string;
  dataFim?: string;
  setor?: string;
}

export interface RelatorioAtendimentosDTO {
  total: number;
  porStatus: Record<string, number>;
  porPrioridade: Record<string, number>;
  porSetor: Record<string, number>;
  tempoMedioEsperaMinutos: number;
  atendimentosRecentes: Array<{
    id: string;
    numeroAtendimento: string;
    pacienteNome: string;
    dataHora: string;
    status: string;
    prioridade: string;
    setor: string;
    medicoNome: string;
  }>;
}

export interface RelatorioOcupacaoDTO {
  totalLeitos: number;
  ocupados: number;
  disponiveis: number;
  interditados: number;
  taxaOcupacaoPercentual: number;
  porTipo: Record<string, { total: number; ocupados: number; disponiveis: number }>;
  porClinicaAla: Array<{
    clinicaAla: string;
    total: number;
    ocupados: number;
    taxa: number;
  }>;
}

export interface RelatorioFarmaciaConsumoDTO {
  totalDispensacoes: number;
  totalItensAplicados: number;
  medicamentosMaisConsumidos: Array<{
    nome: string;
    principioAtivo: string;
    totalAplicado: number;
    viasMaisUsadas: string;
  }>;
}

/**
 * Gera relatório gerencial de atendimentos
 */
export async function gerarRelatorioAtendimentos(
  filtros: FiltrosRelatorioGerencial
): Promise<RelatorioAtendimentosDTO> {
  const where: any = { deletedAt: null };

  if (filtros.dataInicio || filtros.dataFim) {
    where.createdAt = {};
    if (filtros.dataInicio) {
      where.createdAt.gte = new Date(`${filtros.dataInicio}T00:00:00.000Z`);
    }
    if (filtros.dataFim) {
      where.createdAt.lte = new Date(`${filtros.dataFim}T23:59:59.999Z`);
    }
  }

  if (filtros.setor && filtros.setor !== 'TODOS') {
    where.setor = filtros.setor;
  }

  const atendimentos = await prisma.atendimento.findMany({
    where,
    include: {
      paciente: { select: { nomeExibicao: true } },
      medico: { select: { nome: true } },
      triagem: { select: { prioridade: true, dataHoraTriagem: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 1000,
  });

  const porStatus: Record<string, number> = {};
  const porPrioridade: Record<string, number> = {};
  const porSetor: Record<string, number> = {};
  let somaEsperaMs = 0;
  let contagemEspera = 0;

  for (const at of atendimentos) {
    porStatus[at.status] = (porStatus[at.status] || 0) + 1;
    const prio = at.triagem?.prioridade || 'SEM_TRIAGEM';
    porPrioridade[prio] = (porPrioridade[prio] || 0) + 1;
    const setorNome = at.setor || 'Geral';
    porSetor[setorNome] = (porSetor[setorNome] || 0) + 1;

    if (at.triagem?.dataHoraTriagem && at.createdAt) {
      const diffMs = new Date(at.triagem.dataHoraTriagem).getTime() - new Date(at.createdAt).getTime();
      if (diffMs > 0 && diffMs < 24 * 60 * 60 * 1000) {
        somaEsperaMs += diffMs;
        contagemEspera++;
      }
    }
  }

  const tempoMedioEsperaMinutos =
    contagemEspera > 0 ? Math.round(somaEsperaMs / (contagemEspera * 60 * 1000)) : 0;

  return {
    total: atendimentos.length,
    porStatus,
    porPrioridade,
    porSetor,
    tempoMedioEsperaMinutos,
    atendimentosRecentes: atendimentos.slice(0, 50).map((a) => ({
      id: a.id,
      numeroAtendimento: a.numeroAtendimento,
      pacienteNome: a.paciente.nomeExibicao,
      dataHora: a.createdAt.toISOString(),
      status: a.status,
      prioridade: a.triagem?.prioridade || 'SEM_TRIAGEM',
      setor: a.setor || 'Geral',
      medicoNome: a.medico?.nome || 'Não atribuído',
    })),
  };
}

/**
 * Gera relatório gerencial de ocupação de leitos
 */
export async function gerarRelatorioOcupacao(): Promise<RelatorioOcupacaoDTO> {
  const leitos = await prisma.leito.findMany({
    where: { ativo: true },
    include: { clinicaRef: { select: { nome: true } } },
  });

  const totalLeitos = leitos.length;
  let ocupados = 0;
  let disponiveis = 0;
  let interditados = 0;

  const porTipo: Record<string, { total: number; ocupados: number; disponiveis: number }> = {};
  const porAla: Record<string, { total: number; ocupados: number }> = {};

  for (const l of leitos) {
    if (l.status === 'OCUPADO') ocupados++;
    else if (l.status === 'DISPONIVEL') disponiveis++;
    else if (l.status === 'INTERDITADO') interditados++;

    if (!porTipo[l.tipo]) {
      porTipo[l.tipo] = { total: 0, ocupados: 0, disponiveis: 0 };
    }
    porTipo[l.tipo].total++;
    if (l.status === 'OCUPADO') porTipo[l.tipo].ocupados++;
    if (l.status === 'DISPONIVEL') porTipo[l.tipo].disponiveis++;

    const nomeAla = l.clinicaRef?.nome || l.clinica || l.ala || 'Geral';
    if (!porAla[nomeAla]) {
      porAla[nomeAla] = { total: 0, ocupados: 0 };
    }
    porAla[nomeAla].total++;
    if (l.status === 'OCUPADO') porAla[nomeAla].ocupados++;
  }

  const taxaOcupacaoPercentual = totalLeitos > 0 ? Math.round((ocupados / totalLeitos) * 100) : 0;

  const porClinicaAla = Object.entries(porAla).map(([clinicaAla, dados]) => ({
    clinicaAla,
    total: dados.total,
    ocupados: dados.ocupados,
    taxa: dados.total > 0 ? Math.round((dados.ocupados / dados.total) * 100) : 0,
  }));

  return {
    totalLeitos,
    ocupados,
    disponiveis,
    interditados,
    taxaOcupacaoPercentual,
    porTipo,
    porClinicaAla,
  };
}

/**
 * Gera relatório de consumo da farmácia / aplicações
 */
export async function gerarRelatorioFarmaciaConsumo(
  filtros: FiltrosRelatorioGerencial
): Promise<RelatorioFarmaciaConsumoDTO> {
  const whereAplicacao: any = {};
  if (filtros.dataInicio || filtros.dataFim) {
    whereAplicacao.aplicadoEm = {};
    if (filtros.dataInicio) {
      whereAplicacao.aplicadoEm.gte = new Date(`${filtros.dataInicio}T00:00:00.000Z`);
    }
    if (filtros.dataFim) {
      whereAplicacao.aplicadoEm.lte = new Date(`${filtros.dataFim}T23:59:59.999Z`);
    }
  }

  const aplicacoes = await prisma.aplicacaoMedicamento.findMany({
    where: whereAplicacao,
    include: {
      itemPrescricao: { select: { medicamento: true, via: true, dose: true } },
    },
    take: 2000,
  });

  const agregador: Record<string, { nome: string; principioAtivo: string; total: number; vias: Set<string> }> = {};

  for (const app of aplicacoes) {
    const medNome = app.itemPrescricao?.medicamento || 'Medicamento não especificado';
    if (!agregador[medNome]) {
      agregador[medNome] = {
        nome: medNome,
        principioAtivo: '',
        total: 0,
        vias: new Set<string>(),
      };
    }
    agregador[medNome].total++;
    if (app.itemPrescricao?.via) {
      agregador[medNome].vias.add(app.itemPrescricao.via);
    }
  }

  const medicamentosMaisConsumidos = Object.values(agregador)
    .sort((a, b) => b.total - a.total)
    .slice(0, 30)
    .map((m) => ({
      nome: m.nome,
      principioAtivo: m.principioAtivo,
      totalAplicado: m.total,
      viasMaisUsadas: Array.from(m.vias).join(', ') || 'N/A',
    }));

  return {
    totalDispensacoes: aplicacoes.length,
    totalItensAplicados: aplicacoes.length,
    medicamentosMaisConsumidos,
  };
}

/**
 * Converte dados de atendimentos para CSV sanitizado
 */
export function exportarAtendimentosCsv(dados: RelatorioAtendimentosDTO): string {
  const colunas = ['NumeroAtendimento', 'DataHora', 'Paciente', 'Status', 'Prioridade', 'Setor', 'Medico'];
  const linhas = dados.atendimentosRecentes.map((a) => [
    `"${a.numeroAtendimento}"`,
    `"${a.dataHora}"`,
    `"${a.pacienteNome.replace(/"/g, '""')}"`,
    `"${a.status}"`,
    `"${a.prioridade}"`,
    `"${a.setor}"`,
    `"${a.medicoNome.replace(/"/g, '""')}"`,
  ]);

  return [colunas.join(';'), ...linhas.map((l) => l.join(';'))].join('\n');
}
