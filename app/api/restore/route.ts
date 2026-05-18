import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const cpfHash = url.searchParams.get('cpfHash');

  if (cpfHash) {
    const res = await prisma.paciente.updateMany({
      where: { cpfHash },
      data: { deletedAt: null }
    });
    return NextResponse.json({ sucesso: true, atualizados: res.count });
  }

  // Restore ALL soft deleted patients just in case
  const res = await prisma.paciente.updateMany({
    where: { deletedAt: { not: null } },
    data: { deletedAt: null }
  });
  return NextResponse.json({ sucesso: true, atualizados: res.count });
}
