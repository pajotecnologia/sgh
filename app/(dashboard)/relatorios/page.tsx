// app/(dashboard)/relatorios/page.tsx — Sessão 6 (base para relatórios / PDF)

import type { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { BarChart3 } from 'lucide-react';
import { FormularioRelatorioAtendimentosDia } from '@/components/relatorios/FormularioRelatorioAtendimentosDia';

export const metadata: Metadata = { title: 'Relatórios' };

export default async function PaginaRelatorios() {
  const sessao = await getServerSession(authOptions);
  if (!sessao) redirect('/login');
  if (!['ADMIN', 'DIRETOR_CLINICO'].includes(sessao.usuario.role)) redirect('/acesso-negado');

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="space-y-4">
        <h1 className="page-title flex items-center gap-2">
          <BarChart3 className="h-7 w-7 text-primary" />
          Relatórios
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Exportações em PDF para gestão. Para detalhe clínico por paciente, use a{' '}
          <strong className="text-foreground">ficha de impressão</strong> no atendimento e a{' '}
          <strong className="text-foreground">Auditoria</strong> (admin) para trilha de eventos.
        </p>
      </div>
      <FormularioRelatorioAtendimentosDia />
    </div>
  );
}
