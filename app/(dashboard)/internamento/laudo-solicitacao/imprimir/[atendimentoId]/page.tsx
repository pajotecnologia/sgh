// app/(dashboard)/internamento/laudo-solicitacao/imprimir/[atendimentoId]/page.tsx

import { notFound, redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { carregarDadosLaudoSolicitacao } from '@/lib/laudo-solicitacao'
import { LaudoSolicitacaoDocumento } from '@/components/internamento/LaudoSolicitacaoDocumento'

const ROLES = [
  'ADMIN',
  'MEDICO',
  'DIRETOR_CLINICO',
  'ENFERMEIRO',
  'TECNICO_ENFERMAGEM',
  'RECEPCIONISTA',
]

export default async function ImprimirLaudoSolicitacaoPage({
  params,
}: {
  params: Promise<{ atendimentoId: string }>
}) {
  const sessao = await getServerSession(authOptions)
  if (!sessao) redirect('/login')
  if (!ROLES.includes(sessao.usuario.role)) redirect('/acesso-negado')

  const { atendimentoId } = await params

  try {
    const resultado = await carregarDadosLaudoSolicitacao(atendimentoId, {
      nome: sessao.usuario.nome,
      crm: sessao.usuario.crm,
    })

    if (!resultado) notFound()

    return (
      <LaudoSolicitacaoDocumento
        dados={resultado.prefill}
        instituicao={resultado.instituicao}
      />
    )
  } catch (err) {
    console.error('[ImprimirLaudoSolicitacaoPage]', err)
    notFound()
  }
}
