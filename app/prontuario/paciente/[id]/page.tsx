// app/prontuario/paciente/[id]/page.tsx
// Visualização limpa e dedicada do Prontuário Eletrônico Longitudinal (PEP)
// Aberto em tela inteira sem o menu de navegação lateral (dashboard sidebar)

import { use } from 'react';
import type { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { TimelineHistoricoPaciente } from '@/components/prontuario/TimelineHistoricoPaciente';

export const metadata: Metadata = {
  title: 'Histórico Longitudinal do Paciente (PEP) | SGH',
};

export default function PaginaHistoricoLongitudinal({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <div className="min-h-screen bg-background text-foreground py-6 px-4 sm:px-6 lg:px-8">
      <TimelineHistoricoPaciente pacienteId={id} />
    </div>
  );
}
