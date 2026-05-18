// app/painel/layout.tsx — Layout limpo para o painel (sem sidebar, tela cheia)
// NOTA: No Next.js App Router, apenas o root layout (app/layout.tsx) pode conter
// <html> e <body>. Layouts aninhados recebem esses elementos automaticamente.
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Painel de Chamada | SGH',
  description: 'Painel de chamada de pacientes — atualização em tempo real',
  robots: { index: false, follow: false },
};

export default function PainelLayout({ children }: { children: React.ReactNode }) {
  // Layout completamente limpo — sem Header, Sidebar ou providers de autenticação
  // O painel é uma rota pública projetada para TVs na sala de espera
  return (
    <div className="bg-slate-950 text-white min-h-screen overflow-hidden select-none">
      {children}
    </div>
  );
}
