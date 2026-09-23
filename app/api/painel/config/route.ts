// app/api/painel/config/route.ts — configuração pública do painel (TV sem login)

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { configPainelFromDb, CONFIG_PAINEL_PADRAO } from '@/lib/painel-config'
import { verificarRateLimit, obterIpCliente } from '@/lib/rate-limit'

export async function GET(req: Request) {
  try {
    const limite = verificarRateLimit(`painel-config:${obterIpCliente(req)}`, { limite: 60, janelaSegundos: 60 })
    if (!limite.sucesso) return NextResponse.json({ sucesso: false, erro: 'Muitas requisições.' }, { status: 429, headers: { 'Retry-After': String(limite.retryAfterSegundos), 'Cache-Control': 'no-store' } })
    const config = await prisma.configPainel.findFirst()
    const dados = config ? configPainelFromDb(config as unknown as Record<string, unknown>) : CONFIG_PAINEL_PADRAO

    return NextResponse.json(
      { sucesso: true, dados },
      {
        status: 200,
        headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' },
      }
    )
  } catch (erro) {
    console.error('[GET /api/painel/config] Erro:', erro)
    return NextResponse.json({ sucesso: false, erro: 'Erro interno.' }, { status: 500 })
  }
}
