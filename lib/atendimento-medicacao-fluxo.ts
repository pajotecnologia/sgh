type ItemPrescricaoPs = {
  status?: string
  aplicacoes?: { aplicadoEm: string | Date }[]
}

type PrescricaoAtendimento = {
  tipo?: string
  itens?: ItemPrescricaoPs[]
}

type EvolucaoAtendimento = {
  registradoEm: string | Date
}

export type FluxoMedicacaoAtendimento = {
  /** Há itens PS aguardando aplicação pela enfermagem */
  aguardandoRetornoMedicacao: boolean
  /** Medicação já aplicada — falta evolução médica pós-uso */
  precisaEvolucaoPosMedicacao: boolean
  /** Pode exibir Finalizar Atendimento (alta do PS) */
  podeFinalizarAtendimento: boolean
  qtdPendentes: number
  qtdAplicados: number
}

function itensPrescricaoPs(prescricoes: PrescricaoAtendimento[]) {
  return (prescricoes ?? [])
    .filter((p) => (p.tipo ?? 'PS') === 'PS')
    .flatMap((p) => p.itens ?? [])
}

function obterUltimaAplicacao(itens: ItemPrescricaoPs[]): Date | null {
  let ultima: Date | null = null
  for (const item of itens) {
    for (const ap of item.aplicacoes ?? []) {
      const d = new Date(ap.aplicadoEm)
      if (Number.isNaN(d.getTime())) continue
      if (!ultima || d > ultima) ultima = d
    }
  }
  return ultima
}

function obterUltimaEvolucao(evolucoes: EvolucaoAtendimento[]): Date | null {
  if (!evolucoes.length) return null
  let ultima: Date | null = null
  for (const ev of evolucoes) {
    const d = new Date(ev.registradoEm)
    if (Number.isNaN(d.getTime())) continue
    if (!ultima || d > ultima) ultima = d
  }
  return ultima
}

/** Regras de finalização do atendimento médico quando há prescrição PS para uso no setor */
export function analisarFluxoMedicacaoAtendimento(
  prescricoes: PrescricaoAtendimento[],
  evolucoes: EvolucaoAtendimento[]
): FluxoMedicacaoAtendimento {
  const itens = itensPrescricaoPs(prescricoes)
  const pendentes = itens.filter((i) => i.status === 'PENDENTE')
  const aplicados = itens.filter(
    (i) => i.status === 'APLICADO' || (i.aplicacoes?.length ?? 0) > 0
  )

  if (itens.length === 0) {
    return {
      aguardandoRetornoMedicacao: false,
      precisaEvolucaoPosMedicacao: false,
      podeFinalizarAtendimento: true,
      qtdPendentes: 0,
      qtdAplicados: 0,
    }
  }

  if (pendentes.length > 0) {
    return {
      aguardandoRetornoMedicacao: true,
      precisaEvolucaoPosMedicacao: false,
      podeFinalizarAtendimento: false,
      qtdPendentes: pendentes.length,
      qtdAplicados: aplicados.length,
    }
  }

  const ultimaAplicacao = obterUltimaAplicacao(itens)
  const houveAplicacao = aplicados.length > 0 && ultimaAplicacao !== null

  if (houveAplicacao) {
    const ultimaEvolucao = obterUltimaEvolucao(evolucoes)
    const evolucaoPosMedicacaoOk =
      ultimaEvolucao !== null && ultimaEvolucao.getTime() >= ultimaAplicacao.getTime()

    if (!evolucaoPosMedicacaoOk) {
      return {
        aguardandoRetornoMedicacao: false,
        precisaEvolucaoPosMedicacao: true,
        podeFinalizarAtendimento: false,
        qtdPendentes: 0,
        qtdAplicados: aplicados.length,
      }
    }
  }

  return {
    aguardandoRetornoMedicacao: false,
    precisaEvolucaoPosMedicacao: false,
    podeFinalizarAtendimento: true,
    qtdPendentes: 0,
    qtdAplicados: aplicados.length,
  }
}
