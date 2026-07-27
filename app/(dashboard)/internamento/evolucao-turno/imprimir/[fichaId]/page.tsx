// app/(dashboard)/internamento/evolucao-turno/imprimir/[fichaId]/page.tsx

import { notFound, redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { montarDadosEvolucaoTurnoImpressao } from '@/lib/montar-dados-evolucao-turno-impressao'
import { FichaEvolucaoTurnoDocumento } from '@/components/internamento/FichaEvolucaoTurnoDocumento'

const ROLES = ['ADMIN', 'MEDICO', 'DIRETOR_CLINICO', 'ENFERMEIRO', 'TECNICO_ENFERMAGEM', 'RECEPCIONISTA']

export default async function ImprimirEvolucaoTurnoPage({
  params,
}: {
  params: Promise<{ fichaId: string }>
}) {
  const sessao = await getServerSession(authOptions)
  if (!sessao) redirect('/login')
  if (!ROLES.includes(sessao.usuario.role)) redirect('/acesso-negado')

  const { fichaId } = await params
  const dados = await montarDadosEvolucaoTurnoImpressao(fichaId)
  if (!dados) notFound()

  return <FichaEvolucaoTurnoDocumento dados={dados} />
}
