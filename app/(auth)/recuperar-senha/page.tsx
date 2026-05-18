'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export default function PaginaRecuperarSenha() {
  const [email, setEmail] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    try {
      const res = await fetch('/api/auth/recuperar-senha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();
      if (json.sucesso) {
        toast.success(json.mensagem ?? 'Verifique seu e-mail.');
        setEmail('');
      } else {
        toast.error(json.erro ?? 'Não foi possível enviar.');
      }
    } catch {
      toast.error('Erro de conexão.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-muted/30">
      <div className="w-full max-w-md bg-card border border-border rounded-xl p-8 shadow-sm space-y-6">
        <Link href="/login" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Voltar ao login
        </Link>
        <div>
          <h1 className="text-xl font-bold">Esqueci minha senha</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Informe seu e-mail institucional. Se existir cadastro, enviaremos um link para redefinir a senha
            (requer SMTP configurado pelo administrador).
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="text-sm font-medium">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-input bg-background text-sm"
              placeholder="seu@hospital.com"
            />
          </div>
          <button
            type="submit"
            disabled={enviando}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold disabled:opacity-60"
          >
            {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Enviar link
          </button>
        </form>
      </div>
    </div>
  );
}
