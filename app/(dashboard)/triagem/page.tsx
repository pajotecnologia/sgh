// app/(dashboard)/triagem/page.tsx — Fila de triagem em tempo real
import type { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { FilaTriagem } from '@/components/triagem/FilaTriagem';
import { FilaAguardandoTriagem } from '@/components/triagem/FilaAguardandoTriagem';
import { prisma } from '@/lib/prisma';
import { nomeCompletoParaExibicao } from '@/lib/nome-paciente-exibicao';
import { PaginacaoLista } from '@/components/shared/PaginacaoLista';
import { parsePaginacao } from '@/lib/paginacao';
import {
  whereAguardandoTriagem,
  whereEmTriagem,
  includePacienteFilaPreTriagem,
} from '@/lib/fila-aguardando-triagem';
import Link from 'next/link';
import { BadgeManchester } from '@/components/triagem/BadgeManchester';
import { CheckCircle2, ClipboardList, Printer, UserPlus } from 'lucide-react';

export const metadata: Metadata = { title: 'Triagem' };

export default async function PaginaTriagem({
  searchParams,
}: {
  searchParams: Promise<{ triadosPagina?: string; triadosPorPagina?: string }>
}) {
  const paramsPag = await searchParams
  const pagTriados = parsePaginacao(
    { pagina: paramsPag.triadosPagina, porPagina: paramsPag.triadosPorPagina },
    'triados'
  )

  const sessao = await getServerSession(authOptions);
  const role = sessao?.usuario.role;

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const amanha = new Date(hoje);
  amanha.setDate(amanha.getDate() + 1);

  const [qtdeAguardandoTriagem, qtdeEmTriagem, aguardandoTriagem, emTriagemLista] = await Promise.all([
    prisma.atendimento.count({ where: whereAguardandoTriagem }),
    prisma.atendimento.count({ where: whereEmTriagem }),
    prisma.atendimento.findMany({
      where: whereAguardandoTriagem,
      include: includePacienteFilaPreTriagem,
      orderBy: { createdAt: 'asc' },
    }),
    prisma.atendimento.findMany({
      where: whereEmTriagem,
      include: includePacienteFilaPreTriagem,
      orderBy: { updatedAt: 'desc' },
    }),
  ]);

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
    skip: pagTriados.skip,
    take: pagTriados.take,
  });

  const totalTriadosPagina = qtdeTriadosHoje;

  const podeTriar = ['ADMIN', 'ENFERMEIRO'].includes(role ?? '');
  const podeChamar = ['ADMIN', 'ENFERMEIRO', 'MEDICO'].includes(role ?? '');

  const mapAtendimentoFila = (a: (typeof aguardandoTriagem)[number]) => ({
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
  });

  const listaAguardando = aguardandoTriagem.map(mapAtendimentoFila);
  const listaEmTriagem = emTriagemLista.map(mapAtendimentoFila);

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      <div>
        <h2 className="page-title">Triagem</h2>
        <p className="page-subtitle">Protocolo de Manchester — tempo real</p>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-[11px] font-medium">
        <div className="flex items-center gap-1.5 text-emerald-600">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {qtdeTriadosHoje} triada{qtdeTriadosHoje === 1 ? '' : 's'} hoje
        </div>
        <div className="flex items-center gap-1.5 text-orange-600">
          <ClipboardList className="h-4 w-4 shrink-0" />
          {qtdeAguardandoTriagem} aguardando triagem
          {qtdeEmTriagem > 0 && (
            <span className="text-muted-foreground font-normal">
              · {qtdeEmTriagem} em triagem
            </span>
          )}
        </div>
      </div>

      <section className="bg-card border border-border rounded-lg overflow-hidden shadow-sm text-xs">
        <div className="flex items-center gap-2 border-b border-border bg-muted/30 px-3 py-2">
          <UserPlus className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Triados neste dia
          </h3>
        </div>
        {totalTriadosPagina === 0 ? (
          <div className="p-6 text-center text-[11px] text-muted-foreground">
            Nenhuma triagem concluída hoje até o momento.
          </div>
        ) : (
          <table className="w-full text-[11px]">
            <thead>
              <tr className="border-b border-border bg-muted/20">
                <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Paciente</th>
                <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Atend.</th>
                <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Classif.</th>
                <th className="text-right px-3 py-2 font-semibold text-muted-foreground">Hora</th>
                <th className="text-right px-3 py-2 font-semibold text-muted-foreground">Ficha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {triadosHoje.map((t) => {
                const a = t.atendimento
                const horario =
                  t.classificadoEm &&
                  new Intl.DateTimeFormat('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  }).format(t.classificadoEm)
                const nomeLista = nomeCompletoParaExibicao(
                  a.paciente.nomeExibicao,
                  a.paciente.nomeCriptografado
                )
                return (
                  <tr key={t.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-3 py-2 font-medium">{nomeLista}</td>
                    <td className="px-3 py-2">
                      <div className="text-[10px] font-mono text-muted-foreground">{a.numeroAtendimento}</div>
                      <Link href={`/triagem/${a.id}`} className="text-[10px] hover:underline">
                        Abrir
                      </Link>
                    </td>
                    <td className="px-3 py-2">
                      <BadgeManchester cor={t.corClassificacao} size="sm" />
                    </td>
                    <td className="px-3 py-2 text-right text-muted-foreground">{horario ?? '—'}</td>
                    <td className="px-3 py-2 text-right">
                      <Link
                        href={`/recepcao/imprimir/${encodeURIComponent(a.numeroAtendimento)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-end gap-1 text-[10px] font-semibold text-primary hover:underline"
                      >
                        <Printer className="h-3 w-3 shrink-0" aria-hidden />
                        PDF
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
        {totalTriadosPagina > 0 ? (
          <PaginacaoLista
            total={totalTriadosPagina}
            pagina={pagTriados.pagina}
            porPagina={pagTriados.porPagina}
            basePath="/triagem"
            prefixo="triados"
            compacto
          />
        ) : null}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1">
          <FilaAguardandoTriagem
            pacientesIniciais={listaAguardando}
            emTriagemIniciais={listaEmTriagem}
            podeChamar={podeChamar}
            podeTriar={podeTriar}
          />
        </div>

        <div className="lg:col-span-2">
          <div className="bg-card border border-border rounded-lg p-3 shadow-sm">
            <FilaTriagem podeCharmar={podeChamar} compacto titulo="Fila pós-triagem" />
          </div>
        </div>
      </div>
    </div>
  );
}
