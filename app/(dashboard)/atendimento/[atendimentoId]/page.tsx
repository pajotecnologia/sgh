'use client';
// app/(dashboard)/atendimento/[atendimentoId]/page.tsx
// Workspace do médico (Prontuário, Anamnese, Diagnóstico, Prescrição)

import { useState, useEffect, use } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  FileText,
  Stethoscope,
  Pill,
  Activity,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Printer,
  NotebookPen,
  FlaskConical,
  Share2,
  FileSignature,
} from 'lucide-react';
import { FormularioReceitaAlta } from '@/components/atendimento/FormularioReceitaAlta';
import { ModalFinalizarAtendimento } from '@/components/atendimento/ModalFinalizarAtendimento';
import { filtrarPrescricoesPs, filtrarPrescricoesReceitaAlta } from '@/lib/prescricao-tipo';
import { analisarFluxoMedicacaoAtendimento } from '@/lib/atendimento-medicacao-fluxo';
import { BadgeManchester } from '@/components/triagem/BadgeManchester';
import { BotaoChamarPainel } from '@/components/atendimento/BotaoChamarPainel';
import { FormularioAnamnese } from '@/components/atendimento/FormularioAnamnese';
import { FormularioDiagnostico } from '@/components/atendimento/FormularioDiagnostico';
import { FormularioPrescricao } from '@/components/atendimento/FormularioPrescricao';
import { FormularioEvolucao } from '@/components/atendimento/FormularioEvolucao';
import { FormularioExames } from '@/components/atendimento/FormularioExames';
import { FormularioEncaminhamento } from '@/components/atendimento/FormularioEncaminhamento';
import { nomeCompletoParaExibicao } from '@/lib/nome-paciente-exibicao';
import { descricaoLeitoInternacao } from '@/lib/prefill-internamento';
import { ToggleObstetrico } from '@/components/atendimento/ToggleObstetrico';
import { cn } from '@/lib/utils';
import Link from 'next/link';

type Aba =
  | 'ANAMNESE'
  | 'DIAGNOSTICO'
  | 'PRESCRICAO'
  | 'EXAMES'
  | 'EVOLUCAO'
  | 'RECEITA_ALTA'
  | 'ENCAMINHAMENTO';

const ABAS_VALIDAS = new Set<string>([
  'ANAMNESE',
  'DIAGNOSTICO',
  'PRESCRICAO',
  'EXAMES',
  'EVOLUCAO',
  'RECEITA_ALTA',
  'ENCAMINHAMENTO',
]);

export default function WorkspaceAtendimento({
  params,
}: {
  params: Promise<{ atendimentoId: string }>;
}) {
  const { atendimentoId } = use(params);
  const searchParams = useSearchParams();
  const router = useRouter();
  const [abaAtual, setAbaAtual] = useState<Aba>('ANAMNESE');
  const [dados, setDados] = useState<any>(null);
  const [carregando, setCarregando] = useState(true);
  const [modalFinalizarAberto, setModalFinalizarAberto] = useState(false);

  async function carregarDados() {
    try {
      const res = await fetch(`/api/atendimento/${atendimentoId}/prontuario`);
      const json = await res.json();
      if (json.sucesso) {
        setDados(json.dados);
      } else {
        toast.error(json.erro ?? 'Erro ao carregar prontuário.');
      }
    } catch {
      toast.error('Erro de conexão ao carregar prontuário.');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarDados();
  }, [atendimentoId]);

  useEffect(() => {
    if (!dados || atendimentoEncerradoFrom(dados)) return
    const fluxo = analisarFluxoMedicacaoAtendimento(
      dados.prontuario.prescricoes ?? [],
      dados.prontuario.evolucoes ?? []
    )
    if (!fluxo.aguardandoRetornoMedicacao) return
    const intervalo = setInterval(() => {
      carregarDados()
    }, 5000)
    return () => clearInterval(intervalo)
  }, [dados, atendimentoId])

  function atendimentoEncerradoFrom(payload: { atendimento: { status: string }; prontuario: { encerradoEm?: string | null } }) {
    return (
      payload.atendimento.status === 'CONCLUIDO' ||
      payload.atendimento.status === 'AGUARDANDO_INTERNACAO' ||
      Boolean(payload.prontuario.encerradoEm)
    )
  }

  useEffect(() => {
    const aba = searchParams.get('aba')?.toUpperCase() ?? '';
    if (ABAS_VALIDAS.has(aba)) setAbaAtual(aba as Aba);
  }, [searchParams]);

  if (carregando) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-muted-foreground space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        <p>Carregando prontuário...</p>
      </div>
    );
  }

  if (!dados) return null;

  const { atendimento, prontuario } = dados;
  const paciente = atendimento.paciente;
  const nomePacienteCompleto =
    paciente.nomeCompleto ??
    nomeCompletoParaExibicao(
      paciente.nomeExibicao,
      paciente.nomeCriptografado,
      paciente.nomeCompleto
    );
  const procedenciaExibicao =
    (atendimento.origem as { descricao?: string } | null)?.descricao?.trim() || null;

  const atendimentoEncerrado =
    atendimento.status === 'CONCLUIDO' ||
    atendimento.status === 'AGUARDANDO_INTERNACAO' ||
    Boolean(prontuario.encerradoEm);
  const encaminhamentoInternacao = (prontuario.encaminhamentos ?? []).find(
    (e: { tipo: string }) => e.tipo === 'INTERNACAO'
  );
  const modoInternacao =
    atendimento.status === 'AGUARDANDO_INTERNACAO' || Boolean(encaminhamentoInternacao);
  const prescricoesPs = filtrarPrescricoesPs(prontuario.prescricoes ?? []);
  const prescricoesReceita = filtrarPrescricoesReceitaAlta(prontuario.prescricoes ?? []);
  const fluxoMedicacao = analisarFluxoMedicacaoAtendimento(
    prontuario.prescricoes ?? [],
    prontuario.evolucoes ?? []
  );
  const podeFinalizarAlta = fluxoMedicacao.podeFinalizarAtendimento;

  const abas: { id: Aba; label: string; icon: typeof FileText; completado: boolean }[] = [
    { id: 'ANAMNESE', label: 'Anamnese', icon: FileText, completado: !!prontuario.anamnese },
    { id: 'DIAGNOSTICO', label: 'Diagnósticos', icon: Stethoscope, completado: prontuario.diagnosticos?.length > 0 },
    {
      id: 'PRESCRICAO',
      label: 'Prescrição PS',
      icon: Pill,
      completado: prescricoesPs.length > 0,
    },
    { id: 'EXAMES', label: 'Exames', icon: FlaskConical, completado: (prontuario.requisicoes?.length ?? 0) > 0 },
    { id: 'EVOLUCAO', label: 'Evolução', icon: NotebookPen, completado: (prontuario.evolucoes?.length ?? 0) > 0 },
    ...(!modoInternacao
      ? [
          {
            id: 'RECEITA_ALTA' as Aba,
            label: 'Receita de alta',
            icon: FileSignature,
            completado: prescricoesReceita.length > 0,
          },
        ]
      : []),
    {
      id: 'ENCAMINHAMENTO',
      label: 'Encaminhamentos',
      icon: Share2,
      completado: (prontuario.encaminhamentos?.length ?? 0) > 0,
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-4 pb-12">
      {/* Breadcrumb e Ações Topo */}
      <div className="flex items-center justify-between">
        <Link href="/atendimento" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Voltar para Fila
        </Link>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <BotaoChamarPainel atendimentoId={atendimentoId} className="px-4 py-2 text-sm" />
          <Link
            href={`/atendimento/imprimir/${atendimentoId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-700 text-white text-sm font-semibold rounded-lg hover:bg-slate-800 transition-colors"
          >
            <Printer className="h-4 w-4 shrink-0" />
            Imprimir ficha
          </Link>
          {!atendimentoEncerrado ? (
            modoInternacao ? (
              <button
                type="button"
                className="px-4 py-2 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700"
                onClick={() => setModalFinalizarAberto(true)}
              >
                <CheckCircle2 className="h-4 w-4" />
                Encaminhar para internação
              </button>
            ) : fluxoMedicacao.aguardandoRetornoMedicacao ? (
              <button
                type="button"
                disabled
                className="px-4 py-2 text-sm font-semibold rounded-lg flex items-center gap-2 bg-amber-500/90 text-white cursor-not-allowed opacity-95"
                aria-label="Aguardando retorno da medicação aplicada pela enfermagem"
              >
                <Pill className="h-4 w-4" />
                Aguardando retorno (medicação)
              </button>
            ) : fluxoMedicacao.precisaEvolucaoPosMedicacao ? (
              <button
                type="button"
                className="px-4 py-2 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 bg-primary hover:bg-primary/90"
                onClick={() => setAbaAtual('EVOLUCAO')}
              >
                <NotebookPen className="h-4 w-4" />
                Preencher evolução pós-medicação
              </button>
            ) : (
              <button
                type="button"
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2"
                onClick={() => setModalFinalizarAberto(true)}
              >
                <CheckCircle2 className="h-4 w-4" />
                Finalizar Atendimento
              </button>
            )
          ) : null}
        </div>
      </div>

      {/* Header do Paciente */}
      <div className="bg-card border border-border rounded-xl p-5 flex flex-wrap gap-6 items-start">
        <div className="flex items-center gap-4 flex-1 min-w-[300px]">
          <div className="h-14 w-14 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xl font-bold shrink-0">
            {nomePacienteCompleto.charAt(0)}
          </div>
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-foreground break-words">{nomePacienteCompleto}</h2>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mt-1">
              <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-foreground">
                {atendimento.numeroAtendimento}
              </span>
              <span>Tipo Sanguíneo: <b>{paciente.tipoSanguineo.replace('_', ' ')}</b></span>
              {atendimento.setor ? (
                <span>Setor: <b className="text-foreground">{atendimento.setor}</b></span>
              ) : null}
              {descricaoLeitoInternacao(atendimento.leito) ? (
                <span>Leito: <b className="text-foreground">{descricaoLeitoInternacao(atendimento.leito)}</b></span>
              ) : null}
              {procedenciaExibicao ? (
                <span>
                  Procedência: <b className="text-foreground">{procedenciaExibicao}</b>
                </span>
              ) : null}
            </div>
          </div>
        </div>

        {/* Resumo Triagem */}
        {atendimento.triagem && (
          <div className="flex flex-col gap-2 shrink-0 border-l border-border pl-6">
            <div className="flex justify-between items-center gap-8">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Classificação</span>
              <BadgeManchester cor={atendimento.triagem.corClassificacao} size="md" />
            </div>
            <div className="text-xs max-w-[250px] line-clamp-2 text-muted-foreground">
              <b>Queixa Triagem:</b> {atendimento.triagem.queixaPrincipal}
            </div>
          </div>
        )}

        <div className="shrink-0">
          <ToggleObstetrico atendimentoId={atendimento.id} inicial={atendimento.obstetrico} />
        </div>
      </div>

      {atendimento.status === 'AGUARDANDO_INTERNACAO' ? (
        <div className="rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/80 dark:bg-indigo-950/30 px-4 py-3 text-sm text-indigo-900 dark:text-indigo-100">
          Paciente <strong>encaminhado para internação</strong>. Aguardando recepção em Admissões.
          {encaminhamentoInternacao ? (
            <>
              {' '}
              <Link
                href={`/atendimento/encaminhamento/imprimir/${encaminhamentoInternacao.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-700 dark:text-indigo-300 font-semibold hover:underline inline-flex items-center gap-1"
              >
                <Printer className="h-3.5 w-3.5" />
                Imprimir solicitação de internação
              </Link>
            </>
          ) : null}
        </div>
      ) : !modoInternacao && fluxoMedicacao.aguardandoRetornoMedicacao ? (
        <div className="rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50/90 dark:bg-amber-950/30 px-4 py-3 text-sm text-amber-950 dark:text-amber-100">
          <strong>Medicação prescrita para uso no PS.</strong> Paciente aguardando aplicação pela enfermagem (
          {fluxoMedicacao.qtdPendentes}{' '}
          {fluxoMedicacao.qtdPendentes === 1 ? 'dose pendente' : 'doses pendentes'}). O atendimento só poderá ser finalizado após o retorno
          e registro da <strong>evolução pós-medicação</strong>.
        </div>
      ) : !modoInternacao && fluxoMedicacao.precisaEvolucaoPosMedicacao ? (
        <div className="rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-foreground">
          Medicação já aplicada. Registre a{' '}
          <button
            type="button"
            className="text-primary font-semibold hover:underline"
            onClick={() => setAbaAtual('EVOLUCAO')}
          >
            evolução pós-medicação
          </button>{' '}
          para liberar a finalização do atendimento.
        </div>
      ) : atendimentoEncerrado ? (
        <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/80 dark:bg-amber-950/30 px-4 py-3 text-sm text-amber-900 dark:text-amber-100">
          Atendimento <strong>finalizado</strong>. Você pode emitir ou imprimir{' '}
          <button
            type="button"
            className="text-primary font-semibold hover:underline"
            onClick={() => setAbaAtual('RECEITA_ALTA')}
          >
            receita de alta
          </button>
          ; demais abas estão somente leitura.
        </div>
      ) : null}

      {/* Alertas Críticos (Alergias / Doenças) */}
      {paciente.alergias?.length > 0 && (
        <div className="bg-red-50 dark:bg-red-950/20 border-l-4 border-red-500 rounded-r-xl p-3 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-red-800 dark:text-red-400">ALERGIAS REGISTRADAS</h4>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {paciente.alergias.map((a: any, i: number) => (
                <span key={i} className="px-2 py-0.5 bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-200 text-xs font-medium rounded-full">
                  {a.descricao} {a.gravidade && `(${a.gravidade})`}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Navegação por Abas */}
      <div className="border-b border-border mt-6">
        <div className="flex gap-6 overflow-x-auto pb-[1px]">
          {abas.map((aba) => {
            const tabHabilitada =
              !atendimentoEncerrado ||
              (modoInternacao && aba.id === 'ENCAMINHAMENTO') ||
              (!modoInternacao && aba.id === 'RECEITA_ALTA')
            return (
            <button
              key={aba.id}
              type="button"
              onClick={() => setAbaAtual(aba.id)}
              disabled={!tabHabilitada}
              className={cn(
                'flex items-center gap-2 pb-3 px-1 border-b-2 text-sm font-medium transition-all whitespace-nowrap',
                abaAtual === aba.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30'
              )}
            >
              <aba.icon className="h-4 w-4" />
              {aba.label}
              {aba.completado && <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />}
            </button>
            )
          })}
        </div>
      </div>

      {/* Conteúdo da Aba */}
      <div className="pt-2">
        {abaAtual === 'ANAMNESE' && !atendimentoEncerrado && (
          <FormularioAnamnese
            atendimentoId={atendimento.id}
            queixaTriagem={atendimento.triagem?.queixaPrincipal}
            dadosExistentes={prontuario.anamnese}
            onSalvo={carregarDados}
          />
        )}

        {abaAtual === 'DIAGNOSTICO' && !atendimentoEncerrado && (
          <FormularioDiagnostico
            atendimentoId={atendimento.id}
            prontuarioId={prontuario.id}
            diagnosticosIniciais={prontuario.diagnosticos}
          />
        )}

        {abaAtual === 'PRESCRICAO' && !atendimentoEncerrado && (
          <div className="space-y-6">
            <FormularioPrescricao
              atendimentoId={atendimento.id}
              prontuarioId={prontuario.id}
              tipoPrescricao="PS"
              onPrescricaoCriada={carregarDados}
            />

            {prescricoesPs.length > 0 && (
              <div className="mt-8 space-y-4">
                <h3 className="text-lg font-bold">Prescrições PS realizadas</h3>
                {prescricoesPs.map((p: any) => (
                  <div key={p.id} className="bg-card border border-border rounded-xl overflow-hidden">
                    <div className="bg-muted/40 px-4 py-2 border-b border-border flex justify-between items-center text-sm">
                      <span className="font-semibold text-foreground">Receita #{p.numeroPrescricao}</span>
                      <span className="text-muted-foreground">{new Date(p.createdAt).toLocaleString()}</span>
                    </div>
                    <div className="p-4">
                      <ul className="space-y-2 text-sm">
                        {p.itens.map((i: any) => (
                          <li key={i.id} className="flex gap-2">
                            <Activity className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-semibold">{i.nomeMedicamento}</span>
                                <span
                                  className={`text-[10px] uppercase px-1.5 py-0.5 rounded font-bold ${
                                    i.status === 'PENDENTE'
                                      ? 'bg-amber-100 text-amber-900'
                                      : i.status === 'APLICADO'
                                        ? 'bg-emerald-100 text-emerald-900'
                                        : 'bg-muted text-muted-foreground'
                                  }`}
                                >
                                  {i.status}
                                </span>
                              </div>
                              <span className="text-muted-foreground">
                                {' '}
                                — {i.dose} ({i.via}) — {i.frequencia}
                              </span>
                              {i.observacoes && <span className="block text-xs text-muted-foreground mt-0.5">{i.observacoes}</span>}
                              {i.aplicacoes?.length > 0 && (
                                <ul className="mt-1 space-y-0.5 text-xs text-emerald-700 dark:text-emerald-400">
                                  {i.aplicacoes.map((ap: any, idx: number) => (
                                    <li key={ap.id}>
                                      {idx + 1}ª aplicação: {new Date(ap.aplicadoEm).toLocaleString('pt-BR')}
                                      {ap.aplicadoPor?.nome ? ` — ${ap.aplicadoPor.nome}` : ''} — {ap.doseAplicada}
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {abaAtual === 'EXAMES' && !atendimentoEncerrado && (
          <FormularioExames
            atendimentoId={atendimento.id}
            prontuarioId={prontuario.id}
            requisicoesIniciais={prontuario.requisicoes ?? []}
            onSalvo={carregarDados}
          />
        )}

        {abaAtual === 'EVOLUCAO' && !atendimentoEncerrado && (
          <FormularioEvolucao
            atendimentoId={atendimento.id}
            prontuarioId={prontuario.id}
            evolucoesIniciais={prontuario.evolucoes ?? []}
            onSalvo={carregarDados}
          />
        )}

        {abaAtual === 'RECEITA_ALTA' && (
          <FormularioReceitaAlta
            atendimentoId={atendimento.id}
            prontuarioId={prontuario.id}
            prescricoes={prescricoesReceita as never[]}
            onSalvo={carregarDados}
            somenteLeitura={false}
          />
        )}

        {abaAtual === 'ENCAMINHAMENTO' && (
          <FormularioEncaminhamento
            atendimentoId={atendimento.id}
            prontuarioId={prontuario.id}
            encaminhamentosIniciais={prontuario.encaminhamentos ?? []}
            onSalvo={carregarDados}
            onFinalizar={() => {
              if (!podeFinalizarAlta) {
                toast.error('Aguarde a medicação e registre a evolução pós-uso antes de finalizar.')
                return
              }
              setModalFinalizarAberto(true)
            }}
            onInternacaoSolicitada={() => {
              router.push('/atendimento')
              router.refresh()
            }}
            somenteLeitura={atendimentoEncerrado && modoInternacao}
            bloquearFinalizar={!modoInternacao && !podeFinalizarAlta}
          />
        )}
      </div>

      <ModalFinalizarAtendimento
        aberto={modalFinalizarAberto}
        onFechar={() => setModalFinalizarAberto(false)}
        atendimentoId={atendimentoId}
        nomePaciente={nomePacienteCompleto}
        prescricoes={prontuario.prescricoes ?? []}
        modoInternacao={modoInternacao}
        encaminhamentoInternacaoId={encaminhamentoInternacao?.id ?? null}
      />
    </div>
  );
}
