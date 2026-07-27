// app/api/configuracoes/painel/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  dadosConfigPainelParaPrisma,
  mensagemErroPrismaPainel,
  respostaConfigPainelParaCliente,
} from '@/lib/config-painel-persistencia'
import type { ApiResponse } from '@/types'

export async function GET() {
  const sessao = await getServerSession(authOptions)
  if (sessao?.usuario.role !== 'ADMIN') {
    return NextResponse.json({ sucesso: false, erro: 'Acesso negado.' }, { status: 403 })
  }

  try {
    let config = await prisma.configPainel.findFirst()

    if (!config) {
      config = await prisma.configPainel.create({
        data: dadosConfigPainelParaPrisma({}),
      })
    }

    return NextResponse.json<ApiResponse<unknown>>({
      sucesso: true,
      dados: respostaConfigPainelParaCliente(config),
    })
  } catch (erro) {
    console.error('[GET /api/configuracoes/painel]', erro)
    return NextResponse.json(
      {
        sucesso: false,
        erro: 'Erro ao buscar configurações do painel.',
        detalhes: mensagemErroPrismaPainel(erro),
      },
      { status: 500 }
    )
  }
}

export async function PUT(req: NextRequest) {
  const sessao = await getServerSession(authOptions)
  if (sessao?.usuario.role !== 'ADMIN') {
    return NextResponse.json({ sucesso: false, erro: 'Acesso negado.' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const data = dadosConfigPainelParaPrisma(body)
    const configExistente = await prisma.configPainel.findFirst()

    const salva = configExistente
      ? await prisma.configPainel.update({
          where: { id: configExistente.id },
          data,
        })
      : await prisma.configPainel.create({ data })

    return NextResponse.json({
      sucesso: true,
      dados: respostaConfigPainelParaCliente(salva),
    })
  } catch (erro) {
    console.error('[PUT /api/configuracoes/painel]', erro)
    const detalhes = mensagemErroPrismaPainel(erro)
    return NextResponse.json(
      {
        sucesso: false,
        erro: 'Erro ao salvar configurações do painel.',
        detalhes,
      },
      { status: 500 }
    )
  }
}
