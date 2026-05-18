// app/api/cid10/route.ts — GET /api/cid10?q=termo — Busca CID-10 local
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { buscarCid10 } from '@/lib/cid10';

export async function GET(req: NextRequest) {
  const sessao = await getServerSession(authOptions);
  if (!sessao) return NextResponse.json({ sucesso: false, erro: 'Não autorizado.' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') ?? '';
  const limite = Math.min(20, parseInt(searchParams.get('limite') ?? '10'));

  const resultados = buscarCid10(q, limite);
  return NextResponse.json(
    { sucesso: true, dados: resultados, total: resultados.length },
    { headers: { 'Cache-Control': 'public, s-maxage=3600' } }
  );
}
