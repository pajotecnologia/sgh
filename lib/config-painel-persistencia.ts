// lib/config-painel-persistencia.ts — normalização para gravar ConfigPainel no banco

import type { Prisma } from '@prisma/client'
import {
  CONFIG_PAINEL_PADRAO,
  configPainelFromDb,
  normalizarImagensRotativas,
  type ConfigPainelExibicao,
} from '@/lib/painel-config'

export type DadosConfigPainelPrisma = {
  vozAtiva: boolean
  tipoVoz: string
  corPrimaria: string
  corSecundaria: string
  corTexto: string
  mensagemPadrao: string
  velocidadeVoz: number
  layoutDividido: boolean
  intervaloRotacaoSegundos: number
  posicaoMidia: string
  imagensRotativas: Prisma.InputJsonValue
}

const limitarTexto = (valor: unknown, max: number, padrao: string): string => {
  if (typeof valor !== 'string' || !valor.trim()) return padrao
  return valor.trim().slice(0, max)
}

const numeroIntervalo = (valor: unknown): number => {
  const n = typeof valor === 'number' ? valor : parseInt(String(valor ?? ''), 10)
  if (!Number.isFinite(n)) return CONFIG_PAINEL_PADRAO.intervaloRotacaoSegundos
  return Math.min(120, Math.max(3, n))
}

const numeroVelocidade = (valor: unknown): number => {
  const n = typeof valor === 'number' ? valor : parseFloat(String(valor ?? ''))
  if (!Number.isFinite(n)) return CONFIG_PAINEL_PADRAO.velocidadeVoz
  return Math.min(1.5, Math.max(0.5, n))
}

/** Converte body/state em objeto seguro para create/update Prisma */
export const dadosConfigPainelParaPrisma = (body: unknown): DadosConfigPainelPrisma => {
  const b = body && typeof body === 'object' ? (body as Record<string, unknown>) : {}

  const layoutDividido = Boolean(b.layoutDividido)
  const midias = normalizarImagensRotativas(b.imagensRotativas).map((m, idx) => ({
    id: m.id,
    url: m.url,
    tipo: m.tipo ?? 'imagem',
    ...(m.titulo?.trim() ? { titulo: m.titulo.trim() } : {}),
    ...(m.legenda?.trim() ? { legenda: m.legenda.trim() } : {}),
    ordem: m.ordem ?? idx,
  }))

  return {
    vozAtiva: b.vozAtiva !== false,
    tipoVoz: limitarTexto(b.tipoVoz, 20, CONFIG_PAINEL_PADRAO.tipoVoz),
    corPrimaria: limitarTexto(b.corPrimaria, 30, CONFIG_PAINEL_PADRAO.corPrimaria),
    corSecundaria: limitarTexto(b.corSecundaria, 30, CONFIG_PAINEL_PADRAO.corSecundaria),
    corTexto: limitarTexto(b.corTexto, 30, CONFIG_PAINEL_PADRAO.corTexto),
    mensagemPadrao: limitarTexto(b.mensagemPadrao, 500, CONFIG_PAINEL_PADRAO.mensagemPadrao),
    velocidadeVoz: numeroVelocidade(b.velocidadeVoz),
    layoutDividido,
    intervaloRotacaoSegundos: numeroIntervalo(b.intervaloRotacaoSegundos),
    posicaoMidia: b.posicaoMidia === 'direita' ? 'direita' : 'esquerda',
    imagensRotativas: JSON.parse(JSON.stringify(midias)) as Prisma.InputJsonValue,
  }
}

/** Payload enviado pelo cliente (sem id/updatedAt do banco) */
export const prepararPayloadSalvarConfigPainel = (
  state: ConfigPainelExibicao | Record<string, unknown>
): DadosConfigPainelPrisma => dadosConfigPainelParaPrisma(state)

export const respostaConfigPainelParaCliente = (row: unknown): ConfigPainelExibicao =>
  configPainelFromDb(row as Record<string, unknown>)

export const mensagemErroPrismaPainel = (erro: unknown): string => {
  const msg = erro instanceof Error ? erro.message : String(erro)
  if (msg.includes('Unknown argument') && msg.includes('layoutDividido')) {
    return 'Banco ou Prisma Client desatualizado. Execute: npx prisma db push && npx prisma generate e reinicie o servidor (npm run dev).'
  }
  if (msg.includes('column') && msg.includes('does not exist')) {
    return 'Colunas do painel ausentes no banco. Execute: npx prisma db push ou aplique a migração config_painel_midia.'
  }
  return msg
}
