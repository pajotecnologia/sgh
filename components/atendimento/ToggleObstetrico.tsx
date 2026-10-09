'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Baby, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

import { useRouter } from 'next/navigation'

export function ToggleObstetrico({
  atendimentoId,
  inicial,
  sexoBiologico,
  onAlterado,
}: {
  atendimentoId: string
  inicial?: boolean
  sexoBiologico?: string
  onAlterado?: (novo: boolean) => void
}) {
  const router = useRouter()
  const [obstetrico, setObstetrico] = useState(Boolean(inicial))
  const [salvando, setSalvando] = useState(false)

  const sexoNorm = String(sexoBiologico ?? '').toUpperCase()
  const podeMarcar = sexoNorm === 'FEMININO' || sexoNorm === 'F'

  const alternar = async () => {
    if (!podeMarcar) {
      toast.error('Atendimento obstétrico é restrito exclusivamente a pacientes do sexo biológico feminino.')
      return
    }
    const novo = !obstetrico
    setObstetrico(novo)
    setSalvando(true)
    try {
      const res = await fetch(`/api/atendimento/${atendimentoId}/obstetrico`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ obstetrico: novo }),
      })
      const json = await res.json()
      if (!json.sucesso) {
        setObstetrico(!novo)
        toast.error(json.erro ?? 'Erro ao atualizar.')
        return
      }
      toast.success(novo ? 'Marcado como obstétrico.' : 'Desmarcado obstétrico.')
      onAlterado?.(novo)
      router.refresh()
    } catch {
      setObstetrico(!novo)
      toast.error('Erro de conexão.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <button
      type="button"
      onClick={alternar}
      disabled={salvando || !podeMarcar}
      aria-pressed={obstetrico}
      title={
        !podeMarcar
          ? 'Atendimento obstétrico restrito a pacientes do sexo feminino'
          : obstetrico
          ? 'Desmarcar atendimento obstétrico'
          : 'Marcar como atendimento obstétrico'
      }
      className={cn(
        'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed',
        obstetrico
          ? 'border-pink-500 bg-pink-500/15 text-pink-900 dark:text-pink-100'
          : 'border-border hover:bg-muted/50'
      )}
    >
      {salvando ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Baby className="h-3.5 w-3.5" />}
      {obstetrico ? 'Atendimento obstétrico' : 'Marcar obstétrico'}
      {!podeMarcar && <span className="text-[10px] text-muted-foreground">(somente feminino)</span>}
    </button>
  )
}
