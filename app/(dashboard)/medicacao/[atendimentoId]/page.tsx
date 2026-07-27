'use client'

import { use, useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2, Pill, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { FormularioAplicacaoMedicamento } from '@/components/enfermagem/FormularioAplicacaoMedicamento'
import { NomePacienteComProntuario } from '@/components/medicacao/NomePacienteComProntuario'
import { numeroProntuarioExibicao } from '@/lib/medicacao-pesquisa'
import { BadgeManchester } from '@/components/triagem/BadgeManchester'
import { LABEL_STATUS_ATENDIMENTO, LABEL_VIA } from '@/lib/fila-medicacao'
import type { CorTriagem } from '@/types'

type ItemPrescricao = {
  id: string
  nomeMedicamento: string
  dose: string
  via: string
  frequencia: string
  status: string
  observacoes?: string | null
}

type AplicacaoRegistro = {
  id: string
  doseAplicada: string
  via: string
  aplicadoEm: string
  aplicadoPor: { nome: string }
  itemPrescricao: { nomeMedicamento: string }
}

export default function PaginaMedicacaoAtendimento({
  params,
}: {
  params: Promise<{ atendimentoId: string }>
}) {
  const { atendimentoId } = use(params)
  const [dados, setDados] = useState<{
    atendimento: {
      id: string
      numeroAtendimento: string
      status: string
      paciente: { nomeExibicao: string }
      triagem?: { corClassificacao: string } | null
      medico?: { nome: string } | null
    }
    prontuario: {
      prescricoes: { itens: ItemPrescricao[] }[]
    }
    aplicacoesRecentes?: AplicacaoRegistro[]
  } | null>(null)
  const [carregando, setCarregando] = useState(true)

  const carregar = useCallback(async () => {
    setCarregando(true)
    try {
      const res = await fetch(`/api/medicacao/${atendimentoId}`, { cache: 'no-store' })
      const json = await res.json()
      if (!json.sucesso) {
        toast.error(json.erro ?? 'Erro ao carregar dados.')
        setDados(null)
        return
      }
      setDados(json.dados)
    } catch {
      toast.error('Erro de conexão.')
      setDados(null)
    } finally {
      setCarregando(false)
    }
  }, [atendimentoId])

  useEffect(() => {
    carregar()
  }, [carregar])

  if (carregando) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3 text-muted-foreground text-xs">
        <Loader2 className="h-7 w-7 animate-spin" />
        <p>Carregando prescrições…</p>
      </div>
    )
  }

  if (!dados) {
    return (
      <div className="max-w-lg mx-auto p-6">
        <Link href="/medicacao" className="text-xs text-primary hover:underline">
          ← Voltar à Medicação
        </Link>
        <p className="mt-4 text-xs text-muted-foreground">Não foi possível carregar o atendimento.</p>
      </div>
    )
  }

  const { atendimento, prontuario, aplicacoesRecentes } = dados
  const itensPendentes = (prontuario.prescricoes ?? []).flatMap((pr) =>
    (pr.itens ?? []).filter((it) => it.status === 'PENDENTE')
  )

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-12">
      <Link
        href="/medicacao"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Voltar à Medicação
      </Link>

      <div className="bg-card border border-border rounded-lg p-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <h1 className="text-base font-bold">
              <NomePacienteComProntuario
                nome={atendimento.paciente.nomeExibicao}
                numeroProntuario={numeroProntuarioExibicao(atendimento.numeroAtendimento)}
                nomeClassName="text-base"
              />
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 shrink-0">
            {atendimento.triagem?.corClassificacao ? (
              <BadgeManchester cor={atendimento.triagem.corClassificacao as CorTriagem} size="sm" />
            ) : null}
            <span className="text-[10px] font-medium px-1.5 py-0.5 bg-muted rounded">
              {LABEL_STATUS_ATENDIMENTO[atendimento.status as keyof typeof LABEL_STATUS_ATENDIMENTO] ??
                atendimento.status}
            </span>
          </div>
        </div>
        {atendimento.medico?.nome && (
          <p className="text-[10px] text-muted-foreground mt-2">
            Prescrito por: <strong>{atendimento.medico.nome}</strong>
          </p>
        )}
      </div>

      <section className="space-y-3">
        <h2 className="text-[10px] font-semibold uppercase text-muted-foreground tracking-wider flex items-center gap-1.5">
          <Pill className="h-3.5 w-3.5" />
          Aplicar medicação ({itensPendentes.length} pendente{itensPendentes.length !== 1 ? 's' : ''})
        </h2>

        {itensPendentes.length === 0 ? (
          <div className="border border-dashed border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-lg p-6 text-center">
            <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
            <p className="text-xs font-medium text-emerald-800 dark:text-emerald-200">
              Todas as doses prescritas foram aplicadas.
            </p>
            <Link href="/medicacao" className="text-xs text-primary hover:underline mt-2 inline-block">
              Voltar à lista
            </Link>
          </div>
        ) : (
          itensPendentes.map((it) => (
            <FormularioAplicacaoMedicamento
              key={it.id}
              atendimentoId={atendimentoId}
              contexto="medicacao"
              item={{
                id: it.id,
                nomeMedicamento: it.nomeMedicamento,
                dose: it.dose,
                via: it.via,
                frequencia: it.frequencia,
              }}
              onAplicado={carregar}
            />
          ))
        )}
      </section>

      {aplicacoesRecentes && aplicacoesRecentes.length > 0 && (
        <section>
          <h2 className="text-[10px] font-semibold uppercase text-muted-foreground tracking-wider mb-2">
            Aplicações registradas hoje
          </h2>
          <ul className="divide-y divide-border rounded-lg border border-border bg-card overflow-hidden text-[11px]">
            {aplicacoesRecentes.map((ap) => (
              <li key={ap.id} className="px-3 py-2 flex flex-wrap justify-between gap-1">
                <span className="font-medium">
                  {ap.itemPrescricao.nomeMedicamento} — {ap.doseAplicada} ({LABEL_VIA[ap.via] ?? ap.via})
                </span>
                <span className="text-muted-foreground">
                  {new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(
                    new Date(ap.aplicadoEm)
                  )}{' '}
                  · {ap.aplicadoPor.nome.split(' ')[0]}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
