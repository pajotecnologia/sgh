// app/(dashboard)/auditoria/page.tsx — Trilha de auditoria (somente ADMIN)

import type { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Shield } from 'lucide-react';

export const metadata: Metadata = { title: 'Auditoria' };

export default async function PaginaAuditoria() {
  const sessao = await getServerSession(authOptions);
  if (!sessao) redirect('/login');
  if (sessao.usuario.role !== 'ADMIN') redirect('/acesso-negado');

  const logs = await prisma.logAuditoria.findMany({
    orderBy: { registradoEm: 'desc' },
    take: 200,
    include: {
      usuario: { select: { nome: true, email: true } },
    },
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="h-7 w-7 text-primary" />
          Auditoria
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Registros imutáveis das últimas ações no sistema (máx. 200 exibidos).
        </p>
      </div>

      <div className="border border-border rounded-xl overflow-hidden bg-card overflow-x-auto">
        <table className="w-full text-xs min-w-[720px]">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="text-left px-3 py-2 font-semibold">Data</th>
              <th className="text-left px-3 py-2 font-semibold">Usuário</th>
              <th className="text-left px-3 py-2 font-semibold">Ação</th>
              <th className="text-left px-3 py-2 font-semibold">Entidade</th>
              <th className="text-left px-3 py-2 font-semibold">Detalhes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-muted/20">
                <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">
                  {log.registradoEm.toLocaleString('pt-BR')}
                </td>
                <td className="px-3 py-2">{log.usuario?.nome ?? log.usuario?.email ?? '—'}</td>
                <td className="px-3 py-2 font-mono">{log.acao}</td>
                <td className="px-3 py-2">
                  {log.entidade}
                  {log.entidadeId ? (
                    <span className="block text-[10px] text-muted-foreground truncate max-w-[140px]">{log.entidadeId}</span>
                  ) : null}
                </td>
                <td className="px-3 py-2 max-w-[280px]">
                  {log.valorAnterior && (
                    <span className="block text-muted-foreground truncate" title={log.valorAnterior}>
                      Ant.: {log.valorAnterior}
                    </span>
                  )}
                  {log.valorNovo && (
                    <span className="block truncate" title={log.valorNovo}>
                      Novo: {log.valorNovo}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
