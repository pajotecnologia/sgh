// components/auth/FormularioLogin.tsx
// Formulário de login com React Hook Form + Zod + NextAuth

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { Loader2, Eye, EyeOff, LogIn } from 'lucide-react';
import { toast } from 'sonner';

const schemaLogin = z.object({
  email: z
    .string()
    .min(1, 'E-mail é obrigatório.')
    .email('E-mail inválido.'),
  senha: z
    .string()
    .min(6, 'Senha deve ter pelo menos 6 caracteres.'),
});

type LoginForm = z.infer<typeof schemaLogin>;

export function FormularioLogin() {
  const router = useRouter();
  const [mostrarSenha, setMostrarSenha] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(schemaLogin),
  });

  async function onSubmit(dados: LoginForm) {
    try {
      const checagemDb = await fetch('/api/auth/health-database');
      const corpoDb = await checagemDb.json().catch(() => ({ ok: false }));
      if (!checagemDb.ok || !(corpoDb as { ok?: boolean }).ok) {
        toast.error('Banco de dados offline', {
          description:
            (corpoDb as { message?: string }).message ??
            'PostgreSQL não responde. Inicie o servidor e confira DATABASE_URL no .env.',
        });
        return;
      }

      const resultado = await signIn('credentials', {
        email: dados.email.toLowerCase().trim(),
        senha: dados.senha,
        redirect: false,
      });

      if (resultado?.error) {
        toast.error('Credenciais inválidas', {
          description:
            'E-mail ou senha incorretos — ou usuários ainda não foram criados. Rode npm run db:seed. Exemplo: admin@hospital.com e senha Sgh@2024!',
        });
        return;
      }

      if (resultado?.ok) {
        toast.success('Login realizado com sucesso!');
        // Redirecionar para o dashboard — o middleware cuidará do role
        router.push('/dashboard');
        router.refresh();
      }
    } catch {
      toast.error('Erro inesperado', {
        description: 'Tente novamente em instantes.',
      });
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      {/* E-mail */}
      <div className="form-field">
        <label
          htmlFor="email"
          className="text-sm font-medium text-foreground"
        >
          E-mail institucional
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="seu@hospital.com.br"
          className={`
            w-full px-3.5 py-2.5 rounded-lg border bg-background text-sm
            outline-none transition-all duration-150
            focus:ring-2 focus:ring-primary/30 focus:border-primary
            disabled:opacity-50 disabled:cursor-not-allowed
            ${errors.email
              ? 'border-destructive focus:ring-destructive/30'
              : 'border-input'
            }
          `}
          disabled={isSubmitting}
          {...register('email')}
        />
        {errors.email && (
          <p className="text-xs text-destructive">{errors.email.message}</p>
        )}
      </div>

      {/* Senha */}
      <div className="form-field">
        <label
          htmlFor="senha"
          className="text-sm font-medium text-foreground"
        >
          Senha
        </label>
        <div className="relative">
          <input
            id="senha"
            type={mostrarSenha ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="••••••••"
            className={`
              w-full px-3.5 py-2.5 pr-10 rounded-lg border bg-background text-sm
              outline-none transition-all duration-150
              focus:ring-2 focus:ring-primary/30 focus:border-primary
              disabled:opacity-50 disabled:cursor-not-allowed
              ${errors.senha
                ? 'border-destructive focus:ring-destructive/30'
                : 'border-input'
              }
            `}
            disabled={isSubmitting}
            {...register('senha')}
          />
          <button
            type="button"
            onClick={() => setMostrarSenha(!mostrarSenha)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            tabIndex={-1}
            aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
          >
            {mostrarSenha ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        {errors.senha && (
          <p className="text-xs text-destructive">{errors.senha.message}</p>
        )}
        <p className="text-right">
          <Link href="/recuperar-senha" className="text-xs font-medium text-primary hover:underline">
            Esqueci minha senha
          </Link>
        </p>
      </div>

      {/* Botão de submit */}
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
            <Loader2 className="h-4 w-4 animate-spin" />
            Entrando...
          </>
        ) : (
          <>
            <LogIn className="h-4 w-4" />
            Entrar no sistema
          </>
        )}
      </button>
    </form>
  );
}
