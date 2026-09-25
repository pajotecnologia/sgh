// app/page.tsx — Landing Page Oficial do SGH
import type { Metadata } from 'next';
import { LandingPage } from '@/components/landing/LandingPage';

export const metadata: Metadata = {
  title: 'SGH — Sistema de Gestão Hospitalar | Plataforma Completa e Segura',
  description:
    'Sistema de Gestão Hospitalar de alta performance: Recepção, Triagem Manchester, Prontuário SOAP, Farmácia FEFO, Enfermagem e Mapa de Leitos com conformidade LGPD.',
};

export default function PaginaInicial() {
  return <LandingPage />;
}
