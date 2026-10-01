import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hashIdentificadorSessao } from '@/lib/sessoes';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.usuario?.id) {
      return NextResponse.json({ sucesso: false, erro: 'Não autenticado.' }, { status: 401 });
    }

    const sessoes = await prisma.sessaoUsuario.findMany({
      where: {
        usuarioId: session.usuario.id,
        revogadoEm: null,
        expiraEm: { gt: new Date() },
      },
      orderBy: { ultimoAcesso: 'desc' },
      select: {
        id: true,
        sessionTokenHash: true,
        ipOrigem: true,
        userAgent: true,
        dispositivo: true,
        criadoEm: true,
        ultimoAcesso: true,
        expiraEm: true,
        revogadoEm: true,
        motivoRevogacao: true,
      },
    }).catch((err) => {
      console.error('[sessoes] Erro ao buscar sessoes:', err);
      return [];
    });

    const hashAtual = session.usuario.sessaoId
      ? hashIdentificadorSessao(session.usuario.sessaoId)
      : null;

    return NextResponse.json(
      {
        sucesso: true,
        dados: sessoes.map((item, index) => ({
          id: item.id,
          atual: hashAtual ? item.sessionTokenHash === hashAtual : index === 0,
          ipOrigem: item.ipOrigem,
          userAgent: item.userAgent,
          dispositivo: item.dispositivo,
          criadoEm: item.criadoEm,
          ultimoAcesso: item.ultimoAcesso,
          expiraEm: item.expiraEm,
        })),
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (erro) {
    console.error('[sessoes] Erro inesperado:', erro);
    return NextResponse.json(
      { sucesso: false, erro: 'Erro interno ao consultar sessões.' },
      { status: 500 }
    );
  }
}
