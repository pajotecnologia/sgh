'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Loader2, NotebookPen } from 'lucide-react';
import { textoCadastroMaiusculo } from '@/lib/cadastro-maiusculo';
import { cn } from '@/lib/utils';

interface EvolucaoItem {
  id: string;
  conteudo: string;
  template: string | null;
  registradoEm: string;
  autor: { nome: string; crm: string | null };
}

export function FormularioEvolucao({
  atendimentoId,
  prontuarioId,
  evolucoesIniciais,
  onSalvo,
}: {
  atendimentoId: string;
  prontuarioId: string;
  evolucoesIniciais: EvolucaoItem[];
  onSalvo: () => void;
}) {
  const [conteudo, setConteudo] = useState('');
  const [template, setTemplate] = useState<'LIVRE' | 'SOAP'>('LIVRE');
  const [enviando, setEnviando] = useState(false);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (conteudo.trim().length < 10) {
      toast.error('Descreva a evolução (mínimo 10 caracteres).');
      return;
    }
    setEnviando(true);
    try {
      const res = await fetch(`/api/atendimento/${atendimentoId}/evolucao`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prontuarioId, conteudo: conteudo.trim(), template }),
      });
      const json = await res.json();
      if (!json.sucesso) {
        toast.error(json.erro ?? 'Erro ao salvar evolução.');
        return;
      }
      toast.success('Evolução registrada.');
      setConteudo('');
      onSalvo();
    } catch {
      toast.error('Erro de conexão.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="space-y-8">
      <form onSubmit={salvar} className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <NotebookPen className="h-5 w-5 text-primary" />
          Nova evolução
        </h3>
        <div className="flex gap-4 items-center">
          <label className="text-sm font-medium">Modelo</label>
          <select
            value={template}
            onChange={(e) => setTemplate(e.target.value as 'LIVRE' | 'SOAP')}
            className="border border-input rounded-lg px-3 py-2 text-sm bg-background"
          >
            <option value="LIVRE">Texto livre</option>
            <option value="SOAP">SOAP</option>
          </select>
        </div>
        <textarea
          value={conteudo}
          onChange={(e) => setConteudo(textoCadastroMaiusculo(e.target.value))}
          rows={10}
          placeholder="S — O — A — P (SE SOAP) OU EVOLUÇÃO CLÍNICA DETALHADA…"
          className={cn(
            'w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none',
            'focus:ring-2 focus:ring-primary/30 focus:border-primary min-h-[200px]'
          )}
        />
        <button
          type="submit"
          disabled={enviando}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold text-sm disabled:opacity-60"
        >
          {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Registrar evolução
        </button>
      </form>

      <div>
        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Histórico (imutável)
        </h4>
        {evolucoesIniciais.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma evolução registrada ainda.</p>
        ) : (
          <ul className="space-y-4">
            {evolucoesIniciais.map((ev) => (
              <li key={ev.id} className="border border-border rounded-lg p-4 bg-muted/20">
                <div className="flex flex-wrap justify-between gap-2 text-xs text-muted-foreground mb-2">
                  <span>
                    {ev.autor.nome}
                    {ev.autor.crm ? ` — CRM ${ev.autor.crm}` : ''}
                  </span>
                  <span>{new Date(ev.registradoEm).toLocaleString('pt-BR')}</span>
                  {ev.template && <span className="font-medium text-foreground">{ev.template}</span>}
                </div>
                <p className="text-sm whitespace-pre-wrap text-foreground">{ev.conteudo}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
