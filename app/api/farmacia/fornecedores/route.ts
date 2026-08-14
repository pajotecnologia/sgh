import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import crypto from 'crypto'

const criarFornecedorSchema = z.object({
  razaoSocial: z.string().min(2, 'Razão social deve ter pelo menos 2 caracteres'),
  nomeFantasia: z.string().optional().nullable(),
  cnpj: z.string().min(14, 'CNPJ é obrigatório'),
  inscricaoEstadual: z.string().optional().nullable(),
  telefone: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  endereco: z.string().optional().nullable(),
  cidade: z.string().optional().nullable(),
  uf: z.string().optional().nullable(),
})

export async function GET(req: NextRequest) {
  try {
    const sessao = await getServerSession(authOptions)
    if (!sessao) {
      return NextResponse.json({ sucesso: false, erro: 'Não autenticado' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const q = searchParams.get('q')?.trim() ?? ''
    const apenasAtivos = searchParams.get('apenasAtivos') !== 'false'

    const dbFornecedor = (prisma as any).tbFornecedor

    if (!dbFornecedor) {
      // Fallback SQL direto caso o servidor npm run dev ainda esteja usando cache antigo do Prisma Client
      const cnpjLimpo = q.replace(/\D/g, '')
      const filtroAtivo = apenasAtivos ? 'AND ativo = true' : ''
      const fornecedores: any[] = await prisma.$queryRawUnsafe(`
        SELECT * FROM tb_fornecedores 
        WHERE 1=1 ${filtroAtivo}
        ${q ? `AND ("razaoSocial" ILIKE '%${q}%' OR "nomeFantasia" ILIKE '%${q}%' OR cnpj ILIKE '%${q}%' ${cnpjLimpo ? `OR cnpj ILIKE '%${cnpjLimpo}%'` : ''})` : ''}
        ORDER BY "razaoSocial" ASC 
        LIMIT 100
      `)
      return NextResponse.json({ sucesso: true, dados: fornecedores })
    }

    const where: any = {}
    if (apenasAtivos) where.ativo = true
    if (q) {
      const cnpjLimpo = q.replace(/\D/g, '')
      where.OR = [
        { razaoSocial: { contains: q, mode: 'insensitive' } },
        { nomeFantasia: { contains: q, mode: 'insensitive' } },
        { cnpj: { contains: q } },
        ...(cnpjLimpo ? [{ cnpj: { contains: cnpjLimpo } }] : []),
      ]
    }

    const fornecedores = await dbFornecedor.findMany({
      where,
      orderBy: { razaoSocial: 'asc' },
      take: 100,
    })

    return NextResponse.json({ sucesso: true, dados: fornecedores })
  } catch (err: any) {
    return NextResponse.json({ sucesso: false, erro: err.message ?? 'Erro ao listar fornecedores' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const sessao = await getServerSession(authOptions)
    if (!sessao) {
      return NextResponse.json({ sucesso: false, erro: 'Não autenticado' }, { status: 401 })
    }

    if (!['ADMIN', 'FARMACEUTICO'].includes(sessao.usuario.role)) {
      return NextResponse.json({ sucesso: false, erro: 'Acesso negado' }, { status: 403 })
    }

    const body = await req.json()
    const parsed = criarFornecedorSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { sucesso: false, erro: 'Dados inválidos', detalhes: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { cnpj, razaoSocial, nomeFantasia, inscricaoEstadual, telefone, email, endereco, cidade, uf } = parsed.data
    const cnpjLimpo = cnpj.replace(/\D/g, '')
    const dbFornecedor = (prisma as any).tbFornecedor

    if (!dbFornecedor) {
      // Fallback SQL direto para inserção instantânea no banco PostgreSQL
      const id = crypto.randomUUID()
      const existentes: any[] = await prisma.$queryRaw`
        SELECT id, "razaoSocial" FROM tb_fornecedores 
        WHERE cnpj = ${cnpj} OR cnpj = ${cnpjLimpo} 
        LIMIT 1
      `
      if (existentes && existentes.length > 0) {
        return NextResponse.json(
          { sucesso: false, erro: `Fornecedor com CNPJ ${cnpj} já está cadastrado (${existentes[0].razaoSocial}).`, dados: existentes[0] },
          { status: 409 }
        )
      }

      await prisma.$executeRaw`
        INSERT INTO tb_fornecedores (id, "razaoSocial", "nomeFantasia", cnpj, "inscricaoEstadual", telefone, email, endereco, cidade, uf, ativo, "createdAt", "updatedAt")
        VALUES (${id}, ${razaoSocial}, ${nomeFantasia || null}, ${cnpjLimpo || cnpj}, ${inscricaoEstadual || null}, ${telefone || null}, ${email || null}, ${endereco || null}, ${cidade || null}, ${uf || null}, true, NOW(), NOW())
      `

      const novos: any[] = await prisma.$queryRaw`SELECT * FROM tb_fornecedores WHERE id = ${id}`
      return NextResponse.json({ sucesso: true, dados: novos[0] }, { status: 201 })
    }

    // Usar ORM Prisma normal
    const existente = await dbFornecedor.findFirst({
      where: {
        OR: [
          { cnpj: cnpj },
          { cnpj: cnpjLimpo },
        ]
      }
    })

    if (existente) {
      return NextResponse.json(
        { sucesso: false, erro: `Fornecedor com CNPJ ${cnpj} já está cadastrado (${existente.razaoSocial}).`, dados: existente },
        { status: 409 }
      )
    }

    const novo = await dbFornecedor.create({
      data: {
        razaoSocial,
        nomeFantasia,
        cnpj: cnpjLimpo || cnpj,
        inscricaoEstadual,
        telefone,
        email,
        endereco,
        cidade,
        uf,
      },
    })

    return NextResponse.json({ sucesso: true, dados: novo }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ sucesso: false, erro: err.message ?? 'Erro ao cadastrar fornecedor' }, { status: 500 })
  }
}
