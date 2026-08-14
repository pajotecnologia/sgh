// components/shared/Header.tsx
// Header do dashboard com breadcrumb, notificações e info do usuário

'use client';

import { useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { Bell, HelpCircle, Menu } from 'lucide-react';
import type { UsuarioSessao } from '@/types';
import { useDashboardNav } from '@/components/shared/dashboard-nav-context';
import { SeletorTema } from '@/components/shared/SeletorTema';
import { labelAbaInternacao, parseAbaInternacao } from '@/lib/internacao-abas';
import { ModalManualSistema } from '@/components/shared/ModalManualSistema';

const TITULOS_ROTA: Record<string, string> = {
  '/recepcao': 'Recepção',
  '/recepcao/novo': 'Novo Paciente',
  '/triagem': 'Triagem',
  '/medicacao': 'Medicação (PS)',
  '/internamento/admissoes': 'Admissões — Enfermagem',
  '/internamento/admitir': 'Receber paciente',
  '/evolucoes': 'Prontuário Enfermagem',
  '/prontuario': 'Prontuário Médico',
  '/farmacia': 'Farmácia',
  '/painel': 'Painel de Chamada',
  '/atendimento': 'Atendimento Médico',
  '/relatorios': 'Relatórios',
  '/configuracoes': 'Configurações',
  '/auditoria': 'Auditoria',
  '/admin': 'Administração',
  '/dashboard': 'Visão Geral',
};

interface HeaderProps {
  usuario: UsuarioSessao;
}

export function Header({ usuario }: HeaderProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { mobileOpen, setMobileOpen } = useDashboardNav();
  const [manualAberto, setManualAberto] = useState(false);

  const abaEvolucoes = pathname.startsWith('/evolucoes')
    ? labelAbaInternacao(parseAbaInternacao(searchParams.get('aba')))
    : null;

  const titulo =
    abaEvolucoes ??
    Object.entries(TITULOS_ROTA).find(([rota]) => pathname.startsWith(rota))?.[1] ??
    'Dashboard';

  return (
    <>
      <header className="min-h-14 h-14 border-b border-border bg-background/80 backdrop-blur-sm flex items-center gap-2 sm:gap-4 shrink-0 z-10 px-3 sm:px-6 no-print">
        <button
          type="button"
          className="md:hidden p-2 rounded-md hover:bg-muted transition-colors shrink-0 -ml-0.5"
          aria-label="Abrir menu"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-semibold text-foreground truncate">{titulo}</h1>
        </div>

        {/* Ações do header */}
        <div className="flex items-center gap-2">
          {/* Botão de Ajuda / Manual do Sistema */}
          <button
            type="button"
            className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-xs font-medium"
            aria-label="Manual e Ajuda do Sistema"
            title="Manual e Ajuda do Sistema"
            onClick={() => setManualAberto(true)}
            id="btn-ajuda-sistema"
          >
            <HelpCircle className="h-4.5 w-4.5 text-primary" />
            <span className="hidden lg:inline">Ajuda</span>
          </button>

          <SeletorTema compacto />

          {/* Botão de notificações */}
          <button
            className="relative p-2 rounded-lg hover:bg-muted transition-colors"
            aria-label="Notificações"
            id="btn-notificacoes"
          >
            <Bell className="h-4.5 w-4.5 text-muted-foreground" />
            {/* Badge de notificação não lida */}
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          </button>

          {/* Avatar do usuário */}
          <div className="flex items-center gap-2.5 pl-2 border-l border-border">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-foreground leading-tight">
                {usuario.nome.split(' ')[0]}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {usuario.email}
              </p>
            </div>
            <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
              <span className="text-primary text-xs font-bold">
                {usuario.nome.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Modal do Manual Completo do Sistema */}
      <ModalManualSistema open={manualAberto} onOpenChange={setManualAberto} />
    </>
  );
}

