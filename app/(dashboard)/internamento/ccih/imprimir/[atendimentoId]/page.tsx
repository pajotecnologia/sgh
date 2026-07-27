// app/(dashboard)/internamento/ccih/imprimir/[atendimentoId]/page.tsx

import { notFound, redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { montarDadosFichaCcihImpressao } from '@/lib/montar-dados-ccih-impressao'
import { FichaCcihDocumento } from '@/components/internamento/FichaCcihDocumento'

const ROLES = ['ADMIN', 'MEDICO', 'DIRETOR_CLINICO', 'ENFERMEIRO', 'TECNICO_ENFERMAGEM', 'RECEPCIONISTA']

export default async function ImprimirFichaCcihPage({
  params,
}: {
  params: Promise<{ atendimentoId: string }>
}) {
  const sessao = await getServerSession(authOptions)
  if (!sessao) redirect('/login')
  if (!ROLES.includes(sessao.usuario.role)) redirect('/acesso-negado')

  const { atendimentoId } = await params

  const dados = await montarDadosFichaCcihImpressao(atendimentoId, {
    nome: sessao.usuario.nome,
    crm: sessao.usuario.crm,
    role: sessao.usuario.role,
  })

  if (!dados) notFound()

  return <FichaCcihDocumento dados={dados} />
}
