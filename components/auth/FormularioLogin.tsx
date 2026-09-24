// components/auth/FormularioLogin.tsx
// Formulário de login com React Hook Form + Zod + NextAuth

'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { Loader2, Eye, EyeOff, LogIn } from 'lucide-react'
import { toast } from 'sonner'

const schemaLogin = z.object({
  email: z
    .string()
    .min(1, 'E-mail é obrigatório.')
    .email('E-mail inválido.'),
  senha: z
    .string()
    .min(6, 'Senha deve ter pelo menos 6 caracteres.'),
  mfaCode: z.string().regex(/^$|^\d{6}$/, 'O código MFA deve ter 6 dígitos.').default(''),
})

type LoginForm = z.infer<typeof schemaLogin>

const CREDENCIAIS_DEMO = [
  { perfil: 'Administrador', email: 'admin@hospital.com' },
  { perfil: 'Farmácia', email: 'farmacia@hospital.com' },
  { perfil: 'Médico', email: 'medico@hospital.com' },
  { perfil: 'Enfermeiro', email: 'enfermeiro@hospital.com' },
  { perfil: 'Recepção', email: 'recepcao@hospital.com' },
] as const

const SENHA_DEMO = 'Sgh@2024!'

async function checarBancoComTimeout(): Promise<boolean> {
  try {
    const res = await fetch('/api/auth/health-database')
    const json = (await res.json().catch(() => ({ ok: false }))) as { ok?: boolean }
    return res.ok && Boolean(json?.ok)
  } catch {
    return true
  }
}

function FormularioLoginInner() {
  const searchParams = useSearchParams()
  const emailUrl = searchParams.get('email')?.trim().toLowerCase() ?? ''
  const [mostrarSenha, setMostrarSenha] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(schemaLogin),
    defaultValues: { email: '', senha: '', mfaCode: '' },
  })

  const emailRegister = register('email')
  const senhaValor = watch('senha') ?? ''
  const mfaCodeValor = watch('mfaCode') ?? ''

  useEffect(() => {
    if (emailUrl) setValue('email', emailUrl, { shouldValidate: true })
  }, [emailUrl, setValue])

  const handlePreencherDemo = (email: string) => {
    setValue('email', email, { shouldValidate: true })
    setValue('senha', SENHA_DEMO, { shouldValidate: true })
  }

  const handleToggleSenha = () => {
    setMostrarSenha((prev) => !prev)
  }

  async function onSubmit(dados: LoginForm) {
    try {
      const bancoOk = await checarBancoComTimeout()
      if (!bancoOk) {
        toast.warning('Banco de dados lento ou offline', {
          description: 'Tentando login mesmo assim. Se falhar, rode npm run db:compose:up e npm run db:seed.',
        })
      }

      const callbackUrl =
        typeof window !== 'undefined' && window.location?.origin
          ? `${window.location.origin}/entrando`
          : '/entrando'

      const resultado = await signIn('credentials', {
        email: dados.email.toLowerCase().trim(),
        senha: dados.senha,
        mfaCode: dados.mfaCode || '',
        redirect: false,
        callbackUrl,
      })

      if (resultado?.error) {
        if (resultado.error === 'Configuration') {
          toast.error('Configuração do servidor', {
            description:
              'Defina NEXTAUTH_SECRET no .env (veja .env.example), reinicie com npm run dev e use http://localhost:3002/login',
          })
          return
        }

        toast.error('Credenciais inválidas', {
          description:
            'Use admin@hospital.com / Sgh@2024! (após npm run db:seed). Clique em Entrar — não use só a URL com senha.',
        })
        return
      }

      if (resultado?.ok) {
        toast.success('Login realizado! Redirecionando…')
        // Navegação completa garante que o cookie de sessão seja aplicado antes do redirect por perfil
        window.location.assign('/entrando')
        return
      }

      toast.error('Não foi possível entrar', {
        description: 'Verifique se o endereço no navegador é http://localhost:3002/login.',
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      if (msg.includes('URL') || msg.includes('Invalid') || msg.includes('undefined')) {
        toast.error('Credenciais inválidas ou erro de conexão', {
          description: 'Verifique se o usuário/senha estão corretos e se o servidor está ativo na porta 3002.',
        })
      } else {
        toast.error('Erro na autenticação', {
          description: msg || 'Verifique se o servidor está ativo na porta 3002.',
        })
      }
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="space-y-1.5">
        <label htmlFor="email" className="text-xs font-semibold text-foreground">
          E-mail institucional
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="admin@hospital.com"
          className={`
            w-full px-3.5 py-2.5 rounded-xl border bg-background text-sm
            outline-none transition-all duration-200
            focus:ring-2 focus:ring-primary/20 focus:border-primary
            disabled:opacity-50 disabled:cursor-not-allowed shadow-xs
            ${errors.email ? 'border-destructive focus:ring-destructive/30' : 'border-border/80'}
          `}
          disabled={isSubmitting}
          name={emailRegister.name}
          ref={emailRegister.ref}
          onBlur={emailRegister.onBlur}
          onChange={emailRegister.onChange}
        />
        {errors.email ? (
          <p className="text-xs text-destructive">{errors.email.message}</p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="senha" className="text-xs font-semibold text-foreground">
            Senha
          </label>
          <Link href="/recuperar-senha" className="text-xs font-medium text-primary hover:underline">
            Esqueceu a senha?
          </Link>
        </div>
        <div className="relative">
          <input
            id="senha"
            name="senha"
            autoComplete="current-password"
            placeholder="Sgh@2024!"
            disabled={isSubmitting}
            value={senhaValor}
            onChange={(e) => setValue('senha', e.target.value, { shouldValidate: true, shouldDirty: true })}
            onBlur={() => undefined}
            type={mostrarSenha ? 'text' : 'password'}
            className={`
              w-full px-3.5 py-2.5 pr-11 rounded-xl border bg-background text-sm
              outline-none transition-all duration-200
              focus:ring-2 focus:ring-primary/20 focus:border-primary
              disabled:opacity-50 disabled:cursor-not-allowed shadow-xs
              ${errors.senha ? 'border-destructive focus:ring-destructive/30' : 'border-border/80'}
            `}
            aria-label="Senha de acesso"
          />
          <button
            type="button"
            onClick={handleToggleSenha}
            onMouseDown={(e) => e.preventDefault()}
            className="absolute right-2.5 top-1/2 z-10 -translate-y-1/2 rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            tabIndex={0}
            aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
            aria-pressed={mostrarSenha}
          >
            {mostrarSenha ? (
              <EyeOff className="h-4 w-4" aria-hidden />
            ) : (
              <Eye className="h-4 w-4" aria-hidden />
            )}
          </button>
        </div>
        {errors.senha ? (
          <p className="text-xs text-destructive">{errors.senha.message}</p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="mfaCode" className="text-xs font-semibold text-foreground">
          Código MFA <span className="text-muted-foreground font-normal">(se ativado)</span>
        </label>
        <input
          id="mfaCode"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          placeholder="000000"
          disabled={isSubmitting}
          value={mfaCodeValor}
          onChange={(e) => setValue('mfaCode', e.target.value.replace(/\D/g, '').slice(0, 6), { shouldValidate: true, shouldDirty: true })}
          className="w-full px-3.5 py-2.5 rounded-xl border border-border/80 bg-background text-sm outline-none transition-all duration-200 focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-xs tracking-widest text-center sm:text-left"
          aria-describedby="mfa-help"
        />
        {errors.mfaCode ? <p className="text-xs text-destructive">{errors.mfaCode.message}</p> : null}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="
          w-full flex items-center justify-center gap-2
          px-4 py-2.5 rounded-xl
          bg-primary text-primary-foreground
          text-sm font-semibold shadow-md shadow-primary/20
          hover:bg-primary/90 active:scale-[0.99]
          transition-all duration-200
          disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
        "
        id="btn-entrar"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Autenticando...
          </>
        ) : (
          <>
            <LogIn className="h-4 w-4" aria-hidden />
            Entrar no sistema
          </>
        )}
      </button>

      <div className="rounded-xl border border-border/70 bg-muted/40 p-3.5 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-foreground">Acesso Rápido de Demonstração</span>
          <span className="text-[10px] text-muted-foreground font-mono">Senha: {SENHA_DEMO}</span>
        </div>
        <div className="flex flex-wrap gap-1.5 pt-1">
          {CREDENCIAIS_DEMO.map((c) => (
            <button
              key={c.email}
              type="button"
              onClick={() => handlePreencherDemo(c.email)}
              className="rounded-lg border border-border/80 bg-background px-2.5 py-1 text-[11px] font-medium hover:bg-muted/80 hover:border-primary/50 transition-colors shadow-2xs"
              aria-label={`Preencher login ${c.perfil}`}
            >
              {c.perfil}
            </button>
          ))}
        </div>
      </div>
    </form>
  )
}

export function FormularioLogin() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Carregando formulário…</p>}>
      <FormularioLoginInner />
    </Suspense>
  )
}
