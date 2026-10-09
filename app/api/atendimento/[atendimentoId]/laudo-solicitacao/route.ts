// app/api/atendimento/[atendimentoId]/laudo-solicitacao/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { schemaLaudoSolicitacao } from '@/lib/validations/laudo-solicitacao'
import { carregarDadosLaudoSolicitacao } from '@/lib/laudo-solicitacao'

const ROLES_LEITURA = [
  'ADMIN',
  'MEDICO',
  'DIRETOR_CLINICO',
  'ENFERMEIRO',
  'TECNICO_ENFERMAGEM',
  'RECEPCIONISTA',
] as const

const ROLES_ESCRITA = [
  'ADMIN',
  'MEDICO',
  'DIRETOR_CLINICO',
  'ENFERMEIRO',
] as const

function parseDateSafe(val?: string | null): Date | null {
  if (!val || typeof val !== 'string' || !val.trim()) return null
  const trimmed = val.trim()
  
  // DD/MM/YYYY or DD-MM-YYYY
  if (/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/.test(trimmed)) {
    const match = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/)
    if (match) {
      const d = parseInt(match[1], 10)
      const m = parseInt(match[2], 10)
      const y = parseInt(match[3], 10)
      const dt = new Date(Date.UTC(y, m - 1, d, 12, 0, 0))
      return isNaN(dt.getTime()) ? null : dt
    }
  }

  // YYYY-MM-DD
  if (/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/.test(trimmed)) {
    const match = trimmed.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/)
    if (match) {
      const y = parseInt(match[1], 10)
      const m = parseInt(match[2], 10)
      const d = parseInt(match[3], 10)
      const dt = new Date(Date.UTC(y, m - 1, d, 12, 0, 0))
      return isNaN(dt.getTime()) ? null : dt
    }
  }

  const dt = new Date(trimmed)
  return isNaN(dt.getTime()) ? null : dt
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ atendimentoId: string }> }
) {
  const { atendimentoId } = await params
  const sessao = await getServerSession(authOptions)
  if (!sessao) {
    return NextResponse.json({ sucesso: false, erro: 'Não autorizado.' }, { status: 401 })
  }
  if (!ROLES_LEITURA.includes(sessao.usuario.role as (typeof ROLES_LEITURA)[number])) {
    return NextResponse.json({ sucesso: false, erro: 'Sem permissão.' }, { status: 403 })
  }

  try {
    const dados = await carregarDadosLaudoSolicitacao(atendimentoId, {
      nome: sessao.usuario.nome,
      crm: sessao.usuario.crm,
    })

    if (!dados) {
      return NextResponse.json(
        {
          sucesso: false,
          erro: 'Atendimento não encontrado ou inválido.',
        },
        { status: 404 }
      )
    }

    return NextResponse.json({ sucesso: true, dados })
  } catch (erro) {
    console.error('[GET laudo-solicitacao]', erro)
    return NextResponse.json(
      { sucesso: false, erro: 'Erro ao carregar laudo de solicitação.' },
      { status: 500 }
    )
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ atendimentoId: string }> }
) {
  const { atendimentoId } = await params
  const sessao = await getServerSession(authOptions)
  if (!sessao) {
    return NextResponse.json({ sucesso: false, erro: 'Não autorizado.' }, { status: 401 })
  }
  if (!ROLES_ESCRITA.includes(sessao.usuario.role as (typeof ROLES_ESCRITA)[number])) {
    return NextResponse.json({ sucesso: false, erro: 'Sem permissão.' }, { status: 403 })
  }

  try {
    const atendimento = await prisma.atendimento.findFirst({
      where: {
        deletedAt: null,
        OR: [
          { id: atendimentoId },
          { numeroAtendimento: atendimentoId },
        ],
      },
      select: { id: true, laudoSolicitacao: { select: { id: true } } },
    })

    if (!atendimento) {
      return NextResponse.json(
        {
          sucesso: false,
          erro: 'Atendimento não encontrado.',
        },
        { status: 404 }
      )
    }

    const body = await req.json()
    const validacao = schemaLaudoSolicitacao.safeParse(body)
    if (!validacao.success) {
      console.warn('[PUT laudo-solicitacao] Validação falhou:', validacao.error.flatten().fieldErrors)
      return NextResponse.json(
        {
          sucesso: false,
          erro: 'Dados inválidos ao salvar laudo.',
          detalhes: validacao.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const d = validacao.data
    const dadosPrisma = {
      status: d.status,
      nomeHospital: d.nomeHospital ?? null,
      cnpjHospital: d.cnpjHospital ?? null,
      nomePaciente: d.nomePaciente ?? null,
      numeroAih: d.numeroAih ?? null,
      procedimentoAnterior: d.procedimentoAnterior ?? null,
      procedimentoSolicitado: d.procedimentoSolicitado ?? null,
      nomeMedicoSolicitante: d.nomeMedicoSolicitante ?? null,
      crmMedicoSolicitante: d.crmMedicoSolicitante ?? null,
      cpfMedicoSolicitante: d.cpfMedicoSolicitante ?? null,

      mudancaProcedimento: Boolean(d.mudancaProcedimento),
      diariaUti: Boolean(d.diariaUti),
      diariaAcompanhante: Boolean(d.diariaAcompanhante),
      vacinaAntiRh: Boolean(d.vacinaAntiRh),
      usoProteseOtica: Boolean(d.usoProteseOtica),
      usoFatoresCoagulacao: Boolean(d.usoFatoresCoagulacao),
      usoOrdenadores: Boolean(d.usoOrdenadores),
      nutricaoParenteral: Boolean(d.nutricaoParenteral),

      justificativa: d.justificativa ?? null,

      dataSolicitacao: parseDateSafe(d.dataSolicitacao) ?? new Date(),
      nomeAcompanhante: d.nomeAcompanhante ?? null,
      dataAuditoria: parseDateSafe(d.dataAuditoria),
      parecerAuditor: d.parecerAuditor ?? null,
      nomeAuditor: d.nomeAuditor ?? null,
      crmAuditor: d.crmAuditor ?? null,

      preenchidoPorId: sessao.usuario.id,
    }

    let laudo
    if (atendimento.laudoSolicitacao) {
      laudo = await prisma.laudoSolicitacao.update({
        where: { id: atendimento.laudoSolicitacao.id },
        data: dadosPrisma,
      })
      await prisma.logAuditoria.create({
        data: {
          usuarioId: sessao.usuario.id,
          acao: 'ATUALIZACAO',
          entidade: 'LaudoSolicitacao',
          entidadeId: laudo.id,
          valorNovo: validacao.data.status,
          ipOrigem: req.headers.get('x-forwarded-for') ?? null,
        },
      }).catch((err) => console.warn('[LogAuditoria LaudoSolicitacao Update]', err))
    } else {
      laudo = await prisma.laudoSolicitacao.create({
        data: {
          atendimentoId: atendimento.id,
          ...dadosPrisma,
        },
      })
      await prisma.logAuditoria.create({
        data: {
          usuarioId: sessao.usuario.id,
          acao: 'CRIACAO',
          entidade: 'LaudoSolicitacao',
          entidadeId: laudo.id,
          valorNovo: validacao.data.status,
          ipOrigem: req.headers.get('x-forwarded-for') ?? null,
        },
      }).catch((err) => console.warn('[LogAuditoria LaudoSolicitacao Create]', err))
    }

    return NextResponse.json({ sucesso: true, dados: laudo })
  } catch (erro) {
    console.error('[PUT laudo-solicitacao]', erro)
    return NextResponse.json(
      { sucesso: false, erro: 'Erro ao salvar laudo de solicitação.' },
      { status: 500 }
    )
  }
}
