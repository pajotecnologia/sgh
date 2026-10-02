'use client';
// components/painel/PainelChamada.tsx
// Painel de chamada em tela cheia — escuta eventos Pusher e exibe com animação, chamada principal e lista dos próximos pacientes

import { useState, useEffect, useRef, useCallback } from 'react';
import { getPusherCliente, CANAIS_PUSHER, EVENTOS_PUSHER } from '@/lib/pusher';
import { cn } from '@/lib/utils';
import { Activity, Volume2, VolumeX, Wifi, WifiOff, Users, Clock, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { CorTriagem } from '@/types';
import type { ConfigPainelExibicao } from '@/lib/painel-config';
import { CONFIG_PAINEL_PADRAO, deveExibirMidiaRotativa } from '@/lib/painel-config';
import { PainelMidiaRotativa } from '@/components/painel/PainelMidiaRotativa';
import type { ProximoChamadoItem } from '@/lib/painel-proximos';

interface ChamadaItem {
  id: string;
  nomePaciente: string;
  numeroAtendimento: string;
  salaDestino: string;
  corTriagem: CorTriagem | null;
  chamadoEm: string;
  setorPainel: string;
}

interface PainelChamadaProps {
  historicoInicial: ChamadaItem[];
  proximosIniciais?: ProximoChamadoItem[];
  setor: string;
  instituicao?: any;
  configInicial?: ConfigPainelExibicao;
}

const COR_CONFIG: Record<string, { borda: string; bg: string; badgeBg: string; texto: string; label: string }> = {
  VERMELHO: { borda: 'border-l-red-500', bg: 'bg-red-950/30', badgeBg: 'bg-red-500/20 text-red-300 border-red-500/40', texto: 'text-red-400', label: 'EMERGÊNCIA' },
  LARANJA: { borda: 'border-l-orange-500', bg: 'bg-orange-950/20', badgeBg: 'bg-orange-500/20 text-orange-300 border-orange-500/40', texto: 'text-orange-400', label: 'MUITO URGENTE' },
  AMARELO: { borda: 'border-l-yellow-400', bg: 'bg-yellow-950/20', badgeBg: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40', texto: 'text-yellow-400', label: 'URGENTE' },
  VERDE: { borda: 'border-l-green-500', bg: 'bg-green-950/20', badgeBg: 'bg-green-500/20 text-green-300 border-green-500/40', texto: 'text-green-400', label: 'POUCO URGENTE' },
  AZUL: { borda: 'border-l-blue-500', bg: 'bg-blue-950/20', badgeBg: 'bg-blue-500/20 text-blue-300 border-blue-500/40', texto: 'text-blue-400', label: 'NÃO URGENTE' },
  CINZA: { borda: 'border-l-gray-500', bg: 'bg-gray-900/30', badgeBg: 'bg-gray-500/20 text-gray-300 border-gray-500/40', texto: 'text-gray-400', label: 'OBSERVAÇÃO' },
};

/** Beep curto sem arquivo estático (navegadores bloqueiam autoplay até haver gesto do usuário). */
function tocarBeepNotificacao(ctx: AudioContext) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.value = 784;
  gain.gain.setValueAtTime(0.12, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.4);
}

export function PainelChamada({
  historicoInicial,
  proximosIniciais = [],
  setor,
  instituicao,
  configInicial,
}: PainelChamadaProps) {
  const [configPainel, setConfigPainel] = useState<ConfigPainelExibicao>(configInicial ?? CONFIG_PAINEL_PADRAO);
  const [chamadaAtual, setChamadaAtual] = useState<ChamadaItem | null>(historicoInicial[0] ?? null);
  const [historico, setHistorico] = useState<ChamadaItem[]>(historicoInicial);
  const [proximos, setProximos] = useState<ProximoChamadoItem[]>(proximosIniciais);
  const [animando, setAnimando] = useState(false);
  const [somAtivo, setSomAtivo] = useState(true);
  const [conectado, setConectado] = useState(false);
  const [montado, setMontado] = useState(false);
  const [agora, setAgora] = useState<Date | null>(null);
  const [gestoAudioOk, setGestoAudioOk] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const chamadaIdRef = useRef<string | null>(historicoInicial[0]?.id ?? null);
  const conectadoRef = useRef(false);
  const somAtivoRef = useRef(true);
  const gestoAudioOkRef = useRef(false);

  useEffect(() => {
    somAtivoRef.current = somAtivo;
  }, [somAtivo]);

  useEffect(() => {
    gestoAudioOkRef.current = gestoAudioOk;
  }, [gestoAudioOk]);

  // Marcar como montado no client + iniciar relógio
  useEffect(() => {
    setMontado(true);
    setAgora(new Date());
    const timer = setInterval(() => setAgora(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Atualizar config do painel periodicamente
  useEffect(() => {
    const carregarConfig = async () => {
      try {
        const res = await fetch('/api/painel/config');
        const json = await res.json();
        if (json.sucesso && json.dados) setConfigPainel(json.dados);
      } catch {
        /* rede indisponível */
      }
    };
    void carregarConfig();
    const timer = setInterval(carregarConfig, 60_000);
    return () => clearInterval(timer);
  }, []);

  // Atualizar lista dos próximos a serem chamados periodicamente
  const carregarProximos = useCallback(async () => {
    try {
      const res = await fetch(`/api/painel/proximos?setor=${encodeURIComponent(setor)}&limite=5`);
      const json = await res.json();
      if (json.sucesso && Array.isArray(json.dados)) {
        setProximos(json.dados);
      }
    } catch {
      /* ignore */
    }
  }, [setor]);

  useEffect(() => {
    void carregarProximos();
    const timer = setInterval(carregarProximos, 4000);
    return () => clearInterval(timer);
  }, [carregarProximos]);

  // Vozes TTS
  useEffect(() => {
    if (!montado || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const warm = () => window.speechSynthesis.getVoices();
    warm();
    window.speechSynthesis.addEventListener('voiceschanged', warm);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', warm);
  }, [montado]);

  const obterOuCriarAudioContext = useCallback(() => {
    if (typeof window === 'undefined') return null;
    const AC =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    if (!audioContextRef.current) {
      try {
        audioContextRef.current = new AC();
      } catch {
        return null;
      }
    }
    return audioContextRef.current;
  }, []);

  const liberarAudioUsuario = useCallback(async () => {
    gestoAudioOkRef.current = true;
    setGestoAudioOk(true);
    const ctx = obterOuCriarAudioContext();
    if (ctx?.state === 'suspended') {
      try {
        await ctx.resume();
      } catch {
        /* empty */
      }
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
    }
    const el = audioRef.current;
    if (el) {
      try {
        el.volume = 0.01;
        await el.play();
        el.pause();
        el.currentTime = 0;
        el.volume = 1;
      } catch {
        /* ignore */
      }
    }
  }, [obterOuCriarAudioContext]);

  // Falar nome do paciente e sala via Text-to-Speech
  const falarChamada = useCallback((nome: string, sala: string) => {
    if (!somAtivoRef.current || !gestoAudioOkRef.current) return;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const texto = `Paciente ${nome}, dirija-se à ${sala}`;
    const falar = (delay: number) => {
      setTimeout(() => {
        if (!somAtivoRef.current || !gestoAudioOkRef.current) return;
        const utterance = new SpeechSynthesisUtterance(texto);
        utterance.lang = 'pt-BR';
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 1;
        const vozes = window.speechSynthesis.getVoices();
        const vozPt = vozes.find((v) => v.lang.startsWith('pt'));
        if (vozPt) utterance.voice = vozPt;
        window.speechSynthesis.speak(utterance);
      }, delay);
    };
    falar(400);
    falar(4000);
  }, []);

  const tocarSomChamada = useCallback(() => {
    if (!somAtivoRef.current || !gestoAudioOkRef.current) return;
    const el = audioRef.current;
    if (el) {
      el.currentTime = 0;
      void el.play().catch(() => {
        const ctx = obterOuCriarAudioContext();
        if (ctx?.state === 'suspended') void ctx.resume().catch(() => {});
        if (ctx) tocarBeepNotificacao(ctx);
      });
    } else {
      const ctx = obterOuCriarAudioContext();
      if (ctx?.state === 'suspended') void ctx.resume().catch(() => {});
      if (ctx) tocarBeepNotificacao(ctx);
    }
  }, [obterOuCriarAudioContext]);

  // Exibir nova chamada com animação, som e fala
  const exibirChamada = useCallback((nova: ChamadaItem) => {
    chamadaIdRef.current = nova.id;
    setAnimando(false);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setChamadaAtual(nova);
        setHistorico((prev) => [nova, ...prev.slice(0, 4)]);
        setAnimando(true);
        tocarSomChamada();
        falarChamada(nova.nomePaciente, nova.salaDestino);
        void carregarProximos();
      });
    });
  }, [falarChamada, tocarSomChamada, carregarProximos]);

  // Conectar ao Pusher
  useEffect(() => {
    const pollingHistorico = setInterval(async () => {
      if (conectadoRef.current) return;
      try {
        const res = await fetch(
          `/api/painel/historico?setor=${encodeURIComponent(setor)}&limite=5`
        );
        const json = await res.json();
        if (!json.sucesso || !Array.isArray(json.dados) || json.dados.length === 0) return;
        const maisRecente = json.dados[0] as ChamadaItem;
        const atualId = chamadaIdRef.current;
        if (!atualId || maisRecente.id !== atualId) {
          exibirChamada(maisRecente);
        }
      } catch {
        /* rede indisponível */
      }
    }, 2000);

    const pusher = getPusherCliente();
    if (!pusher) {
      conectadoRef.current = false;
      setConectado(false);
      return () => clearInterval(pollingHistorico);
    }

    const onConnected = () => {
      conectadoRef.current = true;
      setConectado(true);
    };
    const onDisconnected = () => {
      conectadoRef.current = false;
      setConectado(false);
    };
    const onError = () => {
      conectadoRef.current = false;
      setConectado(false);
    };

    pusher.connection.bind('connected', onConnected);
    pusher.connection.bind('disconnected', onDisconnected);
    pusher.connection.bind('error', onError);

    if (pusher.connection.state === 'connected') {
      conectadoRef.current = true;
      setConectado(true);
    }

    const nomeCanal = CANAIS_PUSHER.painel(setor);
    const canal = pusher.subscribe(nomeCanal);

    canal.bind(EVENTOS_PUSHER.CHAMADA_PACIENTE, (data: { chamada: ChamadaItem }) => {
      exibirChamada(data.chamada);
    });

    return () => {
      clearInterval(pollingHistorico);
      canal.unbind_all();
      pusher.unsubscribe(nomeCanal);
      pusher.connection.unbind('connected', onConnected);
      pusher.connection.unbind('disconnected', onDisconnected);
      pusher.connection.unbind('error', onError);
    };
  }, [setor, exibirChamada]);

  const corCfg = chamadaAtual?.corTriagem ? COR_CONFIG[chamadaAtual.corTriagem] : null;
  const exibirMidia = deveExibirMidiaRotativa(configPainel);
  const midiaEsquerda = configPainel.posicaoMidia !== 'direita';

  const areaMidia = exibirMidia ? (
    <PainelMidiaRotativa
      imagens={configPainel.imagensRotativas}
      intervaloSegundos={configPainel.intervaloRotacaoSegundos}
      className="h-full w-full min-h-0"
    />
  ) : null;

  const areaChamadas = (
    <div className="flex flex-col min-h-0 h-full justify-between">
      {/* 1. Área Principal: Chamada Atual */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 relative overflow-hidden min-h-0 py-4">
        {corCfg && (
          <div className={cn('absolute inset-0 transition-all duration-700', corCfg.bg)} />
        )}

        {chamadaAtual ? (
          <div
            className={cn(
              'relative z-10 text-center w-full max-w-4xl',
              'border-l-[8px] pl-5 sm:pl-7 py-3 sm:py-4',
              animando ? 'animate-fade-in-up' : 'opacity-0',
              corCfg?.borda ?? 'border-l-slate-600'
            )}
          >
            {corCfg && (
              <p className={cn('text-xs sm:text-sm font-bold uppercase tracking-[0.2em] mb-2', corCfg.texto)}>
                ◉ {corCfg.label}
              </p>
            )}

            {/* Nome do paciente - tamanho ajustado e equilibrado */}
            <h1
              className="font-extrabold text-white text-balance leading-tight mb-2 tracking-tight"
              style={{ fontSize: exibirMidia ? 'clamp(1.6rem, 3.2vw, 3rem)' : 'clamp(2.2rem, 5vw, 4.2rem)' }}
            >
              {chamadaAtual.nomePaciente}
            </h1>

            <p
              className="font-mono text-slate-400 mb-4"
              style={{ fontSize: exibirMidia ? 'clamp(0.9rem, 1.6vw, 1.25rem)' : 'clamp(1.1rem, 2vw, 1.6rem)' }}
            >
              Atendimento: <span className="text-slate-200 font-semibold">{chamadaAtual.numeroAtendimento}</span>
            </p>

            <div className="inline-flex flex-col sm:flex-row items-center gap-2 sm:gap-3 px-5 sm:px-7 py-2.5 sm:py-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-lg shadow-black/20">
              <span className="text-slate-300 text-xs sm:text-sm uppercase tracking-widest font-medium">Dirija-se a</span>
              <span
                className="font-black text-white"
                style={{ fontSize: exibirMidia ? 'clamp(1.2rem, 2.4vw, 1.85rem)' : 'clamp(1.5rem, 3.2vw, 2.5rem)' }}
              >
                {chamadaAtual.salaDestino}
              </span>
            </div>
          </div>
        ) : (
          <div className="text-center text-slate-500 relative z-10">
            <Activity className="h-10 w-10 lg:h-14 lg:w-14 mx-auto mb-3 opacity-20" />
            <p className="text-lg lg:text-xl font-medium">Aguardando chamadas...</p>
            <p className="text-xs mt-1 opacity-60">O sistema atualizará automaticamente</p>
          </div>
        )}
      </div>

      {/* 2. Seção: Próximos 5 a serem chamados (Fila de Espera) */}
      <div className="shrink-0 px-4 sm:px-6 lg:px-8 py-3 bg-slate-900/80 border-t border-white/10 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary shrink-0" />
            <span className="text-xs sm:text-sm font-bold text-slate-200 uppercase tracking-wider">
              Próximos a serem chamados
            </span>
            <span className="px-2 py-0.5 rounded-full bg-white/10 text-[11px] font-semibold text-slate-300">
              {proximos.length} na fila
            </span>
          </div>
          <span className="text-[11px] text-slate-400 hidden sm:inline-flex items-center gap-1">
            Ordem de prioridade e chegada <ArrowRight className="h-3 w-3" />
          </span>
        </div>

        {proximos.length === 0 ? (
          <div className="py-2.5 text-center text-xs text-slate-500 bg-slate-950/40 rounded-xl border border-white/5">
            Nenhum paciente aguardando chamada neste momento.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
            {proximos.slice(0, 5).map((p, idx) => {
              const cfg = p.corTriagem ? COR_CONFIG[p.corTriagem] : null;
              return (
                <div
                  key={p.id}
                  className="flex flex-col justify-between p-2.5 rounded-xl bg-slate-800/70 border border-white/10 hover:border-white/20 transition-colors"
                >
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <span className="text-[10px] font-bold text-sky-400 bg-sky-950/60 px-1.5 py-0.5 rounded">
                      #{idx + 1}º
                    </span>
                    {cfg ? (
                      <span className={cn('text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded border', cfg.badgeBg)}>
                        {cfg.label.split(' ')[0]}
                      </span>
                    ) : (
                      <span className="text-[9px] font-medium text-slate-400 bg-slate-700/50 px-1.5 py-0.5 rounded">
                        {p.etapa}
                      </span>
                    )}
                  </div>

                  <p className="text-xs sm:text-sm font-bold text-white truncate" title={p.nomePaciente}>
                    {p.nomePaciente}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                    <span className="font-mono truncate">{p.numeroAtendimento}</span>
                    <span className="shrink-0 text-slate-500">{p.tempoEsperaMinutos}min</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Seção: Chamadas Anteriores (Histórico Recente) */}
      {historico.length > 1 && (
        <div className="shrink-0 border-t border-white/10 bg-slate-950/90 px-4 sm:px-6 lg:px-8 py-2">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">
              Últimas chamadas realizadas
            </span>
          </div>
          <div className={cn('grid gap-2', exibirMidia ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-2 md:grid-cols-4')}>
            {historico.slice(1, 5).map((c, idx) => {
              const cfg = c.corTriagem ? COR_CONFIG[c.corTriagem] : null;
              const opacidade = [0.85, 0.65, 0.5, 0.4][idx] ?? 0.35;
              return (
                <div
                  key={c.id}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-900/80 border border-white/5"
                  style={{ opacity: opacidade }}
                >
                  {cfg && (
                    <div className={cn('w-1 self-stretch rounded-full shrink-0', cfg.borda.replace('border-l-', 'bg-'))} />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-200 truncate">{c.nomePaciente}</p>
                    <p className="text-[10px] text-slate-400 truncate">{c.salaDestino}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="h-screen flex flex-col overflow-hidden relative bg-slate-950 text-white">
      {/* Áudio opcional em /public/sons/chamada-painel.mp3 — se faltar, usa beep sintético após gesto */}
      {montado && <audio ref={audioRef} src="/sons/chamada-painel.mp3" preload="auto" />}

      {!gestoAudioOk && (
        <button
          type="button"
          className="absolute inset-0 z-[60] flex flex-col items-center justify-center gap-4 bg-slate-950/85 text-center px-8 cursor-pointer border-0 backdrop-blur-sm"
          onClick={() => void liberarAudioUsuario()}
        >
          <Volume2 className="h-14 w-14 text-sky-400 animate-pulse" />
          <p className="text-2xl font-bold text-white max-w-lg">
            Toque na tela para ativar som e voz
          </p>
          <p className="text-slate-300 text-sm max-w-md leading-relaxed">
            Navegadores só permitem áudio e leitura do nome após um toque ou clique (política de autoplay).
            Depois disso, chamadas novas tocarão alerta e anunciarão o paciente e a sala.
          </p>
        </button>
      )}

      {/* Barra de topo */}
      <div className="flex items-center justify-between px-6 sm:px-8 py-3.5 border-b border-white/10 bg-slate-900/60 shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-3">
          {instituicao?.logomarcaUrl ? (
            <img src={instituicao.logomarcaUrl} alt="Logo" className="h-9 object-contain rounded bg-white/10 p-1" />
          ) : (
            <div className="p-1.5 bg-primary rounded-lg">
              <Activity className="h-5 w-5 text-white" />
            </div>
          )}
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-widest leading-none">
              {instituicao?.nomeInstituicao ?? 'SGH'}
            </p>
            <p className="text-sm font-bold text-white leading-none mt-1">Painel de Chamada</p>
          </div>
          {setor !== 'GERAL' && (
            <span className="px-2.5 py-0.5 bg-primary/20 text-primary border border-primary/30 rounded-full text-xs font-semibold ml-2">
              {setor}
            </span>
          )}
        </div>

        {/* Relógio + controles */}
        <div className="flex items-center gap-4 flex-wrap justify-end">
          <p className="text-2xl font-mono font-bold text-white tabular-nums" suppressHydrationWarning>
            {agora ? format(agora, 'HH:mm:ss') : '--:--:--'}
          </p>
          <p className="text-xs text-slate-400 capitalize hidden sm:inline-block" suppressHydrationWarning>
            {agora ? format(agora, "EEEE, dd 'de' MMMM", { locale: ptBR }) : ''}
          </p>

          {/* Status de conexão */}
          <div className={cn('flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium', conectado ? 'bg-green-900/40 text-green-400 border border-green-500/20' : 'bg-red-900/40 text-red-400 border border-red-500/20')}>
            {conectado ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            {conectado ? 'Online' : 'Offline'}
          </div>

          {/* Toggle de som */}
          <button
            type="button"
            onClick={() => setSomAtivo((s) => !s)}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-slate-300"
            aria-label={somAtivo ? 'Silenciar' : 'Ativar som'}
          >
            {somAtivo ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </button>

          {!gestoAudioOk && (
            <button
              type="button"
              onClick={() => void liberarAudioUsuario()}
              className="px-3 py-1.5 rounded-lg bg-sky-600 text-white text-xs font-semibold hover:bg-sky-700 shadow"
            >
              Ativar áudio
            </button>
          )}
        </div>
      </div>

      {/* Área principal — layout dividido ou tela cheia */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {exibirMidia && midiaEsquerda ? (
          <div className="w-1/2 shrink-0 border-r border-white/10">{areaMidia}</div>
        ) : null}
        <div className={cn('min-w-0 flex flex-col', exibirMidia ? 'w-1/2' : 'w-full')}>
          {areaChamadas}
        </div>
        {exibirMidia && !midiaEsquerda ? (
          <div className="w-1/2 shrink-0 border-l border-white/10">{areaMidia}</div>
        ) : null}
      </div>

      {/* Footer */}
      <div className="shrink-0 bg-slate-950 py-1 text-center border-t border-white/5">
        <p className="text-[10px] text-slate-500 font-medium">
          Desenvolvimento por PAJO Tecnologia - pajotech.com.br
        </p>
      </div>
    </div>
  );
}
