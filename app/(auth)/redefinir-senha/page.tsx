'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

function FormularioRedefinir() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get('token') ?? '';
  const [senha, setSenha] = useState('');
  const [senha2, setSenha2] = useState('');
  const [salvando, setSalvando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (senha !== senha2) {
      toast.error('As senhas não conferem.');
      return;
    }
    if (senha.length < 6) {
      toast.error('Mínimo 6 caracteres.');
      return;
    }
    setSalvando(true);
    try {
      const res = await fetch('/api/auth/redefinir-senha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, novaSenha: senha }),
      });
      const json = await res.json();
      if (json.sucesso) {
        toast.success('Senha alterada! Faça login.');
        router.push('/login');
      } else {
        toast.error(json.erro ?? 'Não foi possível alterar.');
      }
    } catch {
      toast.error('Erro de conexão.');
    } finally {
      setSalvando(false);
    }
  }

  if (!token) {
    return (
      <p className="text-sm text-destructive">
        Link inválido. Use o link recebido por e-mail ou solicite novamente em &quot;Esqueci minha senha&quot;.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium">Nova senha</label>
        <input
          type="password"
          required
          autoComplete="new-password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          className="mt-1 w-full px-3 py-2 rounded-lg border border-input bg-background text-sm"
        />
      </div>
      <div>
        <label className="text-sm font-medium">Confirmar senha</label>
        <input
          type="password"
          required
          autoComplete="new-password"
          value={senha2}
          onChange={(e) => setSenha2(e.target.value)}
          className="mt-1 w-full px-3 py-2 rounded-lg border border-input bg-background text-sm"
        />
      </div>
      <button
        type="submit"
        disabled={salvando}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold disabled:opacity-60"
      >
        {salvando ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Salvar nova senha
      </button>
    </form>
  );
}

export default function PaginaRedefinirSenha() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-muted/30">
      <div className="w-full max-w-md bg-card border border-border rounded-xl p-8 shadow-sm space-y-6">
        <Link href="/login" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Voltar ao login
        </Link>
        <h1 className="text-xl font-bold">Nova senha</h1>
        <Suspense fallback={<Loader2 className="h-6 w-6 animate-spin" />}>
          <FormularioRedefinir />
        </Suspense>
      </div>
    </div>
  );
}
