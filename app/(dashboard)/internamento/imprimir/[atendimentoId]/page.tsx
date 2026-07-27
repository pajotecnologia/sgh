// app/(dashboard)/internamento/imprimir/[atendimentoId]/page.tsx

import { notFound, redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { montarDadosLaudoInternacaoImpressao } from '@/lib/montar-dados-laudo-impressao'
import { LaudoInternacaoDocumento } from '@/components/internamento/LaudoInternacaoDocumento'

const ROLES = ['ADMIN', 'MEDICO', 'DIRETOR_CLINICO', 'ENFERMEIRO', 'TECNICO_ENFERMAGEM', 'RECEPCIONISTA']

export default async function ImprimirLaudoInternacaoPage({
  params,
}: {
  params: Promise<{ atendimentoId: string }>
}) {
  const sessao = await getServerSession(authOptions)
  if (!sessao) redirect('/login')
  if (!ROLES.includes(sessao.usuario.role)) redirect('/acesso-negado')

  const { atendimentoId } = await params

  const dados = await montarDadosLaudoInternacaoImpressao(atendimentoId, {
    nome: sessao.usuario.nome,
    crm: sessao.usuario.crm,
  })

  if (!dados) notFound()

  return <LaudoInternacaoDocumento dados={dados} />
}
