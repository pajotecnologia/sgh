// components/atendimento/BuscaCid10.tsx
// Busca de CID-10 fluida, instantânea, com teclado e atalhos por categoria

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, Plus, Sparkles, Stethoscope, ChevronRight, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { EntraCid10 } from '@/lib/cid10';

interface BuscaCid10Props {
  onSelecionar: (cid: EntraCid10) => void;
  placeholder?: string;
}

const CATEGORIAS_ATALHO = [
  { id: 'TODOS', label: '🔥 Frequentes', capitulo: '' },
  { id: 'RESPIRATORIO', label: '🫁 Respiratório', capitulo: 'Respiratório' },
  { id: 'CIRCULATORIO', label: '❤️ Coração & Vasos', capitulo: 'Circulatório' },
  { id: 'DIGESTIVO', label: '🤢 Digestivo', capitulo: 'Digestivo' },
  { id: 'INFECCIOSO', label: '🩸 Infecciosas', capitulo: 'Infeccioso' },
  { id: 'NEURO', label: '🧠 Neuro & Dor', capitulo: 'Sintomas' },
  { id: 'TRAUMA', label: '🦴 Trauma', capitulo: 'Trauma' },
  { id: 'OBSTETRICIA', label: '🤰 Obstetrícia', capitulo: 'Obstetrícia' },
];

const COR_CAPITULO: Record<string, string> = {
  'Circulatório': 'bg-red-500/10 text-red-600 border-red-500/20 dark:text-red-400',
  'Respiratório': 'bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400',
  'Digestivo': 'bg-orange-500/10 text-orange-600 border-orange-500/20 dark:text-orange-400',
  'Endócrino': 'bg-purple-500/10 text-purple-600 border-purple-500/20 dark:text-purple-400',
  'Neurológico': 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20 dark:text-indigo-400',
  'Infeccioso': 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400',
  'Trauma': 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400',
  'Sintomas': 'bg-slate-500/10 text-slate-600 border-slate-500/20 dark:text-slate-400',
  'Geniturinário': 'bg-teal-500/10 text-teal-600 border-teal-500/20 dark:text-teal-400',
  'Mental': 'bg-pink-500/10 text-pink-600 border-pink-500/20 dark:text-pink-400',
  'Obstetrícia': 'bg-rose-500/10 text-rose-600 border-rose-500/20 dark:text-rose-400',
  'Perinatal': 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20 dark:text-cyan-400',
};

export function BuscaCid10({
  onSelecionar,
  placeholder = 'Digite o código ou nome da doença (ex.: J18, Pneumonia, Dengue, I10)...',
}: BuscaCid10Props) {
  const [query, setQuery] = useState('');
  const [resultados, setResultados] = useState<EntraCid10[]>([]);
  const [aberto, setAberto] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [categoriaAtiva, setCategoriaAtiva] = useState('');
  const [indiceFocado, setIndiceFocado] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const listboxRef = useRef<HTMLDivElement>(null);

  // Executa a busca
  const executarBusca = useCallback(async (termo: string, capituloFiltro?: string) => {
    setCarregando(true);
    try {
      const params = new URLSearchParams();
      if (termo.trim()) params.set('q', termo.trim());
      params.set('limite', '25');

      const res = await fetch(`/api/cid10?${params.toString()}`);
      const json = await res.json();
      if (json.sucesso) {
        let dados: EntraCid10[] = json.dados ?? [];
        if (capituloFiltro) {
          dados = dados.filter(
            (c) => c.capitulo.toLowerCase() === capituloFiltro.toLowerCase()
          );
        }
        setResultados(dados);
        setAberto(dados.length > 0);
        setIndiceFocado(-1);
      }
    } catch {
      /* erro silencioso */
    } finally {
      setCarregando(false);
    }
  }, []);

  // Busca instantânea ao digitar
  useEffect(() => {
    const timer = setTimeout(() => {
      executarBusca(query, categoriaAtiva);
    }, 150);

    return () => clearTimeout(timer);
  }, [query, categoriaAtiva, executarBusca]);

  // Fechar ao clicar fora
  useEffect(() => {
    function handleClickFora(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setAberto(false);
      }
    }
    document.addEventListener('mousedown', handleClickFora);
    return () => document.removeEventListener('mousedown', handleClickFora);
  }, []);

  const handleSelecionar = (cid: EntraCid10) => {
    onSelecionar(cid);
    setQuery('');
    setAberto(false);
    setResultados([]);
    setIndiceFocado(-1);
  };

  // Navegação por teclado (Seta Baixo, Seta Cima, Enter, Esc)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!aberto || resultados.length === 0) {
      if (e.key === 'ArrowDown') {
        setAberto(true);
        executarBusca(query, categoriaAtiva);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIndiceFocado((prev) => (prev < resultados.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setIndiceFocado((prev) => (prev > 0 ? prev - 1 : resultados.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (indiceFocado >= 0 && indiceFocado < resultados.length) {
        handleSelecionar(resultados[indiceFocado]);
      } else if (resultados.length > 0) {
        handleSelecionar(resultados[0]);
      }
    } else if (e.key === 'Escape') {
      setAberto(false);
      setIndiceFocado(-1);
    }
  };

  // Rolar elemento focado para visualização
  useEffect(() => {
    if (indiceFocado >= 0 && listboxRef.current) {
      const el = listboxRef.current.children[indiceFocado] as HTMLElement;
      if (el) {
        el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [indiceFocado]);

  return (
    <div ref={containerRef} className="relative w-full space-y-2">
      {/* Barra de Entrada Principal */}
      <div className="relative">
        <Search
          className={cn(
            'absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors',
            carregando ? 'text-primary animate-pulse' : 'text-muted-foreground'
          )}
        />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            setAberto(true);
            executarBusca(query, categoriaAtiva);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2.5 bg-background border border-input rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all shadow-xs"
          autoComplete="off"
          id="busca-cid10"
          aria-label="Buscar CID-10"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setCategoriaAtiva('');
              executarBusca('', '');
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Limpar busca"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Atalhos de Filtro por Categoria */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar">
        {CATEGORIAS_ATALHO.map((cat) => {
          const ativa = categoriaAtiva === cat.capitulo;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                const nova = ativa ? '' : cat.capitulo;
                setCategoriaAtiva(nova);
                executarBusca(query, nova);
                inputRef.current?.focus();
              }}
              className={cn(
                'text-[11px] font-medium px-2.5 py-1 rounded-lg border transition-all whitespace-nowrap shrink-0 flex items-center gap-1',
                ativa
                  ? 'bg-primary text-primary-foreground border-primary font-semibold shadow-xs'
                  : 'bg-muted/40 text-muted-foreground border-border hover:bg-muted hover:text-foreground'
              )}
            >
              <span>{cat.label}</span>
              {ativa && <Check className="h-3 w-3 shrink-0" />}
            </button>
          );
        })}
      </div>

      {/* Dropdown de Resultados da Busca */}
      {aberto && resultados.length > 0 && (
        <div
          ref={listboxRef}
          role="listbox"
          className="absolute z-50 top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-2xl overflow-hidden max-h-80 overflow-y-auto divide-y divide-border/60 animate-in fade-in slide-in-from-top-1 duration-150"
        >
          <div className="px-3 py-1.5 bg-muted/60 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
            <span>Resultados ({resultados.length})</span>
            <span className="text-[9px]">Use ↑ ↓ e Enter para selecionar</span>
          </div>

          {resultados.map((cid, idx) => {
            const focado = idx === indiceFocado;
            return (
              <button
                key={`${cid.codigo}-${idx}`}
                type="button"
                role="option"
                aria-selected={focado}
                onClick={() => handleSelecionar(cid)}
                onMouseEnter={() => setIndiceFocado(idx)}
                className={cn(
                  'w-full flex items-center justify-between gap-3 px-3.5 py-2.5 text-left transition-colors',
                  focado ? 'bg-primary/10 text-foreground font-medium' : 'hover:bg-muted/50 text-foreground/90'
                )}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span className="font-mono text-xs font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-md shrink-0">
                    {cid.codigo}
                  </span>
                  <span className="text-xs text-foreground truncate">{cid.descricao}</span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={cn(
                      'text-[10px] font-semibold px-2 py-0.5 rounded-md border',
                      COR_CAPITULO[cid.capitulo] ?? 'bg-muted text-muted-foreground border-border'
                    )}
                  >
                    {cid.capitulo}
                  </span>
                  <Plus className="h-3.5 w-3.5 text-primary opacity-60 group-hover:opacity-100" />
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Nenhum resultado encontrado */}
      {query.length >= 2 && !carregando && resultados.length === 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-xl px-4 py-3 text-xs text-muted-foreground flex items-center justify-between">
          <span>Nenhum CID encontrado para &quot;<strong className="text-foreground">{query}</strong>&quot;.</span>
          <span className="text-[10px]">Tente buscar pelo nome da doença ou código base.</span>
        </div>
      )}
    </div>
  );
}
