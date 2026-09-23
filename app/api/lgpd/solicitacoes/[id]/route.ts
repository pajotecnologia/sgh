import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const STATUS = ['RECEBIDA','EM_ANALISE','AGUARDANDO_COMPLEMENTO','CONCLUIDA','NEGADA','CANCELADA'] as const

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sessao = await getServerSession(authOptions)
  if (!sessao) return NextResponse.json({ sucesso: false, erro: 'Não autorizado.' }, { status: 401 })
  if (!['ADMIN','DIRETOR_CLINICO'].includes(sessao.usuario.role)) return NextResponse.json({ sucesso: false, erro: 'Sem permissão.' }, { status: 403 })
  const { id } = await params
  const body = await req.json().catch(() => null)
  if (!body || !STATUS.includes(body.status)) return NextResponse.json({ sucesso: false, erro: 'Status inválido.' }, { status: 400 })
  const item = await prisma.solicitacaoTitular.update({ where: { id }, data: { status: body.status, resposta: typeof body.resposta === 'string' ? body.resposta.trim() || null : undefined, concluidoEm: ['CONCLUIDA','NEGADA','CANCELADA'].includes(body.status) ? new Date() : null, concluidoPorId: ['CONCLUIDA','NEGADA','CANCELADA'].includes(body.status) ? sessao.usuario.id : null } })
  await prisma.logAuditoria.create({ data: { usuarioId: sessao.usuario.id, acao: 'ATUALIZACAO', entidade: 'SolicitacaoTitular', entidadeId: id, campo: 'status', valorNovo: body.status, ipOrigem: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null, userAgent: req.headers.get('user-agent') } })
  return NextResponse.json({ sucesso: true, dados: item })
}
