import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ sessaoId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.usuario?.id || !session.usuario.sessaoId) {
    return NextResponse.json({ sucesso: false, erro: 'Não autenticado.' }, { status: 401 });
  }

  const { sessaoId } = await context.params;
  const alvo = await prisma.sessaoUsuario.findFirst({
    where: { id: sessaoId, usuarioId: session.usuario.id, revogadoEm: null },
    select: { id: true, sessionTokenHash: true },
  });

  if (!alvo) {
    return NextResponse.json({ sucesso: false, erro: 'Sessão não encontrada.' }, { status: 404 });
  }

  await prisma.sessaoUsuario.update({
    where: { id: alvo.id },
    data: { revogadoEm: new Date(), motivoRevogacao: 'REVOGADA_PELO_USUARIO' },
  });

  return NextResponse.json({ sucesso: true, mensagem: 'Sessão revogada.' }, { headers: { 'Cache-Control': 'no-store' } });
}
