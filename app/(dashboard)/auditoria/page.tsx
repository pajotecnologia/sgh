import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Shield, Download } from 'lucide-react'

export const metadata: Metadata = { title: 'Auditoria' }

export default async function PaginaAuditoria({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sessao = await getServerSession(authOptions)
  if (!sessao) redirect('/login')
  if (!['ADMIN','DIRETOR_CLINICO'].includes(sessao.usuario.role)) redirect('/acesso-negado')
  const p = await searchParams
  const page = Math.max(1, Number(p.page ?? '1') || 1); const pageSize = 50
  const registradoEm = (p.from || p.to) ? { ...(p.from ? { gte: new Date(`${p.from}T00:00:00.000Z`) } : {}), ...(p.to ? { lte: new Date(`${p.to}T23:59:59.999Z`) } : {}) } : undefined
  const where = { ...(registradoEm ? { registradoEm } : {}), ...(p.usuarioId ? { usuarioId: p.usuarioId } : {}), ...(p.acao ? { acao: p.acao as any } : {}), ...(p.entidade ? { entidade: p.entidade } : {}), ...(p.q ? { OR: [{ entidadeId: { contains: p.q, mode: 'insensitive' as const } }, { valorNovo: { contains: p.q, mode: 'insensitive' as const } }, { valorAnterior: { contains: p.q, mode: 'insensitive' as const } }] } : {}) }
  const [logs, total, usuarios] = await prisma.$transaction([
    prisma.logAuditoria.findMany({ where, orderBy: { registradoEm: 'desc' }, skip: (page-1)*pageSize, take: pageSize, include: { usuario: { select: { nome: true, email: true } } } }),
    prisma.logAuditoria.count({ where }),
    prisma.usuario.findMany({ where: { ativo: true, deletedAt: null }, select: { id: true, nome: true }, orderBy: { nome: 'asc' }, take: 200 }),
  ])
  const qs = new URLSearchParams(); for (const [k,v] of Object.entries(p)) if(v) qs.set(k,v)
  const exportUrl = `/api/auditoria/export?${qs.toString()}`
  return <div className="max-w-7xl mx-auto space-y-6">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><h1 className="page-title flex items-center gap-2"><Shield className="h-7 w-7 text-primary" />Auditoria</h1><p className="text-sm text-muted-foreground mt-1">Consulta filtrável da trilha de auditoria e exportação para compliance.</p></div><a href={exportUrl} className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted/50"><Download className="h-4 w-4" />Exportar CSV</a></div>
    <form method="get" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 border border-border rounded-xl bg-card p-4">
      <input name="from" type="date" defaultValue={p.from} className="h-10 rounded-lg border border-border bg-background px-3 text-sm" aria-label="Data inicial" />
      <input name="to" type="date" defaultValue={p.to} className="h-10 rounded-lg border border-border bg-background px-3 text-sm" aria-label="Data final" />
      <select name="usuarioId" defaultValue={p.usuarioId ?? ''} className="h-10 rounded-lg border border-border bg-background px-3 text-sm"><option value="">Todos os usuários</option>{usuarios.map(u => <option key={u.id} value={u.id}>{u.nome}</option>)}</select>
      <select name="acao" defaultValue={p.acao ?? ''} className="h-10 rounded-lg border border-border bg-background px-3 text-sm"><option value="">Todas as ações</option>{['CRIACAO','ATUALIZACAO','EXCLUSAO','VISUALIZACAO','LOGIN','LOGOUT','CHAMADA_PAINEL'].map(a => <option key={a} value={a}>{a}</option>)}</select>
      <input name="entidade" defaultValue={p.entidade} placeholder="Entidade" className="h-10 rounded-lg border border-border bg-background px-3 text-sm" />
      <input name="q" defaultValue={p.q} placeholder="ID / valor" className="h-10 rounded-lg border border-border bg-background px-3 text-sm" />
      <button className="h-10 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground sm:col-span-2 lg:col-span-1">Filtrar</button>
    </form>
    <div className="text-xs text-muted-foreground">{total} registro(s) encontrado(s) · página {page} de {Math.max(1,Math.ceil(total/pageSize))}</div>
    <div className="border border-border rounded-xl overflow-hidden bg-card overflow-x-auto"><table className="w-full text-xs min-w-[900px]"><thead><tr className="border-b border-border bg-muted/40">{['Data','Usuário','Ação','Entidade','Detalhes'].map(h=><th key={h} className="text-left px-3 py-2 font-semibold">{h}</th>)}</tr></thead><tbody className="divide-y divide-border">{logs.map(log=><tr key={log.id} className="hover:bg-muted/20"><td className="px-3 py-2 whitespace-nowrap text-muted-foreground">{log.registradoEm.toLocaleString('pt-BR')}</td><td className="px-3 py-2">{log.usuario?.nome ?? log.usuario?.email ?? '—'}</td><td className="px-3 py-2 font-mono">{log.acao}</td><td className="px-3 py-2">{log.entidade}<span className="block text-[10px] text-muted-foreground truncate max-w-[160px]">{log.entidadeId ?? ''}</span></td><td className="px-3 py-2 max-w-[320px]">{log.campo && <span className="block text-muted-foreground">Campo: {log.campo}</span>}{log.valorAnterior && <span className="block text-muted-foreground truncate">Ant.: {log.valorAnterior}</span>}{log.valorNovo && <span className="block truncate">Novo: {log.valorNovo}</span>}</td></tr>)}</tbody></table></div>
  </div>
}
