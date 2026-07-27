import { prisma } from '@/lib/prisma'
import { whereAguardandoTriagem } from '@/lib/fila-aguardando-triagem'

export type PeriodoDashboard = 'hoje' | '7d' | '30d' | '90d'

export type ItemContagem = {
  label: string
  valor: number
  cor?: string
}

export type SerieTemporal = {
  label: string
  atendimentos: number
  triagens: number
}

export type DashboardEstatisticas = {
  periodo: PeriodoDashboard
  periodoLabel: string
  totalAtendimentos: number
  resumo: {
    pacientesHoje: number
    aguardandoTriagem: number
    emAtendimento: number
    emergencias: number
    triagens: number
    examesSolicitados: number
    altas: number
  }
  faixaEtaria: ItemContagem[]
  sexo: ItemContagem[]
  origem: ItemContagem[]
  categoriaQueixa: ItemContagem[]
  manchester: ItemContagem[]
  exames: ItemContagem[]
  categoriaExame: ItemContagem[]
  statusAtendimento: ItemContagem[]
  convenio: ItemContagem[]
  diagnosticoCid: ItemContagem[]
  atendimentosPorHora: ItemContagem[]
  setor: ItemContagem[]
  evolucaoDiaria: SerieTemporal[]
}

const LABEL_PERIODO: Record<PeriodoDashboard, string> = {
  hoje: 'Hoje',
  '7d': 'Últimos 7 dias',
  '30d': 'Últimos 30 dias',
  '90d': 'Últimos 90 dias',
}

const LABEL_CATEGORIA: Record<string, string> = {
  dor: 'Dor',
  dispneia: 'Dispneia',
  alteracao_consciencia: 'Alt. consciência',
  trauma: 'Trauma',
  febre: 'Febre',
  sangramento: 'Sangramento',
  vomito: 'Vômito',
  outro: 'Outro',
}

const COR_MANCHESTER: Record<string, string> = {
  VERMELHO: '#DC2626',
  LARANJA: '#EA580C',
  AMARELO: '#CA8A04',
  VERDE: '#16A34A',
  AZUL: '#2563EB',
  CINZA: '#6B7280',
}

const LABEL_MANCHESTER: Record<string, string> = {
  VERMELHO: 'Vermelho',
  LARANJA: 'Laranja',
  AMARELO: 'Amarelo',
  VERDE: 'Verde',
  AZUL: 'Azul',
  CINZA: 'Cinza',
}

const LABEL_SEXO: Record<string, string> = {
  MASCULINO: 'Masculino',
  FEMININO: 'Feminino',
  INTERSEXO: 'Intersexo',
}

const LABEL_STATUS: Record<string, string> = {
  AGUARDANDO_TRIAGEM: 'Aguard. triagem',
  EM_TRIAGEM: 'Em triagem',
  AGUARDANDO_ATENDIMENTO: 'Aguard. atendimento',
  EM_ATENDIMENTO: 'Em atendimento',
  CONCLUIDO: 'Concluído',
  AGUARDANDO_INTERNACAO: 'Aguard. internação',
  INTERNADO: 'Internado',
  TRANSFERIDO: 'Transferido',
  ALTA: 'Alta',
  OBITO: 'Óbito',
}

const LABEL_CATEGORIA_EXAME: Record<string, string> = {
  LABORATORIO: 'Laboratório',
  IMAGEM: 'Imagem',
  CARDIOLOGIA: 'Cardiologia',
  PROCEDIMENTO: 'Procedimento',
  OUTRO: 'Outro',
}

export function resolverPeriodo(periodo?: string): PeriodoDashboard {
  if (periodo === '7d' || periodo === '30d' || periodo === '90d' || periodo === 'hoje') {
    return periodo
  }
  return '30d'
}

export function dataInicioPeriodo(periodo: PeriodoDashboard): Date {
  const inicio = new Date()
  inicio.setHours(0, 0, 0, 0)
  if (periodo === 'hoje') return inicio
  const dias = periodo === '7d' ? 7 : periodo === '90d' ? 90 : 30
  inicio.setDate(inicio.getDate() - dias)
  return inicio
}

function incrementar(mapa: Map<string, number>, chave: string, delta = 1) {
  mapa.set(chave, (mapa.get(chave) ?? 0) + delta)
}

function mapaParaLista(
  mapa: Map<string, number>,
  ordenar: 'valor' | 'label' = 'valor',
  limite?: number
): ItemContagem[] {
  const lista = Array.from(mapa.entries()).map(([label, valor]) => ({ label, valor }))
  if (ordenar === 'valor') {
    lista.sort((a, b) => b.valor - a.valor)
  } else {
    lista.sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'))
  }
  return limite ? lista.slice(0, limite) : lista
}

function calcularIdade(dataNascimento: Date): number {
  const hoje = new Date()
  let idade = hoje.getFullYear() - dataNascimento.getFullYear()
  const m = hoje.getMonth() - dataNascimento.getMonth()
  if (m < 0 || (m === 0 && hoje.getDate() < dataNascimento.getDate())) idade--
  return idade
}

function faixaEtariaDeIdade(idade: number): string {
  if (idade <= 12) return '0–12 anos'
  if (idade <= 17) return '13–17 anos'
  if (idade <= 39) return '18–39 anos'
  if (idade <= 59) return '40–59 anos'
  return '60+ anos'
}

const ORDEM_FAIXA = ['0–12 anos', '13–17 anos', '18–39 anos', '40–59 anos', '60+ anos']
const ORDEM_HORA = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}h`)

function chaveDia(d: Date): string {
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

function gerarSerieDiaria(desde: Date, atendimentosDia: Map<string, number>, triagensDia: Map<string, number>): SerieTemporal[] {
  const lista: SerieTemporal[] = []
  const cursor = new Date(desde)
  cursor.setHours(0, 0, 0, 0)
  const fim = new Date()
  fim.setHours(23, 59, 59, 999)

  while (cursor <= fim) {
    const label = chaveDia(cursor)
    lista.push({
      label,
      atendimentos: atendimentosDia.get(label) ?? 0,
      triagens: triagensDia.get(label) ?? 0,
    })
    cursor.setDate(cursor.getDate() + 1)
  }

  return lista
}

export async function obterEstatisticasDashboard(
  periodo: PeriodoDashboard
): Promise<DashboardEstatisticas> {
  const desde = dataInicioPeriodo(periodo)
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)

  const [
    atendimentos,
    triagensPeriodoLista,
    aguardandoTriagem,
    emAtendimento,
    emergenciasHoje,
    triagensPeriodo,
  ] = await Promise.all([
    prisma.atendimento.findMany({
      where: { deletedAt: null, createdAt: { gte: desde } },
      include: {
        paciente: {
          select: {
            dataNascimento: true,
            sexoBiologico: true,
            convenio: true,
          },
        },
        origem: { select: { descricao: true } },
        triagem: {
          select: {
            corClassificacao: true,
            categoriaQueixa: true,
          },
        },
        prontuario: {
          select: {
            diagnosticos: { select: { codigoCid: true, descricaoCid: true, principal: true } },
            requisicoes: {
              select: {
                categoria: true,
                itens: { select: { nomeExame: true } },
              },
            },
          },
        },
      },
    }),
    prisma.triagem.findMany({
      where: { createdAt: { gte: desde } },
      select: { createdAt: true },
    }),
    prisma.atendimento.count({ where: whereAguardandoTriagem }),
    prisma.atendimento.count({ where: { status: 'EM_ATENDIMENTO', deletedAt: null } }),
    prisma.triagem.count({
      where: {
        corClassificacao: { in: ['VERMELHO', 'LARANJA'] },
        createdAt: { gte: hoje },
      },
    }),
    prisma.triagem.count({ where: { createdAt: { gte: desde } } }),
  ])

  const faixaEtaria = new Map<string, number>()
  const sexo = new Map<string, number>()
  const origem = new Map<string, number>()
  const categoriaQueixa = new Map<string, number>()
  const manchester = new Map<string, number>()
  const exames = new Map<string, number>()
  const categoriaExame = new Map<string, number>()
  const statusAtendimento = new Map<string, number>()
  const convenio = new Map<string, number>()
  const diagnosticoCid = new Map<string, number>()
  const atendimentosPorHora = new Map<string, number>()
  const atendimentosPorDia = new Map<string, number>()
  const triagensPorDia = new Map<string, number>()
  const setor = new Map<string, number>()

  let examesSolicitados = 0
  let altas = 0
  let pacientesHoje = 0

  for (const a of atendimentos) {
    if (a.createdAt >= hoje) pacientesHoje++

    const idade = calcularIdade(a.paciente.dataNascimento)
    incrementar(faixaEtaria, faixaEtariaDeIdade(idade))
    incrementar(sexo, LABEL_SEXO[a.paciente.sexoBiologico] ?? a.paciente.sexoBiologico)
    incrementar(origem, a.origem?.descricao?.trim() || 'Não informado')
    incrementar(setor, a.setor?.trim() || 'Não informado')
    incrementar(statusAtendimento, LABEL_STATUS[a.status] ?? a.status)

    const conv = a.paciente.convenio?.trim()
    incrementar(convenio, conv ? conv : 'Particular / SUS')

    const hora = `${String(a.createdAt.getHours()).padStart(2, '0')}h`
    incrementar(atendimentosPorHora, hora)
    incrementar(atendimentosPorDia, chaveDia(a.createdAt))

    if (a.status === 'ALTA') altas++

    if (a.triagem) {
      const cor = a.triagem.corClassificacao
      incrementar(manchester, LABEL_MANCHESTER[cor] ?? cor)
      const cat = a.triagem.categoriaQueixa?.trim()
      if (cat) {
        incrementar(categoriaQueixa, LABEL_CATEGORIA[cat] ?? cat)
      } else {
        incrementar(categoriaQueixa, 'Não classificado')
      }
    }

    if (a.prontuario) {
      for (const d of a.prontuario.diagnosticos) {
        const chave = d.principal
          ? `${d.codigoCid} — ${d.descricaoCid}`
          : `${d.codigoCid} (sec.)`
        incrementar(diagnosticoCid, chave)
      }
      for (const r of a.prontuario.requisicoes) {
        incrementar(categoriaExame, LABEL_CATEGORIA_EXAME[r.categoria] ?? r.categoria)
        for (const item of r.itens) {
          examesSolicitados++
          incrementar(exames, item.nomeExame.trim() || 'Exame sem nome')
        }
      }
    }
  }

  const manchesterComCor = mapaParaLista(manchester).map((item) => {
    const key = Object.entries(LABEL_MANCHESTER).find(([, v]) => v === item.label)?.[0]
    return { ...item, cor: key ? COR_MANCHESTER[key] : undefined }
  })

  const faixaOrdenada = ORDEM_FAIXA.map((label) => ({
    label,
    valor: faixaEtaria.get(label) ?? 0,
  })).filter((i) => i.valor > 0)

  const horasOrdenadas = ORDEM_HORA.map((label) => ({
    label,
    valor: atendimentosPorHora.get(label) ?? 0,
  }))

  for (const t of triagensPeriodoLista) {
    incrementar(triagensPorDia, chaveDia(t.createdAt))
  }

  const evolucaoDiaria = gerarSerieDiaria(desde, atendimentosPorDia, triagensPorDia)

  return {
    periodo,
    periodoLabel: LABEL_PERIODO[periodo],
    totalAtendimentos: atendimentos.length,
    resumo: {
      pacientesHoje,
      aguardandoTriagem,
      emAtendimento,
      emergencias: emergenciasHoje,
      triagens: triagensPeriodo,
      examesSolicitados,
      altas,
    },
    faixaEtaria: faixaOrdenada.length ? faixaOrdenada : mapaParaLista(faixaEtaria, 'label'),
    sexo: mapaParaLista(sexo, 'valor'),
    origem: mapaParaLista(origem, 'valor', 10),
    categoriaQueixa: mapaParaLista(categoriaQueixa, 'valor', 10),
    manchester: manchesterComCor,
    exames: mapaParaLista(exames, 'valor', 12),
    categoriaExame: mapaParaLista(categoriaExame, 'valor'),
    statusAtendimento: mapaParaLista(statusAtendimento, 'valor'),
    convenio: mapaParaLista(convenio, 'valor', 8),
    diagnosticoCid: mapaParaLista(diagnosticoCid, 'valor', 10),
    atendimentosPorHora: horasOrdenadas,
    setor: mapaParaLista(setor, 'valor', 8),
    evolucaoDiaria,
  }
}
