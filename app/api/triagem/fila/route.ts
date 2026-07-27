// app/api/triagem/fila/route.ts
// GET /api/triagem/fila — Fila pós-triagem ou pacientes aguardando triagem

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { PROTOCOLO_MANCHESTER } from '@/types'
import { calcularTempoEspera, alertaTempoManchester } from '@/lib/utils'
import { nomeCompletoParaExibicao } from '@/lib/nome-paciente-exibicao'
import {
  whereAguardandoTriagem,
  whereEmTriagem,
  includePacienteFilaPreTriagem,
} from '@/lib/fila-aguardando-triagem'
import type { StatusAtendimento } from '@prisma/client'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function resolverModoFila(searchParams: URLSearchParams): 'aguardando' | 'em-triagem' | 'pos' {
  const tipo = searchParams.get('tipo')?.toLowerCase()
  if (tipo === 'em-triagem') return 'em-triagem'
  if (tipo === 'pre-triagem' || tipo === 'aguardando' || tipo === 'pre') return 'aguardando'
  if (tipo === 'pos-triagem' || tipo === 'pos') return 'pos'
  return 'pos'
}

export async function GET(req: NextRequest) {
  const sessao = await getServerSession(authOptions)
  if (!sessao) {
    return NextResponse.json({ sucesso: false, erro: 'Não autorizado.' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const setor = searchParams.get('setor') ?? undefined
    const modo = resolverModoFila(searchParams)

    const whereBase =
      modo === 'aguardando'
        ? whereAguardandoTriagem
        : modo === 'em-triagem'
          ? whereEmTriagem
          : {
              deletedAt: null,
              status: 'AGUARDANDO_ATENDIMENTO' as StatusAtendimento,
              ...(setor ? { setor } : {}),
              paciente: { deletedAt: null },
            }

    if (modo === 'aguardando' || modo === 'em-triagem') {
      const atendimentos = await prisma.atendimento.findMany({
        where: whereBase,
        include: includePacienteFilaPreTriagem,
        orderBy: { createdAt: 'asc' },
      })

      const fila = atendimentos.map((a) => ({
        atendimentoId: a.id,
        numeroAtendimento: a.numeroAtendimento,
        nomePaciente: nomeCompletoParaExibicao(
          a.paciente.nomeExibicao,
          a.paciente.nomeCriptografado
        ),
        dataNascimento: a.paciente.dataNascimento.toISOString(),
        sexoBiologico: a.paciente.sexoBiologico,
        convenio: a.paciente.convenio,
        alergias: a.paciente.alergias.map((al) => al.descricao),
        entradaFila: a.createdAt.toISOString(),
        status: a.status,
      }))

      return NextResponse.json(
        { sucesso: true, dados: fila, total: fila.length, modo },
        { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
      )
    }

    const atendimentos = await prisma.atendimento.findMany({
      where: whereBase,
      include: {
        paciente: { select: { nomeExibicao: true, nomeCriptografado: true } },
        triagem: {
          select: {
            corClassificacao: true,
            entradaTriagem: true,
            classificadoEm: true,
            queixaPrincipal: true,
            sinaisVitais: {
              select: {
                escalaDor: true,
                spo2: true,
                temperatura: true,
                paSistolica: true,
                paDiastolica: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    const fila = atendimentos.map((a) => {
      const corTriagem = a.triagem?.corClassificacao ?? null
      const entradaFila = a.triagem?.entradaTriagem ?? a.createdAt
      const tempoEsperaMinutos = calcularTempoEspera(entradaFila)
      const ultrapassado = corTriagem
        ? alertaTempoManchester(corTriagem, tempoEsperaMinutos)
        : false

      const configCor = corTriagem
        ? PROTOCOLO_MANCHESTER.find((c) => c.cor === corTriagem)
        : null

      return {
        atendimentoId: a.id,
        numeroAtendimento: a.numeroAtendimento,
        nomePaciente: nomeCompletoParaExibicao(
          a.paciente.nomeExibicao,
          a.paciente.nomeCriptografado
        ),
        corTriagem,
        labelCor: configCor?.label ?? 'Sem triagem',
        tempoMaximoMinutos: configCor?.tempoMaximoMinutos ?? null,
        entradaFila: entradaFila.toISOString(),
        tempoEsperaMinutos,
        alertaUltrapassado: ultrapassado,
        queixaPrincipal: a.triagem?.queixaPrincipal ?? null,
        sinaisVitais: a.triagem?.sinaisVitais ?? null,
        sala: a.sala,
        setor: a.setor,
      }
    })

    const ORDEM_COR: Record<string, number> = {
      VERMELHO: 0,
      LARANJA: 1,
      AMARELO: 2,
      VERDE: 3,
      AZUL: 4,
      CINZA: 5,
    }

    fila.sort((a, b) => {
      const ordemA = a.corTriagem ? (ORDEM_COR[a.corTriagem] ?? 9) : 10
      const ordemB = b.corTriagem ? (ORDEM_COR[b.corTriagem] ?? 9) : 10
      if (ordemA !== ordemB) return ordemA - ordemB
      return b.tempoEsperaMinutos - a.tempoEsperaMinutos
    })

    return NextResponse.json(
      { sucesso: true, dados: fila, total: fila.length, modo: 'pos' },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
    )
  } catch (erro) {
    console.error('[GET /api/triagem/fila] Erro:', erro)
    return NextResponse.json({ sucesso: false, erro: 'Erro interno.' }, { status: 500 })
  }
}
