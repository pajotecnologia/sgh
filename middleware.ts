// middleware.ts
// Middleware global do Next.js para proteção de rotas da API e páginas restritas.

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

const PUBLIC_PATHS = [
  '/login',
  '/ajuda',
  '/manual',
  '/esqueci-senha',
  '/recuperar-senha',
  '/redefinir-senha',
  '/acesso-negado',
  '/favicon.ico',
  '/manifest.ts',
  '/manifest.webmanifest',
];

const PUBLIC_API_PATHS = [
  '/api/auth',
  '/api/painel/config',
  '/api/painel/historico',
];

const UNSAFE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  if (pathname.startsWith('/_next') || pathname.startsWith('/public') || pathname.startsWith('/images')) return true;

  return PUBLIC_API_PATHS.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

function applySecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Request-ID', crypto.randomUUID());
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains'
    );
  }

  return response;
}

function hasValidOrigin(req: NextRequest): boolean {
  if (!UNSAFE_METHODS.has(req.method)) return true;

  const origin = req.headers.get('origin');
  if (!origin) return true;

  try {
    return new URL(origin).origin === req.nextUrl.origin;
  } catch {
    return false;
  }
}

function getAuthSecret(): string | null {
  const secret = process.env.NEXTAUTH_SECRET;

  if (!secret || secret.length < 32) {
    return null;
  }

  return secret;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (!hasValidOrigin(req)) {
    return applySecurityHeaders(
      NextResponse.json(
        { sucesso: false, erro: 'Origem da requisição não autorizada.' },
        { status: 403 }
      )
    );
  }

  if (isPublicPath(pathname)) {
    return applySecurityHeaders(NextResponse.next());
  }

  const secret = getAuthSecret();

  // Em produção, nunca aceitar um segredo padrão/fallback para autenticação.
  if (!secret && process.env.NODE_ENV === 'production') {
    return applySecurityHeaders(
      NextResponse.json(
        { sucesso: false, erro: 'Configuração de autenticação indisponível.' },
        { status: 500 }
      )
    );
  }

  // Apenas desenvolvimento pode continuar usando um segredo temporário para facilitar o boot local.
  const effectiveSecret = secret || 'dev-sgh-nextauth-secret-min-32-chars!!';
  const token = await getToken({ req, secret: effectiveSecret });

  if (pathname.startsWith('/api/')) {
    if (!token) {
      return applySecurityHeaders(
        NextResponse.json(
          { sucesso: false, erro: 'Sessão expirada ou não autenticada. Faça login novamente.' },
          {
            status: 401,
            headers: { 'Cache-Control': 'no-store' },
          }
        )
      );
    }

    const response = NextResponse.next();
    response.headers.set('Cache-Control', 'no-store');
    return applySecurityHeaders(response);
  }

  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('callbackUrl', req.nextUrl.pathname);
    return applySecurityHeaders(NextResponse.redirect(url));
  }

  return applySecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
