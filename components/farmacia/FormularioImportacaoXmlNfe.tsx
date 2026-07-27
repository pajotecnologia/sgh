'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, Upload, CheckCircle2, AlertTriangle } from 'lucide-react'

type MedicamentoOption = { id: string; nome: string; principioAtivo: string }

type ItemPreview = {
  indice: number
  descricao: string
  quantidade: number
  valorUnitario: number | null
  lote: string | null
  validade: string | null
  medicamentoId: string | null
  medicamentoSugerido: MedicamentoOption | null
}

type CabecalhoPreview = {
  numeroNota: string
  serie: string | null
  chaveNfe: string | null
  fornecedorNome: string | null
  fornecedorCnpj: string | null
  emitidaEm: string | null
  jaImportada: boolean
}

export function FormularioImportacaoXmlNfe({ medicamentos }: { medicamentos: MedicamentoOption[] }) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [carregando, setCarregando] = useState(false)
  const [confirmando, setConfirmando] = useState(false)
  const [cabecalho, setCabecalho] = useState<CabecalhoPreview | null>(null)
  const [itens, setItens] = useState<ItemPreview[]>([])
  const [avisos, setAvisos] = useState<string[]>([])
  const [recebidaEm, setRecebidaEm] = useState('')
  const [observacoes, setObservacoes] = useState('')

  const handleSelecionarArquivo = () => inputRef.current?.click()

  const handleArquivo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const arquivo = e.target.files?.[0]
    if (!arquivo) return

    if (!arquivo.name.toLowerCase().endsWith('.xml')) {
      toast.error('Selecione um arquivo XML de NF-e.')
      return
    }

    setCarregando(true)
    setCabecalho(null)
    setItens([])
    try {
      const form = new FormData()
      form.append('xml', arquivo)

      const res = await fetch('/api/farmacia/entradas/importar-xml', { method: 'POST', body: form })
      const json = await res.json()
      if (!res.ok || !json?.sucesso) {
        toast.error(json?.erro ?? 'Falha ao processar XML.')
        return
      }

      setCabecalho(json.dados.cabecalho)
      setItens(json.dados.itens)
      setAvisos(json.dados.avisos ?? [])

      if (json.dados.cabecalho.jaImportada) {
        toast.warning('Esta NF-e já foi importada anteriormente.')
      } else {
        toast.success('XML processado. Revise os dados antes de confirmar.')
      }
    } catch {
      toast.error('Erro de conexão.')
    } finally {
      setCarregando(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const handleVincularMedicamento = (idx: number, medicamentoId: string) => {
    setItens((prev) =>
      prev.map((it, i) => (i === idx ? { ...it, medicamentoId: medicamentoId || null } : it))
    )
  }

  const itensSemVinculo = itens.filter((i) => !i.medicamentoId)
  const podeConfirmar = cabecalho && !cabecalho.jaImportada && itens.length > 0 && itensSemVinculo.length === 0

  const handleConfirmar = async () => {
    if (!cabecalho || !podeConfirmar) return

    setConfirmando(true)
    try {
      const res = await fetch('/api/farmacia/entradas/importar-xml', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'confirmar',
          numeroNota: cabecalho.numeroNota,
          serie: cabecalho.serie,
          fornecedorNome: cabecalho.fornecedorNome,
          fornecedorCnpj: cabecalho.fornecedorCnpj,
          emitidaEm: cabecalho.emitidaEm,
          chaveNfe: cabecalho.chaveNfe,
          recebidaEm: recebidaEm || null,
          observacoes: observacoes.trim() || null,
          itens: itens.map((it) => ({
            medicamentoId: it.medicamentoId!,
            quantidade: it.quantidade,
            custoUnitario: it.valorUnitario,
            lote: it.lote,
            validade: it.validade,
            descricaoXml: it.descricao,
          })),
        }),
      })
      const json = await res.json()
      if (!res.ok || !json?.sucesso) {
        toast.error(json?.erro ?? 'Falha ao confirmar entrada.')
        return
      }
      toast.success('Entrada importada e estoque atualizado.')
      router.push(`/farmacia/entradas/${json.dados.id}`)
      router.refresh()
    } catch {
      toast.error('Erro de conexão.')
    } finally {
      setConfirmando(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <input
          ref={inputRef}
          type="file"
          accept=".xml,application/xml,text/xml"
          className="hidden"
          onChange={handleArquivo}
          aria-label="Selecionar arquivo XML NF-e"
        />
        <button
          type="button"
          onClick={handleSelecionarArquivo}
          disabled={carregando}
          className="inline-flex items-center gap-2 rounded-xl border border-dashed border-primary/40 bg-primary/5 px-4 py-3 text-sm font-semibold text-primary hover:bg-primary/10 disabled:opacity-50 w-full justify-center"
          aria-label="Enviar XML da NF-e"
        >
          {carregando ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Upload className="h-4 w-4" aria-hidden />}
          {carregando ? 'Processando XML…' : 'Selecionar arquivo XML da NF-e'}
        </button>
        <p className="text-[11px] text-slate-500 mt-2 text-center">
          Tamanho máximo 5 MB. Após o upload, revise os dados na tela de confirmação.
        </p>
      </div>

      {avisos.length > 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
          {avisos.map((a, i) => (
            <p key={i}>{a}</p>
          ))}
        </div>
      ) : null}

      {cabecalho ? (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
            <p className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" aria-hidden />
              Confirmação prévia — NF {cabecalho.numeroNota}
            </p>
            {cabecalho.jaImportada ? (
              <p className="text-xs text-red-700 mt-1 flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
                Esta nota já foi importada.
              </p>
            ) : null}
          </div>

          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-500">Fornecedor:</span>{' '}
              <span className="font-medium">{cabecalho.fornecedorNome ?? '—'}</span>
            </div>
            <div>
              <span className="text-slate-500">CNPJ:</span>{' '}
              <span className="font-mono">{cabecalho.fornecedorCnpj ?? '—'}</span>
            </div>
            <div>
              <span className="text-slate-500">Série:</span> {cabecalho.serie ?? '—'}
            </div>
            <div>
              <span className="text-slate-500">Emissão:</span> {cabecalho.emitidaEm ?? '—'}
            </div>
          </div>

          <div className="px-4 pb-3 grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700">Recebida em</label>
              <input
                type="date"
                value={recebidaEm}
                onChange={(e) => setRecebidaEm(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                aria-label="Data de recebimento"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700">Observações</label>
              <input
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                aria-label="Observações"
              />
            </div>
          </div>

          <div className="divide-y divide-slate-100 border-t border-slate-200">
            {itens.map((it, idx) => (
              <div key={idx} className="p-4 grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                <div className="md:col-span-4">
                  <p className="text-xs font-semibold text-slate-900">{it.descricao}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Qtde {it.quantidade}
                    {it.lote ? ` • Lote ${it.lote}` : ''}
                    {it.validade ? ` • Val. ${it.validade}` : ''}
                  </p>
                </div>
                <div className="md:col-span-5">
                  <label className="text-xs font-semibold text-slate-700">Medicamento no catálogo</label>
                  <select
                    value={it.medicamentoId ?? ''}
                    onChange={(e) => handleVincularMedicamento(idx, e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    aria-label={`Vincular medicamento item ${it.indice}`}
                  >
                    <option value="">Selecione…</option>
                    {it.medicamentoSugerido ? (
                      <option value={it.medicamentoSugerido.id}>
                        ★ {it.medicamentoSugerido.nome} — {it.medicamentoSugerido.principioAtivo}
                      </option>
                    ) : null}
                    {medicamentos
                      .filter((m) => m.id !== it.medicamentoSugerido?.id)
                      .map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.nome} — {m.principioAtivo}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="md:col-span-3">
                  {!it.medicamentoId ? (
                    <span className="text-[11px] text-red-700 font-semibold">Vinculação obrigatória</span>
                  ) : (
                    <span className="text-[11px] text-green-700 font-semibold">Vinculado</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-slate-200">
            {itensSemVinculo.length > 0 ? (
              <p className="text-xs text-amber-800 mb-3">
                {itensSemVinculo.length} item(ns) sem medicamento vinculado.
              </p>
            ) : null}
            <button
              type="button"
              onClick={handleConfirmar}
              disabled={!podeConfirmar || confirmando}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary text-white px-4 py-2 text-sm font-semibold hover:brightness-95 disabled:opacity-50"
              aria-label="Confirmar importação da NF-e"
            >
              {confirmando ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
              Confirmar entrada e atualizar estoque
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
