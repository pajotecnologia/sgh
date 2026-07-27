'use client';

import { useState } from 'react';
import { FileDown, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { ModalRelatorioPdf } from '@/components/relatorios/ModalRelatorioPdf'

function hojeIsoData(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function FormularioRelatorioAtendimentosDia() {
  const [data, setData] = useState(hojeIsoData);
  const [gerando, setGerando] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)

  async function baixar() {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) {
      toast.error('Use a data no formato AAAA-MM-DD.');
      return;
    }
    setGerando(true);
    try {
      const res = await fetch(`/api/relatorios/atendimentos-dia?data=${encodeURIComponent(data)}`);
      if (res.headers.get('content-type')?.includes('application/json')) {
        const j = await res.json();
        toast.error(j.erro ?? 'Não foi possível gerar o PDF.');
        return;
      }
      if (!res.ok) {
        toast.error('Erro ao gerar relatório.');
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setPdfUrl(url)
      toast.success('Relatório gerado.')
    } catch {
      toast.error('Erro de conexão.');
    } finally {
      setGerando(false);
    }
  }

  return (
    <>
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Atendimentos do dia</h2>
        <p className="text-sm text-muted-foreground">
          Lista todos os atendimentos criados na data escolhida (horário local do servidor), com número, paciente, status,
          setor e sala.
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="rel-data" className="text-xs font-medium text-muted-foreground block mb-1">
              Data
            </label>
            <input
              id="rel-data"
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
              className="border border-input rounded-lg px-3 py-2 text-sm bg-background"
            />
          </div>
          <button
            type="button"
            onClick={baixar}
            disabled={gerando}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-60"
          >
            {gerando ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
            Gerar / imprimir
          </button>
        </div>
      </div>

      {pdfUrl ? (
        <ModalRelatorioPdf
          aberto={Boolean(pdfUrl)}
          onClose={() => {
            URL.revokeObjectURL(pdfUrl)
            setPdfUrl(null)
          }}
          pdfUrl={pdfUrl}
          nomeArquivo={`atendimentos-${data}.pdf`}
          titulo="Relatório — Atendimentos do dia"
        />
      ) : null}
    </>
  );
}
