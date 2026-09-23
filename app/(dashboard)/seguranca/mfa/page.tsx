'use client'

import { useState } from 'react'
import { ShieldCheck, KeyRound, Copy, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

export default function PaginaMfa() {
  const [dados, setDados] = useState<{ secret: string; otpauthUrl: string } | null>(null)
  const [codigo, setCodigo] = useState('')
  const [ativo, setAtivo] = useState<boolean | null>(null)
  const [carregando, setCarregando] = useState(false)

  const iniciar = async () => {
    setCarregando(true)
    const r = await fetch('/api/mfa', { method: 'POST' })
    const j = await r.json()
    setCarregando(false)
    if (!r.ok) { toast.error(j.erro ?? 'Não foi possível iniciar o MFA.'); return }
    setDados({ secret: j.secret, otpauthUrl: j.otpauthUrl })
    setAtivo(false)
  }

  const ativar = async () => {
    if (!dados) return
    setCarregando(true)
    const r = await fetch('/api/mfa', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ secret: dados.secret, codigo }) })
    const j = await r.json()
    setCarregando(false)
    if (!r.ok) { toast.error(j.erro ?? 'Código inválido.'); return }
    setAtivo(true); setDados(null); setCodigo(''); toast.success('Autenticação em dois fatores ativada.')
  }

  const desativar = async () => {
    const code = window.prompt('Informe o código atual do autenticador para desativar o MFA.')
    if (!code) return
    setCarregando(true)
    const r = await fetch('/api/mfa', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ codigo: code }) })
    const j = await r.json(); setCarregando(false)
    if (!r.ok) { toast.error(j.erro ?? 'Não foi possível desativar o MFA.'); return }
    setAtivo(false); toast.success('MFA desativado.')
  }

  return <div className="mx-auto max-w-3xl space-y-6">
    <header><p className="text-xs font-semibold uppercase tracking-wider text-primary">Segurança da conta</p><h1 className="page-title mt-1 flex items-center gap-2"><ShieldCheck className="h-7 w-7 text-primary" />Autenticação em dois fatores</h1><p className="mt-1 text-sm text-muted-foreground">Proteja o acesso à conta com um código TOTP de 6 dígitos.</p></header>
    <section className="rounded-2xl border border-border bg-card p-6 space-y-5">
      {ativo === true ? <><div className="flex items-center gap-3 rounded-xl border border-green-500/30 bg-green-500/5 p-4"><CheckCircle2 className="h-6 w-6 text-green-600" /><div><p className="font-semibold">MFA ativo</p><p className="text-sm text-muted-foreground">O código do autenticador será exigido no próximo login.</p></div></div><button disabled={carregando} onClick={desativar} className="rounded-lg border border-destructive/40 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/5">Desativar MFA</button></> : !dados ? <><div className="flex items-center gap-3"><KeyRound className="h-6 w-6 text-primary" /><div><p className="font-semibold">Ative o autenticador</p><p className="text-sm text-muted-foreground">Use Google Authenticator, Microsoft Authenticator, Authy ou outro aplicativo compatível com TOTP.</p></div></div><button disabled={carregando} onClick={iniciar} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">{carregando ? 'Gerando...' : 'Gerar configuração MFA'}</button></> : <div className="space-y-4"><div><p className="font-semibold">1. Adicione a conta ao autenticador</p><p className="text-sm text-muted-foreground">Se o aplicativo não aceitar o URI, use a chave secreta abaixo para configurar manualmente.</p></div><div className="rounded-lg bg-muted p-3 text-xs break-all font-mono">{dados.otpauthUrl}</div><div className="flex gap-2"><input readOnly value={dados.secret} className="h-10 flex-1 rounded-lg border border-border bg-background px-3 font-mono text-sm" /><button onClick={()=>navigator.clipboard.writeText(dados.secret)} className="inline-flex h-10 items-center gap-2 rounded-lg border border-border px-3 text-sm"><Copy className="h-4 w-4" />Copiar</button></div><div><p className="font-semibold">2. Confirme com o código atual</p><input inputMode="numeric" maxLength={6} value={codigo} onChange={e=>setCodigo(e.target.value.replace(/\\D/g,'').slice(0,6))} placeholder="000000" className="mt-2 h-11 w-full rounded-lg border border-border bg-background px-3 font-mono text-lg tracking-[0.4em]" /></div><button disabled={carregando || codigo.length !== 6} onClick={ativar} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">{carregando ? 'Validando...' : 'Ativar MFA'}</button></div>}
    </section>
  </div>
}
