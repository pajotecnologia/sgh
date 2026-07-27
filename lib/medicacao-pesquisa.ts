import type { Prisma } from '@prisma/client'
import { format, parse, isValid, startOfDay, endOfDay } from 'date-fns'

/** Número exibido ao lado do nome (nº do atendimento / ficha do PS) */
export function numeroProntuarioExibicao(numeroAtendimento: string): string {
  return numeroAtendimento
}

export function normalizarTermoPesquisa(termo: string | undefined): string {
  return (termo ?? '').trim()
}

/** Aceita dd/MM/yyyy, dd-MM-yyyy ou yyyy-MM-dd */
export function parseDataPesquisaAtendimento(valor: string | undefined): Date | null {
  const t = (valor ?? '').trim()
  if (!t) return null

  const formatos = ['dd/MM/yyyy', 'dd-MM-yyyy', 'yyyy-MM-dd']
  for (const fmt of formatos) {
    const d = parse(t, fmt, new Date())
    if (isValid(d)) return startOfDay(d)
  }
  return null
}

export function intervaloDiaAtendimento(data: Date): { inicio: Date; fim: Date } {
  return { inicio: startOfDay(data), fim: endOfDay(data) }
}

export function formatarDataAtendimento(data: Date): string {
  return format(data, 'dd/MM/yyyy')
}

/** Filtro Prisma para atendimentos (pendentes e base do histórico) */
export function wherePesquisaAtendimentoMedicacao(
  termo: string | undefined,
  dataStr: string | undefined
): Prisma.AtendimentoWhereInput {
  const q = normalizarTermoPesquisa(termo)
  const data = parseDataPesquisaAtendimento(dataStr)
  const partes: Prisma.AtendimentoWhereInput[] = []

  if (q) {
    partes.push({
      OR: [
        { numeroAtendimento: { contains: q, mode: 'insensitive' } },
        { paciente: { nomeExibicao: { contains: q, mode: 'insensitive' } } },
        { paciente: { cns: { contains: q, mode: 'insensitive' } } },
      ],
    })
  }

  if (data) {
    const { inicio, fim } = intervaloDiaAtendimento(data)
    partes.push({ createdAt: { gte: inicio, lte: fim } })
  }

  if (partes.length === 0) return {}
  return { AND: partes }
}

/** Aplica filtro de atendimento no histórico de aplicações */
export function whereAplicacaoComPesquisaAtendimento(
  base: Prisma.AplicacaoMedicamentoWhereInput,
  termo: string | undefined,
  dataStr: string | undefined
): Prisma.AplicacaoMedicamentoWhereInput {
  const pesquisa = wherePesquisaAtendimentoMedicacao(termo, dataStr)
  if (Object.keys(pesquisa).length === 0) return base
  return {
    AND: [
      base,
      {
        itemPrescricao: {
          prescricao: {
            prontuario: {
              atendimento: pesquisa,
            },
          },
        },
      },
    ],
  }
}

export function montarQueryMedicacao(params: {
  aba?: string
  dias?: number
  q?: string
  data?: string
}): string {
  const sp = new URLSearchParams()
  if (params.aba) sp.set('aba', params.aba)
  if (params.aba === 'aplicadas' && params.dias != null) sp.set('dias', String(params.dias))
  const q = normalizarTermoPesquisa(params.q)
  if (q) sp.set('q', q)
  const d = (params.data ?? '').trim()
  if (d) sp.set('data', d)
  const s = sp.toString()
  return s ? `?${s}` : ''
}

export function textoCoincidePesquisaMedicacao(
  termo: string | undefined,
  dataStr: string | undefined,
  item: {
    nomePaciente: string
    numeroProntuario: string
    cns?: string | null
    dataAtendimento: Date | string
  }
): boolean {
  const q = normalizarTermoPesquisa(termo).toLowerCase()
  const dataFiltro = parseDataPesquisaAtendimento(dataStr)

  if (dataFiltro) {
    const dataItem = startOfDay(new Date(item.dataAtendimento))
    if (dataItem.getTime() !== dataFiltro.getTime()) return false
  }

  if (!q) return true

  const campos = [
    item.nomePaciente,
    item.numeroProntuario,
    item.cns ?? '',
  ].map((s) => s.toLowerCase())

  return campos.some((c) => c.includes(q))
}
