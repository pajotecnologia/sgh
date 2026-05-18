'use client';
// components/atendimento/BuscaCid10.tsx
// Autocomplete de CID-10 com debounce

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { EntraCid10 } from '@/lib/cid10';

interface BuscaCid10Props {
  onSelecionar: (cid: EntraCid10) => void;
  placeholder?: string;
}

function usarDebounce<T>(valor: T, delay: number): T {
  const [valorDebounced, setValorDebounced] = useState<T>(valor);
  useEffect(() => {
    const timer = setTimeout(() => setValorDebounced(valor), delay);
    return () => clearTimeout(timer);
  }, [valor, delay]);
  return valorDebounced;
}

export function BuscaCid10({ onSelecionar, placeholder = 'Buscar por código ou descrição...' }: BuscaCid10Props) {
  const [query, setQuery] = useState('');
  const [resultados, setResultados] = useState<EntraCid10[]>([]);
  const [aberto, setAberto] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const queryDebounced = usarDebounce(query, 300);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Busca quando o query debounced muda
  useEffect(() => {
    if (queryDebounced.length < 2) {
      setResultados([]);
      setAberto(false);
      return;
    }

    setCarregando(true);
    fetch(`/api/cid10?q=${encodeURIComponent(queryDebounced)}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.sucesso) {
          setResultados(json.dados);
          setAberto(json.dados.length > 0);
        }
      })
      .catch(() => {})
      .finally(() => setCarregando(false));
  }, [queryDebounced]);

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

  function handleSelecionar(cid: EntraCid10) {
    onSelecionar(cid);
    setQuery('');
    setAberto(false);
    setResultados([]);
    inputRef.current?.focus();
  }

  const COR_CAPITULO: Record<string, string> = {
    'Circulatório': 'bg-red-100 text-red-700',
    'Respiratório': 'bg-blue-100 text-blue-700',
    'Digestivo': 'bg-orange-100 text-orange-700',
    'Endócrino': 'bg-purple-100 text-purple-700',
    'Neurológico': 'bg-indigo-100 text-indigo-700',
    'Infeccioso': 'bg-green-100 text-green-700',
    'Trauma': 'bg-yellow-100 text-yellow-700',
    'Sintomas': 'bg-gray-100 text-gray-700',
    'Geniturinário': 'bg-teal-100 text-teal-700',
    'Mental': 'bg-pink-100 text-pink-700',
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className={cn(
          'absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors',
          carregando ? 'text-primary animate-pulse' : 'text-muted-foreground'
        )} />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => resultados.length > 0 && setAberto(true)}
          placeholder={placeholder}
          className="w-full pl-9 pr-9 py-2.5 border border-input rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
          autoComplete="off"
          id="busca-cid10"
          aria-label="Buscar CID-10"
          aria-expanded={aberto}
          aria-haspopup="listbox"
        />
        {query && (
          <button
            type="button"
            onClick={() => { setQuery(''); setAberto(false); setResultados([]); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Limpar busca"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Dropdown de resultados */}
      {aberto && resultados.length > 0 && (
        <div
          role="listbox"
          className="absolute z-50 top-full mt-1 w-full bg-card border border-border rounded-xl shadow-lg overflow-hidden max-h-72 overflow-y-auto"
        >
          {resultados.map((cid) => (
            <button
              key={cid.codigo}
              type="button"
              role="option"
              onClick={() => handleSelecionar(cid)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/60 transition-colors text-left border-b border-border last:border-0"
            >
              <span className="font-mono text-sm font-bold text-primary shrink-0 w-16">
                {cid.codigo}
              </span>
              <span className="flex-1 text-sm text-foreground line-clamp-2">{cid.descricao}</span>
              <span className={cn(
                'text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0',
                COR_CAPITULO[cid.capitulo] ?? 'bg-muted text-muted-foreground'
              )}>
                {cid.capitulo}
              </span>
              <Plus className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            </button>
          ))}
        </div>
      )}

      {query.length >= 2 && !carregando && resultados.length === 0 && (
        <div className="absolute z-50 top-full mt-1 w-full bg-card border border-border rounded-xl shadow-lg px-4 py-3 text-sm text-muted-foreground">
          Nenhum CID encontrado para &quot;{query}&quot;.
        </div>
      )}
    </div>
  );
}
