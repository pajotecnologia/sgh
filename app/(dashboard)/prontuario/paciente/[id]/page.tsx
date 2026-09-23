import { use } from 'react';
import type { Metadata } from 'next';
import { TimelineHistoricoPaciente } from '@/components/prontuario/TimelineHistoricoPaciente';

export const metadata: Metadata = {
  title: 'Histórico Longitudinal do Paciente (PEP)',
};

export default function PaginaHistoricoLongitudinal({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <div className="py-2">
      <TimelineHistoricoPaciente pacienteId={id} />
    </div>
  );
}
