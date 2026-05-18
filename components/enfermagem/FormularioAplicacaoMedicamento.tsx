'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Loader2, Syringe } from 'lucide-react';
import { cn } from '@/lib/utils';

const VIAS = [
  'ORAL',
  'INTRAVENOSA',
  'INTRAMUSCULAR',
  'SUBCUTANEA',
  'TOPICA',
  'INALATORIA',
  'SUBLINGUAL',
  'RETAL',
  'OFTALMICA',
  'OTOLOGICA',
  'NASAL',
] as const;

type ViaValor = (typeof VIAS)[number];

export function FormularioAplicacaoMedicamento({
  atendimentoId,
  item,
  onAplicado,
}: {
  atendimentoId: string;
  item: {
    id: string;
    nomeMedicamento: string;
    dose: string;
    via: string;
    frequencia: string;
  };
  onAplicado: () => void;
}) {
  const [doseAplicada, setDoseAplicada] = useState(item.dose);
  const [via, setVia] = useState<ViaValor>((item.via as ViaValor) ?? 'ORAL');
  const [observacoes, setObservacoes] = useState('');
  const [cinco, setCinco] = useState({
    pacienteCerto: false,
    medicamentoCerto: false,
    doseCerta: false,
    viaCerta: false,
    horarioCerto: false,
  });
  const [enviando, setEnviando] = useState(false);

  const todosMarcados =
    cinco.pacienteCerto &&
    cinco.medicamentoCerto &&
    cinco.doseCerta &&
    cinco.viaCerta &&
    cinco.horarioCerto;

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!doseAplicada.trim()) {
      toast.error('Informe a dose aplicada.');
      return;
    }
    if (!todosMarcados) {
      toast.error('Confirme os 5 certos antes de registrar a aplicação.');
      return;
    }
    setEnviando(true);
    try {
      const res = await fetch(`/api/atendimento/${atendimentoId}/aplicacao`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemPrescricaoId: item.id,
          doseAplicada: doseAplicada.trim(),
          via,
          checklistConfirmado: {
            pacienteCerto: true,
            medicamentoCerto: true,
            doseCerta: true,
            viaCerta: true,
            horarioCerto: true,
          },
          observacoes: observacoes.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!json.sucesso) {
        toast.error(json.erro ?? 'Erro ao registrar aplicação.');
        return;
      }
      toast.success('Aplicação registrada.');
      onAplicado();
    } catch {
      toast.error('Erro de conexão.');
    } finally {
      setEnviando(false);
    }
  }

  const toggle = (k: keyof typeof cinco) => {
    setCinco((s) => ({ ...s, [k]: !s[k] }));
  };

  return (
    <form onSubmit={salvar} className="border border-border rounded-xl p-4 space-y-3 bg-card">
      <div className="flex items-start gap-2">
        <Syringe className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div className="min-w-0">
          <p className="font-semibold text-sm">{item.nomeMedicamento}</p>
          <p className="text-xs text-muted-foreground">
            Prescrito: {item.dose} — {item.via} — {item.frequencia}
          </p>
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium">Dose aplicada</label>
          <input
            value={doseAplicada}
            onChange={(e) => setDoseAplicada(e.target.value)}
            className="mt-0.5 w-full border border-input rounded-lg px-2 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-medium">Via</label>
          <select
            value={via}
            onChange={(e) => setVia(e.target.value as ViaValor)}
            className="mt-0.5 w-full border border-input rounded-lg px-2 py-1.5 text-sm bg-background"
          >
            {VIAS.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>
      </div>
      <p className="text-[11px] text-muted-foreground leading-snug">
        É possível registrar <strong className="text-foreground">várias aplicações</strong> no mesmo item (ex.: doses
        repetidas). O status do item passa a &quot;Aplicado&quot; na primeira administração; as seguintes ficam só no
        histórico de aplicações.
      </p>
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Os 5 certos</p>
        <div
          className="grid grid-cols-5 gap-1 sm:gap-2 rounded-lg border border-border bg-muted/30 p-2 sm:p-2.5"
          role="group"
          aria-label="Confirmação dos cinco certos da administração"
        >
          {(
            [
              ['pacienteCerto', 'Paciente', 'Paciente certo'],
              ['medicamentoCerto', 'Medic.', 'Medicamento certo'],
              ['doseCerta', 'Dose', 'Dose certa'],
              ['viaCerta', 'Via', 'Via certa'],
              ['horarioCerto', 'Horário', 'Horário certo'],
            ] as const
          ).map(([key, curto, tituloCompleto]) => (
            <label
              key={key}
              title={tituloCompleto}
              className="flex flex-col items-center justify-start gap-1.5 cursor-pointer rounded-md px-0.5 py-1 hover:bg-muted/80 min-w-0"
            >
              <input
                type="checkbox"
                checked={cinco[key]}
                onChange={() => toggle(key)}
                className="h-4 w-4 shrink-0 rounded border-input"
                aria-label={tituloCompleto}
              />
              <span className="text-[9px] sm:text-[11px] font-medium text-center leading-tight text-foreground select-none">
                {curto}
              </span>
            </label>
          ))}
        </div>
      </div>
      <div>
        <label className="text-xs font-medium">Observações (opcional)</label>
        <input
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          className={cn('mt-0.5 w-full border border-input rounded-lg px-2 py-1.5 text-sm')}
        />
      </div>
      <button
        type="submit"
        disabled={enviando || !todosMarcados}
        className="w-full sm:w-auto inline-flex justify-center items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg font-semibold text-sm disabled:opacity-50"
      >
        {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Registrar aplicação
      </button>
    </form>
  );
}
