// GET — Lista pacientes aguardando recepção e pacientes já internados (aceitos)

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import {
  listarAdmissoesPendentes,
  listarFichasHospitalares,
  listarPacientesInternados,
} from '@/lib/admissoes-pendentes'

const ROLES = ['ADMIN', 'ENFERMEIRO', 'TECNICO_ENFERMAGEM', 'RECEPCIONISTA', 'MEDICO', 'DIRETOR_CLINICO'] as const

export async function GET() {
  const sessao = await getServerSession(authOptions)
  if (!sessao) {
    return NextResponse.json({ sucesso: false, erro: 'Não autorizado.' }, { status: 401 })
  }
  if (!ROLES.includes(sessao.usuario.role as (typeof ROLES)[number])) {
    return NextResponse.json({ sucesso: false, erro: 'Sem permissão.' }, { status: 403 })
  }

  try {
    const [pendentes, internados, fichasHospitalares] = await Promise.all([
      listarAdmissoesPendentes(),
      listarPacientesInternados(),
      listarFichasHospitalares(),
    ])
    return NextResponse.json({
      sucesso: true,
      dados: { pendentes, internados, fichasHospitalares },
      total: pendentes.length,
    })
  } catch (erro) {
    console.error('[GET /api/internamento/admissoes]', erro)
    return NextResponse.json({ sucesso: false, erro: 'Erro ao listar admissões.' }, { status: 500 })
  }
}
