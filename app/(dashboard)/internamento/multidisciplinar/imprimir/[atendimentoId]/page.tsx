// app/(dashboard)/internamento/multidisciplinar/imprimir/[atendimentoId]/page.tsx

import { notFound, redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { montarDadosFichaMultidisciplinarImpressao } from '@/lib/montar-dados-multidisciplinar-impressao'
import { FichaMultidisciplinarDocumento } from '@/components/internamento/FichaMultidisciplinarDocumento'

const ROLES = ['ADMIN', 'MEDICO', 'DIRETOR_CLINICO', 'ENFERMEIRO', 'TECNICO_ENFERMAGEM', 'RECEPCIONISTA']

export default async function ImprimirFichaMultidisciplinarPage({
  params,
}: {
  params: Promise<{ atendimentoId: string }>
}) {
  const sessao = await getServerSession(authOptions)
  if (!sessao) redirect('/login')
  if (!ROLES.includes(sessao.usuario.role)) redirect('/acesso-negado')

  const { atendimentoId } = await params

  const dados = await montarDadosFichaMultidisciplinarImpressao(atendimentoId, {
    nome: sessao.usuario.nome,
    crm: sessao.usuario.crm,
    role: sessao.usuario.role,
  })

  if (!dados) notFound()

  return <FichaMultidisciplinarDocumento dados={dados} />
}
