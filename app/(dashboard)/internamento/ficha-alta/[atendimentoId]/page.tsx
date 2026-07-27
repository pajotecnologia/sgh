// Folha de Internação e Alta Hospitalar — edição

import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { ArrowLeft, ClipboardList } from 'lucide-react'
import { authOptions } from '@/lib/auth'
import { carregarDadosFichaInternacaoAlta } from '@/lib/carregar-dados-ficha-internacao-alta'
import { FormularioFichaInternacaoAlta } from '@/components/internamento/FormularioFichaInternacaoAlta'

export const metadata: Metadata = { title: 'Ficha Internação e Alta' }

const ROLES = ['ADMIN', 'ENFERMEIRO', 'TECNICO_ENFERMAGEM', 'RECEPCIONISTA', 'MEDICO', 'DIRETOR_CLINICO']

export default async function PaginaFichaInternacaoAlta({
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

  return (
    <div className="max-w-4xl mx-auto space-y-4 pb-24 w-full min-w-0 px-1 sm:px-0">
      <Link
        href="/internamento/admissoes"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Voltar às admissões
      </Link>

      <header className="bg-card border border-border rounded-xl p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-primary/10 shrink-0">
            <ClipboardList className="h-5 w-5 text-primary" aria-hidden />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-foreground">Folha de Internação e Alta Hospitalar</h1>
            <p className="text-sm text-muted-foreground mt-1">
              <span className="font-medium text-foreground">{dados.paciente.nomeExibicao}</span>
              {' — '}
              <span className="font-mono text-xs">{dados.paciente.numeroAtendimento}</span>
            </p>
          </div>
        </div>
      </header>

      <FormularioFichaInternacaoAlta
        atendimentoId={atendimentoId}
        numeroAtendimento={dados.paciente.numeroAtendimento}
        prefill={dados.prefill}
        fichaStatusInicial={dados.ficha?.status}
        statusAtendimento={dados.paciente.statusAtendimento}
        voltarAposConcluir
      />
    </div>
  )
}
