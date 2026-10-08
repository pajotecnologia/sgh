'use client';

import type { UsuarioSessao } from '@/types';
import { usePathname } from 'next/navigation';
import { DashboardNavProvider } from '@/components/shared/dashboard-nav-context';
import { Sidebar } from '@/components/shared/Sidebar';
import { Header } from '@/components/shared/Header';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';

export function DashboardShell({
  usuario,
  children,
}: {
  usuario: UsuarioSessao;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isPrintPage = pathname?.includes('/imprimir') || pathname?.includes('/imprimir-senha');

  if (isPrintPage) {
    return (
      <main
        id="conteudo-principal"
        className="h-screen w-full overflow-y-auto overflow-x-hidden bg-slate-100 dark:bg-background text-foreground print:h-auto print:overflow-visible print:bg-white print:p-0"
      >
        <ErrorBoundary fallbackTitle="Erro ao carregar documento">
          {children}
        </ErrorBoundary>
      </main>
    );
  }

  return (
    <DashboardNavProvider>
      <div className="dashboard-layout">
        <ErrorBoundary fallbackTitle="Menu indisponível" fallbackMessage="O menu lateral apresentou uma falha de carregamento.">
          <Sidebar usuario={usuario} />
        </ErrorBoundary>
        <div className="dashboard-main min-w-0">
          <ErrorBoundary fallbackTitle="Cabeçalho indisponível" fallbackMessage="O cabeçalho apresentou uma falha de carregamento.">
            <Header usuario={usuario} />
          </ErrorBoundary>
          <main className="dashboard-content" id="conteudo-principal">
            <ErrorBoundary fallbackTitle="Falha ao carregar a página" fallbackMessage="Houve um problema ao renderizar o conteúdo desta página.">
              {children}
            </ErrorBoundary>
          </main>
        </div>
      </div>
    </DashboardNavProvider>
  );
}
