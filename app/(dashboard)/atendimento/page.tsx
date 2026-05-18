// app/(dashboard)/atendimento/page.tsx
// Lista de pacientes para atendimento médico (Fila do Consultório)

import type { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { nomeCompletoParaExibicao } from '@/lib/nome-paciente-exibicao';
import Link from 'next/link';
import { Stethoscope, Clock, Users, ClipboardCheck } from 'lucide-react';
import { BadgeManchester } from '@/components/triagem/BadgeManchester';
import { BotaoChamarPainel } from '@/components/atendimento/BotaoChamarPainel';

export const metadata: Metadata = { title: 'Fila de Atendimento' };

export default async function PaginaAtendimentoMedico() {
  const sessao = await getServerSession(authOptions);

  if (!['ADMIN', 'MEDICO', 'DIRETOR_CLINICO'].includes(sessao?.usuario.role ?? '')) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Acesso restrito ao corpo clínico.
      </div>
    );
  }

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const amanha = new Date(hoje);
  amanha.setDate(amanha.getDate() + 1);

  // Buscar pacientes na fila (status: AGUARDANDO_ATENDIMENTO ou EM_ATENDIMENTO)
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
      { status: 'asc' }, // EM_ATENDIMENTO primeiro
      { triagem: { classificadoEm: 'asc' } }, // Depois por ordem de classificação
    ],
  });

  const emAtendimento = fila.filter((a) => {
    if (a.status !== 'EM_ATENDIMENTO') return false;
    if (sessao?.usuario.role === 'MEDICO') return a.medicoId === sessao.usuario.id;
    return true;
  });
  const aguardando = fila.filter(a => a.status === 'AGUARDANDO_ATENDIMENTO');

  const atendidosHoje = await prisma.prontuarioMedico.findMany({
    where: {
      createdAt: { gte: hoje, lt: amanha },
      atendimento: {
        deletedAt: null,
        medicoId: sessao?.usuario.role === 'MEDICO' ? sessao.usuario.id : { not: null },
      },
    },
    include: {
      atendimento: {
        include: {
          paciente: { select: { nomeExibicao: true, nomeCriptografado: true } },
          medico: { select: { id: true, nome: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });

  // Ordenar aguardando por prioridade Manchester
  const ORDEM_COR: Record<string, number> = {
    VERMELHO: 0, LARANJA: 1, AMARELO: 2, VERDE: 3, AZUL: 4, CINZA: 5,
  };

  aguardando.sort((a, b) => {
    const ordemA = a.triagem?.corClassificacao ? (ORDEM_COR[a.triagem.corClassificacao] ?? 9) : 10;
    const ordemB = b.triagem?.corClassificacao ? (ORDEM_COR[b.triagem.corClassificacao] ?? 9) : 10;
    if (ordemA !== ordemB) return ordemA - ordemB;
    // Critério de desempate: tempo de espera
    return (a.triagem?.classificadoEm?.getTime() ?? 0) - (b.triagem?.classificadoEm?.getTime() ?? 0);
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Stethoscope className="h-6 w-6 text-primary" />
            Fila do Consultório
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Pacientes aguardando avaliação médica ou em atendimento.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-sm font-medium">
          <div className="flex items-center gap-1.5 text-emerald-600">
            <ClipboardCheck className="h-4 w-4 shrink-0" />
            {atendidosHoje.length} atendida{atendidosHoje.length === 1 ? '' : 's'} hoje
          </div>
          <div className="flex items-center gap-1.5 text-blue-600">
            <Users className="h-4 w-4" />
            {emAtendimento.length} em atendimento
          </div>
          <div className="flex items-center gap-1.5 text-orange-600">
            <Clock className="h-4 w-4" />
            {aguardando.length} a atender
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Em Atendimento */}
        {emAtendimento.length > 0 && (
          <section>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              {sessao?.usuario.role === 'MEDICO' ? 'Meus Pacientes em Atendimento' : 'Pacientes em Atendimento'}
            </h3>
            <div className="grid gap-3">
              {emAtendimento.map((a) => {
                const nomeLista = nomeCompletoParaExibicao(
                  a.paciente.nomeExibicao,
                  a.paciente.nomeCriptografado
                );
                return (
                <div
                  key={a.id}
                  className="flex flex-wrap items-center justify-between gap-3 p-4 bg-blue-50 border border-blue-200 hover:border-blue-300 dark:bg-blue-950/20 dark:border-blue-900 rounded-xl transition-all"
                >
                  <Link
                    href={`/atendimento/${a.id}`}
                    className="flex items-center gap-4 min-w-0 flex-1 group"
                  >
                    <div className="h-10 w-10 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200 rounded-full flex items-center justify-center font-bold shrink-0">
                      {(nomeLista.trim().charAt(0) || '?').toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground group-hover:text-blue-600 transition-colors truncate">
                        {nomeLista}
                      </p>
                      <p className="text-xs font-mono text-muted-foreground">{a.numeroAtendimento}</p>
                    </div>
                  </Link>
                  <div className="flex items-center gap-2 shrink-0">
                    {a.triagem?.corClassificacao && (
                      <BadgeManchester cor={a.triagem.corClassificacao} size="sm" />
                    )}
                    <BotaoChamarPainel atendimentoId={a.id} label="Chamar paciente" className="text-xs whitespace-nowrap" />
                    <Link
                      href={`/atendimento/${a.id}`}
                      className="px-3 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg shadow-sm hover:bg-blue-700 transition-colors whitespace-nowrap"
                    >
                      Continuar
                    </Link>
                  </div>
                </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Atendidos Hoje */}
        <section>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Atendidos Hoje
          </h3>
          {atendidosHoje.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground">
              Nenhum atendimento médico registrado hoje.
            </div>
          ) : (
            <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-5 py-3 font-semibold text-muted-foreground">Paciente</th>
                    <th className="text-left px-5 py-3 font-semibold text-muted-foreground">Atendimento</th>
                    {sessao?.usuario.role !== 'MEDICO' && (
                      <th className="text-left px-5 py-3 font-semibold text-muted-foreground">Médico</th>
                    )}
                    <th className="text-right px-5 py-3 font-semibold text-muted-foreground">Horário</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {atendidosHoje.map((p) => {
                    const a = p.atendimento;
                    const nomeLista = nomeCompletoParaExibicao(
                      a.paciente.nomeExibicao,
                      a.paciente.nomeCriptografado
                    );
                    const horario = new Intl.DateTimeFormat('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    }).format(p.createdAt);

                    return (
                      <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="font-medium text-foreground">{nomeLista}</div>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="text-xs font-mono text-muted-foreground">{a.numeroAtendimento}</div>
                          <div className="text-[11px] text-muted-foreground mt-0.5">
                            <Link className="hover:underline" href={`/atendimento/${a.id}`}>
                              Abrir prontuário
                            </Link>
                          </div>
                        </td>
                        {sessao?.usuario.role !== 'MEDICO' && (
                          <td className="px-5 py-3.5">
                            <div className="text-muted-foreground">{a.medico?.nome ?? '—'}</div>
                          </td>
                        )}
                        <td className="px-5 py-3.5 text-right">
                          <span className="text-muted-foreground">{horario}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Aguardando Atendimento */}
        <section>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Aguardando Atendimento
          </h3>
          {aguardando.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground">
              Nenhum paciente aguardando atendimento.
            </div>
          ) : (
            <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-5 py-3 font-semibold text-muted-foreground">Paciente</th>
                    <th className="text-left px-5 py-3 font-semibold text-muted-foreground">Triagem</th>
                    <th className="text-right px-5 py-3 font-semibold text-muted-foreground">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {aguardando.map((a) => (
                    <tr key={a.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="font-medium text-foreground">
                          {nomeCompletoParaExibicao(
                            a.paciente.nomeExibicao,
                            a.paciente.nomeCriptografado
                          )}
                        </div>
                        <div className="text-xs font-mono text-muted-foreground mt-0.5">{a.numeroAtendimento}</div>
                      </td>
                      <td className="px-5 py-3.5">
                        {a.triagem?.corClassificacao ? (
                          <BadgeManchester cor={a.triagem.corClassificacao} size="md" />
                        ) : (
                          <span className="text-muted-foreground text-xs">Sem triagem</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="inline-flex flex-wrap items-center justify-end gap-2">
                          <BotaoChamarPainel atendimentoId={a.id} />
                          <Link
                            href={`/atendimento/${a.id}`}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary/90 transition-colors whitespace-nowrap"
                          >
                            Iniciar Atendimento
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
