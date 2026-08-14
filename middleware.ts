// middleware.ts
// Middleware global do Next.js para proteção de rotas da API e páginas restritas

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Rotas públicas que NÃO exigem autenticação
const PUBLIC_PATHS = [
  '/login',
  '/esqueci-senha',
  '/redefinir-senha',
  '/acesso-negado',
  '/favicon.ico',
  '/manifest.ts',
  '/manifest.webmanifest',
];

// Prefixos da API públicos (ex: auth, healthcheck e chamadas de painel TV)
const PUBLIC_API_PREFIXES = [
  '/api/auth',
  '/api/painel/config',
  '/api/painel/historico',
];

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  if (pathname.startsWith('/_next') || pathname.startsWith('/public') || pathname.startsWith('/images')) return true;
  return PUBLIC_API_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Permitir rotas públicas conhecidas
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Obter segredo para validação do token JWT
  const secret = process.env.NEXTAUTH_SECRET || 'dev-sgh-nextauth-secret-min-32-chars!!';
  const token = await getToken({ req, secret });

  // Se for uma requisição para a API sem token válido -> Retornar 401 JSON
  if (pathname.startsWith('/api/')) {
    if (!token) {
      return NextResponse.json(
        { sucesso: false, erro: 'Sessão expirada ou não autenticada. Faça login novamente.' },
        { status: 401 }
      );
    }
    return NextResponse.next();
  }

  // Se for uma página e o usuário não estiver logado -> Redirecionar para /login
  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('callbackUrl', req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
