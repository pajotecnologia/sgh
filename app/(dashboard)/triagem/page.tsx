// app/(dashboard)/triagem/page.tsx — Fila de triagem em tempo real
import type { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { FilaTriagem } from '@/components/triagem/FilaTriagem';
import { FilaAguardandoTriagem } from '@/components/triagem/FilaAguardandoTriagem';
import { prisma } from '@/lib/prisma';
import { nomeCompletoParaExibicao } from '@/lib/nome-paciente-exibicao';
import Link from 'next/link';
import { BadgeManchester } from '@/components/triagem/BadgeManchester';
import { CheckCircle2, ClipboardList, Printer, UserPlus } from 'lucide-react';

export const metadata: Metadata = { title: 'Triagem' };

export default async function PaginaTriagem() {
  const sessao = await getServerSession(authOptions);
  const role = sessao?.usuario.role;

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const amanha = new Date(hoje);
  amanha.setDate(amanha.getDate() + 1);

  const qtdeAguardandoTriagem = await prisma.atendimento.count({
    where: {
      deletedAt: null,
      status: { in: ['AGUARDANDO_TRIAGEM', 'EM_TRIAGEM'] },
    },
  });

  const qtdeTriadosHoje = await prisma.triagem.count({
    where: {
      classificadoEm: { gte: hoje, lt: amanha },
      atendimento: { deletedAt: null },
    },
  });

  const triadosHoje = await prisma.triagem.findMany({
    where: {
      classificadoEm: { gte: hoje, lt: amanha },
      atendimento: { deletedAt: null },
    },
    include: {
      atendimento: {
        select: {
          id: true,
          numeroAtendimento: true,
          paciente: { select: { nomeExibicao: true, nomeCriptografado: true } },
        },
      },
    },
    orderBy: { classificadoEm: 'desc' },
    take: 200,
  });

  // Buscar pacientes aguardando triagem ou em triagem
  const aguardandoTriagem = await prisma.atendimento.findMany({
    where: { status: { in: ['AGUARDANDO_TRIAGEM', 'EM_TRIAGEM'] }, deletedAt: null },
    include: {
      paciente: {
        select: {
          nomeExibicao: true,
          nomeCriptografado: true,
          dataNascimento: true,
          sexoBiologico: true,
          convenio: true,
          alergias: { select: { descricao: true } },
        },
      },
    },
    orderBy: { createdAt: 'asc' },
    take: 30,
  });

  const podeTriar = ['ADMIN', 'ENFERMEIRO'].includes(role ?? '');
  const podeChamar = ['ADMIN', 'ENFERMEIRO', 'MEDICO'].includes(role ?? '');

  const listaAguardando = aguardandoTriagem.map((a) => ({
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
  }));

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Triagem</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Protocolo de Manchester — atualização em tempo real</p>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-sm font-medium">
        <div className="flex items-center gap-1.5 text-emerald-600">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {qtdeTriadosHoje} triada{qtdeTriadosHoje === 1 ? '' : 's'} hoje
        </div>
        <div className="flex items-center gap-1.5 text-orange-600">
          <ClipboardList className="h-4 w-4 shrink-0" />
          {qtdeAguardandoTriagem} aguardando triagem
        </div>
      </div>

      <section className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="flex items-center gap-2 border-b border-border bg-muted/30 px-5 py-3">
          <UserPlus className="h-4 w-4 text-muted-foreground shrink-0" />
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Triados neste dia
          </h3>
        </div>
        {triadosHoje.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Nenhuma triagem concluída hoje até o momento.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/20">
                <th className="text-left px-5 py-3 font-semibold text-muted-foreground">Paciente</th>
                <th className="text-left px-5 py-3 font-semibold text-muted-foreground">Atendimento</th>
                <th className="text-left px-5 py-3 font-semibold text-muted-foreground">Classificação</th>
                <th className="text-right px-5 py-3 font-semibold text-muted-foreground">Horário</th>
                <th className="text-right px-5 py-3 font-semibold text-muted-foreground">Ficha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {triadosHoje.map((t) => {
                const a = t.atendimento;
                const horario =
                  t.classificadoEm &&
                  new Intl.DateTimeFormat('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  }).format(t.classificadoEm);
                const nomeLista = nomeCompletoParaExibicao(
                  a.paciente.nomeExibicao,
                  a.paciente.nomeCriptografado
                );
                return (
                  <tr key={t.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-medium text-foreground">{nomeLista}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="text-xs font-mono text-muted-foreground">{a.numeroAtendimento}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        <Link href={`/triagem/${a.id}`} className="hover:underline">
                          Abrir triagem
                        </Link>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <BadgeManchester cor={t.corClassificacao} size="md" />
                    </td>
                    <td className="px-5 py-3.5 text-right text-muted-foreground">{horario ?? '—'}</td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        href={`/recepcao/imprimir/${encodeURIComponent(a.numeroAtendimento)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-end gap-1.5 text-xs font-semibold text-primary hover:underline"
                      >
                        <Printer className="h-3.5 w-3.5 shrink-0" aria-hidden />
                        Imprimir
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna esquerda: Aguardando triagem */}
        {podeTriar && (
          <div className="lg:col-span-1">
            <FilaAguardandoTriagem
              pacientesIniciais={listaAguardando}
              podeChamar={podeChamar}
              podeTriar={podeTriar}
            />
          </div>
        )}

        {/* Coluna direita: Fila em tempo real (já triados, aguardando atendimento) */}
        <div className={podeTriar ? 'lg:col-span-2' : 'lg:col-span-3'}>
          <FilaTriagem podeCharmar={podeChamar} />
        </div>
      </div>
    </div>
  );
}
