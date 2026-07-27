// components/shared/Sidebar.tsx
// Sidebar responsiva: drawer no mobile, recolhível no desktop (persistência em localStorage)

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import {
  Activity,
  Users,
  ClipboardList,
  Monitor,
  Stethoscope,
  FileText,
  ClipboardCheck,
  BarChart3,
  Settings,
  LogOut,
  Pill,
  Shield,
  ChevronsLeft,
  ChevronsRight,
  LayoutDashboard,
  NotebookTabs,
  UserPlus,
  NotebookPen,
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import type { Role, UsuarioSessao } from '@/types';
import { cn } from '@/lib/utils';
import { useDashboardNav } from '@/components/shared/dashboard-nav-context';

interface ItemNav {
  label: string;
  href: string;
  icon: React.ElementType;
  roles?: Role[];
  badge?: string;
}

const ROLES_PRONTUARIO: Role[] = [
  'ADMIN',
  'MEDICO',
  'DIRETOR_CLINICO',
  'ENFERMEIRO',
  'TECNICO_ENFERMAGEM',
  'RECEPCIONISTA',
];

const ITENS_NAVEGACAO: ItemNav[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Recepção',
    href: '/recepcao',
    icon: Users,
    roles: ['ADMIN', 'RECEPCIONISTA'],
  },
  {
    label: 'Triagem',
    href: '/triagem',
    icon: ClipboardList,
    roles: ['ADMIN', 'ENFERMEIRO'],
  },
  {
    label: 'Atendimento Médico',
    href: '/atendimento',
    icon: Stethoscope,
    roles: ['ADMIN', 'MEDICO', 'DIRETOR_CLINICO'],
  },
  {
    label: 'Medicação (PS)',
    href: '/medicacao',
    icon: Pill,
    roles: ['ADMIN', 'ENFERMEIRO', 'TECNICO_ENFERMAGEM'],
  },
  {
    label: 'Admissões',
    href: '/internamento/admissoes',
    icon: UserPlus,
    roles: ['ADMIN', 'ENFERMEIRO', 'TECNICO_ENFERMAGEM', 'RECEPCIONISTA'],
  },
  {
    label: 'Prontuário Médico',
    href: '/prontuario',
    icon: FileText,
    roles: ROLES_PRONTUARIO,
  },
  {
    label: 'Prontuário Enfermagem',
    href: '/evolucoes',
    icon: NotebookPen,
    roles: ROLES_PRONTUARIO,
  },
  {
    label: 'Farmácia',
    href: '/farmacia',
    icon: ClipboardCheck,
    roles: ['ADMIN', 'FARMACEUTICO'],
  },
  {
    label: 'Auditoria',
    href: '/auditoria',
    icon: Shield,
    roles: ['ADMIN'],
  },
  {
    label: 'Painel de Chamada',
    href: '/painel',
    icon: Monitor,
    roles: ['ADMIN', 'ENFERMEIRO', 'MEDICO'],
  },
  {
    label: 'Relatórios',
    href: '/relatorios',
    icon: BarChart3,
    roles: ['ADMIN', 'DIRETOR_CLINICO'],
  },
  {
    label: 'Cadastros',
    href: '/cadastros/leitos',
    icon: NotebookTabs,
    roles: ['ADMIN'],
  },
  {
    label: 'Configurações',
    href: '/configuracoes',
    icon: Settings,
    roles: ['ADMIN'],
  },
];

interface SidebarProps {
  usuario: UsuarioSessao;
}

export function Sidebar({ usuario }: SidebarProps) {
  const pathname = usePathname();
  const { mobileOpen, setMobileOpen, desktopCollapsed, toggleDesktopCollapsed } = useDashboardNav();

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname, setMobileOpen]);

  const itensVisiveis = ITENS_NAVEGACAO.filter(
    (item) => !item.roles || item.roles.includes(usuario.role)
  );

  const labelRole: Record<Role, string> = {
    ADMIN: 'Administrador',
    MEDICO: 'Médico',
    ENFERMEIRO: 'Enfermeiro',
    TECNICO_ENFERMAGEM: 'Téc. Enfermagem',
    RECEPCIONISTA: 'Recepcionista',
    DIRETOR_CLINICO: 'Diretor Clínico',
    FARMACEUTICO: 'Farmacêutico',
  };

  const collapsed = desktopCollapsed;

  return (
    <>
      {mobileOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[1px] md:hidden no-print"
          aria-label="Fechar menu"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <aside
        className={cn(
          'no-print flex flex-col h-dvh max-h-screen bg-slate-900 text-slate-100 shrink-0 z-50',
          'border-r border-slate-800/80 shadow-xl md:shadow-none',
          'fixed left-0 top-0 w-[min(18rem,100vw-3rem)] transition-transform duration-200 ease-out md:static md:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
          collapsed ? 'md:w-[4.25rem] md:min-w-[4.25rem]' : 'md:w-64 md:min-w-[4.25rem]'
        )}
        aria-label="Navegação principal"
      >
        <div
          className={cn(
            'flex items-center gap-3 border-b border-slate-700/50 shrink-0',
            collapsed ? 'md:px-2 md:py-4 md:justify-center' : 'px-4 py-4 sm:px-5 sm:py-5'
          )}
        >
          <div className="p-2 bg-primary rounded-lg shrink-0">
            <Activity className="h-5 w-5 text-white" />
          </div>
          <div className={cn('min-w-0 flex-1 md:overflow-hidden', collapsed && 'md:hidden')}>
            <p className="text-xs text-slate-400 uppercase tracking-widest leading-none mb-0.5">
              Sistema
            </p>
            <p className="text-[10px] font-bold text-white leading-tight truncate">SGH Hospitalar</p>
          </div>
          <button
            type="button"
            className="md:hidden p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white"
            aria-label="Fechar menu"
            onClick={() => setMobileOpen(false)}
          >
            <ChevronsLeft className="h-5 w-5" />
          </button>
        </div>

        <div
          className={cn(
            'mx-3 mt-3 bg-slate-800/60 rounded-xl border border-slate-700/50 shrink-0',
            collapsed ? 'md:mx-2 md:mt-3 md:p-2 md:flex md:justify-center' : 'px-3 py-3'
          )}
        >
          <div className={cn('flex items-center gap-2.5', collapsed && 'md:justify-center')}>
            <div className="w-9 h-9 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center shrink-0">
              <span className="text-primary text-sm font-bold">
                {usuario.nome.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className={cn('min-w-0 flex-1 md:overflow-hidden', collapsed && 'md:hidden')}>
              <p className="text-xs font-semibold text-white truncate leading-tight">
                {usuario.nome.split(' ')[0]}
              </p>
              <p className="text-xs text-slate-400 truncate">
                {labelRole[usuario.role]}
                {usuario.crm ? ` • CRM ${usuario.crm}` : ''}
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-2 py-3 sm:px-3 space-y-0.5 overflow-y-auto overscroll-contain" role="navigation">
          <p
            className={cn(
              'px-2 text-[10px] text-slate-500 uppercase tracking-widest font-semibold mb-2',
              collapsed && 'md:sr-only'
            )}
          >
            Módulos
          </p>
          {itensVisiveis.map((item) => {
            const ativoAdmissoes =
              item.href === '/internamento/admissoes' &&
              (pathname === '/internamento/admissoes' ||
                pathname.startsWith('/internamento/admitir'))
            const ativoCadastros =
              item.href === '/cadastros/leitos' && pathname.startsWith('/cadastros')
            const Icone = item.icon
            const ativo =
              ativoAdmissoes ||
              ativoCadastros ||
              pathname === item.href ||
              pathname.startsWith(`${item.href}/`)

            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={cn(
                  'flex items-center gap-2.5 rounded-lg text-xs font-medium transition-all duration-150 py-2 px-2.5',
                  collapsed && 'md:justify-center md:px-2',
                  ativo
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                )}
                aria-current={ativo ? 'page' : undefined}
              >
                <Icone className="h-4 w-4 shrink-0" aria-hidden />
                <span className={cn('truncate', collapsed && 'md:sr-only')}>{item.label}</span>
                {item.badge ? (
                  <span
                    className={cn(
                      'ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full',
                      collapsed && 'md:sr-only'
                    )}
                  >
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            )
          })}
        </nav>

        <div className="px-2 pb-2 border-t border-slate-700/50 pt-2 shrink-0 space-y-1">
          <button
            type="button"
            onClick={toggleDesktopCollapsed}
            className={cn(
              'hidden md:flex items-center gap-2.5 w-full px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors',
              collapsed && 'justify-center px-0'
            )}
            aria-expanded={!collapsed}
            aria-label={collapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
            title={collapsed ? 'Expandir menu' : 'Recolher menu'}
          >
            {collapsed ? (
              <ChevronsRight className="h-4 w-4 shrink-0" />
            ) : (
              <>
                <ChevronsLeft className="h-4 w-4 shrink-0" />
                <span className="truncate">Recolher menu</span>
              </>
            )}
          </button>

          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className={cn(
              'flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors',
              collapsed && 'md:justify-center md:px-0'
            )}
            aria-label="Sair do sistema"
            title={collapsed ? 'Sair do sistema' : undefined}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span className={cn(collapsed && 'md:sr-only')}>Sair do sistema</span>
          </button>
        </div>
      </aside>
    </>
  );
}
