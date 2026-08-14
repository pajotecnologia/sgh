import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  const sessao = await getServerSession(authOptions);
  if (!sessao || sessao.usuario.role !== 'ADMIN') {
    return NextResponse.json({ sucesso: false, erro: 'Acesso negado.' }, { status: 403 });
  }

  const url = new URL(req.url);
  const cpfHash = url.searchParams.get('cpfHash');

  if (cpfHash) {
    const res = await prisma.paciente.updateMany({
      where: { cpfHash },
      data: { deletedAt: null }
    });
    return NextResponse.json({ sucesso: true, atualizados: res.count });
  }

  // Restore ALL soft deleted patients (admin feature)
  const res = await prisma.paciente.updateMany({
    where: { deletedAt: { not: null } },
    data: { deletedAt: null }
  });
  return NextResponse.json({ sucesso: true, atualizados: res.count });
}

