// app/api/atendimento/[atendimentoId]/bercario/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { schemaFichaBercario } from '@/lib/validations/obstetricia'
import { atendimentoObstetricoPermitido } from '@/lib/obstetricia'
import { prontuarioEstaEncerrado } from '@/lib/atendimento-prontuario'
import {
  includeAtendimentoInternacao,
  identificacaoPacienteInternacao,
} from '@/lib/prefill-internamento'

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
  'TECNICO_ENFERMAGEM',
] as const

export async function GET(
  req: NextRequest,
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
    const atendimento = await prisma.atendimento.findFirst({
      where: { id: atendimentoId, deletedAt: null },
      include: includeAtendimentoInternacao,
    })

    if (!atendimento) {
      return NextResponse.json(
        { sucesso: false, erro: 'Atendimento não encontrado.' },
        { status: 404 }
      )
    }

    if (!atendimentoObstetricoPermitido(atendimento.obstetrico, atendimento.paciente.sexoBiologico)) {
      return NextResponse.json(
        { sucesso: false, erro: 'Dados de berçário disponíveis somente para atendimento obstétrico de paciente do sexo biológico feminino.' },
        { status: 403 }
      )
    }

    const ficha = await prisma.fichaBercario.findUnique({ where: { atendimentoId } })
    const fichaObstetrica = await prisma.fichaInternacaoObstetrica.findUnique({ where: { atendimentoId } })
    const id = identificacaoPacienteInternacao(atendimento)

    // Buscar RN cadastrado no sistema vinculado à mãe
    const nomeMae = atendimento.paciente.nomeExibicao
    const rns = await prisma.paciente.findMany({
      where: {
        deletedAt: null,
        OR: [
          { nomeMae: { equals: nomeMae, mode: 'insensitive' } },
          { nomeExibicao: { startsWith: `RN de ${nomeMae}`, mode: 'insensitive' } },
          { nomeExibicao: { startsWith: `RN ${nomeMae}`, mode: 'insensitive' } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      include: {
        atendimentos: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { id: true, numeroAtendimento: true, status: true },
        },
      },
    })

    const rnCadastrado = rns[0]
    const camposObst = (fichaObstetrica?.campos as Record<string, string>) || {}
    const camposFicha = (ficha?.campos as Record<string, string>) || {}

    // Montar endereço e contato da mãe
    const end = atendimento.paciente.endereco
    const enderecoMae = end
      ? [end.logradouro, end.numero, end.bairro, end.cidade, end.estado].filter(Boolean).join(', ')
      : ''

    const rnSexoFormatado = rnCadastrado?.sexoBiologico === 'FEMININO'
      ? 'Feminino'
      : rnCadastrado?.sexoBiologico === 'MASCULINO'
      ? 'Masculino'
      : ''

    const rnNascFormatado = rnCadastrado?.dataNascimento
      ? new Date(rnCadastrado.dataNascimento).toISOString().split('T')[0]
      : ''

    // Extrair APGAR e peso se foram anotados na ficha obstétrica ou observações
    const pesoSugerido =
      camposFicha['rn_peso'] ||
      camposObst['rn_peso'] ||
      ''

    const apgar1Sugerido =
      camposFicha['rn_apgar1'] ||
      camposObst['rn_apgar1'] ||
      ''

    const apgar5Sugerido =
      camposFicha['rn_apgar5'] ||
      camposObst['rn_apgar5'] ||
      ''

    const sexoRnSugerido =
      camposFicha['rn_sexo'] ||
      camposObst['rn_sexo'] ||
      rnSexoFormatado ||
      'Não informado'

    // Dados sugeridos consolidados
    const camposSugeridos: Record<string, string> = {
      rn_filiacaoMae: nomeMae,
      rn_residencia: enderecoMae,
      rn_leito: id.leitoDescricao ?? '',
      rn_sexo: sexoRnSugerido,
      rn_peso: pesoSugerido,
      rn_apgar1: apgar1Sugerido,
      rn_apgar5: apgar5Sugerido,
      rn_estatura: camposObst['rn_comprimento'] || '',
      rn_nascidoEm: camposObst['parto_hora'] || rnNascFormatado || '',
      rn_condicoesAparentes: camposObst['rn_vitalidade'] || '',
      rn_olhosProfilatica: camposObst['rn_olhosProfilatica'] || '',
      rn_cordaoCurativo: camposObst['rn_cordaoCurativo'] || '',
      ant_maeCor: atendimento.paciente.racaCor || '',
      ant_gestacao: camposObst['am_gesta'] || '',
      // Vínculo do RN registrado
      rn_vinculado_nome: rnCadastrado?.nomeExibicao || `RN de ${nomeMae}`,
      rn_vinculado_prontuario: rnCadastrado?.atendimentos[0]?.numeroAtendimento || '',
      rn_vinculado_atendimento_id: rnCadastrado?.atendimentos[0]?.id || '',
      rn_vinculado_paciente_id: rnCadastrado?.id || '',
    }

    // Unir os campos sugeridos com os campos já salvos pelo usuário na ficha de berçário
    const camposFinal = { ...camposSugeridos, ...camposFicha }

    return NextResponse.json({
      sucesso: true,
      dados: {
        prefill: {
          id: ficha?.id,
          nomePaciente: id.nomePaciente,
          numeroProntuario: id.numeroProntuario,
          leitoDescricao: id.leitoDescricao,
          campos: camposFinal,
          evolucao: ficha?.evolucao ?? [],
          rnVinculado: rnCadastrado
            ? {
                id: rnCadastrado.id,
                nome: rnCadastrado.nomeExibicao,
                sexo: rnSexoFormatado,
                nascimento: rnNascFormatado,
                prontuario: rnCadastrado.atendimentos[0]?.numeroAtendimento ?? null,
                atendimentoId: rnCadastrado.atendimentos[0]?.id ?? null,
              }
            : null,
        },
        paciente: {
          nomeExibicao: atendimento.paciente.nomeExibicao,
          numeroAtendimento: atendimento.numeroAtendimento,
        },
      },
    })
  } catch (erro) {
    console.error('[GET bercario]', erro)
    return NextResponse.json({ sucesso: false, erro: 'Erro ao carregar ficha de berçário.' }, { status: 500 })
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
    if (await prontuarioEstaEncerrado(atendimentoId)) {
      return NextResponse.json(
        { sucesso: false, erro: 'Prontuário encerrado. Edição não permitida.' },
        { status: 409 }
      )
    }

    const atendimento = await prisma.atendimento.findFirst({
      where: { id: atendimentoId, deletedAt: null },
      select: {
        id: true,
        obstetrico: true,
        paciente: { select: { sexoBiologico: true } },
      },
    })

    if (!atendimento) {
      return NextResponse.json(
        { sucesso: false, erro: 'Atendimento não encontrado.' },
        { status: 404 }
      )
    }

    if (!atendimentoObstetricoPermitido(atendimento.obstetrico, atendimento.paciente.sexoBiologico)) {
      return NextResponse.json(
        { sucesso: false, erro: 'Dados de berçário disponíveis somente para atendimento obstétrico de paciente do sexo biológico feminino.' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const validacao = schemaFichaBercario.safeParse(body)
    if (!validacao.success) {
      return NextResponse.json(
        { sucesso: false, erro: 'Dados inválidos.', detalhes: validacao.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const dados = validacao.data
    const dadosPrisma = {
      campos: dados.campos ?? {},
      evolucao: dados.evolucao ?? [],
      preenchidoPorId: sessao.usuario.id,
    }

    const ficha = await prisma.fichaBercario.upsert({
      where: { atendimentoId },
      create: { atendimentoId, ...dadosPrisma },
      update: dadosPrisma,
    })

    await prisma.logAuditoria.create({
      data: {
        usuarioId: sessao.usuario.id,
        acao: 'ATUALIZACAO',
        entidade: 'FichaBercario',
        entidadeId: ficha.id,
        ipOrigem: req.headers.get('x-forwarded-for') ?? null,
      },
    })

    return NextResponse.json({ sucesso: true, dados: ficha })
  } catch (erro) {
    console.error('[PUT bercario]', erro)
    return NextResponse.json({ sucesso: false, erro: 'Erro ao salvar ficha de berçário.' }, { status: 500 })
  }
}
