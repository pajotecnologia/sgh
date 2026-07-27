'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X } from 'lucide-react'

type FiltroInternamentoListaProps = {
  nomeInicial?: string
  prontuarioInicial?: string
  dataInicioInicial?: string
  dataFimInicial?: string
  actionPath?: string
}

const inputCls =
  'w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30'

export function FiltroInternamentoLista({
  nomeInicial = '',
  prontuarioInicial = '',
  dataInicioInicial = '',
  dataFimInicial = '',
  actionPath = '/prontuario',
}: FiltroInternamentoListaProps) {
  const router = useRouter()
  const [nome, setNome] = useState(nomeInicial)
  const [prontuario, setProntuario] = useState(prontuarioInicial)
  const [dataInicio, setDataInicio] = useState(dataInicioInicial)
  const [dataFim, setDataFim] = useState(dataFimInicial)

  const temFiltro = Boolean(nomeInicial || prontuarioInicial || dataInicioInicial || dataFimInicial)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const q = new URLSearchParams()
    if (nome.trim()) q.set('nome', nome.trim())
    if (prontuario.trim()) q.set('prontuario', prontuario.trim())
    if (dataInicio) q.set('dataInicio', dataInicio)
    if (dataFim) q.set('dataFim', dataFim)
    const s = q.toString()
    router.push(s ? `${actionPath}?${s}` : actionPath)
  }

  const handleLimpar = () => {
    setNome('')
    setProntuario('')
    setDataInicio('')
    setDataFim('')
    router.push(actionPath)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-card border border-border rounded-xl p-4 sm:p-5 space-y-4"
      aria-label="Pesquisar pacientes internados"
    >
      <p className="text-sm font-semibold text-foreground">Pesquisar internação</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div>
          <label htmlFor="filtro-nome-internacao" className="text-xs font-medium text-muted-foreground">
            Nome do paciente
          </label>
          <input
            id="filtro-nome-internacao"
            type="search"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ex.: Maria Silva"
            className={inputCls}
            aria-label="Nome do paciente"
          />
        </div>
        <div>
          <label htmlFor="filtro-prontuario-internacao" className="text-xs font-medium text-muted-foreground">
            Prontuário / atendimento
          </label>
          <input
            id="filtro-prontuario-internacao"
            type="search"
            value={prontuario}
            onChange={(e) => setProntuario(e.target.value)}
            placeholder="Ex.: 20240315-0001"
            className={`${inputCls} font-mono`}
            aria-label="Prontuário ou número de atendimento"
          />
        </div>
        <div>
          <label htmlFor="filtro-data-inicio-internacao" className="text-xs font-medium text-muted-foreground">
            Internação — de
          </label>
          <input
            id="filtro-data-inicio-internacao"
            type="date"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
            className={inputCls}
            aria-label="Data inicial da internação"
          />
        </div>
        <div>
          <label htmlFor="filtro-data-fim-internacao" className="text-xs font-medium text-muted-foreground">
            Internação — até
          </label>
          <input
            id="filtro-data-fim-internacao"
            type="date"
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
            className={inputCls}
            aria-label="Data final da internação"
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90"
          aria-label="Aplicar filtros de pesquisa"
        >
          <Search className="h-4 w-4" aria-hidden />
          Pesquisar
        </button>
        {temFiltro ? (
          <button
            type="button"
            onClick={handleLimpar}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted/50"
            aria-label="Limpar filtros de pesquisa"
          >
            <X className="h-4 w-4" aria-hidden />
            Limpar
          </button>
        ) : null}
      </div>
    </form>
  )
}
