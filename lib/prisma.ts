// lib/prisma.ts
// Singleton com Proxy dinâmico para garantia de recarregamento dos modelos do Prisma
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  connectionTimeoutMillis: 15_000,
  idleTimeoutMillis: 45_000,
  keepAlive: true,
})

const adapter = new PrismaPg(pool)

function getOrMakeClient(): PrismaClient {
  if (!globalForPrisma.prisma || !(globalForPrisma.prisma as any).tbFornecedor) {
    globalForPrisma.prisma = new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    })
  }
  return globalForPrisma.prisma
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getOrMakeClient()
    const value = (client as any)[prop]
    if (typeof value === 'function') {
      return value.bind(client)
    }
    return value;
  },
})
