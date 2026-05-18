// app/(dashboard)/enfermagem/page.tsx — Pacientes internados (aplicação de medicamentos / leitura)

import type { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Syringe, ChevronRight } from 'lucide-react';
import { BadgeManchester } from '@/components/triagem/BadgeManchester';

export const metadata: Metadata = { title: 'Enfermagem' };

export default async function PaginaEnfermagem() {
  const sessao = await getServerSession(authOptions);
  if (!sessao) redirect('/login');
  if (!['ADMIN', 'ENFERMEIRO', 'TECNICO_ENFERMAGEM'].includes(sessao.usuario.role)) {
    redirect('/acesso-negado');
  }

  const atendimentos = await prisma.atendimento.findMany({
    where: {
      deletedAt: null,
      status: 'INTERNADO',
    },
    include: {
      paciente: { select: { nomeExibicao: true } },
      triagem: { select: { corClassificacao: true } },
      prontuario: {
        select: {
          prescricoes: {
            select: {
              itens: { select: { id: true, status: true } },
            },
          },
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
    take: 120,
  });

  function contarPendentes(a: (typeof atendimentos)[number]): number {
    return (a.prontuario?.prescricoes ?? []).reduce(
      (acc, p) => acc + (p.itens ?? []).filter((it) => it.status === 'PENDENTE').length,
      0
    );
  }

  const comPendentes = atendimentos.filter((a) => contarPendentes(a) > 0);
  const semPendentes = atendimentos.filter((a) => contarPendentes(a) === 0);

  return (
    <div className="max-w-4xl mx-auto space-y-6 w-full min-w-0">
      <div className="min-w-0">
        <h1 className="text-xl sm:text-2xl font-bold flex flex-wrap items-center gap-2">
          <Syringe className="h-6 w-6 sm:h-7 sm:w-7 text-primary shrink-0" />
          <span>Enfermagem</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Somente pacientes com status <strong className="text-foreground">Internado</strong>. Aplicação
          de medicações prescritas e acesso ao prontuário para leitura.
        </p>
      </div>

      <section className="min-w-0">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Internados com medicação pendente
        </h2>
        {comPendentes.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-6 sm:p-8 text-center text-muted-foreground text-sm">
            {atendimentos.length === 0
              ? 'Não há pacientes internados no sistema neste momento.'
              : 'Nenhum internado com item de prescrição pendente no momento.'}
          </div>
        ) : (
          <ul className="space-y-2">
            {comPendentes.map((a) => {
              const nPend = contarPendentes(a);
              return (
                <li key={a.id}>
                  <Link
                    href={`/enfermagem/${a.id}`}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-xl border border-border bg-card hover:border-primary/40 transition-colors min-w-0"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold truncate">{a.paciente.nomeExibicao}</p>
                      <p className="text-xs font-mono text-muted-foreground break-all">{a.numeroAtendimento}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0">
                      {a.triagem?.corClassificacao ? (
                        <BadgeManchester cor={a.triagem.corClassificacao} size="sm" />
                      ) : null}
                      <span className="text-xs font-bold text-amber-800 dark:text-amber-200 bg-amber-100 dark:bg-amber-950/80 px-2 py-1 rounded-md">
                        {nPend} pendente{nPend !== 1 ? 's' : ''}
                      </span>
                      <ChevronRight className="h-5 w-5 text-muted-foreground hidden sm:block" aria-hidden />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {atendimentos.length > 0 ? (
        <section className="min-w-0">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Demais internados
          </h2>
          {semPendentes.length === 0 ? (
            <div className="bg-muted/40 border border-border rounded-xl p-6 text-center text-muted-foreground text-sm">
              Todos os internados com itens pendentes já aparecem na lista acima.
            </div>
          ) : (
            <ul className="divide-y divide-border rounded-xl border border-border bg-card overflow-hidden">
              {semPendentes.map((a) => (
                <li key={a.id}>
                  <Link
                    href={`/enfermagem/${a.id}`}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-3 text-sm py-3 px-3 sm:px-4 hover:bg-muted/60 min-w-0"
                  >
                    <span className="font-medium truncate min-w-0">{a.paciente.nomeExibicao}</span>
                    <span className="font-mono text-xs text-muted-foreground shrink-0 break-all">
                      {a.numeroAtendimento}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}
    </div>
  );
}
