'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  History,
  User,
  AlertTriangle,
  Pill,
  HeartPulse,
  Stethoscope,
  FileText,
  FlaskConical,
  Activity,
  Calendar,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Clock,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import type { HistoricoLongitudinalPacienteDTO, PassagemHistoricoDTO } from '@/lib/historico-paciente';
import { VisualizadorResultadoExame } from '@/components/atendimento/VisualizadorResultadoExame';

export function TimelineHistoricoPaciente({ pacienteId }: { pacienteId: string }) {
  const [dados, setDados] = useState<HistoricoLongitudinalPacienteDTO | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [expandidos, setExpandidos] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function carregar() {
      setCarregando(true);
      try {
        const res = await fetch(`/api/pacientes/${pacienteId}/historico-longitudinal`);
        if (!res.ok) {
          throw new Error('Falha ao obter histórico clínico.');
        }
        const json = await res.json();
        setDados(json);

        // Auto-expandir a primeira passagem (mais recente)
        if (json.passagens && json.passagens.length > 0) {
          setExpandidos({ [json.passagens[0].atendimentoId]: true });
        }
      } catch {
        toast.error('Erro ao carregar histórico longitudinal do paciente.');
      } finally {
        setCarregando(false);
      }
    }
    if (pacienteId) {
      carregar();
    }
  }, [pacienteId]);

  const toggleExpand = (id: string) => {
    setExpandidos((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const expandirTodos = () => {
    if (!dados) return;
    const todos: Record<string, boolean> = {};
    dados.passagens.forEach((p) => {
      todos[p.atendimentoId] = true;
    });
    setExpandidos(todos);
  };

  const recolherTodos = () => {
    setExpandidos({});
  };

  if (carregando) {
    return (
      <div className="p-8 text-center space-y-4 max-w-4xl mx-auto">
        <HeartPulse className="h-10 w-10 animate-pulse text-primary mx-auto" />
        <p className="text-sm font-medium text-muted-foreground">
          Carregando prontuário eletrônico longitudinal (PEP)...
        </p>
      </div>
    );
  }

  if (!dados) {
    return (
      <div className="p-8 text-center space-y-3 max-w-2xl mx-auto border border-dashed rounded-xl">
        <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto" />
        <h3 className="font-semibold text-foreground">Paciente não localizado</h3>
        <p className="text-sm text-muted-foreground">
          Não foi possível encontrar os dados históricos deste paciente.
        </p>
      </div>
    );
  }

  const { paciente } = dados;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Banner Superior — Dados do Paciente */}
      <div className="p-6 rounded-2xl border border-border bg-card shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
              <User className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
                {paciente.nome}
              </h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground mt-0.5">
                <span>
                  CPF: <strong className="text-foreground">{paciente.cpf}</strong>
                </span>
                <span>•</span>
                <span>
                  Idade: <strong className="text-foreground">{paciente.idadeAnos} anos</strong> (
                  {new Date(paciente.dataNascimento).toLocaleDateString('pt-BR')})
                </span>
                <span>•</span>
                <span>
                  Sexo: <strong className="text-foreground">{paciente.sexoBiologico}</strong>
                </span>
                <span>•</span>
                <span>
                  Tipo Sanguíneo: <strong className="text-primary">{paciente.tipoSanguineo}</strong>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-3.5 py-1.5 rounded-xl bg-muted/80 text-foreground font-semibold text-xs flex items-center gap-1.5">
              <History className="h-4 w-4 text-primary" />
              {dados.totalAtendimentos} {dados.totalAtendimentos === 1 ? 'passagem' : 'passagens'}
            </div>
          </div>
        </div>

        {/* Alergias & Medicamentos de Uso Contínuo */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Alergias */}
          <div className="p-3.5 rounded-xl border border-destructive/20 bg-destructive/5 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-destructive uppercase tracking-wider">
              <AlertTriangle className="h-4 w-4" />
              Alergias Conhecidas
            </div>
            {paciente.alergias.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {paciente.alergias.map((a) => (
                  <span
                    key={a.id}
                    className="px-2.5 py-1 rounded-md text-xs font-semibold bg-destructive/15 text-destructive border border-destructive/30"
                  >
                    {a.descricao} {a.gravidade ? `(${a.gravidade})` : ''}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">Nenhuma alergia registrada.</p>
            )}
          </div>

          {/* Medicamentos Contínuos */}
          <div className="p-3.5 rounded-xl border border-primary/20 bg-primary/5 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-primary uppercase tracking-wider">
              <Pill className="h-4 w-4" />
              Medicamentos de Uso Contínuo
            </div>
            {paciente.medicamentosContinuos.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {paciente.medicamentosContinuos.map((m) => (
                  <span
                    key={m.id}
                    className="px-2.5 py-1 rounded-md text-xs font-medium bg-primary/10 text-foreground border border-primary/20"
                  >
                    {m.nome} — {m.dose} ({m.frequencia})
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">Nenhum medicamento contínuo registrado.</p>
            )}
          </div>
        </div>

        {/* Diagnósticos Recorrentes */}
        {dados.diagnosticosRecorrentes.length > 0 && (
          <div className="pt-2 border-t border-border">
            <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 mb-2">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Diagnósticos Históricos / CID-10 Registrados:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {dados.diagnosticosRecorrentes.map((d) => (
                <span
                  key={d.codigoCid}
                  className="px-2.5 py-1 rounded-lg text-xs bg-muted text-foreground border border-border"
                >
                  <strong className="text-primary font-mono">{d.codigoCid}</strong>: {d.descricao}{' '}
                  {d.ocorrencias > 1 && (
                    <span className="ml-1 px-1.5 py-0.2 rounded-full bg-primary/20 text-[10px] font-bold">
                      {d.ocorrencias}x
                    </span>
                  )}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Controles da Timeline */}
      <div className="flex items-center justify-between px-1">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <HeartPulse className="h-5 w-5 text-primary" />
          Linha do Tempo Clínica (PEP)
        </h2>
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={expandirTodos}
            className="px-2.5 py-1 rounded-md border border-border bg-background hover:bg-muted font-medium transition-colors"
          >
            Expandir todos
          </button>
          <button
            onClick={recolherTodos}
            className="px-2.5 py-1 rounded-md border border-border bg-background hover:bg-muted font-medium transition-colors"
          >
            Recolher todos
          </button>
        </div>
      </div>

      {/* Timeline Vertical */}
      <div className="relative pl-6 sm:pl-8 border-l-2 border-primary/30 space-y-6">
        {dados.passagens.map((p, idx) => {
          const isExpandido = Boolean(expandidos[p.atendimentoId]);
          return (
            <div key={p.atendimentoId} className="relative group">
              {/* Ponto / Nó da Timeline */}
              <div className="absolute -left-[31px] sm:-left-[39px] top-4 h-5 w-5 rounded-full border-4 border-background bg-primary shadow-sm" />

              {/* Cartão de Passagem */}
              <div className="rounded-2xl border border-border bg-card shadow-sm hover:border-primary/40 transition-all overflow-hidden">
                {/* Header do Cartão */}
                <div
                  onClick={() => toggleExpand(p.atendimentoId)}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer bg-muted/20 hover:bg-muted/40 transition-colors"
                >
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-mono font-bold text-sm text-primary">
                      {p.numeroAtendimento}
                    </span>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(p.dataHoraEntrada).toLocaleString('pt-BR')}
                    </span>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary">
                      {p.setor}
                    </span>
                    {p.leito && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600">
                        {p.leito}
                      </span>
                    )}
                    {idx === 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/15 text-emerald-600 border border-emerald-500/30">
                        ÚLTIMA PASSAGEM
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    {p.triagem?.prioridade && (
                      <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-muted text-foreground">
                        {p.triagem.prioridade}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {p.medicoResponsavel ? `Dr(a). ${p.medicoResponsavel}` : 'Sem médico'}
                    </span>
                    {isExpandido ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </div>

                {/* Conteúdo Expandido da Passagem */}
                {isExpandido && (
                  <div className="p-4 sm:p-6 border-t border-border space-y-5 bg-card">
                    {/* Sinais Vitais da Triagem */}
                    {p.triagem && (
                      <div className="p-3.5 rounded-xl bg-muted/40 border border-border space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold text-muted-foreground uppercase">
                          <span className="flex items-center gap-1.5">
                            <Activity className="h-4 w-4 text-primary" />
                            Triagem & Sinais Vitais
                          </span>
                          <span>{p.triagem.prioridade}</span>
                        </div>
                        {p.triagem.queixaPrincipal && (
                          <p className="text-sm text-foreground">
                            <strong>Queixa Principal:</strong> {p.triagem.queixaPrincipal}
                          </p>
                        )}
                        {p.triagem.sinaisVitais && (
                          <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs pt-1">
                            {p.triagem.sinaisVitais.pressaoArterial && (
                              <span>PA: <strong>{p.triagem.sinaisVitais.pressaoArterial}</strong></span>
                            )}
                            {p.triagem.sinaisVitais.frequenciaCardiaca && (
                              <span>FC: <strong>{p.triagem.sinaisVitais.frequenciaCardiaca} bpm</strong></span>
                            )}
                            {p.triagem.sinaisVitais.temperatura && (
                              <span>Temp: <strong>{p.triagem.sinaisVitais.temperatura} °C</strong></span>
                            )}
                            {p.triagem.sinaisVitais.spo2 && (
                              <span>SpO2: <strong>{p.triagem.sinaisVitais.spo2}%</strong></span>
                            )}
                            {p.triagem.sinaisVitais.glicemia && (
                              <span>Glicemia: <strong>{p.triagem.sinaisVitais.glicemia} mg/dL</strong></span>
                            )}
                            {p.triagem.sinaisVitais.escalaDor !== null && (
                              <span>Dor: <strong>{p.triagem.sinaisVitais.escalaDor}/10</strong></span>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Diagnósticos da Passagem */}
                    {p.diagnosticos.length > 0 && (
                      <div className="space-y-1.5">
                        <h4 className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1.5">
                          <Stethoscope className="h-3.5 w-3.5 text-primary" />
                          Diagnósticos Concluídos
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {p.diagnosticos.map((d) => (
                            <span
                              key={d.id}
                              className="px-3 py-1 rounded-lg text-xs font-medium bg-primary/10 text-foreground border border-primary/20"
                            >
                              <strong className="text-primary font-mono">{d.codigoCid}</strong>: {d.descricaoCid}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Anamnese */}
                    {p.anamnese && (
                      <div className="p-3 rounded-xl bg-muted/30 border border-border space-y-1 text-xs">
                        <span className="font-bold text-foreground">Anamnese / HDA:</span>
                        <p className="text-muted-foreground">{p.anamnese.hda || p.anamnese.queixaPrincipal}</p>
                      </div>
                    )}

                    {/* Prescrições Médicas */}
                    {p.prescricoes.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1.5">
                          <Pill className="h-3.5 w-3.5 text-primary" />
                          Medicamentos Prescritos
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {p.prescricoes.flatMap((presc) =>
                            presc.itens.map((item) => (
                              <div
                                key={item.id}
                                className="p-2.5 rounded-lg border border-border bg-background text-xs space-y-0.5"
                              >
                                <span className="font-semibold text-foreground">{item.medicamento}</span>
                                <p className="text-muted-foreground">
                                  {item.dose} • {item.via} • {item.frequencia}
                                </p>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}

                    {/* Exames */}
                    {p.exames.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1.5">
                          <FlaskConical className="h-3.5 w-3.5 text-primary" />
                          Exames e Resultados
                        </h4>
                        <div className="space-y-3">
                          {p.exames.flatMap((ex) =>
                            ex.itens.map((item) => (
                              <VisualizadorResultadoExame
                                key={item.id}
                                nomeExame={item.nomeExame}
                                resultadoTexto={item.resultado}
                                resultadoPdf={item.resultadoPdf}
                              />
                            ))
                          )}
                        </div>
                      </div>
                    )}

                    {/* Evoluções Clínicas */}
                    {p.evolucoes.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1.5">
                          <FileText className="h-3.5 w-3.5 text-primary" />
                          Evoluções Registradas ({p.evolucoes.length})
                        </h4>
                        <div className="space-y-1.5">
                          {p.evolucoes.map((evo) => (
                            <div
                              key={evo.id}
                              className="p-2.5 rounded-lg border border-border bg-muted/20 text-xs space-y-1"
                            >
                              <span className="text-[10px] text-muted-foreground font-semibold">
                                {new Date(evo.criadoEm).toLocaleString('pt-BR')}
                              </span>
                              <p className="text-foreground whitespace-pre-wrap">{evo.texto}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Desfecho / Alta */}
                    {p.alta && (
                      <div className="p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-xs space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-emerald-600">
                          <LogOut className="h-4 w-4" />
                          Desfecho / Alta Hospitalar
                        </div>
                        {p.alta.motivoAlta && (
                          <p className="text-foreground">
                            <strong>Motivo:</strong> {p.alta.motivoAlta}
                          </p>
                        )}
                        {p.alta.conduta && (
                          <p className="text-muted-foreground">
                            <strong>Conduta:</strong> {p.alta.conduta}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Botão para abrir no Prontuário */}
                    <div className="pt-2 flex justify-end">
                      <Link
                        href={`/prontuario/${p.atendimentoId}`}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Abrir Prontuário deste Atendimento
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {dados.passagens.length === 0 && (
          <div className="p-8 text-center text-sm text-muted-foreground border border-dashed rounded-xl">
            Nenhum atendimento registrado para este paciente.
          </div>
        )}
      </div>
    </div>
  );
}
