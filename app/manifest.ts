import type { MetadataRoute } from 'next';

// Sessão 6 — metadados PWA (instalável no dispositivo; ícones podem ser adicionados em /public)
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'SGH — Sistema de Gerenciamento Hospitalar',
    short_name: 'SGH',
    description: 'Recepção, triagem, atendimento e painel de chamadas.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0f172a',
    theme_color: '#2563eb',
    lang: 'pt-BR',
    orientation: 'any',
  };
}
