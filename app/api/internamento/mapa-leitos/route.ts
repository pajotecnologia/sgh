import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { obterDadosMapaLeitos } from '@/lib/mapa-leitos'
import type { TipoLeitoHospitalar, StatusLeitoHospitalar } from '@/types'

const ROLES_PERMITIDOS = [
  'ADMIN',
  'MEDICO',
  'DIRETOR_CLINICO',
  'ENFERMEIRO',
  'TECNICO_ENFERMAGEM',
  'RECEPCIONISTA',
  'FARMACEUTICO',
]

export async function GET(req: NextRequest) {
  try {
    const sessao = await getServerSession(authOptions)
    if (!sessao) {
      return NextResponse.json({ sucesso: false, erro: 'Não autorizado.' }, { status: 401 })
    }

    if (!ROLES_PERMITIDOS.includes(sessao.usuario.role)) {
      return NextResponse.json({ sucesso: false, erro: 'Sem permissão de acesso.' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const clinicaId = searchParams.get('clinicaId') || undefined
    const ala = searchParams.get('ala') || undefined
    const tipo = (searchParams.get('tipo') as TipoLeitoHospitalar) || undefined
    const status = (searchParams.get('status') as StatusLeitoHospitalar) || undefined

    const dados = await obterDadosMapaLeitos({
      clinicaId,
      ala,
      tipo,
      status,
    })

    return NextResponse.json({
      sucesso: true,
      dados,
    })
  } catch (error) {
    console.error('[GET /api/internamento/mapa-leitos]', error)
    return NextResponse.json(
      { sucesso: false, erro: 'Erro ao carregar mapa de leitos.' },
      { status: 500 }
    )
  }
}
