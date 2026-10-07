'use client';

import type { UsuarioSessao } from '@/types';
import { usePathname } from 'next/navigation';
import { DashboardNavProvider } from '@/components/shared/dashboard-nav-context';
import { Sidebar } from '@/components/shared/Sidebar';
import { Header } from '@/components/shared/Header';

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
        {children}
      </main>
    );
  }

  return (
    <DashboardNavProvider>
      <div className="dashboard-layout">
        <Sidebar usuario={usuario} />
        <div className="dashboard-main min-w-0">
          <Header usuario={usuario} />
          <main className="dashboard-content" id="conteudo-principal">
            {children}
          </main>
        </div>
      </div>
    </DashboardNavProvider>
  );
}
