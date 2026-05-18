// lib/prisma.ts - RELOADED AT: 2026-04-27 21:20
// Singleton do Prisma Client

import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Configura o pool de conexão do pg (banco nativo)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  connectionTimeoutMillis: 15_000,
  idleTimeoutMillis: 45_000,
  keepAlive: true,
});
// Cria o adapter para o Prisma usar
const adapter = new PrismaPg(pool);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter, // <- Passa o adapter aqui, resolvendo o erro "client requires either adapter or accelerateUrl"
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
