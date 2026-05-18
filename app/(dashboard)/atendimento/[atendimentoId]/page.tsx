'use client';
// app/(dashboard)/atendimento/[atendimentoId]/page.tsx
// Workspace do médico (Prontuário, Anamnese, Diagnóstico, Prescrição)

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
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
} from 'lucide-react';
import { BadgeManchester } from '@/components/triagem/BadgeManchester';
import { BotaoChamarPainel } from '@/components/atendimento/BotaoChamarPainel';
import { FormularioAnamnese } from '@/components/atendimento/FormularioAnamnese';
import { FormularioDiagnostico } from '@/components/atendimento/FormularioDiagnostico';
import { FormularioPrescricao } from '@/components/atendimento/FormularioPrescricao';
import { FormularioEvolucao } from '@/components/atendimento/FormularioEvolucao';
import { FormularioExames } from '@/components/atendimento/FormularioExames';
import { FormularioEncaminhamento } from '@/components/atendimento/FormularioEncaminhamento';
import { cn } from '@/lib/utils';
import Link from 'next/link';

type Aba = 'ANAMNESE' | 'DIAGNOSTICO' | 'PRESCRICAO' | 'EVOLUCAO' | 'EXAMES' | 'ENCAMINHAMENTO';

export default function WorkspaceAtendimento({
  params,
}: {
  params: Promise<{ atendimentoId: string }>;
}) {
  const { atendimentoId } = use(params);
  const router = useRouter();
  const [abaAtual, setAbaAtual] = useState<Aba>('ANAMNESE');
  const [dados, setDados] = useState<any>(null);
  const [carregando, setCarregando] = useState(true);

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
  const procedenciaExibicao =
    (atendimento.origem as { descricao?: string } | null)?.descricao?.trim() || null;

  const abas: { id: Aba; label: string; icon: typeof FileText; completado: boolean }[] = [
    { id: 'ANAMNESE', label: 'Anamnese', icon: FileText, completado: !!prontuario.anamnese },
    { id: 'DIAGNOSTICO', label: 'Diagnósticos', icon: Stethoscope, completado: prontuario.diagnosticos?.length > 0 },
    { id: 'PRESCRICAO', label: 'Prescrição', icon: Pill, completado: prontuario.prescricoes?.length > 0 },
    { id: 'EVOLUCAO', label: 'Evolução', icon: NotebookPen, completado: (prontuario.evolucoes?.length ?? 0) > 0 },
    { id: 'EXAMES', label: 'Exames', icon: FlaskConical, completado: (prontuario.requisicoes?.length ?? 0) > 0 },
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
          <button
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
            onClick={async () => {
              if (!confirm('Deseja realmente solicitar o internamento deste paciente?')) return;
              try {
                const res = await fetch(`/api/atendimento/${atendimentoId}/status`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ status: 'INTERNADO' })
                });
                const json = await res.json();
                if (json.sucesso) {
                  toast.success('Solicitação de internamento registrada!');
                  router.push('/atendimento');
                  router.refresh();
                } else {
                  toast.error(json.erro ?? 'Erro ao solicitar internamento.');
                }
              } catch {
                toast.error('Erro de conexão ao solicitar internamento.');
              }
            }}
          >
            <Activity className="h-4 w-4" /> Solicitar Internamento
          </button>
          <button
            className="px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            onClick={async () => {
              try {
                const res = await fetch(`/api/atendimento/${atendimentoId}/status`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ status: 'CONCLUIDO' })
                });
                const json = await res.json();
                if (json.sucesso) {
                  toast.success('Atendimento finalizado com sucesso!');
                  router.push('/atendimento');
                  router.refresh();
                } else {
                  toast.error(json.erro ?? 'Erro ao finalizar atendimento.');
                }
              } catch {
                toast.error('Erro de conexão ao finalizar atendimento.');
              }
            }}
          >
            <CheckCircle2 className="h-4 w-4" /> Finalizar Atendimento
          </button>
        </div>
      </div>

      {/* Header do Paciente */}
      <div className="bg-card border border-border rounded-xl p-5 flex flex-wrap gap-6 items-start shadow-sm">
        <div className="flex items-center gap-4 flex-1 min-w-[300px]">
          <div className="h-14 w-14 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xl font-bold shrink-0">
            {paciente.nomeExibicao.charAt(0)}
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">{paciente.nomeExibicao}</h2>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mt-1">
              <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-foreground">
                {atendimento.numeroAtendimento}
              </span>
              <span>Tipo Sanguíneo: <b>{paciente.tipoSanguineo.replace('_', ' ')}</b></span>
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
      </div>

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
          {abas.map((aba) => (
            <button
              key={aba.id}
              onClick={() => setAbaAtual(aba.id)}
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
          ))}
        </div>
      </div>

      {/* Conteúdo da Aba */}
      <div className="pt-2">
        {abaAtual === 'ANAMNESE' && (
          <FormularioAnamnese
            atendimentoId={atendimento.id}
            queixaTriagem={atendimento.triagem?.queixaPrincipal}
            dadosExistentes={prontuario.anamnese}
            onSalvo={carregarDados}
          />
        )}

        {abaAtual === 'DIAGNOSTICO' && (
          <FormularioDiagnostico
            atendimentoId={atendimento.id}
            prontuarioId={prontuario.id}
            diagnosticosIniciais={prontuario.diagnosticos}
          />
        )}

        {abaAtual === 'PRESCRICAO' && (
          <div className="space-y-6">
            <FormularioPrescricao
              atendimentoId={atendimento.id}
              prontuarioId={prontuario.id}
              onPrescricaoCriada={carregarDados}
            />

            {prontuario.prescricoes?.length > 0 && (
              <div className="mt-8 space-y-4">
                <h3 className="text-lg font-bold">Prescrições Realizadas</h3>
                {prontuario.prescricoes.map((p: any) => (
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

        {abaAtual === 'EVOLUCAO' && (
          <FormularioEvolucao
            atendimentoId={atendimento.id}
            prontuarioId={prontuario.id}
            evolucoesIniciais={prontuario.evolucoes ?? []}
            onSalvo={carregarDados}
          />
        )}

        {abaAtual === 'EXAMES' && (
          <FormularioExames
            atendimentoId={atendimento.id}
            prontuarioId={prontuario.id}
            requisicoesIniciais={prontuario.requisicoes ?? []}
            onSalvo={carregarDados}
          />
        )}

        {abaAtual === 'ENCAMINHAMENTO' && (
          <FormularioEncaminhamento
            atendimentoId={atendimento.id}
            prontuarioId={prontuario.id}
            encaminhamentosIniciais={prontuario.encaminhamentos ?? []}
            onSalvo={carregarDados}
          />
        )}
      </div>
    </div>
  );
}
