// app/api/auth/[...nextauth]/route.ts
// Handler NextAuth — expõe os endpoints /api/auth/*

import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextRequest } from 'next/server';

const handler = NextAuth(authOptions);

async function authHandler(req: NextRequest, context: { params: Promise<{ nextauth: string[] }> }) {
  const res = await handler(req, context);

  // Garante que qualquer resposta JSON devolvida pelo NextAuth (especialmente em erros ou callbacks)
  // possua a propriedade `url` com valor absoluto válido.
  // Isso previne fatal crash de `new URL(data.url)` no client `@next-auth/react`.
  const contentType = res.headers.get('content-type');
  if (contentType?.includes('application/json')) {
    try {
      const cloned = res.clone();
      const text = await cloned.text();
      const data = JSON.parse(text);

      if (data && typeof data === 'object') {
        const origin = (req.nextUrl.origin || process.env.NEXTAUTH_URL || 'http://localhost:3002').replace(/\/$/, '');

        if (!data.url || typeof data.url !== 'string') {
          if (res.status >= 400 || data.error) {
            const errParam = encodeURIComponent(data.error || 'CredentialsSignin');
            data.url = `${origin}/login?error=${errParam}`;
          } else {
            data.url = `${origin}/entrando`;
          }
        } else if (!data.url.startsWith('http://') && !data.url.startsWith('https://')) {
          const path = data.url.startsWith('/') ? data.url : `/${data.url}`;
          data.url = `${origin}${path}`;
        }

        return new Response(JSON.stringify(data), {
          status: res.status,
          headers: res.headers,
        });
      }
    } catch {
      // Em caso de exceção de parsing, devolve a resposta original
    }
  }

  return res;
}

export { authHandler as GET, authHandler as POST };


