// app/(auth)/login/page.tsx
// Página de login — design premium com gradiente hospitalar

import type { Metadata } from 'next';
import { FormularioLogin } from '@/components/auth/FormularioLogin';
import { Activity, Shield, Clock } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Acesso ao Sistema',
};

export default function PaginaLogin() {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Painel esquerdo — visual/branding */}
      <div className="hidden lg:flex flex-col gradient-hospitalar p-12 text-white relative overflow-hidden">
        {/* Elementos decorativos de fundo */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 rounded-full border border-white/30" />
          <div className="absolute top-40 left-40 w-40 h-40 rounded-full border border-white/20" />
          <div className="absolute bottom-32 right-16 w-96 h-96 rounded-full border border-white/10" />
        </div>

        {/* Logo e nome do sistema */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm">
            <Activity className="h-7 w-7 text-white" />
          </div>
          <div>
            <p className="text-sm font-medium text-white/70 uppercase tracking-widest">
              Sistema de Gestão
            </p>
            <h1 className="text-xl font-bold text-white">
              Hospitalar — SGH
            </h1>
          </div>
        </div>

        {/* Tagline */}
        <div className="relative z-10 flex-1 flex flex-col justify-center">
          <h2 className="text-4xl font-bold leading-tight text-balance mb-6">
            Cuidado inteligente,
            <br />
            gestão eficiente.
          </h2>
          <p className="text-white/80 text-lg leading-relaxed max-w-md">
            Plataforma integrada de gerenciamento hospitalar com triagem Manchester,
            prontuário eletrônico e atendimento em tempo real.
          </p>
        </div>

        {/* Features */}
        <div className="relative z-10 grid grid-cols-3 gap-4">
          {[
            { icon: Shield, label: 'LGPD Compliant', desc: 'Dados criptografados' },
            { icon: Activity, label: 'Tempo Real', desc: 'Fila em tempo real' },
            { icon: Clock, label: 'Triagem', desc: 'Protocolo Manchester' },
          ].map(({ icon: Icon, label, desc }) => (
            <div key={label} className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
              <Icon className="h-5 w-5 text-white/80 mb-2" />
              <p className="text-white text-sm font-semibold">{label}</p>
              <p className="text-white/60 text-xs">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Painel direito — formulário de login */}
      <div className="flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-[400px] space-y-8">
          {/* Logo mobile */}
          <div className="lg:hidden flex items-center gap-3 justify-center">
            <div className="p-2.5 bg-primary rounded-xl">
              <Activity className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold">SGH</span>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight">
              Acesso ao sistema
            </h2>
            <p className="text-muted-foreground text-sm">
              Use suas credenciais institucionais para entrar.
            </p>
          </div>

          <FormularioLogin />

          <p className="text-center text-xs text-muted-foreground">
            Sistema de uso restrito a profissionais autorizados.
            <br />
            Sessão expira após 8 horas de inatividade.
          </p>
        </div>
      </div>
    </div>
  );
}
