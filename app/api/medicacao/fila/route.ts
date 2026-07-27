import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { nomeCompletoParaExibicao } from '@/lib/nome-paciente-exibicao'
import {
  whereMedicacaoPendente,
  includeAtendimentoMedicacao,
  contarItensPendentes,
  listarItensPendentes,
  LABEL_STATUS_ATENDIMENTO,
  LABEL_VIA,
} from '@/lib/fila-medicacao'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const ROLES = ['ADMIN', 'ENFERMEIRO', 'TECNICO_ENFERMAGEM'] as const

export async function GET() {
  const sessao = await getServerSession(authOptions)
  if (!sessao) {
    return NextResponse.json({ sucesso: false, erro: 'Não autorizado.' }, { status: 401 })
  }
  if (!ROLES.includes(sessao.usuario.role as (typeof ROLES)[number])) {
    return NextResponse.json({ sucesso: false, erro: 'Sem permissão.' }, { status: 403 })
  }

  try {
    const atendimentos = await prisma.atendimento.findMany({
      where: whereMedicacaoPendente,
      include: includeAtendimentoMedicacao,
      orderBy: [{ updatedAt: 'desc' }],
    })

    const fila = atendimentos
      .map((a) => {
        const itensPendentes = listarItensPendentes(a.prontuario?.prescricoes)
        const totalPendentes = contarItensPendentes(a.prontuario?.prescricoes)
        if (totalPendentes === 0) return null

        return {
          atendimentoId: a.id,
          numeroAtendimento: a.numeroAtendimento,
          status: a.status,
          statusLabel: LABEL_STATUS_ATENDIMENTO[a.status] ?? a.status,
          nomePaciente: nomeCompletoParaExibicao(
            a.paciente.nomeExibicao,
            a.paciente.nomeCriptografado
          ),
          corTriagem: a.triagem?.corClassificacao ?? null,
          medicoNome: a.medico?.nome ?? null,
          totalPendentes,
          medicamentos: itensPendentes.map((it) => ({
            id: it.id,
            nome: it.nomeMedicamento,
            dose: it.dose,
            via: it.via,
            viaLabel: LABEL_VIA[it.via] ?? it.via,
            frequencia: it.frequencia,
          })),
          atualizadoEm: a.updatedAt.toISOString(),
        }
      })
      .filter(Boolean)

    fila.sort((a, b) => (b!.totalPendentes - a!.totalPendentes))

    return NextResponse.json(
      { sucesso: true, dados: fila, total: fila.length },
      { headers: { 'Cache-Control': 'no-store' } }
    )
  } catch (erro) {
    console.error('[GET /api/medicacao/fila]', erro)
    return NextResponse.json({ sucesso: false, erro: 'Erro interno.' }, { status: 500 })
  }
}
