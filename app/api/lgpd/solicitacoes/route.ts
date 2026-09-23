import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { randomUUID } from 'node:crypto'

const ROLES = ['ADMIN', 'DIRETOR_CLINICO'] as const
const TIPOS = ['CONFIRMACAO_DADOS','ACESSO_DADOS','CORRECAO_DADOS','ELIMINACAO_DADOS','PORTABILIDADE','REVOGACAO_CONSENTIMENTO','OUTRA'] as const
const STATUS = ['RECEBIDA','EM_ANALISE','AGUARDANDO_COMPLEMENTO','CONCLUIDA','NEGADA','CANCELADA'] as const

function autorizado(sessao: Awaited<ReturnType<typeof getServerSession>>) {
  return !!sessao?.usuario?.role && ROLES.includes(sessao.usuario.role as (typeof ROLES)[number])
}

export async function GET(req: NextRequest) {
  const sessao = await getServerSession(authOptions)
  if (!sessao) return NextResponse.json({ sucesso: false, erro: 'Não autorizado.' }, { status: 401 })
  if (!autorizado(sessao)) return NextResponse.json({ sucesso: false, erro: 'Sem permissão.' }, { status: 403 })

  const p = req.nextUrl.searchParams
  const page = Math.max(1, Number(p.get('page') ?? '1') || 1)
  const pageSize = Math.min(100, Math.max(10, Number(p.get('pageSize') ?? '25') || 25))
  const status = p.get('status')
  const tipo = p.get('tipo')
  const q = p.get('q')?.trim()
  const where = {
    ...(status && STATUS.includes(status as (typeof STATUS)[number]) ? { status: status as (typeof STATUS)[number] } : {}),
    ...(tipo && TIPOS.includes(tipo as (typeof TIPOS)[number]) ? { tipo: tipo as (typeof TIPOS)[number] } : {}),
    ...(q ? { OR: [{ protocolo: { contains: q, mode: 'insensitive' as const } }, { solicitanteNome: { contains: q, mode: 'insensitive' as const } }] } : {}),
  }
  const [total, itens] = await prisma.$transaction([
    prisma.solicitacaoTitular.count({ where }),
    prisma.solicitacaoTitular.findMany({ where, orderBy: { criadoEm: 'desc' }, skip: (page - 1) * pageSize, take: pageSize, include: { paciente: { select: { id: true, nomeExibicao: true } }, concluidoPor: { select: { nome: true } } } }),
  ])
  return NextResponse.json({ sucesso: true, dados: itens, paginacao: { page, pageSize, total, totalPaginas: Math.ceil(total / pageSize) } })
}

export async function POST(req: NextRequest) {
  const sessao = await getServerSession(authOptions)
  if (!sessao) return NextResponse.json({ sucesso: false, erro: 'Não autorizado.' }, { status: 401 })
  if (!autorizado(sessao)) return NextResponse.json({ sucesso: false, erro: 'Sem permissão.' }, { status: 403 })
  const body = await req.json().catch(() => null)
  if (!body || !TIPOS.includes(body.tipo)) return NextResponse.json({ sucesso: false, erro: 'Tipo de solicitação inválido.' }, { status: 400 })
  if (typeof body.solicitanteNome !== 'string' || body.solicitanteNome.trim().length < 3) return NextResponse.json({ sucesso: false, erro: 'Nome do solicitante é obrigatório.' }, { status: 400 })
  const protocolo = `LGPD-${new Date().toISOString().slice(0,10).replaceAll('-','')}-${randomUUID().slice(0,8).toUpperCase()}`
  const item = await prisma.solicitacaoTitular.create({ data: { protocolo, tipo: body.tipo, pacienteId: typeof body.pacienteId === 'string' ? body.pacienteId : null, solicitanteNome: body.solicitanteNome.trim(), solicitanteContato: typeof body.solicitanteContato === 'string' ? body.solicitanteContato.trim() : null, descricao: typeof body.descricao === 'string' ? body.descricao.trim() : null } })
  await prisma.logAuditoria.create({ data: { usuarioId: sessao.usuario.id, acao: 'CRIACAO', entidade: 'SolicitacaoTitular', entidadeId: item.id, valorNovo: protocolo, ipOrigem: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null, userAgent: req.headers.get('user-agent') } })
  return NextResponse.json({ sucesso: true, dados: item }, { status: 201 })
}
