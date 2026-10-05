// app/acompanhamento/layout.tsx
// Layout para acompanhamento mobile de pacientes

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Acompanhamento de Atendimento | SGH',
  description: 'Acompanhe a chamada da sua senha em tempo real pelo celular.',
  robots: { index: false, follow: false },
};

export default function AcompanhamentoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-slate-950 text-white min-h-screen">
      {children}
    </div>
  );
}
