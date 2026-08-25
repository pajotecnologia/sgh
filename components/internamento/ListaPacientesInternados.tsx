import Link from 'next/link'
import { format } from 'date-fns'
import type { ElementType, ReactNode } from 'react'
import { CheckCircle2, ChevronRight, ClipboardList, Clock, FileText, Pill, Printer } from 'lucide-react'
import { contarItensPendentes } from '@/lib/fila-medicacao'
import { obterNomeCompletoPaciente, nomeCompletoParaExibicao } from '@/lib/nome-paciente-exibicao'
import { descricaoLeitoInternacao } from '@/lib/prefill-internamento'
import { linkEvolucoesPaciente, linkProntuarioPaciente } from '@/lib/internacao-abas'
import type { AtendimentoListaInternados } from '@/lib/internacao-lista'
import {
  formatarDataHoraEvolucao,
  statusEvolucaoEnfermagemLista,
  statusEvolucaoMedicaLista,
  type StatusEvolucaoDia,
} from '@/lib/evolucao-dia-internacao'
import { BadgeManchester } from '@/components/triagem/BadgeManchester'
import { FiltroInternamentoLista } from '@/components/internamento/FiltroInternamentoLista'
import { PaginacaoLista } from '@/components/shared/PaginacaoLista'
import { cn } from '@/lib/utils'

export type VarianteListaInternados = 'medico' | 'enfermagem'

type ListaPacientesInternadosProps = {
  variant: VarianteListaInternados
  titulo: string
  subtitulo: ReactNode
  icone: ElementType
  basePath: '/prontuario' | '/evolucoes'
  atendimentos: AtendimentoListaInternados[]
  totalInternados: number
  podeVerMedicacaoPendente: boolean
  temFiltro: boolean
  filtros: {
    nome: string
    prontuario: string
    dataInicio: string
    dataFim: string
  }
  pagina: number
  porPagina: number
}

const rotuloLaudo = (status: string | undefined) => {
  if (status === 'AUTORIZADO') return { texto: 'Laudo autorizado', cls: 'text-green-700 dark:text-green-300' }
  if (status === 'SOLICITADO') return { texto: 'Laudo solicitado', cls: 'text-blue-700 dark:text-blue-300' }
  if (status) return { texto: 'Laudo rascunho', cls: 'text-muted-foreground' }
  return { texto: 'Sem laudo SUS', cls: 'text-amber-700 dark:text-amber-300' }
}

const rotuloMultidisciplinar = (status: string | undefined) => {
  if (status === 'CONCLUIDA') return { texto: 'Multi. concluída', cls: 'text-green-700 dark:text-green-300' }
  if (status === 'EM_ANDAMENTO') {
    return { texto: 'Multi. em andamento', cls: 'text-blue-700 dark:text-blue-300' }
  }
  if (status) return { texto: 'Multi. rascunho', cls: 'text-muted-foreground' }
  return { texto: 'Sem multi.', cls: 'text-amber-700 dark:text-amber-300' }
}

const rotuloCcih = (status: string | undefined) => {
  if (status === 'CONCLUIDO') return { texto: 'CCIH concluída', cls: 'text-green-700 dark:text-green-300' }
  if (status === 'NOTIFICADO' || status === 'EM_ANALISE') {
    return { texto: 'CCIH notificada', cls: 'text-blue-700 dark:text-blue-300' }
  }
  if (status) return { texto: 'CCIH rascunho', cls: 'text-muted-foreground' }
  return { texto: 'Sem ficha CCIH', cls: 'text-amber-700 dark:text-amber-300' }
}

const LegendaEvolucaoDia = ({ variant }: { variant: VarianteListaInternados }) => (
  <div className="flex flex-wrap items-center gap-3 mb-3 text-xs">
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-green-300/60 bg-green-50 text-green-800 dark:bg-green-950/40 dark:text-green-200 dark:border-green-800/50">
      <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
      {variant === 'medico' ? 'Evoluído hoje' : 'Evolução de enfermagem hoje'}
    </span>
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-amber-300/60 bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-100 dark:border-amber-800/50">
      <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden />
      Aguardando evolução hoje
    </span>
  </div>
)

const BadgeStatusEvolucaoDia = ({
  status,
  variant,
}: {
  status: StatusEvolucaoDia
  variant: VarianteListaInternados
}) => {
  const rotuloTipo = variant === 'medico' ? 'Evolução médica' : 'Evolução enfermagem'

  if (status.evoluidoHoje && status.dataHora) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border border-green-300/70 bg-green-100/80 text-green-900 dark:bg-green-950/50 dark:text-green-100 dark:border-green-800/60">
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
        {rotuloTipo}: {formatarDataHoraEvolucao(status.dataHora)}
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border border-amber-300/70 bg-amber-100/80 text-amber-950 dark:bg-amber-950/50 dark:text-amber-100 dark:border-amber-800/60">
      <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden />
      Aguardando evolução hoje
    </span>
  )
}

const classeItemListaEvolucao = (evoluidoHoje: boolean) =>
  cn(
    'py-4 px-4 transition-colors min-w-0 border-l-4',
    evoluidoHoje
      ? 'border-l-green-500 bg-green-50/60 dark:bg-green-950/15 hover:bg-green-50 dark:hover:bg-green-950/25'
      : 'border-l-amber-500 bg-amber-50/50 dark:bg-amber-950/15 hover:bg-amber-50/80 dark:hover:bg-amber-950/25'
  )

export const ListaPacientesInternados = ({
  variant,
  titulo,
  subtitulo,
  icone: IconeTitulo,
  basePath,
  atendimentos,
  totalInternados,
  podeVerMedicacaoPendente,
  temFiltro,
  filtros,
  pagina,
  porPagina,
}: ListaPacientesInternadosProps) => {
  const queryPreservar = {
    nome: filtros.nome || undefined,
    prontuario: filtros.prontuario || undefined,
    dataInicio: filtros.dataInicio || undefined,
    dataFim: filtros.dataFim || undefined,
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 w-full min-w-0">
      <div>
        <h1 className="page-title flex flex-wrap items-center gap-2 text-foreground">
          <IconeTitulo className="h-6 w-6 sm:h-7 sm:w-7 text-primary shrink-0" aria-hidden />
          <span>{titulo}</span>
        </h1>
        <p className="page-subtitle">{subtitulo}</p>
      </div>

      <FiltroInternamentoLista
        nomeInicial={filtros.nome}
        prontuarioInicial={filtros.prontuario}
        dataInicioInicial={filtros.dataInicio}
        dataFimInicial={filtros.dataFim}
        actionPath={basePath}
      />

      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Pacientes internados ({totalInternados})
          {temFiltro ? ' — filtrados' : ''}
        </h2>
        {totalInternados === 0 ? (
          <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground text-sm">
            {temFiltro
              ? 'Nenhum paciente internado encontrado com os filtros informados.'
              : 'Não há pacientes internados no sistema neste momento.'}
          </div>
        ) : (
          <>
            <LegendaEvolucaoDia variant={variant} />
            <ul className="divide-y divide-border rounded-xl border border-border bg-card overflow-hidden">
            {atendimentos.map((a) => {
              const nomePaciente = nomeCompletoParaExibicao(
                a.paciente.nomeExibicao,
                a.paciente.nomeCriptografado,
                (a.paciente as any).nomeCompleto
              )
              const encInternacao = a.prontuario?.encaminhamentos?.[0] ?? null
              const dataInternacao = encInternacao?.createdAt ?? a.updatedAt
              const dosesPendentes = contarItensPendentes(a.prontuario?.prescricoes)
              const hrefPaciente =
                variant === 'medico'
                  ? linkProntuarioPaciente(a.id)
                  : linkEvolucoesPaciente(a.id)
              const statusEvolucao =
                variant === 'medico'
                  ? statusEvolucaoMedicaLista(a)
                  : statusEvolucaoEnfermagemLista(a)

              return (
                <li key={a.id} className={classeItemListaEvolucao(statusEvolucao.evoluidoHoje)}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <BadgeStatusEvolucaoDia status={statusEvolucao} variant={variant} />
                      </div>
                      <p className="font-semibold text-foreground break-words text-base">
                        {nomePaciente}
                      </p>
                      <p className="text-sm font-mono text-muted-foreground mt-0.5">
                        {variant === 'medico'
                          ? `Prontuário: ${a.numeroAtendimento}`
                          : `Atendimento: ${a.numeroAtendimento}`}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {podeVerMedicacaoPendente && dosesPendentes > 0 ? (
                        <Link
                          href={linkEvolucoesPaciente(a.id, 'INSTRUCOES_ENFERMAGEM')}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-amber-400/60 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-100 text-sm font-semibold hover:opacity-90"
                          aria-label={`${dosesPendentes} dose(s) pendente(s) — aplicar medicação`}
                        >
                          <Pill className="h-4 w-4" aria-hidden />
                          {dosesPendentes} pend.
                        </Link>
                      ) : null}
                      <Link
                        href={hrefPaciente}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90"
                        aria-label={
                          variant === 'medico'
                            ? `Abrir prontuário de ${nomePaciente}`
                            : `Abrir prontuário de enfermagem de ${nomePaciente}`
                        }
                      >
                        {variant === 'medico' ? 'Abrir prontuário' : 'Abrir evoluções'}
                        <ChevronRight className="h-4 w-4" aria-hidden />
                      </Link>
                    </div>
                  </div>

                  {variant === 'medico' ? (
                    <DetalhesItemMedico
                      atendimento={a}
                      dataInternacao={dataInternacao}
                      statusEvolucao={statusEvolucao}
                    />
                  ) : (
                    <DetalhesItemEnfermagem
                      atendimento={a}
                      dataInternacao={dataInternacao}
                      statusEvolucao={statusEvolucao}
                    />
                  )}
                </li>
              )
            })}
          </ul>
          </>
        )}
        {totalInternados > 0 ? (
          <PaginacaoLista
            total={totalInternados}
            pagina={pagina}
            porPagina={porPagina}
            basePath={basePath}
            queryPreservar={queryPreservar}
            className="rounded-b-xl border border-t-0 border-border"
          />
        ) : null}
      </section>
    </div>
  )
}

const DetalhesItemMedico = ({
  atendimento: a,
  dataInternacao,
  statusEvolucao,
}: {
  atendimento: AtendimentoListaInternados
  dataInternacao: Date
  statusEvolucao: StatusEvolucaoDia
}) => {
  const laudo = rotuloLaudo(a.laudoInternacao?.status)
  const ccih = rotuloCcih(a.fichaCcih?.status)
  const multi = rotuloMultidisciplinar(a.fichaMultidisciplinar?.status)
  const encaminhamentoInternacaoId = a.prontuario?.encaminhamentos?.[0]?.id ?? null

  return (
    <div className="mt-3 pt-3 border-t border-border/60 flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span>
          Internação:{' '}
          <strong className="text-foreground font-medium">
            {format(new Date(dataInternacao), 'dd/MM/yyyy')}
          </strong>
        </span>
        {statusEvolucao.dataHora ? (
          <span>
            Última evolução médica:{' '}
            <strong className="text-foreground font-medium">
              {formatarDataHoraEvolucao(statusEvolucao.dataHora)}
            </strong>
          </span>
        ) : (
          <span className="text-amber-800 dark:text-amber-200 font-medium">
            Sem evolução médica registrada
          </span>
        )}
        {a.setor ? (
          <span>
            Setor: <strong className="text-foreground font-medium">{a.setor}</strong>
          </span>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {a.triagem?.corClassificacao ? (
          <BadgeManchester cor={a.triagem.corClassificacao} size="sm" />
        ) : null}
        <span className={`text-xs font-semibold ${laudo.cls}`}>{laudo.texto}</span>
        <span className={`text-xs font-semibold ${ccih.cls}`}>{ccih.texto}</span>
        <span className={`text-xs font-semibold ${multi.cls}`}>{multi.texto}</span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Link
          href={`/recepcao/imprimir/${a.numeroAtendimento}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-border text-xs font-semibold hover:bg-muted/50"
        >
          <FileText className="h-3.5 w-3.5" aria-hidden />
          Ficha recepção
        </Link>

        <Link
          href={`/internamento/ficha/${a.id}`}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-primary/40 text-xs font-semibold text-primary hover:bg-primary/5"
          aria-label="Cadastrar ficha de internamento SUS"
        >
          <ClipboardList className="h-3.5 w-3.5" aria-hidden />
          Ficha internamento
        </Link>

        <Link
          href={`/internamento/imprimir/${a.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-border text-xs font-semibold hover:bg-muted/50"
          aria-label="Imprimir ficha de internamento SUS"
        >
          <Printer className="h-3.5 w-3.5" aria-hidden />
          Imprimir ficha
        </Link>

        {encaminhamentoInternacaoId ? (
          <Link
            href={`/atendimento/encaminhamento/imprimir/${encaminhamentoInternacaoId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-border text-xs font-semibold hover:bg-muted/50"
            aria-label="Imprimir solicitação médica de internação"
          >
            Solicitação médica
          </Link>
        ) : null}
      </div>
    </div>
  )
}

const DetalhesItemEnfermagem = ({
  atendimento: a,
  dataInternacao,
  statusEvolucao,
}: {
  atendimento: AtendimentoListaInternados
  dataInternacao: Date
  statusEvolucao: StatusEvolucaoDia
}) => {
  const leito = descricaoLeitoInternacao(a.leito)

  return (
    <div className="mt-3 pt-3 border-t border-border/60 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
      <span>
        Internação:{' '}
        <strong className="text-foreground font-medium">
          {format(new Date(dataInternacao), 'dd/MM/yyyy')}
        </strong>
      </span>
      {statusEvolucao.dataHora ? (
        <span>
          Última evolução enfermagem:{' '}
          <strong className="text-foreground font-medium">
            {formatarDataHoraEvolucao(statusEvolucao.dataHora)}
          </strong>
        </span>
      ) : (
        <span className="text-amber-800 dark:text-amber-200 font-medium">
          Sem evolução de enfermagem registrada
        </span>
      )}
      <span>
        Leito:{' '}
        <strong className="text-foreground font-medium">{leito || '—'}</strong>
      </span>
      {a.fichaInternacaoAlta?.status ? (
        <span>
          Ficha:{' '}
          <strong className="text-foreground font-medium">
            {a.fichaInternacaoAlta.status.replace(/_/g, ' ')}
          </strong>
        </span>
      ) : null}
      {a.triagem?.corClassificacao ? (
        <BadgeManchester cor={a.triagem.corClassificacao} size="sm" />
      ) : null}
    </div>
  )
}
