// app/(dashboard)/layout.tsx
// Layout protegido do dashboard — Sidebar + Header

import type { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { DashboardShell } from '@/components/shared/DashboardShell';

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

  if (!sessao) {
    redirect('/login');
  }

  return <DashboardShell usuario={sessao.usuario}>{children}</DashboardShell>;
}
