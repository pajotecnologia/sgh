'use client'

import { useCallback, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { ClipboardList, Loader2, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { mapItensPrescricaoMedicaPadraoParaForm } from '@/lib/prescricao-medica-padrao-map'
import type { ColunasPrescricaoModelo } from '@/lib/prescricao-modelo-colunas'
import { colunasPrescricaoFromModelo } from '@/lib/prescricao-modelo-colunas'
import { podeLerModelosPrescricaoMedica } from '@/lib/prescricoes-medicas-padrao'
import type { CriarPrescricaoForm } from '@/lib/validations/atendimento'

type ModeloResumo = {
  id: string
  nome: string
  descricao?: string | null
  observacoesPadrao?: string | null
  nomeColunaEsquerda?: string | null
  nomeColunaDireita?: string | null
  itens: {
    ordem: number
    nomeMedicamento: string
    principioAtivo?: string | null
    dose: string
    unidadeMedida?: string | null
    via: string
    frequencia: string
    quantidadeSolicitada: number
    duracaoDias?: number | null
    observacoes?: string | null
  }[]
}

type SeletorPrescricaoMedicaPadraoProps = {
  onCarregar: (
    itens: CriarPrescricaoForm['itens'],
    observacoes?: string,
    colunas?: ColunasPrescricaoModelo
  ) => void
  disabled?: boolean
}

export function SeletorPrescricaoMedicaPadrao({
  onCarregar,
  disabled = false,
}: SeletorPrescricaoMedicaPadraoProps) {
  const { data: sessao, status } = useSession()
  const role = sessao?.usuario?.role ?? ''
  const podePrescrever = podeLerModelosPrescricaoMedica(role)

  const [modelos, setModelos] = useState<ModeloResumo[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [modeloId, setModeloId] = useState('')
  const [aplicando, setAplicando] = useState(false)

  const buscarModelos = useCallback(async () => {
    if (!podePrescrever) {
      setCarregando(false)
      return
    }

    setCarregando(true)
    setErro(null)

    try {
      const res = await fetch('/api/prescricoes-medicas/modelos', { cache: 'no-store' })
      const json = await res.json()

      if (!res.ok || !json?.sucesso) {
        const msg = json?.erro ?? `Falha ao carregar modelos (${res.status}).`
        setErro(msg)
        setModelos([])
        toast.error(msg)
        return
      }

      setModelos(Array.isArray(json.dados) ? json.dados : [])
    } catch {
      const msg = 'Não foi possível carregar prescrições padrão.'
      setErro(msg)
      setModelos([])
      toast.error(msg)
    } finally {
      setCarregando(false)
    }
  }, [podePrescrever])

  useEffect(() => {
    if (status === 'loading') return
    if (status !== 'authenticated') {
      setCarregando(false)
      setErro('Sessão não autenticada.')
      return
    }
    void buscarModelos()
  }, [status, buscarModelos])

  const handleCarregar = () => {
    if (!modeloId) {
      toast.error('Selecione uma prescrição padrão.')
      return
    }
    const modelo = modelos.find((m) => m.id === modeloId)
    if (!modelo) return

    setAplicando(true)
    const itens = mapItensPrescricaoMedicaPadraoParaForm(modelo.itens)
    if (!itens.length) {
      toast.error('Este modelo não possui medicamentos.')
      setAplicando(false)
      return
    }
    onCarregar(
      itens,
      modelo.observacoesPadrao?.trim() || undefined,
      colunasPrescricaoFromModelo(modelo)
    )
    toast.success(`Modelo "${modelo.nome}" carregado. Ajuste os itens se necessário.`)
    setAplicando(false)
  }

  if (status === 'loading' || carregando) {
    return (
      <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
        Carregando prescrições cadastradas…
      </div>
    )
  }

  if (!podePrescrever) {
    return null
  }

  if (erro) {
    return (
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-destructive">{erro}</span>
        <button
          type="button"
          onClick={() => void buscarModelos()}
          className="inline-flex items-center gap-1 text-primary font-semibold hover:underline"
        >
          <RefreshCw className="h-3 w-3" aria-hidden />
          Tentar novamente
        </button>
      </div>
    )
  }

  if (modelos.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        Nenhuma prescrição padrão ativa. Cadastre em Cadastros → Prescrições Médicas.
      </p>
    )
  }

  const modeloSelecionado = modelos.find((m) => m.id === modeloId)

  return (
    <div className="flex flex-col sm:flex-row sm:items-end gap-2 w-full sm:w-auto">
      <div className="min-w-[220px] flex-1 sm:flex-initial">
        <label htmlFor="select-prescricao-padrao" className="sr-only">
          Prescrição cadastrada
        </label>
        <select
          id="select-prescricao-padrao"
          value={modeloId}
          onChange={(e) => setModeloId(e.target.value)}
          disabled={disabled}
          className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium outline-none focus:ring-2 focus:ring-primary/30"
          aria-label="Selecionar prescrição cadastrada"
        >
          <option value="">Prescrição cadastrada…</option>
          {modelos.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nome} ({m.itens.length} {m.itens.length === 1 ? 'item' : 'itens'})
            </option>
          ))}
        </select>
        {modeloSelecionado?.descricao?.trim() ? (
          <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">{modeloSelecionado.descricao}</p>
        ) : null}
      </div>
      <button
        type="button"
        onClick={handleCarregar}
        disabled={disabled || !modeloId || aplicando}
        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary/40 bg-primary/5 text-xs font-semibold text-primary hover:bg-primary/10 transition-colors disabled:opacity-40"
        aria-label="Carregar prescrição cadastrada selecionada"
      >
        {aplicando ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
        ) : (
          <ClipboardList className="h-3.5 w-3.5" aria-hidden />
        )}
        Usar prescrição
      </button>
    </div>
  )
}
