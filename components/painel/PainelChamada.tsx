'use client';
// components/painel/PainelChamada.tsx
// Painel de chamada em tela cheia com Código de Senha por Tipo de Atendimento (SP, SG, S8, PD, OB, EX, RT)
// Suporte a Protocolo de Manchester, voz sintetizada TTS, fila dos próximos e histórico de chamadas.

import { useState, useEffect, useRef, useCallback } from 'react';
import { getPusherCliente, CANAIS_PUSHER, EVENTOS_PUSHER } from '@/lib/pusher';
import { cn } from '@/lib/utils';
import { Activity, Volume2, VolumeX, Wifi, WifiOff, Clock, ArrowRight, BellRing } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { CorTriagem } from '@/types';
import type { ConfigPainelExibicao } from '@/lib/painel-config';
import { CONFIG_PAINEL_PADRAO, deveExibirMidiaRotativa } from '@/lib/painel-config';
import { PainelMidiaRotativa } from '@/components/painel/PainelMidiaRotativa';
import type { ProximoChamadoItem } from '@/lib/painel-proximos';
import { resolverSenhaETipo, type TipoAtendimentoInfo } from '@/lib/senhas';

interface ChamadaItem {
  id: string;
  nomePaciente: string;
  numeroAtendimento: string;
  senha?: string;
  tipoAtendimento?: TipoAtendimentoInfo;
  etapa?: 'TRIAGEM' | 'CONSULTÓRIO' | string;
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

const COR_CONFIG: Record<string, { borda: string; bg: string; badgeBg: string; texto: string; label: string; glow: string }> = {
  VERMELHO: { borda: 'border-l-red-500', bg: 'bg-red-950/40', badgeBg: 'bg-red-500/20 text-red-300 border-red-500/50', texto: 'text-red-400', label: 'EMERGÊNCIA', glow: 'shadow-red-500/20' },
  LARANJA: { borda: 'border-l-orange-500', bg: 'bg-orange-950/30', badgeBg: 'bg-orange-500/20 text-orange-300 border-orange-500/50', texto: 'text-orange-400', label: 'MUITO URGENTE', glow: 'shadow-orange-500/20' },
  AMARELO: { borda: 'border-l-yellow-400', bg: 'bg-yellow-950/30', badgeBg: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50', texto: 'text-yellow-400', label: 'URGENTE', glow: 'shadow-yellow-500/20' },
  VERDE: { borda: 'border-l-green-500', bg: 'bg-green-950/30', badgeBg: 'bg-green-500/20 text-green-300 border-green-500/50', texto: 'text-green-400', label: 'POUCO URGENTE', glow: 'shadow-green-500/20' },
  AZUL: { borda: 'border-l-blue-500', bg: 'bg-blue-950/30', badgeBg: 'bg-blue-500/20 text-blue-300 border-blue-500/50', texto: 'text-blue-400', label: 'NÃO URGENTE', glow: 'shadow-blue-500/20' },
  CINZA: { borda: 'border-l-gray-500', bg: 'bg-gray-900/40', badgeBg: 'bg-gray-500/20 text-gray-300 border-gray-500/50', texto: 'text-gray-400', label: 'OBSERVAÇÃO', glow: 'shadow-gray-500/20' },
};

/** Beep suave sem arquivo estático (Web Audio API) */
function tocarBeepNotificacao(ctx: AudioContext) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
  osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // A5
  gain.gain.setValueAtTime(0.18, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.6);
}

/** Formata a pronúncia da senha para a voz sintetizada */
function formatarVozSenha(senha: string): string {
  const limpa = senha.replace(/\s+/g, '').toUpperCase();
  const partes = limpa.split('-');
  if (partes.length === 2) {
    const letras = partes[0].split('').join(' ');
    const num = parseInt(partes[1], 10);
    return `Senha ${letras} ${isNaN(num) ? partes[1] : num}`;
  }
  return `Senha ${senha}`;
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

  // Relógio
  useEffect(() => {
    setMontado(true);
    setAgora(new Date());
    const timer = setInterval(() => setAgora(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Configuração do Painel
  useEffect(() => {
    const carregarConfig = async () => {
      try {
        const res = await fetch('/api/painel/config');
        const json = await res.json();
        if (json.sucesso && json.dados) setConfigPainel(json.dados);
      } catch {}
    };
    void carregarConfig();
    const timer = setInterval(carregarConfig, 60_000);
    return () => clearInterval(timer);
  }, []);

  // Carregar Próximos Chamados
  const carregarProximos = useCallback(async () => {
    try {
      const res = await fetch(`/api/painel/proximos?setor=${encodeURIComponent(setor)}&limite=5`);
      const json = await res.json();
      if (json.sucesso && Array.isArray(json.dados)) {
        setProximos(json.dados);
        if (!conectadoRef.current) setConectado(true);
      }
    } catch {
      if (!conectadoRef.current) setConectado(false);
    }
  }, [setor]);

  useEffect(() => {
    void carregarProximos();
    const timer = setInterval(carregarProximos, 4000);
    return () => clearInterval(timer);
  }, [carregarProximos]);

  // Audio Context e TTS
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
      } catch {}
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
    }
  }, [obterOuCriarAudioContext]);

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

  const falarChamada = useCallback((senha: string, nome: string, sala: string) => {
    if (!somAtivoRef.current || !gestoAudioOkRef.current) return;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    const senhaPronuncia = formatarVozSenha(senha);
    const texto = `Atenção: ${senhaPronuncia}, ${nome}, dirija-se à ${sala}.`;

    const falar = (delay: number) => {
      setTimeout(() => {
        if (!somAtivoRef.current || !gestoAudioOkRef.current) return;
        const utterance = new SpeechSynthesisUtterance(texto);
        utterance.lang = 'pt-BR';
        utterance.rate = 0.88;
        utterance.pitch = 1.0;
        utterance.volume = 1;
        const vozes = window.speechSynthesis.getVoices();
        const vozPt = vozes.find((v) => v.lang.startsWith('pt'));
        if (vozPt) utterance.voice = vozPt;
        window.speechSynthesis.speak(utterance);
      }, delay);
    };

    falar(350);
    falar(4500);
  }, []);

  const exibirChamada = useCallback((nova: ChamadaItem) => {
    const dadosCompletos = {
      ...nova,
      ...(nova.senha ? {} : (() => {
        const { senha, tipo } = resolverSenhaETipo({ numeroAtendimento: nova.numeroAtendimento });
        return { senha, tipoAtendimento: tipo };
      })()),
    };

    chamadaIdRef.current = nova.id;
    setAnimando(false);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setChamadaAtual(dadosCompletos);
        setHistorico((prev) => [dadosCompletos, ...prev.slice(0, 4)]);
        setAnimando(true);
        tocarSomChamada();
        falarChamada(
          dadosCompletos.senha ?? dadosCompletos.numeroAtendimento,
          dadosCompletos.nomePaciente,
          dadosCompletos.salaDestino
        );
        void carregarProximos();
      });
    });
  }, [falarChamada, tocarSomChamada, carregarProximos]);

  // WebSocket Pusher + Polling Fallback
  useEffect(() => {
    let pusherAtivo = false;
    const pusher = getPusherCliente();

    const pollingHistorico = setInterval(async () => {
      try {
        const res = await fetch(`/api/painel/historico?setor=${encodeURIComponent(setor)}&limite=5`);
        const json = await res.json();
        if (json.sucesso) {
          if (!pusherAtivo) setConectado(true);
          if (Array.isArray(json.dados) && json.dados.length > 0) {
            const maisRecente = json.dados[0] as ChamadaItem;
            const atualId = chamadaIdRef.current;
            if (!atualId || maisRecente.id !== atualId) {
              exibirChamada(maisRecente);
            }
          }
        }
      } catch {
        if (!pusherAtivo) setConectado(false);
      }
    }, 2000);

    if (!pusher) {
      void carregarProximos();
      return () => clearInterval(pollingHistorico);
    }

    const onConnected = () => {
      pusherAtivo = true;
      conectadoRef.current = true;
      setConectado(true);
    };
    const onDisconnected = () => {
      pusherAtivo = false;
      conectadoRef.current = false;
    };
    const onError = () => {
      pusherAtivo = false;
      conectadoRef.current = false;
    };

    pusher.connection.bind('connected', onConnected);
    pusher.connection.bind('disconnected', onDisconnected);
    pusher.connection.bind('error', onError);

    if (pusher.connection.state === 'connected') {
      pusherAtivo = true;
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
  }, [setor, exibirChamada, carregarProximos]);

  // Informações da chamada atual
  const corCfg = chamadaAtual?.corTriagem ? COR_CONFIG[chamadaAtual.corTriagem] : null;
  const senhaAtual = chamadaAtual?.senha ?? (chamadaAtual ? resolverSenhaETipo({ numeroAtendimento: chamadaAtual.numeroAtendimento }).senha : '---');
  const tipoAtual = chamadaAtual?.tipoAtendimento ?? (chamadaAtual ? resolverSenhaETipo({ numeroAtendimento: chamadaAtual.numeroAtendimento }).tipo : null);
  const etapaAtual = chamadaAtual?.etapa ?? (chamadaAtual?.corTriagem ? 'CONSULTÓRIO' : 'TRIAGEM');

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
      {/* 1. Área Central: Chamada Atual em Destaque Gigante */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 relative overflow-hidden min-h-0 py-4">
        {corCfg && (
          <div className={cn('absolute inset-0 transition-all duration-700 opacity-70', corCfg.bg)} />
        )}

        {chamadaAtual ? (
          <div
            className={cn(
              'relative z-10 text-center w-full max-w-4xl p-6 sm:p-8 rounded-3xl',
              'bg-slate-900/80 border-2 backdrop-blur-xl shadow-2xl transition-all duration-500',
              animando ? 'animate-fade-in-up scale-100' : 'opacity-0 scale-95',
              corCfg ? `${corCfg.borda.replace('border-l-', 'border-')} ${corCfg.glow}` : 'border-sky-500/50 shadow-sky-500/10'
            )}
          >
            {/* Badges Superiores: Tipo de Atendimento + Etapa da Chamada */}
            <div className="flex flex-wrap items-center justify-center gap-2 mb-3">
              {tipoAtual && (
                <span className={cn('px-3.5 py-1 rounded-full text-xs sm:text-sm font-black uppercase tracking-wider border shadow-sm', tipoAtual.bgBadge)}>
                  ● {tipoAtual.nomeCurto}
                </span>
              )}

              <span className={cn(
                'px-3.5 py-1 rounded-full text-xs sm:text-sm font-extrabold uppercase tracking-wider border',
                etapaAtual === 'TRIAGEM'
                  ? 'bg-cyan-950/60 text-cyan-300 border-cyan-500/50'
                  : 'bg-emerald-950/60 text-emerald-300 border-emerald-500/50'
              )}>
                {etapaAtual === 'TRIAGEM' ? 'Chamada para Triagem' : 'Chamada para Consultório'}
              </span>

              {corCfg && (
                <span className={cn('px-3.5 py-1 rounded-full text-xs sm:text-sm font-black uppercase tracking-wider border', corCfg.badgeBg)}>
                  ◉ {corCfg.label}
                </span>
              )}
            </div>

            {/* CÓDIGO DA SENHA EM SUPER DESTAQUE GIGANTE */}
            <div className="my-2 py-1">
              <span className="text-xs uppercase tracking-[0.3em] text-slate-400 font-bold block mb-1">
                SENHA DE ATENDIMENTO
              </span>
              <h2
                className="font-black font-mono tracking-tight text-white drop-shadow-[0_10px_25px_rgba(255,255,255,0.2)]"
                style={{ fontSize: exibirMidia ? 'clamp(3rem, 6.5vw, 5.5rem)' : 'clamp(4rem, 9vw, 7.5rem)' }}
              >
                {senhaAtual}
              </h2>
            </div>

            {/* Nome do Paciente */}
            <h1
              className="font-extrabold text-slate-100 text-balance leading-tight mb-4 tracking-tight"
              style={{ fontSize: exibirMidia ? 'clamp(1.5rem, 2.8vw, 2.5rem)' : 'clamp(1.8rem, 4vw, 3.2rem)' }}
            >
              {chamadaAtual.nomePaciente}
            </h1>

            {/* Sala de Destino / Guichê */}
            <div className="inline-flex flex-col sm:flex-row items-center gap-2 sm:gap-4 px-6 sm:px-8 py-3.5 bg-gradient-to-r from-sky-600/30 via-primary/30 to-sky-600/30 backdrop-blur-md rounded-2xl border border-sky-400/30 shadow-xl shadow-black/30">
              <span className="text-sky-200 text-xs sm:text-sm uppercase tracking-widest font-bold">
                Dirija-se à
              </span>
              <span
                className="font-black text-white uppercase tracking-wide"
                style={{ fontSize: exibirMidia ? 'clamp(1.3rem, 2.4vw, 2.2rem)' : 'clamp(1.6rem, 3.2vw, 2.8rem)' }}
              >
                {chamadaAtual.salaDestino}
              </span>
            </div>

            <p className="font-mono text-xs text-slate-500 mt-3">
              Atendimento: {chamadaAtual.numeroAtendimento}
            </p>
          </div>
        ) : (
          <div className="text-center text-slate-500 relative z-10">
            <Activity className="h-12 w-12 lg:h-16 lg:w-16 mx-auto mb-3 opacity-30 animate-pulse text-sky-400" />
            <p className="text-xl lg:text-2xl font-bold text-slate-300">Aguardando próximas chamadas...</p>
            <p className="text-xs mt-1 text-slate-500">As novas senhas aparecerão automaticamente na tela</p>
          </div>
        )}
      </div>

      {/* 2. Seção: Próximos na Fila de Espera */}
      <div className="shrink-0 px-4 sm:px-6 lg:px-8 py-3 bg-slate-900/90 border-t border-white/10 backdrop-blur-md">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-sky-400 shrink-0" />
            <span className="text-xs sm:text-sm font-extrabold text-slate-200 uppercase tracking-wider">
              Próximos a serem chamados
            </span>
            <span className="px-2 py-0.5 rounded-full bg-white/10 text-[11px] font-semibold text-slate-300">
              {proximos.length} aguardando
            </span>
          </div>
          <span className="text-[11px] text-slate-400 hidden sm:inline-flex items-center gap-1">
            Ordem por gravidade clínica e chegada <ArrowRight className="h-3 w-3" />
          </span>
        </div>

        {proximos.length === 0 ? (
          <div className="py-2.5 text-center text-xs text-slate-500 bg-slate-950/40 rounded-xl border border-white/5">
            Nenhum paciente aguardando chamada neste momento.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5">
            {proximos.slice(0, 5).map((p, idx) => {
              const cfg = p.corTriagem ? COR_CONFIG[p.corTriagem] : null;
              return (
                <div
                  key={p.id}
                  className="flex flex-col justify-between p-2.5 rounded-xl bg-slate-800/80 border border-white/10 hover:border-white/25 transition-all shadow-sm"
                >
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <span className="text-[10px] font-black text-sky-400 bg-sky-950/80 px-1.5 py-0.5 rounded">
                      #{idx + 1}º
                    </span>
                    {cfg ? (
                      <span className={cn('text-[9px] font-black uppercase px-1.5 py-0.5 rounded border', cfg.badgeBg)}>
                        {cfg.label.split(' ')[0]}
                      </span>
                    ) : (
                      <span className={cn('text-[9px] font-black uppercase px-1.5 py-0.5 rounded border', p.tipoAtendimento?.bgBadge ?? 'bg-slate-700/50 text-slate-300 border-white/10')}>
                        {p.tipoAtendimento?.nomeCurto ?? p.etapa}
                      </span>
                    )}
                  </div>

                  {/* SENHA EM DESTAQUE NO CARD */}
                  <div className="my-0.5 flex items-baseline justify-between gap-1">
                    <span className="font-mono font-black text-sm text-sky-300">
                      {p.senha}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium truncate max-w-[90px]">
                      {p.etapa === 'TRIAGEM' ? 'Triagem' : 'Médico'}
                    </span>
                  </div>

                  <p className="text-xs font-bold text-white truncate" title={p.nomePaciente}>
                    {p.nomePaciente}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1 pt-1 border-t border-white/5">
                    <span className="font-mono text-[9px] text-slate-500 truncate">{p.numeroAtendimento}</span>
                    <span className="shrink-0 text-slate-400 font-medium">{p.tempoEsperaMinutos}min</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Seção: Chamadas Anteriores (Histórico Recente) */}
      {historico.length > 1 && (
        <div className="shrink-0 border-t border-white/10 bg-slate-950 px-4 sm:px-6 lg:px-8 py-2">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
              Últimas chamadas realizadas
            </span>
          </div>
          <div className={cn('grid gap-2', exibirMidia ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-2 md:grid-cols-4')}>
            {historico.slice(1, 5).map((c, idx) => {
              const cfg = c.corTriagem ? COR_CONFIG[c.corTriagem] : null;
              const senhaCard = c.senha ?? resolverSenhaETipo({ numeroAtendimento: c.numeroAtendimento }).senha;
              const opacidade = [0.9, 0.7, 0.5, 0.4][idx] ?? 0.35;
              return (
                <div
                  key={c.id}
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-white/10"
                  style={{ opacity: opacidade }}
                >
                  {cfg ? (
                    <div className={cn('w-1.5 self-stretch rounded-full shrink-0', cfg.borda.replace('border-l-', 'bg-'))} />
                  ) : (
                    <div className="w-1.5 self-stretch rounded-full shrink-0 bg-sky-500" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-black text-xs text-sky-400">{senhaCard}</span>
                      <p className="text-xs font-semibold text-slate-200 truncate">{c.nomePaciente}</p>
                    </div>
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
    <div className="h-screen flex flex-col overflow-hidden relative bg-slate-950 text-white font-sans">
      {montado && <audio ref={audioRef} src="/sons/chamada-painel.mp3" preload="auto" />}

      {/* Tela de Desbloqueio de Áudio (Políticas de Autoplay dos navegadores) */}
      {!gestoAudioOk && (
        <button
          type="button"
          className="absolute inset-0 z-[60] flex flex-col items-center justify-center gap-4 bg-slate-950/90 text-center px-8 cursor-pointer border-0 backdrop-blur-md"
          onClick={() => void liberarAudioUsuario()}
        >
          <div className="p-4 bg-sky-500/20 rounded-full border border-sky-400/40 animate-pulse">
            <Volume2 className="h-16 w-16 text-sky-400" />
          </div>
          <p className="text-3xl font-extrabold text-white max-w-lg tracking-tight">
            Toque na tela para ativar som e voz do painel
          </p>
          <p className="text-slate-300 text-sm max-w-md leading-relaxed">
            Navegadores exigem um toque inicial para liberar a voz sintetizada e o aviso sonoro das senhas chamadas.
          </p>
          <span className="mt-2 px-6 py-2.5 rounded-xl bg-sky-600 text-white font-bold text-sm shadow-lg shadow-sky-600/30 hover:bg-sky-500 transition-colors">
            Ativar Sistema de Áudio
          </span>
        </button>
      )}

      {/* Barra de Topo */}
      <div className="flex items-center justify-between px-6 sm:px-8 py-3.5 border-b border-white/10 bg-slate-900/80 backdrop-blur-md shrink-0">
        {/* Logo e Nome */}
        <div className="flex items-center gap-3">
          {instituicao?.logomarcaUrl ? (
            <img src={instituicao.logomarcaUrl} alt="Logo" className="h-9 object-contain rounded bg-white/10 p-1" />
          ) : (
            <div className="p-2 bg-gradient-to-tr from-sky-600 to-primary rounded-xl shadow-md shadow-primary/30">
              <Activity className="h-5 w-5 text-white" />
            </div>
          )}
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold leading-none">
              {instituicao?.nomeInstituicao ?? 'SGH - HOSPITAL'}
            </p>
            <p className="text-base font-black text-white leading-none mt-1">Painel de Chamadas</p>
          </div>
          {setor !== 'GERAL' && (
            <span className="px-2.5 py-0.5 bg-primary/20 text-primary border border-primary/30 rounded-full text-xs font-bold ml-2">
              {setor}
            </span>
          )}
        </div>

        {/* Relógio + Controles */}
        <div className="flex items-center gap-4 flex-wrap justify-end">
          <p className="text-2xl font-mono font-black text-white tabular-nums tracking-tight" suppressHydrationWarning>
            {agora ? format(agora, 'HH:mm:ss') : '--:--:--'}
          </p>
          <p className="text-xs text-slate-400 capitalize hidden sm:inline-block font-medium" suppressHydrationWarning>
            {agora ? format(agora, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : ''}
          </p>

          <div className={cn('flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold', conectado ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30' : 'bg-red-950/60 text-red-400 border border-red-500/30')}>
            {conectado ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            {conectado ? 'Online' : 'Offline'}
          </div>

          <button
            type="button"
            onClick={() => setSomAtivo((s) => !s)}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-slate-300"
            aria-label={somAtivo ? 'Silenciar' : 'Ativar som'}
          >
            {somAtivo ? <Volume2 className="h-4 w-4 text-sky-400" /> : <VolumeX className="h-4 w-4 text-red-400" />}
          </button>
        </div>
      </div>

      {/* Área Principal */}
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

      {/* Rodapé */}
      <div className="shrink-0 bg-slate-950 py-1 text-center border-t border-white/5">
        <p className="text-[10px] text-slate-500 font-medium">
          Desenvolvido por PAJO Tecnologia · pajotech.com.br
        </p>
      </div>
    </div>
  );
}
