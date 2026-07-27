// lib/painel-config.ts — tipos e helpers do painel de chamada

export type TipoMidiaPainel = 'imagem' | 'video'

export type MidiaPainelRotativa = {
  id: string
  url: string
  tipo?: TipoMidiaPainel
  titulo?: string
  legenda?: string
  ordem?: number
}

/** @deprecated Use MidiaPainelRotativa — mantido por compatibilidade */
export type ImagemPainelRotativa = MidiaPainelRotativa

export type ConfigPainelExibicao = {
  layoutDividido: boolean
  intervaloRotacaoSegundos: number
  posicaoMidia: 'esquerda' | 'direita'
  imagensRotativas: MidiaPainelRotativa[]
  vozAtiva: boolean
  tipoVoz: string
  corPrimaria: string
  corSecundaria: string
  corTexto: string
  mensagemPadrao: string
  velocidadeVoz: number
}

export const CONFIG_PAINEL_PADRAO: ConfigPainelExibicao = {
  layoutDividido: false,
  intervaloRotacaoSegundos: 8,
  posicaoMidia: 'esquerda',
  imagensRotativas: [],
  vozAtiva: true,
  tipoVoz: 'feminina',
  corPrimaria: '#2563eb',
  corSecundaria: '#f8fafc',
  corTexto: '#1e293b',
  mensagemPadrao: 'Comparecer ao consultório',
  velocidadeVoz: 1,
}

const EXTENSOES_VIDEO = ['.mp4', '.webm', '.mov', '.m4v', '.ogv']

export const MIME_IMAGEM_PAINEL = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const
export const MIME_VIDEO_PAINEL = ['video/mp4', 'video/webm', 'video/quicktime', 'video/ogg'] as const

export const MAX_TAMANHO_IMAGEM_PAINEL = 10 * 1024 * 1024
export const MAX_TAMANHO_VIDEO_PAINEL = 100 * 1024 * 1024

export const inferirTipoMidiaPainel = (url: string, tipo?: unknown): TipoMidiaPainel => {
  if (tipo === 'video' || tipo === 'imagem') return tipo
  const lower = url.toLowerCase().split('?')[0] ?? ''
  if (EXTENSOES_VIDEO.some((ext) => lower.endsWith(ext))) return 'video'
  if (/\.(jpe?g|png|webp|gif|svg|bmp)$/i.test(lower)) return 'imagem'
  return 'imagem'
}

export type ValidacaoUrlMidiaPainel =
  | { ok: true; url: string; tipo: TipoMidiaPainel }
  | { ok: false; erro: string }

/** Valida URL http(s) para mídia externa do painel */
export const validarUrlMidiaPainel = (
  url: string,
  tipoForcado?: TipoMidiaPainel
): ValidacaoUrlMidiaPainel => {
  const trimmed = url.trim()
  if (!trimmed) return { ok: false, erro: 'Informe uma URL.' }

  let parsed: URL
  try {
    parsed = new URL(trimmed)
  } catch {
    return { ok: false, erro: 'URL inválida.' }
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return { ok: false, erro: 'Use uma URL que comece com http:// ou https://.' }
  }

  const tipo = tipoForcado ?? inferirTipoMidiaPainel(trimmed)
  return { ok: true, url: trimmed, tipo }
}

export const tipoMidiaDeArquivo = (file: File): TipoMidiaPainel | null => {
  const mime = file.type.toLowerCase()
  if (MIME_IMAGEM_PAINEL.includes(mime as (typeof MIME_IMAGEM_PAINEL)[number]) || mime.startsWith('image/')) {
    return 'imagem'
  }
  if (MIME_VIDEO_PAINEL.includes(mime as (typeof MIME_VIDEO_PAINEL)[number]) || mime.startsWith('video/')) {
    return 'video'
  }
  const nome = file.name.toLowerCase()
  if (EXTENSOES_VIDEO.some((ext) => nome.endsWith(ext))) return 'video'
  if (/\.(jpe?g|png|webp|gif)$/i.test(nome)) return 'imagem'
  return null
}

export const normalizarImagensRotativas = (raw: unknown): MidiaPainelRotativa[] => {
  if (!Array.isArray(raw)) return []
  const itens: MidiaPainelRotativa[] = []
  raw.forEach((item, idx) => {
    if (!item || typeof item !== 'object') return
    const o = item as Record<string, unknown>
    const url = typeof o.url === 'string' ? o.url.trim() : ''
    if (!url) return
    itens.push({
      id: typeof o.id === 'string' && o.id.trim() ? o.id : `midia-${idx}`,
      url,
      tipo: inferirTipoMidiaPainel(url, o.tipo),
      titulo: typeof o.titulo === 'string' ? o.titulo : undefined,
      legenda: typeof o.legenda === 'string' ? o.legenda : undefined,
      ordem: typeof o.ordem === 'number' ? o.ordem : idx,
    })
  })
  return itens.sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0))
}

export const configPainelFromDb = (row: Record<string, unknown> | null | undefined): ConfigPainelExibicao => {
  if (!row) return { ...CONFIG_PAINEL_PADRAO }
  const pos = row.posicaoMidia === 'direita' ? 'direita' : 'esquerda'
  return {
    layoutDividido: Boolean(row.layoutDividido),
    intervaloRotacaoSegundos:
      typeof row.intervaloRotacaoSegundos === 'number' && row.intervaloRotacaoSegundos >= 3
        ? Math.min(row.intervaloRotacaoSegundos, 120)
        : CONFIG_PAINEL_PADRAO.intervaloRotacaoSegundos,
    posicaoMidia: pos,
    imagensRotativas: normalizarImagensRotativas(row.imagensRotativas),
    vozAtiva: row.vozAtiva !== false,
    tipoVoz: typeof row.tipoVoz === 'string' ? row.tipoVoz : CONFIG_PAINEL_PADRAO.tipoVoz,
    corPrimaria: typeof row.corPrimaria === 'string' ? row.corPrimaria : CONFIG_PAINEL_PADRAO.corPrimaria,
    corSecundaria: typeof row.corSecundaria === 'string' ? row.corSecundaria : CONFIG_PAINEL_PADRAO.corSecundaria,
    corTexto: typeof row.corTexto === 'string' ? row.corTexto : CONFIG_PAINEL_PADRAO.corTexto,
    mensagemPadrao: typeof row.mensagemPadrao === 'string' ? row.mensagemPadrao : CONFIG_PAINEL_PADRAO.mensagemPadrao,
    velocidadeVoz:
      typeof row.velocidadeVoz === 'number' ? row.velocidadeVoz : CONFIG_PAINEL_PADRAO.velocidadeVoz,
  }
}

export const deveExibirMidiaRotativa = (config: ConfigPainelExibicao): boolean =>
  Boolean(config.layoutDividido) && config.imagensRotativas.length > 0
