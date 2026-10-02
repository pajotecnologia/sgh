// app/(dashboard)/configuracoes/page.tsx
import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { ConfiguracoesClient } from '@/components/configuracoes/ConfiguracoesClient';

export const metadata: Metadata = { title: 'Configurações do Sistema' };

export default async function ConfiguracoesPage() {
  const sessao = await getServerSession(authOptions);

  if (!sessao) redirect('/login');
  if (sessao.usuario.role !== 'ADMIN') redirect('/acesso-negado');

  return (
    <div className="w-full max-w-[1400px] min-w-0 mx-auto space-y-5 sm:space-y-6 overflow-x-hidden">
      <div>
        <h1 className="page-title tracking-tight">Configurações do Sistema</h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
          Gerencie os dados da instituição, logomarca, painel de chamada e parâmetros globais.
        </p>
      </div>

      <ConfiguracoesClient />
    </div>
  );
}
