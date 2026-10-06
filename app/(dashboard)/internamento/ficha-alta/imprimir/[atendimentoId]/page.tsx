// app/(dashboard)/internamento/ficha-alta/imprimir/[atendimentoId]/page.tsx
// Impressão — Folha de Internação e Alta Hospitalar (Ficha Hospitalar)

import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { carregarDadosFichaInternacaoAlta } from '@/lib/carregar-dados-ficha-internacao-alta'
import { FichaInternacaoAltaDocumento } from '@/components/internamento/FichaInternacaoAltaDocumento'

export const metadata: Metadata = {
  title: 'Folha de Internação e Alta — Impressão | SGH',
}

const ROLES = ['ADMIN', 'MEDICO', 'DIRETOR_CLINICO', 'ENFERMEIRO', 'TECNICO_ENFERMAGEM', 'RECEPCIONISTA']

export default async function ImprimirFichaInternacaoAltaPage({
  params,
}: {
  params: Promise<{ atendimentoId: string }>
}) {
  const sessao = await getServerSession(authOptions)
  if (!sessao) redirect('/login')
  if (!ROLES.includes(sessao.usuario.role)) redirect('/acesso-negado')

  const { atendimentoId } = await params

  const dados = await carregarDadosFichaInternacaoAlta(atendimentoId, {
    nome: sessao.usuario.nome,
  })

  if (!dados) notFound()

  return <FichaInternacaoAltaDocumento dados={dados} />
}
