// GET /api/auth/health-database — público (usado antes do login)
// Confirma se o Prisma consegue conectar ao PostgreSQL

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true as const });
  } catch {
    return NextResponse.json(
      {
        ok: false as const,
        message:
          'Não foi possível conectar ao PostgreSQL. Rode na raiz: npm run db:compose:up (Docker) ou scripts/pg-start-windows.ps1 (portátil Windows). Confira DATABASE_URL (.env igual a .env.example), depois npm run db:push e npm run db:seed.',
      },
      { status: 503 }
    );
  }
}
