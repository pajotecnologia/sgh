'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Loader2, Syringe } from 'lucide-react';
import { cn } from '@/lib/utils';

const VIAS = [
  'ORAL', 'INTRAVENOSA', 'INTRAMUSCULAR', 'SUBCUTANEA',
  'TOPICA', 'INALATORIA', 'SUBLINGUAL', 'RETAL', 'OFTALMICA', 'OTOLOGICA', 'NASAL',
] as const;

type ItemPendente = {
  id: string;
  nomeMedicamento: string;
  dose: string;
  via: string;
  frequencia: string;
  status: string;
};

export function PainelAplicacaoMedicamentos({
  atendimentoId,
  itensPendentes,
  onAplicado,
}: {
  atendimentoId: string;
  itensPendentes: ItemPendente[];
  onAplicado: () => void;
}) {
  const [itemId, setItemId] = useState<string | null>(null);
  const [doseAplicada, setDoseAplicada] = useState('');
  const [via, setVia] = useState<string>('ORAL');
  const [obs, setObs] = useState('');
  const [c1, setC1] = useState(false);
  const [c2, setC2] = useState(false);
  const [c3, setC3] = useState(false);
  const [c4, setC4] = useState(false);
  const [c5, setC5] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const selecionado = itensPendentes.find((i) => i.id === itemId);

  async function aplicar(e: React.FormEvent) {
    e.preventDefault();
    if (!itemId) {
      toast.error('Selecione o medicamento aplicado.');
      return;
    }
    if (!doseAplicada.trim()) {
      toast.error('Informe a dose aplicada.');
      return;
    }
    if (!c1 || !c2 || !c3 || !c4 || !c5) {
      toast.error('Confirme os 5 certos antes de registrar.');
      return;
    }
    setEnviando(true);
    try {
      const res = await fetch(`/api/atendimento/${atendimentoId}/aplicacao`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemPrescricaoId: itemId,
          doseAplicada: doseAplicada.trim(),
          via,
          checklistConfirmado: {
            pacienteCerto: true,
            medicamentoCerto: true,
            doseCerta: true,
            viaCerta: true,
            horarioCerto: true,
          },
          observacoes: obs.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!json.sucesso) {
        toast.error(json.erro ?? 'Erro ao registrar aplicação.');
        return;
      }
      toast.success('Aplicação registrada.');
      setItemId(null);
      setDoseAplicada('');
      setObs('');
      setC1(false);
      setC2(false);
      setC3(false);
      setC4(false);
      setC5(false);
      onAplicado();
    } catch {
      toast.error('Erro de conexão.');
    } finally {
      setEnviando(false);
    }
  }

  if (itensPendentes.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-6 text-center border border-dashed rounded-xl">
        Nenhum item de prescrição pendente de aplicação.
      </p>
    );
  }

  return (
    <form onSubmit={aplicar} className="bg-card border border-border rounded-xl p-6 space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Syringe className="h-5 w-5 text-primary" />
        Registrar aplicação
      </h3>
      <div>
        <label className="text-sm font-medium">Medicamento (item da prescrição)</label>
        <select
          value={itemId ?? ''}
          onChange={(e) => {
            const id = e.target.value;
            setItemId(id || null);
            const it = itensPendentes.find((x) => x.id === id);
            if (it) {
              setDoseAplicada(it.dose);
              setVia(it.via);
            }
          }}
          className="mt-1 w-full border border-input rounded-lg px-3 py-2 text-sm bg-background"
        >
          <option value="">Selecione…</option>
          {itensPendentes.map((i) => (
            <option key={i.id} value={i.id}>
              {i.nomeMedicamento} — {i.dose} ({i.via})
            </option>
          ))}
        </select>
      </div>
      {selecionado && (
        <p className="text-xs text-muted-foreground">
          Frequência prescrita: <strong>{selecionado.frequencia}</strong>
        </p>
      )}
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium">Dose aplicada</label>
          <input
            value={doseAplicada}
            onChange={(e) => setDoseAplicada(e.target.value)}
            className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Via</label>
          <select value={via} onChange={(e) => setVia(e.target.value)} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm bg-background">
            {VIAS.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="text-sm font-medium">Observações</label>
        <input value={obs} onChange={(e) => setObs(e.target.value)} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" />
      </div>
      <fieldset className="border border-border rounded-lg p-3">
        <legend className="text-xs font-semibold px-1 text-muted-foreground uppercase tracking-wide">
          5 certos
        </legend>
        <div
          className="grid grid-cols-5 gap-1 sm:gap-2 mt-2"
          role="group"
          aria-label="Confirmação dos cinco certos da administração"
        >
          <label
            title="Paciente certo"
            className="flex flex-col items-center gap-1.5 cursor-pointer rounded-md px-0.5 py-1 hover:bg-muted/60 min-w-0 text-center"
          >
            <input
              type="checkbox"
              checked={c1}
              onChange={(e) => setC1(e.target.checked)}
              className="h-4 w-4 shrink-0"
              aria-label="Paciente certo"
            />
            <span className="text-[9px] sm:text-[11px] font-medium leading-tight">Paciente</span>
          </label>
          <label
            title="Medicamento certo"
            className="flex flex-col items-center gap-1.5 cursor-pointer rounded-md px-0.5 py-1 hover:bg-muted/60 min-w-0 text-center"
          >
            <input
              type="checkbox"
              checked={c2}
              onChange={(e) => setC2(e.target.checked)}
              className="h-4 w-4 shrink-0"
              aria-label="Medicamento certo"
            />
            <span className="text-[9px] sm:text-[11px] font-medium leading-tight">Medic.</span>
          </label>
          <label
            title="Dose certa"
            className="flex flex-col items-center gap-1.5 cursor-pointer rounded-md px-0.5 py-1 hover:bg-muted/60 min-w-0 text-center"
          >
            <input
              type="checkbox"
              checked={c3}
              onChange={(e) => setC3(e.target.checked)}
              className="h-4 w-4 shrink-0"
              aria-label="Dose certa"
            />
            <span className="text-[9px] sm:text-[11px] font-medium leading-tight">Dose</span>
          </label>
          <label
            title="Via certa"
            className="flex flex-col items-center gap-1.5 cursor-pointer rounded-md px-0.5 py-1 hover:bg-muted/60 min-w-0 text-center"
          >
            <input
              type="checkbox"
              checked={c4}
              onChange={(e) => setC4(e.target.checked)}
              className="h-4 w-4 shrink-0"
              aria-label="Via certa"
            />
            <span className="text-[9px] sm:text-[11px] font-medium leading-tight">Via</span>
          </label>
          <label
            title="Horário certo"
            className="flex flex-col items-center gap-1.5 cursor-pointer rounded-md px-0.5 py-1 hover:bg-muted/60 min-w-0 text-center"
          >
            <input
              type="checkbox"
              checked={c5}
              onChange={(e) => setC5(e.target.checked)}
              className="h-4 w-4 shrink-0"
              aria-label="Horário certo"
            />
            <span className="text-[9px] sm:text-[11px] font-medium leading-tight">Horário</span>
          </label>
        </div>
      </fieldset>
      <button
        type="submit"
        disabled={enviando}
        className={cn(
          'inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm',
          'bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60'
        )}
      >
        {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Confirmar aplicação
      </button>
    </form>
  );
}
