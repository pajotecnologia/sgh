import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { schemaAtualizarPrescricaoMedicaPadrao } from '@/lib/validations/prescricao-medica-padrao'
import { itemPrescricaoMedicaPadraoParaDb } from '@/lib/prescricao-medica-padrao-map'
import {
  podeLerModelosPrescricaoMedica,
} from '@/lib/prescricoes-medicas-padrao'

const includeItens = {
  itens: { orderBy: { ordem: 'asc' as const } },
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sessao = await getServerSession(authOptions)
  if (!sessao) return NextResponse.json({ sucesso: false, erro: 'Não autorizado.' }, { status: 401 })
  if (!podeLerModelosPrescricaoMedica(sessao.usuario.role as string)) {
    return NextResponse.json({ sucesso: false, erro: 'Sem permissão.' }, { status: 403 })
  }

  const { id } = await params
  const modelo = await prisma.prescricaoMedicaPadrao.findUnique({
    where: { id },
    include: includeItens,
  })
  if (!modelo) {
    return NextResponse.json({ sucesso: false, erro: 'Prescrição padrão não encontrada.' }, { status: 404 })
  }

  return NextResponse.json({ sucesso: true, dados: modelo })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sessao = await getServerSession(authOptions)
  if (!sessao) return NextResponse.json({ sucesso: false, erro: 'Não autorizado.' }, { status: 401 })
  if (sessao.usuario.role !== 'ADMIN') {
    return NextResponse.json({ sucesso: false, erro: 'Sem permissão.' }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json()
  const validacao = schemaAtualizarPrescricaoMedicaPadrao.safeParse(body)
  if (!validacao.success) {
    return NextResponse.json(
      { sucesso: false, erro: 'Dados inválidos.', detalhes: validacao.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  try {
    const d = validacao.data
    const existente = await prisma.prescricaoMedicaPadrao.findUnique({ where: { id } })
    if (!existente) {
      return NextResponse.json({ sucesso: false, erro: 'Prescrição padrão não encontrada.' }, { status: 404 })
    }

    const modelo = await prisma.$transaction(async (tx) => {
      if (d.itens) {
        await tx.itemPrescricaoMedicaPadrao.deleteMany({ where: { prescricaoMedicaPadraoId: id } })
      }

      return tx.prescricaoMedicaPadrao.update({
        where: { id },
        data: {
          ...(d.nome !== undefined ? { nome: d.nome.trim() } : {}),
          ...(d.descricao !== undefined ? { descricao: d.descricao?.trim() || null } : {}),
          ...(d.observacoesPadrao !== undefined
            ? { observacoesPadrao: d.observacoesPadrao?.trim() || null }
            : {}),
          ...(d.nomeColunaEsquerda !== undefined
            ? { nomeColunaEsquerda: d.nomeColunaEsquerda?.trim() || 'Prescrição médica' }
            : {}),
          ...(d.nomeColunaDireita !== undefined
            ? { nomeColunaDireita: d.nomeColunaDireita?.trim() || 'Prescrição de medicamentos / enfermagem' }
            : {}),
          ...(typeof d.ativo === 'boolean' ? { ativo: d.ativo } : {}),
          ...(d.itens
            ? {
                itens: {
                  create: d.itens.map((item, index) => itemPrescricaoMedicaPadraoParaDb(item, index)),
                },
              }
            : {}),
        },
        include: includeItens,
      })
    })

    return NextResponse.json({ sucesso: true, dados: modelo })
  } catch (e) {
    console.error('[PATCH /api/cadastros/prescricoes-medicas/[id]]', e)
    const msg = e instanceof Error ? e.message : ''
    if (msg.includes('Unknown argument `tipoItem`')) {
      return NextResponse.json(
        {
          sucesso: false,
          erro: 'Servidor desatualizado: reinicie o `npm run dev` após `npx prisma generate`.',
        },
        { status: 500 }
      )
    }
    return NextResponse.json({ sucesso: false, erro: 'Erro ao atualizar prescrição padrão.' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sessao = await getServerSession(authOptions)
  if (!sessao) return NextResponse.json({ sucesso: false, erro: 'Não autorizado.' }, { status: 401 })
  if (sessao.usuario.role !== 'ADMIN') {
    return NextResponse.json({ sucesso: false, erro: 'Sem permissão.' }, { status: 403 })
  }

  const { id } = await params

  try {
    await prisma.prescricaoMedicaPadrao.delete({ where: { id } })
    return NextResponse.json({ sucesso: true })
  } catch {
    return NextResponse.json({ sucesso: false, erro: 'Prescrição padrão não encontrada.' }, { status: 404 })
  }
}
