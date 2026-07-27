import Link from 'next/link'
import { Pill, ChevronRight, Clock } from 'lucide-react'
import { BadgeManchester } from '@/components/triagem/BadgeManchester'
import { NomePacienteComProntuario } from '@/components/medicacao/NomePacienteComProntuario'
import { formatarDataAtendimento } from '@/lib/medicacao-pesquisa'
import { LABEL_STATUS_ATENDIMENTO, LABEL_VIA } from '@/lib/fila-medicacao'
import type { CorTriagem } from '@/types'

type ItemPendente = {
  id: string
  nomeMedicamento: string
  dose: string
  via: string
  frequencia: string
}

type PacientePendente = {
  atendimentoId: string
  numeroAtendimento: string
  numeroProntuario: string
  dataAtendimento: Date
  status: string
  nomePaciente: string
  corTriagem: string | null
  medicoNome: string | null
  totalPendentes: number
  medicamentos: ItemPendente[]
}

export function ListaMedicacaoPendente({
  fila,
  temPesquisa = false,
}: {
  fila: PacientePendente[]
  temPesquisa?: boolean
}) {
  if (fila.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-8 text-center text-xs text-muted-foreground">
        <Pill className="h-10 w-10 mx-auto mb-3 opacity-30" />
        <p className="font-medium text-foreground mb-1">
          {temPesquisa ? 'Nenhum resultado na pesquisa' : 'Nenhuma medicação pendente'}
        </p>
        <p>
          {temPesquisa
            ? 'Ajuste o nome, prontuário ou data do atendimento e tente novamente.'
            : 'Quando o médico prescrever medicamentos no atendimento, o paciente aparecerá aqui para aplicação pela equipe de enfermagem.'}
        </p>
      </div>
    )
  }

  return (
    <ul className="space-y-2">
      {fila.map((a) => (
        <li key={a.atendimentoId}>
          <Link
            href={`/medicacao/${a.atendimentoId}`}
            className="block p-3 rounded-lg border border-border bg-card hover:border-primary/40 hover:bg-muted/20 transition-colors"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="min-w-0 flex-1">
                <NomePacienteComProntuario
                  nome={a.nomePaciente}
                  numeroProntuario={a.numeroProntuario}
                  nomeClassName="text-xs"
                />
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Atend. {formatarDataAtendimento(a.dataAtendimento)}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                {a.corTriagem ? <BadgeManchester cor={a.corTriagem as CorTriagem} size="sm" /> : null}
                <span className="text-[9px] font-semibold text-amber-800 dark:text-amber-200 bg-amber-100 dark:bg-amber-950/80 px-1.5 py-0.5 rounded">
                  {a.totalPendentes} pend.
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 text-[10px] text-muted-foreground mb-2">
              <span className="px-1.5 py-0.5 bg-muted rounded font-medium">
                {LABEL_STATUS_ATENDIMENTO[a.status as keyof typeof LABEL_STATUS_ATENDIMENTO] ??
                  a.status}
              </span>
              {a.medicoNome && <span>Dr(a). {a.medicoNome.split(' ')[0]}</span>}
            </div>

            <ul className="space-y-1 border-t border-border pt-2">
              {a.medicamentos.slice(0, 4).map((it) => (
                <li key={it.id} className="flex items-center gap-2 text-[10px]">
                  <Pill className="h-3 w-3 text-primary shrink-0" />
                  <span className="font-medium text-foreground truncate flex-1">{it.nomeMedicamento}</span>
                  <span className="text-muted-foreground shrink-0">
                    {it.dose} · {LABEL_VIA[it.via] ?? it.via}
                  </span>
                </li>
              ))}
              {a.medicamentos.length > 4 && (
                <li className="text-[10px] text-muted-foreground pl-5">
                  + {a.medicamentos.length - 4} outro{a.medicamentos.length - 4 !== 1 ? 's' : ''}
                </li>
              )}
            </ul>

            <div className="flex items-center justify-between mt-2 pt-2 border-t border-dashed border-border">
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Registrar aplicação (5 certos)
              </span>
              <ChevronRight className="h-4 w-4 text-primary" aria-hidden />
            </div>
          </Link>
        </li>
      ))}
    </ul>
  )
}
