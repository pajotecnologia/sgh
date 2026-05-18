'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Share2, Loader2 } from 'lucide-react';
import { textoCadastroMaiusculo } from '@/lib/cadastro-maiusculo';
import { cn } from '@/lib/utils';

const TIPOS = [
  { v: 'INTERNO', l: 'Interno (especialidade)' },
  { v: 'EXTERNO', l: 'Externo' },
  { v: 'INTERNACAO', l: 'Internação' },
] as const;

export function FormularioEncaminhamento({
  atendimentoId,
  prontuarioId,
  encaminhamentosIniciais,
  onSalvo,
}: {
  atendimentoId: string;
  prontuarioId: string;
  encaminhamentosIniciais: any[];
  onSalvo: () => void;
}) {
  const [tipo, setTipo] = useState<string>('INTERNO');
  const [especialidade, setEspecialidade] = useState('');
  const [prioridade, setPrioridade] = useState<string>('');
  const [resumo, setResumo] = useState('');
  const [justificativa, setJustificativa] = useState('');
  const [tipoLeito, setTipoLeito] = useState('');
  const [setor, setSetor] = useState('');
  const [cidInternacao, setCidInternacao] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (especialidade.trim().length < 2) {
      toast.error('Informe a especialidade ou destino.');
      return;
    }
    if ((tipo === 'EXTERNO' || tipo === 'INTERNACAO') && justificativa.trim().length < 5) {
      toast.error('Justificativa obrigatória para encaminhamento externo ou internação.');
      return;
    }
    setEnviando(true);
    try {
      const res = await fetch(`/api/atendimento/${atendimentoId}/encaminhamento`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prontuarioId,
          tipo,
          especialidade: especialidade.trim(),
          prioridade: prioridade || null,
          resumoClinco: resumo.trim() || undefined,
          justificativa: justificativa.trim() || undefined,
          tipoLeito: tipoLeito.trim() || undefined,
          setor: setor.trim() || undefined,
          cidInternacao: cidInternacao.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!json.sucesso) {
        toast.error(json.erro ?? 'Erro ao registrar encaminhamento.');
        return;
      }
      toast.success('Encaminhamento registrado.');
      setEspecialidade('');
      setPrioridade('');
      setResumo('');
      setJustificativa('');
      setTipoLeito('');
      setSetor('');
      setCidInternacao('');
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
          <Share2 className="h-5 w-5 text-primary" />
          Novo encaminhamento
        </h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Tipo</label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="mt-1 w-full border border-input rounded-lg px-3 py-2 text-sm bg-background"
            >
              {TIPOS.map((t) => (
                <option key={t.v} value={t.v}>
                  {t.l}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Prioridade</label>
            <select
              value={prioridade}
              onChange={(e) => setPrioridade(e.target.value)}
              className="mt-1 w-full border border-input rounded-lg px-3 py-2 text-sm bg-background"
            >
              <option value="">—</option>
              <option value="Alta">Alta</option>
              <option value="Média">Média</option>
              <option value="Baixa">Baixa</option>
            </select>
          </div>
        </div>
        <div>
          <label className="text-sm font-medium">Especialidade / destino</label>
          <input
            value={especialidade}
            onChange={(e) => setEspecialidade(textoCadastroMaiusculo(e.target.value))}
            className={cn('mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm')}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Resumo clínico</label>
          <textarea
            value={resumo}
            onChange={(e) => setResumo(textoCadastroMaiusculo(e.target.value))}
            rows={3}
            className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Justificativa {tipo !== 'INTERNO' ? '(obrigatória)' : '(opcional)'}</label>
          <textarea
            value={justificativa}
            onChange={(e) => setJustificativa(textoCadastroMaiusculo(e.target.value))}
            rows={2}
            className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm"
          />
        </div>
        {tipo === 'INTERNACAO' && (
          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <label className="text-sm font-medium">Tipo de leito</label>
              <input value={tipoLeito} onChange={(e) => setTipoLeito(textoCadastroMaiusculo(e.target.value))} className="mt-1 w-full border rounded-lg px-2 py-1.5 text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium">Setor</label>
              <input value={setor} onChange={(e) => setSetor(textoCadastroMaiusculo(e.target.value))} className="mt-1 w-full border rounded-lg px-2 py-1.5 text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium">CID internação</label>
              <input value={cidInternacao} onChange={(e) => setCidInternacao(textoCadastroMaiusculo(e.target.value))} className="mt-1 w-full border rounded-lg px-2 py-1.5 text-sm font-mono" />
            </div>
          </div>
        )}
        <button
          type="submit"
          disabled={enviando}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold text-sm disabled:opacity-60"
        >
          {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Registrar
        </button>
      </form>

      <div>
        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Encaminhamentos registrados
        </h4>
        {encaminhamentosIniciais.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum encaminhamento.</p>
        ) : (
          <ul className="space-y-3">
            {encaminhamentosIniciais.map((en: any) => (
              <li key={en.id} className="border border-border rounded-lg p-4 text-sm">
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mb-1">
                  <span className="font-semibold text-foreground">{en.tipo}</span>
                  <span>·</span>
                  <span>{en.especialidade}</span>
                  {en.prioridade && (
                    <>
                      <span>·</span>
                      <span>Prioridade {en.prioridade}</span>
                    </>
                  )}
                  <span>·</span>
                  <span>{new Date(en.createdAt).toLocaleString('pt-BR')}</span>
                </div>
                {en.resumoClinco && <p className="text-xs whitespace-pre-wrap mb-1">{en.resumoClinco}</p>}
                {en.justificativa && <p className="text-xs text-muted-foreground whitespace-pre-wrap">Just.: {en.justificativa}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
