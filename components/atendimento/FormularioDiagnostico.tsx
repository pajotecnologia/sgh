'use client';
// components/atendimento/FormularioDiagnostico.tsx
// Diagnósticos com busca CID-10 autocomplete

import { useState } from 'react';
import { toast } from 'sonner';
import { Trash2, Star, StarOff, Loader2, Plus } from 'lucide-react';
import { BuscaCid10 } from './BuscaCid10';
import { cn } from '@/lib/utils';

interface Diagnostico {
  id: string;
  codigoCid: string;
  descricaoCid: string;
  hipotese?: string | null;
  principal: boolean;
}

interface FormularioDiagnosticoProps {
  atendimentoId: string;
  prontuarioId: string;
  diagnosticosIniciais?: Diagnostico[];
}

export function FormularioDiagnostico({
  atendimentoId,
  prontuarioId,
  diagnosticosIniciais = [],
}: FormularioDiagnosticoProps) {
  const [diagnosticos, setDiagnosticos] = useState<Diagnostico[]>(diagnosticosIniciais);
  const [codigoCid, setCodigoCid] = useState('');
  const [descricaoCid, setDescricaoCid] = useState('');
  const [hipoteseTemp, setHipoteseTemp] = useState('');
  const [ePrincipal, setEPrincipal] = useState(diagnosticosIniciais.length === 0);
  const [salvando, setSalvando] = useState(false);

  async function adicionarDiagnostico() {
    const codigo = codigoCid.trim().toUpperCase();
    const descricao = descricaoCid.trim();

    if (codigo.length < 3) {
      toast.error('Informe o código CID (mín. 3 caracteres).');
      return;
    }
    if (descricao.length < 2) {
      toast.error('Informe a descrição do diagnóstico.');
      return;
    }

    setSalvando(true);
    try {
      const res = await fetch(`/api/atendimento/${atendimentoId}/diagnostico`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prontuarioId,
          codigoCid: codigo,
          descricaoCid: descricao,
          hipotese: hipoteseTemp,
          principal: ePrincipal,
        }),
      });
      const json = await res.json();
      if (!json.sucesso) { toast.error(json.erro); return; }

      const novo: Diagnostico = json.dados;

      // Se for principal, atualizar localmente os outros
      setDiagnosticos((prev) => [
        ...prev.map((d) => ePrincipal ? { ...d, principal: false } : d),
        novo,
      ]);

      // Resetar
      setCodigoCid('');
      setDescricaoCid('');
      setHipoteseTemp('');
      setEPrincipal(false);
      toast.success(`CID ${codigo} adicionado!`);
    } catch {
      toast.error('Erro ao adicionar diagnóstico.');
    } finally {
      setSalvando(false);
    }
  }

  async function removerDiagnostico(id: string) {
    try {
      const res = await fetch(`/api/atendimento/${atendimentoId}/diagnostico?id=${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.sucesso) {
        setDiagnosticos((prev) => prev.filter((d) => d.id !== id));
        toast.success('Diagnóstico removido.');
      }
    } catch {
      toast.error('Erro ao remover diagnóstico.');
    }
  }

  return (
    <div className="space-y-5">
      {/* Lista de diagnósticos adicionados */}
      {diagnosticos.length > 0 && (
        <div className="space-y-2">
          {diagnosticos.map((d) => (
            <div
              key={d.id}
              className={cn(
                'flex items-start gap-3 p-4 rounded-xl border transition-all',
                d.principal
                  ? 'border-primary/40 bg-primary/5'
                  : 'border-border bg-muted/20'
              )}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-mono text-sm font-bold text-primary">{d.codigoCid}</span>
                  {d.principal && (
                    <span className="px-1.5 py-0.5 bg-primary text-white text-[10px] rounded-full font-medium">
                      Principal
                    </span>
                  )}
                </div>
                <p className="text-sm text-foreground">{d.descricaoCid}</p>
                {d.hipotese && (
                  <p className="text-xs text-muted-foreground mt-1 italic">Hipótese: {d.hipotese}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => removerDiagnostico(d.id)}
                className="text-muted-foreground hover:text-destructive transition-colors shrink-0 p-1"
                aria-label="Remover diagnóstico"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Adicionar novo diagnóstico */}
      <div className="bg-card border border-dashed border-border rounded-xl p-5 space-y-3">
        <h4 className="text-sm font-semibold text-muted-foreground">Adicionar Diagnóstico</h4>

        {/* Busca CID-10 — preenche os campos abaixo, que continuam editáveis */}
        <BuscaCid10
          onSelecionar={(cid) => {
            setCodigoCid(cid.codigo);
            setDescricaoCid(cid.descricao);
          }}
          placeholder="Buscar CID-10 por código ou descrição..."
        />

        {/* Código + descrição (digitáveis manualmente) */}
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            value={codigoCid}
            onChange={(e) => setCodigoCid(e.target.value.toUpperCase())}
            placeholder="Código CID (ex.: I10)"
            className="w-full sm:w-40 px-3.5 py-2.5 border border-input rounded-lg bg-background text-sm font-mono outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            aria-label="Código CID"
          />
          <input
            value={descricaoCid}
            onChange={(e) => setDescricaoCid(e.target.value)}
            placeholder="Descrição do diagnóstico..."
            className="flex-1 px-3.5 py-2.5 border border-input rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            aria-label="Descrição do diagnóstico"
          />
        </div>

        {/* Hipótese diagnóstica */}
        <textarea
          value={hipoteseTemp}
          onChange={(e) => setHipoteseTemp(e.target.value)}
          placeholder="Hipótese diagnóstica / texto do médico (opcional)..."
          rows={2}
          className="w-full px-3.5 py-2.5 border border-input rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
        />

        {/* Flags */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setEPrincipal(!ePrincipal)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all',
              ePrincipal ? 'border-yellow-400 bg-yellow-50 text-yellow-700' : 'border-border hover:bg-muted'
            )}
          >
            {ePrincipal ? <Star className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" /> : <StarOff className="h-3.5 w-3.5" />}
            Diagnóstico principal
          </button>

          <button
            type="button"
            onClick={adicionarDiagnostico}
            disabled={codigoCid.trim().length < 3 || descricaoCid.trim().length < 2 || salvando}
            id="btn-adicionar-diagnostico"
            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {salvando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Adicionar
          </button>
        </div>
      </div>
    </div>
  );
}
