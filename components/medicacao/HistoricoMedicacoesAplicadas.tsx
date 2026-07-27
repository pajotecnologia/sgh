import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'
import { nomeCompletoParaExibicao } from '@/lib/nome-paciente-exibicao'
import { numeroProntuarioExibicao, montarQueryMedicacao } from '@/lib/medicacao-pesquisa'
import { ListaHistoricoAplicadasCompacta } from '@/components/medicacao/ListaHistoricoAplicadasCompacta'

export type RegistroAplicacaoMedicacao = {
  id: string
  doseAplicada: string
  via: string
  aplicadoEm: Date
  observacoes: string | null
  checklistConfirmado: unknown
  aplicadoPor: { nome: string; role: string }
  itemPrescricao: {
    nomeMedicamento: string
    dose: string
    via: string
    frequencia: string
    status: string
    observacoes: string | null
    prescricao: {
      numeroPrescricao: number
      emitidaEm: Date
      observacoes: string | null
      prontuario: {
        atendimento: {
          id: string
          numeroAtendimento: string
          status: string
          createdAt: Date
          paciente: {
            nomeExibicao: string
            nomeCriptografado: string
            cns: string | null
          }
          triagem: { corClassificacao: string } | null
          medico: { nome: string } | null
        }
      }
    }
  }
}

export type GrupoPacienteAplicadas = {
  atendimentoId: string
  numeroAtendimento: string
  numeroProntuario: string
  dataAtendimento: Date
  nomePaciente: string
  corTriagem: string | null
  status: string
  medicoNome: string | null
  totalAplicacoes: number
  aplicacoes: RegistroAplicacaoMedicacao[]
}

export function agruparPorPaciente(aplicacoes: RegistroAplicacaoMedicacao[]): GrupoPacienteAplicadas[] {
  const mapa = new Map<string, GrupoPacienteAplicadas>()

  for (const ap of aplicacoes) {
    const at = ap.itemPrescricao.prescricao.prontuario.atendimento
    const existente = mapa.get(at.id)

    if (existente) {
      existente.aplicacoes.push(ap)
      existente.totalAplicacoes += 1
      continue
    }

    mapa.set(at.id, {
      atendimentoId: at.id,
      numeroAtendimento: at.numeroAtendimento,
      numeroProntuario: numeroProntuarioExibicao(at.numeroAtendimento),
      dataAtendimento: at.createdAt,
      nomePaciente: nomeCompletoParaExibicao(
        at.paciente.nomeExibicao,
        at.paciente.nomeCriptografado
      ),
      corTriagem: at.triagem?.corClassificacao ?? null,
      status: at.status,
      medicoNome: at.medico?.nome ?? null,
      totalAplicacoes: 1,
      aplicacoes: [ap],
    })
  }

  const grupos = Array.from(mapa.values())
  for (const g of grupos) {
    g.aplicacoes.sort((a, b) => b.aplicadoEm.getTime() - a.aplicadoEm.getTime())
  }
  return grupos.sort((a, b) => {
    const tA = a.aplicacoes[0]?.aplicadoEm.getTime() ?? 0
    const tB = b.aplicacoes[0]?.aplicadoEm.getTime() ?? 0
    return tB - tA
  })
}

export function HistoricoMedicacoesAplicadas({
  aplicacoes,
  gruposIniciais,
  totalGrupos,
  diasFiltro,
  termoPesquisa = '',
  dataPesquisa = '',
  temPesquisa = false,
}: {
  aplicacoes?: RegistroAplicacaoMedicacao[]
  gruposIniciais?: GrupoPacienteAplicadas[]
  totalGrupos?: number
  diasFiltro: number
  termoPesquisa?: string
  dataPesquisa?: string
  temPesquisa?: boolean
}) {
  const opcoesDias = [
    { valor: 1, label: 'Hoje' },
    { valor: 7, label: '7 dias' },
    { valor: 30, label: '30 dias' },
    { valor: 90, label: '90 dias' },
  ]

  const listaAplicacoes = aplicacoes ?? []
  const totalLista = totalGrupos ?? listaAplicacoes.length

  if (totalLista === 0 && !gruposIniciais?.length) {
    return (
      <div className="space-y-3">
        <FiltroPeriodo
          diasFiltro={diasFiltro}
          opcoesDias={opcoesDias}
          termoPesquisa={termoPesquisa}
          dataPesquisa={dataPesquisa}
        />
        <div className="bg-card border border-border rounded-lg p-8 text-center text-xs text-muted-foreground">
          <CheckCircle2 className="h-10 w-10 mx-auto mb-3 text-emerald-500/40" />
          <p className="font-medium text-foreground mb-1">
            {temPesquisa ? 'Nenhum resultado na pesquisa' : 'Nenhuma aplicação no período'}
          </p>
          <p>
            {temPesquisa
              ? 'Ajuste o nome, prontuário ou data do atendimento e tente novamente.'
              : `Não há medicações registradas nos últimos ${diasFiltro} dia${diasFiltro !== 1 ? 's' : ''}.`}
          </p>
        </div>
      </div>
    )
  }

  const grupos = gruposIniciais ?? agruparPorPaciente(listaAplicacoes)
  const totalPacientes = totalGrupos ?? grupos.length
  const totalAplicacoesExibir = listaAplicacoes.length || grupos.reduce((acc, g) => acc + g.totalAplicacoes, 0)

  return (
    <div className="space-y-3">
      <FiltroPeriodo
        diasFiltro={diasFiltro}
        opcoesDias={opcoesDias}
        termoPesquisa={termoPesquisa}
        dataPesquisa={dataPesquisa}
      />
      <p className="text-[10px] text-muted-foreground">
        {totalPacientes} paciente{totalPacientes !== 1 ? 's' : ''} · {totalAplicacoesExibir}{' '}
        {totalAplicacoesExibir === 1 ? 'aplicação' : 'aplicações'}
        {temPesquisa ? ' (filtrado)' : ''} — clique no nome para ver as medicações
      </p>
      <ListaHistoricoAplicadasCompacta grupos={grupos} />
    </div>
  )
}

function FiltroPeriodo({
  diasFiltro,
  opcoesDias,
  termoPesquisa,
  dataPesquisa,
}: {
  diasFiltro: number
  opcoesDias: { valor: number; label: string }[]
  termoPesquisa?: string
  dataPesquisa?: string
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
        Período:
      </span>
      {opcoesDias.map((op) => (
        <Link
          key={op.valor}
          href={`/medicacao${montarQueryMedicacao({
            aba: 'aplicadas',
            dias: op.valor,
            q: termoPesquisa,
            data: dataPesquisa,
          })}`}
          className={`px-2.5 py-1 rounded-md text-[10px] font-semibold border transition-colors ${
            diasFiltro === op.valor
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-card border-border text-muted-foreground hover:bg-muted/50'
          }`}
        >
          {op.label}
        </Link>
      ))}
    </div>
  )
}
