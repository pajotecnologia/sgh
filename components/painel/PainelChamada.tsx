'use client';
// components/painel/PainelChamada.tsx
// Painel de chamada em tela cheia com Código de Senha por Tipo de Atendimento (SP, SG, S8, PD, OB, EX, RT)
// Layout balanceado para TV full screen ou tela dividida com mídia rotativa.

import { useState, useEffect, useRef, useCallback } from 'react';
import { getPusherCliente, CANAIS_PUSHER, EVENTOS_PUSHER } from '@/lib/pusher';
import { cn } from '@/lib/utils';
import { Activity, Volume2, VolumeX, Wifi, WifiOff, Clock, ArrowRight, DoorOpen } from 'lucide-react';
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
  VERMELHO: { borda: 'border-red-500', bg: 'bg-red-950/40', badgeBg: 'bg-red-500/20 text-red-300 border-red-500/50', texto: 'text-red-400', label: 'EMERGÊNCIA', glow: 'shadow-red-500/20' },
  LARANJA: { borda: 'border-orange-500', bg: 'bg-orange-950/30', badgeBg: 'bg-orange-500/20 text-orange-300 border-orange-500/50', texto: 'text-orange-400', label: 'MUITO URGENTE', glow: 'shadow-orange-500/20' },
  AMARELO: { borda: 'border-yellow-400', bg: 'bg-yellow-950/30', badgeBg: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50', texto: 'text-yellow-400', label: 'URGENTE', glow: 'shadow-yellow-500/20' },
  VERDE: { borda: 'border-green-500', bg: 'bg-green-950/30', badgeBg: 'bg-green-500/20 text-green-300 border-green-500/50', texto: 'text-green-400', label: 'POUCO URGENTE', glow: 'shadow-green-500/20' },
  AZUL: { borda: 'border-blue-500', bg: 'bg-blue-950/30', badgeBg: 'bg-blue-500/20 text-blue-300 border-blue-500/50', texto: 'text-blue-400', label: 'NÃO URGENTE', glow: 'shadow-blue-500/20' },
  CINZA: { borda: 'border-gray-500', bg: 'bg-gray-900/40', badgeBg: 'bg-gray-500/20 text-gray-300 border-gray-500/50', texto: 'text-gray-400', label: 'OBSERVAÇÃO', glow: 'shadow-gray-500/20' },
};

function tocarBeepNotificacao(ctx: AudioContext) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(587.33, ctx.currentTime);
  osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15);
  gain.gain.setValueAtTime(0.18, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.6);
}

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

  useEffect(() => {
    setMontado(true);
    setAgora(new Date());
    const timer = setInterval(() => setAgora(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

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
      className="h-full w-full min-h-0 object-cover"
    />
  ) : null;

  const areaChamadas = (
    <div className="flex flex-col h-full min-h-0 justify-between bg-slate-950/70 p-3 sm:p-4 lg:p-6 overflow-hidden">
      {/* 1. Área Central: Chamada Atual em Card Elegante e Arejado */}
      <div className="flex-1 flex items-center justify-center min-h-0 relative py-2">
        {corCfg && (
          <div className={cn('absolute inset-0 transition-all duration-700 opacity-20 blur-3xl pointer-events-none', corCfg.bg)} />
        )}

        {chamadaAtual ? (
          <div
            className={cn(
              'relative z-10 w-full max-w-2xl mx-auto flex flex-col items-center justify-center text-center',
              'bg-slate-900/90 border-2 rounded-3xl p-5 sm:p-7 shadow-2xl backdrop-blur-xl transition-all duration-500',
              animando ? 'animate-fade-in-up scale-100' : 'opacity-0 scale-95',
              corCfg ? `${corCfg.borda} ${corCfg.glow}` : 'border-sky-500/40 shadow-sky-500/10'
            )}
          >
            {/* Badges Superiores */}
            <div className="flex flex-wrap items-center justify-center gap-2 mb-4 shrink-0">
              {tipoAtual && (
                <span className={cn('px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border shadow-sm', tipoAtual.bgBadge)}>
                  ● {tipoAtual.nomeCurto}
                </span>
              )}

              <span className={cn(
                'px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border',
                etapaAtual === 'TRIAGEM'
                  ? 'bg-cyan-950/60 text-cyan-300 border-cyan-500/40'
                  : 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
              )}>
                {etapaAtual === 'TRIAGEM' ? 'Chamada para Triagem' : 'Chamada para Consultório'}
              </span>

              {corCfg && (
                <span className={cn('px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border', corCfg.badgeBg)}>
                  ◉ {corCfg.label}
                </span>
              )}
            </div>

            {/* Bloco da Senha */}
            <div className="flex flex-col items-center justify-center my-1 w-full">
              <span className="text-[11px] sm:text-xs uppercase tracking-[0.25em] text-slate-400 font-bold mb-1">
                SENHA DE ATENDIMENTO
              </span>
              <div
                className="font-mono font-black text-white tracking-tight leading-none drop-shadow-[0_8px_20px_rgba(255,255,255,0.15)] my-1"
                style={{ fontSize: exibirMidia ? 'clamp(2.8rem, 5.5vw, 4.8rem)' : 'clamp(3.8rem, 8vw, 6.5rem)' }}
              >
                {senhaAtual}
              </div>
            </div>

            {/* Nome do Paciente */}
            <div className="w-full my-2 px-2">
              <h1
                className="font-extrabold text-slate-100 uppercase tracking-tight line-clamp-1 leading-snug"
                style={{ fontSize: exibirMidia ? 'clamp(1.25rem, 2.2vw, 1.9rem)' : 'clamp(1.5rem, 3vw, 2.5rem)' }}
                title={chamadaAtual.nomePaciente}
              >
                {chamadaAtual.nomePaciente}
              </h1>
            </div>

            {/* Caixa de Destino (Sala / Consultório) */}
            <div className="w-full max-w-lg mt-3 flex flex-col items-center justify-center py-3 px-4 bg-gradient-to-r from-sky-950/80 via-sky-900/60 to-sky-950/80 border border-sky-500/30 rounded-2xl shadow-inner">
              <span className="text-sky-300 text-[10px] sm:text-xs font-extrabold uppercase tracking-widest mb-0.5">
                Dirija-se à
              </span>
              <span
                className="font-black text-white uppercase tracking-wide text-center line-clamp-1"
                style={{ fontSize: exibirMidia ? 'clamp(1.15rem, 2vw, 1.75rem)' : 'clamp(1.4rem, 2.6vw, 2.2rem)' }}
              >
                {chamadaAtual.salaDestino}
              </span>
            </div>

            {/* Protocolo */}
            <p className="font-mono text-[10px] sm:text-xs text-slate-500 mt-3">
              Atendimento: <span className="text-slate-400 font-semibold">{chamadaAtual.numeroAtendimento}</span>
            </p>
          </div>
        ) : (
          <div className="text-center text-slate-500 relative z-10 py-8">
            <Activity className="h-12 w-12 mx-auto mb-3 opacity-30 animate-pulse text-sky-400" />
            <p className="text-lg font-bold text-slate-300">Aguardando chamadas...</p>
            <p className="text-xs mt-1 text-slate-500">As novas senhas aparecerão automaticamente na tela</p>
          </div>
        )}
      </div>

      {/* 2. Seção: Próximos a Serem Chamados */}
      <div className="shrink-0 mt-3 pt-3 border-t border-white/10 bg-slate-900/60 rounded-2xl p-3 backdrop-blur-md">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 text-sky-400 shrink-0" />
            <span className="text-xs font-extrabold text-slate-200 uppercase tracking-wider">
              Próximos a serem chamados
            </span>
            <span className="px-2 py-0.2 rounded-full bg-white/10 text-[10px] font-bold text-slate-300">
              {proximos.length} na fila
            </span>
          </div>
          <span className="text-[10px] text-slate-400 hidden sm:inline-flex items-center gap-1 font-medium">
            Prioridade clínica e chegada <ArrowRight className="h-3 w-3" />
          </span>
        </div>

        {proximos.length === 0 ? (
          <div className="py-2 text-center text-xs text-slate-500 bg-slate-950/40 rounded-xl border border-white/5">
            Nenhum paciente aguardando chamada neste momento.
          </div>
        ) : (
          <div className={cn(
            'grid gap-2',
            exibirMidia ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-3' : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-5'
          )}>
            {proximos.slice(0, exibirMidia ? 3 : 5).map((p, idx) => {
              const cfg = p.corTriagem ? COR_CONFIG[p.corTriagem] : null;
              return (
                <div
                  key={p.id}
                  className="flex flex-col justify-between p-2 rounded-xl bg-slate-800/80 border border-white/10 hover:border-white/20 transition-all shadow-sm"
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-[9px] font-black text-sky-400 bg-sky-950/80 px-1.5 py-0.2 rounded">
                      #{idx + 1}º
                    </span>
                    {cfg ? (
                      <span className={cn('text-[8px] font-black uppercase px-1.5 py-0.2 rounded border truncate max-w-[85px]', cfg.badgeBg)}>
                        {cfg.label.split(' ')[0]}
                      </span>
                    ) : (
                      <span className={cn('text-[8px] font-black uppercase px-1.5 py-0.2 rounded border truncate max-w-[85px]', p.tipoAtendimento?.bgBadge ?? 'bg-slate-700/50 text-slate-300 border-white/10')}>
                        {p.tipoAtendimento?.nomeCurto ?? p.etapa}
                      </span>
                    )}
                  </div>

                  <div className="flex items-baseline justify-between gap-1 my-0.5">
                    <span className="font-mono font-black text-xs sm:text-sm text-sky-300">
                      {p.senha}
                    </span>
                    <span className="text-[9px] text-slate-400 font-medium">
                      {p.etapa === 'TRIAGEM' ? 'Triagem' : 'Médico'}
                    </span>
                  </div>

                  <p className="text-[11px] font-bold text-white truncate" title={p.nomePaciente}>
                    {p.nomePaciente}
                  </p>

                  <div className="flex items-center justify-between text-[9px] text-slate-400 mt-1 pt-1 border-t border-white/5">
                    <span className="font-mono text-slate-500 truncate">{p.numeroAtendimento}</span>
                    <span className="shrink-0 text-slate-400 font-medium">{p.tempoEsperaMinutos}min</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Seção: Últimas Chamadas Realizadas */}
      {historico.length > 1 && (
        <div className="shrink-0 mt-2.5 pt-2 border-t border-white/10">
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1.5">
            Últimas chamadas realizadas
          </p>
          <div className={cn(
            'grid gap-2',
            exibirMidia ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-4'
          )}>
            {historico.slice(1, exibirMidia ? 3 : 5).map((c, idx) => {
              const cfg = c.corTriagem ? COR_CONFIG[c.corTriagem] : null;
              const senhaCard = c.senha ?? resolverSenhaETipo({ numeroAtendimento: c.numeroAtendimento }).senha;
              const opacidade = [0.9, 0.7, 0.5, 0.4][idx] ?? 0.4;
              return (
                <div
                  key={c.id}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-900/90 border border-white/10 overflow-hidden"
                  style={{ opacity: opacidade }}
                >
                  <div className={cn('w-1.5 self-stretch rounded-full shrink-0', cfg ? cfg.borda.replace('border-', 'bg-') : 'bg-sky-500')} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-black text-xs text-sky-400 shrink-0">{senhaCard}</span>
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
    <div className="h-screen flex flex-col overflow-hidden relative bg-slate-950 text-white font-sans select-none">
      {montado && <audio ref={audioRef} src="/sons/chamada-painel.mp3" preload="auto" />}

      {/* Modal de Desbloqueio de Áudio */}
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
            Toque na tela para ativar o áudio do painel
          </p>
          <p className="text-slate-300 text-sm max-w-md leading-relaxed">
            Permite o anúncio sonoro e a vocalização das senhas chamadas em tempo real.
          </p>
          <span className="mt-2 px-6 py-2.5 rounded-xl bg-sky-600 text-white font-bold text-sm shadow-lg shadow-sky-600/30 hover:bg-sky-500 transition-colors">
            Ativar Som do Painel
          </span>
        </button>
      )}

      {/* Barra de Topo */}
      <div className="flex items-center justify-between px-4 sm:px-8 py-3 border-b border-white/10 bg-slate-900/90 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-3">
          {instituicao?.logomarcaUrl ? (
            <img src={instituicao.logomarcaUrl} alt="Logo" className="h-8 object-contain rounded bg-white/10 p-1" />
          ) : (
            <div className="p-1.5 bg-gradient-to-tr from-sky-600 to-primary rounded-xl shadow-md shadow-primary/30">
              <Activity className="h-4 w-4 text-white" />
            </div>
          )}
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold leading-none">
              {instituicao?.nomeInstituicao ?? 'SGH - HOSPITAL'}
            </p>
            <p className="text-sm sm:text-base font-black text-white leading-none mt-1">Painel de Chamadas</p>
          </div>
          {setor !== 'GERAL' && (
            <span className="px-2 py-0.5 bg-primary/20 text-primary border border-primary/30 rounded-full text-[10px] font-bold ml-2">
              {setor}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 sm:gap-4 justify-end">
          <p className="text-xl sm:text-2xl font-mono font-black text-white tabular-nums tracking-tight" suppressHydrationWarning>
            {agora ? format(agora, 'HH:mm:ss') : '--:--:--'}
          </p>
          <p className="text-xs text-slate-400 capitalize hidden md:inline-block font-medium" suppressHydrationWarning>
            {agora ? format(agora, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : ''}
          </p>

          <div className={cn('flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold', conectado ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30' : 'bg-red-950/60 text-red-400 border border-red-500/30')}>
            {conectado ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            {conectado ? 'Online' : 'Offline'}
          </div>

          <button
            type="button"
            onClick={() => setSomAtivo((s) => !s)}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-slate-300"
            aria-label={somAtivo ? 'Silenciar' : 'Ativar som'}
          >
            {somAtivo ? <Volume2 className="h-4 w-4 text-sky-400" /> : <VolumeX className="h-4 w-4 text-red-400" />}
          </button>
        </div>
      </div>

      {/* Área de Conteúdo Principal */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {exibirMidia && midiaEsquerda && (
          <div className="w-1/2 shrink-0 border-r border-white/10 h-full">{areaMidia}</div>
        )}
        <div className={cn('h-full min-h-0', exibirMidia ? 'w-1/2' : 'w-full')}>
          {areaChamadas}
        </div>
        {exibirMidia && !midiaEsquerda && (
          <div className="w-1/2 shrink-0 border-l border-white/10 h-full">{areaMidia}</div>
        )}
      </div>

      {/* Rodapé Institucional */}
      <div className="shrink-0 bg-slate-950 py-1 text-center border-t border-white/5">
        <p className="text-[10px] text-slate-500 font-medium">
          Desenvolvido por PAJO Tecnologia · pajotech.com.br
        </p>
      </div>
    </div>
  );
}
