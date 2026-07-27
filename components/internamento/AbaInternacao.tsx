'use client'

import { useEffect, useState } from 'react'
import { BedDouble, Loader2 } from 'lucide-react'
import { descricaoLeitoInternacao } from '@/lib/prefill-internamento'
import { FormularioFichaInternacaoAlta } from '@/components/internamento/FormularioFichaInternacaoAlta'
import type { FichaInternacaoAltaPrefill } from '@/lib/ficha-internacao-alta'

type LeitoResumo = {
  ala: string
  quarto: string | null
  codigo: string
  tipo: string
}

export function AbaInternacao({
  atendimentoId,
  numeroAtendimento,
  leitoAtual,
  setorUnidade,
  dataInternacao,
}: {
  atendimentoId: string
  numeroAtendimento: string
  leitoAtual?: LeitoResumo | null
  setorUnidade?: string | null
  dataInternacao?: string | null
}) {
  const [carregando, setCarregando] = useState(true)
  const [prefill, setPrefill] = useState<FichaInternacaoAltaPrefill | null>(null)
  const [fichaStatus, setFichaStatus] = useState<string | undefined>()
  const [statusAtendimento, setStatusAtendimento] = useState('INTERNADO')

  const leitoDescricao = leitoAtual ? descricaoLeitoInternacao(leitoAtual) : ''

  useEffect(() => {
    async function carregar() {
      setCarregando(true)
      try {
        const res = await fetch(`/api/atendimento/${atendimentoId}/ficha-internacao-alta`)
        const json = await res.json()
        if (json.sucesso) {
          setPrefill(json.dados.prefill)
          setFichaStatus(json.dados.ficha?.status)
          setStatusAtendimento(json.dados.paciente?.statusAtendimento ?? 'INTERNADO')
        }
      } finally {
        setCarregando(false)
      }
    }
    carregar()
  }, [atendimentoId])

  return (
    <div className="space-y-4">
      <div className="bg-card border border-primary/20 rounded-xl p-5 shadow-sm space-y-3">
        <div className="flex items-start gap-3">
          <BedDouble className="h-5 w-5 text-primary shrink-0 mt-0.5" aria-hidden />
          <div>
            <p className="text-sm font-semibold text-foreground">Leito definido na admissão</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Leito atribuído pela enfermagem ao confirmar a internação.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-xl border border-border/60 bg-muted/20 p-4 text-sm">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Leito / apartamento
            </p>
            <p className="mt-1 font-medium text-foreground">{leitoDescricao || '— Não definido —'}</p>
          </div>
          {setorUnidade ? (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Setor / unidade
              </p>
              <p className="mt-1 text-foreground">{setorUnidade}</p>
            </div>
          ) : null}
          {dataInternacao ? (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Data da internação
              </p>
              <p className="mt-1 text-foreground">
                {new Date(`${dataInternacao}T12:00:00`).toLocaleDateString('pt-BR')}
              </p>
            </div>
          ) : null}
        </div>
      </div>

      {carregando ? (
        <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
          Carregando ficha de internação…
        </div>
      ) : prefill ? (
        <FormularioFichaInternacaoAlta
          atendimentoId={atendimentoId}
          numeroAtendimento={numeroAtendimento}
          prefill={prefill}
          fichaStatusInicial={fichaStatus}
          statusAtendimento={statusAtendimento}
        />
      ) : (
        <div className="bg-card border border-border rounded-xl p-6 text-center text-muted-foreground text-sm">
          Não foi possível carregar a ficha de internação.
        </div>
      )}
    </div>
  )
}
