'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, Upload, CheckCircle2, AlertTriangle, Truck } from 'lucide-react'

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
  codigoEan?: string | null
  codigoAnvisa?: string | null
  unidadeComercial?: string | null
  criarNovo?: boolean
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
        toast.success('XML processado. Revise ou auto-cadastre os medicamentos antes de confirmar.')
      }
    } catch {
      toast.error('Erro de conexão.')
    } finally {
      setCarregando(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const handleVincularMedicamento = (idx: number, valor: string) => {
    setItens((prev) =>
      prev.map((it, i) => {
        if (i !== idx) return it
        if (valor === '__NOVO__') {
          return { ...it, medicamentoId: null, criarNovo: true }
        }
        return { ...it, medicamentoId: valor || null, criarNovo: false }
      })
    )
  }

  const handleAutoCadastrarTodosIneditos = () => {
    setItens((prev) =>
      prev.map((it) =>
        !it.medicamentoId
          ? { ...it, medicamentoId: null, criarNovo: true }
          : it
      )
    )
    toast.success('Itens não vinculados serão cadastrados automaticamente no catálogo.')
  }

  const itensSemAcao = itens.filter((i) => !i.medicamentoId && !i.criarNovo)
  const podeConfirmar = cabecalho && !cabecalho.jaImportada && itens.length > 0 && itensSemAcao.length === 0

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
            medicamentoId: it.medicamentoId ?? null,
            criarNovo: Boolean(it.criarNovo),
            quantidade: it.quantidade,
            custoUnitario: it.valorUnitario,
            lote: it.lote,
            validade: it.validade,
            descricaoXml: it.descricao,
            codigoEan: it.codigoEan ?? null,
            codigoAnvisa: it.codigoAnvisa ?? null,
            unidadeComercial: it.unidadeComercial ?? null,
          })),
        }),
      })
      const json = await res.json()
      if (!res.ok || !json?.sucesso) {
        toast.error(json?.erro ?? 'Falha ao confirmar entrada.')
        return
      }
      toast.success('Entrada importada e novos medicamentos cadastrados no catálogo!')
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
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" aria-hidden />
                Confirmação prévia — NF {cabecalho.numeroNota}
              </p>
              {cabecalho.jaImportada ? (
                <p className="text-xs text-red-700 mt-1 flex items-center gap-1">
                  <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
                  Esta nota já foi importada anteriormente.
                </p>
              ) : null}
            </div>

            {itensSemAcao.length > 0 ? (
              <button
                type="button"
                onClick={handleAutoCadastrarTodosIneditos}
                className="text-xs font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 px-3 py-1.5 rounded-xl transition-colors border border-emerald-300"
              >
                ✨ Auto-cadastrar Inéditos no Catálogo ({itensSemAcao.length})
              </button>
            ) : null}
          </div>

          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-slate-50/50 dark:bg-slate-950/40">
            <div>
              <span className="text-slate-500 dark:text-slate-400">Fornecedor:</span>{' '}
              <span className="font-medium text-slate-900 dark:text-slate-100">{cabecalho.fornecedorNome ?? '—'}</span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400">CNPJ:</span>{' '}
              <span className="font-mono text-slate-900 dark:text-slate-100">{cabecalho.fornecedorCnpj ?? '—'}</span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400">Série:</span> <span className="text-slate-900 dark:text-slate-100">{cabecalho.serie ?? '—'}</span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400">Emissão:</span> <span className="text-slate-900 dark:text-slate-100">{cabecalho.emitidaEm ?? '—'}</span>
            </div>

            {cabecalho.fornecedorCnpj && cabecalho.fornecedorNome ? (
              <div className="md:col-span-2 pt-2 flex items-center justify-between border-t border-slate-200 dark:border-slate-800">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <Truck className="h-3.5 w-3.5 text-primary" />
                  Cadastre o fornecedor emitente no catálogo para histórico de compras:
                </span>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const res = await fetch('/api/farmacia/fornecedores', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          razaoSocial: cabecalho.fornecedorNome,
                          cnpj: cabecalho.fornecedorCnpj,
                        }),
                      })
                      const json = await res.json()
                      if (json.sucesso) {
                        toast.success(`Fornecedor "${cabecalho.fornecedorNome}" cadastrado com sucesso!`)
                      } else {
                        toast.info(json.erro ?? 'Fornecedor já cadastrado no sistema.')
                      }
                    } catch {
                      toast.error('Erro ao cadastrar fornecedor.')
                    }
                  }}
                  className="text-xs font-bold text-primary hover:underline"
                >
                  + Auto-cadastrar Fornecedor
                </button>
              </div>
            ) : null}
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

          <div className="divide-y divide-slate-100 dark:divide-slate-800 border-t border-slate-200 dark:border-slate-800">
            {itens.map((it, idx) => (
              <div key={idx} className="p-4 grid grid-cols-1 md:grid-cols-12 gap-3 items-end hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                <div className="md:col-span-4">
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{it.descricao}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Qtde {it.quantidade}
                    {it.lote ? ` • Lote ${it.lote}` : ''}
                    {it.validade ? ` • Val. ${it.validade}` : ''}
                  </p>
                  {it.codigoEan ? <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500">EAN: {it.codigoEan}</p> : null}
                </div>
                <div className="md:col-span-5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Medicamento no catálogo</label>
                  <select
                    value={it.criarNovo ? '__NOVO__' : (it.medicamentoId ?? '')}
                    onChange={(e) => handleVincularMedicamento(idx, e.target.value)}
                    className={`mt-1 w-full rounded-xl border px-3 py-2 text-sm font-medium ${
                      it.criarNovo
                        ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 font-bold'
                        : 'border-slate-200 dark:border-slate-800 bg-background text-foreground'
                    }`}
                    aria-label={`Vincular medicamento item ${it.indice}`}
                  >
                    <option value="">Selecione a ação…</option>
                    <option value="__NOVO__">➕ [Cadastrar Novo Medicamento no Catálogo]</option>
                    {it.medicamentoSugerido ? (
                      <option value={it.medicamentoSugerido.id}>
                        ★ {it.medicamentoSugerido.nome} — {it.medicamentoSugerido.principioAtivo} (Sugerido)
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
                  {it.criarNovo ? (
                    <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200 block text-center">
                      ➕ Será Criado no Catálogo
                    </span>
                  ) : !it.medicamentoId ? (
                    <span className="text-[11px] text-red-700 font-semibold bg-red-50 px-2 py-1 rounded-lg border border-red-200 block text-center">
                      Ação pendente
                    </span>
                  ) : (
                    <span className="text-[11px] text-green-700 font-semibold bg-green-50 px-2 py-1 rounded-lg border border-green-200 block text-center">
                      ✓ Vinculado
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-slate-200 bg-slate-50">
            {itensSemAcao.length > 0 ? (
              <p className="text-xs font-semibold text-amber-800 mb-3">
                ⚠️ {itensSemAcao.length} item(ns) ainda não vinculados. Clique em "✨ Auto-cadastrar Inéditos" ou selecione a ação para cada um.
              </p>
            ) : null}
            <button
              type="button"
              onClick={handleConfirmar}
              disabled={!podeConfirmar || confirmando}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary text-white px-4 py-2.5 text-sm font-bold hover:brightness-95 disabled:opacity-50 shadow-md"
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
