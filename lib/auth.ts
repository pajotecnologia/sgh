// lib/auth.ts
// Configuração do NextAuth.js com RBAC (Role-Based Access Control)
// Sessão JWT com duração de 8h (turno de trabalho)

import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import type { Role } from '@/types';
import type { Session } from 'next-auth';
import { verificarRateLimit, obterIpCliente } from '@/lib/rate-limit';
import { descriptografarSegredoTotp, verificarTotp } from '@/lib/totp';
import { criarIdentificadorSessao, hashIdentificadorSessao, DURACAO_SESSAO_MS, obterDispositivo } from '@/lib/sessoes';

declare module 'next-auth' {
  interface User {
    id: string;
    role: Role;
    nome: string;
    crm?: string | null;
    coren?: string | null;
    sessaoId?: string;
  }

  interface Session {
    usuario: {
      id: string;
      nome: string;
      email: string;
      role: Role;
      crm?: string | null;
      coren?: string | null;
      sessaoId?: string;
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
    sessaoId?: string;
  }
}

function resolverNextAuthSecret(): string {
  const bruto = process.env.NEXTAUTH_SECRET?.trim();
  const placeholder =
    !bruto ||
    bruto.includes('sua-chave-secreta') ||
    bruto.length < 16;

  if (!placeholder) return bruto;

  // Fallback seguro para compilação estática de rotas e modo de desenvolvimento
  return process.env.NEXTAUTH_SECRET || 'dev-sgh-nextauth-secret-min-32-chars!!';
}

const nextAuthSecret = resolverNextAuthSecret();

export const authOptions: NextAuthOptions = {
  // JWT continua sendo o mecanismo de sessão do NextAuth; SessaoUsuario adiciona revogação e rastreabilidade persistidas.
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
      mfaCode: { label: 'Código MFA', type: 'text' },
      },

      async authorize(credentials, req) {
        const senhaPlano =
          credentials?.senha ??
          (credentials as { password?: string } | undefined)?.password;

        if (!credentials?.email || !senhaPlano) {
          throw new Error('E-mail e senha são obrigatórios.');
        }

        const email = credentials.email.toLowerCase().trim();
        const mfaCode = typeof credentials.mfaCode === 'string' ? credentials.mfaCode.replace(/\D/g, '') : '';
        const forwarded = req.headers?.['x-forwarded-for'];
        const ipOrigem = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : '127.0.0.1';
        const limiteLogin = verificarRateLimit(`login:${ipOrigem}:${email}`, { limite: 8, janelaSegundos: 15 * 60 });
        if (!limiteLogin.sucesso) {
          await prisma.tentativaLogin.create({ data: { email, sucesso: false, ipOrigem, userAgent: req.headers?.['user-agent'] ?? null, motivo: 'RATE_LIMIT' } }).catch(() => undefined);
          throw new Error('Muitas tentativas de login. Aguarde alguns minutos.');
        }

        let usuario;

        try {
          usuario = await prisma.usuario.findFirst({
            where: {
              email,
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
          await prisma.tentativaLogin.create({ data: { email, sucesso: false, ipOrigem, userAgent: req.headers?.['user-agent'] ?? null, motivo: 'USUARIO_NAO_ENCONTRADO' } }).catch(() => undefined);
          throw new Error('Credenciais inválidas.');
        }

        const senhaValida = await compare(senhaPlano, usuario.senhaHash);

        if (!senhaValida) {
          await prisma.tentativaLogin.create({ data: { email, usuarioId: usuario.id, sucesso: false, ipOrigem, userAgent: req.headers?.['user-agent'] ?? null, motivo: 'SENHA_INVALIDA' } }).catch(() => undefined);
          throw new Error('Credenciais inválidas.');
        }

        if (usuario.mfaAtivo) {
          if (!mfaCode || !usuario.mfaSecret) {
            await prisma.eventoMfa.create({ data: { usuarioId: usuario.id, evento: 'MFA_CODIGO_AUSENTE', ipOrigem, userAgent: req.headers?.['user-agent'] ?? null } }).catch(() => undefined);
            throw new Error('Código MFA obrigatório.');
          }
          let mfaValido = false;
          try { mfaValido = verificarTotp(descriptografarSegredoTotp(usuario.mfaSecret), mfaCode); } catch { mfaValido = false; }
          if (!mfaValido) {
            await prisma.eventoMfa.create({ data: { usuarioId: usuario.id, evento: 'MFA_CODIGO_INVALIDO', ipOrigem, userAgent: req.headers?.['user-agent'] ?? null } }).catch(() => undefined);
            throw new Error('Código MFA inválido.');
          }
          await prisma.eventoMfa.create({ data: { usuarioId: usuario.id, evento: 'MFA_VALIDADO', ipOrigem, userAgent: req.headers?.['user-agent'] ?? null } }).catch(() => undefined);
        }

        const sessaoId = criarIdentificadorSessao();
        const agora = new Date();
        const expiraEm = new Date(agora.getTime() + DURACAO_SESSAO_MS);
        const userAgent = req.headers?.['user-agent'] ?? null;

        await prisma.sessaoUsuario.create({
          data: {
            usuarioId: usuario.id,
            sessionTokenHash: hashIdentificadorSessao(sessaoId),
            ipOrigem,
            userAgent,
            dispositivo: obterDispositivo(userAgent),
            criadoEm: agora,
            ultimoAcesso: agora,
            expiraEm,
          },
        });

        await prisma.tentativaLogin.create({ data: { email, usuarioId: usuario.id, sucesso: true, ipOrigem, userAgent, motivo: usuario.mfaAtivo ? 'LOGIN_OK_MFA' : 'LOGIN_OK' } }).catch(() => undefined);

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
          sessaoId,
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
        token.sessaoId = user.sessaoId;
      }

      if (token.sessaoId) {
        const sessao = await prisma.sessaoUsuario.findFirst({
          where: {
            sessionTokenHash: hashIdentificadorSessao(token.sessaoId),
            usuarioId: token.id,
            revogadoEm: null,
            expiraEm: { gt: new Date() },
            usuario: { ativo: true, deletedAt: null },
          },
          select: { id: true, ultimoAcesso: true },
        });

        if (!sessao) {
          token.sessaoValida = false;
          return token;
        }
        token.sessaoValida = true;

        if (Date.now() - sessao.ultimoAcesso.getTime() >= 5 * 60 * 1000) {
          await prisma.sessaoUsuario.update({
            where: { id: sessao.id },
            data: { ultimoAcesso: new Date() },
          }).catch(() => undefined);
        }
      }

      return token;
    },

    // Enriquecer a sessão com dados do JWT
    async session({ session, token }) {
      if (token.sessaoValida === false) {
        return { ...session, usuario: undefined } as unknown as Session;
      }
      session.usuario = {
        id: token.id,
        nome: token.nome,
        email: token.email!,
        role: token.role,
        crm: token.crm,
        coren: token.coren,
        sessaoId: token.sessaoId,
      };
      return session;
    },
  },

  secret: nextAuthSecret,

  events: {
    async signOut({ token }) {
      if (!token?.sessaoId) return;
      await prisma.sessaoUsuario.updateMany({
        where: {
          sessionTokenHash: hashIdentificadorSessao(token.sessaoId),
          revogadoEm: null,
        },
        data: { revogadoEm: new Date(), motivoRevogacao: 'LOGOUT' },
      }).catch(() => undefined);
    },
  },

  // Log de erros de autenticação (sem expor detalhes ao cliente)
  debug: process.env.NODE_ENV === 'development',
};
