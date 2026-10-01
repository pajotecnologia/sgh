import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hashIdentificadorSessao } from '@/lib/sessoes';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.usuario?.id) {
      return NextResponse.json({ sucesso: false, erro: 'Não autenticado.' }, { status: 401 });
    }

    const whereClausula: Record<string, unknown> = {
      usuarioId: session.usuario.id,
      revogadoEm: null,
    };

    if (session.usuario.sessaoId) {
      whereClausula.NOT = { sessionTokenHash: hashIdentificadorSessao(session.usuario.sessaoId) };
    }

    const resultado = await prisma.sessaoUsuario.updateMany({
      where: whereClausula,
      data: { revogadoEm: new Date(), motivoRevogacao: 'REVOGAR_OUTRAS' },
    });

    return NextResponse.json(
      { sucesso: true, revogadas: resultado.count },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (erro) {
    console.error('[sessoes] Erro ao revogar outras sessões:', erro);
    return NextResponse.json(
      { sucesso: false, erro: 'Erro ao revogar outras sessões.' },
      { status: 500 }
    );
  }
}
