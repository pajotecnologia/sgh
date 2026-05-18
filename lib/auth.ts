// lib/auth.ts
// Configuração do NextAuth.js com RBAC (Role-Based Access Control)
// Sessão JWT com duração de 8h (turno de trabalho)

import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import type { Role } from '@/types';

declare module 'next-auth' {
  interface User {
    id: string;
    role: Role;
    nome: string;
    crm?: string | null;
    coren?: string | null;
  }

  interface Session {
    usuario: {
      id: string;
      nome: string;
      email: string;
      role: Role;
      crm?: string | null;
      coren?: string | null;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    email?: string | null;
    role: Role;
    nome: string;
    crm?: string | null;
    coren?: string | null;
  }
}

export const authOptions: NextAuthOptions = {
  // Usar JWT (stateless) — não requer tabela de sessões no banco
  session: {
    strategy: 'jwt',
    // 8 horas = turno de trabalho padrão
    maxAge: 8 * 60 * 60,
  },

  // Página de login customizada
  pages: {
    signIn: '/login',
    error: '/login',
  },

  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'E-mail', type: 'email' },
        senha: { label: 'Senha', type: 'password' },
      },

      async authorize(credentials) {
        const senhaPlano =
          credentials?.senha ??
          (credentials as { password?: string } | undefined)?.password;

        if (!credentials?.email || !senhaPlano) {
          throw new Error('E-mail e senha são obrigatórios.');
        }

        let usuario;

        try {
          usuario = await prisma.usuario.findFirst({
            where: {
              email: credentials.email.toLowerCase().trim(),
              ativo: true,
              deletedAt: null,
            },
          });
        } catch (e) {
          console.error('[auth] erro ao consultar usuário:', e);
          throw new Error(
            'Login indisponível no momento. Verifique o servidor e o banco de dados.'
          );
        }

        if (!usuario) {
          // Mensagem genérica para não revelar se o e-mail existe
          throw new Error('Credenciais inválidas.');
        }

        const senhaValida = await compare(senhaPlano, usuario.senhaHash);

        if (!senhaValida) {
          throw new Error('Credenciais inválidas.');
        }

        // Atualizar último acesso (não aguardar — fire and forget)
        prisma.usuario
          .update({
            where: { id: usuario.id },
            data: { ultimoAcesso: new Date() },
          })
          .catch(() => {
            // Ignorar erros silenciosamente — não bloquear o login
          });

        return {
          id: usuario.id,
          email: usuario.email,
          name: usuario.nome,
          nome: usuario.nome,
          role: usuario.role,
          crm: usuario.crm,
          coren: usuario.coren,
        };
      },
    }),
  ],

  callbacks: {
    // Enriquecer o JWT com dados do usuário
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.role = user.role;
        token.nome = user.nome;
        token.crm = user.crm;
        token.coren = user.coren;
      }
      return token;
    },

    // Enriquecer a sessão com dados do JWT
    async session({ session, token }) {
      session.usuario = {
        id: token.id,
        nome: token.nome,
        email: token.email!,
        role: token.role,
        crm: token.crm,
        coren: token.coren,
      };
      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,

  // Log de erros de autenticação (sem expor detalhes ao cliente)
  debug: process.env.NODE_ENV === 'development',
};
