// lib/senhas.ts
// Gestão de Senhas, Códigos por Tipo de Atendimento e Regras de Prioridades Hospitalares
// Em conformidade com a Lei 10.048/2000 (Prioritários), Lei 13.466/2017 (Superprioridade 80+),
// Lei 14.624/2023 (TEA/Autismo) e Protocolo de Triagem de Manchester.

import type { CorTriagem } from '@/types';

export type TipoAtendimentoCodigo = 'SG' | 'SP' | 'S8' | 'PD' | 'OB' | 'EX' | 'RT';

export interface TipoAtendimentoInfo {
  codigo: TipoAtendimentoCodigo;
  nome: string;
  nomeCurto: string;
  descricao: string;
  legislacao?: string;
  corHex: string;
  bgBadge: string;
  textoBadge: string;
  bordaBadge: string;
  prioridadeBase: number;
}

export const TIPOS_ATENDIMENTO: Record<TipoAtendimentoCodigo, TipoAtendimentoInfo> = {
  S8: {
    codigo: 'S8',
    nome: 'Superprioridade (80+ anos)',
    nomeCurto: 'Prioridade 80+',
    descricao: 'Idosos com 80 anos ou mais — Atendimento preferencial especial',
    legislacao: 'Lei Federal 13.466/2017',
    corHex: '#9333ea',
    bgBadge: 'bg-purple-950/40 text-purple-300 border-purple-500/50',
    textoBadge: 'text-purple-400',
    bordaBadge: 'border-purple-500',
    prioridadeBase: 5000,
  },
  SP: {
    codigo: 'SP',
    nome: 'Atendimento Prioritário',
    nomeCurto: 'Prioritário',
    descricao: 'Idosos 60+, gestantes, lactantes, PCD e pessoas com TEA',
    legislacao: 'Lei 10.048/2000 e Lei 14.624/2023',
    corHex: '#eab308',
    bgBadge: 'bg-amber-950/40 text-amber-300 border-amber-500/50',
    textoBadge: 'text-amber-400',
    bordaBadge: 'border-amber-500',
    prioridadeBase: 4000,
  },
  PD: {
    codigo: 'PD',
    nome: 'Atendimento Pediátrico',
    nomeCurto: 'Pediatria',
    descricao: 'Crianças e adolescentes (0 a 12 anos)',
    legislacao: 'Estatuto da Criança e do Adolescente',
    corHex: '#16a34a',
    bgBadge: 'bg-emerald-950/40 text-emerald-300 border-emerald-500/50',
    textoBadge: 'text-emerald-400',
    bordaBadge: 'border-emerald-500',
    prioridadeBase: 3500,
  },
  OB: {
    codigo: 'OB',
    nome: 'Atendimento Obstétrico',
    nomeCurto: 'Obstetrícia',
    descricao: 'Gestantes em trabalho de parto, puerpério e urgências obstétricas',
    legislacao: 'Rede Cegonha / SUS',
    corHex: '#ec4899',
    bgBadge: 'bg-pink-950/40 text-pink-300 border-pink-500/50',
    textoBadge: 'text-pink-400',
    bordaBadge: 'border-pink-500',
    prioridadeBase: 3600,
  },
  EX: {
    codigo: 'EX',
    nome: 'Exames e Coletas',
    nomeCurto: 'Exames / Coleta',
    descricao: 'Laboratório, Raio-X, Tomografia, ECG e procedimentos rápidos',
    corHex: '#f97316',
    bgBadge: 'bg-orange-950/40 text-orange-300 border-orange-500/50',
    textoBadge: 'text-orange-400',
    bordaBadge: 'border-orange-500',
    prioridadeBase: 2500,
  },
  RT: {
    codigo: 'RT',
    nome: 'Retorno / Reavaliação',
    nomeCurto: 'Retorno',
    descricao: 'Retorno para avaliação de exames ou curativos pós-atendimento',
    corHex: '#6366f1',
    bgBadge: 'bg-indigo-950/40 text-indigo-300 border-indigo-500/50',
    textoBadge: 'text-indigo-400',
    bordaBadge: 'border-indigo-500',
    prioridadeBase: 2000,
  },
  SG: {
    codigo: 'SG',
    nome: 'Atendimento Geral / Convencional',
    nomeCurto: 'Geral',
    descricao: 'Atendimento clínico geral padrão sem prioridade legal prévia',
    corHex: '#0284c7',
    bgBadge: 'bg-sky-950/40 text-sky-300 border-sky-500/50',
    textoBadge: 'text-sky-400',
    bordaBadge: 'border-sky-500',
    prioridadeBase: 1000,
  },
};

export const LISTA_TIPOS_ATENDIMENTO: TipoAtendimentoInfo[] = [
  TIPOS_ATENDIMENTO.SG,
  TIPOS_ATENDIMENTO.SP,
  TIPOS_ATENDIMENTO.S8,
  TIPOS_ATENDIMENTO.PD,
  TIPOS_ATENDIMENTO.OB,
  TIPOS_ATENDIMENTO.EX,
  TIPOS_ATENDIMENTO.RT,
];

/**
 * Calcula a idade exata em anos a partir de uma data de nascimento.
 */
export function calcularIdadeEmAnos(dataNascimento?: Date | string | null): number | null {
  if (!dataNascimento) return null;
  const nasc = new Date(dataNascimento);
  if (isNaN(nasc.getTime())) return null;

  const hoje = new Date();
  let anos = hoje.getFullYear() - nasc.getFullYear();
  const m = hoje.getMonth() - nasc.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) {
    anos--;
  }
  return anos >= 0 ? anos : 0;
}

/**
 * Sugere o tipo de atendimento com base na data de nascimento, flags clínicas e sexo biológico.
 * Atendimento Obstétrico (OB) é restrito exclusivamente ao sexo biológico feminino.
 */
export function sugerirTipoAtendimento(
  dataNascimento?: Date | string | null,
  options?: { obstetrico?: boolean; preferencialManual?: boolean; sexoBiologico?: string | null }
): TipoAtendimentoCodigo {
  const isFeminino = !options?.sexoBiologico || options.sexoBiologico.toUpperCase() === 'FEMININO';
  if (options?.obstetrico && isFeminino) return 'OB';
  if (options?.preferencialManual) return 'SP';

  const idade = calcularIdadeEmAnos(dataNascimento);
  if (idade !== null) {
    if (idade >= 80) return 'S8';
    if (idade >= 60) return 'SP';
    if (idade < 12) return 'PD';
  }

  return 'SG';
}

/**
 * Formata um código de senha a partir do tipo e sequencial diário.
 * Ex: gerarCodigoSenha('SP', 14) -> 'SP-014'
 */
export function gerarCodigoSenha(tipo: TipoAtendimentoCodigo, sequencial: number): string {
  const numPad = String(Math.max(1, sequencial)).padStart(3, '0');
  return `${tipo}-${numPad}`;
}

/**
 * Normaliza e resolve o tipo de atendimento e a senha de qualquer registro,
 * garantindo compatibilidade retroativa para atendimentos legados sem senha salva.
 */
export function resolverSenhaETipo(params: {
  numeroAtendimento: string;
  senhaSalva?: string | null;
  tipoSalvo?: string | null;
  dataNascimento?: Date | string | null;
  obstetrico?: boolean;
  sexoBiologico?: string | null;
}): { senha: string; tipo: TipoAtendimentoInfo; idade: number | null } {
  const idade = calcularIdadeEmAnos(params.dataNascimento);

  // 1. Se já tem senha gravada (ex: SP-014)
  if (params.senhaSalva && /^[A-Z0-9]{2}-\d{3,4}$/.test(params.senhaSalva.trim())) {
    const prefixo = params.senhaSalva.trim().slice(0, 2).toUpperCase() as TipoAtendimentoCodigo;
    const tipoInfo = TIPOS_ATENDIMENTO[prefixo] ?? TIPOS_ATENDIMENTO.SG;
    return { senha: params.senhaSalva.trim().toUpperCase(), tipo: tipoInfo, idade };
  }

  // 2. Se tem tipo salvo
  let tipoCodigo: TipoAtendimentoCodigo = 'SG';
  if (params.tipoSalvo && params.tipoSalvo in TIPOS_ATENDIMENTO) {
    tipoCodigo = params.tipoSalvo as TipoAtendimentoCodigo;
  } else {
    tipoCodigo = sugerirTipoAtendimento(params.dataNascimento, {
      obstetrico: params.obstetrico,
      sexoBiologico: params.sexoBiologico,
    });
  }

  // 3. Extrair sufixo numérico determinístico do numeroAtendimento (ex: 20261004-A1B2 -> número derivado)
  let numSeq = 1;
  const partes = params.numeroAtendimento.split('-');
  if (partes[1]) {
    const limpo = partes[1].replace(/\D/g, '');
    if (limpo.length > 0) {
      const parsed = parseInt(limpo, 10);
      numSeq = parsed > 0 ? (parsed % 1000 || 1) : 1;
    } else {
      // hash determinístico dos chars hexadecimais
      let hash = 0;
      for (let i = 0; i < partes[1].length; i++) {
        hash = (hash * 31 + partes[1].charCodeAt(i)) % 999;
      }
      numSeq = Math.max(1, hash);
    }
  }

  const senhaGerada = gerarCodigoSenha(tipoCodigo, numSeq);
  return {
    senha: senhaGerada,
    tipo: TIPOS_ATENDIMENTO[tipoCodigo] ?? TIPOS_ATENDIMENTO.SG,
    idade,
  };
}

/**
 * Pesos para a classificação de risco de Manchester.
 */
const SCORE_MANCHESTER: Record<string, number> = {
  VERMELHO: 20000, // Emergência absoluta
  LARANJA: 15000,  // Muito urgente
  AMARELO: 10000,  // Urgente
  VERDE: 3000,     // Pouco urgente
  AZUL: 1000,      // Não urgente
  CINZA: 500,      // Observação
};

/**
 * Calcula a pontuação unificada de prioridade de um paciente na fila hospitalar.
 * Quanto maior a pontuação, mais prioritário é o paciente.
 */
export function calcularPontuacaoPrioridade(item: {
  corTriagem?: CorTriagem | string | null;
  tipoCodigo?: TipoAtendimentoCodigo | string | null;
  dataNascimento?: Date | string | null;
  tempoEsperaMinutos?: number;
  etapa?: 'TRIAGEM' | 'CONSULTÓRIO' | string;
}): number {
  let score = 0;

  // 1. Gravidade Clínica (Manchester) — Se já foi triado
  if (item.corTriagem && item.corTriagem in SCORE_MANCHESTER) {
    score += SCORE_MANCHESTER[item.corTriagem];
  }

  // 2. Prioridade Legal e Tipo de Atendimento
  const idade = calcularIdadeEmAnos(item.dataNascimento);
  const tipo = (item.tipoCodigo ?? 'SG') as TipoAtendimentoCodigo;

  if (idade !== null && idade >= 80) {
    score += 5500; // Superprioridade 80+
  } else if (tipo === 'S8') {
    score += 5500;
  } else if (tipo === 'SP' || (idade !== null && idade >= 60)) {
    score += 4200; // Prioritário 60+, PCD, Gestante
  } else if (tipo === 'OB') {
    score += 4000;
  } else if (tipo === 'PD' || (idade !== null && idade < 12)) {
    score += 3800;
  } else if (tipo === 'EX') {
    score += 2000;
  } else if (tipo === 'RT') {
    score += 1500;
  } else {
    score += 1000;
  }

  // 3. Fator de Tempo de Espera (1 minuto = 5 pontos de desempate)
  const espera = Math.max(0, item.tempoEsperaMinutos ?? 0);
  score += Math.min(espera * 5, 2000);

  return score;
}

/**
 * Função de ordenação hospitalar que garante a hierarquia:
 * 1. Vermelho/Laranja (Emergência no topo absoluto)
 * 2. Amarelo (Urgente)
 * 3. 80+ Superprioridade (Passa à frente de Verde/Azul e desempata no topo)
 * 4. Preferencial SP (Passa à frente de Verde/Azul)
 * 5. Verde / Azul
 * 6. Ordem de chegada / tempo de espera
 */
export function ordenarFilaHospitalar<T extends {
  corTriagem?: CorTriagem | string | null;
  tipoCodigo?: TipoAtendimentoCodigo | string | null;
  dataNascimento?: Date | string | null;
  tempoEsperaMinutos?: number;
  entradaFila?: Date | string;
  createdAt?: Date | string;
}>(fila: T[]): T[] {
  return [...fila].sort((a, b) => {
    // 1. Vermelho e Laranja sempre no topo absoluto
    const aCritico = a.corTriagem === 'VERMELHO' || a.corTriagem === 'LARANJA';
    const bCritico = b.corTriagem === 'VERMELHO' || b.corTriagem === 'LARANJA';

    if (aCritico && !bCritico) return -1;
    if (!aCritico && bCritico) return 1;

    if (aCritico && bCritico) {
      if (a.corTriagem === 'VERMELHO' && b.corTriagem !== 'VERMELHO') return -1;
      if (a.corTriagem !== 'VERMELHO' && b.corTriagem === 'VERMELHO') return 1;
      return (b.tempoEsperaMinutos ?? 0) - (a.tempoEsperaMinutos ?? 0);
    }

    // 2. Pontuação composta de gravidade + 80+ + legal + espera
    const scoreA = calcularPontuacaoPrioridade(a);
    const scoreB = calcularPontuacaoPrioridade(b);

    if (scoreA !== scoreB) {
      return scoreB - scoreA;
    }

    // 3. Desempate final por horário de chegada mais antigo
    const dataA = new Date(a.entradaFila ?? a.createdAt ?? 0).getTime();
    const dataB = new Date(b.entradaFila ?? b.createdAt ?? 0).getTime();
    return dataA - dataB;
  });
}
