// app/layout.tsx
// Layout raiz — providers globais: NextAuth, Sonner (toasts), ThemeProvider

import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'sonner';
import { Providers } from '@/components/providers';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [{ media: '(prefers-color-scheme: light)', color: '#f8fafc' }],
};

export const metadata: Metadata = {
  title: {
    template: '%s | SGH — Sistema de Gerenciamento Hospitalar',
    default: 'SGH — Sistema de Gerenciamento Hospitalar',
  },
  description:
    'Sistema de Gerenciamento Hospitalar integrado com Recepção, Triagem Manchester, Painel de Chamada, Atendimento Médico e Prontuário Eletrônico.',
  keywords: ['hospital', 'gestão hospitalar', 'triagem', 'prontuário eletrônico', 'SGH'],
  robots: { index: false, follow: false }, // Sistema interno — não indexar
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          {children}
          {/* Toast notifications — posicionado no canto superior direito */}
          <Toaster
            position="top-right"
            richColors
            closeButton
            duration={5000}
            toastOptions={{
              classNames: {
                error: 'bg-destructive text-destructive-foreground',
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
