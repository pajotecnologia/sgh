// app/api/farmacia/triagem/route.ts

// GET — lista itens para dispensação/triagem | POST — aprovar/rejeitar com FEFO



import { NextRequest, NextResponse } from 'next/server'

import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/auth'

import { prisma } from '@/lib/prisma'

import { z } from 'zod'

import { auditarLgpd } from '@/lib/auditoria-lgpd'

import {

  verificarSaldoDisponivel,

  debitarEstoqueFefo,

  calcularAlocacaoFefo,

} from '@/lib/farmacia-estoque'



const ROLES_FARMACIA = ['ADMIN', 'FARMACEUTICO'] as const



const schemaUpdateTriagem = z.object({

  itemId: z.string().uuid(),

  status: z.enum(['APROVADO', 'REJEITADO']),

  motivoRejeicao: z.string().max(2000).optional().or(z.literal('')),

})



export async function GET(req: NextRequest) {

  const sessao = await getServerSession(authOptions)

  if (!sessao) return NextResponse.json({ sucesso: false, erro: 'Não autorizado.' }, { status: 401 })

  if (!ROLES_FARMACIA.includes(sessao.usuario.role as (typeof ROLES_FARMACIA)[number])) {

    return NextResponse.json({ sucesso: false, erro: 'Sem permissão.' }, { status: 403 })

  }



  try {

    const url = new URL(req.url)

    const status = (url.searchParams.get('status') ?? '').trim()

    const ala = (url.searchParams.get('ala') ?? '').trim()

    const leito = (url.searchParams.get('leito') ?? '').trim()



    const whereStatus =

      status === 'APROVADO' || status === 'REJEITADO' || status === 'AGUARDANDO_TRIAGEM'

        ? { status: status as 'APROVADO' | 'REJEITADO' | 'AGUARDANDO_TRIAGEM' }

        : {}



    const itens = await prisma.tbFarmaciaDispensacao.findMany({

      where: {

        ...whereStatus,

        item: {

          prescricao: {

            atendimento: {

              AND: [

                ala ? { setor: { contains: ala, mode: 'insensitive' } } : {},

                leito ? { sala: { contains: leito, mode: 'insensitive' } } : {},

              ],

            },

          },

        },

      },

      include: {

        item: {

          include: {

            medicamento: {

              select: { id: true, nome: true, saldoAtual: true, estoqueMinimo: true },

            },

            prescricao: {

              include: {

                atendimento: {

                  include: {

                    paciente: { select: { nomeExibicao: true, nomeCriptografado: true } },

                    triagem: { select: { corClassificacao: true } },

                  },

                },

              },

            },

          },

        },

        validadoPor: { select: { nome: true } },

      },

      orderBy: [{ updatedAt: 'desc' }],

      take: 250,

    })



    const itensComSaldo = await Promise.all(

      itens.map(async (disp) => {

        const medId = disp.item.medicamentoId

        const qtd = disp.item.quantidadeSolicitada ?? 1

        let saldoInfo: {

          saldoAtual: number | null

          saldoSuficiente: boolean

          mensagemSaldo: string | null

          alocacaoFefo: Awaited<ReturnType<typeof calcularAlocacaoFefo>> | null

        } = {

          saldoAtual: disp.item.medicamento?.saldoAtual ?? null,

          saldoSuficiente: true,

          mensagemSaldo: null,

          alocacaoFefo: null,

        }



        if (medId && disp.status === 'AGUARDANDO_TRIAGEM') {

          const check = await verificarSaldoDisponivel(prisma, medId, qtd)

          saldoInfo = {

            saldoAtual: check.saldoAtual,

            saldoSuficiente: check.ok,

            mensagemSaldo: check.mensagem ?? null,

            alocacaoFefo: check.ok ? await calcularAlocacaoFefo(prisma, medId, qtd) : null,

          }

        }



        return { ...disp, saldoInfo }

      })

    )



    await auditarLgpd({

      usuarioId: sessao.usuario.id,

      role: sessao.usuario.role as never,

      atendimentoId: null,

      acao: 'LEITURA',

      entidade: 'TbFarmaciaDispensacao',

      entidadeId: null,

      ipOrigem: req.headers.get('x-forwarded-for') ?? null,

      userAgent: req.headers.get('user-agent') ?? null,

      detalhes: {

        filtros: { status: status || null, ala: ala || null, leito: leito || null },

        total: itensComSaldo.length,

      },

    })



    return NextResponse.json({ sucesso: true, dados: itensComSaldo })

  } catch (e) {

    console.error('[GET /api/farmacia/triagem]', e)

    return NextResponse.json({ sucesso: false, erro: 'Erro interno.' }, { status: 500 })

  }

}



export async function POST(req: NextRequest) {

  const sessao = await getServerSession(authOptions)

  if (!sessao) return NextResponse.json({ sucesso: false, erro: 'Não autorizado.' }, { status: 401 })

  if (!ROLES_FARMACIA.includes(sessao.usuario.role as (typeof ROLES_FARMACIA)[number])) {

    return NextResponse.json({ sucesso: false, erro: 'Sem permissão.' }, { status: 403 })

  }



  try {

    const body = await req.json()

    const validacao = schemaUpdateTriagem.safeParse(body)

    if (!validacao.success) {

      return NextResponse.json(

        { sucesso: false, erro: 'Dados inválidos.', detalhes: validacao.error.flatten().fieldErrors },

        { status: 400 }

      )

    }



    const d = validacao.data

    const motivo = (d.motivoRejeicao ?? '').trim()

    if (d.status === 'REJEITADO' && motivo.length < 5) {

      return NextResponse.json(

        { sucesso: false, erro: 'Motivo da rejeição obrigatório (mín. 5 caracteres).' },

        { status: 400 }

      )

    }



    if (d.status === 'APROVADO') {

      const dispAtual = await prisma.tbFarmaciaDispensacao.findUnique({

        where: { itemId: d.itemId },

        include: { item: { include: { medicamento: true } } },

      })

      if (!dispAtual) {

        return NextResponse.json({ sucesso: false, erro: 'Item não encontrado.' }, { status: 404 })

      }

      if (dispAtual.status !== 'AGUARDANDO_TRIAGEM') {

        return NextResponse.json({ sucesso: false, erro: 'Item já validado.' }, { status: 409 })

      }



      const medId = dispAtual.item.medicamentoId

      const qtd = dispAtual.item.quantidadeSolicitada ?? 1



      if (medId) {

        const check = await verificarSaldoDisponivel(prisma, medId, qtd)

        if (!check.ok) {

          return NextResponse.json(

            { sucesso: false, erro: check.mensagem ?? 'Saldo insuficiente para dispensar.' },

            { status: 409 }

          )

        }

      }

    }



    const atualizado = await prisma.$transaction(async (tx) => {

      const disp = await tx.tbFarmaciaDispensacao.update({

        where: { itemId: d.itemId },

        data: {

          status: d.status,

          motivoRejeicao: d.status === 'REJEITADO' ? motivo : null,

          validadoPorId: sessao.usuario.id,

          validadoEm: new Date(),

        },

        include: {

          item: {

            include: {

              prescricao: { select: { atendimentoId: true } },

              medicamento: { select: { id: true, nome: true } },

            },

          },

          saidas: { select: { id: true } },

        },

      })



      await tx.tbPrescricaoItem.update({

        where: { id: d.itemId },

        data: { statusValidacao: d.status },

      })



      await tx.tbPrescricaoCabecalho.update({

        where: { id: disp.item.prescricaoId },

        data: { statusValidacao: d.status },

      })



      if (d.status === 'APROVADO') {

        const jaTemSaida = (disp.saidas ?? []).length > 0

        const medId = disp.item.medicamentoId

        const qtd = disp.item.quantidadeSolicitada ?? 1



        if (!jaTemSaida && medId) {

          const debito = await debitarEstoqueFefo(tx, {

            medicamentoId: medId,

            quantidade: qtd,

            tipo: 'SAIDA_DISPENSACAO',

            referenciaTipo: 'TbFarmaciaDispensacao',

            referenciaId: disp.id,

            usuarioId: sessao.usuario.id,

            observacoes: `Dispensação prescrição item ${d.itemId}`,

          })



          const saida = await tx.tbFarmaciaSaida.create({

            data: {

              tipo: 'DISPENSACAO_PRESCRICAO',

              atendimentoId: disp.item.prescricao.atendimentoId,

              observacoes: `Saída FEFO após aprovação farmacêutica (item ${d.itemId}).`,

              criadoPorId: sessao.usuario.id,

              itens: {

                create: debito.alocacoes.map((a) => ({

                  medicamentoId: medId,

                  loteId: a.loteId,

                  quantidade: a.quantidade,

                  motivo: `Lote ${a.lote}${a.validade ? ` (val. ${a.validade.toISOString().slice(0, 10)})` : ''}`,

                  dispensacaoId: disp.id,

                  prescricaoItemId: disp.item.id,

                })),

              },

            },

            include: { itens: true },

          })



          await tx.tbAuditoriaLog.create({

            data: {

              usuarioId: sessao.usuario.id,

              role: sessao.usuario.role,

              atendimentoId: disp.item.prescricao.atendimentoId,

              acao: 'CRIACAO',

              entidade: 'TbFarmaciaSaida',

              entidadeId: saida.id,

              ipOrigem: req.headers.get('x-forwarded-for') ?? null,

              userAgent: req.headers.get('user-agent') ?? null,

              detalhes: {

                origem: 'dispensacao-fefo',

                dispensacaoId: disp.id,

                itemId: d.itemId,

                lotes: debito.alocacoes,

              },

            },

          })

        }

      }



      await tx.tbAuditoriaLog.create({

        data: {

          usuarioId: sessao.usuario.id,

          role: sessao.usuario.role,

          atendimentoId: disp.item.prescricao.atendimentoId,

          acao: 'ATUALIZACAO',

          entidade: 'TbFarmaciaDispensacao',

          entidadeId: disp.id,

          ipOrigem: req.headers.get('x-forwarded-for') ?? null,

          userAgent: req.headers.get('user-agent') ?? null,

          detalhes: {

            itemId: d.itemId,

            status: d.status,

            motivoRejeicao: d.status === 'REJEITADO' ? motivo : null,

          },

        },

      })



      return disp

    })



    return NextResponse.json({ sucesso: true, dados: atualizado })

  } catch (e) {

    console.error('[POST /api/farmacia/triagem]', e)

    const msg = e instanceof Error ? e.message : 'Erro interno.'

    if (msg.toLowerCase().includes('saldo')) {

      return NextResponse.json({ sucesso: false, erro: msg }, { status: 409 })

    }

    return NextResponse.json({ sucesso: false, erro: 'Erro interno.' }, { status: 500 })

  }

}
