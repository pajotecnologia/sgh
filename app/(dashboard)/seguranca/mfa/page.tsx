'use client'

import { useEffect, useState } from 'react'
import { ShieldCheck, KeyRound, Copy, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function PaginaMfa() {
  const [dados, setDados] = useState<{ secret: string; otpauthUrl: string } | null>(null)
  const [codigo, setCodigo] = useState('')
  const [ativo, setAtivo] = useState<boolean | null>(null)
  const [carregando, setCarregando] = useState(false)
  const [verificandoInicial, setVerificandoInicial] = useState(true)

  useEffect(() => {
    async function checarStatus() {
      try {
        const r = await fetch('/api/mfa')
        const j = await r.json()
        if (r.ok && j.sucesso) {
          setAtivo(Boolean(j.ativo))
        }
      } catch (err) {
        console.error('Erro ao verificar status MFA:', err)
      } finally {
        setVerificandoInicial(false)
      }
    }
    checarStatus()
  }, [])

  const iniciar = async () => {
    setCarregando(true)
    try {
      const r = await fetch('/api/mfa', { method: 'POST' })
      const j = await r.json()
      if (!r.ok) {
        toast.error(j.erro ?? 'Não foi possível iniciar o MFA.')
        return
      }
      setDados({ secret: j.secret, otpauthUrl: j.otpauthUrl })
      setAtivo(false)
    } catch {
      toast.error('Erro de conexão ao gerar MFA.')
    } finally {
      setCarregando(false)
    }
  }

  const ativar = async () => {
    if (!dados) return
    setCarregando(true)
    try {
      const r = await fetch('/api/mfa', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret: dados.secret, codigo }),
      })
      const j = await r.json()
      if (!r.ok) {
        toast.error(j.erro ?? 'Código inválido.')
        return
      }
      setAtivo(true)
      setDados(null)
      setCodigo('')
      toast.success('Autenticação em dois fatores ativada com sucesso!')
    } catch {
      toast.error('Erro ao validar código MFA.')
    } finally {
      setCarregando(false)
    }
  }

  const desativar = async () => {
    const code = window.prompt('Informe o código atual do seu aplicativo autenticador para desativar o MFA:')
    if (!code) return
    setCarregando(true)
    try {
      const r = await fetch('/api/mfa', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigo: code.trim() }),
      })
      const j = await r.json()
      if (!r.ok) {
        toast.error(j.erro ?? 'Não foi possível desativar o MFA.')
        return
      }
      setAtivo(false)
      toast.success('MFA desativado com sucesso.')
    } catch {
      toast.error('Erro ao desativar MFA.')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">Segurança da conta</p>
        <h1 className="page-title mt-1 flex items-center gap-2 text-2xl font-bold">
          <ShieldCheck className="h-7 w-7 text-primary" />
          Autenticação em Dois Fatores (MFA / TOTP)
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Proteja o acesso à sua conta com um código de segurança de 6 dígitos gerado no celular.
        </p>
      </header>

      <section className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-6">
        {verificandoInicial ? (
          <div className="flex items-center justify-center py-10 gap-3 text-muted-foreground text-sm">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            Verificando status de segurança...
          </div>
        ) : ativo === true ? (
          <div className="space-y-5">
            <div className="flex items-center gap-3 rounded-xl border border-green-500/30 bg-green-500/10 p-4">
              <CheckCircle2 className="h-6 w-6 text-green-600 shrink-0" />
              <div>
                <p className="font-semibold text-green-900 dark:text-green-300">MFA está ativo na sua conta</p>
                <p className="text-sm text-muted-foreground">
                  Seu código de 6 dígitos do autenticador será exigido no momento do login.
                </p>
              </div>
            </div>
            <button
              disabled={carregando}
              onClick={desativar}
              className="rounded-lg border border-destructive/40 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
            >
              {carregando ? 'Processando...' : 'Desativar MFA'}
            </button>
          </div>
        ) : !dados ? (
          <div className="space-y-5">
            <div className="flex items-start gap-3 rounded-xl bg-muted/40 p-4">
              <KeyRound className="h-6 w-6 text-primary shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-foreground">Como funciona o MFA</p>
                <p className="text-sm text-muted-foreground">
                  Você pode utilizar aplicativos como <strong>Google Authenticator</strong>, <strong>Microsoft Authenticator</strong> ou <strong>Authy</strong>.
                </p>
                <p className="text-sm text-muted-foreground">
                  Após ativar, além da sua senha normal, será solicitado o código de 6 dígitos gerado pelo aplicativo no seu celular.
                </p>
              </div>
            </div>
            <button
              disabled={carregando}
              onClick={iniciar}
              className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors"
            >
              {carregando ? 'Gerando configuração...' : 'Configurar e Ativar MFA'}
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            <div>
              <p className="font-semibold text-foreground">1. Adicione a chave ao seu aplicativo autenticador</p>
              <p className="text-sm text-muted-foreground mt-1">
                No app autenticador (Google Authenticator, Microsoft Authenticator), escolha <strong>Adicionar conta</strong> → <strong>Inserir chave de configuração</strong> e insira a chave abaixo:
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 items-stretch">
              <input
                readOnly
                value={dados.secret}
                className="h-10 flex-1 rounded-lg border border-border bg-muted/50 px-3 font-mono text-sm font-semibold tracking-wider text-foreground select-all"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(dados.secret)
                  toast.success('Chave copiada para a área de transferência!')
                }}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border px-4 text-sm font-medium hover:bg-muted transition-colors"
              >
                <Copy className="h-4 w-4" />
                Copiar Chave
              </button>
            </div>

            <div className="rounded-lg bg-muted/30 p-3 text-xs font-mono break-all text-muted-foreground border border-border/50">
              <span className="font-semibold text-foreground block mb-1">URI de Configuração:</span>
              {dados.otpauthUrl}
            </div>

            <div className="pt-2 border-t border-border space-y-2">
              <p className="font-semibold text-foreground">2. Confirme o código de 6 dígitos gerado</p>
              <p className="text-sm text-muted-foreground">
                Digite o código atual de 6 dígitos exibido no seu aplicativo para confirmar e ativar:
              </p>
              <input
                inputMode="numeric"
                maxLength={6}
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="h-12 w-48 rounded-lg border border-border bg-background px-4 font-mono text-xl tracking-[0.35em] text-center outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                disabled={carregando || codigo.length !== 6}
                onClick={ativar}
                className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {carregando ? 'Validando...' : 'Ativar MFA'}
              </button>
              <button
                disabled={carregando}
                onClick={() => {
                  setDados(null)
                  setCodigo('')
                }}
                className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
