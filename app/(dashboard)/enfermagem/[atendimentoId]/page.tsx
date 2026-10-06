'use client'

import { use } from 'react'
import { WorkspaceInternacao } from '@/components/internamento/WorkspaceInternacao'

export default function PaginaEnfermagemAtendimento({
  params,
  searchParams,
}: {
  params: Promise<{ atendimentoId: string }>
  searchParams: Promise<{ aba?: string }>
}) {
  const { atendimentoId } = use(params)
  const { aba } = use(searchParams)
  return (
    <WorkspaceInternacao
      atendimentoId={atendimentoId}
      abaInicial={aba ?? 'INSTRUCOES_ENFERMAGEM'}
      modo="evolucoes"
    />
  )
}
