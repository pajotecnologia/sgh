'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

type Tipo = 'UTI' | 'ENFERMARIA' | 'ISOLAMENTO' | 'OBSERVACAO'
type Status = 'DISPONIVEL' | 'OCUPADO' | 'INTERDITADO'
type ClinicaOpcao = { id: string; nome: string }

const inputCls =
  'mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary'

const labelCls = 'text-xs font-medium text-muted-foreground'

export function FormularioLeito({
  modo,
  leitoInicial,
}: {
  modo: 'criar' | 'editar'
  leitoInicial?: {
    id: string
    clinicaId: string
    ala: string
    quarto: string
    codigo: string
    tipo: Tipo
    status?: Status
    ativo: boolean
    observacoes: string
  }
}) {
  const router = useRouter()
  const [clinicaId, setClinicaId] = useState(leitoInicial?.clinicaId ?? '')
  const [clinicas, setClinicas] = useState<ClinicaOpcao[]>([])
  const [ala, setAla] = useState(leitoInicial?.ala ?? '')
  const [quarto, setQuarto] = useState(leitoInicial?.quarto ?? '')
  const [codigo, setCodigo] = useState(leitoInicial?.codigo ?? '')
  const [tipo, setTipo] = useState<Tipo>(leitoInicial?.tipo ?? 'ENFERMARIA')
  const [status, setStatus] = useState<Status>(leitoInicial?.status ?? 'DISPONIVEL')
  const [ativo, setAtivo] = useState(leitoInicial?.ativo ?? true)
  const [observacoes, setObservacoes] = useState(leitoInicial?.observacoes ?? '')
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    fetch('/api/cadastros/clinicas')
      .then((r) => r.json())
      .then((j) => {
        if (j?.sucesso) setClinicas(j.dados)
      })
      .catch(() => {})
  }, [])

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault()
    setSalvando(true)
    try {
      const payload = {
        clinicaId: clinicaId || null,
        ala,
        quarto: quarto.trim() || null,
        codigo,
        tipo,
        status,
        ativo,
        observacoes: observacoes.trim() || null,
      }
      const url = modo === 'criar' ? '/api/cadastros/leitos' : `/api/cadastros/leitos/${leitoInicial?.id}`
      const method = modo === 'criar' ? 'POST' : 'PATCH'

      const res = await fetch(url, {
        method,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok || !json?.sucesso) {
        toast.error(json?.erro ?? 'Falha ao salvar leito.')
        return
      }
      toast.success('Leito salvo.')
      router.push('/cadastros/leitos')
      router.refresh()
    } catch {
      toast.error('Erro de conexão.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <form onSubmit={handleSalvar} className="bg-card border border-border rounded-xl p-4 sm:p-5 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="md:col-span-3">
          <label className={labelCls}>Clínica de internação</label>
          <select
            value={clinicaId}
            onChange={(e) => setClinicaId(e.target.value)}
            className={inputCls}
            aria-label="Clínica de internação"
          >
            <option value="">— Selecione a clínica —</option>
            {clinicas.map((cl) => (
              <option key={cl.id} value={cl.id}>{cl.nome}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>Ala</label>
          <input
            value={ala}
            onChange={(e) => setAla(e.target.value)}
            className={inputCls}
            required
          />
        </div>
        <div>
          <label className={labelCls}>Código do leito</label>
          <input
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            className={inputCls}
            placeholder="Ex.: 01, A-12, UTI-03"
            required
          />
        </div>
        <div>
          <label className={labelCls}>Quarto (opcional)</label>
          <input
            value={quarto}
            onChange={(e) => setQuarto(e.target.value)}
            className={inputCls}
            placeholder="Ex.: 101"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
        <div>
          <label className={labelCls}>Tipo</label>
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value as Tipo)}
            className={inputCls}
            aria-label="Tipo de leito"
          >
            <option value="ENFERMARIA">Enfermaria</option>
            <option value="UTI">UTI</option>
            <option value="ISOLAMENTO">Isolamento</option>
            <option value="OBSERVACAO">Observação</option>
          </select>
        </div>

        <div>
          <label className={labelCls}>Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as Status)}
            className={inputCls}
            aria-label="Status do leito"
          >
            <option value="DISPONIVEL">Disponível</option>
            <option value="OCUPADO">Ocupado</option>
            <option value="INTERDITADO">Interditado</option>
          </select>
        </div>

        <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <input
            type="checkbox"
            checked={ativo}
            onChange={(e) => setAtivo(e.target.checked)}
            className="h-4 w-4 rounded border-input accent-primary"
            aria-label="Leito ativo"
          />
          Leito ativo
        </label>

        <button
          type="submit"
          disabled={salvando}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {salvando ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
          Salvar
        </button>
      </div>

      <div>
        <label className={labelCls}>Observações (opcional)</label>
        <input
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          className={inputCls}
        />
      </div>
    </form>
  )
}
