import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  gerarRelatorioAtendimentos,
  gerarRelatorioOcupacao,
  gerarRelatorioFarmaciaConsumo,
  exportarAtendimentosCsv,
} from '@/lib/relatorios-gerenciais';

export const dynamic = 'force-dynamic';

const ROLES_PERMITIDAS = ['ADMIN', 'DIRETOR_CLINICO', 'MEDICO', 'ENFERMEIRO', 'FARMACEUTICO'];

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !ROLES_PERMITIDAS.includes(session.usuario.role)) {
      return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get('tipo') || 'atendimentos';
    const dataInicio = searchParams.get('dataInicio') || undefined;
    const dataFim = searchParams.get('dataFim') || undefined;
    const setor = searchParams.get('setor') || undefined;
    const formato = searchParams.get('formato') || 'json';

    const filtros = { dataInicio, dataFim, setor };

    if (tipo === 'ocupacao') {
      const dados = await gerarRelatorioOcupacao();
      return NextResponse.json(dados);
    }

    if (tipo === 'farmacia') {
      const dados = await gerarRelatorioFarmaciaConsumo(filtros);
      return NextResponse.json(dados);
    }

    // Default: atendimentos
    const dados = await gerarRelatorioAtendimentos(filtros);

    if (formato === 'csv') {
      const csv = exportarAtendimentosCsv(dados);
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="relatorio-atendimentos-${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      });
    }

    return NextResponse.json(dados);
  } catch (error) {
    console.error('[API Relatorio Gerencial] Erro ao gerar relatório:', error);
    return NextResponse.json({ error: 'Erro ao processar relatório gerencial.' }, { status: 500 });
  }
}
