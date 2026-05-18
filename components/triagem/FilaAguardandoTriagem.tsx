'use client';
// components/triagem/FilaAguardandoTriagem.tsx
// Lista de pacientes aguardando triagem com ações: Chamar + Iniciar Triagem

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  ClipboardList, Clock, Megaphone, Stethoscope, AlertTriangle,
  RefreshCw, Loader2, X, ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PacienteAguardando {
  atendimentoId: string;
  numeroAtendimento: string;
  nomePaciente: string;
  dataNascimento: string;
  sexoBiologico: string;
  convenio: string | null;
  alergias: string[];
  entradaFila: string;
}

interface Props {
  pacientesIniciais: PacienteAguardando[];
  podeChamar: boolean;
  podeTriar: boolean;
}

function minutosDesde(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
}
function formatarTempo(min: number): string {
  if (min < 60) return `${min}min`;
  return `${Math.floor(min / 60)}h${min % 60 > 0 ? ` ${min % 60}min` : ''}`;
}

export function FilaAguardandoTriagem({ pacientesIniciais, podeChamar, podeTriar }: Props) {
  const router = useRouter();
  const [pacientes, setPacientes] = useState(pacientesIniciais);
  const [chamandoId, setChamandoId] = useState<string | null>(null);
  const [modalChamar, setModalChamar] = useState<PacienteAguardando | null>(null);
  const [sala, setSala] = useState('');
  const [setor, setSetor] = useState('GERAL');
  const [, setTick] = useState(0);

  // Atualizar tempos a cada 30s
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 30_000);
    return () => clearInterval(timer);
  }, []);

  // Recarregar lista
  const recarregar = useCallback(async () => {
    try {
      const res = await fetch('/api/pacientes?limite=30');
      // A lista vem do server component, vamos fazer refresh
      router.refresh();
    } catch {}
  }, [router]);

  // Chamar paciente via API
  async function chamarPaciente() {
    if (!modalChamar || !sala.trim()) {
      toast.error('Informe a sala de destino.');
      return;
    }
    setChamandoId(modalChamar.atendimentoId);
    try {
      const res = await fetch('/api/painel/chamar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          atendimentoId: modalChamar.atendimentoId,
          salaDestino: sala.trim(),
          setorPainel: setor,
        }),
      });
      const json = await res.json();
      if (!json.sucesso) {
        toast.error(json.erro ?? 'Erro ao chamar paciente.');
        return;
      }
      toast.success(`${modalChamar.nomePaciente} chamado para ${sala.trim()}!`);
      setModalChamar(null);
      setSala('');
      // O paciente continua na lista para poder ser chamado novamente
      // e aguarda a finalização da triagem para sumir.
      router.refresh();
    } catch {
      toast.error('Erro de conexão.');
    } finally {
      setChamandoId(null);
    }
  }

  return (
    <>
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        {/* Header */}
        <div className="px-4 py-3 border-b border-border bg-amber-50 dark:bg-amber-950/20 flex items-center justify-between">
          <h3 className="font-semibold text-sm text-amber-800 dark:text-amber-400 flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            Aguardando Triagem
            <span className="px-1.5 py-0.5 bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100 text-[10px] font-bold rounded-full">
              {pacientes.length}
            </span>
          </h3>
          <button onClick={recarregar} className="p-1.5 hover:bg-amber-100 dark:hover:bg-amber-900/30 rounded-lg transition-colors" title="Atualizar">
            <RefreshCw className="h-3.5 w-3.5 text-amber-600" />
          </button>
        </div>

        {/* Lista */}
        <div className="divide-y divide-border max-h-[calc(100vh-280px)] overflow-y-auto">
          {pacientes.length === 0 ? (
            <div className="p-8 text-center">
              <ClipboardList className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">Nenhum paciente aguardando triagem.</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Pacientes aparecem aqui após cadastro na recepção.</p>
            </div>
          ) : (
            pacientes.map((p) => {
              const tempoEspera = minutosDesde(p.entradaFila);
              const temAlergias = p.alergias.length > 0;
              return (
                <div key={p.atendimentoId} className="p-4 hover:bg-muted/30 transition-colors group">
                  {/* Info do paciente */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm text-foreground truncate">{p.nomePaciente}</p>
                      <p className="text-[11px] font-mono text-muted-foreground">{p.numeroAtendimento}</p>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0 ml-2">
                      <Clock className="h-3 w-3" />
                      <span className={cn(tempoEspera > 30 ? 'text-orange-500 font-semibold' : '')}>{formatarTempo(tempoEspera)}</span>
                    </div>
                  </div>

                  {/* Detalhes */}
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground mb-3">
                    <span>{format(new Date(p.dataNascimento), 'dd/MM/yyyy')}</span>
                    <span>{p.sexoBiologico.charAt(0) + p.sexoBiologico.slice(1).toLowerCase()}</span>
                    <span>{p.convenio ?? 'Particular'}</span>
                  </div>

                  {/* Alergias */}
                  {temAlergias && (
                    <div className="flex items-center gap-1.5 mb-3">
                      <AlertTriangle className="h-3 w-3 text-red-500 shrink-0" />
                      <div className="flex flex-wrap gap-1">
                        {p.alergias.map((a, i) => (
                          <span key={i} className="px-1.5 py-0.5 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-[10px] font-medium rounded">
                            {a}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Botões de ação */}
                  <div className="flex gap-2">
                    {podeChamar && (
                      <button
                        onClick={() => { setModalChamar(p); setSala(''); }}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                      >
                        <Megaphone className="h-3.5 w-3.5" />
                        Chamar
                      </button>
                    )}
                    {podeTriar && (
                      <button
                        onClick={() => router.push(`/triagem/${p.atendimentoId}`)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold bg-primary text-white hover:bg-primary/90 transition-colors"
                      >
                        <Stethoscope className="h-3.5 w-3.5" />
                        Iniciar Triagem
                        <ChevronRight className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* =============== MODAL CHAMAR PACIENTE =============== */}
      {modalChamar && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center">
                  <Megaphone className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Chamar Paciente</h3>
                  <p className="text-xs text-muted-foreground">{modalChamar.nomePaciente}</p>
                </div>
              </div>
              <button onClick={() => setModalChamar(null)} className="p-1.5 hover:bg-muted rounded-lg"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Atendimento</p>
                <p className="font-mono text-sm font-medium">{modalChamar.numeroAtendimento}</p>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Sala de destino *</label>
                <input
                  value={sala}
                  onChange={(e) => setSala(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  placeholder="Ex: Sala 01, Consultório 3"
                  autoFocus
                  onKeyDown={(e) => { if (e.key === 'Enter') chamarPaciente(); }}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Setor do painel</label>
                <select value={setor} onChange={(e) => setSetor(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-primary/30">
                  <option value="GERAL">Geral</option>
                  <option value="EMERGENCIA">Emergência</option>
                  <option value="AMBULATORIO">Ambulatório</option>
                  <option value="PEDIATRIA">Pediatria</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-border">
              <button onClick={() => setModalChamar(null)} className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted">Cancelar</button>
              <button onClick={chamarPaciente} disabled={chamandoId !== null}
                className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors">
                {chamandoId ? <><Loader2 className="h-4 w-4 animate-spin" />Chamando...</> : <><Megaphone className="h-4 w-4" />Chamar no Painel</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
