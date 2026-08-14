// lib/farmacia-nfe-xml.ts — Parser simplificado de XML NF-e (modelo 55)

export type ItemNfeParseado = {
  indice: number
  codigoProduto: string | null
  codigoEan: string | null
  codigoAnvisa: string | null
  descricao: string
  ncm: string | null
  cfop: string | null
  unidadeComercial: string | null
  quantidadeComercial: number
  valorUnitarioComercial: number | null
  valorTotalProduto: number | null
  unidadeTributavel: string | null
  quantidadeTributavel: number | null
  valorUnitarioTributavel: number | null
  vPMC: number | null
  lote: string | null
  quantidadeLote: number | null
  dataFabricacao: string | null
  validade: string | null
  // Compatibilidade com campos antigos
  quantidade: number
  valorUnitario: number | null
}

export type NfeParseada = {
  numeroNota: string
  serie: string | null
  chaveNfe: string | null
  fornecedorNome: string | null
  fornecedorCnpj: string | null
  emitidaEm: string | null
  itens: ItemNfeParseado[]
  avisos: string[]
}

const TAG_RE = /<([a-zA-Z0-9:]+)[^>]*>([\s\S]*?)<\/\1>/g

function extrairTag(conteudo: string, tag: string): string | null {
  const re = new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, 'i')
  const m = conteudo.match(re)
  return m?.[1]?.trim() ?? null
}

function extrairBlocos(conteudo: string, tag: string): string[] {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'gi')
  const blocos: string[] = []
  let m: RegExpExecArray | null
  while ((m = re.exec(conteudo)) !== null) {
    blocos.push(m[1])
  }
  return blocos
}

function parseNumero(val: string | null): number {
  if (!val) return 0
  const n = parseFloat(val.replace(',', '.'))
  return Number.isFinite(n) ? n : 0
}

function formatarCnpj(raw: string | null): string | null {
  if (!raw) return null
  const digits = raw.replace(/\D/g, '')
  return digits.length >= 11 ? digits : null
}

function parseDataNfe(raw: string | null): string | null {
  if (!raw) return null
  const d = raw.slice(0, 10)
  return /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : null
}

function sanitizarXml(xml: string): string {
  return xml
    .replace(/^\uFEFF/, '')
    .replace(/<\?xml[^?]*\?>/i, '')
    .trim()
}

export function parsearXmlNfe(xmlRaw: string): NfeParseada {
  const avisos: string[] = []
  const xml = sanitizarXml(xmlRaw)

  if (!xml.includes('<') || !xml.includes('>')) {
    throw new Error('Arquivo XML inválido.')
  }

  if (xml.length > 5_000_000) {
    throw new Error('Arquivo XML excede o tamanho máximo permitido (5 MB).')
  }

  const infNfeMatch = xml.match(/<infNFe[^>]*Id="([^"]*)"/i)
  const chaveBruta = infNfeMatch?.[1]?.replace(/^NFe/i, '') ?? null
  const chaveNfe = chaveBruta && chaveBruta.length === 44 ? chaveBruta : null

  const ideBloco = extrairBlocos(xml, 'ide')[0] ?? ''
  const emitBloco = extrairBlocos(xml, 'emit')[0] ?? ''

  const numeroNota = extrairTag(ideBloco, 'nNF') ?? extrairTag(xml, 'nNF')
  if (!numeroNota) {
    throw new Error('XML NF-e: número da nota (nNF) não encontrado.')
  }

  const serie = extrairTag(ideBloco, 'serie') ?? extrairTag(xml, 'serie')
  const dhEmi = extrairTag(ideBloco, 'dhEmi') ?? extrairTag(ideBloco, 'dEmi')
  const emitidaEm = parseDataNfe(dhEmi)

  const fornecedorNome = extrairTag(emitBloco, 'xNome') ?? extrairTag(emitBloco, 'xFant')
  const fornecedorCnpj =
    formatarCnpj(extrairTag(emitBloco, 'CNPJ')) ?? formatarCnpj(extrairTag(emitBloco, 'CPF'))

  const detBlocos = extrairBlocos(xml, 'det')
  if (detBlocos.length === 0) {
    avisos.push('Nenhum item (det) encontrado no XML.')
  }

  const itens: ItemNfeParseado[] = detBlocos.map((det, idx) => {
    const prodBloco = extrairBlocos(det, 'prod')[0] ?? det
    const medBloco = extrairBlocos(det, 'med')[0] ?? extrairBlocos(det, 'prodEspecifico')[0] ?? ''
    const rastroBloco = extrairBlocos(det, 'rastro')[0] ?? ''

    const codigoProduto = extrairTag(prodBloco, 'cProd')
    const eanRaw = extrairTag(prodBloco, 'cEAN') ?? extrairTag(prodBloco, 'cEANTrib')
    const codigoEan = eanRaw && eanRaw !== 'SEM GTIN' ? eanRaw : null

    const codigoAnvisa = extrairTag(medBloco, 'cProdANVISA') ?? extrairTag(det, 'cProdANVISA')
    const vPMCRaw = extrairTag(medBloco, 'vPMC') ?? extrairTag(det, 'vPMC')
    const vPMC = vPMCRaw ? parseNumero(vPMCRaw) : null

    const descricao = extrairTag(prodBloco, 'xProd') ?? `Item ${idx + 1}`
    const ncm = extrairTag(prodBloco, 'NCM')
    const cfop = extrairTag(prodBloco, 'CFOP')

    const uCom = extrairTag(prodBloco, 'uCom')
    const qCom = parseNumero(extrairTag(prodBloco, 'qCom'))
    const vUnComRaw = extrairTag(prodBloco, 'vUnCom')
    const valorUnitarioComercial = vUnComRaw != null ? parseNumero(vUnComRaw) : null
    const vProdRaw = extrairTag(prodBloco, 'vProd')
    const valorTotalProduto = vProdRaw != null ? parseNumero(vProdRaw) : null

    const uTrib = extrairTag(prodBloco, 'uTrib')
    const qTribRaw = extrairTag(prodBloco, 'qTrib')
    const quantidadeTributavel = qTribRaw ? parseNumero(qTribRaw) : null
    const vUnTribRaw = extrairTag(prodBloco, 'vUnTrib')
    const valorUnitarioTributavel = vUnTribRaw ? parseNumero(vUnTribRaw) : null

    const lote = extrairTag(rastroBloco, 'nLote') ?? extrairTag(det, 'nLote')
    const qLoteRaw = extrairTag(rastroBloco, 'qLote')
    const quantidadeLote = qLoteRaw ? parseNumero(qLoteRaw) : null

    const dataFabricacao = parseDataNfe(extrairTag(rastroBloco, 'dFab') ?? extrairTag(det, 'dFab'))
    const validade = parseDataNfe(extrairTag(rastroBloco, 'dVal') ?? extrairTag(det, 'dVal'))

    const quantidade = Math.max(1, Math.round(qCom))

    return {
      indice: idx + 1,
      codigoProduto,
      codigoEan,
      codigoAnvisa,
      descricao,
      ncm,
      cfop,
      unidadeComercial: uCom,
      quantidadeComercial: qCom,
      valorUnitarioComercial,
      valorTotalProduto,
      unidadeTributavel: uTrib,
      quantidadeTributavel,
      valorUnitarioTributavel,
      vPMC,
      lote,
      quantidadeLote,
      dataFabricacao,
      validade,
      // Compatibilidade retroativa
      quantidade,
      valorUnitario: valorUnitarioComercial,
    }
  })

  if (itens.length > 500) {
    throw new Error('XML contém mais de 500 itens — limite excedido.')
  }

  return {
    numeroNota,
    serie,
    chaveNfe,
    fornecedorNome,
    fornecedorCnpj,
    emitidaEm,
    itens,
    avisos,
  }
}
