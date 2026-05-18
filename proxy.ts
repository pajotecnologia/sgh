// middleware.ts
// Proteção de rotas por autenticação e role (RBAC)
// Executado pelo Edge Runtime do Next.js antes de cada requisição

import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import type { Role } from '@prisma/client';

// Mapeamento de rotas para roles permitidos
// Qualquer rota não listada requer apenas autenticação
const ROTAS_RESTRITAS: Record<string, Role[]> = {
  '/recepcao': ['ADMIN', 'RECEPCIONISTA'],
  '/triagem': ['ADMIN', 'ENFERMEIRO', 'MEDICO'],
  // Diretor tem as mesmas rotas médicas nas APIs — alinhar com o middleware da UI
  '/atendimento': ['ADMIN', 'MEDICO', 'DIRETOR_CLINICO'],
  '/enfermagem': ['ADMIN', 'ENFERMEIRO', 'TECNICO_ENFERMAGEM'],
  '/prontuario': ['ADMIN', 'MEDICO', 'DIRETOR_CLINICO'],
  '/admin': ['ADMIN'],
  '/relatorios': ['ADMIN', 'DIRETOR_CLINICO'],
};

export default withAuth(
  function proxy(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    // Verificar se a rota tem restrição de role
    const rotaRestrita = Object.entries(ROTAS_RESTRITAS).find(([rota]) =>
      pathname.startsWith(rota)
    );

    if (rotaRestrita) {
      const [, rolesPermitidos] = rotaRestrita;
      const roleUsuario = token?.role as Role | undefined;

      if (!roleUsuario || !rolesPermitidos.includes(roleUsuario)) {
        // Redirecionar para página de acesso negado ao invés de 403
        return NextResponse.redirect(new URL('/acesso-negado', req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      // Rotas públicas que não devem exigir sessão (ex.: TV do painel busca histórico sem cookie)
      authorized: ({ req, token }) => {
        const p = req.nextUrl.pathname;
        if (p.startsWith('/api/painel/historico')) return true;
        return !!token;
      },
    },
    pages: {
      signIn: '/login',
    },
  }
);

// Rotas protegidas pelo middleware (excluir rotas públicas e assets)
export const config = {
  matcher: [
    /*
     * Aplicar middleware em todas as rotas EXCETO:
     * - /login, /acesso-negado (páginas públicas)
     * - /painel (painel de chamada — rota pública para TVs)
     * - /api/auth/* (NextAuth callbacks)
     * - Arquivos estáticos (_next, favicon, etc.)
     */
    '/((?!login|acesso-negado|recuperar-senha|redefinir-senha|painel|api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
};
