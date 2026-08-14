import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const atualizarFornecedorSchema = z.object({
  razaoSocial: z.string().min(2, 'Razão social deve ter pelo menos 2 caracteres').optional(),
  nomeFantasia: z.string().optional().nullable(),
  cnpj: z.string().min(14, 'CNPJ é obrigatório').optional(),
  inscricaoEstadual: z.string().optional().nullable(),
  telefone: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  endereco: z.string().optional().nullable(),
  cidade: z.string().optional().nullable(),
  uf: z.string().optional().nullable(),
  ativo: z.boolean().optional(),
})

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessao = await getServerSession(authOptions)
    if (!sessao) {
      return NextResponse.json({ sucesso: false, erro: 'Não autenticado' }, { status: 401 })
    }

    const { id } = await params
    const dbFornecedor = (prisma as any).tbFornecedor

    if (!dbFornecedor) {
      const fornecedores: any[] = await prisma.$queryRaw`SELECT * FROM tb_fornecedores WHERE id = ${id} LIMIT 1`
      if (!fornecedores || fornecedores.length === 0) {
        return NextResponse.json({ sucesso: false, erro: 'Fornecedor não encontrado' }, { status: 404 })
      }
      return NextResponse.json({ sucesso: true, dados: fornecedores[0] })
    }

    const fornecedor = await dbFornecedor.findUnique({
      where: { id },
      include: {
        entradasNf: {
          orderBy: { recebidaEm: 'desc' },
          take: 20,
          select: {
            id: true,
            numeroNota: true,
            serie: true,
            recebidaEm: true,
            tipo: true,
            chaveNfe: true,
            _count: { select: { itens: true } },
          },
        },
      },
    })

    if (!fornecedor) {
      return NextResponse.json({ sucesso: false, erro: 'Fornecedor não encontrado' }, { status: 404 })
    }

    return NextResponse.json({ sucesso: true, dados: fornecedor })
  } catch (err: any) {
    return NextResponse.json({ sucesso: false, erro: err.message ?? 'Erro ao buscar fornecedor' }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessao = await getServerSession(authOptions)
    if (!sessao) {
      return NextResponse.json({ sucesso: false, erro: 'Não autenticado' }, { status: 401 })
    }

    if (!['ADMIN', 'FARMACEUTICO'].includes(sessao.usuario.role)) {
      return NextResponse.json({ sucesso: false, erro: 'Acesso negado' }, { status: 403 })
    }

    const { id } = await params
    const body = await req.json()
    const parsed = atualizarFornecedorSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { sucesso: false, erro: 'Dados inválidos', detalhes: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const dbFornecedor = (prisma as any).tbFornecedor
    if (!dbFornecedor) {
      const { razaoSocial, nomeFantasia, cnpj, inscricaoEstadual, telefone, email, endereco, cidade, uf, ativo } = parsed.data
      await prisma.$executeRaw`
        UPDATE tb_fornecedores 
        SET "razaoSocial" = COALESCE(${razaoSocial || null}, "razaoSocial"),
            "nomeFantasia" = COALESCE(${nomeFantasia || null}, "nomeFantasia"),
            cnpj = COALESCE(${cnpj || null}, cnpj),
            "inscricaoEstadual" = COALESCE(${inscricaoEstadual || null}, "inscricaoEstadual"),
            telefone = COALESCE(${telefone || null}, telefone),
            email = COALESCE(${email || null}, email),
            endereco = COALESCE(${endereco || null}, endereco),
            cidade = COALESCE(${cidade || null}, cidade),
            uf = COALESCE(${uf || null}, uf),
            ativo = COALESCE(${ativo ?? null}, ativo),
            "updatedAt" = NOW()
        WHERE id = ${id}
      `
      const atualizados: any[] = await prisma.$queryRaw`SELECT * FROM tb_fornecedores WHERE id = ${id}`
      return NextResponse.json({ sucesso: true, dados: atualizados[0] })
    }

    const existente = await dbFornecedor.findUnique({ where: { id } })
    if (!existente) {
      return NextResponse.json({ sucesso: false, erro: 'Fornecedor não encontrado' }, { status: 404 })
    }

    const atualizado = await dbFornecedor.update({
      where: { id },
      data: parsed.data,
    })

    return NextResponse.json({ sucesso: true, dados: atualizado })
  } catch (err: any) {
    return NextResponse.json({ sucesso: false, erro: err.message ?? 'Erro ao atualizar fornecedor' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessao = await getServerSession(authOptions)
    if (!sessao) {
      return NextResponse.json({ sucesso: false, erro: 'Não autenticado' }, { status: 401 })
    }

    if (!['ADMIN', 'FARMACEUTICO'].includes(sessao.usuario.role)) {
      return NextResponse.json({ sucesso: false, erro: 'Acesso negado' }, { status: 403 })
    }

    const { id } = await params
    const dbFornecedor = (prisma as any).tbFornecedor

    if (!dbFornecedor) {
      await prisma.$executeRaw`UPDATE tb_fornecedores SET ativo = false, "updatedAt" = NOW() WHERE id = ${id}`
      const inativados: any[] = await prisma.$queryRaw`SELECT * FROM tb_fornecedores WHERE id = ${id}`
      return NextResponse.json({ sucesso: true, dados: inativados[0] })
    }

    const inativado = await dbFornecedor.update({
      where: { id },
      data: { ativo: false },
    })

    return NextResponse.json({ sucesso: true, dados: inativado })
  } catch (err: any) {
    return NextResponse.json({ sucesso: false, erro: err.message ?? 'Erro ao inativar fornecedor' }, { status: 500 })
  }
}
