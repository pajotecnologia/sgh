// lib/admitir-paciente-internacao.ts — Recepção pela enfermagem (internação efetiva)

import { format } from 'date-fns'
import { prisma } from '@/lib/prisma'
import { descricaoLeitoInternacao } from '@/lib/prefill-internamento'
import { fichaHospitalarPreenchida } from '@/lib/internacao-completude'

export type ResultadoAdmissao = {
  atendimentoId: string
  leitoId: string | null
  status: 'INTERNADO'
}

export async function admitirPacienteInternacao(
  atendimentoId: string,
  leitoId: string,
  usuarioId: string
): Promise<ResultadoAdmissao> {
  const atendimento = await prisma.atendimento.findFirst({
    where: { id: atendimentoId, deletedAt: null, status: 'AGUARDANDO_INTERNACAO' },
    include: {
      leito: { select: { ala: true, quarto: true, codigo: true, tipo: true } },
      prontuario: {
        select: {
          encaminhamentos: {
            where: { tipo: 'INTERNACAO' },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      },
      laudoInternacao: { select: { id: true, status: true, autorizacao: true } },
      fichaInternacaoAlta: { select: { status: true } },
    },
  })

  if (!atendimento) {
    throw new Error('Paciente não encontrado ou não está aguardando internação.')
  }

  // Paciente obstétrico usa a ficha obstétrica, não a Folha de Internação e Alta hospitalar.
  if (!atendimento.obstetrico && !fichaHospitalarPreenchida(atendimento.fichaInternacaoAlta?.status)) {
    throw new Error(
      'Conclua a ficha hospitalar (Folha de Internação e Alta) antes de confirmar a internação.'
    )
  }

  const enc = atendimento.prontuario?.encaminhamentos?.[0]
  const setorNovo = enc?.especialidade?.trim() || null
  const hoje = format(new Date(), 'yyyy-MM-dd')

  const resultado = await prisma.$transaction(async (tx) => {
    const leito = await tx.leito.findUnique({
      where: { id: leitoId },
      select: { id: true, ativo: true, status: true, ala: true, quarto: true, codigo: true, tipo: true },
    })

    if (!leito || !leito.ativo) {
      throw new Error('Leito inválido ou inativo.')
    }
    if (leito.status !== 'DISPONIVEL') {
      throw new Error('Leito indisponível. Selecione um leito disponível.')
    }

    const ocupou = await tx.leito.updateMany({
      where: { id: leitoId, status: 'DISPONIVEL', ativo: true },
      data: { status: 'OCUPADO' },
    })
    if (ocupou.count === 0) {
      throw new Error('Leito foi ocupado por outro usuário. Atualize a tela e tente novamente.')
    }

    const leitoDesc = descricaoLeitoInternacao(leito)
    const autAtual = (atendimento.laudoInternacao?.autorizacao ?? {}) as Record<string, unknown>
    const autorizacaoAtualizada = {
      ...autAtual,
      dataAdmissao: String(autAtual.dataAdmissao ?? hoje),
      enfermariaLeito: String(autAtual.enfermariaLeito ?? leitoDesc),
    }

    if (atendimento.laudoInternacao) {
      await tx.laudoInternacao.update({
        where: { id: atendimento.laudoInternacao.id },
        data: { autorizacao: autorizacaoAtualizada },
      })
    }

    const atualizado = await tx.atendimento.update({
      where: { id: atendimentoId },
      data: {
        status: 'INTERNADO',
        leitoId,
        ...(setorNovo ? { setor: setorNovo } : {}),
      },
    })

    await tx.logAuditoria.create({
      data: {
        usuarioId,
        acao: 'ATUALIZACAO',
        entidade: 'Atendimento',
        entidadeId: atendimentoId,
        valorAnterior: 'AGUARDANDO_INTERNACAO',
        valorNovo: `INTERNADO — leito ${leito.ala}/${leito.codigo}`,
      },
    })

    return atualizado
  })

  return {
    atendimentoId: resultado.id,
    leitoId: resultado.leitoId,
    status: 'INTERNADO',
  }
}
