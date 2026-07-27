'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Loader2,
  Printer,
  FileText,
  Shield,
  Stethoscope,
  Users,
  AlertTriangle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { nomeCompletoParaExibicao } from '@/lib/nome-paciente-exibicao'
import { BadgeManchester } from '@/components/triagem/BadgeManchester'
import { AbaPrescricoesInternacao } from '@/components/internamento/AbaPrescricoesInternacao'
import { AbaExamesInternacao } from '@/components/internamento/AbaExamesInternacao'
import { FormularioEvolucao } from '@/components/atendimento/FormularioEvolucao'
import { AbaEmDesenvolvimento } from '@/components/internamento/AbaEmDesenvolvimento'
import { AbaSinaisVitaisInternacao } from '@/components/internamento/AbaSinaisVitaisInternacao'
import { AbaInternacao } from '@/components/internamento/AbaInternacao'
import { FormularioFichaCcih } from '@/components/internamento/FormularioFichaCcih'
import { FormularioEvolucaoDiurnaNoturna } from '@/components/internamento/FormularioEvolucaoDiurnaNoturna'
import { FormularioCondicoesAlta } from '@/components/internamento/FormularioCondicoesAlta'
import { FormularioEvolucaoMultiprofissional } from '@/components/internamento/FormularioEvolucaoMultiprofissional'
import { FormularioInternacaoObstetrica } from '@/components/internamento/FormularioInternacaoObstetrica'
import { FormularioBercario } from '@/components/internamento/FormularioBercario'
import { FormularioSae } from '@/components/internamento/FormularioSae'
import { AbaInstrucoesEnfermagem } from '@/components/internamento/AbaInstrucoesEnfermagem'
import {
  type AbaInternacaoId,
  type ModoWorkspaceInternacao,
  parseAbaInternacao,
  abaPadraoPorModo,
  abasPorModo,
  abaValidaNoModo,
  isRoleEnfermagem,
  labelAbaInternacao,
} from '@/lib/internacao-abas'
import {
  montarTextoSugeridoEvolucao,
  identificacaoPacienteInternacao,
  type AtendimentoInternacaoCtx,
} from '@/lib/prefill-internamento'
import { deduplicarAlergiasPaciente } from '@/lib/alergias-paciente'

export type { AbaInternacaoId } from '@/lib/internacao-abas'

export function WorkspaceInternacao({
  atendimentoId,
  abaInicial,
  modo,
}: {
  atendimentoId: string
  abaInicial?: string | null
  modo: ModoWorkspaceInternacao
}) {
  const { data: sessao } = useSession()
  const role = sessao?.usuario?.role ?? ''
  const abaFromUrl = parseAbaInternacao(abaInicial)
  const abaDefault = useMemo(() => abaPadraoPorModo(modo, role), [modo, role])
  const abaInicialValida =
    abaFromUrl && abaValidaNoModo(modo, abaFromUrl, true) ? abaFromUrl : abaDefault

  const [abaAtual, setAbaAtual] = useState<AbaInternacaoId>(abaInicialValida)
  const [carregando, setCarregando] = useState(true)
  const [dados, setDados] = useState<{
    atendimento: Record<string, unknown>
    prontuario: Record<string, unknown>
  } | null>(null)

  const listaHref = modo === 'prontuario' ? '/prontuario' : '/evolucoes'
  const tituloModo = modo === 'prontuario' ? 'Prontuário Médico' : 'Prontuário Enfermagem'
  const tituloAba = labelAbaInternacao(abaAtual, modo) ?? tituloModo

  async function carregar(opcoes?: { silencioso?: boolean }) {
    if (!opcoes?.silencioso) setCarregando(true)
    try {
      const resProntuario = await fetch(`/api/atendimento/${atendimentoId}/prontuario`)
      const jsonP = await resProntuario.json()

      if (!jsonP.sucesso) {
        toast.error(jsonP.erro ?? 'Erro ao carregar prontuário.')
        if (!opcoes?.silencioso) setDados(null)
        return
      }
      setDados(jsonP.dados)
    } catch {
      toast.error('Erro de conexão.')
      if (!opcoes?.silencioso) setDados(null)
    } finally {
      if (!opcoes?.silencioso) setCarregando(false)
    }
  }

  useEffect(() => {
    carregar()
  }, [atendimentoId])

  useEffect(() => {
    const parsed = parseAbaInternacao(abaInicial)
    if (parsed && abaValidaNoModo(modo, parsed)) setAbaAtual(parsed)
  }, [abaInicial, modo])

  if (carregando) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin" aria-hidden />
        <p>Carregando {tituloModo.toLowerCase()}…</p>
      </div>
    )
  }

  if (!dados) {
    return (
      <div className="max-w-lg mx-auto p-6">
        <Link href={listaHref} className="text-sm text-primary hover:underline">
          ← Voltar à lista
        </Link>
        <p className="mt-4 text-muted-foreground">
          Não foi possível carregar o atendimento. Verifique se o paciente está{' '}
          <strong className="text-foreground">internado</strong>.
        </p>
      </div>
    )
  }

  const atendimento = dados.atendimento as {
    id: string
    numeroAtendimento: string
    setor?: string | null
    updatedAt?: string
    obstetrico?: boolean
    leitoId?: string | null
    leito?: { ala: string; quarto: string | null; codigo: string; tipo: string } | null
    medico?: { nome: string; crm: string | null } | null
    paciente: {
      nomeExibicao: string
      nomeCriptografado?: string
      nomeCompleto?: string | null
      dataNascimento?: string
      sexoBiologico?: string
      tipoSanguineo: string
      alergias?: { descricao: string; gravidade?: string | null }[]
      medicamentosCont?: { nome: string; dose: string | null; frequencia: string | null }[]
    }
    triagem?: {
      corClassificacao: string
      queixaPrincipal: string
      sinaisVitais?: Record<string, unknown> | null
    } | null
  }
  const prontuario = dados.prontuario as {
    id: string
    anamnese?: { queixaPrincipal?: string; hda?: string | null; exameFisico?: unknown } | null
    diagnosticos?: { codigoCid: string; descricaoCid: string; principal: boolean; hipotese?: string | null }[]
    prescricoes?: {
      id: string
      numeroPrescricao?: number | null
      emitidaEm?: string
      createdAt?: string
      tipo?: string
      observacoes?: string | null
      itens: {
        id: string
        nomeMedicamento: string
        dose: string
        unidadeMedida?: string | null
        via: string
        frequencia: string
        status: string
        duracaoDias?: number | null
        observacoes?: string | null
        aplicacoes?: {
          id: string
          aplicadoEm: string
          doseAplicada: string
          aplicadoPor?: { nome: string } | null
        }[]
      }[]
    }[]
    evolucoes?: { id: string; conteudo: string; registradoEm: string; autor?: { nome: string } }[]
    encaminhamentos?: { id: string; tipo: string; createdAt?: string }[]
    requisicoes?: { itens: { nomeExame: string; resultado: string | null }[] }[]
  }

  const paciente = atendimento.paciente
  const obstetrico = Boolean(atendimento.obstetrico)
  const abas = abasPorModo(modo, obstetrico)
  const alergiasPaciente = deduplicarAlergiasPaciente(paciente.alergias ?? [])
  const nomePacienteCompleto =
    paciente.nomeCompleto ??
    nomeCompletoParaExibicao(
      paciente.nomeExibicao,
      paciente.nomeCriptografado,
      paciente.nomeCompleto
    )
  const encaminhamentoInternacaoId =
    (prontuario.encaminhamentos ?? []).find((e) => e.tipo === 'INTERNACAO')?.id ?? null

  const ctxInternacao = {
    ...atendimento,
    prontuario,
  } as unknown as AtendimentoInternacaoCtx

  const identificacao = identificacaoPacienteInternacao(ctxInternacao)
  const textoSugeridoEvolucao = montarTextoSugeridoEvolucao(ctxInternacao)

  return (
    <div className="max-w-[96rem] mx-auto space-y-4 pb-12 w-full min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={listaHref}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Voltar à lista
        </Link>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {modo === 'evolucoes' ? (
            <>
              <Link
                href={`/recepcao/imprimir/${atendimento.numeroAtendimento}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted/50"
              >
                <FileText className="h-4 w-4" aria-hidden />
                Ficha recepção
              </Link>
              <Link
                href={`/internamento/ficha-alta/${atendimentoId}`}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-violet-400/50 text-sm font-medium text-violet-700 dark:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-950/30"
              >
                <FileText className="h-4 w-4" aria-hidden />
                Ficha hospitalar
              </Link>
              <Link
                href={`/internamento/ccih/imprimir/${atendimentoId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-amber-500/40 text-sm font-medium text-amber-800 dark:text-amber-200 hover:bg-amber-500/5"
              >
                <Shield className="h-4 w-4" aria-hidden />
                Imprimir CCIH
              </Link>
              <Link
                href={`/internamento/multidisciplinar/imprimir/${atendimentoId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-violet-500/40 text-sm font-medium text-violet-800 dark:text-violet-200 hover:bg-violet-500/5"
              >
                <Users className="h-4 w-4" aria-hidden />
                Imprimir multidisciplinar
              </Link>
            </>
          ) : null}
          {encaminhamentoInternacaoId ? (
            <Link
              href={`/atendimento/encaminhamento/imprimir/${encaminhamentoInternacaoId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted/50"
            >
              <Printer className="h-4 w-4" aria-hidden />
              Solicitação médica
            </Link>
          ) : null}
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-5 flex flex-wrap gap-6 items-start shadow-sm">
        <div className="flex items-center gap-4 flex-1 min-w-[260px]">
          <div className="h-14 w-14 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xl font-bold shrink-0">
            {nomePacienteCompleto.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {tituloAba}
            </p>
            <h1 className="text-xl font-bold text-foreground break-words">{nomePacienteCompleto}</h1>
            <p className="text-sm font-mono text-muted-foreground mt-0.5">
              {atendimento.numeroAtendimento}
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1 text-xs text-muted-foreground">
              {identificacao.setorUnidade || atendimento.setor ? (
                <span>
                  <span className="font-medium text-foreground">Setor:</span>{' '}
                  {identificacao.setorUnidade || atendimento.setor}
                </span>
              ) : null}
              {identificacao.leitoDescricao ? (
                <span>
                  <span className="font-medium text-foreground">Leito:</span>{' '}
                  {identificacao.leitoDescricao}
                </span>
              ) : null}
            </div>
          </div>
        </div>
        {atendimento.triagem ? (
          <div className="flex flex-col gap-2 shrink-0 border-l border-border pl-0 sm:pl-6 w-full sm:w-auto">
            <div className="flex justify-between items-center gap-4">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Triagem
              </span>
              <BadgeManchester cor={atendimento.triagem.corClassificacao as never} size="md" />
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2 max-w-md">
              {atendimento.triagem.queixaPrincipal}
            </p>
          </div>
        ) : null}
      </div>

      {alergiasPaciente.length > 0 ? (
        <div className="bg-red-50 dark:bg-red-950/20 border-l-4 border-red-500 rounded-r-xl p-3 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" aria-hidden />
          <div>
            <h4 className="text-sm font-bold text-red-800 dark:text-red-400">
              Alergias registradas — conferir antes de prescrever
            </h4>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {alergiasPaciente.map((a) => (
                <span
                  key={`${a.descricao}-${a.gravidade ?? ''}`}
                  className="px-2 py-0.5 bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-200 text-xs font-medium rounded-full"
                >
                  {a.descricao}
                  {a.gravidade ? ` (${a.gravidade})` : ''}
                </span>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      <div className="border-b border-border">
        <div
          className="flex gap-1 overflow-x-auto pb-0"
          role="tablist"
          aria-label={tituloModo}
        >
          {abas.map((aba) => {
            const ativa = abaAtual === aba.id
            return (
              <button
                key={aba.id}
                type="button"
                role="tab"
                aria-selected={ativa}
                onClick={() => setAbaAtual(aba.id)}
                className={cn(
                  'flex items-center gap-2 px-3 py-2.5 border-b-2 text-xs sm:text-sm font-medium transition-all whitespace-nowrap shrink-0',
                  ativa
                    ? 'border-primary text-primary bg-primary/5'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
                )}
              >
                <aba.icon className="h-4 w-4 shrink-0" aria-hidden />
                {aba.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="min-h-[320px]" role="tabpanel">
        {modo === 'evolucoes' && abaAtual === 'INTERNACAO_ALTA' ? (
          <AbaInternacao
            atendimentoId={atendimentoId}
            numeroAtendimento={atendimento.numeroAtendimento}
            leitoAtual={atendimento.leito}
            setorUnidade={identificacao.setorUnidade || atendimento.setor}
            dataInternacao={identificacao.dataInternacao}
          />
        ) : null}

        {modo === 'evolucoes' && abaAtual === 'CCIH' ? (
          <FormularioFichaCcih atendimentoId={atendimentoId} />
        ) : null}

        {modo === 'evolucoes' && abaAtual === 'MULTIDISCIPLINAR' ? (
          <FormularioEvolucaoMultiprofissional atendimentoId={atendimentoId} />
        ) : null}

        {modo === 'evolucoes' && abaAtual === 'INSTRUCOES_ENFERMAGEM' ? (
          <AbaInstrucoesEnfermagem
            atendimentoId={atendimentoId}
            medicoNome={atendimento.medico?.nome}
            prescricoes={prontuario.prescricoes}
            evolucoes={prontuario.evolucoes}
            onAtualizar={carregar}
          />
        ) : null}

        {modo === 'prontuario' && abaAtual === 'LAUDO_MEDICO' ? (
          <AbaEmDesenvolvimento
            titulo="Laudo Médico"
            descricao="Laudos e pareceres médicos complementares durante a internação."
            icon={Stethoscope}
          />
        ) : null}

        {abaAtual === 'FICHA_EVOLUCAO' && modo === 'prontuario' && !isRoleEnfermagem(role) ? (
          <FormularioEvolucao
            atendimentoId={atendimentoId}
            prontuarioId={prontuario.id}
            evolucoesIniciais={(prontuario.evolucoes ?? []) as never[]}
            textoSugerido={textoSugeridoEvolucao}
            preencherAutomaticamente={false}
            variant="prontuario"
            onSalvo={() => carregar({ silencioso: true })}
          />
        ) : null}

        {abaAtual === 'PRESCRICAO_ENFERMARIA' && modo === 'prontuario' && !isRoleEnfermagem(role) ? (
          <AbaPrescricoesInternacao
            atendimentoId={atendimentoId}
            prontuarioId={prontuario.id}
            ctxInternacao={ctxInternacao}
            prescricoes={prontuario.prescricoes}
            onAtualizar={carregar}
          />
        ) : null}

        {abaAtual === 'EXAMES' && modo === 'prontuario' && !isRoleEnfermagem(role) ? (
          <AbaExamesInternacao
            atendimentoId={atendimentoId}
            prontuarioId={prontuario.id}
            requisicoes={prontuario.requisicoes as never[]}
            onAtualizar={carregar}
          />
        ) : null}

        {abaAtual === 'FICHA_EVOLUCAO' && modo === 'prontuario' && isRoleEnfermagem(role) ? (
          <div className="bg-card border border-border rounded-xl p-6 text-sm text-muted-foreground">
            Evoluções médicas são registradas pelo médico no módulo Prontuário.
          </div>
        ) : null}

        {abaAtual === 'PRESCRICAO_ENFERMARIA' && modo === 'prontuario' && isRoleEnfermagem(role) ? (
          <AbaPrescricoesInternacao
            atendimentoId={atendimentoId}
            prontuarioId={prontuario.id}
            ctxInternacao={ctxInternacao}
            prescricoes={prontuario.prescricoes}
            somenteLeituraMedicacoes
            onAtualizar={carregar}
          />
        ) : null}

        {abaAtual === 'EXAMES' && modo === 'prontuario' && isRoleEnfermagem(role) ? (
          <AbaExamesInternacao
            atendimentoId={atendimentoId}
            prontuarioId={prontuario.id}
            requisicoes={prontuario.requisicoes as never[]}
            somenteLeitura
            onAtualizar={carregar}
          />
        ) : null}

        {modo === 'evolucoes' && abaAtual === 'SINAIS_VITAIS' ? (
          <AbaSinaisVitaisInternacao atendimentoId={atendimentoId} />
        ) : null}

        {modo === 'evolucoes' && abaAtual === 'EVOLUCAO_DIURNA_NOTURNA' ? (
          <FormularioEvolucaoDiurnaNoturna atendimentoId={atendimentoId} />
        ) : null}

        {modo === 'evolucoes' && abaAtual === 'CONDICOES_ALTA' ? (
          <FormularioCondicoesAlta
            atendimentoId={atendimentoId}
            numeroAtendimento={atendimento.numeroAtendimento}
          />
        ) : null}

        {modo === 'evolucoes' && abaAtual === 'SAE' ? (
          <FormularioSae atendimentoId={atendimentoId} />
        ) : null}

        {abaAtual === 'INTERNACAO_OBSTETRICA' ? (
          <FormularioInternacaoObstetrica atendimentoId={atendimentoId} />
        ) : null}

        {modo === 'evolucoes' && abaAtual === 'MEDICACAO_BERCARIO' ? (
          <FormularioBercario atendimentoId={atendimentoId} />
        ) : null}
      </div>
    </div>
  )
}
