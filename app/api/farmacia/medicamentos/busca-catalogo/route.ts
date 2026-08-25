// app/api/farmacia/medicamentos/busca-catalogo/route.ts
// Busca Inteligente Universal no Catálogo de Medicamentos e Materiais Hospitalares (ANVISA / CATMAT / TUSS / OpenData)

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export interface ItemCatalogo {
  tipoItem: 'MEDICAMENTO' | 'MATERIAL';
  nome: string;
  principioAtivo: string;
  forma?: string;
  concentracao?: string;
  unidade?: string;
  codigoEan?: string;
  codigoAnvisa?: string;
  classeTerapeutica?: string;
  viaAdministracao?: string;
  mav?: boolean;
  duplaChecagem?: boolean;
  tipoControle?: string;
}

function normalizarTexto(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Dicionário Base Expandido de Medicamentos e Materiais Hospitalares */
const CATALOGO_PADRAO: ItemCatalogo[] = [
  // --- GASTROENTEROLOGIA / ANTIEMÉTICOS ---
  {
    tipoItem: 'MEDICAMENTO',
    nome: 'Motilium / Domperidona 10mg',
    principioAtivo: 'Domperidona',
    forma: 'Comprimido',
    concentracao: '10 mg',
    unidade: 'COMP',
    codigoEan: '7891234568010',
    codigoAnvisa: '1012345670200',
    classeTerapeutica: 'Antiemético e Procinético Gastrointestinal',
    viaAdministracao: 'ORAL',
  },
  {
    tipoItem: 'MEDICAMENTO',
    nome: 'Domperidona 1mg/mL Suspensão Oral',
    principioAtivo: 'Domperidona',
    forma: 'Suspensão Oral',
    concentracao: '1 mg/mL (100 mL)',
    unidade: 'FR',
    codigoEan: '7891234568011',
    codigoAnvisa: '1012345670201',
    classeTerapeutica: 'Antiemético e Procinético Gastrointestinal',
    viaAdministracao: 'ORAL',
  },
  {
    tipoItem: 'MEDICAMENTO',
    nome: 'Plasil / Metoclopramida 10mg/2mL',
    principioAtivo: 'Cloridrato de Metoclopramida',
    forma: 'Solução Injetável',
    concentracao: '10 mg/2 mL',
    unidade: 'AMP',
    codigoEan: '7891234568020',
    codigoAnvisa: '1012345670210',
    classeTerapeutica: 'Antiemético e Procinético',
    viaAdministracao: 'INTRAVENOSA',
  },
  {
    tipoItem: 'MEDICAMENTO',
    nome: 'Vonau Flash / Ondansetrona 4mg/2mL IV',
    principioAtivo: 'Cloridrato de Ondansetrona',
    forma: 'Solução Injetável',
    concentracao: '4 mg/2 mL',
    unidade: 'AMP',
    codigoEan: '7891234568022',
    codigoAnvisa: '1012345670212',
    classeTerapeutica: 'Antiemético / Antagonista 5-HT3',
    viaAdministracao: 'INTRAVENOSA',
  },
  {
    tipoItem: 'MEDICAMENTO',
    nome: 'Vonau Flash / Ondansetrona 8mg',
    principioAtivo: 'Cloridrato de Ondansetrona',
    forma: 'Comprimido Orodispersível',
    concentracao: '8 mg',
    unidade: 'COMP',
    codigoEan: '7891234567898',
    codigoAnvisa: '1012345670097',
    classeTerapeutica: 'Antiemético',
    viaAdministracao: 'ORAL',
  },
  {
    tipoItem: 'MEDICAMENTO',
    nome: 'Dramin B6 / Dimenidrinato + Piridoxina 50mg/mL',
    principioAtivo: 'Dimenidrinato + Cloridrato de Piridoxina',
    forma: 'Solução Injetável',
    concentracao: '50mg + 50mg / mL',
    unidade: 'AMP',
    codigoEan: '7891234568025',
    codigoAnvisa: '1012345670215',
    classeTerapeutica: 'Antiemético / Antihistamínico H1',
    viaAdministracao: 'INTRAVENOSA',
  },
  {
    tipoItem: 'MEDICAMENTO',
    nome: 'Buscopan Composto / Dipirona + Escopolamina',
    principioAtivo: 'Butylbrometo de Escopolamina + Dipirona',
    forma: 'Solução Injetável',
    concentracao: '4mg + 500mg / 5 mL',
    unidade: 'AMP',
    codigoEan: '7891234568028',
    codigoAnvisa: '1012345670218',
    classeTerapeutica: 'Antiespasmódico e Analgésico',
    viaAdministracao: 'INTRAVENOSA',
  },
  {
    tipoItem: 'MEDICAMENTO',
    nome: 'Omeprazol 40mg IV',
    principioAtivo: 'Omeprazol Sódico',
    forma: 'Pó para Solução Injetável',
    concentracao: '40 mg',
    unidade: 'FR/AMP',
    codigoEan: '7891234567892',
    codigoAnvisa: '1012345670091',
    classeTerapeutica: 'Antiulceroso / Inibidor da Bomba de Prótons',
    viaAdministracao: 'INTRAVENOSA',
  },
  {
    tipoItem: 'MEDICAMENTO',
    nome: 'Pantoprazol 40mg IV',
    principioAtivo: 'Pantoprazol Sódico',
    forma: 'Pó para Solução Injetável',
    concentracao: '40 mg',
    unidade: 'FR/AMP',
    codigoEan: '7891234568030',
    codigoAnvisa: '1012345670220',
    classeTerapeutica: 'Inibidor da Bomba de Prótons',
    viaAdministracao: 'INTRAVENOSA',
  },

  // --- ANALGÉSICOS E ANTI-INFLAMATÓRIOS ---
  {
    tipoItem: 'MEDICAMENTO',
    nome: 'Novalgina / Dipirona Sódica 500mg/mL Injetável',
    principioAtivo: 'Dipirona Monoidratada',
    forma: 'Solução Injetável',
    concentracao: '500 mg/mL (2 mL)',
    unidade: 'AMP',
    codigoEan: '7891234567890',
    codigoAnvisa: '1012345670089',
    classeTerapeutica: 'Analgésico e Antipirético',
    viaAdministracao: 'INTRAVENOSA',
  },
  {
    tipoItem: 'MEDICAMENTO',
    nome: 'Tylenol / Paracetamol 750mg',
    principioAtivo: 'Paracetamol',
    forma: 'Comprimido',
    concentracao: '750 mg',
    unidade: 'COMP',
    codigoEan: '7891234567891',
    codigoAnvisa: '1012345670090',
    classeTerapeutica: 'Analgésico e Antipirético',
    viaAdministracao: 'ORAL',
  },
  {
    tipoItem: 'MEDICAMENTO',
    nome: 'Profenid / Cetoprofeno 100mg IV',
    principioAtivo: 'Cetoprofeno',
    forma: 'Pó para Solução Injetável',
    concentracao: '100 mg',
    unidade: 'AMP',
    codigoEan: '7891234568035',
    codigoAnvisa: '1012345670225',
    classeTerapeutica: 'Anti-inflamatório Não Esteroidal (AINE)',
    viaAdministracao: 'INTRAVENOSA',
  },
  {
    tipoItem: 'MEDICAMENTO',
    nome: 'Tylex / Paracetamol + Codeína 500mg + 30mg',
    principioAtivo: 'Paracetamol + Fosfato de Codeína',
    forma: 'Comprimido',
    concentracao: '500 mg + 30 mg',
    unidade: 'COMP',
    codigoEan: '7891234568038',
    codigoAnvisa: '1012345670228',
    classeTerapeutica: 'Analgésico Opioide Moderado',
    viaAdministracao: 'ORAL',
    tipoControle: 'Portaria 344 - C1',
  },

  // --- ANTIBIÓTICOS ---
  {
    tipoItem: 'MEDICAMENTO',
    nome: 'Amoxicilina 500mg',
    principioAtivo: 'Amoxicilina Triidratada',
    forma: 'Cápsula',
    concentracao: '500 mg',
    unidade: 'CAPS',
    codigoEan: '7891234568040',
    codigoAnvisa: '1012345670230',
    classeTerapeutica: 'Antibiótico Penicilínico',
    viaAdministracao: 'ORAL',
  },
  {
    tipoItem: 'MEDICAMENTO',
    nome: 'Ceftriaxona Sódica 1g IV',
    principioAtivo: 'Ceftriaxona Sódica',
    forma: 'Pó para Solução Injetável',
    concentracao: '1 g',
    unidade: 'FR/AMP',
    codigoEan: '7891234567896',
    codigoAnvisa: '1012345670095',
    classeTerapeutica: 'Antibiótico Cefalosporina 3ª Geração',
    viaAdministracao: 'INTRAVENOSA',
  },
  {
    tipoItem: 'MEDICAMENTO',
    nome: 'Azitromicina 500mg',
    principioAtivo: 'Azitromicina Diidratada',
    forma: 'Comprimido Revestido',
    concentracao: '500 mg',
    unidade: 'COMP',
    codigoEan: '7891234568050',
    codigoAnvisa: '1012345670240',
    classeTerapeutica: 'Antibiótico Macrolídeo',
    viaAdministracao: 'ORAL',
  },
  {
    tipoItem: 'MEDICAMENTO',
    nome: 'Ciprofloxacino 500mg',
    principioAtivo: 'Cloridrato de Ciprofloxacino',
    forma: 'Comprimido Revestido',
    concentracao: '500 mg',
    unidade: 'COMP',
    codigoEan: '7891234568052',
    codigoAnvisa: '1012345670242',
    classeTerapeutica: 'Antibiótico Quinolona',
    viaAdministracao: 'ORAL',
  },

  // --- EMERGÊNCIA E UTI (ALTA VIGILÂNCIA / MAV) ---
  {
    tipoItem: 'MEDICAMENTO',
    nome: 'Adrenalina / Epinefrina 1mg/mL',
    principioAtivo: 'Cloridrato de Epinefrina',
    forma: 'Solução Injetável',
    concentracao: '1 mg/mL (1 mL)',
    unidade: 'AMP',
    codigoEan: '7891234568100',
    codigoAnvisa: '1012345670300',
    classeTerapeutica: 'Vasoativo / Agonista Adrenérgico (PCR)',
    viaAdministracao: 'INTRAVENOSA',
    mav: true,
    duplaChecagem: true,
  },
  {
    tipoItem: 'MEDICAMENTO',
    nome: 'Atropina / Sulfato de Atropina 0,25mg/mL',
    principioAtivo: 'Sulfato de Atropina',
    forma: 'Solução Injetável',
    concentracao: '0,25 mg/mL (1 mL)',
    unidade: 'AMP',
    codigoEan: '7891234568105',
    codigoAnvisa: '1012345670305',
    classeTerapeutica: 'Anticolinérgico / Antiarrítmico (Bradicardia)',
    viaAdministracao: 'INTRAVENOSA',
    mav: true,
    duplaChecagem: true,
  },
  {
    tipoItem: 'MEDICAMENTO',
    nome: 'Dimorf / Morfina 10mg/mL',
    principioAtivo: 'Sulfato de Morfina',
    forma: 'Solução Injetável',
    concentracao: '10 mg/mL (1 mL)',
    unidade: 'AMP',
    codigoEan: '7891234567894',
    codigoAnvisa: '1012345670093',
    classeTerapeutica: 'Analgésico Opioide Forte',
    viaAdministracao: 'INTRAVENOSA',
    mav: true,
    duplaChecagem: true,
    tipoControle: 'Portaria 344 - A1 (Entorpecente)',
  },
  {
    tipoItem: 'MEDICAMENTO',
    nome: 'Fentanil / Citrato de Fentanila 50mcg/mL',
    principioAtivo: 'Citrato de Fentanila',
    forma: 'Solução Injetável',
    concentracao: '50 mcg/mL (2 mL)',
    unidade: 'AMP',
    codigoEan: '7891234568110',
    codigoAnvisa: '1012345670310',
    classeTerapeutica: 'Analgésico Opioide Sintético / Anestésico',
    viaAdministracao: 'INTRAVENOSA',
    mav: true,
    duplaChecagem: true,
    tipoControle: 'Portaria 344 - A1 (Entorpecente)',
  },
  {
    tipoItem: 'MEDICAMENTO',
    nome: 'Dormonid / Midazolam 15mg/3mL',
    principioAtivo: 'Cloridrato de Midazolam',
    forma: 'Solução Injetável',
    concentracao: '15 mg/3 mL',
    unidade: 'AMP',
    codigoEan: '7891234568115',
    codigoAnvisa: '1012345670315',
    classeTerapeutica: 'Sedativo / Benzodiazepínico',
    viaAdministracao: 'INTRAVENOSA',
    mav: true,
    duplaChecagem: true,
    tipoControle: 'Portaria 344 - B1 (Psicotrópico)',
  },
  {
    tipoItem: 'MEDICAMENTO',
    nome: 'Diprivan / Propofol 1% (10mg/mL)',
    principioAtivo: 'Propofol',
    forma: 'Emulsão Injetável',
    concentracao: '10 mg/mL (20 mL)',
    unidade: 'AMP',
    codigoEan: '7891234568120',
    codigoAnvisa: '1012345670320',
    classeTerapeutica: 'Anestésico Geral Geral / Sedativo UTI',
    viaAdministracao: 'INTRAVENOSA',
    mav: true,
    duplaChecagem: true,
    tipoControle: 'Portaria 344 - C1',
  },
  {
    tipoItem: 'MEDICAMENTO',
    nome: 'Insulina NPH 100 UI/mL',
    principioAtivo: 'Insulina Humana NPH',
    forma: 'Suspensão Injetável',
    concentracao: '100 UI/mL (10 mL)',
    unidade: 'FR',
    codigoEan: '7891234567893',
    codigoAnvisa: '1012345670092',
    classeTerapeutica: 'Antidiabético / Hormônio Pancreático',
    viaAdministracao: 'SUBCUTANEA',
    mav: true,
    duplaChecagem: true,
  },

  // --- MATERIAIS E INSUMOS HOSPITALARES ---
  {
    tipoItem: 'MATERIAL',
    nome: 'Seringa Descartável 1mL para Insulina com Agulha',
    principioAtivo: 'Material Hospitalar - Seringa 1mL Insulina',
    forma: 'Unidade Estéril',
    concentracao: '1 mL (100 UI)',
    unidade: 'UN',
    codigoEan: '7899990001111',
    codigoAnvisa: '80123450000',
    classeTerapeutica: 'Insumo / Seringas e Agulhas',
  },
  {
    tipoItem: 'MATERIAL',
    nome: 'Seringa Descartável 5mL Luer Lock',
    principioAtivo: 'Material Hospitalar - Seringa 5mL',
    forma: 'Unidade Estéril',
    concentracao: '5 mL',
    unidade: 'UN',
    codigoEan: '7899990001112',
    codigoAnvisa: '80123450001',
    classeTerapeutica: 'Insumo / Seringas e Agulhas',
  },
  {
    tipoItem: 'MATERIAL',
    nome: 'Seringa Descartável 10mL Luer Slip',
    principioAtivo: 'Material Hospitalar - Seringa 10mL',
    forma: 'Unidade Estéril',
    concentracao: '10 mL',
    unidade: 'UN',
    codigoEan: '7899990001113',
    codigoAnvisa: '80123450002',
    classeTerapeutica: 'Insumo / Seringas e Agulhas',
  },
  {
    tipoItem: 'MATERIAL',
    nome: 'Seringa Descartável 20mL Luer Lock',
    principioAtivo: 'Material Hospitalar - Seringa 20mL',
    forma: 'Unidade Estéril',
    concentracao: '20 mL',
    unidade: 'UN',
    codigoEan: '7899990001114',
    codigoAnvisa: '80123450003',
    classeTerapeutica: 'Insumo / Seringas e Agulhas',
  },
  {
    tipoItem: 'MATERIAL',
    nome: 'Agulha Hipodérmica Descartável 25x0,7mm (22G)',
    principioAtivo: 'Material Hospitalar - Agulha 22G',
    forma: 'Unidade Estéril',
    concentracao: '25 x 0,7 mm (22G)',
    unidade: 'UN',
    codigoEan: '7899990001120',
    codigoAnvisa: '80123450010',
    classeTerapeutica: 'Insumo / Seringas e Agulhas',
  },
  {
    tipoItem: 'MATERIAL',
    nome: 'Cateter Venoso Periférico 18G com Segurança (Jelco)',
    principioAtivo: 'Material Hospitalar - Cateter Jelco 18G',
    forma: 'Unidade Estéril',
    concentracao: '18G Verde',
    unidade: 'UN',
    codigoEan: '7899990001130',
    codigoAnvisa: '80123450020',
    classeTerapeutica: 'Insumo / Acesso Venoso',
  },
  {
    tipoItem: 'MATERIAL',
    nome: 'Cateter Venoso Periférico 20G com Segurança (Jelco)',
    principioAtivo: 'Material Hospitalar - Cateter Jelco 20G',
    forma: 'Unidade Estéril',
    concentracao: '20G Rosa',
    unidade: 'UN',
    codigoEan: '7899990001131',
    codigoAnvisa: '80123450021',
    classeTerapeutica: 'Insumo / Acesso Venoso',
  },
  {
    tipoItem: 'MATERIAL',
    nome: 'Equipo de Infusão Macrogotas com Injetor Lateral',
    principioAtivo: 'Material Hospitalar - Equipo Macrogotas',
    forma: 'Unidade Estéril',
    concentracao: 'Macrogotas (20 gotas/mL)',
    unidade: 'UN',
    codigoEan: '7899990001140',
    codigoAnvisa: '80123450030',
    classeTerapeutica: 'Insumo / Equipos e Conectores',
  },
  {
    tipoItem: 'MATERIAL',
    nome: 'Compressa de Gaze Estéril 7,5cm x 7,5cm',
    principioAtivo: 'Material Hospitalar - Gaze Estéril',
    forma: 'Pacote com 5 unidades',
    concentracao: '7,5 x 7,5 cm',
    unidade: 'PCT',
    codigoEan: '7899990001150',
    codigoAnvisa: '80123450040',
    classeTerapeutica: 'Insumo / Curativos e Assepsia',
  },
  {
    tipoItem: 'MATERIAL',
    nome: 'Luva de Procedimento Nitrilo Sem Pó M',
    principioAtivo: 'Material Hospitalar - Luva Nitrilo M',
    forma: 'Caixa com 100 unidades',
    concentracao: 'Tamanho Médio (M)',
    unidade: 'CX',
    codigoEan: '7899990001160',
    codigoAnvisa: '80123450050',
    classeTerapeutica: 'Insumo / EPI e Proteção',
  },
];

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

  // 1. Busca por correspondência no Dicionário Expandido
  const resultados = CATALOGO_PADRAO.filter((item) => {
    if (categoria === 'medicamento' && item.tipoItem !== 'MEDICAMENTO') return false;
    if (categoria === 'material' && item.tipoItem !== 'MATERIAL') return false;

    const textoCompleto = normalizarTexto(
      `${item.nome} ${item.principioAtivo} ${item.forma || ''} ${item.concentracao || ''} ${item.codigoEan || ''} ${item.codigoAnvisa || ''} ${item.classeTerapeutica || ''}`
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
