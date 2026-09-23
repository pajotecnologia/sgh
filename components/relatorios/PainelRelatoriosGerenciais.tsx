'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Bed,
  Pill,
  Download,
  Calendar,
  Filter,
  RefreshCw,
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Building2,
} from 'lucide-react';
import { toast } from 'sonner';
import { FormularioRelatorioAtendimentosDia } from './FormularioRelatorioAtendimentosDia';

type TipoRelatorio = 'atendimentos' | 'ocupacao' | 'farmacia' | 'atendimentos_dia';

export function PainelRelatoriosGerenciais() {
  const [tipo, setTipo] = useState<TipoRelatorio>('atendimentos');
  const [dataInicio, setDataInicio] = useState(
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );
  const [dataFim, setDataFim] = useState(new Date().toISOString().slice(0, 10));
  const [setor, setSetor] = useState('TODOS');
  const [carregando, setCarregando] = useState(false);
  const [dados, setDados] = useState<any>(null);

  const carregarRelatorio = useCallback(async () => {
    if (tipo === 'atendimentos_dia') return;
    setCarregando(true);
    try {
      const params = new URLSearchParams({
        tipo,
        dataInicio,
        dataFim,
        setor,
      });
      const res = await fetch(`/api/relatorios/gerencial?${params.toString()}`);
      if (!res.ok) {
        throw new Error('Falha ao carregar dados do relatório');
      }
      const json = await res.json();
      setDados(json);
    } catch {
      toast.error('Erro ao buscar dados do relatório gerencial.');
    } finally {
      setCarregando(false);
    }
  }, [tipo, dataInicio, dataFim, setor]);

  useEffect(() => {
    if (tipo !== 'atendimentos_dia') {
      carregarRelatorio();
    }
  }, [tipo, carregarRelatorio]);

  const handleExportarCsv = () => {
    const params = new URLSearchParams({
      tipo: 'atendimentos',
      dataInicio,
      dataFim,
      setor,
      formato: 'csv',
    });
    window.open(`/api/relatorios/gerencial?${params.toString()}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <FileText className="h-6 w-6 text-primary" />
            Central de Relatórios Gerenciais
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Indicadores clínicos, operacionais, ocupação de leitos e dispensação hospitalar.
          </p>
        </div>

        {tipo === 'atendimentos' && (
          <button
            onClick={handleExportarCsv}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-sm font-semibold transition-colors"
          >
            <Download className="h-4 w-4" />
            Exportar CSV
          </button>
        )}
      </div>

      {/* Navegação de Abas */}
      <div className="flex flex-wrap gap-2 p-1 bg-muted/60 rounded-xl max-w-fit">
        <button
          onClick={() => setTipo('atendimentos')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            tipo === 'atendimentos'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <TrendingUp className="h-4 w-4" />
          Atendimentos & Manchester
        </button>

        <button
          onClick={() => setTipo('ocupacao')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            tipo === 'ocupacao'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Bed className="h-4 w-4" />
          Ocupação de Leitos
        </button>

        <button
          onClick={() => setTipo('farmacia')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            tipo === 'farmacia'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Pill className="h-4 w-4" />
          Consumo Farmacêutico
        </button>

        <button
          onClick={() => setTipo('atendimentos_dia')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            tipo === 'atendimentos_dia'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Calendar className="h-4 w-4" />
          Atendimentos do Dia (PDF)
        </button>
      </div>

      {/* Barra de Filtros (para tipos que usam filtros de data/setor) */}
      {tipo !== 'atendimentos_dia' && tipo !== 'ocupacao' && (
        <div className="flex flex-wrap items-end gap-3 p-4 rounded-xl border border-border bg-card/60">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              Data Início
            </label>
            <input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              Data Fim
            </label>
            <input
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {tipo === 'atendimentos' && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <Filter className="h-3.5 w-3.5" />
                Setor
              </label>
              <select
                value={setor}
                onChange={(e) => setSetor(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="TODOS">Todos os setores</option>
                <option value="Pronto-Socorro">Pronto-Socorro</option>
                <option value="Ambulatório">Ambulatório</option>
                <option value="Emergência">Emergência</option>
                <option value="Internação">Internação</option>
              </select>
            </div>
          )}

          <button
            onClick={carregarRelatorio}
            disabled={carregando}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${carregando ? 'animate-spin' : ''}`} />
            Filtrar
          </button>
        </div>
      )}

      {/* Conteúdo Dinâmico */}
      {tipo === 'atendimentos_dia' && <FormularioRelatorioAtendimentosDia />}

      {tipo === 'atendimentos' && dados && (
        <div className="space-y-6">
          {/* Métricas Principais */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border border-border bg-card shadow-sm">
              <span className="text-xs font-medium text-muted-foreground">Total de Atendimentos</span>
              <p className="text-2xl font-bold text-foreground mt-1">{dados.total}</p>
            </div>

            <div className="p-4 rounded-xl border border-border bg-card shadow-sm">
              <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-amber-500" />
                Tempo Médio de Espera
              </span>
              <p className="text-2xl font-bold text-foreground mt-1">
                {dados.tempoMedioEsperaMinutos} <span className="text-sm font-normal text-muted-foreground">min</span>
              </p>
            </div>

            <div className="p-4 rounded-xl border border-border bg-card shadow-sm">
              <span className="text-xs font-medium text-muted-foreground">Classificação Vermelha / Laranja</span>
              <p className="text-2xl font-bold text-destructive mt-1">
                {(dados.porPrioridade?.VERMELHO || 0) + (dados.porPrioridade?.LARANJA || 0)}
              </p>
            </div>

            <div className="p-4 rounded-xl border border-border bg-card shadow-sm">
              <span className="text-xs font-medium text-muted-foreground">Atendimentos Concluídos</span>
              <p className="text-2xl font-bold text-emerald-600 mt-1">
                {dados.porStatus?.FINALIZADO || dados.porStatus?.ALTA || 0}
              </p>
            </div>
          </div>

          {/* Listagem de Atendimentos Recentes */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="p-4 border-b border-border font-semibold text-sm flex items-center justify-between">
              <span>Amostragem de Atendimentos no Período ({dados.atendimentosRecentes?.length || 0})</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 text-xs uppercase font-semibold text-muted-foreground border-b border-border">
                  <tr>
                    <th className="p-3">Nº Atendimento</th>
                    <th className="p-3">Paciente</th>
                    <th className="p-3">Data/Hora</th>
                    <th className="p-3">Prioridade</th>
                    <th className="p-3">Setor</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Médico</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {dados.atendimentosRecentes?.map((a: any) => (
                    <tr key={a.id} className="hover:bg-muted/30">
                      <td className="p-3 font-mono font-medium text-primary">{a.numeroAtendimento}</td>
                      <td className="p-3 font-medium">{a.pacienteNome}</td>
                      <td className="p-3 text-muted-foreground">{new Date(a.dataHora).toLocaleString('pt-BR')}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-muted text-foreground">
                          {a.prioridade}
                        </span>
                      </td>
                      <td className="p-3 text-muted-foreground">{a.setor}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                          {a.status}
                        </span>
                      </td>
                      <td className="p-3 text-muted-foreground">{a.medicoNome}</td>
                    </tr>
                  ))}
                  {(!dados.atendimentosRecentes || dados.atendimentosRecentes.length === 0) && (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-muted-foreground">
                        Nenhum atendimento encontrado para o período selecionado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tipo === 'ocupacao' && dados && (
        <div className="space-y-6">
          {/* Métricas de Ocupação */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border border-border bg-card shadow-sm">
              <span className="text-xs font-medium text-muted-foreground">Total de Leitos Ativos</span>
              <p className="text-2xl font-bold text-foreground mt-1">{dados.totalLeitos}</p>
            </div>

            <div className="p-4 rounded-xl border border-border bg-card shadow-sm">
              <span className="text-xs font-medium text-muted-foreground flex items-center gap-1 text-emerald-600">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Leitos Disponíveis
              </span>
              <p className="text-2xl font-bold text-emerald-600 mt-1">{dados.disponiveis}</p>
            </div>

            <div className="p-4 rounded-xl border border-border bg-card shadow-sm">
              <span className="text-xs font-medium text-muted-foreground flex items-center gap-1 text-amber-600">
                <Bed className="h-3.5 w-3.5" />
                Leitos Ocupados
              </span>
              <p className="text-2xl font-bold text-amber-600 mt-1">{dados.ocupados}</p>
            </div>

            <div className="p-4 rounded-xl border border-border bg-card shadow-sm">
              <span className="text-xs font-medium text-muted-foreground">Taxa Geral de Ocupação</span>
              <p className="text-2xl font-bold text-primary mt-1">{dados.taxaOcupacaoPercentual}%</p>
            </div>
          </div>

          {/* Ocupação por Ala / Clínica */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="p-4 border-b border-border font-semibold text-sm flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              Taxa de Ocupação por Clínica / Ala Hospitalar
            </div>
            <div className="divide-y divide-border">
              {dados.porClinicaAla?.map((ala: any) => (
                <div key={ala.clinicaAla} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="font-semibold text-foreground text-sm">{ala.clinicaAla}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {ala.ocupados} de {ala.total} leitos ocupados
                    </p>
                  </div>
                  <div className="flex items-center gap-3 min-w-[200px]">
                    <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                      <div
                        className={`h-2.5 rounded-full ${
                          ala.taxa > 85 ? 'bg-destructive' : ala.taxa > 60 ? 'bg-amber-500' : 'bg-primary'
                        }`}
                        style={{ width: `${Math.min(ala.taxa, 100)}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold w-12 text-right">{ala.taxa}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tipo === 'farmacia' && dados && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-border bg-card shadow-sm">
              <span className="text-xs font-medium text-muted-foreground">Total de Aplicações no Período</span>
              <p className="text-2xl font-bold text-foreground mt-1">{dados.totalItensAplicados}</p>
            </div>

            <div className="p-4 rounded-xl border border-border bg-card shadow-sm">
              <span className="text-xs font-medium text-muted-foreground">Medicamentos Distintos Consumidos</span>
              <p className="text-2xl font-bold text-primary mt-1">{dados.medicamentosMaisConsumidos?.length || 0}</p>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="p-4 border-b border-border font-semibold text-sm flex items-center gap-2">
              <Pill className="h-4 w-4 text-primary" />
              Medicamentos Mais Consumidos / Aplicados
            </div>
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 text-xs uppercase font-semibold text-muted-foreground border-b border-border">
                <tr>
                  <th className="p-3">Medicamento</th>
                  <th className="p-3">Total Aplicado</th>
                  <th className="p-3">Vias de Administração</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {dados.medicamentosMaisConsumidos?.map((m: any, idx: number) => (
                  <tr key={idx} className="hover:bg-muted/30">
                    <td className="p-3 font-medium text-foreground">{m.nome}</td>
                    <td className="p-3 font-semibold text-primary">{m.totalAplicado} doses</td>
                    <td className="p-3 text-muted-foreground text-xs">{m.viasMaisUsadas}</td>
                  </tr>
                ))}
                {(!dados.medicamentosMaisConsumidos || dados.medicamentosMaisConsumidos.length === 0) && (
                  <tr>
                    <td colSpan={3} className="p-6 text-center text-muted-foreground">
                      Nenhuma aplicação registrada no período.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
