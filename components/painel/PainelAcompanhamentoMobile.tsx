'use client';
// components/painel/PainelAcompanhamentoMobile.tsx
// Tela personalizada e mobile-first para acompanhamento do atendimento e fila em tempo real pelo celular

import { useState, useEffect, useCallback, useRef } from 'react';
import type { DadosAcompanhamentoPaciente } from '@/lib/acompanhamento-paciente';
import { cn } from '@/lib/utils';
import {
  Activity,
  Bell,
  CheckCircle2,
  Clock,
  RefreshCw,
  Users,
  Volume2,
  VolumeX,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  DoorOpen,
} from 'lucide-react';

const COR_MANCHESTER_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; border: string; desc: string }
> = {
  VERMELHO: {
    label: 'EMERGÊNCIA',
    bg: 'bg-red-500/15',
    text: 'text-red-500 dark:text-red-400',
    border: 'border-red-500/40',
    desc: 'Atendimento Imediato (0 min)',
  },
  LARANJA: {
    label: 'MUITO URGENTE',
    bg: 'bg-orange-500/15',
    text: 'text-orange-500 dark:text-orange-400',
    border: 'border-orange-500/40',
    desc: 'Atendimento em até 10 minutos',
  },
  AMARELO: {
    label: 'URGENTE',
    bg: 'bg-yellow-500/15',
    text: 'text-yellow-600 dark:text-yellow-400',
    border: 'border-yellow-500/40',
    desc: 'Atendimento em até 60 minutos',
  },
  VERDE: {
    label: 'POUCO URGENTE',
    bg: 'bg-emerald-500/15',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-500/40',
    desc: 'Atendimento em até 120 minutos',
  },
  AZUL: {
    label: 'NÃO URGENTE',
    bg: 'bg-blue-500/15',
    text: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-500/40',
    desc: 'Atendimento em até 240 minutos',
  },
};

export function PainelAcompanhamentoMobile({
  dadosIniciais,
  numeroAtendimento,
}: {
  dadosIniciais: DadosAcompanhamentoPaciente | null;
  numeroAtendimento: string;
}) {
  const [dados, setDados] = useState<DadosAcompanhamentoPaciente | null>(dadosIniciais);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [somAtivo, setSomAtivo] = useState(true);
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState<Date>(new Date());
  const [chamadoAlerta, setChamadoAlerta] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const jaTocouRef = useRef<string | null>(null);

  const carregarDados = useCallback(async () => {
    try {
      setCarregando(true);
      const res = await fetch(`/api/publico/acompanhamento/${encodeURIComponent(numeroAtendimento)}`, {
        cache: 'no-store',
      });
      const json = await res.json();
      if (!res.ok || !json?.sucesso || !json?.dados) {
        if (!dados) setErro('Atendimento não localizado.');
        return;
      }

      const novosDados = json.dados as DadosAcompanhamentoPaciente;
      setDados(novosDados);
      setUltimaAtualizacao(new Date());
      setErro(null);

      // Disparar vibração e alerta sonoro se foi chamado
      if (novosDados.foiChamado && novosDados.chamada) {
        setChamadoAlerta(true);
        const chaveChamada = `${novosDados.chamada.chamadoEm}-${novosDados.chamada.salaDestino}`;
        if (jaTocouRef.current !== chaveChamada) {
          jaTocouRef.current = chaveChamada;
          if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
            try {
              navigator.vibrate([400, 200, 400, 200, 600]);
            } catch {}
          }
          if (audioRef.current && somAtivo) {
            try {
              audioRef.current.currentTime = 0;
              audioRef.current.play().catch(() => {});
            } catch {}
          }
        }
      } else {
        setChamadoAlerta(false);
      }
    } catch {
      if (!dados) setErro('Erro de conexão ao buscar atendimento.');
    } finally {
      setCarregando(false);
    }
  }, [numeroAtendimento, dados, somAtivo]);

  // Polling em tempo real a cada 3 segundos
  useEffect(() => {
    const timer = setInterval(() => {
      carregarDados();
    }, 3000);
    return () => clearInterval(timer);
  }, [carregarDados]);

  if (erro && !dados) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="p-4 bg-red-500/10 rounded-full border border-red-500/30 mb-4">
          <AlertCircle className="h-10 w-10 text-red-400" />
        </div>
        <h1 className="text-xl font-bold text-slate-100">Atendimento Não Encontrado</h1>
        <p className="text-sm text-slate-400 mt-2 max-w-xs">
          Não localizamos um atendimento ativo com o número <strong>{numeroAtendimento}</strong>.
        </p>
        <button
          type="button"
          onClick={carregarDados}
          className="mt-6 px-5 py-2.5 bg-primary text-white rounded-xl text-xs font-bold shadow-lg flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" /> Tentar Novamente
        </button>
      </div>
    );
  }

  if (!dados) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold text-slate-300">Carregando seu atendimento...</p>
      </div>
    );
  }

  const corManchester = dados.corTriagem ? COR_MANCHESTER_CONFIG[dados.corTriagem] : null;

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans flex flex-col justify-between selection:bg-primary/30">
      <audio ref={audioRef} src="/sons/chamada-painel.mp3" preload="auto" />

      {/* 1. TOPO: Identificação Institucional e Controles */}
      <header className="px-4 py-3 bg-slate-900/90 backdrop-blur-md border-b border-white/10 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2.5 min-w-0">
          {dados.instituicao.logomarcaUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={dados.instituicao.logomarcaUrl}
              alt="Logo"
              className="h-8 object-contain rounded bg-white/10 p-0.5"
            />
          ) : (
            <div className="p-1.5 bg-primary/20 text-primary rounded-xl border border-primary/30">
              <Activity className="h-4 w-4" />
            </div>
          )}
          <div className="min-w-0">
            <h2 className="text-xs font-bold text-slate-200 truncate uppercase">
              {dados.instituicao.nome}
            </h2>
            <p className="text-[10px] text-slate-400 truncate">
              {dados.instituicao.unidade}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSomAtivo((s) => !s)}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 transition-colors"
            title={somAtivo ? 'Silenciar som' : 'Ativar som de chamada'}
            aria-label="Controle de áudio"
          >
            {somAtivo ? (
              <Volume2 className="h-4 w-4 text-primary" />
            ) : (
              <VolumeX className="h-4 w-4 text-slate-500" />
            )}
          </button>

          <button
            type="button"
            onClick={carregarDados}
            disabled={carregando}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 transition-colors"
            title="Atualizar dados agora"
            aria-label="Atualizar"
          >
            <RefreshCw className={cn('h-4 w-4 text-slate-300', carregando && 'animate-spin')} />
          </button>
        </div>
      </header>

      {/* 2. CORPO PRINCIPAL */}
      <main className="flex-1 p-4 max-w-md mx-auto w-full space-y-4">
        {/* BANNER DE CHAMADA ATIVA (SUPER DESTAQUE QUANDO CHAMADO) */}
        {dados.foiChamado && dados.chamada ? (
          <div className="relative overflow-hidden rounded-3xl p-5 bg-gradient-to-b from-sky-600 via-sky-700 to-sky-900 border-2 border-sky-300 shadow-2xl shadow-sky-500/30 animate-pulse text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-black uppercase tracking-wider mb-2">
              <Bell className="h-3.5 w-3.5 animate-bounce" />
              <span>VOCÊ FOI CHAMADO!</span>
            </div>

            <p className="text-xs text-sky-100 font-medium uppercase tracking-wider">
              Dirija-se imediatamente à
            </p>

            <div className="my-2 py-3 px-4 bg-white text-slate-950 rounded-2xl shadow-xl">
              <div className="flex items-center justify-center gap-2">
                <DoorOpen className="h-6 w-6 text-primary" />
                <h1 className="text-2xl font-black uppercase tracking-tight">
                  {dados.chamada.salaDestino}
                </h1>
              </div>
            </div>

            <p className="text-[11px] text-sky-100">
              {dados.chamada.etapa === 'TRIAGEM'
                ? 'A equipe de enfermagem aguarda você na triagem.'
                : 'O médico aguarda você no consultório.'}
            </p>
          </div>
        ) : null}

        {/* CARD PRINCIPAL DA SENHA E POSIÇÃO NA FILA */}
        <div className="rounded-3xl bg-slate-900/80 border border-white/10 p-5 shadow-xl backdrop-blur-xl relative overflow-hidden">
          {/* Badge de tipo de atendimento */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <span
              className={cn(
                'px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border',
                dados.tipoAtendimento.bgBadge
              )}
            >
              ● {dados.tipoAtendimento.nomeCurto}
            </span>

            <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-bold">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping inline-block" />
              <span>Ao Vivo</span>
            </span>
          </div>

          {/* Senha em Destaque */}
          <div className="text-center py-2">
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-[0.2em]">
              SUA SENHA DE ATENDIMENTO
            </p>
            <div className="text-5xl font-mono font-black text-white tracking-tight my-1 drop-shadow-md">
              {dados.senha}
            </div>
            <p className="text-xs text-slate-300 font-medium truncate uppercase mt-1">
              {dados.nomeMascarado}
            </p>
            <p className="text-[10px] font-mono text-slate-500">
              Atendimento: {dados.numeroAtendimento}
            </p>
          </div>

          {/* CONTADOR: QUANTAS PESSOAS FALTAM */}
          {dados.status === 'AGUARDANDO_TRIAGEM' || dados.status === 'AGUARDANDO_ATENDIMENTO' ? (
            <div className="mt-4 pt-4 border-t border-white/10">
              <div
                className={cn(
                  'rounded-2xl p-4 text-center border transition-all',
                  dados.pessoasNaFrente === 0
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                    : 'bg-primary/10 border-primary/30 text-sky-200'
                )}
              >
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Users className="h-5 w-5" />
                  <span className="text-xs font-extrabold uppercase tracking-wider">
                    Posição na Fila
                  </span>
                </div>

                {dados.pessoasNaFrente === 0 ? (
                  <div className="space-y-1">
                    <p className="text-xl font-black text-amber-400 flex items-center justify-center gap-1.5">
                      <Sparkles className="h-5 w-5 text-amber-400 animate-spin" />
                      <span>Você é o próximo!</span>
                    </p>
                    <p className="text-xs text-amber-200/80">
                      Sua senha será chamada a qualquer momento na tela de TV.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="text-3xl font-black font-mono text-white">
                      {dados.pessoasNaFrente}{' '}
                      <span className="text-base font-bold font-sans text-sky-300">
                        {dados.pessoasNaFrente === 1 ? 'pessoa na frente' : 'pessoas na frente'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Você é o <strong>{dados.posicaoFila}º</strong> da fila de{' '}
                      {dados.etapaAtual === 'TRIAGEM' ? 'Triagem' : 'Consulta Médica'}.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : null}

          {/* Badge Manchester (se já triado) */}
          {corManchester ? (
            <div className={cn('mt-3 p-3 rounded-2xl border text-center', corManchester.bg, corManchester.border)}>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Classificação de Risco (Manchester)
              </p>
              <p className={cn('text-sm font-black uppercase mt-0.5', corManchester.text)}>
                ◉ {corManchester.label}
              </p>
              <p className="text-[11px] text-slate-300 mt-0.5 font-medium">
                {corManchester.desc}
              </p>
            </div>
          ) : null}
        </div>

        {/* 3. LINHA DO TEMPO DO ATENDIMENTO (STEPPER) */}
        <div className="rounded-3xl bg-slate-900/60 border border-white/10 p-5 shadow-lg space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-primary" />
            <span>Etapas do Atendimento</span>
          </h3>

          <div className="space-y-3 pt-1">
            {dados.etapas.map((etapa, idx) => {
              const isConcluido = etapa.status === 'concluido';
              const isAtual = etapa.status === 'atual';

              return (
                <div key={etapa.id} className="flex items-start gap-3">
                  {/* Ícone Indicador */}
                  <div className="relative flex flex-col items-center">
                    <div
                      className={cn(
                        'h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold border transition-all shrink-0',
                        isConcluido
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                          : isAtual
                          ? 'bg-primary text-white border-primary shadow-md shadow-primary/30 animate-pulse'
                          : 'bg-slate-800 text-slate-500 border-white/10'
                      )}
                    >
                      {isConcluido ? <CheckCircle2 className="h-4 w-4" /> : idx + 1}
                    </div>
                    {idx < dados.etapas.length - 1 && (
                      <div
                        className={cn(
                          'w-0.5 h-6 my-1',
                          isConcluido ? 'bg-emerald-500/40' : 'bg-slate-800'
                        )}
                      />
                    )}
                  </div>

                  {/* Textos da Etapa */}
                  <div className="min-w-0 flex-1 pt-0.5">
                    <div className="flex items-center justify-between gap-2">
                      <p
                        className={cn(
                          'text-xs font-bold',
                          isAtual ? 'text-primary' : isConcluido ? 'text-slate-200' : 'text-slate-500'
                        )}
                      >
                        {etapa.titulo}
                      </p>
                      {etapa.detalhe && (
                        <span className="text-[10px] font-mono text-slate-400 bg-white/5 px-2 py-0.5 rounded-full">
                          {etapa.detalhe}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 leading-tight mt-0.5">
                      {etapa.subtitulo}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. DICA DE SEGURANÇA E CONFORTO */}
        <div className="rounded-2xl bg-sky-950/40 border border-sky-500/20 p-3.5 flex items-start gap-2.5 text-xs text-sky-200/90">
          <ShieldCheck className="h-5 w-5 text-sky-400 shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed">
            Você pode aguardar confortavelmente na recepção com este celular. Quando sua senha for chamada, ela vibrará e aparecerá no painel de TV da sala.
          </p>
        </div>
      </main>

      {/* 5. RODAPÉ */}
      <footer className="p-4 text-center border-t border-white/5 bg-slate-950 text-[10px] text-slate-500 space-y-1">
        <p>
          Última atualização: {ultimaAtualizacao.toLocaleTimeString('pt-BR')} • Conectado em tempo real
        </p>
        <p>SGH · PAJO Tecnologia</p>
      </footer>
    </div>
  );
}
