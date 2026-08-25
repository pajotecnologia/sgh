/** @type {import('next').NextConfig} */
const nextConfig = {
  // Build otimizado para VPS/Docker: artefatos finais copiados para release/app (npm run build:release)
  output: 'standalone',

  // Next.js 16 — permite acessar o dev server por 127.0.0.1 / IP da rede (evita falha de HMR e auth)
  allowedDevOrigins: ['127.0.0.1', '10.0.0.81', 'localhost'],

  // Configurações de imagem para uploads de documentos
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },

  // Headers de segurança
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' wss: https:; frame-src 'self' blob:; object-src 'self' blob:;",
          },
        ],
      },
    ];
  },

  // Redirecionamento da raiz para o painel de login
  async redirects() {
    return [
      {
        source: '/',
        destination: '/login',
        permanent: false,
      },
    ];
  },
};

module.exports = nextConfig;
