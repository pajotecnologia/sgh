'use client';

import type { UsuarioSessao } from '@/types';
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
