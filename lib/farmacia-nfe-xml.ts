// lib/farmacia-nfe-xml.ts — Parser simplificado de XML NF-e (modelo 55)

export type ItemNfeParseado = {
  indice: number
  codigoProduto: string | null
  descricao: string
  quantidade: number
  valorUnitario: number | null
  lote: string | null
  validade: string | null
  ncm: string | null
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
    const rastroBloco = extrairBlocos(det, 'rastro')[0] ?? ''

    const descricao = extrairTag(prodBloco, 'xProd') ?? `Item ${idx + 1}`
    const qCom = parseNumero(extrairTag(prodBloco, 'qCom'))
    const vUnCom = extrairTag(prodBloco, 'vUnCom')
    const valorUnitario = vUnCom != null ? parseNumero(vUnCom) : null

    const lote = extrairTag(rastroBloco, 'nLote')
    const validadeRaw = extrairTag(rastroBloco, 'dVal') ?? extrairTag(rastroBloco, 'dFab')
    const validade = parseDataNfe(validadeRaw)

    const quantidade = Math.max(1, Math.round(qCom))

    return {
      indice: idx + 1,
      codigoProduto: extrairTag(prodBloco, 'cProd'),
      descricao,
      quantidade,
      valorUnitario,
      lote,
      validade,
      ncm: extrairTag(prodBloco, 'NCM'),
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
