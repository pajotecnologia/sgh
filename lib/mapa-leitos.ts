import { prisma } from '@/lib/prisma'
import type { TipoLeitoHospitalar, StatusLeitoHospitalar, CorTriagem } from '@/types'

export interface PacienteLeitoMapa {
  atendimentoId: string
  numeroAtendimento: string
  pacienteId: string
  nome: string
  sexo: string
  idadeAnos: number | null
  tipoSanguineo: string
  dataInternacao: string
  tempoInternacaoFormatado: string
  horasInternado: number
  corTriagem: CorTriagem | null
  queixaPrincipal: string | null
  diagnosticoPrincipal: string | null
  medicoResponsavel: string | null
  crmMedico: string | null
}

export interface LeitoMapaItem {
  id: string
  codigo: string
  ala: string
  quarto: string | null
  tipo: TipoLeitoHospitalar
  status: StatusLeitoHospitalar
  ativo: boolean
  observacoes: string | null
  clinicaId: string | null
  clinicaNome: string | null
  pacienteAtual: PacienteLeitoMapa | null
}

export interface MetricasMapaLeitos {
  totalLeitos: number
  totalAtivos: number
  leitosLivres: number
  leitosOcupados: number
  leitosInterditados: number
  taxaOcupacao: number
  distribuicaoTipo: Record<TipoLeitoHospitalar, { total: number; ocupados: number; livres: number }>
}

export interface ClinicaComAlas {
  id: string
  nome: string
  totalLeitos: number
  ocupados: number
  livres: number
  taxaOcupacao: number
  alas: {
    nome: string
    leitos: LeitoMapaItem[]
  }[]
}

export interface MapaLeitosResultado {
  metricas: MetricasMapaLeitos
  clinicas: ClinicaComAlas[]
  alasGerais: {
    nome: string
    leitos: LeitoMapaItem[]
  }[]
}

function formatarTempoInternacao(horas: number): string {
  if (horas < 1) return 'Menos de 1h'
  if (horas < 24) return `${Math.floor(horas)}h`
  const dias = Math.floor(horas / 24)
  const restoHoras = Math.floor(horas % 24)
  if (restoHoras === 0) return `${dias}d`
  return `${dias}d ${restoHoras}h`
}

function calcularIdade(dataNascimento: Date): number {
  const hoje = new Date()
  let idade = hoje.getFullYear() - dataNascimento.getFullYear()
  const m = hoje.getMonth() - dataNascimento.getMonth()
  if (m < 0 || (m === 0 && hoje.getDate() < dataNascimento.getDate())) {
    idade--
  }
  return idade
}

export async function obterDadosMapaLeitos(filtros?: {
  clinicaId?: string
  ala?: string
  tipo?: TipoLeitoHospitalar
  status?: StatusLeitoHospitalar
}): Promise<MapaLeitosResultado> {
  const agora = new Date()

  // Buscar todos os leitos com clínica e atendimento ativo (internado)
  const leitos = await prisma.leito.findMany({
    where: {
      ativo: true,
      ...(filtros?.clinicaId ? { clinicaId: filtros.clinicaId } : {}),
      ...(filtros?.ala ? { ala: filtros.ala } : {}),
      ...(filtros?.tipo ? { tipo: filtros.tipo } : {}),
      ...(filtros?.status ? { status: filtros.status } : {}),
    },
    include: {
      clinicaRef: {
        select: { id: true, nome: true },
      },
      atendimentos: {
        where: {
          status: 'INTERNADO',
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 1,
        include: {
          paciente: {
            select: {
              id: true,
              nomeExibicao: true,
              dataNascimento: true,
              sexoBiologico: true,
              tipoSanguineo: true,
            },
          },
          medico: {
            select: {
              id: true,
              nome: true,
              crm: true,
            },
          },
          triagem: {
            select: {
              corClassificacao: true,
              queixaPrincipal: true,
            },
          },
          prontuario: {
            select: {
              diagnosticos: {
                where: { principal: true },
                take: 1,
                select: { codigoCid: true, descricaoCid: true },
              },
            },
          },
        },
      },
    },
    orderBy: [{ ala: 'asc' }, { quarto: 'asc' }, { codigo: 'asc' }],
  })

  // Todas as clínicas ativas cadastradas
  const todasClinicas = await prisma.clinica.findMany({
    where: { ativo: true },
    orderBy: { nome: 'asc' },
  })

  // Montar itens de leitos enriquecidos
  const leitosEnriquecidos: LeitoMapaItem[] = leitos.map((l) => {
    const atendimentoAtivo = l.atendimentos[0]
    let pacienteAtual: PacienteLeitoMapa | null = null

    if (atendimentoAtivo && l.status === 'OCUPADO') {
      const dataInternacao = atendimentoAtivo.createdAt
      const diffMs = agora.getTime() - new Date(dataInternacao).getTime()
      const horasInternado = Math.max(0, diffMs / (1000 * 60 * 60))

      const diagnosticoPrincipal = atendimentoAtivo.prontuario?.diagnosticos[0]
        ? `${atendimentoAtivo.prontuario.diagnosticos[0].codigoCid} - ${atendimentoAtivo.prontuario.diagnosticos[0].descricaoCid}`
        : null

      pacienteAtual = {
        atendimentoId: atendimentoAtivo.id,
        numeroAtendimento: atendimentoAtivo.numeroAtendimento,
        pacienteId: atendimentoAtivo.paciente.id,
        nome: atendimentoAtivo.paciente.nomeExibicao,
        sexo: atendimentoAtivo.paciente.sexoBiologico,
        idadeAnos: atendimentoAtivo.paciente.dataNascimento
          ? calcularIdade(new Date(atendimentoAtivo.paciente.dataNascimento))
          : null,
        tipoSanguineo: atendimentoAtivo.paciente.tipoSanguineo,
        dataInternacao: dataInternacao.toISOString(),
        tempoInternacaoFormatado: formatarTempoInternacao(horasInternado),
        horasInternado,
        corTriagem: (atendimentoAtivo.triagem?.corClassificacao as CorTriagem) ?? null,
        queixaPrincipal: atendimentoAtivo.triagem?.queixaPrincipal ?? null,
        diagnosticoPrincipal,
        medicoResponsavel: atendimentoAtivo.medico?.nome ?? null,
        crmMedico: atendimentoAtivo.medico?.crm ?? null,
      }
    }

    return {
      id: l.id,
      codigo: l.codigo,
      ala: l.ala,
      quarto: l.quarto,
      tipo: l.tipo as TipoLeitoHospitalar,
      status: l.status as StatusLeitoHospitalar,
      ativo: l.ativo,
      observacoes: l.observacoes,
      clinicaId: l.clinicaId,
      clinicaNome: l.clinicaRef?.nome ?? l.clinica ?? 'Clínica Geral',
      pacienteAtual,
    }
  })

  // Cálculo de Métricas
  const totalLeitos = leitosEnriquecidos.length
  const totalAtivos = leitosEnriquecidos.filter((l) => l.ativo).length
  const leitosLivres = leitosEnriquecidos.filter((l) => l.status === 'DISPONIVEL').length
  const leitosOcupados = leitosEnriquecidos.filter((l) => l.status === 'OCUPADO').length
  const leitosInterditados = leitosEnriquecidos.filter((l) => l.status === 'INTERDITADO').length

  const taxaOcupacao =
    totalAtivos > 0 ? Math.round((leitosOcupados / totalAtivos) * 1000) / 10 : 0

  const tipos: TipoLeitoHospitalar[] = ['UTI', 'ENFERMARIA', 'ISOLAMENTO', 'OBSERVACAO']
  const distribuicaoTipo = tipos.reduce((acc, t) => {
    const doTipo = leitosEnriquecidos.filter((l) => l.tipo === t)
    acc[t] = {
      total: doTipo.length,
      ocupados: doTipo.filter((l) => l.status === 'OCUPADO').length,
      livres: doTipo.filter((l) => l.status === 'DISPONIVEL').length,
    }
    return acc
  }, {} as Record<TipoLeitoHospitalar, { total: number; ocupados: number; livres: number }>)

  // Agrupamento por Clínica e Ala
  const clinicasMap = new Map<string, { nome: string; leitos: LeitoMapaItem[] }>()

  for (const c of todasClinicas) {
    clinicasMap.set(c.id, { nome: c.nome, leitos: [] })
  }

  const leitosSemClinica: LeitoMapaItem[] = []

  for (const l of leitosEnriquecidos) {
    if (l.clinicaId && clinicasMap.has(l.clinicaId)) {
      clinicasMap.get(l.clinicaId)!.leitos.push(l)
    } else {
      leitosSemClinica.push(l)
    }
  }

  const clinicas: ClinicaComAlas[] = []

  for (const [id, c] of clinicasMap.entries()) {
    if (c.leitos.length === 0 && filtros?.clinicaId && filtros.clinicaId !== id) {
      continue
    }

    const alasMap = new Map<string, LeitoMapaItem[]>()
    for (const leito of c.leitos) {
      if (!alasMap.has(leito.ala)) {
        alasMap.set(leito.ala, [])
      }
      alasMap.get(leito.ala)!.push(leito)
    }

    const alas = Array.from(alasMap.entries()).map(([nome, leitosDaAla]) => ({
      nome,
      leitos: leitosDaAla,
    }))

    const ocupadosClinica = c.leitos.filter((l) => l.status === 'OCUPADO').length
    const livresClinica = c.leitos.filter((l) => l.status === 'DISPONIVEL').length
    const totalClinica = c.leitos.length
    const taxaOcupacaoClinica =
      totalClinica > 0 ? Math.round((ocupadosClinica / totalClinica) * 1000) / 10 : 0

    clinicas.push({
      id,
      nome: c.nome,
      totalLeitos: totalClinica,
      ocupados: ocupadosClinica,
      livres: livresClinica,
      taxaOcupacao: taxaOcupacaoClinica,
      alas,
    })
  }

  // Se houver leitos sem clínica associada, agrupa por alas gerais
  const alasGeraisMap = new Map<string, LeitoMapaItem[]>()
  for (const l of leitosSemClinica) {
    if (!alasGeraisMap.has(l.ala)) {
      alasGeraisMap.set(l.ala, [])
    }
    alasGeraisMap.get(l.ala)!.push(l)
  }

  const alasGerais = Array.from(alasGeraisMap.entries()).map(([nome, leitosDaAla]) => ({
    nome,
    leitos: leitosDaAla,
  }))

  return {
    metricas: {
      totalLeitos,
      totalAtivos,
      leitosLivres,
      leitosOcupados,
      leitosInterditados,
      taxaOcupacao,
      distribuicaoTipo,
    },
    clinicas,
    alasGerais,
  }
}
