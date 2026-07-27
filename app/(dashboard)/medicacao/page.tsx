import type { Metadata } from 'next'
import { Suspense } from 'react'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Pill } from 'lucide-react'
import { NavegacaoAbasMedicacao } from '@/components/medicacao/NavegacaoAbasMedicacao'
import { HistoricoMedicacoesAplicadas, agruparPorPaciente } from '@/components/medicacao/HistoricoMedicacoesAplicadas'
import { ListaMedicacaoPendente } from '@/components/medicacao/ListaMedicacaoPendente'
import { CampoPesquisaMedicacao } from '@/components/medicacao/CampoPesquisaMedicacao'
import { nomeCompletoParaExibicao } from '@/lib/nome-paciente-exibicao'
import { numeroProntuarioExibicao } from '@/lib/medicacao-pesquisa'
import {
  normalizarTermoPesquisa,
  parseDataPesquisaAtendimento,
  wherePesquisaAtendimentoMedicacao,
  whereAplicacaoComPesquisaAtendimento,
} from '@/lib/medicacao-pesquisa'
import {
  whereMedicacaoPendente,
  includeAtendimentoMedicacao,
  includeAplicacaoMedicacaoCompleta,
  contarItensPendentes,
  listarItensPendentes,
  whereAplicacaoMedicacaoHistorico,
  parseDiasHistoricoMedicacao,
} from '@/lib/fila-medicacao'
import { PaginacaoLista } from '@/components/shared/PaginacaoLista'
import { fatiarLista, parsePaginacao } from '@/lib/paginacao'

export const metadata: Metadata = { title: 'Medicação (PS)' }

type PageProps = {
  searchParams: Promise<{ aba?: string; dias?: string; q?: string; data?: string; pagina?: string; porPagina?: string }>
}

export default async function PaginaMedicacao({ searchParams }: PageProps) {
  const sessao = await getServerSession(authOptions)
  if (!sessao) redirect('/login')
  if (!['ADMIN', 'ENFERMEIRO', 'TECNICO_ENFERMAGEM'].includes(sessao.usuario.role)) {
    redirect('/acesso-negado')
  }

  const params = await searchParams
  const { pagina, porPagina, skip, take } = parsePaginacao(params)
  const aba = params.aba === 'aplicadas' ? 'aplicadas' : 'pendentes'
  const dias = parseDiasHistoricoMedicacao(params.dias)
  const termoPesquisa = normalizarTermoPesquisa(params.q)
  const dataPesquisa = (params.data ?? '').trim()
  const temPesquisa = Boolean(termoPesquisa || parseDataPesquisaAtendimento(dataPesquisa))

  const wherePesquisa = wherePesquisaAtendimentoMedicacao(termoPesquisa, dataPesquisa)
  const wherePendentes =
    Object.keys(wherePesquisa).length > 0
      ? { AND: [whereMedicacaoPendente, wherePesquisa] }
      : whereMedicacaoPendente
  const whereHistorico = whereAplicacaoComPesquisaAtendimento(
    whereAplicacaoMedicacaoHistorico(dias),
    termoPesquisa,
    dataPesquisa
  )

  const [atendimentos, aplicacoes] = await Promise.all([
    prisma.atendimento.findMany({
      where: wherePendentes,
      include: includeAtendimentoMedicacao,
      orderBy: { updatedAt: 'desc' },
    }),
    aba === 'aplicadas'
      ? prisma.aplicacaoMedicamento.findMany({
          where: whereHistorico,
          include: includeAplicacaoMedicacaoCompleta,
          orderBy: { aplicadoEm: 'desc' },
        })
      : Promise.resolve([]),
  ])

  const filaPendentesCompleta = atendimentos
    .map((a) => {
      const medicamentos = listarItensPendentes(a.prontuario?.prescricoes)
      const totalPendentes = contarItensPendentes(a.prontuario?.prescricoes)
      if (totalPendentes === 0) return null
      return {
        atendimentoId: a.id,
        numeroAtendimento: a.numeroAtendimento,
        numeroProntuario: numeroProntuarioExibicao(a.numeroAtendimento),
        dataAtendimento: a.createdAt,
        status: a.status,
        nomePaciente: nomeCompletoParaExibicao(
          a.paciente.nomeExibicao,
          a.paciente.nomeCriptografado
        ),
        corTriagem: a.triagem?.corClassificacao ?? null,
        medicoNome: a.medico?.nome ?? null,
        totalPendentes,
        medicamentos,
      }
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)

  const filaPendentes = fatiarLista(filaPendentesCompleta, pagina, porPagina)
  const totalPendentesPacientes = filaPendentesCompleta.length
  const gruposAplicadasCompletos = aba === 'aplicadas' ? agruparPorPaciente(aplicacoes) : []
  const gruposAplicadasPagina = fatiarLista(gruposAplicadasCompletos, pagina, porPagina)
  const totalAplicadasPacientes = gruposAplicadasCompletos.length

  const totalMedicamentos = filaPendentesCompleta.reduce((acc, f) => acc + f.totalPendentes, 0)

  const queryPreservar = {
    aba: aba === 'aplicadas' ? 'aplicadas' : undefined,
    dias: aba === 'aplicadas' && dias !== 7 ? String(dias) : undefined,
    q: termoPesquisa || undefined,
    data: dataPesquisa || undefined,
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4 w-full min-w-0">
      <div className="min-w-0">
        <h1 className="page-title flex flex-wrap items-center gap-2">
          <Pill className="h-5 w-5 text-primary shrink-0" />
          <span>Medicação (PS)</span>
        </h1>
        <p className="page-subtitle">
          {aba === 'aplicadas' ? (
            <>
              Histórico de medicamentos <strong className="text-foreground">já aplicados</strong> no
              pronto-socorro. Para pendentes, use a aba ao lado.
            </>
          ) : (
            <>
              Pacientes do <strong className="text-foreground">pronto-socorro</strong> (não internados)
              com prescrição e doses pendentes de aplicação. Pacientes{' '}
              <strong className="text-foreground">internados</strong>: abra o prontuário em{' '}
              <Link href="/prontuario" className="text-primary font-medium hover:underline">
                Prontuário
              </Link>{' '}
              → aba <strong className="text-foreground">Instruções / Enfermagem</strong>.
            </>
          )}
        </p>
      </div>

      <Suspense
        fallback={
          <div className="h-10 rounded-lg bg-muted/50 border border-border animate-pulse" />
        }
      >
        <NavegacaoAbasMedicacao
          totalPendentes={totalPendentesPacientes}
          totalAplicadas={totalAplicadasPacientes}
        />
      </Suspense>

      <Suspense
        fallback={
          <div className="h-16 rounded-lg bg-muted/50 border border-border animate-pulse" />
        }
      >
        <CampoPesquisaMedicacao />
      </Suspense>

      {aba === 'pendentes' ? (
        <>
          <div className="flex flex-wrap gap-3 text-[11px] font-medium">
            <span className="inline-flex items-center gap-1.5 text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-2.5 py-1 rounded-md">
              <Pill className="h-3.5 w-3.5" />
              {totalPendentesPacientes} paciente{totalPendentesPacientes !== 1 ? 's' : ''}
              {temPesquisa && ' (filtrado)'}
            </span>
            <span className="inline-flex items-center gap-1.5 text-muted-foreground bg-muted/50 border border-border px-2.5 py-1 rounded-md">
              {totalMedicamentos} dose{totalMedicamentos !== 1 ? 's' : ''} pendente
              {totalMedicamentos !== 1 ? 's' : ''}
            </span>
          </div>
          <ListaMedicacaoPendente fila={filaPendentes} temPesquisa={temPesquisa} />
          <PaginacaoLista
            total={totalPendentesPacientes}
            pagina={pagina}
            porPagina={porPagina}
            basePath="/medicacao"
            queryPreservar={queryPreservar}
            className="rounded-lg border border-border"
          />
        </>
      ) : (
        <>
        <HistoricoMedicacoesAplicadas
          gruposIniciais={gruposAplicadasPagina}
          totalGrupos={totalAplicadasPacientes}
          aplicacoes={[]}
          diasFiltro={dias}
          termoPesquisa={termoPesquisa}
          dataPesquisa={dataPesquisa}
          temPesquisa={temPesquisa}
        />
        <PaginacaoLista
          total={totalAplicadasPacientes}
          pagina={pagina}
          porPagina={porPagina}
          basePath="/medicacao"
          queryPreservar={queryPreservar}
          className="rounded-lg border border-border"
        />
        </>
      )}
    </div>
  )
}
