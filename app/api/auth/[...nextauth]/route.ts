// app/api/auth/[...nextauth]/route.ts
// Handler NextAuth — expõe os endpoints /api/auth/*

import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextRequest } from 'next/server';

const handler = NextAuth(authOptions);

async function authHandler(req: NextRequest, context: { params: Promise<{ nextauth: string[] }> }) {
  const res = await handler(req, context);

  // Se a resposta for JSON e contiver uma URL relativa, convertemos para absoluta
  // prevenindo o erro "Failed to construct 'URL': Invalid URL" no next-auth/react client
  const contentType = res.headers.get('content-type');
  if (contentType?.includes('application/json')) {
    try {
      const cloned = res.clone();
      const text = await cloned.text();
      const data = JSON.parse(text);
      if (data && typeof data.url === 'string' && data.url.startsWith('/')) {
        const origin = req.nextUrl.origin || process.env.NEXTAUTH_URL || 'http://localhost:3002';
        data.url = `${origin.replace(/\/$/, '')}${data.url}`;
        return new Response(JSON.stringify(data), {
          status: res.status,
          headers: res.headers,
        });
      }
    } catch {
      // Retorna a resposta original em caso de exceção de parsing
    }
  }

  return res;
}

export { authHandler as GET, authHandler as POST };

