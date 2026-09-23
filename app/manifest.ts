import type { MetadataRoute } from 'next';

// Sessão 6 — metadados PWA (instalável no dispositivo; ícones podem ser adicionados em /public)
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'SGH — Sistema de Gerenciamento Hospitalar',
    short_name: 'SGH',
    description: 'Recepção, triagem, atendimento médico, enfermagem e farmácia hospitalar.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0f172a',
    theme_color: '#2563eb',
    lang: 'pt-BR',
    orientation: 'any',
    categories: ['medical', 'health', 'productivity'],
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon.svg',
        sizes: '512x512',
        type: 'image/svg+xml',
      },
      {
        src: '/icons/apple-touch-icon.png',
        sizes: '192x192',
        type: 'image/png',
      },
    ],
  };
}

