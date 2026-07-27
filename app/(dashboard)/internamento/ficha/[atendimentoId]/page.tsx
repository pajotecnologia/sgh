// app/(dashboard)/internamento/ficha/[atendimentoId]/page.tsx — Cadastro dedicado da ficha SUS de internação

import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { ArrowLeft, Printer } from 'lucide-react'
import { authOptions } from '@/lib/auth'
import { carregarDadosFichaInternamento } from '@/lib/carregar-dados-ficha-internamento'
import { FormularioLaudoInternacao } from '@/components/internamento/FormularioLaudoInternacao'

export const metadata: Metadata = {
  title: 'Ficha de Internamento',
}

const ROLES = ['ADMIN', 'MEDICO', 'DIRETOR_CLINICO', 'ENFERMEIRO', 'TECNICO_ENFERMAGEM', 'RECEPCIONISTA']

export default async function PaginaCadastroFichaInternamento({
  params,
}: {
  params: Promise<{ atendimentoId: string }>
}) {
  const sessao = await getServerSession(authOptions)
  if (!sessao) redirect('/login')
  if (!ROLES.includes(sessao.usuario.role)) redirect('/acesso-negado')

  const { atendimentoId } = await params

  const dados = await carregarDadosFichaInternamento(atendimentoId, {
    nome: sessao.usuario.nome,
    crm: sessao.usuario.crm,
  })

  if (!dados) notFound()

  return (
    <div className="max-w-4xl mx-auto space-y-4 pb-12 w-full min-w-0 px-1 sm:px-0">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/prontuario"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Voltar à lista de internados
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/prontuario/${atendimentoId}`}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted/50"
          >
            Prontuário médico
          </Link>
          <Link
            href={`/internamento/imprimir/${atendimentoId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-primary/40 text-sm font-medium text-primary hover:bg-primary/5"
          >
            <Printer className="h-4 w-4" aria-hidden />
            Imprimir ficha
          </Link>
        </div>
      </div>

      <header className="bg-card border border-border rounded-xl p-5 shadow-sm">
        <h1 className="text-xl font-bold text-foreground">Ficha de Internamento do Paciente</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {dados.paciente.nomeExibicao} —{' '}
          <span className="font-mono">{dados.paciente.numeroAtendimento}</span>
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          Formulário SUS para solicitação de autorização de internação hospitalar (AIH). Campos
          pré-preenchidos com dados do cadastro, triagem, prontuário e encaminhamento de internação.
        </p>
      </header>

      <FormularioLaudoInternacao
        variant="ficha"
        atendimentoId={atendimentoId}
        prefill={dados.prefill}
        laudoExtra={dados.laudoExtra}
      />
    </div>
  )
}
