import { NextRequest, NextResponse } from 'next/server';
import { buscarProximosChamados } from '@/lib/painel-proximos';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const setor = searchParams.get('setor') ?? 'GERAL';
    const limite = Math.min(10, parseInt(searchParams.get('limite') ?? '5', 10));

    const dados = await buscarProximosChamados(setor, limite);

    return NextResponse.json(
      { sucesso: true, dados },
      {
        status: 200,
        headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
      }
    );
  } catch (erro) {
    console.error('[GET /api/painel/proximos] Erro:', erro);
    return NextResponse.json({ sucesso: false, erro: 'Erro interno.' }, { status: 500 });
  }
}
