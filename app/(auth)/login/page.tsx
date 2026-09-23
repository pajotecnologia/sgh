// app/(auth)/login/page.tsx
// Página de login moderna, fluida e leve com branding PAJO Tecnologia no rodapé

import type { Metadata } from 'next';
import { FormularioLogin } from '@/components/auth/FormularioLogin';
import { LogoPajo } from '@/components/shared/LogoPajo';
import {
  Activity,
  ShieldCheck,
  HeartPulse,
  BedDouble,
  Sparkles,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Acesso ao Sistema — SGH',
  description: 'Sistema de Gestão Hospitalar e Prontuário Eletrônico',
};

export default function PaginaLogin() {
  return (
    <div className="min-h-screen grid lg:grid-cols-12 bg-background select-none">
      {/* Painel esquerdo (Hero/Branding) — 7 colunas no desktop */}
      <div className="hidden lg:flex lg:col-span-7 flex-col justify-between p-12 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white relative overflow-hidden">
        {/* Glows e geometrias de fundo */}
        <div className="absolute top-[-10%] left-[-10%] w-[450px] h-[450px] bg-primary/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

        {/* Topo do painel esquerdo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center text-primary-foreground backdrop-blur-md shadow-inner">
            <HeartPulse className="h-5 w-5 text-primary" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-primary/80 block">
              Plataforma Clínica
            </span>
            <span className="text-base font-bold tracking-tight text-white">
              SGH — Sistema de Gestão Hospitalar
            </span>
          </div>
        </div>

        {/* Centro: Tagline e Proposta de Valor */}
        <div className="relative z-10 my-auto py-12 max-w-xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs text-white/90 backdrop-blur-sm shadow-xs">
            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            <span>Ciclo Clínico Completo & Prontuário Longitudinal</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white leading-[1.15] text-balance">
            Cuidado humanizado, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-indigo-200 to-teal-200">
              precisão operacional.
            </span>
          </h1>

          <p className="text-white/75 text-base sm:text-lg leading-relaxed max-w-lg">
            Da recepção e triagem Manchester ao mapa de leitos, administração segura de medicamentos e faturamento hospitalar.
          </p>

          {/* Cards de Destaque */}
          <div className="grid grid-cols-3 gap-3 pt-4">
            <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 backdrop-blur-md">
              <Activity className="h-5 w-5 text-emerald-400 mb-1.5" />
              <p className="text-white text-xs font-semibold">Manchester</p>
              <p className="text-white/60 text-[11px] leading-tight">Classificação de risco em tempo real</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 backdrop-blur-md">
              <BedDouble className="h-5 w-5 text-blue-400 mb-1.5" />
              <p className="text-white text-xs font-semibold">Mapa de Leitos</p>
              <p className="text-white/60 text-[11px] leading-tight">Ocupação e transferências ágeis</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 backdrop-blur-md">
              <ShieldCheck className="h-5 w-5 text-indigo-400 mb-1.5" />
              <p className="text-white text-xs font-semibold">Segurança Total</p>
              <p className="text-white/60 text-[11px] leading-tight">MFA, AES-256 e LGPD</p>
            </div>
          </div>
        </div>

        {/* Rodapé esquerdo informativo */}
        <div className="relative z-10 text-xs text-white/50 border-t border-white/10 pt-4 flex items-center justify-between">
          <span>Ambiente Hospitalar Seguro • Criptografia de Ponta a Ponta</span>
          <span>Versão 2.5</span>
        </div>
      </div>

      {/* Painel direito (Formulário) — 5 colunas no desktop */}
      <div className="lg:col-span-5 flex flex-col justify-between p-6 sm:p-10 lg:p-12 bg-card relative">
        {/* Tag de Controle de Versão — discreto no canto superior direito */}
        <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted/50 hover:bg-muted border border-border/60 text-[10px] font-mono text-muted-foreground transition-colors shadow-2xs select-none" title="Versão do Sistema SGH">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>v2.5.0</span>
          <span className="text-muted-foreground/40">•</span>
          <span className="text-[9px] text-muted-foreground/70">build 26.09</span>
        </div>

        {/* Topo Mobile (oculto no desktop) */}
        <div className="lg:hidden flex items-center justify-between pb-6 border-b border-border/60">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <HeartPulse className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-foreground">SGH</span>
              <span className="text-[10px] text-muted-foreground block">Gestão Hospitalar</span>
            </div>
          </div>
        </div>

        {/* Container Central do Formulário */}
        <div className="my-auto py-6 max-w-[380px] w-full mx-auto space-y-6">
          <div className="space-y-1.5">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Acesso ao Sistema
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Insira suas credenciais institucionais para entrar.
            </p>
          </div>

          <FormularioLogin />
        </div>

        {/* Rodapé Alinhado à Esquerda com a Logomarca PAJO Tecnologia e Versão */}
        <div className="pt-6 border-t border-border/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <LogoPajo className="h-6 w-auto opacity-75 hover:opacity-100 transition-opacity" width={110} height={26} />
          </div>
          <div className="text-[11px] text-muted-foreground text-left sm:text-right flex items-center gap-2">
            <span>Sessão segura com expiração automática</span>
            <span className="text-muted-foreground/40">•</span>
            <span className="font-mono text-[10px] text-muted-foreground/80">v2.5.0</span>
          </div>
        </div>
      </div>
    </div>
  );
}
