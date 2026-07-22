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

async function checarBancoComTimeout(ms = 8000): Promise<boolean> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), ms)
  try {
    const res = await fetch('/api/auth/health-database', { signal: ctrl.signal })
    const json = await res.json().catch(() => ({ ok: false }))
    return res.ok && Boolean((json as { ok?: boolean }).ok)
  } catch {
    return false
  } finally {
    clearTimeout(timer)
  }
}

function FormularioLoginInner() {
  const searchParams = useSearchParams()
  const emailUrl = searchParams.get('email')?.trim().toLowerCase() ?? ''
  const senhaUrl = searchParams.get('senha') ?? ''
  const [mostrarSenha, setMostrarSenha] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(schemaLogin),
    defaultValues: { email: '', senha: '' },
  })

  const emailRegister = register('email')
  const senhaValor = watch('senha') ?? ''

  useEffect(() => {
    if (emailUrl) setValue('email', emailUrl, { shouldValidate: true })
    if (senhaUrl) setValue('senha', senhaUrl, { shouldValidate: true })
  }, [emailUrl, senhaUrl, setValue])

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

      const resultado = await signIn('credentials', {
        email: dados.email.toLowerCase().trim(),
        senha: dados.senha,
        redirect: false,
        callbackUrl: '/entrando',
      })

      if (resultado?.error) {
        if (resultado.error === 'Configuration') {
          toast.error('Configuração do servidor', {
            description:
              'Defina NEXTAUTH_SECRET no .env (veja .env.example), reinicie com npm run dev e use http://localhost:3000/login',
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
        description: 'Tente http://localhost:3000/login (evite 127.0.0.1 se o login falhar).',
      })
    } catch {
      toast.error('Erro inesperado', {
        description: 'Verifique se o servidor está rodando (npm run dev).',
      })
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <div className="form-field">
        <label htmlFor="email" className="text-sm font-medium text-foreground">
          E-mail institucional
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="admin@hospital.com"
          className={`
            w-full px-3.5 py-2.5 rounded-lg border bg-background text-sm
            outline-none transition-all duration-150
            focus:ring-2 focus:ring-primary/30 focus:border-primary
            disabled:opacity-50 disabled:cursor-not-allowed
            ${errors.email ? 'border-destructive focus:ring-destructive/30' : 'border-input'}
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

      <div className="form-field">
        <label htmlFor="senha" className="text-sm font-medium text-foreground">
          Senha
        </label>
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
              w-full px-3.5 py-2.5 pr-11 rounded-lg border bg-background text-sm
              outline-none transition-all duration-150
              focus:ring-2 focus:ring-primary/30 focus:border-primary
              disabled:opacity-50 disabled:cursor-not-allowed
              ${errors.senha ? 'border-destructive focus:ring-destructive/30' : 'border-input'}
            `}
            aria-label="Senha de acesso"
          />
          <button
            type="button"
            onClick={handleToggleSenha}
            onMouseDown={(e) => e.preventDefault()}
            className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
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
        <p className="text-right">
          <Link href="/recuperar-senha" className="text-xs font-medium text-primary hover:underline">
            Esqueci minha senha
          </Link>
        </p>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="
          w-full flex items-center justify-center gap-2
          px-4 py-2.5 rounded-lg
          bg-primary text-primary-foreground
          text-sm font-semibold
          hover:bg-primary/90 active:scale-[0.98]
          transition-all duration-150
          disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
        "
        id="btn-entrar"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Entrando...
          </>
        ) : (
          <>
            <LogIn className="h-4 w-4" aria-hidden />
            Entrar no sistema
          </>
        )}
      </button>

      <div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 p-3 space-y-2">
        <p className="text-xs font-semibold text-foreground">Acesso demonstração</p>
        <p className="text-[11px] text-muted-foreground">
          Senha padrão: <span className="font-mono font-semibold text-foreground">{SENHA_DEMO}</span>
        </p>
        <p className="text-[11px] text-muted-foreground">
          Use <strong className="text-foreground">http://localhost:3000/login</strong>, preencha os campos e clique em Entrar.
        </p>
        <ul className="flex flex-wrap gap-1.5">
          {CREDENCIAIS_DEMO.map((c) => (
            <li key={c.email}>
              <button
                type="button"
                onClick={() => handlePreencherDemo(c.email)}
                className="rounded-md border border-border bg-background px-2 py-1 text-[10px] font-semibold hover:bg-muted/60"
                aria-label={`Preencher login ${c.perfil}`}
              >
                {c.perfil}
              </button>
            </li>
          ))}
        </ul>
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
