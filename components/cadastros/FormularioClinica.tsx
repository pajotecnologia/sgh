'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

const inputCls =
  'mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary'

const labelCls = 'text-xs font-medium text-muted-foreground'

export function FormularioClinica({
  modo,
  clinicaInicial,
}: {
  modo: 'criar' | 'editar'
  clinicaInicial?: {
    id: string
    nome: string
    descricao: string
    ativo: boolean
  }
}) {
  const router = useRouter()
  const [nome, setNome] = useState(clinicaInicial?.nome ?? '')
  const [descricao, setDescricao] = useState(clinicaInicial?.descricao ?? '')
  const [ativo, setAtivo] = useState(clinicaInicial?.ativo ?? true)
  const [salvando, setSalvando] = useState(false)

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault()
    setSalvando(true)
    try {
      const payload = {
        nome: nome.trim(),
        descricao: descricao.trim() || null,
        ativo,
      }
      const url = modo === 'criar' ? '/api/cadastros/clinicas' : `/api/cadastros/clinicas/${clinicaInicial?.id}`
      const method = modo === 'criar' ? 'POST' : 'PATCH'

      const res = await fetch(url, {
        method,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok || !json?.sucesso) {
        toast.error(json?.erro ?? 'Falha ao salvar clínica.')
        return
      }
      toast.success('Clínica salva.')
      router.push('/cadastros/clinicas')
      router.refresh()
    } catch {
      toast.error('Erro de conexão.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <form onSubmit={handleSalvar} className="bg-card border border-border rounded-xl p-4 sm:p-5 space-y-4">
      <div>
        <label className={labelCls}>Nome da clínica</label>
        <input
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          className={inputCls}
          placeholder="Ex.: Clínica Médica, Obstétrica, Pediátrica, Cirúrgica"
          required
        />
      </div>

      <div>
        <label className={labelCls}>Descrição (opcional)</label>
        <input
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          className={inputCls}
        />
      </div>

      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <input
            type="checkbox"
            checked={ativo}
            onChange={(e) => setAtivo(e.target.checked)}
            className="h-4 w-4 rounded border-input accent-primary"
            aria-label="Clínica ativa"
          />
          Clínica ativa
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
    </form>
  )
}
