'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2, FileDown, AlertTriangle } from 'lucide-react'

type RelatorioTipo = 'faltantes' | 'estoque-minimo'

export function FormularioRelatoriosFarmacia() {
  const [carregando, setCarregando] = useState<RelatorioTipo | null>(null)

  const handleBaixarPdf = async (tipo: RelatorioTipo) => {
    setCarregando(tipo)
    try {
      const url =
        tipo === 'faltantes'
          ? '/api/farmacia/relatorios/faltantes?formato=pdf'
          : '/api/farmacia/relatorios/estoque-minimo?formato=pdf'

      const res = await fetch(url)
      if (!res.ok) {
        const json = await res.json().catch(() => null)
        toast.error(json?.erro ?? 'Falha ao gerar relatório.')
        return
      }

      const blob = await res.blob()
      const href = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = href
      a.download = tipo === 'faltantes' ? 'farmacia-faltantes.pdf' : 'farmacia-estoque-minimo.pdf'
      a.click()
      URL.revokeObjectURL(href)
      toast.success('Relatório PDF gerado.')
    } catch {
      toast.error('Erro de conexão.')
    } finally {
      setCarregando(null)
    }
  }

  const handleVerTela = async (tipo: RelatorioTipo) => {
    setCarregando(tipo)
    try {
      const url =
        tipo === 'faltantes'
          ? '/api/farmacia/relatorios/faltantes'
          : '/api/farmacia/relatorios/estoque-minimo'

      const res = await fetch(url)
      const json = await res.json()
      if (!res.ok || !json?.sucesso) {
        toast.error(json?.erro ?? 'Falha ao carregar relatório.')
        return
      }

      const total = json.total ?? json.dados?.length ?? 0
      toast.success(`${total} registro(s) encontrado(s). Veja a tabela abaixo.`)
      window.dispatchEvent(new CustomEvent('farmacia-relatorio-carregado', { detail: { tipo, dados: json.dados } }))
    } catch {
      toast.error('Erro de conexão.')
    } finally {
      setCarregando(null)
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
        <div className="flex items-start gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" aria-hidden />
          <div>
            <p className="text-sm font-semibold text-slate-900">Relatório de Faltantes</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Prescrições aguardando dispensação sem saldo suficiente em estoque.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => handleVerTela('faltantes')}
            disabled={carregando !== null}
            className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold hover:bg-slate-50 disabled:opacity-50"
            aria-label="Ver relatório de faltantes na tela"
          >
            Ver na tela
          </button>
          <button
            type="button"
            onClick={() => handleBaixarPdf('faltantes')}
            disabled={carregando !== null}
            className="inline-flex items-center gap-2 rounded-xl bg-primary text-white px-3 py-2 text-xs font-semibold hover:brightness-95 disabled:opacity-50"
            aria-label="Baixar PDF de faltantes"
          >
            {carregando === 'faltantes' ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : <FileDown className="h-3.5 w-3.5" aria-hidden />}
            PDF
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
        <div className="flex items-start gap-2">
          <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" aria-hidden />
          <div>
            <p className="text-sm font-semibold text-slate-900">Relatório de Estoque Mínimo</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Medicamentos com saldo atual igual ou abaixo do estoque mínimo configurado.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => handleVerTela('estoque-minimo')}
            disabled={carregando !== null}
            className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold hover:bg-slate-50 disabled:opacity-50"
            aria-label="Ver relatório de estoque mínimo na tela"
          >
            Ver na tela
          </button>
          <button
            type="button"
            onClick={() => handleBaixarPdf('estoque-minimo')}
            disabled={carregando !== null}
            className="inline-flex items-center gap-2 rounded-xl bg-primary text-white px-3 py-2 text-xs font-semibold hover:brightness-95 disabled:opacity-50"
            aria-label="Baixar PDF de estoque mínimo"
          >
            {carregando === 'estoque-minimo' ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : <FileDown className="h-3.5 w-3.5" aria-hidden />}
            PDF
          </button>
        </div>
      </div>
    </div>
  )
}
