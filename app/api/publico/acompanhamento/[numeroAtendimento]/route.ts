// app/api/publico/acompanhamento/[numeroAtendimento]/route.ts
// Endpoint público de consulta em tempo real do status do atendimento para celular

import { NextRequest, NextResponse } from 'next/server';
import { buscarDadosAcompanhamentoPaciente } from '@/lib/acompanhamento-paciente';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ numeroAtendimento: string }> }
) {
  try {
    const { numeroAtendimento } = await params;
    const dados = await buscarDadosAcompanhamentoPaciente(decodeURIComponent(numeroAtendimento));

    if (!dados) {
      return NextResponse.json(
        { sucesso: false, erro: 'Atendimento não encontrado ou já finalizado.' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { sucesso: true, dados },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (err) {
    console.error('[GET /api/publico/acompanhamento]', err);
    return NextResponse.json(
      { sucesso: false, erro: 'Erro ao consultar status do atendimento.' },
      { status: 500 }
    );
  }
}
