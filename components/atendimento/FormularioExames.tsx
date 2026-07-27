'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { FlaskConical, Loader2, Plus, Trash2, ClipboardList, FileUp, ExternalLink } from 'lucide-react';
import { textoCadastroMaiusculo } from '@/lib/cadastro-maiusculo';
import { cn } from '@/lib/utils';

type ItemExame = {
  id: string;
  nomeExame: string;
  codigoTuss?: string | null;
  resultado?: string | null;
  resultadoPdf?: string | null;
  realizadoEm?: string | null;
};

function ItemExameResultado({
  atendimentoId,
  item,
  onSalvo,
}: {
  atendimentoId: string;
  item: ItemExame;
  onSalvo: () => void;
}) {
  const [resultado, setResultado] = useState(item.resultado ?? '');
  const [dataHora, setDataHora] = useState(() => {
    if (!item.realizadoEm) return '';
    const d = new Date(item.realizadoEm);
    const p = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
  });
  const [salvando, setSalvando] = useState(false);
  const [pdfHora, setPdfHora] = useState(() => {
    if (!item.realizadoEm) return '';
    const d = new Date(item.realizadoEm);
    const p = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
  });
  const [enviandoPdf, setEnviandoPdf] = useState(false);

  async function salvarResultado(e: React.FormEvent) {
    e.preventDefault();
    if (resultado.trim().length < 1) {
      toast.error('Preencha o resultado.');
      return;
    }
    setSalvando(true);
    try {
      const res = await fetch(`/api/atendimento/${atendimentoId}/exames/item/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resultado: resultado.trim(),
          realizadoEm: dataHora.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!json.sucesso) {
        toast.error(json.erro ?? 'Erro ao salvar resultado.');
        return;
      }
      toast.success('Resultado registrado.');
      onSalvo();
    } catch {
      toast.error('Erro de conexão.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <li className="list-none border border-border rounded-lg p-3 bg-muted/20 space-y-2">
      <div className="font-medium text-foreground">
        {item.nomeExame}
        {item.codigoTuss ? <span className="font-mono text-xs text-muted-foreground ml-1">({item.codigoTuss})</span> : null}
      </div>
      {item.realizadoEm ? (
        <p className="text-xs text-muted-foreground">
          Último registro: {new Date(item.realizadoEm).toLocaleString('pt-BR')}
        </p>
      ) : null}
      {item.resultadoPdf ? (
        <a
          href={item.resultadoPdf}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          <ExternalLink className="h-3 w-3" />
          Abrir PDF do resultado
        </a>
      ) : null}
      <form onSubmit={salvarResultado} className="space-y-2 pt-1">
        <textarea
          value={resultado}
          onChange={(e) => setResultado(textoCadastroMaiusculo(e.target.value))}
          rows={3}
          placeholder="RESULTADO / LAUDO (TEXTO)"
          className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs"
        />
        <div className="flex flex-wrap items-end gap-2">
          <div>
            <label className="text-[10px] text-muted-foreground block">Realizado em (opcional)</label>
            <input
              type="datetime-local"
              value={dataHora}
              onChange={(e) => setDataHora(e.target.value)}
              className="border border-input rounded-md px-2 py-1 text-xs bg-background"
            />
          </div>
          <button
            type="submit"
            disabled={salvando}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-xs font-semibold disabled:opacity-50"
          >
            {salvando ? <Loader2 className="h-3 w-3 animate-spin" /> : <ClipboardList className="h-3 w-3" />}
            Salvar resultado
          </button>
        </div>
      </form>
      <div className="pt-2 border-t border-border/60 space-y-2">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Anexar PDF</span>
        <div className="flex flex-wrap items-end gap-2">
          <div>
            <label className="text-[10px] text-muted-foreground block">Realizado em (opcional)</label>
            <input
              type="datetime-local"
              value={pdfHora}
              onChange={(e) => setPdfHora(e.target.value)}
              className="border border-input rounded-md px-2 py-1 text-xs bg-background"
            />
          </div>
          <label className="inline-flex items-center gap-1 px-3 py-1.5 border border-input rounded-md text-xs font-medium cursor-pointer hover:bg-muted/40">
            <input
              type="file"
              accept="application/pdf,.pdf"
              className="sr-only"
              disabled={enviandoPdf}
              onChange={async (e) => {
                const f = e.target.files?.[0];
                e.target.value = '';
                if (!f) return;
                if (!f.name.toLowerCase().endsWith('.pdf')) {
                  toast.error('Selecione um ficheiro PDF.');
                  return;
                }
                setEnviandoPdf(true);
                try {
                  const fd = new FormData();
                  fd.append('arquivo', f);
                  if (pdfHora.trim()) fd.append('realizadoEm', pdfHora.trim());
                  const res = await fetch(`/api/atendimento/${atendimentoId}/exames/item/${item.id}/pdf`, {
                    method: 'POST',
                    body: fd,
                  });
                  const json = await res.json();
                  if (!json.sucesso) {
                    toast.error(json.erro ?? 'Erro ao enviar PDF.');
                    return;
                  }
                  toast.success('PDF anexado.');
                  onSalvo();
                } catch {
                  toast.error('Erro de conexão.');
                } finally {
                  setEnviandoPdf(false);
                }
              }}
            />
            {enviandoPdf ? <Loader2 className="h-3 w-3 animate-spin" /> : <FileUp className="h-3 w-3" />}
            Escolher PDF
          </label>
        </div>
      </div>
    </li>
  );
}

const CATEGORIAS = [
  { v: 'LABORATORIO', l: 'Laboratório' },
  { v: 'IMAGEM', l: 'Imagem' },
  { v: 'CARDIOLOGIA', l: 'Cardiologia' },
  { v: 'PROCEDIMENTO', l: 'Procedimento' },
  { v: 'OUTRO', l: 'Outro' },
] as const;

const URGENCIAS = [
  { v: 'ROTINA', l: 'Rotina' },
  { v: 'URGENTE', l: 'Urgente' },
  { v: 'EMERGENCIAL', l: 'Emergencial' },
] as const;

type ItemLinha = { nomeExame: string; codigoTuss: string; observacoes: string };

export type PrefillExamesForm = {
  categoria?: string;
  urgencia?: string;
  indicacao?: string;
  linhas?: ItemLinha[];
};

export function FormularioExames({
  atendimentoId,
  prontuarioId,
  requisicoesIniciais,
  onSalvo,
  prefill,
  ocultarHistorico = false,
  ocultarFormularioNova = false,
  onRepetirRequisicao,
}: {
  atendimentoId: string;
  prontuarioId: string;
  requisicoesIniciais: any[];
  onSalvo: () => void;
  prefill?: PrefillExamesForm;
  /** Oculta a seção de histórico (quando o painel pai exibe histórico customizado). */
  ocultarHistorico?: boolean;
  /** Oculta o formulário de nova requisição (somente leitura). */
  ocultarFormularioNova?: boolean;
  /** Exibe botão para carregar requisição anterior como nova. */
  onRepetirRequisicao?: (requisicao: any) => void;
}) {
  const [categoria, setCategoria] = useState<string>(prefill?.categoria ?? 'LABORATORIO');
  const [urgencia, setUrgencia] = useState<string>(prefill?.urgencia ?? 'ROTINA');
  const [indicacao, setIndicacao] = useState(prefill?.indicacao ?? '');
  const [linhas, setLinhas] = useState<ItemLinha[]>(
    prefill?.linhas?.length ? prefill.linhas : [{ nomeExame: '', codigoTuss: '', observacoes: '' }]
  );
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!prefill) return;
    if (prefill.categoria) setCategoria(prefill.categoria);
    if (prefill.urgencia) setUrgencia(prefill.urgencia);
    if (prefill.indicacao !== undefined) setIndicacao(prefill.indicacao);
    if (prefill.linhas?.length) setLinhas(prefill.linhas);
  }, [prefill]);

  function addLinha() {
    setLinhas((s) => [...s, { nomeExame: '', codigoTuss: '', observacoes: '' }]);
  }

  function removeLinha(i: number) {
    setLinhas((s) => s.filter((_, idx) => idx !== i));
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    const itens = linhas
      .map((l) => ({
        nomeExame: l.nomeExame.trim(),
        codigoTuss: l.codigoTuss.trim() || undefined,
        observacoes: l.observacoes.trim() || undefined,
      }))
      .filter((l) => l.nomeExame.length >= 2);
    if (itens.length === 0) {
      toast.error('Informe pelo menos um exame com nome válido.');
      return;
    }
    if (indicacao.trim().length < 5) {
      toast.error('Indicação clínica obrigatória (mín. 5 caracteres).');
      return;
    }
    setEnviando(true);
    try {
      const res = await fetch(`/api/atendimento/${atendimentoId}/exames`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prontuarioId,
          categoria,
          urgencia,
          indicacao: indicacao.trim(),
          itens,
        }),
      });
      const json = await res.json();
      if (!json.sucesso) {
        toast.error(json.erro ?? 'Erro ao solicitar exames.');
        return;
      }
      toast.success('Requisição de exames registrada.');
      setIndicacao('');
      setLinhas([{ nomeExame: '', codigoTuss: '', observacoes: '' }]);
      onSalvo();
    } catch {
      toast.error('Erro de conexão.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="space-y-8">
      {ocultarFormularioNova ? null : (
      <form onSubmit={salvar} className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <FlaskConical className="h-5 w-5 text-primary" />
          Nova requisição de exames
        </h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Categoria</label>
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="mt-1 w-full border border-input rounded-lg px-3 py-2 text-sm bg-background"
            >
              {CATEGORIAS.map((c) => (
                <option key={c.v} value={c.v}>
                  {c.l}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Urgência</label>
            <select
              value={urgencia}
              onChange={(e) => setUrgencia(e.target.value)}
              className="mt-1 w-full border border-input rounded-lg px-3 py-2 text-sm bg-background"
            >
              {URGENCIAS.map((u) => (
                <option key={u.v} value={u.v}>
                  {u.l}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="text-sm font-medium">Indicação clínica</label>
          <textarea
            value={indicacao}
            onChange={(e) => setIndicacao(textoCadastroMaiusculo(e.target.value))}
            rows={3}
            className={cn('mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm', 'focus:ring-2 focus:ring-primary/30')}
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Exames</span>
            <button type="button" onClick={addLinha} className="text-xs flex items-center gap-1 text-primary font-medium">
              <Plus className="h-3.5 w-3.5" /> Linha
            </button>
          </div>
          {linhas.map((linha, i) => (
            <div key={i} className="flex flex-wrap gap-2 items-end border border-border rounded-lg p-3">
              <input
                placeholder="Nome do exame"
                value={linha.nomeExame}
                onChange={(e) => {
                  const v = e.target.value;
                  setLinhas((s) => s.map((row, idx) => (idx === i ? { ...row, nomeExame: v } : row)));
                }}
                className="flex-1 min-w-[160px] border border-input rounded-md px-2 py-1.5 text-sm"
              />
              <input
                placeholder="TUSS (opcional)"
                value={linha.codigoTuss}
                onChange={(e) => {
                  const v = e.target.value;
                  setLinhas((s) => s.map((row, idx) => (idx === i ? { ...row, codigoTuss: v } : row)));
                }}
                className="w-28 border border-input rounded-md px-2 py-1.5 text-sm font-mono"
              />
              <input
                placeholder="Obs."
                value={linha.observacoes}
                onChange={(e) => {
                  const v = e.target.value;
                  setLinhas((s) => s.map((row, idx) => (idx === i ? { ...row, observacoes: v } : row)));
                }}
                className="flex-1 min-w-[120px] border border-input rounded-md px-2 py-1.5 text-sm"
              />
              {linhas.length > 1 && (
                <button type="button" onClick={() => removeLinha(i)} className="p-2 text-destructive" aria-label="Remover">
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          type="submit"
          disabled={enviando}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold text-sm disabled:opacity-60"
        >
          {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Salvar requisição
        </button>
      </form>
      )}

      {ocultarHistorico ? null : (
      <div>
        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Requisições anteriores
        </h4>
        {requisicoesIniciais.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma requisição cadastrada.</p>
        ) : (
          <ul className="space-y-3">
            {requisicoesIniciais.map((r: any) => (
              <li key={r.id} className="border border-border rounded-lg p-4 text-sm">
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mb-1">
                  <span className="font-semibold text-foreground">{r.categoria}</span>
                  <span>·</span>
                  <span>{r.urgencia}</span>
                  <span>·</span>
                  <span>{new Date(r.createdAt).toLocaleString('pt-BR')}</span>
                  {onRepetirRequisicao ? (
                    <button
                      type="button"
                      onClick={() => onRepetirRequisicao(r)}
                      className="ml-auto text-xs font-semibold text-primary hover:underline"
                    >
                      Carregar como nova requisição
                    </button>
                  ) : null}
                </div>
                <p className="text-xs text-foreground mb-2 whitespace-pre-wrap">{r.indicacao}</p>
                <ul className="space-y-3 pl-0">
                  {(r.itens ?? []).map((it: ItemExame) => (
                    <ItemExameResultado
                      key={`${it.id}-${it.resultado ?? ''}-${it.resultadoPdf ?? ''}-${it.realizadoEm ?? ''}`}
                      atendimentoId={atendimentoId}
                      item={it}
                      onSalvo={onSalvo}
                    />
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </div>
      )}
    </div>
  );
}
