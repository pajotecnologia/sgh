'use client'

import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'
import { Scale, Plus, RefreshCw } from 'lucide-react'

const tipos = ['CONFIRMACAO_DADOS','ACESSO_DADOS','CORRECAO_DADOS','ELIMINACAO_DADOS','PORTABILIDADE','REVOGACAO_CONSENTIMENTO','OUTRA']
const status = ['RECEBIDA','EM_ANALISE','AGUARDANDO_COMPLEMENTO','CONCLUIDA','NEGADA','CANCELADA']

type Item = { id: string; protocolo: string; tipo: string; status: string; solicitanteNome: string; solicitanteContato?: string | null; descricao?: string | null; criadoEm: string }

export default function PaginaLgpd() {
  const [itens, setItens] = useState<Item[]>([])
  const [filtro, setFiltro] = useState('')
  const [novo, setNovo] = useState({ tipo: 'ACESSO_DADOS', solicitanteNome: '', solicitanteContato: '', descricao: '' })
  const [carregando, setCarregando] = useState(true)
  const carregar = async () => { setCarregando(true); const r = await fetch('/api/lgpd/solicitacoes?'+new URLSearchParams(filtro ? { q: filtro } : {})); const j = await r.json(); setItens(j.dados ?? []); setCarregando(false) }
  useEffect(() => { carregar() }, [])
  const criar = async (e: FormEvent) => { e.preventDefault(); const r = await fetch('/api/lgpd/solicitacoes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(novo) }); if (r.ok) { setNovo({ tipo: 'ACESSO_DADOS', solicitanteNome: '', solicitanteContato: '', descricao: '' }); await carregar() } }
  const atualizar = async (id: string, value: string) => { await fetch('/api/lgpd/solicitacoes/'+id, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: value }) }); await carregar() }
  return <div className="mx-auto max-w-7xl space-y-6">
    <header><p className="text-xs font-semibold uppercase tracking-wider text-primary">LGPD · Titular</p><h1 className="page-title mt-1 flex items-center gap-2"><Scale className="h-7 w-7 text-primary" />Solicitações de titulares</h1><p className="mt-1 text-sm text-muted-foreground">Protocolos internos para acompanhar solicitações de acesso, correção, eliminação e demais direitos.</p></header>
    <form onSubmit={criar} className="grid gap-3 rounded-2xl border border-border bg-card p-5 md:grid-cols-2">
      <select value={novo.tipo} onChange={e=>setNovo({...novo,tipo:e.target.value})} className="h-10 rounded-lg border border-border bg-background px-3 text-sm">{tipos.map(x=><option key={x}>{x}</option>)}</select>
      <input required minLength={3} value={novo.solicitanteNome} onChange={e=>setNovo({...novo,solicitanteNome:e.target.value})} placeholder="Nome do solicitante" className="h-10 rounded-lg border border-border bg-background px-3 text-sm" />
      <input value={novo.solicitanteContato} onChange={e=>setNovo({...novo,solicitanteContato:e.target.value})} placeholder="Contato" className="h-10 rounded-lg border border-border bg-background px-3 text-sm" />
      <input value={novo.descricao} onChange={e=>setNovo({...novo,descricao:e.target.value})} placeholder="Descrição / observação" className="h-10 rounded-lg border border-border bg-background px-3 text-sm" />
      <button className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground md:col-span-2"><Plus className="h-4 w-4" />Abrir protocolo</button>
    </form>
    <div className="flex gap-2"><input value={filtro} onChange={e=>setFiltro(e.target.value)} onKeyDown={e=>{if(e.key==='Enter') carregar()}} placeholder="Buscar protocolo ou solicitante" className="h-10 flex-1 rounded-lg border border-border bg-background px-3 text-sm" /><button onClick={carregar} className="inline-flex h-10 items-center gap-2 rounded-lg border border-border px-4 text-sm"><RefreshCw className="h-4 w-4" />Atualizar</button></div>
    <div className="overflow-x-auto rounded-2xl border border-border bg-card"><table className="w-full min-w-[850px] text-sm"><thead><tr className="border-b border-border bg-muted/40"><th className="px-4 py-3 text-left">Protocolo</th><th className="px-4 py-3 text-left">Solicitante</th><th className="px-4 py-3 text-left">Tipo</th><th className="px-4 py-3 text-left">Data</th><th className="px-4 py-3 text-left">Status</th></tr></thead><tbody className="divide-y divide-border">{carregando ? <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">Carregando...</td></tr> : itens.map(i=><tr key={i.id}><td className="px-4 py-3 font-mono text-xs">{i.protocolo}</td><td className="px-4 py-3">{i.solicitanteNome}</td><td className="px-4 py-3 text-xs">{i.tipo}</td><td className="px-4 py-3 text-muted-foreground">{new Date(i.criadoEm).toLocaleString('pt-BR')}</td><td className="px-4 py-3"><select value={i.status} onChange={e=>atualizar(i.id,e.target.value)} className="h-9 rounded-lg border border-border bg-background px-2 text-xs">{status.map(x=><option key={x}>{x}</option>)}</select></td></tr>)}</tbody></table></div>
  </div>
}
