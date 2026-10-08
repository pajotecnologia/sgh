// app/(dashboard)/layout.tsx
// Layout protegido do dashboard — Sidebar + Header

import type { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { DashboardShell } from '@/components/shared/DashboardShell';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: {
    template: '%s | SGH',
    default: 'Dashboard | SGH',
  },
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sessao = await getServerSession(authOptions);

  // Sessão parcialmente inválida (ex.: JWT antigo/incompleto) não deve
  // chegar ao DashboardShell e provocar erro de renderização.
  if (!sessao?.usuario?.id || !sessao.usuario.role) {
    redirect('/login?reason=session');
  }

  return <DashboardShell usuario={sessao.usuario}>{children}</DashboardShell>;
}
