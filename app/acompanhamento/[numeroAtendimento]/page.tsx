// app/acompanhamento/[numeroAtendimento]/page.tsx
// Página pública mobile-first de acompanhamento do paciente via QR Code

import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { buscarDadosAcompanhamentoPaciente } from '@/lib/acompanhamento-paciente';
import { PainelAcompanhamentoMobile } from '@/components/painel/PainelAcompanhamentoMobile';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ numeroAtendimento: string }>;
}): Promise<Metadata> {
  const { numeroAtendimento } = await params;
  return {
    title: `Acompanhamento ${numeroAtendimento} | SGH`,
    description: 'Acompanhe a chamada da sua senha em tempo real pelo celular.',
    robots: { index: false, follow: false },
  };
}

export default async function PaginaAcompanhamentoPaciente({
  params,
}: {
  params: Promise<{ numeroAtendimento: string }>;
}) {
  const { numeroAtendimento } = await params;
  const decoded = decodeURIComponent(numeroAtendimento);
  const dados = await buscarDadosAcompanhamentoPaciente(decoded);

  return (
    <PainelAcompanhamentoMobile
      dadosIniciais={dados}
      numeroAtendimento={decoded}
    />
  );
}
