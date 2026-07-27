import { format, isToday } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export type StatusEvolucaoDia = {
  evoluidoHoje: boolean
  dataHora: Date | null
}

const parseData = (valor: Date | string | null | undefined): Date | null => {
  if (!valor) return null
  const dt = valor instanceof Date ? valor : new Date(valor)
  return Number.isNaN(dt.getTime()) ? null : dt
}

export const obterStatusEvolucaoDia = (
  dataHora: Date | string | null | undefined
): StatusEvolucaoDia => {
  const dt = parseData(dataHora)
  if (!dt) return { evoluidoHoje: false, dataHora: null }
  return { evoluidoHoje: isToday(dt), dataHora: dt }
}

export const obterDataHoraEvolucaoEnfermagem = (
  ficha: { registradoEm: Date | null; updatedAt: Date } | null | undefined
): Date | null => parseData(ficha?.registradoEm ?? ficha?.updatedAt ?? null)

export const formatarDataHoraEvolucao = (dataHora: Date | null): string =>
  dataHora ? format(dataHora, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : '—'

export const statusEvolucaoMedicaLista = (atendimento: {
  prontuario?: { evolucoes?: { registradoEm: Date }[] } | null
}): StatusEvolucaoDia =>
  obterStatusEvolucaoDia(atendimento.prontuario?.evolucoes?.[0]?.registradoEm ?? null)

export const statusEvolucaoEnfermagemLista = (atendimento: {
  fichasEvolucaoTurno?: { registradoEm: Date | null; updatedAt: Date }[]
}): StatusEvolucaoDia =>
  obterStatusEvolucaoDia(obterDataHoraEvolucaoEnfermagem(atendimento.fichasEvolucaoTurno?.[0]))
