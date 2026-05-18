// app/(dashboard)/prontuario/page.tsx — Consulta rápida de atendimentos (Sessão 5)

import type { Metadata } from 'next';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { FileText, Printer } from 'lucide-react';

export const metadata: Metadata = { title: 'Prontuário' };

export default async function PaginaProntuario({
  searchParams,
}: {
  searchParams: Promise<{ n?: string }>;
}) {
  const sessao = await getServerSession(authOptions);
  if (!sessao) redirect('/login');
  if (!['ADMIN', 'MEDICO', 'DIRETOR_CLINICO', 'ENFERMEIRO', 'TECNICO_ENFERMAGEM'].includes(sessao.usuario.role)) {
    redirect('/acesso-negado');
  }

  const { n } = await searchParams;
  const termo = n?.trim() ?? '';

  const atendimentos = await prisma.atendimento.findMany({
    where: {
      deletedAt: null,
      ...(termo
        ? {
            OR: [
              { numeroAtendimento: { contains: termo, mode: 'insensitive' } },
              { paciente: { nomeExibicao: { contains: termo, mode: 'insensitive' } } },
            ],
          }
        : {}),
    },
    include: {
      paciente: { select: { nomeExibicao: true } },
      medico: { select: { nome: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: termo ? 50 : 40,
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="h-7 w-7 text-primary" />
          Prontuário / Atendimentos
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Busque por número de atendimento ou nome do paciente. Enfermagem: acesso à ficha e à aplicação de medicamentos.
        </p>
      </div>

      <form className="flex flex-wrap gap-2 items-end" action="/prontuario" method="get">
        <div className="flex-1 min-w-[200px]">
          <label htmlFor="busca-prontuario" className="text-xs font-medium text-muted-foreground">
            Busca
          </label>
          <input
            id="busca-prontuario"
            name="n"
            defaultValue={termo}
            placeholder="Nº atendimento ou nome"
            className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
        <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold">
          Buscar
        </button>
      </form>

      <div className="border border-border rounded-xl overflow-hidden bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="text-left px-4 py-3 font-semibold">Paciente</th>
              <th className="text-left px-4 py-3 font-semibold">Atendimento</th>
              <th className="text-left px-4 py-3 font-semibold">Médico</th>
              <th className="text-right px-4 py-3 font-semibold">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {atendimentos.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                  Nenhum registro encontrado.
                </td>
              </tr>
            ) : (
              atendimentos.map((a) => (
                <tr key={a.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{a.paciente.nomeExibicao}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{a.numeroAtendimento}</td>
                  <td className="px-4 py-3 text-muted-foreground">{a.medico?.nome ?? '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex flex-wrap justify-end gap-2">
                      {['ADMIN', 'MEDICO', 'DIRETOR_CLINICO'].includes(sessao.usuario.role) && (
                        <Link
                          href={`/atendimento/${a.id}`}
                          className="text-xs font-semibold text-primary hover:underline"
                        >
                          Abrir
                        </Link>
                      )}
                      {['ENFERMEIRO', 'TECNICO_ENFERMAGEM'].includes(sessao.usuario.role) && (
                        <Link
                          href={`/enfermagem/${a.id}`}
                          className="text-xs font-semibold text-primary hover:underline"
                        >
                          Enfermagem
                        </Link>
                      )}
                      <Link
                        href={`/recepcao/imprimir/${a.numeroAtendimento}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-foreground"
                      >
                        <Printer className="h-3 w-3" /> Ficha
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
