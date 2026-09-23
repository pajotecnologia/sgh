import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hashIdentificadorSessao } from '@/lib/sessoes';

export const dynamic = 'force-dynamic';

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.usuario?.id || !session.usuario.sessaoId) {
    return NextResponse.json({ sucesso: false, erro: 'Não autenticado.' }, { status: 401 });
  }

  const resultado = await prisma.sessaoUsuario.updateMany({
    where: {
      usuarioId: session.usuario.id,
      revogadoEm: null,
      NOT: { sessionTokenHash: hashIdentificadorSessao(session.usuario.sessaoId) },
    },
    data: { revogadoEm: new Date(), motivoRevocacao: 'REVOGAR_OUTRAS' },
  });

  return NextResponse.json(
    { sucesso: true, revogadas: resultado.count },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
