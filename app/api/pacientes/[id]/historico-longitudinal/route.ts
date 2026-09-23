import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { carregarHistoricoLongitudinal } from '@/lib/historico-paciente';
import { auditarLgpd } from '@/lib/auditoria-lgpd';

export const dynamic = 'force-dynamic';

const ROLES_PERMITIDAS = [
  'ADMIN',
  'DIRETOR_CLINICO',
  'MEDICO',
  'ENFERMEIRO',
  'TECNICO_ENFERMAGEM',
  'FARMACEUTICO',
  'RECEPCAO',
];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !ROLES_PERMITIDAS.includes(session.usuario.role)) {
      return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 403 });
    }

    const { id: pacienteId } = await params;
    if (!pacienteId) {
      return NextResponse.json({ error: 'ID do paciente é obrigatório.' }, { status: 400 });
    }

    const historico = await carregarHistoricoLongitudinal(pacienteId);
    if (!historico) {
      return NextResponse.json({ error: 'Paciente não encontrado.' }, { status: 404 });
    }

    // Auditoria LGPD
    const forwarded = request.headers.get('x-forwarded-for');
    const ipOrigem = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1';

    await auditarLgpd({
      usuarioId: session.usuario.id,
      role: session.usuario.role as any,
      atendimentoId: null,
      pacienteId,
      acao: 'CONSULTA_PEP_LONGITUDINAL',
      entidade: 'PEP_LONGITUDINAL',
      entidadeId: pacienteId,
      ipOrigem,
      userAgent: request.headers.get('user-agent'),
      detalhes: {
        totalPassagens: historico.totalAtendimentos,
        motivo: 'Visualização da Linha do Tempo Histórica do Paciente',
      },
    }).catch(() => undefined);

    return NextResponse.json(historico);
  } catch (error) {
    console.error('[API PEP Longitudinal] Erro ao carregar histórico:', error);
    return NextResponse.json({ error: 'Erro ao processar histórico longitudinal.' }, { status: 500 });
  }
}
