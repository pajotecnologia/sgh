import { prisma } from '@/lib/prisma'
import type { Role, CorTriagem } from '@/types'

export interface ItemPendenciaResumo {
  id: string
  titulo: string
  subtitulo: string
  categoria: 'TRIAGEM' | 'MEDICO' | 'ENFERMAGEM' | 'FARMACIA' | 'EXAME' | 'INTERNACAO'
  prioridade: 'CRITICA' | 'ALTA' | 'MEDIA' | 'BAIXA'
  tempoEsperaFormatado?: string
  corTriagem?: CorTriagem | null
  href: string
}

export interface PendenciasUsuarioResultado {
  role: Role
  totalPendencias: number
  criticas: number
  itens: ItemPendenciaResumo[]
  resumoContadores: {
    aguardandoTriagem: number
    aguardandoMedico: number
    medicacoesPendentes: number
    examesComResultado: number
    admissoesPendentes: number
    prescricoesFarmacia: number
    estoqueCritico: number
  }
}

function calcularTempoDecorrido(data: Date): string {
  const agora = new Date()
  const diffMinutos = Math.max(0, Math.floor((agora.getTime() - data.getTime()) / (1000 * 60)))
  if (diffMinutos < 60) return `${diffMinutos} min`
  const horas = Math.floor(diffMinutos / 60)
  const minutos = diffMinutos % 60
  return `${horas}h ${minutos}m`
}

export async function obterPendenciasUsuario(usuarioId: string, role: Role): Promise<PendenciasUsuarioResultado> {
  const hojeInicio = new Date()
  hojeInicio.setHours(0, 0, 0, 0)

  const itens: ItemPendenciaResumo[] = []

  // 1. Pacientes aguardando triagem
  const aguardandoTriagem = await prisma.atendimento.findMany({
    where: {
      status: 'AGUARDANDO_TRIAGEM',
      createdAt: { gte: hojeInicio },
    },
    include: {
      paciente: { select: { id: true, nomeExibicao: true } },
    },
    orderBy: { createdAt: 'asc' },
    take: 10,
  })

  // 2. Pacientes aguardando atendimento médico
  const aguardandoMedico = await prisma.atendimento.findMany({
    where: {
      status: 'AGUARDANDO_ATENDIMENTO',
      createdAt: { gte: hojeInicio },
    },
    include: {
      paciente: { select: { id: true, nomeExibicao: true } },
      triagem: { select: { corClassificacao: true, queixaPrincipal: true } },
    },
    orderBy: { createdAt: 'asc' },
    take: 10,
  })

  // 3. Medicamentos pendentes de aplicação pela enfermagem
  const medicacoesPendentes = await prisma.itemPrescricao.findMany({
    where: {
      status: 'PENDENTE',
      prescricao: {
        prontuario: {
          atendimento: {
            status: { in: ['EM_ATENDIMENTO', 'INTERNADO'] },
          },
        },
      },
    },
    include: {
      prescricao: {
        include: {
          prontuario: {
            include: {
              atendimento: {
                include: {
                  paciente: { select: { id: true, nomeExibicao: true } },
                  leito: { select: { ala: true, codigo: true } },
                },
              },
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'asc' },
    take: 10,
  })

  // 4. Admissões aguardando leito/recepção
  const admissoesPendentes = await prisma.atendimento.findMany({
    where: {
      status: 'AGUARDANDO_INTERNACAO',
    },
    include: {
      paciente: { select: { id: true, nomeExibicao: true } },
      triagem: { select: { corClassificacao: true } },
    },
    orderBy: { createdAt: 'asc' },
    take: 10,
  })

  // 5. Prescrições aguardando triagem da farmácia
  const prescricoesFarmacia = await prisma.tbPrescricaoCabecalho.findMany({
    where: {
      statusValidacao: 'AGUARDANDO_TRIAGEM',
      ativa: true,
    },
    include: {
      atendimento: {
        include: {
          paciente: { select: { id: true, nomeExibicao: true } },
        },
      },
    },
    orderBy: { createdAt: 'asc' },
    take: 10,
  })

  // 6. Exames com resultado disponível recente
  const examesComResultado = await prisma.itemRequisicao.findMany({
    where: {
      OR: [
        { resultado: { not: null } },
        { resultadoPdf: { not: null } },
      ],
      requisicao: {
        prontuario: {
          atendimento: {
            status: { in: ['EM_ATENDIMENTO', 'INTERNADO'] },
            ...(role === 'MEDICO' ? { medicoId: usuarioId } : {}),
          },
        },
      },
    },
    include: {
      requisicao: {
        include: {
          prontuario: {
            include: {
              atendimento: {
                include: {
                  paciente: { select: { id: true, nomeExibicao: true } },
                },
              },
            },
          },
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
    take: 5,
  })

  // Agrupamento e montagem dos cards de pendências conforme o perfil do usuário:

  // Para MÉDICOS e DIRETOR CLÍNICO:
  if (role === 'MEDICO' || role === 'DIRETOR_CLINICO' || role === 'ADMIN') {
    aguardandoMedico.forEach((atend) => {
      const cor = (atend.triagem?.corClassificacao as CorTriagem) || null
      const prioridade =
        cor === 'VERMELHO' || cor === 'LARANJA' ? 'CRITICA' : cor === 'AMARELO' ? 'ALTA' : 'MEDIA'

      itens.push({
        id: `med-atend-${atend.id}`,
        titulo: `${atend.paciente.nomeExibicao}`,
        subtitulo: `Aguardando atendimento (${atend.triagem?.queixaPrincipal || 'Sem queixa informada'})`,
        categoria: 'MEDICO',
        prioridade,
        corTriagem: cor,
        tempoEsperaFormatado: calcularTempoDecorrido(atend.createdAt),
        href: `/atendimento/${atend.id}`,
      })
    })

    examesComResultado.forEach((ex) => {
      const atend = ex.requisicao.prontuario.atendimento
      itens.push({
        id: `exame-res-${ex.id}`,
        titulo: `Resultado disponível: ${ex.nomeExame}`,
        subtitulo: `Paciente: ${atend.paciente.nomeExibicao}`,
        categoria: 'EXAME',
        prioridade: 'ALTA',
        href: `/atendimento/${atend.id}?tab=exames`,
      })
    })
  }

  // Para ENFERMAGEM:
  if (role === 'ENFERMEIRO' || role === 'TECNICO_ENFERMAGEM' || role === 'ADMIN') {
    medicacoesPendentes.forEach((item) => {
      const atend = item.prescricao.prontuario.atendimento
      const localizacao = atend.leito ? `Leito ${atend.leito.codigo}` : 'Pronto-Socorro'
      itens.push({
        id: `med-pend-${item.id}`,
        titulo: `Aplicação: ${item.nomeMedicamento} (${item.dose})`,
        subtitulo: `${atend.paciente.nomeExibicao} • ${localizacao}`,
        categoria: 'ENFERMAGEM',
        prioridade: 'ALTA',
        tempoEsperaFormatado: calcularTempoDecorrido(item.createdAt),
        href: `/enfermagem/${atend.id}`,
      })
    })

    aguardandoTriagem.forEach((atend) => {
      itens.push({
        id: `triagem-pend-${atend.id}`,
        titulo: `Aguardando Triagem: ${atend.paciente.nomeExibicao}`,
        subtitulo: `Chegada às ${atend.createdAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
        categoria: 'TRIAGEM',
        prioridade: 'MEDIA',
        tempoEsperaFormatado: calcularTempoDecorrido(atend.createdAt),
        href: `/triagem/${atend.id}`,
      })
    })

    admissoesPendentes.forEach((atend) => {
      itens.push({
        id: `admissao-pend-${atend.id}`,
        titulo: `Admissão Solicitada: ${atend.paciente.nomeExibicao}`,
        subtitulo: `Aguardando alocação de leito pela enfermagem`,
        categoria: 'INTERNACAO',
        prioridade: 'ALTA',
        corTriagem: (atend.triagem?.corClassificacao as CorTriagem) || null,
        tempoEsperaFormatado: calcularTempoDecorrido(atend.createdAt),
        href: `/internamento/admissoes`,
      })
    })
  }

  // Para FARMÁCIA:
  if (role === 'FARMACEUTICO' || role === 'ADMIN') {
    prescricoesFarmacia.forEach((presc) => {
      itens.push({
        id: `farm-presc-${presc.id}`,
        titulo: `Prescrição aguardando validação`,
        subtitulo: `Paciente: ${presc.atendimento.paciente.nomeExibicao}`,
        categoria: 'FARMACIA',
        prioridade: 'ALTA',
        tempoEsperaFormatado: calcularTempoDecorrido(presc.createdAt),
        href: `/farmacia/triagem/${presc.id}`,
      })
    })
  }

  // Ordenação por criticidade: CRITICA -> ALTA -> MEDIA -> BAIXA
  const ordemPrioridade: Record<string, number> = { CRITICA: 1, ALTA: 2, MEDIA: 3, BAIXA: 4 }
  itens.sort((a, b) => (ordemPrioridade[a.prioridade] ?? 5) - (ordemPrioridade[b.prioridade] ?? 5))

  const criticas = itens.filter((i) => i.prioridade === 'CRITICA').length

  return {
    role,
    totalPendencias: itens.length,
    criticas,
    itens,
    resumoContadores: {
      aguardandoTriagem: aguardandoTriagem.length,
      aguardandoMedico: aguardandoMedico.length,
      medicacoesPendentes: medicacoesPendentes.length,
      examesComResultado: examesComResultado.length,
      admissoesPendentes: admissoesPendentes.length,
      prescricoesFarmacia: prescricoesFarmacia.length,
      estoqueCritico: 0,
    },
  }
}
