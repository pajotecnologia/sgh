import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { schemaCriarPrescricaoMedicaPadrao } from '@/lib/validations/prescricao-medica-padrao'
import { itemPrescricaoMedicaPadraoParaDb } from '@/lib/prescricao-medica-padrao-map'

import {
  listarPrescricoesMedicasPadraoAtivas,
  podeLerModelosPrescricaoMedica,
} from '@/lib/prescricoes-medicas-padrao'

const includeItens = {
  itens: { orderBy: { ordem: 'asc' as const } },
}

export async function GET(req: NextRequest) {
  const sessao = await getServerSession(authOptions)
  if (!sessao) return NextResponse.json({ sucesso: false, erro: 'Não autorizado.' }, { status: 401 })
  if (!podeLerModelosPrescricaoMedica(sessao.usuario.role as string)) {
    return NextResponse.json({ sucesso: false, erro: 'Sem permissão.' }, { status: 403 })
  }

  const url = new URL(req.url)
  const q = (url.searchParams.get('q') ?? '').trim()
  const ativo = (url.searchParams.get('ativo') ?? 'true').trim() !== 'false'

  const modelos = ativo
    ? await listarPrescricoesMedicasPadraoAtivas(prisma, { q })
    : await prisma.prescricaoMedicaPadrao.findMany({
        where: {
          ...(q
            ? {
                OR: [
                  { nome: { contains: q, mode: 'insensitive' } },
                  { descricao: { contains: q, mode: 'insensitive' } },
                ],
              }
            : {}),
        },
        include: includeItens,
        orderBy: { nome: 'asc' },
        take: 200,
      })

  return NextResponse.json({ sucesso: true, dados: modelos })
}

export async function POST(req: NextRequest) {
  const sessao = await getServerSession(authOptions)
  if (!sessao) return NextResponse.json({ sucesso: false, erro: 'Não autorizado.' }, { status: 401 })
  if (sessao.usuario.role !== 'ADMIN') {
    return NextResponse.json({ sucesso: false, erro: 'Sem permissão.' }, { status: 403 })
  }

  const body = await req.json()
  const validacao = schemaCriarPrescricaoMedicaPadrao.safeParse(body)
  if (!validacao.success) {
    return NextResponse.json(
      { sucesso: false, erro: 'Dados inválidos.', detalhes: validacao.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  try {
    const d = validacao.data
    const modelo = await prisma.prescricaoMedicaPadrao.create({
      data: {
        nome: d.nome.trim(),
        descricao: d.descricao?.trim() || null,
        observacoesPadrao: d.observacoesPadrao?.trim() || null,
        nomeColunaEsquerda: d.nomeColunaEsquerda?.trim() || 'Prescrição médica',
        nomeColunaDireita: d.nomeColunaDireita?.trim() || 'Prescrição de medicamentos / enfermagem',
        ativo: d.ativo ?? true,
        itens: {
          create: d.itens.map((item, index) => itemPrescricaoMedicaPadraoParaDb(item, index)),
        },
      },
      include: includeItens,
    })
    return NextResponse.json({ sucesso: true, dados: modelo })
  } catch (e) {
    console.error('[POST /api/cadastros/prescricoes-medicas]', e)
    return NextResponse.json({ sucesso: false, erro: 'Erro ao criar prescrição padrão.' }, { status: 500 })
  }
}
