// lib/farmacia-kits-match.ts
// Módulo de resolução e vinculação automática de kits e materiais hospitalares à dispensação da farmácia.

export interface ItemKitMaterial {
  id?: string;
  descricaoItem: string;
  quantidadePadrao: number;
  unidade: string;
  obrigatorio?: boolean;
}

export interface KitVinculadoFarmacia {
  id: string;
  codigo?: string | null;
  nome: string;
  descricao?: string | null;
  tipoVinculo: string;
  origemVinculo: 'VIA' | 'PROCEDIMENTO_OBS' | 'MEDICAMENTO_DIRETO';
  itens: ItemKitMaterial[];
}

export interface KitBancoDados {
  id: string;
  codigo?: string | null;
  nome: string;
  descricao?: string | null;
  tipoVinculo: string;
  viaAdministracao?: string | null;
  procedimentoNome?: string | null;
  ativo: boolean;
  itens: {
    id: string;
    descricaoItem: string;
    quantidadePadrao: number;
    unidade?: string | null;
    obrigatorio: boolean;
  }[];
}

/**
 * Normaliza strings para busca e correspondência
 */
function normalizar(texto: string = ''): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Extrai procedimentos e orientações médicas contidas no campo observações
 */
export function extrairProcedimentosObservacoes(observacoes?: string | null): string[] {
  if (!observacoes) return [];
  return observacoes
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .map((l) => l.replace(/^[•\-\*]\s*/, '').trim())
    .filter((l) => l.length > 0);
}

/**
 * Identifica e vincula todos os kits de procedimentos e materiais correspondentes
 * a um item de dispensação da farmácia.
 */
export function resolverKitsParaItem(
  item: {
    medicamentoNome: string;
    via: string;
    observacoes?: string | null;
    prescricao?: { observacoes?: string | null };
  },
  kitsCadastrados: KitBancoDados[]
): KitVinculadoFarmacia[] {
  const kitsEncontrados = new Map<string, KitVinculadoFarmacia>();
  const viaNorm = normalizar(item.via);
  const medNomeNorm = normalizar(item.medicamentoNome);
  const obsPresc = item.prescricao?.observacoes || item.observacoes || '';
  const obsNorm = normalizar(obsPresc);

  for (const kit of kitsCadastrados) {
    if (!kit.ativo) continue;

    const kitViaNorm = normalizar(kit.viaAdministracao || '');
    const kitProcNorm = normalizar(kit.procedimentoNome || '');
    const kitNomeNorm = normalizar(kit.nome || '');

    // 1. Vinculação por Via de Administração (EV, IM, SC, Inalatória, etc.)
    if (kit.tipoVinculo === 'VIA_ADMINISTRACAO' && kitViaNorm && viaNorm === kitViaNorm) {
      kitsEncontrados.set(kit.id, {
        id: kit.id,
        codigo: kit.codigo,
        nome: kit.nome,
        descricao: kit.descricao,
        tipoVinculo: kit.tipoVinculo,
        origemVinculo: 'VIA',
        itens: kit.itens.map((it) => ({
          id: it.id,
          descricaoItem: it.descricaoItem,
          quantidadePadrao: it.quantidadePadrao,
          unidade: it.unidade || 'UN',
          obrigatorio: it.obrigatorio,
        })),
      });
      continue;
    }

    // 2. Vinculação por Procedimento descrito em Observações ou Nome do Item
    let combinouProcedimento = false;
    if (kitProcNorm) {
      if (obsNorm.includes(kitProcNorm) || medNomeNorm.includes(kitProcNorm)) {
        combinouProcedimento = true;
      }
    }

    // Palavras-chave específicas de procedimentos hospitalares
    if (!combinouProcedimento) {
      if (
        (kit.codigo === 'KIT-PUNCAO-VENOSA' || kitNomeNorm.includes('puncao') || kitNomeNorm.includes('acesso venoso')) &&
        (obsNorm.includes('puncao') || obsNorm.includes('acesso venoso') || obsNorm.includes('jelco') || obsNorm.includes('polifix'))
      ) {
        combinouProcedimento = true;
      } else if (
        (kit.codigo === 'KIT-CURATIVO-SIMPLES' || kitNomeNorm.includes('curativo simples')) &&
        (obsNorm.includes('curativo') || medNomeNorm.includes('curativo')) &&
        !obsNorm.includes('queimadura') &&
        !obsNorm.includes('especial')
      ) {
        combinouProcedimento = true;
      } else if (
        (kit.codigo === 'KIT-CURATIVO-ESPECIAL' || kitNomeNorm.includes('curativo especial')) &&
        (obsNorm.includes('queimadura') || obsNorm.includes('curativo especial') || obsNorm.includes('ulcera') || obsNorm.includes('extensa'))
      ) {
        combinouProcedimento = true;
      } else if (
        (kit.codigo === 'KIT-SVD' || kitNomeNorm.includes('svd') || kitNomeNorm.includes('vesical de demora')) &&
        (obsNorm.includes('svd') || obsNorm.includes('foley') || obsNorm.includes('demora') || (obsNorm.includes('sondagem vesical') && !obsNorm.includes('alivio')))
      ) {
        combinouProcedimento = true;
      } else if (
        (kit.codigo === 'KIT-SVA' || kitNomeNorm.includes('sva') || kitNomeNorm.includes('vesical de alivio')) &&
        (obsNorm.includes('sva') || obsNorm.includes('alivio') || obsNorm.includes('alívio') || (obsNorm.includes('sonda uretral') && !obsNorm.includes('demora')))
      ) {
        combinouProcedimento = true;
      } else if (
        (kit.codigo === 'KIT-SNG-SNE' || kitNomeNorm.includes('nasogastrica') || kitNomeNorm.includes('enteral')) &&
        (obsNorm.includes('sng') || obsNorm.includes('sne') || obsNorm.includes('nasogastrica') || obsNorm.includes('nasoenteral') || obsNorm.includes('levine'))
      ) {
        combinouProcedimento = true;
      } else if (
        (kit.codigo === 'KIT-RETIRADA-PONTOS' || kitNomeNorm.includes('retirada de pontos') || kitNomeNorm.includes('sutura')) &&
        (obsNorm.includes('retirada de ponto') || obsNorm.includes('retirar ponto') || obsNorm.includes('sutura'))
      ) {
        combinouProcedimento = true;
      } else if (
        (kit.codigo === 'KIT-CVC' || kitNomeNorm.includes('cvc') || kitNomeNorm.includes('central')) &&
        (obsNorm.includes('cvc') || obsNorm.includes('acesso central') || obsNorm.includes('duplo lumen'))
      ) {
        combinouProcedimento = true;
      }
    }

    if (combinouProcedimento) {
      kitsEncontrados.set(kit.id, {
        id: kit.id,
        codigo: kit.codigo,
        nome: kit.nome,
        descricao: kit.descricao,
        tipoVinculo: kit.tipoVinculo,
        origemVinculo: 'PROCEDIMENTO_OBS',
        itens: kit.itens.map((it) => ({
          id: it.id,
          descricaoItem: it.descricaoItem,
          quantidadePadrao: it.quantidadePadrao,
          unidade: it.unidade || 'UN',
          obrigatorio: it.obrigatorio,
        })),
      });
    }
  }

  return Array.from(kitsEncontrados.values());
}
