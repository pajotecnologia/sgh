import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function autorizado(role?: string) { return role === 'ADMIN' || role === 'DIRETOR_CLINICO' }
function escapeCsv(value: unknown) { const s = value == null ? '' : String(value); return `"${s.replaceAll('"','""')}"` }

export async function GET(req: NextRequest) {
  const sessao = await getServerSession(authOptions)
  if (!sessao) return NextResponse.json({ sucesso: false, erro: 'Não autorizado.' }, { status: 401 })
  if (!autorizado(sessao.usuario.role)) return NextResponse.json({ sucesso: false, erro: 'Sem permissão.' }, { status: 403 })
  const p = req.nextUrl.searchParams
  const from = p.get('from'); const to = p.get('to'); const usuarioId = p.get('usuarioId'); const acao = p.get('acao'); const entidade = p.get('entidade'); const q = p.get('q')?.trim()
  const registradoEm = (from || to) ? { ...(from ? { gte: new Date(`${from}T00:00:00.000Z`) } : {}), ...(to ? { lte: new Date(`${to}T23:59:59.999Z`) } : {}) } : undefined
  const where = { ...(registradoEm ? { registradoEm } : {}), ...(usuarioId ? { usuarioId } : {}), ...(acao ? { acao: acao as any } : {}), ...(entidade ? { entidade } : {}), ...(q ? { OR: [{ entidadeId: { contains: q, mode: 'insensitive' as const } }, { valorNovo: { contains: q, mode: 'insensitive' as const } }, { valorAnterior: { contains: q, mode: 'insensitive' as const } }] } : {}) }
  const logs = await prisma.logAuditoria.findMany({ where, orderBy: { registradoEm: 'desc' }, take: 5000, include: { usuario: { select: { nome: true, email: true } } } })
  const header = ['Data','Usuário','E-mail','Ação','Entidade','Entidade ID','Campo','Valor anterior','Valor novo','IP']
  const rows = logs.map(l => [l.registradoEm.toISOString(), l.usuario?.nome ?? '', l.usuario?.email ?? '', l.acao, l.entidade, l.entidadeId ?? '', l.campo ?? '', l.valorAnterior ?? '', l.valorNovo ?? '', l.ipOrigem ?? ''])
  const csv = '\uFEFF' + [header, ...rows].map(r => r.map(escapeCsv).join(';')).join('\n')
  return new NextResponse(csv, { status: 200, headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="auditoria-sgh.csv"', 'Cache-Control': 'no-store' } })
}
