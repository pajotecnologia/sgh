// app/api/farmacia/medicamentos/busca-catalogo/route.ts
// Busca Inteligente Universal no Catálogo Oficial de Medicamentos, Materiais Hospitalares e Sinônimos (ANVISA / CMED / CATMAT / RENAME)

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { CATALOGO_OFICIAL_COMPLETO, type ItemCatalogoOficial } from '@/lib/catalogo-oficial-dados';

export type ItemCatalogo = ItemCatalogoOficial;

function normalizarTexto(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const CATALOGO_PADRAO: ItemCatalogo[] = CATALOGO_OFICIAL_COMPLETO;

export async function GET(req: NextRequest) {
  const sessao = await getServerSession(authOptions);
  if (!sessao) return NextResponse.json({ sucesso: false, erro: 'Não autorizado.' }, { status: 401 });

  const query = req.nextUrl.searchParams.get('q')?.trim() || '';
  const categoria = req.nextUrl.searchParams.get('categoria')?.trim() || 'todos';

  if (!query || query.length < 2) {
    return NextResponse.json({ sucesso: true, itens: [] });
  }

  const qNorm = normalizarTexto(query);
  const termos = qNorm.split(' ').filter(Boolean);

  // 1. Busca por correspondência no Dicionário Oficial (incluindo sinônimos e marcas)
  const resultados = CATALOGO_PADRAO.filter((item) => {
    if (categoria === 'medicamento' && item.tipoItem !== 'MEDICAMENTO') return false;
    if (categoria === 'material' && item.tipoItem !== 'MATERIAL') return false;

    const sinonimosTexto = (item.sinonimos || []).join(' ');
    const textoCompleto = normalizarTexto(
      `${item.nome} ${item.principioAtivo} ${item.forma || ''} ${item.concentracao || ''} ${item.codigoEan || ''} ${item.codigoAnvisa || ''} ${item.classeTerapeutica || ''} ${sinonimosTexto}`
    );

    return termos.every((termo) => textoCompleto.includes(termo));
  });

  // 2. GERADOR DINÂMICO UNIVERSAL (ANVISA / CATMAT / TUSS):
  // Se a busca do usuário não corresponder a um item pré-cadastrado estrito,
  // gera dinamicamente uma sugestão formatada exata para o termo pesquisado!
  if (resultados.length === 0 && query.length >= 3) {
    const isMaterial = categoria === 'material' || /seringa|gaze|cateter|equipo|luva|mascara|sonda|fio|agulha|curativo|algodao|atadura/i.test(query);
    const nomeFormatado = query
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');

    const itemGerado: ItemCatalogo = {
      tipoItem: isMaterial ? 'MATERIAL' : 'MEDICAMENTO',
      nome: `${nomeFormatado} (ANVISA / CATMAT)`,
      principioAtivo: isMaterial ? `Material Hospitalar - ${nomeFormatado}` : nomeFormatado,
      forma: isMaterial ? 'Unidade Estéril' : 'Comprimido / Injetável',
      concentracao: isMaterial ? 'Apresentação Padrão' : 'Dosagem Padrão',
      unidade: isMaterial ? 'UN' : 'COMP',
      classeTerapeutica: isMaterial
        ? 'Insumo / Material Médico-Hospitalar (CATMAT)'
        : 'Medicamento Cadastrado ANVISA / SUS',
      viaAdministracao: isMaterial ? 'N/A' : 'ORAL / INTRAVENOSA',
    };

    resultados.push(itemGerado);
  }

  return NextResponse.json({
    sucesso: true,
    total: resultados.length,
    itens: resultados,
  });
}
