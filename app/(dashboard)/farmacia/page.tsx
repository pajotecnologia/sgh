// app/(dashboard)/farmacia/page.tsx — Dispensação / triagem farmacêutica



import type { Metadata } from 'next'

import { getServerSession } from 'next-auth'

import { redirect } from 'next/navigation'

import { authOptions } from '@/lib/auth'

import { prisma } from '@/lib/prisma'

import { Pill, ClipboardCheck } from 'lucide-react'

import { FiltrosTriagemFarmacia } from '@/components/farmacia/FiltrosTriagemFarmacia'

import { ListaTriagemFarmacia } from '@/components/farmacia/ListaTriagemFarmacia'

import { verificarSaldoDisponivel, calcularAlocacaoFefo } from '@/lib/farmacia-estoque'



export const metadata: Metadata = { title: 'Dispensação' }



const ROLES = ['ADMIN', 'FARMACEUTICO'] as const



type PageProps = {

  searchParams: Promise<{ status?: string; ala?: string; leito?: string }>

}



export default async function PaginaFarmacia({ searchParams }: PageProps) {

  const sessao = await getServerSession(authOptions)

  if (!sessao) redirect('/login')

  if (!ROLES.includes(sessao.usuario.role as (typeof ROLES)[number])) redirect('/acesso-negado')



  const params = await searchParams

  const status = (params.status ?? '').trim()

  const ala = (params.ala ?? '').trim()

  const leito = (params.leito ?? '').trim()



  const whereStatus =

    status === 'APROVADO' || status === 'REJEITADO' || status === 'AGUARDANDO_TRIAGEM'

      ? { status: status as 'APROVADO' | 'REJEITADO' | 'AGUARDANDO_TRIAGEM' }

      : {}



  const itensRaw = await prisma.tbFarmaciaDispensacao.findMany({

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



  const itens = await Promise.all(

    itensRaw.map(async (disp) => {

      const medId = disp.item.medicamentoId

      const qtd = disp.item.quantidadeSolicitada ?? 1

      let saldoInfo = {

        saldoAtual: disp.item.medicamento?.saldoAtual ?? null,

        saldoSuficiente: true,

        mensagemSaldo: null as string | null,

        alocacaoFefo: null as Array<{ lote: string; validade: string | null; quantidade: number }> | null,

      }



      if (medId && disp.status === 'AGUARDANDO_TRIAGEM') {

        const check = await verificarSaldoDisponivel(prisma, medId, qtd)

        const alocacao = check.ok ? await calcularAlocacaoFefo(prisma, medId, qtd) : null

        saldoInfo = {

          saldoAtual: check.saldoAtual,

          saldoSuficiente: check.ok,

          mensagemSaldo: check.mensagem ?? null,

          alocacaoFefo: alocacao?.map((a) => ({

            lote: a.lote,

            validade: a.validade?.toISOString() ?? null,

            quantidade: a.quantidade,

          })) ?? null,

        }

      }



      return { ...disp, saldoInfo }

    })

  )



  return (

    <div className="max-w-5xl mx-auto space-y-4 w-full min-w-0">

      <div className="min-w-0">

        <h1 className="page-title flex flex-wrap items-center gap-2">

          <Pill className="h-5 w-5 text-primary shrink-0" aria-hidden />

          <span>Dispensação</span>

        </h1>

        <p className="page-subtitle flex items-start gap-2">

          <ClipboardCheck className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" aria-hidden />

          Valide prescrições da enfermagem/atendimento, verifique saldo em estoque (trava estrita) e dispense

          por FEFO (lote mais próximo do vencimento).

        </p>

      </div>



      <FiltrosTriagemFarmacia />

      <ListaTriagemFarmacia itens={itens as never} />

    </div>

  )

}
