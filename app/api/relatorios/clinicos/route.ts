// app/api/relatorios/clinicos/route.ts — Relatórios Clínicos e de Internação individualizados (JSON e PDF)

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  drawCabecalhoEstiloFicha,
  drawRodapePajoTecnologia,
  type InstituicaoRelatorioPdf,
} from '@/lib/pdf-relatorio-cabecalho-ficha'
import { obterNomeCompletoPaciente } from '@/lib/nome-paciente-exibicao'

const FOOTER_RESERVE = 40
const PAGE_MARGIN = 36

function formatarDataBr(val: Date | string | null | undefined): string {
  if (!val) return '—'
  if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}/.test(val)) {
    const [y, m, d] = val.split('T')[0].split('-')
    return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`
  }
  const date = typeof val === 'string' ? new Date(val) : val
  if (Number.isNaN(date.getTime())) return '—'
  const dia = String(date.getDate()).padStart(2, '0')
  const mes = String(date.getMonth() + 1).padStart(2, '0')
  const ano = date.getFullYear()
  return `${dia}/${mes}/${ano}`
}

function formatarDataHoraBr(val: Date | string | null | undefined): string {
  if (!val) return '—'
  const d = typeof val === 'string' ? new Date(val) : val
  if (Number.isNaN(d.getTime())) return '—'
  const dia = String(d.getDate()).padStart(2, '0')
  const mes = String(d.getMonth() + 1).padStart(2, '0')
  const ano = d.getFullYear()
  const hora = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${dia}/${mes}/${ano} ${hora}:${min}`
}

function sanitizarTextoParaPdf(val: any): string {
  if (val === null || val === undefined) return '—'
  const str = String(val)
  return str
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}]/gu, '')
    .replace(/[^\x20-\x7E\xA0-\xFF\n\r\t]/g, ' ')
    .trim() || '—'
}


function parseFiltroDatas(dataInicio?: string | null, dataFim?: string | null) {
  let gte: Date | undefined
  let lte: Date | undefined

  if (dataInicio && /^\d{4}-\d{2}-\d{2}/.test(dataInicio)) {
    gte = new Date(`${dataInicio}T00:00:00.000Z`)
  }
  if (dataFim && /^\d{4}-\d{2}-\d{2}/.test(dataFim)) {
    lte = new Date(`${dataFim}T23:59:59.999Z`)
  }

  if (gte || lte) {
    return {
      ...(gte ? { gte } : {}),
      ...(lte ? { lte } : {}),
    }
  }
  return undefined
}

export async function GET(req: NextRequest) {
  const sessao = await getServerSession(authOptions)
  if (!sessao) {
    return NextResponse.json({ sucesso: false, erro: 'Não autorizado.' }, { status: 401 })
  }

  const role = sessao.usuario.role
  const rolesPermitidas = [
    'ADMIN',
    'DIRETOR_CLINICO',
    'MEDICO',
    'ENFERMEIRO',
    'TECNICO_ENFERMAGEM',
    'FARMACEUTICO',
    'RECEPCIONISTA',
  ]
  if (!rolesPermitidas.includes(role)) {
    return NextResponse.json({ sucesso: false, erro: 'Sem permissão.' }, { status: 403 })
  }

  const tipo = req.nextUrl.searchParams.get('tipo')?.trim() || ''
  const format = req.nextUrl.searchParams.get('format')?.trim() || 'json'
  const busca = req.nextUrl.searchParams.get('busca')?.trim() || ''
  const status = req.nextUrl.searchParams.get('status')?.trim() || ''
  const turno = req.nextUrl.searchParams.get('turno')?.trim() || ''
  const dataInicio = req.nextUrl.searchParams.get('dataInicio')?.trim()
  const dataFim = req.nextUrl.searchParams.get('dataFim')?.trim()

  const filtroDataRange = parseFiltroDatas(dataInicio, dataFim)

  try {
    let titulo = ''
    let colunas: string[] = []
    let dadosLinhas: string[][] = []
    let largurasColunas: number[] | null = null
    let payloadJson: any[] = []
    let metricas: Record<string, number | string> = {}

    // 1. PRONTUÁRIO MÉDICO
    if (tipo === 'prontuario-medico') {
      titulo = 'Relatório Clínico — Prontuários Médicos e Evoluções'
      colunas = ['Atendimento', 'Paciente', 'Médico', 'Diagnóstico / CID-10', 'Evoluções', 'Data']
      largurasColunas = [80, 140, 110, 110, 50, 70]

      const prontuarios = await prisma.prontuarioMedico.findMany({
        where: {
          ...(filtroDataRange ? { createdAt: filtroDataRange } : {}),
        },
        include: {
          atendimento: {
            include: {
              paciente: true,
              medico: { select: { nome: true, crm: true } },
              leito: true,
            },
          },
          diagnosticos: { take: 3 },
          evolucoes: {
            select: { id: true, registradoEm: true, autor: { select: { nome: true } } },
            orderBy: { registradoEm: 'desc' },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 300,
      })

      let mapped = prontuarios.map((p) => {
        const pac = p.atendimento.paciente
        const nomeComp = obterNomeCompletoPaciente(pac.nomeExibicao, pac.nomeCriptografado)
        const diagList = p.diagnosticos
          .map((d) => (d.codigoCid ? `${d.codigoCid} - ${d.descricaoCid}` : d.descricaoCid))
          .join('; ')
        const statusProntuario = p.encerradoEm ? 'ENCERRADO' : 'ABERTO'
        return {
          id: p.id,
          atendimentoId: p.atendimentoId,
          numeroAtendimento: p.atendimento.numeroAtendimento,
          pacienteId: pac.id,
          nomePaciente: nomeComp,
          medicoNome: p.atendimento.medico?.nome || '—',
          medicoCrm: p.atendimento.medico?.crm || '—',
          leito: p.atendimento.leito ? `${p.atendimento.leito.ala} - ${p.atendimento.leito.codigo}` : '—',
          diagnosticos: diagList || 'Sem diagnóstico registrado',
          totalEvolucoes: p.evolucoes.length,
          status: statusProntuario,
          createdAt: p.createdAt,
        }
      })

      if (status) {
        mapped = mapped.filter((m) => m.status === status)
      }

      if (busca) {
        const b = busca.toLowerCase()
        mapped = mapped.filter(
          (m) =>
            m.nomePaciente.toLowerCase().includes(b) ||
            m.numeroAtendimento.toLowerCase().includes(b) ||
            m.medicoNome.toLowerCase().includes(b) ||
            m.diagnosticos.toLowerCase().includes(b)
        )
      }

      payloadJson = mapped
      metricas = {
        total: mapped.length,
        comDiagnostico: mapped.filter((m) => m.diagnosticos !== 'Sem diagnóstico registrado').length,
        totalEvolucoes: mapped.reduce((acc, curr) => acc + curr.totalEvolucoes, 0),
      }

      dadosLinhas = mapped.map((m) => [
        m.numeroAtendimento,
        m.nomePaciente,
        m.medicoNome,
        m.diagnosticos.length > 35 ? m.diagnosticos.substring(0, 32) + '...' : m.diagnosticos,
        String(m.totalEvolucoes),
        formatarDataBr(m.createdAt),
      ])
    }

    // 2. PRONTUÁRIO DE ENFERMAGEM
    else if (tipo === 'prontuario-enfermagem') {
      titulo = 'Relatório — Prontuário e Assistência de Enfermagem'
      colunas = ['Atendimento', 'Paciente', 'Leito / Ala', 'Sinais Vitais', 'Turnos', 'SAE', 'Internado Em']
      largurasColunas = [80, 130, 80, 80, 60, 50, 70]

      const atendimentos = await prisma.atendimento.findMany({
        where: {
          OR: [
            { status: 'INTERNADO' },
            { vaiInternar: true },
            { leitoId: { not: null } },
          ],
          ...(filtroDataRange ? { createdAt: filtroDataRange } : {}),
        },
        include: {
          paciente: true,
          leito: true,
          fichasSinaisVitais: { select: { id: true, dataReferencia: true } },
          fichasEvolucaoTurno: { select: { id: true, turno: true, dataReferencia: true } },
          fichasSae: { select: { id: true, dataReferencia: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 300,
      })

      let mapped = atendimentos.map((a) => {
        const nomeComp = obterNomeCompletoPaciente(a.paciente.nomeExibicao, a.paciente.nomeCriptografado)
        return {
          id: a.id,
          atendimentoId: a.id,
          numeroAtendimento: a.numeroAtendimento,
          pacienteId: a.paciente.id,
          nomePaciente: nomeComp,
          leito: a.leito ? `${a.leito.ala} ${a.leito.codigo}` : '—',
          totalSinaisVitais: a.fichasSinaisVitais.length,
          totalEvolucoesTurno: a.fichasEvolucaoTurno.length,
          possuiSae: a.fichasSae.length > 0 ? 'Sim' : 'Pendente',
          status: a.status,
          createdAt: a.createdAt,
        }
      })

      if (busca) {
        const b = busca.toLowerCase()
        mapped = mapped.filter(
          (m) =>
            m.nomePaciente.toLowerCase().includes(b) ||
            m.numeroAtendimento.toLowerCase().includes(b) ||
            m.leito.toLowerCase().includes(b)
        )
      }

      payloadJson = mapped
      metricas = {
        total: mapped.length,
        comSinaisVitais: mapped.filter((m) => m.totalSinaisVitais > 0).length,
        comSae: mapped.filter((m) => m.possuiSae === 'Sim').length,
        totalTurnos: mapped.reduce((acc, curr) => acc + curr.totalEvolucoesTurno, 0),
      }

      dadosLinhas = mapped.map((m) => [
        m.numeroAtendimento,
        m.nomePaciente,
        m.leito,
        `${m.totalSinaisVitais} registro(s)`,
        `${m.totalEvolucoesTurno} turno(s)`,
        m.possuiSae,
        formatarDataBr(m.createdAt),
      ])
    }

    // 3. INTERNAMENTO / FICHA HOSPITALAR
    else if (tipo === 'internamento') {
      colunas = ['Atendimento', 'Paciente', 'Leito', 'Ala/Setor', 'Médico Resp.', 'Status', 'Data']
      largurasColunas = [85, 120, 50, 75, 95, 50, 55]

      const fichas = await prisma.fichaInternacaoAlta.findMany({
        where: {
          ...(filtroDataRange ? { createdAt: filtroDataRange } : {}),
          ...(status ? { status: status as any } : {}),
        },
        include: {
          atendimento: {
            include: {
              paciente: true,
              leito: true,
              medico: { select: { nome: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 300,
      })

      let mapped = fichas.map((f) => {
        const pac = f.atendimento.paciente
        const nomeComp = obterNomeCompletoPaciente(pac.nomeExibicao, pac.nomeCriptografado)
        return {
          id: f.id,
          atendimentoId: f.atendimentoId,
          numeroAtendimento: f.atendimento.numeroAtendimento,
          nomePaciente: f.nomePaciente || nomeComp,
          leito: f.atendimento.leito?.codigo || '—',
          ala: f.atendimento.leito?.ala || f.atendimento.setor || '—',
          medico: f.atendimento.medico?.nome || '—',
          status: f.status,
          createdAt: f.createdAt,
        }
      })

      if (busca) {
        const b = busca.toLowerCase()
        mapped = mapped.filter(
          (m) =>
            m.nomePaciente.toLowerCase().includes(b) ||
            m.numeroAtendimento.toLowerCase().includes(b) ||
            m.leito.toLowerCase().includes(b) ||
            m.ala.toLowerCase().includes(b) ||
            m.medico.toLowerCase().includes(b)
        )
      }

      payloadJson = mapped
      metricas = {
        total: mapped.length,
        concluidos: mapped.filter((m) => m.status === 'CONCLUIDA').length,
        rascunhos: mapped.filter((m) => m.status === 'RASCUNHO').length,
      }

      dadosLinhas = mapped.map((m) => [
        m.numeroAtendimento,
        m.nomePaciente,
        m.leito,
        m.ala,
        m.medico,
        m.status,
        formatarDataBr(m.createdAt),
      ])
    }

    // 4. MEDICAMENTOS (INSTRUÇÕES E APRAZAMENTO)
    else if (tipo === 'medicamentos') {
      titulo = 'Relatório de Instruções de Medicamentos e Aprazamentos'
      colunas = ['Atendimento', 'Paciente', 'Medicamento', 'Dose/Via', 'Frequência', 'Status', 'Horário']
      largurasColunas = [75, 120, 130, 75, 60, 50, 60]

      const itensPrescricao = await prisma.itemPrescricao.findMany({
        where: {
          ...(filtroDataRange ? { createdAt: filtroDataRange } : {}),
          ...(status ? { status: status as any } : {}),
        },
        include: {
          prescricao: {
            include: {
              prontuario: {
                include: {
                  atendimento: {
                    include: { paciente: true, leito: true },
                  },
                },
              },
            },
          },
          aplicacoes: {
            select: { aplicadoEm: true, aplicadoPor: { select: { nome: true } } },
            take: 1,
            orderBy: { aplicadoEm: 'desc' },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 300,
      })

      let mapped = itensPrescricao.map((it) => {
        const pac = it.prescricao?.prontuario?.atendimento?.paciente
        const nomeComp = pac ? obterNomeCompletoPaciente(pac.nomeExibicao, pac.nomeCriptografado) : '—'
        const numAtend = it.prescricao?.prontuario?.atendimento?.numeroAtendimento || '—'
        const atendId = it.prescricao?.prontuario?.atendimento?.id
        const ultAplicacao = it.aplicacoes[0]
        return {
          id: it.id,
          atendimentoId: atendId,
          numeroAtendimento: numAtend,
          nomePaciente: nomeComp,
          nomeMedicamento: it.nomeMedicamento,
          doseVia: `${it.dose}${it.unidadeMedida ? ` ${it.unidadeMedida}` : ''} (${it.via})`,
          frequencia: it.frequencia,
          status: it.status,
          observacoes: it.observacoes || '—',
          aplicadoEm: ultAplicacao?.aplicadoEm ? formatarDataHoraBr(ultAplicacao.aplicadoEm) : '—',
          aplicadoPor: ultAplicacao?.aplicadoPor?.nome || '—',
          createdAt: it.createdAt,
        }
      })

      if (busca) {
        const b = busca.toLowerCase()
        mapped = mapped.filter(
          (m) =>
            m.nomePaciente.toLowerCase().includes(b) ||
            m.numeroAtendimento.toLowerCase().includes(b) ||
            m.nomeMedicamento.toLowerCase().includes(b) ||
            m.doseVia.toLowerCase().includes(b)
        )
      }

      payloadJson = mapped
      metricas = {
        total: mapped.length,
        aplicados: mapped.filter((m) => m.status === 'APLICADO').length,
        pendentes: mapped.filter((m) => m.status === 'PENDENTE').length,
        suspensos: mapped.filter((m) => m.status === 'SUSPENSO').length,
      }

      dadosLinhas = mapped.map((m) => [
        m.numeroAtendimento,
        m.nomePaciente,
        m.nomeMedicamento,
        m.doseVia,
        m.frequencia,
        m.status,
        m.aplicadoEm !== '—' ? m.aplicadoEm : formatarDataBr(m.createdAt),
      ])
    }

    // 5. CCIH (CONTROLE DE INFECÇÃO HOSPITALAR)
    else if (tipo === 'ccih') {
      titulo = 'Relatório de Notificações à CCIH — IRAS e Dispositivos'
      colunas = ['Atendimento', 'Paciente', 'Leito/Ala', 'Tipo Infecção', 'Topografia', 'Status', 'Data Notif.']
      largurasColunas = [75, 125, 75, 95, 90, 50, 60]

      const fichasCcih = await prisma.fichaCcih.findMany({
        where: {
          ...(filtroDataRange ? { createdAt: filtroDataRange } : {}),
          ...(status ? { status: status as any } : {}),
        },
        include: {
          atendimento: {
            include: { paciente: true, leito: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 300,
      })

      let mapped = fichasCcih.map((f) => {
        const pac = f.atendimento?.paciente
        const nomeComp = pac ? obterNomeCompletoPaciente(pac.nomeExibicao, pac.nomeCriptografado) : f.nomePaciente || '—'
        return {
          id: f.id,
          atendimentoId: f.atendimentoId,
          numeroAtendimento: f.atendimento?.numeroAtendimento || f.numeroProntuario || '—',
          nomePaciente: nomeComp,
          leito: f.leitoDescricao || (f.atendimento?.leito ? `${f.atendimento.leito.ala} ${f.atendimento.leito.codigo}` : '—'),
          tipoInfeccao: f.tipoInfeccao || f.tipoInfeccaoOutro || 'Sob Investigação',
          topografia: f.topografia || '—',
          microorganismo: f.microorganismoIdentificado || 'Não isolado',
          status: f.status,
          dataNotificacao: f.dataNotificacao,
          createdAt: f.createdAt,
        }
      })

      if (busca) {
        const b = busca.toLowerCase()
        mapped = mapped.filter(
          (m) =>
            m.nomePaciente.toLowerCase().includes(b) ||
            m.numeroAtendimento.toLowerCase().includes(b) ||
            m.tipoInfeccao.toLowerCase().includes(b) ||
            m.topografia.toLowerCase().includes(b) ||
            m.microorganismo.toLowerCase().includes(b)
        )
      }

      payloadJson = mapped
      metricas = {
        total: mapped.length,
        concluidos: mapped.filter((m) => m.status === 'CONCLUIDO').length,
        investigacao: mapped.filter((m) => m.status === 'RASCUNHO' || m.status === 'NOTIFICADO' || m.status === 'EM_ANALISE').length,
      }

      dadosLinhas = mapped.map((m) => [
        m.numeroAtendimento,
        m.nomePaciente,
        m.leito,
        m.tipoInfeccao,
        m.topografia,
        m.status,
        formatarDataBr(m.dataNotificacao || m.createdAt),
      ])
    }

    // 6. SINAIS VITAIS
    else if (tipo === 'sinais-vitais') {
      titulo = 'Relatório de Monitoramento de Sinais Vitais e Balanço Hídrico'
      colunas = ['Atendimento', 'Paciente', 'Leito', 'Data Ref.', 'Controle Horário', 'Balanço', 'Registrado Em']
      largurasColunas = [80, 140, 70, 70, 70, 60, 80]

      const sinais = await prisma.fichaSinaisVitais.findMany({
        where: {
          ...(filtroDataRange ? { dataReferencia: filtroDataRange } : {}),
        },
        include: {
          atendimento: {
            include: { paciente: true, leito: true },
          },
        },
        orderBy: { dataReferencia: 'desc' },
        take: 300,
      })

      let mapped = sinais.map((s) => {
        const pac = s.atendimento?.paciente
        const nomeComp = pac ? obterNomeCompletoPaciente(pac.nomeExibicao, pac.nomeCriptografado) : s.nomePaciente || '—'
        const temControle = s.controleHorario ? 'Preenchido' : 'Pendente'
        const temBalanco = s.balancoHidrico ? 'Calculado' : 'Não informado'
        return {
          id: s.id,
          atendimentoId: s.atendimentoId,
          numeroAtendimento: s.atendimento?.numeroAtendimento || s.numeroProntuario || '—',
          nomePaciente: nomeComp,
          leito: s.leitoDescricao || (s.atendimento?.leito ? `${s.atendimento.leito.ala} ${s.atendimento.leito.codigo}` : '—'),
          dataReferencia: s.dataReferencia,
          temControle,
          temBalanco,
          createdAt: s.createdAt,
        }
      })

      if (busca) {
        const b = busca.toLowerCase()
        mapped = mapped.filter(
          (m) =>
            m.nomePaciente.toLowerCase().includes(b) ||
            m.numeroAtendimento.toLowerCase().includes(b) ||
            m.leito.toLowerCase().includes(b)
        )
      }

      payloadJson = mapped
      metricas = {
        total: mapped.length,
        comControle: mapped.filter((m) => m.temControle === 'Preenchido').length,
        comBalanco: mapped.filter((m) => m.temBalanco === 'Calculado').length,
      }

      dadosLinhas = mapped.map((m) => [
        m.numeroAtendimento,
        m.nomePaciente,
        m.leito,
        formatarDataBr(m.dataReferencia),
        m.temControle,
        m.temBalanco,
        formatarDataBr(m.createdAt),
      ])
    }

    // 7. EVOLUÇÃO DIA / NOITE
    else if (tipo === 'evolucao-turno') {
      titulo = 'Relatório de Evoluções por Turno (Plantão Diurno / Noturno)'
      colunas = ['Atendimento', 'Paciente', 'Turno', 'Data Ref.', 'Estado Geral', 'Profissional', 'Status']
      largurasColunas = [75, 125, 55, 65, 100, 100, 50]

      const turnoPrisma = turno === 'DIA' ? 'DIURNA' : turno === 'NOITE' ? 'NOTURNA' : undefined

      const evolucoesTurno = await prisma.fichaEvolucaoTurno.findMany({
        where: {
          ...(turnoPrisma ? { turno: turnoPrisma as any } : {}),
          ...(filtroDataRange ? { dataReferencia: filtroDataRange } : {}),
          ...(status ? { status: status as any } : {}),
        },
        include: {
          atendimento: {
            include: { paciente: true, leito: true },
          },
        },
        orderBy: [{ dataReferencia: 'desc' }, { turno: 'asc' }],
        take: 300,
      })

      let mapped = evolucoesTurno.map((ev) => {
        const pac = ev.atendimento?.paciente
        const nomeComp = pac ? obterNomeCompletoPaciente(pac.nomeExibicao, pac.nomeCriptografado) : ev.nomePaciente || '—'
        return {
          id: ev.id,
          atendimentoId: ev.atendimentoId,
          numeroAtendimento: ev.atendimento?.numeroAtendimento || ev.numeroProntuario || '—',
          nomePaciente: nomeComp,
          leito: ev.leitoDescricao || (ev.atendimento?.leito ? `${ev.atendimento.leito.ala} ${ev.atendimento.leito.codigo}` : '—'),
          turno: ev.turno === 'DIURNA' ? 'DIA' : 'NOITE',
          dataReferencia: ev.dataReferencia,
          estadoGeral: ev.estadoGeral || 'Estável',
          profissional: ev.nomeProfissional || 'Equipe Enfermagem',
          status: ev.status,
          createdAt: ev.createdAt,
        }
      })

      if (busca) {
        const b = busca.toLowerCase()
        mapped = mapped.filter(
          (m) =>
            m.nomePaciente.toLowerCase().includes(b) ||
            m.numeroAtendimento.toLowerCase().includes(b) ||
            m.profissional.toLowerCase().includes(b) ||
            m.estadoGeral.toLowerCase().includes(b)
        )
      }

      payloadJson = mapped
      metricas = {
        total: mapped.length,
        diurno: mapped.filter((m) => m.turno === 'DIA').length,
        noturno: mapped.filter((m) => m.turno === 'NOITE').length,
        concluidos: mapped.filter((m) => m.status === 'REGISTRADA').length,
      }

      dadosLinhas = mapped.map((m) => [
        m.numeroAtendimento,
        m.nomePaciente,
        m.turno === 'DIA' ? 'Dia' : 'Noite',
        formatarDataBr(m.dataReferencia),
        m.estadoGeral.length > 25 ? m.estadoGeral.substring(0, 22) + '...' : m.estadoGeral,
        m.profissional,
        m.status,
      ])
    }

    // 8. CONDIÇÕES DE ALTA HOSPITALAR
    else if (tipo === 'condicoes-alta') {
      titulo = 'Relatório de Condições & Sumários de Alta Hospitalar'
      colunas = ['Atendimento', 'Paciente', 'Leito', 'Status Alta', 'Médico Resp.', 'Data Alta / Fechamento']
      largurasColunas = [80, 150, 70, 70, 110, 90]

      const altas = await prisma.fichaInternacaoAlta.findMany({
        where: {
          status: 'CONCLUIDA',
          ...(filtroDataRange ? { updatedAt: filtroDataRange } : {}),
        },
        include: {
          atendimento: {
            include: {
              paciente: true,
              leito: true,
              medico: { select: { nome: true } },
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
        take: 300,
      })

      let mapped = altas.map((a) => {
        const pac = a.atendimento.paciente
        const nomeComp = obterNomeCompletoPaciente(pac.nomeExibicao, pac.nomeCriptografado)
        return {
          id: a.id,
          atendimentoId: a.atendimentoId,
          numeroAtendimento: a.atendimento.numeroAtendimento,
          nomePaciente: a.nomePaciente || nomeComp,
          leito: a.atendimento.leito?.codigo || '—',
          medico: a.atendimento.medico?.nome || '—',
          status: a.status,
          updatedAt: a.updatedAt,
        }
      })

      if (busca) {
        const b = busca.toLowerCase()
        mapped = mapped.filter(
          (m) =>
            m.nomePaciente.toLowerCase().includes(b) ||
            m.numeroAtendimento.toLowerCase().includes(b) ||
            m.medico.toLowerCase().includes(b)
        )
      }

      payloadJson = mapped
      metricas = {
        totalAltas: mapped.length,
      }

      dadosLinhas = mapped.map((m) => [
        m.numeroAtendimento,
        m.nomePaciente,
        m.leito,
        'Alta Concluída',
        m.medico,
        formatarDataBr(m.updatedAt),
      ])
    }

    // 9. SAE (SISTEMATIZAÇÃO DA ASSISTÊNCIA DE ENFERMAGEM)
    else if (tipo === 'sae') {
      titulo = 'Relatório de SAE — Diagnósticos e Intervenções de Enfermagem'
      colunas = ['Atendimento', 'Paciente', 'Leito', 'Data Ref.', 'Diagnósticos (NANDA)', 'Cuidados (NIC)', 'Status']
      largurasColunas = [75, 125, 60, 65, 100, 100, 45]

      const saes = await prisma.fichaSae.findMany({
        where: {
          ...(filtroDataRange ? { dataReferencia: filtroDataRange } : {}),
        },
        include: {
          atendimento: {
            include: { paciente: true, leito: true },
          },
        },
        orderBy: { dataReferencia: 'desc' },
        take: 300,
      })

      let mapped = saes.map((s) => {
        const pac = s.atendimento?.paciente
        const nomeComp = pac ? obterNomeCompletoPaciente(pac.nomeExibicao, pac.nomeCriptografado) : s.nomePaciente || '—'
        const diagCount = Array.isArray(s.diagnosticos) ? s.diagnosticos.length : 0
        const prescCount = s.prescricoes && typeof s.prescricoes === 'object' ? Object.keys(s.prescricoes).length : 0
        return {
          id: s.id,
          atendimentoId: s.atendimentoId,
          numeroAtendimento: s.atendimento?.numeroAtendimento || s.numeroProntuario || '—',
          nomePaciente: nomeComp,
          leito: s.leitoDescricao || (s.atendimento?.leito ? `${s.atendimento.leito.ala} ${s.atendimento.leito.codigo}` : '—'),
          dataReferencia: s.dataReferencia,
          totalDiagnosticos: diagCount,
          totalPrescricoes: prescCount,
          createdAt: s.createdAt,
        }
      })

      if (busca) {
        const b = busca.toLowerCase()
        mapped = mapped.filter(
          (m) =>
            m.nomePaciente.toLowerCase().includes(b) ||
            m.numeroAtendimento.toLowerCase().includes(b) ||
            m.leito.toLowerCase().includes(b)
        )
      }

      payloadJson = mapped
      metricas = {
        total: mapped.length,
        totalDiagnosticos: mapped.reduce((acc, curr) => acc + curr.totalDiagnosticos, 0),
        totalPrescricoes: mapped.reduce((acc, curr) => acc + curr.totalPrescricoes, 0),
      }

      dadosLinhas = mapped.map((m) => [
        m.numeroAtendimento,
        m.nomePaciente,
        m.leito,
        formatarDataBr(m.dataReferencia),
        `${m.totalDiagnosticos} diag(s)`,
        `${m.totalPrescricoes} cuidado(s)`,
        'Ativa',
      ])
    }

    // 10. MULTIDISCIPLINAR
    else if (tipo === 'multidisciplinar') {
      titulo = 'Relatório de Avaliações e Evoluções Multidisciplinares'
      colunas = ['Atendimento', 'Paciente', 'Especialidade / Profissional', 'Resumo Avaliação', 'Data']
      largurasColunas = [80, 130, 110, 135, 65]

      const evolucoesMulti = await prisma.evolucaoMultiprofissional.findMany({
        where: {
          ...(filtroDataRange ? { dataHora: filtroDataRange } : {}),
        },
        include: {
          atendimento: {
            include: { paciente: true, leito: true },
          },
        },
        orderBy: { dataHora: 'desc' },
        take: 300,
      })

      let mapped = evolucoesMulti.map((ev) => {
        const pac = ev.atendimento?.paciente
        const nomeComp = pac ? obterNomeCompletoPaciente(pac.nomeExibicao, pac.nomeCriptografado) : '—'
        return {
          id: ev.id,
          atendimentoId: ev.atendimentoId,
          numeroAtendimento: ev.atendimento?.numeroAtendimento || '—',
          nomePaciente: nomeComp,
          leito: ev.atendimento?.leito ? `${ev.atendimento.leito.ala} ${ev.atendimento.leito.codigo}` : '—',
          categoria: ev.categoria || 'MULTIDISCIPLINAR',
          nomeProfissional: ev.nomeProfissional || 'Profissional',
          evolucao: ev.evolucao,
          dataHora: ev.dataHora,
        }
      })

      if (busca) {
        const b = busca.toLowerCase()
        mapped = mapped.filter(
          (m) =>
            m.nomePaciente.toLowerCase().includes(b) ||
            m.numeroAtendimento.toLowerCase().includes(b) ||
            m.categoria.toLowerCase().includes(b) ||
            m.nomeProfissional.toLowerCase().includes(b) ||
            m.evolucao.toLowerCase().includes(b)
        )
      }

      payloadJson = mapped
      metricas = {
        total: mapped.length,
        fisioterapia: mapped.filter((m) => m.categoria.includes('FISIO')).length,
        nutricao: mapped.filter((m) => m.categoria.includes('NUTRI')).length,
        psicologia: mapped.filter((m) => m.categoria.includes('PSICO')).length,
        outros: mapped.filter((m) => !['FISIO', 'NUTRI', 'PSICO'].some((c) => m.categoria.includes(c))).length,
      }

      dadosLinhas = mapped.map((m) => [
        m.numeroAtendimento,
        m.nomePaciente,
        `${m.categoria} - ${m.nomeProfissional}`,
        m.evolucao.length > 35 ? m.evolucao.substring(0, 32) + '...' : m.evolucao,
        formatarDataBr(m.dataHora),
      ])
    }

    // 11. LAUDO SOLICITAÇÃO
    else if (tipo === 'laudo-solicitacao') {
      titulo = 'Relatório de Laudos Médicos e Solicitações de Internação'
      colunas = ['Atendimento', 'Paciente', 'Procedimento Solicitado', 'Médico Solicitante', 'Status', 'Data']
      largurasColunas = [80, 125, 125, 100, 45, 50]

      const statusValido = status && ['RASCUNHO', 'EMITIDO', 'AUDITADO', 'CANCELADO'].includes(status) ? (status as any) : undefined

      const laudos = await prisma.laudoSolicitacao.findMany({
        where: {
          ...(filtroDataRange ? { createdAt: filtroDataRange } : {}),
          ...(statusValido ? { status: statusValido } : {}),
        },
        include: {
          atendimento: {
            include: { paciente: true, leito: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 300,
      })

      let mapped = laudos.map((l) => {
        const pac = l.atendimento?.paciente
        const nomeComp = pac ? obterNomeCompletoPaciente(pac.nomeExibicao, pac.nomeCriptografado) : l.nomePaciente || '—'
        return {
          id: l.id,
          atendimentoId: l.atendimentoId,
          numeroAtendimento: l.atendimento?.numeroAtendimento || '—',
          nomePaciente: nomeComp,
          procedimento: l.procedimentoSolicitado || 'Internação Clínica',
          medicoSolicitante: l.nomeMedicoSolicitante || '—',
          status: l.status,
          createdAt: l.createdAt,
        }
      })

      if (busca) {
        const b = busca.toLowerCase()
        mapped = mapped.filter(
          (m) =>
            m.nomePaciente.toLowerCase().includes(b) ||
            m.numeroAtendimento.toLowerCase().includes(b) ||
            m.procedimento.toLowerCase().includes(b) ||
            m.medicoSolicitante.toLowerCase().includes(b)
        )
      }

      payloadJson = mapped
      const totalEmitidos = mapped.filter((m) => m.status === 'EMITIDO' || m.status === 'AUDITADO').length
      metricas = {
        total: mapped.length,
        emitidos: totalEmitidos,
        concluidos: totalEmitidos,
        rascunhos: mapped.filter((m) => m.status === 'RASCUNHO').length,
      }


      dadosLinhas = mapped.map((m) => [
        m.numeroAtendimento,
        m.nomePaciente,
        m.procedimento.length > 30 ? m.procedimento.substring(0, 27) + '...' : m.procedimento,
        m.medicoSolicitante,
        m.status,
        formatarDataBr(m.createdAt),
      ])
    } else {
      return NextResponse.json(
        { sucesso: false, erro: 'Tipo de relatório clínico não reconhecido.' },
        { status: 400 }
      )
    }

    if (format === 'json') {
      return NextResponse.json({
        sucesso: true,
        tipo,
        titulo,
        total: payloadJson.length,
        metricas,
        dados: payloadJson,
      })
    }

    // PDF Export format
    const instRow = await prisma.instituicao.findFirst()
    const inst: InstituicaoRelatorioPdf = {
      nomeMunicipio: instRow?.nomeMunicipio ?? null,
      nomeInstituicao: instRow?.nomeInstituicao ?? null,
      logomarcaUrl: instRow?.logomarcaUrl ?? null,
      cnes: instRow?.cnes ?? null,
      endereco: instRow?.endereco ?? null,
      bairro: instRow?.bairro ?? null,
      cidade: instRow?.cidade ?? null,
      estado: instRow?.estado ?? null,
      cep: instRow?.cep ?? null,
    }

    const pdf = await PDFDocument.create()
    const font = await pdf.embedFont(StandardFonts.Helvetica)
    const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold)
    const bodySize = 8
    const titleSize = 10

    const pageW = 595.28
    const pageH = 841.89
    let page = pdf.addPage([pageW, pageH])

    const emitidoFmt = formatarDataHoraBr(new Date())

    let y = await drawCabecalhoEstiloFicha(pdf, page, font, fontBold, inst, {
      rightBoxMain: 'Relatório Clínico / Internação',
      rightBoxSub: `Emitido em: ${emitidoFmt}`,
      faixaTexto: titulo,
    })

    y -= 10
    page.drawText(`Total de registros: ${dadosLinhas.length}`, {
      x: PAGE_MARGIN,
      y,
      size: titleSize,
      font: fontBold,
      color: rgb(0.1, 0.1, 0.14),
    })
    y -= titleSize + 12

    const totalLargura = pageW - PAGE_MARGIN * 2
    let largurasFinais: number[] = []
    if (largurasColunas && largurasColunas.length === colunas.length) {
      const soma = largurasColunas.reduce((acc, curr) => acc + curr, 0)
      largurasFinais = largurasColunas.map((w) => (w / soma) * totalLargura)
    } else {
      largurasFinais = colunas.map(() => totalLargura / colunas.length)
    }

    const getColWidth = (c: number) => largurasFinais[c] ?? (totalLargura / colunas.length)

    const getColX = (colIdx: number) => {
      let x = PAGE_MARGIN
      for (let i = 0; i < colIdx; i++) {
        x += getColWidth(i)
      }
      return x
    }

    // Draw Headers
    for (let c = 0; c < colunas.length; c++) {
      const cWidth = getColWidth(c)
      page.drawText(colunas[c], {
        x: getColX(c),
        y,
        size: bodySize + 0.5,
        font: fontBold,
        color: rgb(0, 0, 0),
        maxWidth: cWidth - 4,
      })
    }
    y -= bodySize + 6

    page.drawLine({
      start: { x: PAGE_MARGIN, y },
      end: { x: pageW - PAGE_MARGIN, y },
      thickness: 1,
      color: rgb(0.7, 0.7, 0.7),
    })
    y -= 10

    if (dadosLinhas.length === 0) {
      page.drawText('Nenhum registro clínico encontrado para os filtros selecionados.', {
        x: PAGE_MARGIN,
        y,
        size: bodySize,
        font,
        color: rgb(0.4, 0.4, 0.4),
      })
    } else {
      for (const linha of dadosLinhas) {
        if (y < PAGE_MARGIN + FOOTER_RESERVE) {
          page = pdf.addPage([pageW, pageH])
          y = pageH - PAGE_MARGIN - 20

          for (let c = 0; c < colunas.length; c++) {
            const cWidth = getColWidth(c)
            page.drawText(colunas[c], {
              x: getColX(c),
              y,
              size: bodySize + 0.5,
              font: fontBold,
              color: rgb(0, 0, 0),
              maxWidth: cWidth - 4,
            })
          }
          y -= bodySize + 6
          page.drawLine({
            start: { x: PAGE_MARGIN, y },
            end: { x: pageW - PAGE_MARGIN, y },
            thickness: 1,
            color: rgb(0.7, 0.7, 0.7),
          })
          y -= 10
        }

        for (let c = 0; c < linha.length; c++) {
          const val = sanitizarTextoParaPdf(linha[c])
          const cWidth = getColWidth(c)
          page.drawText(val, {
            x: getColX(c),
            y,
            size: bodySize,
            font,
            color: rgb(0.15, 0.15, 0.18),
            maxWidth: cWidth - 6,
          })
        }
        y -= bodySize + 7
      }
    }

    for (const p of pdf.getPages()) {
      drawRodapePajoTecnologia(p, font)
    }

    const bytes = await pdf.save()
    const fname = `relatorio-clinico-${tipo}-${new Date().toISOString().slice(0, 10)}.pdf`

    return new NextResponse(Buffer.from(bytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${fname}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (erro) {
    console.error(`[GET /api/relatorios/clinicos?tipo=${tipo}]`, erro)
    return NextResponse.json({ sucesso: false, erro: 'Erro ao gerar relatório clínico.' }, { status: 500 })
  }
}
