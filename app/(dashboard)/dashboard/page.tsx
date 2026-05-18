// app/(dashboard)/dashboard/page.tsx — Dashboard com visão geral por role
import type { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Users, ClipboardList, Activity, AlertTriangle } from 'lucide-react';

export const metadata: Metadata = { title: 'Dashboard' };

export default async function PaginaDashboard() {
  const sessao = await getServerSession(authOptions);

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const [totalPacientesHoje, aguardandoTriagem, emAtendimento, emergencias] = await Promise.all([
    prisma.atendimento.count({ where: { createdAt: { gte: hoje }, deletedAt: null } }),
    prisma.atendimento.count({ where: { status: 'AGUARDANDO_TRIAGEM', deletedAt: null } }),
    prisma.atendimento.count({ where: { status: 'EM_ATENDIMENTO', deletedAt: null } }),
    prisma.triagem.count({ where: { corClassificacao: { in: ['VERMELHO', 'LARANJA'] }, createdAt: { gte: hoje } } }),
  ]);

  const stats = [
    { label: 'Pacientes Hoje', valor: totalPacientesHoje, icon: Users, cor: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Aguardando Triagem', valor: aguardandoTriagem, icon: ClipboardList, cor: 'text-yellow-600', bg: 'bg-yellow-50' },
    { label: 'Em Atendimento', valor: emAtendimento, icon: Activity, cor: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Emergências (hoje)', valor: emergencias, icon: AlertTriangle, cor: 'text-red-600', bg: 'bg-red-50' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold">Bom dia, {sessao?.usuario.nome.split(' ')[0]}!</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Aqui está o resumo do dia.</p>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="stat-card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">{s.label}</p>
                <p className="text-3xl font-bold mt-1">{s.valor}</p>
              </div>
              <div className={`p-2.5 rounded-xl ${s.bg}`}>
                <s.icon className={`h-5 w-5 ${s.cor}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Atalhos por role */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="font-semibold mb-4">Ações rápidas</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {['ADMIN', 'RECEPCIONISTA'].includes(sessao?.usuario.role ?? '') && (
            <a href="/recepcao/novo" className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border hover:bg-muted/50 transition-colors text-center">
              <Users className="h-6 w-6 text-primary" />
              <span className="text-xs font-medium">Novo Paciente</span>
            </a>
          )}
          {['ADMIN', 'ENFERMEIRO'].includes(sessao?.usuario.role ?? '') && (
            <a href="/triagem" className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border hover:bg-muted/50 transition-colors text-center">
              <ClipboardList className="h-6 w-6 text-yellow-600" />
              <span className="text-xs font-medium">Realizar Triagem</span>
            </a>
          )}
          {['ADMIN', 'MEDICO'].includes(sessao?.usuario.role ?? '') && (
            <a href="/atendimento" className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border hover:bg-muted/50 transition-colors text-center">
              <Activity className="h-6 w-6 text-green-600" />
              <span className="text-xs font-medium">Atendimento</span>
            </a>
          )}
          <a href="/painel" target="_blank" className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border hover:bg-muted/50 transition-colors text-center">
            <AlertTriangle className="h-6 w-6 text-blue-600" />
            <span className="text-xs font-medium">Painel de Chamada</span>
          </a>
        </div>
      </div>
    </div>
  );
}
