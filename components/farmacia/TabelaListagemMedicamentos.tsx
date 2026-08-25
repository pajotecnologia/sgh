'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Search,
  Package,
  PackagePlus,
  Tags,
  ShieldAlert,
  AlertTriangle,
  Pill,
  Syringe,
  XCircle,
  SlidersHorizontal,
} from 'lucide-react'

export interface MedicamentoItem {
  id: string
  nome: string
  principioAtivo: string
  forma?: string | null
  concentracao?: string | null
  unidade?: string | null
  codigoEan?: string | null
  codigoAnvisa?: string | null
  classeTerapeutica?: string | null
  viaAdministracao?: string | null
  mav: boolean
  duplaChecagem: boolean
  tipoControle?: string | null
  saldoAtual: number
  estoqueMinimo: number
  ativo: boolean
  createdAt: Date | string
}

interface TabelaListagemMedicamentosProps {
  medicamentos: MedicamentoItem[]
}

function normalizarTexto(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function TabelaListagemMedicamentos({ medicamentos }: TabelaListagemMedicamentosProps) {
  const [busca, setBusca] = useState('')
  const [filtroTipo, setFiltroTipo] = useState<'TODOS' | 'MEDICAMENTO' | 'MATERIAL'>('TODOS')
  const [apenasEstoqueBaixo, setApenasEstoqueBaixo] = useState(false)
  const [apenasMav, setApenasMav] = useState(false)

  // Filtragem dinâmica inteligente em tempo real
  const medicamentosFiltrados = useMemo(() => {
    const termoNorm = normalizarTexto(busca)
    const palavrasBusca = termoNorm.split(' ').filter(Boolean)

    return medicamentos.filter((item) => {
      // 1. Filtro por busca de texto (Nome, Princípio Ativo, EAN, ANVISA, Forma, Concentração, Classe)
      if (palavrasBusca.length > 0) {
        const textoCompleto = normalizarTexto(
          `${item.nome} ${item.principioAtivo} ${item.forma || ''} ${item.concentracao || ''} ${
            item.codigoEan || ''
          } ${item.codigoAnvisa || ''} ${item.classeTerapeutica || ''} ${item.tipoControle || ''}`
        )
        const corresponde = palavrasBusca.every((p) => textoCompleto.includes(p))
        if (!corresponde) return false
      }

      // 2. Filtro por Categoria (Medicamento vs Material Hospitalar)
      const eMaterial =
        /seringa|gaze|cateter|equipo|luva|mascara|sonda|fio|agulha|curativo|algodao|atadura|insumo|material/i.test(
          item.nome
        ) ||
        /material|insumo/i.test(item.principioAtivo) ||
        /material|insumo/i.test(item.classeTerapeutica || '')

      if (filtroTipo === 'MEDICAMENTO' && eMaterial) return false
      if (filtroTipo === 'MATERIAL' && !eMaterial) return false

      // 3. Filtro por Estoque Baixo (saldoAtual <= estoqueMinimo)
      if (apenasEstoqueBaixo) {
        if (item.estoqueMinimo <= 0 || item.saldoAtual > item.estoqueMinimo) {
          return false
        }
      }

      // 4. Filtro por Alta Vigilância (MAV)
      if (apenasMav && !item.mav) return false

      return true
    })
  }, [medicamentos, busca, filtroTipo, apenasEstoqueBaixo, apenasMav])

  const totalEstoqueBaixo = useMemo(() => {
    return medicamentos.filter((m) => m.estoqueMinimo > 0 && m.saldoAtual <= m.estoqueMinimo).length
  }, [medicamentos])

  const totalMav = useMemo(() => {
    return medicamentos.filter((m) => m.mav).length
  }, [medicamentos])

  const limparFiltros = () => {
    setBusca('')
    setFiltroTipo('TODOS')
    setApenasEstoqueBaixo(false)
    setApenasMav(false)
  }

  return (
    <div className="space-y-4">
      {/* Barra Superior de Controles e Pesquisa */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Input de Busca */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Pesquisar por nome, princípio ativo, código de barras EAN, registro ANVISA..."
              className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-background text-foreground text-sm outline-none focus:ring-2 focus:ring-primary/30"
            />
            {busca && (
              <button
                type="button"
                onClick={() => setBusca('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                title="Limpar busca"
              >
                <XCircle className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Botão Novo Medicamento */}
          <Link
            href="/cadastros/medicamentos/novo"
            className="no-print inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-white px-4 py-2.5 text-xs font-bold hover:brightness-95 shadow-sm shrink-0"
          >
            <PackagePlus className="h-4 w-4" aria-hidden />
            Novo Cadastro
          </Link>
        </div>

        {/* Filtros Rápidos (Categorias, Alertas, Badges) */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium mr-1 flex items-center gap-1">
              <SlidersHorizontal className="h-3.5 w-3.5 text-primary" /> Filtrar:
            </span>

            <button
              type="button"
              onClick={() => setFiltroTipo('TODOS')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                filtroTipo === 'TODOS'
                  ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              Todos ({medicamentos.length})
            </button>

            <button
              type="button"
              onClick={() => setFiltroTipo('MEDICAMENTO')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all flex items-center gap-1 ${
                filtroTipo === 'MEDICAMENTO'
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              <Pill className="h-3.5 w-3.5" /> Medicamentos
            </button>

            <button
              type="button"
              onClick={() => setFiltroTipo('MATERIAL')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all flex items-center gap-1 ${
                filtroTipo === 'MATERIAL'
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              <Syringe className="h-3.5 w-3.5" /> Materiais Hospitalares
            </button>

            {totalEstoqueBaixo > 0 && (
              <button
                type="button"
                onClick={() => setApenasEstoqueBaixo(!apenasEstoqueBaixo)}
                className={`px-3 py-1 rounded-lg font-semibold transition-all flex items-center gap-1 ${
                  apenasEstoqueBaixo
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50'
                }`}
              >
                <AlertTriangle className="h-3.5 w-3.5" /> Estoque Baixo ({totalEstoqueBaixo})
              </button>
            )}

            {totalMav > 0 && (
              <button
                type="button"
                onClick={() => setApenasMav(!apenasMav)}
                className={`px-3 py-1 rounded-lg font-semibold transition-all flex items-center gap-1 ${
                  apenasMav
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/50'
                }`}
              >
                <ShieldAlert className="h-3.5 w-3.5" /> MAV ({totalMav})
              </button>
            )}
          </div>

          {(busca || filtroTipo !== 'TODOS' || apenasEstoqueBaixo || apenasMav) && (
            <button
              type="button"
              onClick={limparFiltros}
              className="text-xs text-primary font-bold hover:underline"
            >
              Limpar Filtros
            </button>
          )}
        </div>
      </div>

      {/* Lista de Registros */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <p className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Itens Listados ({medicamentosFiltrados.length} de {medicamentos.length})
          </p>
        </div>

        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {medicamentosFiltrados.map((m) => {
            const estoqueBaixo = m.estoqueMinimo > 0 && m.saldoAtual <= m.estoqueMinimo

            return (
              <li
                key={m.id}
                className="px-4 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {m.nome}
                    </span>
                    <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                      ({m.principioAtivo})
                    </span>

                    {m.mav && (
                      <span className="px-2 py-0.5 rounded bg-red-100 dark:bg-red-950/80 text-red-800 dark:text-red-300 text-[10px] font-bold flex items-center gap-1">
                        <ShieldAlert className="h-3 w-3" /> MAV
                      </span>
                    )}

                    {m.duplaChecagem && (
                      <span className="px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 text-[10px] font-bold">
                        Dupla Checagem
                      </span>
                    )}

                    {m.tipoControle && (
                      <span className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 text-[10px] font-bold">
                        {m.tipoControle}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                    <span>
                      Forma:{' '}
                      <strong className="text-slate-700 dark:text-slate-300">
                        {m.forma || '—'}
                      </strong>
                    </span>
                    <span>
                      Concentração:{' '}
                      <strong className="text-slate-700 dark:text-slate-300">
                        {m.concentracao || '—'}
                      </strong>
                    </span>
                    <span>
                      Unidade:{' '}
                      <strong className="text-slate-700 dark:text-slate-300">
                        {m.unidade || 'UN'}
                      </strong>
                    </span>
                    {m.codigoEan && (
                      <span className="font-mono text-[11px]">EAN: {m.codigoEan}</span>
                    )}
                    {m.codigoAnvisa && (
                      <span className="font-mono text-[11px]">MS: {m.codigoAnvisa}</span>
                    )}
                  </div>

                  <div className="text-xs flex items-center gap-2 pt-0.5">
                    <span>
                      Saldo em Estoque:{' '}
                      <strong
                        className={`font-mono ${
                          estoqueBaixo
                            ? 'text-red-600 dark:text-red-400 font-bold'
                            : 'text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        {m.saldoAtual} {m.unidade || 'UN'}
                      </strong>
                    </span>
                    <span>• Mínimo: <span className="font-mono">{m.estoqueMinimo}</span></span>

                    {estoqueBaixo && (
                      <span className="text-red-600 dark:text-red-400 font-bold flex items-center gap-1">
                        <AlertTriangle className="h-3.5 w-3.5" /> (Abaixo do Mínimo!)
                      </span>
                    )}
                  </div>
                </div>

                {/* Ações */}
                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  <Link
                    href={`/cadastros/medicamentos/${m.id}`}
                    className="no-print rounded-xl px-3.5 py-2 text-xs font-semibold border border-slate-200 dark:border-slate-800 bg-background text-foreground hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    Editar / Detalhes
                  </Link>
                  <Link
                    href={`/cadastros/sinonimos?medicamentoId=${m.id}`}
                    className="no-print rounded-xl px-3.5 py-2 text-xs font-semibold border border-slate-200 dark:border-slate-800 bg-background text-foreground hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 text-primary"
                  >
                    <Tags className="h-3.5 w-3.5" /> Sinônimos
                  </Link>
                </div>
              </li>
            )
          })}

          {medicamentosFiltrados.length === 0 && (
            <li className="px-4 py-12 text-center text-sm text-slate-500 dark:text-slate-400 space-y-2">
              <Package className="h-8 w-8 text-slate-300 dark:text-slate-600 mx-auto" />
              <p className="font-semibold text-slate-700 dark:text-slate-300">
                Nenhum medicamento ou material encontrado.
              </p>
              {busca ? (
                <p className="text-xs">
                  Nenhum item corresponde à pesquisa &quot;{busca}&quot;. Tente limpar os filtros.
                </p>
              ) : (
                <p className="text-xs">Clique no botão &quot;Novo Cadastro&quot; para adicionar.</p>
              )}
            </li>
          )}
        </ul>
      </div>
    </div>
  )
}
