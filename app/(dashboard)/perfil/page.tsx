'use client'

import { useEffect, useState } from 'react'
import {
  User,
  ShieldCheck,
  KeyRound,
  Copy,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Mail,
  Shield,
  FileBadge,
  LogOut,
  ExternalLink,
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface UsuarioPerfil {
  id: string
  nome: string
  email: string
  role: string
  crm?: string | null
  coren?: string | null
}

const LABELS_ROLE: Record<string, string> = {
  ADMIN: 'Administrador',
  MEDICO: 'Médico(a)',
  ENFERMEIRO: 'Enfermeiro(a)',
  FARMACEUTICO: 'Farmacêutico(a)',
  RECEPCIONISTA: 'Recepcionista',
}

export default function PaginaPerfil() {
  const [usuario, setUsuario] = useState<UsuarioPerfil | null>(null)
  const [mfaAtivo, setMfaAtivo] = useState<boolean | null>(null)
  const [mfaHabilitadoInstituicao, setMfaHabilitadoInstituicao] = useState<boolean>(true)
  const [dadosConfig, setDadosConfig] = useState<{ secret: string; otpauthUrl: string } | null>(null)
  const [codigo, setCodigo] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [carregandoInicial, setCarregandoInicial] = useState(true)

  useEffect(() => {
    async function carregar() {
      try {
        const r = await fetch('/api/mfa')
        const j = await r.json()
        if (r.ok && j.sucesso) {
          setMfaAtivo(Boolean(j.ativo))
          setMfaHabilitadoInstituicao(j.mfaHabilitadoInstituicao !== false)
          if (j.usuario) setUsuario(j.usuario)
        }
      } catch (err) {
        console.error('Erro ao carregar dados do perfil:', err)
      } finally {
        setCarregandoInicial(false)
      }
    }
    carregar()
  }, [])

  const iniciarMfa = async () => {
    setCarregando(true)
    try {
      const r = await fetch('/api/mfa', { method: 'POST' })
      const j = await r.json()
      if (!r.ok) {
        toast.error(j.erro ?? 'Não foi possível iniciar o MFA.')
        return
      }
      setDadosConfig({ secret: j.secret, otpauthUrl: j.otpauthUrl })
      setMfaAtivo(false)
    } catch {
      toast.error('Erro de conexão ao gerar MFA.')
    } finally {
      setCarregando(false)
    }
  }

  const ativarMfa = async () => {
    if (!dadosConfig) return
    setCarregando(true)
    try {
      const r = await fetch('/api/mfa', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret: dadosConfig.secret, codigo }),
      })
      const j = await r.json()
      if (!r.ok) {
        toast.error(j.erro ?? 'Código inválido.')
        return
      }
      setMfaAtivo(true)
      setDadosConfig(null)
      setCodigo('')
      toast.success('Autenticação em dois fatores ativada com sucesso!')
    } catch {
      toast.error('Erro ao validar código MFA.')
    } finally {
      setCarregando(false)
    }
  }

  const desativarMfa = async () => {
    const code = window.prompt('Informe o código atual de 6 dígitos do autenticador para desativar o MFA:')
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
      setMfaAtivo(false)
      toast.success('MFA desativado com sucesso.')
    } catch {
      toast.error('Erro ao desativar MFA.')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">Conta do Usuário</p>
        <h1 className="page-title mt-1 flex items-center gap-2.5 text-2xl font-bold">
          <User className="h-7 w-7 text-primary" />
          Meu Cadastro & Segurança
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Visualize os dados do seu cadastro profissional e configure a segurança de acesso à sua conta.
        </p>
      </header>

      {carregandoInicial ? (
        <div className="flex items-center justify-center py-16 gap-3 text-muted-foreground text-sm">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          Carregando informações do usuário...
        </div>
      ) : (
        <div className="space-y-6">
          {/* Card 1: Dados do Cadastro */}
          {usuario && (
            <section className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-lg font-bold">
                    {usuario.nome.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-foreground">{usuario.nome}</h2>
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                      <Mail className="h-3.5 w-3.5" /> {usuario.email}
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-semibold">
                  {LABELS_ROLE[usuario.role] ?? usuario.role}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-1">
                <div className="rounded-xl bg-muted/40 p-3.5 border border-border/60">
                  <span className="text-[11px] text-muted-foreground font-medium block">Perfil / Função</span>
                  <span className="text-sm font-semibold text-foreground mt-0.5 flex items-center gap-1.5">
                    <Shield className="h-4 w-4 text-primary" />
                    {LABELS_ROLE[usuario.role] ?? usuario.role}
                  </span>
                </div>

                {usuario.crm && (
                  <div className="rounded-xl bg-muted/40 p-3.5 border border-border/60">
                    <span className="text-[11px] text-muted-foreground font-medium block">CRM</span>
                    <span className="text-sm font-semibold text-foreground mt-0.5 flex items-center gap-1.5">
                      <FileBadge className="h-4 w-4 text-primary" />
                      {usuario.crm}
                    </span>
                  </div>
                )}

                {usuario.coren && (
                  <div className="rounded-xl bg-muted/40 p-3.5 border border-border/60">
                    <span className="text-[11px] text-muted-foreground font-medium block">COREN</span>
                    <span className="text-sm font-semibold text-foreground mt-0.5 flex items-center gap-1.5">
                      <FileBadge className="h-4 w-4 text-primary" />
                      {usuario.coren}
                    </span>
                  </div>
                )}

                <div className="rounded-xl bg-muted/40 p-3.5 border border-border/60">
                  <span className="text-[11px] text-muted-foreground font-medium block">Status do Acesso</span>
                  <span className="text-sm font-semibold text-green-600 dark:text-green-400 mt-0.5 flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" /> Ativo
                  </span>
                </div>
              </div>
            </section>
          )}

          {/* Card 2: Autenticação em Dois Fatores (2FA / MFA) */}
          <section className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="h-6 w-6 text-primary" />
                <div>
                  <h2 className="text-lg font-bold text-foreground">Autenticação em Dois Fatores (2FA / MFA)</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Exige um código temporário de 6 dígitos gerado no celular no momento do login.
                  </p>
                </div>
              </div>
            </div>

            {!mfaHabilitadoInstituicao ? (
              <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
                <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-900 dark:text-amber-300">
                    Autenticação 2FA desativada pela administração
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    A configuração global de autenticação em dois fatores está desabilitada nas configurações do sistema.
                  </p>
                </div>
              </div>
            ) : mfaAtivo === true ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 rounded-xl border border-green-500/30 bg-green-500/10 p-4">
                  <CheckCircle2 className="h-6 w-6 text-green-600 shrink-0" />
                  <div>
                    <p className="font-semibold text-green-900 dark:text-green-300">
                      Autenticação 2FA (MFA) está ATIVA na sua conta
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      No próximo login, além da senha, será solicitado o código gerado no seu aplicativo autenticador.
                    </p>
                  </div>
                </div>

                <button
                  disabled={carregando}
                  onClick={desativarMfa}
                  className="rounded-lg border border-destructive/40 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
                >
                  {carregando ? 'Processando...' : 'Desativar 2FA'}
                </button>
              </div>
            ) : !dadosConfig ? (
              <div className="space-y-4">
                <div className="flex items-start gap-3 rounded-xl bg-muted/40 p-4 border border-border/60">
                  <KeyRound className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div className="space-y-1 text-sm">
                    <p className="font-semibold text-foreground">Como cadastrar seu 2FA:</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Instale um aplicativo como <strong>Google Authenticator</strong>, <strong>Microsoft Authenticator</strong> ou <strong>Authy</strong> no seu celular. Ao clicar no botão abaixo, você receberá a chave para vincular sua conta.
                    </p>
                  </div>
                </div>

                <button
                  disabled={carregando}
                  onClick={iniciarMfa}
                  className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90 transition-colors"
                >
                  {carregando ? 'Gerando chave...' : 'Cadastrar e Ativar 2FA'}
                </button>
              </div>
            ) : (
              <div className="space-y-4 pt-1">
                <div>
                  <p className="font-semibold text-sm text-foreground">1. Insira a chave no seu aplicativo autenticador</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    No seu aplicativo (Google Authenticator / Microsoft Authenticator), selecione <strong>Adicionar conta</strong> → <strong>Inserir chave de configuração</strong>:
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 items-stretch">
                  <input
                    readOnly
                    value={dadosConfig.secret}
                    className="h-10 flex-1 rounded-lg border border-border bg-muted/50 px-3 font-mono text-sm font-semibold tracking-wider text-foreground select-all"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(dadosConfig.secret)
                      toast.success('Chave copiada para a área de transferência!')
                    }}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border px-4 text-sm font-medium hover:bg-muted transition-colors"
                  >
                    <Copy className="h-4 w-4" />
                    Copiar Chave
                  </button>
                </div>

                <div className="pt-3 border-t border-border space-y-2">
                  <p className="font-semibold text-sm text-foreground">2. Digite o código de 6 dígitos gerado</p>
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
                    onClick={ativarMfa}
                    className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50 transition-colors"
                  >
                    {carregando ? 'Validando...' : 'Confirmar e Ativar 2FA'}
                  </button>
                  <button
                    disabled={carregando}
                    onClick={() => {
                      setDadosConfig(null)
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

          {/* Card 3: Sessões e Segurança Geral */}
          <section className="rounded-2xl border border-border bg-card p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-foreground">Sessões e Dispositivos Conectados</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Consulte onde sua conta está logada e encerre acessos em outros aparelhos.
              </p>
            </div>
            <Link
              href="/seguranca/sessoes"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors shrink-0"
            >
              Gerenciar Sessões
              <ExternalLink className="h-4 w-4" />
            </Link>
          </section>
        </div>
      )}
    </div>
  )
}
