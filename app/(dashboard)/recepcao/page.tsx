// app/(dashboard)/recepcao/page.tsx — Lista de pacientes da recepção
import type { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { UserPlus, Search, ClipboardCheck, ArrowDownAZ, ArrowUpAZ } from 'lucide-react';
import { format } from 'date-fns';
import { hashCpf } from '@/lib/encryption';
import { nomeCompletoParaExibicao } from '@/lib/nome-paciente-exibicao';
import { BotaoNovoAtendimento } from '@/components/recepcao/BotaoNovoAtendimento';
import { BannerPosCadastro } from '@/components/recepcao/BannerPosCadastro';

export const metadata: Metadata = { title: 'Recepção' };

export default async function PaginaRecepcao({
  searchParams,
}: {
  searchParams: Promise<{
    busca?: string;
    dataInicio?: string;
    dataFim?: string;
    ordenNome?: string;
    cadastrado?: string;
  }>;
}) {
  const params = await searchParams;
  const busca = params.busca ?? '';
  const dataInicioStr = params.dataInicio;
  const dataFimStr = params.dataFim;
  const ordenNomeParam = params.ordenNome === 'desc' ? 'desc' : 'asc';

  const cpfRegex = /^(\d{11}|\d{3}\.\d{3}\.\d{3}-\d{2})$/;
  const ehCpf = cpfRegex.test(busca);
  
  let dataFiltro: { gte?: Date; lte?: Date } = {};
  if (dataInicioStr || dataFimStr) {
    if (dataInicioStr) {
      const d = new Date(dataInicioStr);
      d.setHours(0, 0, 0, 0);
      dataFiltro.gte = d;
    }
    if (dataFimStr) {
      const d = new Date(dataFimStr);
      d.setHours(23, 59, 59, 999);
      dataFiltro.lte = d;
    }
  }

  function montarQuery(mudancas?: Partial<{ ordenNome: 'asc' | 'desc'; busca: string }>) {
    const o = mudancas?.ordenNome ?? ordenNomeParam;
    const q = new URLSearchParams();
    const b = mudancas?.busca ?? busca;
    if (b.trim()) q.set('busca', b.trim());
    if (dataInicioStr) q.set('dataInicio', dataInicioStr);
    if (dataFimStr) q.set('dataFim', dataFimStr);
    if (o !== 'asc') q.set('ordenNome', o);
    const s = q.toString();
    return s ? `?${s}` : '';
  }

  const whereBusca: any = {
    deletedAt: null,
    ...(busca
      ? (ehCpf ? { cpfHash: hashCpf(busca) } : { nomeExibicao: { contains: busca, mode: 'insensitive' } })
      : {}),
    ...(Object.keys(dataFiltro).length > 0 ? { createdAt: dataFiltro } : {})
  };

  const [pacientesBD, total] = await Promise.all([
    prisma.paciente.findMany({
      where: whereBusca,
      include: {
        atendimentos: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { numeroAtendimento: true, status: true, createdAt: true },
        },
      },
      orderBy: { nomeExibicao: ordenNomeParam },
    }),
    prisma.paciente.count({
      where: whereBusca,
    }),
  ]);

  // Descriptografar CPF para exibição na grade
  const { descriptografar, mascararCpf } = await import('@/lib/encryption');
  const pacientes = pacientesBD.map((p) => {
    const nomeParaLista = nomeCompletoParaExibicao(p.nomeExibicao, p.nomeCriptografado);
    try {
      const cpfLimpo = descriptografar(p.cpfCriptografado);
      return { ...p, cpfFormatado: mascararCpf(cpfLimpo), nomeParaLista };
    } catch {
      return { ...p, cpfFormatado: '***.***.***-**', nomeParaLista };
    }
  });

  const labelStatus: Record<string, { label: string; cor: string }> = {
    AGUARDANDO_TRIAGEM: { label: 'Aguardando Triagem', cor: 'bg-slate-100 text-slate-700' },
    EM_TRIAGEM: { label: 'Em Triagem', cor: 'bg-yellow-100 text-yellow-800' },
    AGUARDANDO_ATENDIMENTO: { label: 'Aguardando Atend.', cor: 'bg-blue-100 text-blue-800' },
    EM_ATENDIMENTO: { label: 'Em Atendimento', cor: 'bg-green-100 text-green-800' },
    CONCLUIDO: { label: 'Concluído', cor: 'bg-gray-100 text-gray-600' },
    ALTA: { label: 'Alta', cor: 'bg-emerald-100 text-emerald-700' },
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Recepção</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {total} cadastro{total !== 1 ? 's' : ''} listado{total !== 1 ? 's' : ''}
          </p>
        </div>
        <Link
          href="/recepcao/novo"
          id="btn-novo-paciente"
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          <UserPlus className="h-4 w-4" />
          Novo Paciente
        </Link>
      </div>

      <Suspense fallback={null}>
        <BannerPosCadastro />
      </Suspense>

      {/* Barra de busca e filtros */}
      <div className="bg-card border border-border p-4 rounded-xl shadow-sm">
        <form method="GET" className="flex flex-wrap gap-4 items-end">
          {ordenNomeParam === 'desc' && (
            <input type="hidden" name="ordenNome" value="desc" />
          )}
          <div className="flex-1 min-w-[250px] relative">
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Buscar Paciente</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                name="busca"
                defaultValue={busca}
                placeholder="Buscar por Nome ou CPF..."
                className="w-full pl-9 pr-4 py-2 border border-input rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Data Inicial</label>
            <input type="date" name="dataInicio" defaultValue={dataInicioStr} className="px-3 py-2 border border-input rounded-lg text-sm" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Data Final</label>
            <input type="date" name="dataFim" defaultValue={dataFimStr} className="px-3 py-2 border border-input rounded-lg text-sm" />
          </div>
          <button type="submit" className="px-5 py-2 bg-slate-800 text-white text-sm font-medium rounded-lg hover:bg-slate-700 transition-colors h-[38px]">
            Filtrar
          </button>
        </form>
      </div>

      {/* Tabela de pacientes */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground">CPF</th>
              <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground">
                <div className="flex flex-wrap items-center gap-2">
                  <span>Nome do Paciente</span>
                  <span className="inline-flex rounded-md border border-border overflow-hidden">
                    <Link
                      href={`/recepcao${montarQuery({ ordenNome: 'asc' })}`}
                      title="Ordem alfabética A–Z"
                      className={`p-1.5 hover:bg-muted ${
                        ordenNomeParam === 'asc' ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'text-muted-foreground'
                      }`}
                    >
                      <ArrowDownAZ className="h-3.5 w-3.5" aria-hidden />
                    </Link>
                    <Link
                      href={`/recepcao${montarQuery({ ordenNome: 'desc' })}`}
                      title="Ordem alfabética Z–A"
                      className={`p-1.5 border-l border-border hover:bg-muted ${
                        ordenNomeParam === 'desc' ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'text-muted-foreground'
                      }`}
                    >
                      <ArrowUpAZ className="h-3.5 w-3.5" aria-hidden />
                    </Link>
                  </span>
                </div>
              </th>
              <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground hidden lg:table-cell">Nome da Mãe</th>
              <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground">Status / Atend.</th>
              <th className="text-right px-5 py-3.5 font-semibold text-muted-foreground">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {pacientes.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-16 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <p>
                      {busca
                        ? `Nenhum paciente encontrado para "${busca}".`
                        : dataInicioStr || dataFimStr
                          ? 'Nenhum cadastro encontrado neste período.'
                          : 'Nenhum paciente cadastrado.'}
                    </p>
                    <Link
                      href="/recepcao/novo"
                      className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors shadow-sm"
                    >
                      <UserPlus className="h-4 w-4" />
                      Inserir Paciente
                    </Link>
                  </div>
                </td>
              </tr>
            )}
            {pacientes.map((p) => {
              const atend = p.atendimentos[0];
              const statusInfo = atend ? (labelStatus[atend.status] ?? { label: atend.status, cor: 'bg-gray-100 text-gray-600' }) : null;
              return (
                <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-5 py-4 font-mono text-sm text-slate-600">
                    {p.cpfFormatado}
                  </td>
                  <td className="px-5 py-4">
                    <div className="font-medium text-foreground">{p.nomeParaLista}</div>
                    <div className="text-xs text-muted-foreground mt-0.5 capitalize">
                      {p.sexoBiologico.toLowerCase()} · {format(new Date(p.dataNascimento), 'dd/MM/yyyy')}
                    </div>
                  </td>
                  <td className="px-5 py-4 hidden lg:table-cell text-muted-foreground">
                    {p.nomeMae || <span className="opacity-50">Não informado</span>}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-col gap-1 items-start">
                      {statusInfo ? (
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.cor}`}>
                          {statusInfo.label}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                      {atend && <span className="font-mono text-xs text-muted-foreground">#{atend.numeroAtendimento}</span>}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/recepcao/${p.id}/editar`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
                      >
                        Editar
                      </Link>

                      {(!atend || atend.status === 'CONCLUIDO' || atend.status === 'ALTA') && (
                        <BotaoNovoAtendimento pacienteId={p.id} />
                      )}
                      
                      {atend ? (
                        <Link
                          href={`/recepcao/imprimir/${atend.numeroAtendimento}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition-colors"
                        >
                          <ClipboardCheck className="h-3.5 w-3.5" />
                          Imprimir Ficha
                        </Link>
                      ) : (
                        <Link
                          href={`/recepcao/ficha-cadastro/${p.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition-colors"
                        >
                          <ClipboardCheck className="h-3.5 w-3.5" />
                          Imprimir ficha
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

      </div>
    </div>
  );
}
