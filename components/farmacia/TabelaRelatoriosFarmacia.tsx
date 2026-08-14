'use client'

import { useEffect, useState } from 'react'

type DadosRelatorio = Record<string, unknown>[]

export function TabelaRelatoriosFarmacia() {
  const [tipo, setTipo] = useState<string | null>(null)
  const [dados, setDados] = useState<DadosRelatorio>([])

  useEffect(() => {
    const handler = (e: Event) => {
      const ev = e as CustomEvent<{ tipo: string; dados: DadosRelatorio }>
      setTipo(ev.detail.tipo)
      setDados(ev.detail.dados ?? [])
    }
    window.addEventListener('farmacia-relatorio-carregado', handler)
    return () => window.removeEventListener('farmacia-relatorio-carregado', handler)
  }, [])

  if (!tipo || dados.length === 0) {
    return (
      <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-6">
        Use &quot;Ver na tela&quot; em um dos relatórios acima para exibir os dados.
      </p>
    )
  }

  if (tipo === 'faltantes') {
    return (
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Faltantes ({dados.length})</p>
        </div>
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {dados.map((row, i) => (
            <li key={i} className="px-4 py-3 text-xs hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
              <p className="font-semibold text-slate-900 dark:text-slate-100">{String(row.medicamentoNome)}</p>
              <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                Atend. {(row.atendimento as { numeroAtendimento?: string })?.numeroAtendimento} •
                Solicitado {String(row.quantidadeSolicitada)} • Saldo {String(row.saldoAtual ?? '—')} •
                Faltam {String(row.deficit ?? '?')}
              </p>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800">
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Abaixo do estoque mínimo ({dados.length})</p>
      </div>
      <table className="w-full text-xs">
        <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300">
          <tr>
            <th className="text-left px-4 py-2 font-semibold">Medicamento</th>
            <th className="text-right px-4 py-2 font-semibold">Saldo</th>
            <th className="text-right px-4 py-2 font-semibold">Mínimo</th>
            <th className="text-right px-4 py-2 font-semibold">Déficit</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {dados.map((row, i) => (
            <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
              <td className="px-4 py-2 font-medium text-slate-900 dark:text-slate-100">{String(row.nome)}</td>
              <td className="px-4 py-2 text-right font-mono text-slate-700 dark:text-slate-300">{String(row.saldoAtual)}</td>
              <td className="px-4 py-2 text-right font-mono text-slate-700 dark:text-slate-300">{String(row.estoqueMinimo)}</td>
              <td className="px-4 py-2 text-right font-mono text-red-700 dark:text-red-400 font-bold">{String(row.deficit)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
