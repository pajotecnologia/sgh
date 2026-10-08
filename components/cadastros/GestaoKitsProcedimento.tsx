'use client';
// components/cadastros/GestaoKitsProcedimento.tsx
// Gerenciamento e configuração de kits automáticos de materiais e procedimentos

import { useState, useMemo } from 'react';
import {
  Boxes,
  Plus,
  Search,
  CheckCircle2,
  Syringe,
  Bandage,
  Layers,
  Sparkles,
  Trash2,
  Edit2,
  RefreshCw,
  Package,
  AlertCircle,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { VIAS_ADMINISTRACAO, labelVia } from '@/lib/prescricao-ui';

export interface KitItemData {
  id?: string;
  descricaoItem: string;
  quantidadePadrao: number;
  unidade: string;
  obrigatorio?: boolean;
}

export interface KitData {
  id: string;
  codigo?: string | null;
  nome: string;
  descricao?: string | null;
  tipoVinculo: 'VIA_ADMINISTRACAO' | 'PROCEDIMENTO' | string;
  viaAdministracao?: string | null;
  procedimentoNome?: string | null;
  ativo: boolean;
  itens: KitItemData[];
}

interface GestaoKitsProcedimentoProps {
  kitsIniciais: KitData[];
}

export function GestaoKitsProcedimento({ kitsIniciais }: GestaoKitsProcedimentoProps) {
  const [kits, setKits] = useState<KitData[]>(kitsIniciais);
  const [busca, setBusca] = useState('');
  const [abaFiltro, setAbaFiltro] = useState<'TODOS' | 'VIA_ADMINISTRACAO' | 'PROCEDIMENTO'>('TODOS');
  const [expandidos, setExpandidos] = useState<Record<string, boolean>>({});
  const [carregando, setCarregando] = useState(false);

  // Modal Novo / Edição
  const [modalAberto, setModalAberto] = useState(false);
  const [kitEmEdicao, setKitEmEdicao] = useState<KitData | null>(null);
  const [formNome, setFormNome] = useState('');
  const [formCodigo, setFormCodigo] = useState('');
  const [formDescricao, setFormDescricao] = useState('');
  const [formTipoVinculo, setFormTipoVinculo] = useState<'VIA_ADMINISTRACAO' | 'PROCEDIMENTO'>('PROCEDIMENTO');
  const [formVia, setFormVia] = useState('INTRAVENOSA');
  const [formProcedimento, setFormProcedimento] = useState('');
  const [formItens, setFormItens] = useState<KitItemData[]>([
    { descricaoItem: '', quantidadePadrao: 1, unidade: 'UN', obrigatorio: true },
  ]);

  const kitsFiltrados = useMemo(() => {
    return kits.filter((k) => {
      const matchAba = abaFiltro === 'TODOS' || k.tipoVinculo === abaFiltro;
      if (!matchAba) return false;

      if (!busca.trim()) return true;
      const b = busca.toLowerCase();
      return (
        k.nome.toLowerCase().includes(b) ||
        (k.codigo && k.codigo.toLowerCase().includes(b)) ||
        (k.descricao && k.descricao.toLowerCase().includes(b)) ||
        (k.procedimentoNome && k.procedimentoNome.toLowerCase().includes(b)) ||
        k.itens.some((it) => it.descricaoItem.toLowerCase().includes(b))
      );
    });
  }, [kits, abaFiltro, busca]);

  const toggleExpandir = (id: string) => {
    setExpandidos((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const expandirTodos = () => {
    const next: Record<string, boolean> = {};
    kitsFiltrados.forEach((k) => {
      next[k.id] = true;
    });
    setExpandidos(next);
  };

  const recolherTodos = () => {
    setExpandidos({});
  };

  const recarregarKits = async () => {
    setCarregando(true);
    try {
      const res = await fetch('/api/farmacia/kits?ativo=false');
      const json = await res.json();
      if (json.sucesso) {
        setKits(json.dados);
      }
    } catch {
      toast.error('Erro ao recarregar kits.');
    } finally {
      setCarregando(false);
    }
  };

  const restaurarPadroes = async () => {
    if (!confirm('Deseja restaurar e garantir os kits hospitalares padrão do sistema?')) return;
    setCarregando(true);
    try {
      const res = await fetch('/api/farmacia/kits/restaurar-padroes', { method: 'POST' });
      const json = await res.json();
      if (json.sucesso) {
        toast.success(json.mensagem || 'Kits padrão restaurados com sucesso!');
        await recarregarKits();
      } else {
        toast.error(json.erro || 'Erro ao restaurar kits.');
      }
    } catch {
      toast.error('Erro de conexão ao restaurar kits.');
    } finally {
      setCarregando(false);
    }
  };

  const abrirModalNovo = () => {
    setKitEmEdicao(null);
    setFormNome('');
    setFormCodigo('');
    setFormDescricao('');
    setFormTipoVinculo('PROCEDIMENTO');
    setFormVia('INTRAVENOSA');
    setFormProcedimento('');
    setFormItens([{ descricaoItem: '', quantidadePadrao: 1, unidade: 'UN', obrigatorio: true }]);
    setModalAberto(true);
  };

  const abrirModalEditar = (kit: KitData) => {
    setKitEmEdicao(kit);
    setFormNome(kit.nome);
    setFormCodigo(kit.codigo ?? '');
    setFormDescricao(kit.descricao ?? '');
    setFormTipoVinculo(kit.tipoVinculo === 'VIA_ADMINISTRACAO' ? 'VIA_ADMINISTRACAO' : 'PROCEDIMENTO');
    setFormVia(kit.viaAdministracao ?? 'INTRAVENOSA');
    setFormProcedimento(kit.procedimentoNome ?? '');
    setFormItens(
      kit.itens.length > 0
        ? kit.itens.map((it) => ({ ...it }))
        : [{ descricaoItem: '', quantidadePadrao: 1, unidade: 'UN', obrigatorio: true }]
    );
    setModalAberto(true);
  };

  const adicionarLinhaItem = () => {
    setFormItens((prev) => [
      ...prev,
      { descricaoItem: '', quantidadePadrao: 1, unidade: 'UN', obrigatorio: true },
    ]);
  };

  const removerLinhaItem = (idx: number) => {
    if (formItens.length <= 1) {
      toast.warning('O kit precisa ter ao menos 1 item.');
      return;
    }
    setFormItens((prev) => prev.filter((_, i) => i !== idx));
  };

  const atualizarLinhaItem = (idx: number, campo: keyof KitItemData, valor: any) => {
    setFormItens((prev) => {
      const copia = [...prev];
      copia[idx] = { ...copia[idx], [campo]: valor };
      return copia;
    });
  };

  const salvarKit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formNome.trim()) {
      toast.error('Informe o nome do kit.');
      return;
    }

    const itensValidos = formItens.filter((it) => it.descricaoItem.trim().length > 0);
    if (itensValidos.length === 0) {
      toast.error('Informe ao menos 1 item com descrição para o kit.');
      return;
    }

    const payload = {
      nome: formNome.trim(),
      codigo: formCodigo.trim() || undefined,
      descricao: formDescricao.trim() || undefined,
      tipoVinculo: formTipoVinculo,
      viaAdministracao: formTipoVinculo === 'VIA_ADMINISTRACAO' ? formVia : null,
      procedimentoNome: formTipoVinculo === 'PROCEDIMENTO' ? formProcedimento.trim() || formNome.trim() : null,
      ativo: true,
      itens: itensValidos.map((it) => ({
        descricaoItem: it.descricaoItem.trim(),
        quantidadePadrao: Number(it.quantidadePadrao) || 1,
        unidade: it.unidade.trim() || 'UN',
        obrigatorio: it.obrigatorio ?? true,
      })),
    };

    setCarregando(true);
    try {
      const url = kitEmEdicao ? `/api/farmacia/kits/${kitEmEdicao.id}` : '/api/farmacia/kits';
      const method = kitEmEdicao ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!json.sucesso) {
        toast.error(json.erro || 'Erro ao salvar kit.');
        return;
      }

      toast.success(kitEmEdicao ? 'Kit atualizado com sucesso!' : 'Kit cadastrado com sucesso!');
      setModalAberto(false);
      await recarregarKits();
    } catch {
      toast.error('Erro de conexão ao salvar kit.');
    } finally {
      setCarregando(false);
    }
  };

  const excluirKit = async (id: string, nome: string) => {
    if (!confirm(`Deseja realmente excluir o kit "${nome}"?`)) return;

    setCarregando(true);
    try {
      const res = await fetch(`/api/farmacia/kits/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.sucesso) {
        toast.success('Kit excluído com sucesso.');
        setKits((prev) => prev.filter((k) => k.id !== id));
      } else {
        toast.error(json.erro || 'Erro ao excluir kit.');
      }
    } catch {
      toast.error('Erro de conexão ao excluir.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Barra de Ações & Filtros */}
      <div className="bg-card border border-border p-4 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[260px]">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome, via, procedimento ou insumo..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
          </div>

          <div className="flex items-center bg-muted/60 p-1 rounded-xl border border-border text-xs">
            <button
              type="button"
              onClick={() => setAbaFiltro('TODOS')}
              className={cn(
                'px-3 py-1.5 rounded-lg font-medium transition-all',
                abaFiltro === 'TODOS' ? 'bg-background shadow-xs text-primary font-bold' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Todos ({kits.length})
            </button>
            <button
              type="button"
              onClick={() => setAbaFiltro('VIA_ADMINISTRACAO')}
              className={cn(
                'px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5',
                abaFiltro === 'VIA_ADMINISTRACAO' ? 'bg-background shadow-xs text-primary font-bold' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Syringe className="h-3.5 w-3.5" />
              Por Via ({kits.filter((k) => k.tipoVinculo === 'VIA_ADMINISTRACAO').length})
            </button>
            <button
              type="button"
              onClick={() => setAbaFiltro('PROCEDIMENTO')}
              className={cn(
                'px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5',
                abaFiltro === 'PROCEDIMENTO' ? 'bg-background shadow-xs text-primary font-bold' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Bandage className="h-3.5 w-3.5" />
              Procedimentos ({kits.filter((k) => k.tipoVinculo === 'PROCEDIMENTO').length})
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={restaurarPadroes}
            disabled={carregando}
            className="px-3 py-2 rounded-xl border border-border bg-background hover:bg-muted text-xs font-semibold flex items-center gap-1.5 transition-colors"
            title="Garante a carga dos kits hospitalares padrão recomendados"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            Restaurar Padrões
          </button>

          <button
            type="button"
            onClick={abrirModalNovo}
            className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold flex items-center gap-1.5 hover:bg-primary/90 shadow-sm transition-colors"
          >
            <Plus className="h-4 w-4" />
            Novo Kit Automático
          </button>
        </div>
      </div>

      {/* Estatísticas e Atalhos de Visualização */}
      <div className="flex items-center justify-between px-1 text-xs text-muted-foreground">
        <span>
          Exibindo <strong>{kitsFiltrados.length}</strong> kit(s) configurados
        </span>
        <div className="flex items-center gap-3">
          <button type="button" onClick={expandirTodos} className="hover:text-primary font-medium">
            Expandir todos
          </button>
          <span>·</span>
          <button type="button" onClick={recolherTodos} className="hover:text-primary font-medium">
            Recolher todos
          </button>
        </div>
      </div>

      {/* Grid de Cards dos Kits */}
      {kitsFiltrados.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
            <Boxes className="h-6 w-6" />
          </div>
          <p className="text-sm font-semibold text-foreground">Nenhum kit automático encontrado.</p>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Utilize o botão &quot;Restaurar Padrões&quot; para carregar os kits hospitalares recomendados ou cadastre um novo kit personalizado.
          </p>
          <button
            type="button"
            onClick={restaurarPadroes}
            className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold inline-flex items-center gap-2"
          >
            <Sparkles className="h-4 w-4" />
            Carregar Kits Padrão Hospitalares
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {kitsFiltrados.map((kit) => {
            const expandido = expandidos[kit.id] ?? true;
            const isVia = kit.tipoVinculo === 'VIA_ADMINISTRACAO';

            return (
              <div
                key={kit.id}
                className={cn(
                  'bg-card border rounded-2xl p-5 shadow-sm transition-all flex flex-col justify-between space-y-4',
                  expandido ? 'border-border' : 'border-border/60 hover:border-border'
                )}
              >
                <div>
                  {/* Cabeçalho do Card */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div
                        className={cn(
                          'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border',
                          isVia
                            ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                            : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                        )}
                      >
                        {isVia ? <Syringe className="h-5 w-5" /> : <Bandage className="h-5 w-5" />}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-bold text-foreground truncate">{kit.nome}</h3>
                          {kit.codigo && (
                            <span className="px-2 py-0.5 rounded-md bg-muted text-[10px] font-mono font-semibold text-muted-foreground">
                              {kit.codigo}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider',
                              isVia
                                ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                                : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                            )}
                          >
                            {isVia ? `Via: ${labelVia(kit.viaAdministracao as any)}` : 'Procedimento / Cuidado'}
                          </span>

                          <span className="text-[11px] text-muted-foreground">
                            <strong>{kit.itens.length}</strong> insumo(s) vinculados
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => abrirModalEditar(kit)}
                        className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        title="Editar Kit"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => excluirKit(kit.id, kit.nome)}
                        className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 text-muted-foreground hover:text-red-600 transition-colors"
                        title="Excluir Kit"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleExpandir(kit.id)}
                        className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        title={expandido ? 'Recolher' : 'Expandir'}
                      >
                        {expandido ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Descrição */}
                  {kit.descricao && (
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{kit.descricao}</p>
                  )}

                  {/* Lista de Itens do Kit */}
                  {expandido && (
                    <div className="mt-4 pt-3 border-t border-border/70 space-y-1.5">
                      <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
                        Composição do Kit (Dispensação Automática):
                      </p>
                      <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                        {kit.itens.map((it, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between text-xs py-1 px-2.5 rounded-lg bg-muted/40 hover:bg-muted/70 transition-colors"
                          >
                            <span className="text-foreground/90 font-medium truncate flex-1 mr-2">
                              • {it.descricaoItem}
                            </span>
                            <span className="font-mono font-bold text-primary shrink-0 text-[11px]">
                              {it.quantidadePadrao} {it.unidade}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-2 text-[11px] text-muted-foreground flex items-center justify-between border-t border-border/40">
                  <span>Dispensação Automática</span>
                  <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Ativo
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Criar / Editar Kit */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in-50 zoom-in-95">
            {/* Cabeçalho Modal */}
            <div className="p-5 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Boxes className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-foreground">
                    {kitEmEdicao ? 'Editar Kit de Insumos' : 'Novo Kit Automático de Insumos'}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Configure os materiais que serão gerados automaticamente para enfermagem e farmácia.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalAberto(false)}
                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Formulário */}
            <form onSubmit={salvarKit} className="p-5 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold mb-1 block">
                    Nome do Kit <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formNome}
                    onChange={(e) => setFormNome(e.target.value)}
                    placeholder="Ex: Kit Injeção Endovenosa (EV)"
                    className="w-full px-3 py-2 text-sm bg-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1 block">Código (opcional)</label>
                  <input
                    type="text"
                    value={formCodigo}
                    onChange={(e) => setFormCodigo(e.target.value)}
                    placeholder="Ex: KIT-EV"
                    className="w-full px-3 py-2 text-sm font-mono uppercase bg-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold mb-1 block">Tipo de Vínculo</label>
                  <select
                    value={formTipoVinculo}
                    onChange={(e) => setFormTipoVinculo(e.target.value as any)}
                    className="w-full px-3 py-2 text-sm bg-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="PROCEDIMENTO">Procedimento / Cuidado de Enfermagem</option>
                    <option value="VIA_ADMINISTRACAO">Via de Administração de Medicamento</option>
                  </select>
                </div>

                {formTipoVinculo === 'VIA_ADMINISTRACAO' ? (
                  <div>
                    <label className="text-xs font-semibold mb-1 block">Via de Administração</label>
                    <select
                      value={formVia}
                      onChange={(e) => setFormVia(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      {VIAS_ADMINISTRACAO.map((v) => (
                        <option key={v} value={v}>
                          {labelVia(v)} ({v})
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="text-xs font-semibold mb-1 block">Nome do Procedimento</label>
                    <input
                      type="text"
                      value={formProcedimento}
                      onChange={(e) => setFormProcedimento(e.target.value)}
                      placeholder="Ex: Curativo Simples, Sondagem Vesical..."
                      className="w-full px-3 py-2 text-sm bg-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold mb-1 block">Descrição / Observações</label>
                <textarea
                  value={formDescricao}
                  onChange={(e) => setFormDescricao(e.target.value)}
                  rows={2}
                  placeholder="Informações clínicas sobre a utilização deste kit..."
                  className="w-full px-3 py-2 text-sm bg-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                />
              </div>

              {/* Lista de Insumos do Kit */}
              <div className="pt-3 border-t border-border space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Package className="h-4 w-4 text-primary" />
                    Insumos &amp; Materiais do Kit ({formItens.length})
                  </span>
                  <button
                    type="button"
                    onClick={adicionarLinhaItem}
                    className="px-2.5 py-1 text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20 rounded-lg flex items-center gap-1 transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Adicionar Insumo
                  </button>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {formItens.map((it, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 bg-muted/40 rounded-xl border border-border">
                      <input
                        type="text"
                        required
                        value={it.descricaoItem}
                        onChange={(e) => atualizarLinhaItem(idx, 'descricaoItem', e.target.value)}
                        placeholder="Descrição do insumo (ex: Seringa 10ml luer lock)"
                        className="flex-1 px-2.5 py-1.5 text-xs bg-background border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/20"
                      />
                      <input
                        type="number"
                        min={1}
                        value={it.quantidadePadrao}
                        onChange={(e) => atualizarLinhaItem(idx, 'quantidadePadrao', Number(e.target.value) || 1)}
                        className="w-16 px-2 py-1.5 text-xs font-mono text-center bg-background border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/20"
                        title="Quantidade Padrão"
                      />
                      <input
                        type="text"
                        value={it.unidade}
                        onChange={(e) => atualizarLinhaItem(idx, 'unidade', e.target.value.toUpperCase())}
                        placeholder="UN"
                        className="w-14 px-2 py-1.5 text-xs font-mono uppercase text-center bg-background border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/20"
                        title="Unidade de Medida"
                      />
                      <button
                        type="button"
                        onClick={() => removerLinhaItem(idx)}
                        className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 text-muted-foreground hover:text-red-600 transition-colors"
                        title="Remover insumo"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rodapé Modal */}
              <div className="pt-4 border-t border-border flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  className="px-4 py-2 rounded-xl border border-border bg-background hover:bg-muted text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={carregando}
                  className="px-6 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 shadow-sm"
                >
                  {kitEmEdicao ? 'Salvar Alterações' : 'Cadastrar Kit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
