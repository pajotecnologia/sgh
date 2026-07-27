// Recepção pela enfermagem: leito + ficha de internamento

import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { ArrowLeft, UserPlus } from 'lucide-react'
import { authOptions } from '@/lib/auth'
import { carregarSolicitacaoInternacao } from '@/lib/carregar-solicitacao-internacao'
import { carregarDadosFichaInternacaoAlta } from '@/lib/carregar-dados-ficha-internacao-alta'
import { FormularioAdmissaoEnfermagem } from '@/components/internamento/FormularioAdmissaoEnfermagem'

export const metadata: Metadata = { title: 'Receber paciente — Internação' }

const ROLES = ['ADMIN', 'ENFERMEIRO', 'TECNICO_ENFERMAGEM', 'RECEPCIONISTA']

export default async function PaginaAdmitirPaciente({
  params,
}: {
  params: Promise<{ atendimentoId: string }>
}) {
  const sessao = await getServerSession(authOptions)
  if (!sessao) redirect('/login')
  if (!ROLES.includes(sessao.usuario.role)) redirect('/acesso-negado')

  const { atendimentoId } = await params

  const [solicitacao, dadosFicha] = await Promise.all([
    carregarSolicitacaoInternacao(atendimentoId),
    carregarDadosFichaInternacaoAlta(atendimentoId, {
      nome: sessao.usuario.nome,
    }),
  ])

  // Se o atendimento não existe de forma alguma, retorna 404
  if (!solicitacao || !dadosFicha) notFound()

  return (
    <div className="max-w-4xl mx-auto space-y-4 pb-24 w-full min-w-0 px-1 sm:px-0">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/internamento/admissoes"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Voltar às admissões
        </Link>
      </div>

      <header className="bg-card border border-border rounded-xl p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-primary/10 shrink-0">
            <UserPlus className="h-5 w-5 text-primary" aria-hidden />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-foreground">
              {solicitacao.status === 'INTERNADO'
                ? 'Ficha de admissão (paciente já internado)'
                : 'Receber paciente para internação'}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              <span className="font-medium text-foreground">{solicitacao.nomePaciente}</span>
              {' — '}
              <span className="font-mono text-xs">{solicitacao.numeroAtendimento}</span>
            </p>
            {solicitacao.status === 'INTERNADO' ? (
              <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1.5">
                Este paciente já está internado. Você pode atualizar a ficha hospitalar abaixo.
              </p>
            ) : (
              <p className="text-xs text-muted-foreground mt-1.5">
                Preencha a folha de internação, selecione o leito e use{' '}
                <strong className="text-foreground">Confirmar internação</strong> para registrar o paciente como
                internado. A Ficha SUS pode ser preenchida em seguida, se ainda não estiver salva.
              </p>
            )}
          </div>
        </div>
      </header>

      <FormularioAdmissaoEnfermagem
        atendimentoId={atendimentoId}
        solicitacao={solicitacao}
        prefill={dadosFicha.prefill}
        fichaStatus={dadosFicha.ficha?.status}
      />
    </div>
  )
}
