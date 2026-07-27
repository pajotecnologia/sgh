// app/(dashboard)/atendimento/page.tsx — Fila do consultório + fila de espera (triagem)

import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { obterNomeCompletoPaciente } from '@/lib/nome-paciente-exibicao'
import Link from 'next/link'
import { Stethoscope, Clock, Users, ClipboardCheck, BedDouble } from 'lucide-react'
import { BadgeManchester } from '@/components/triagem/BadgeManchester'
import { BotaoChamarPainel } from '@/components/atendimento/BotaoChamarPainel'
import { FilaTriagem } from '@/components/triagem/FilaTriagem'
import { ListaEmAtendimentoPaginada } from '@/components/atendimento/ListaEmAtendimentoPaginada'
import { PaginacaoLista } from '@/components/shared/PaginacaoLista'
import { parsePaginacao } from '@/lib/paginacao'

export const metadata: Metadata = { title: 'Fila de Atendimento' }

export default async function PaginaAtendimentoMedico({
  searchParams,
}: {
  searchParams: Promise<{ atendidosPagina?: string; atendidosPorPagina?: string }>
}) {
  const paramsPag = await searchParams
  const pagAtendidos = parsePaginacao(
    {
      pagina: paramsPag.atendidosPagina,
      porPagina: paramsPag.atendidosPorPagina,
    },
    'atendidos'
  )
  const sessao = await getServerSession(authOptions)

  if (!['ADMIN', 'MEDICO', 'DIRETOR_CLINICO'].includes(sessao?.usuario.role ?? '')) {
    return (
      <div className="p-6 text-center text-muted-foreground text-sm">
        Acesso restrito ao corpo clínico.
      </div>
    )
  }

  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const amanha = new Date(hoje)
  amanha.setDate(amanha.getDate() + 1)

  const fila = await prisma.atendimento.findMany({
    where: {
      deletedAt: null,
      status: { in: ['AGUARDANDO_ATENDIMENTO', 'EM_ATENDIMENTO'] },
    },
    include: {
      paciente: { select: { nomeExibicao: true, nomeCriptografado: true } },
      triagem: { select: { corClassificacao: true, classificadoEm: true } },
    },
    orderBy: [
      { status: 'asc' },
      { triagem: { classificadoEm: 'asc' } },
    ],
  })

  const emAtendimento = fila.filter((a) => {
    if (a.status !== 'EM_ATENDIMENTO') return false
    if (sessao?.usuario.role === 'MEDICO') return a.medicoId === sessao.usuario.id
    return true
  })

  const aguardandoCount = fila.filter((a) => a.status === 'AGUARDANDO_ATENDIMENTO').length

  const whereAtendidosHoje = {
    encerradoEm: { gte: hoje, lt: amanha },
    atendimento: {
      deletedAt: null,
      medicoId: sessao?.usuario.role === 'MEDICO' ? sessao.usuario.id : { not: null },
    },
  } as const

  const [finalizadosHoje, totalAtendidosHoje] = await Promise.all([
    prisma.prontuarioMedico.findMany({
    where: whereAtendidosHoje,
    include: {
      atendimento: {
        include: {
          paciente: { select: { nomeExibicao: true, nomeCriptografado: true } },
          medico: { select: { id: true, nome: true } },
        },
      },
      encaminhamentos: {
        where: { tipo: 'INTERNACAO' },
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { id: true, especialidade: true },
      },
      prescricoes: {
        where: { tipo: 'RECEITA_ALTA' },
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { id: true, numeroPrescricao: true },
      },
    },
    orderBy: { encerradoEm: 'desc' },
    skip: pagAtendidos.skip,
    take: pagAtendidos.take,
  }),
    prisma.prontuarioMedico.count({ where: whereAtendidosHoje }),
  ])

  const itensEmAtendimento = emAtendimento.map((a) => ({
    id: a.id,
    numeroAtendimento: a.numeroAtendimento,
    nomeLista: obterNomeCompletoPaciente(a.paciente.nomeExibicao, a.paciente.nomeCriptografado),
    corTriagem: a.triagem?.corClassificacao,
  }))

  const podeChamar = ['ADMIN', 'MEDICO', 'DIRETOR_CLINICO'].includes(sessao?.usuario.role ?? '')

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="page-title flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-primary" />
            Atendimento Médico
          </h2>
          <p className="page-subtitle">
            Fila de espera pós-triagem e consultório.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-[11px] font-medium">
          <div className="flex items-center gap-1 text-emerald-600">
            <ClipboardCheck className="h-3.5 w-3.5 shrink-0" />
            {totalAtendidosHoje} atendidos hoje
          </div>
          <div className="flex items-center gap-1 text-blue-600">
            <Users className="h-3.5 w-3.5" />
            {emAtendimento.length} em atend.
          </div>
          <div className="flex items-center gap-1 text-orange-600">
            <Clock className="h-3.5 w-3.5" />
            {aguardandoCount} aguardando
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Fila de espera (mesma da triagem — Manchester + tempo real) */}
        <section className="xl:col-span-1 bg-card border border-border rounded-lg p-3">
          <FilaTriagem
            podeCharmar={podeChamar}
            compacto
            mostrarLinkAtendimento
            titulo="Fila de Espera"
          />
        </section>

        <div className="xl:col-span-2 space-y-4">
          <ListaEmAtendimentoPaginada
            itens={itensEmAtendimento}
            titulo={
              sessao?.usuario.role === 'MEDICO'
                ? 'Meus pacientes em atendimento'
                : 'Em atendimento'
            }
          />

          <section>
            <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Atendidos hoje
            </h3>
            {totalAtendidosHoje === 0 ? (
              <div className="bg-card border border-border rounded-lg p-6 text-center text-xs text-muted-foreground">
                Nenhum atendimento registrado hoje.
              </div>
            ) : (
              <div className="bg-card border border-border rounded-lg overflow-hidden">
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="border-b border-border bg-muted/20">
                      <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Paciente</th>
                      <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Desfecho</th>
                      <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Atend.</th>
                      {sessao?.usuario.role !== 'MEDICO' && (
                        <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Médico</th>
                      )}
                      <th className="text-right px-3 py-2 font-semibold text-muted-foreground">Documentos</th>
                      <th className="text-right px-3 py-2 font-semibold text-muted-foreground">Hora</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {finalizadosHoje.map((p) => {
                      const a = p.atendimento
                      const nomeLista = obterNomeCompletoPaciente(
                        a.paciente.nomeExibicao,
                        a.paciente.nomeCriptografado
                      )
                      const horario = new Intl.DateTimeFormat('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      }).format(p.encerradoEm ?? p.updatedAt)
                      const ultimaReceita = p.prescricoes?.[0] ?? null
                      const encInternacao = p.encaminhamentos?.[0] ?? null
                      const ehInternacao =
                        a.status === 'AGUARDANDO_INTERNACAO' ||
                        a.status === 'INTERNADO' ||
                        Boolean(encInternacao)

                      return (
                        <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                          <td className="px-3 py-2 font-medium">{nomeLista}</td>
                          <td className="px-3 py-2">
                            {ehInternacao ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-100 text-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-200">
                                <BedDouble className="h-3 w-3" />
                                Internação
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200">
                                Alta PS
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            <div className="font-mono text-[10px] text-muted-foreground">{a.numeroAtendimento}</div>
                            <Link className="text-[10px] text-primary hover:underline" href={`/atendimento/${a.id}`}>
                              Abrir
                            </Link>
                          </td>
                          {sessao?.usuario.role !== 'MEDICO' && (
                            <td className="px-3 py-2 text-muted-foreground">{a.medico?.nome ?? '—'}</td>
                          )}
                          <td className="px-3 py-2 text-right">
                            <div className="inline-flex flex-wrap justify-end gap-2">
                              {ehInternacao && encInternacao ? (
                                <Link
                                  href={`/atendimento/encaminhamento/imprimir/${encInternacao.id}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[10px] font-semibold text-indigo-700 dark:text-indigo-300 hover:underline"
                                >
                                  Solic. internação
                                </Link>
                              ) : null}
                              <Link
                                href={`/atendimento/atestados/medico/${a.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] font-semibold text-primary hover:underline"
                              >
                                Atest. médico
                              </Link>
                              <Link
                                href={`/atendimento/atestados/acompanhante/${a.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] font-semibold text-primary hover:underline"
                              >
                                Atest. acomp.
                              </Link>
                              {!ehInternacao && ultimaReceita ? (
                                <Link
                                  href={`/atendimento/receita/imprimir/${ultimaReceita.id}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[10px] font-semibold text-primary hover:underline"
                                >
                                  Receita
                                </Link>
                              ) : null}
                              {!ehInternacao ? (
                                <Link
                                  href={`/atendimento/receita-alta/${a.id}`}
                                  className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 hover:underline"
                                >
                                  {ultimaReceita ? 'Nova receita' : 'Receita de alta'}
                                </Link>
                              ) : null}
                            </div>
                          </td>
                          <td className="px-3 py-2 text-right text-muted-foreground">{horario}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                <PaginacaoLista
                  total={totalAtendidosHoje}
                  pagina={pagAtendidos.pagina}
                  porPagina={pagAtendidos.porPagina}
                  basePath="/atendimento"
                  prefixo="atendidos"
                />
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
