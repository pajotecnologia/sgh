'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, Plus, X, Tag } from 'lucide-react';

interface BotaoNovoAtendimentoProps {
  pacienteId: string;
}

export function BotaoNovoAtendimento({ pacienteId }: BotaoNovoAtendimentoProps) {
  const router = useRouter();
  const [modalAberto, setModalAberto] = useState(false);
  const [loading, setLoading] = useState(false);
  const [origens, setOrigens] = useState<{id: string, descricao: string}[]>([]);
  const [origemId, setOrigemId] = useState('');
  const [carregandoOrigens, setCarregandoOrigens] = useState(false);

  useEffect(() => {
    if (modalAberto && origens.length === 0) {
      buscarOrigens();
    }
  }, [modalAberto]);

  useEffect(() => {
    if (!modalAberto) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/pacientes/${pacienteId}`);
        const json = await res.json();
        if (cancelled || !json.sucesso || !json.dados?.origemId) return;
        setOrigemId(json.dados.origemId);
      } catch {
        /* ignora */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [modalAberto, pacienteId]);

  const buscarOrigens = async () => {
    setCarregandoOrigens(true);
    try {
      const res = await fetch('/api/configuracoes/origens');
      const json = await res.json();
      if (json.sucesso) setOrigens(json.dados);
    } catch {
      toast.error('Erro ao carregar origens');
    } finally {
      setCarregandoOrigens(false);
    }
  };

  const handleCriarAtendimento = async () => {
    if (!origemId) {
      toast.error('Selecione a origem do paciente.');
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch('/api/atendimentos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ pacienteId, origemId })
      });
      
      const json = await res.json();
      
      if (!json.sucesso) {
        toast.error(json.erro ?? 'Erro ao criar atendimento.');
        return;
      }
      
      toast.success('Atendimento criado!', {
        description: 'Paciente encaminhado para a fila de Triagem.'
      });
      
      setModalAberto(false);
      router.refresh();
      
    } catch (err) {
      toast.error('Erro de conexão ao tentar criar atendimento.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setModalAberto(true)}
        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
        title="Criar novo atendimento para este paciente"
      >
        <Plus className="h-3.5 w-3.5" />
        <span>+ Atendimento</span>
      </button>

      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card w-full max-w-md rounded-xl shadow-lg border border-border overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/30">
              <h3 className="font-semibold flex items-center gap-2">
                <Plus className="h-4 w-4 text-emerald-600" />
                Novo Prontuário / Atendimento
              </h3>
              <button onClick={() => setModalAberto(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <div className="p-5 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1.5">
                  <Tag className="h-4 w-4" /> Origem do Paciente *
                </label>
                {carregandoOrigens ? (
                  <div className="p-3 text-sm text-muted-foreground bg-muted/30 rounded-lg flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Carregando origens...
                  </div>
                ) : (
                  <select 
                    value={origemId} 
                    onChange={e => setOrigemId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="">Selecione a origem...</option>
                    {origens.map(o => (
                      <option key={o.id} value={o.id}>{o.descricao}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-border bg-muted/30">
              <button onClick={() => setModalAberto(false)} className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-lg">
                Cancelar
              </button>
              <button 
                onClick={handleCriarAtendimento} 
                disabled={loading || !origemId}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 disabled:opacity-60"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirmar Abertura'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
