// components/shared/Sidebar.tsx
// Sidebar responsiva: drawer no mobile, recolhível no desktop com suporte a sub-menus expansíveis (Cadastros e Relatórios)

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
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
  ChevronDown,
  ChevronRight,
  Building2,
  BedDouble,
  Package,
  Truck,
  Tags,
  Calendar,
  Navigation,
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import type { Role, UsuarioSessao } from '@/types';
import { cn } from '@/lib/utils';
import { useDashboardNav } from '@/components/shared/dashboard-nav-context';

interface SubItemNav {
  label: string;
  href: string;
  icon: React.ElementType;
  roles?: Role[];
}

interface ItemNav {
  label: string;
  href: string;
  icon: React.ElementType;
  roles?: Role[];
  badge?: string;
  children?: SubItemNav[];
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
    label: 'Cadastros',
    href: '/cadastros/clinicas',
    icon: NotebookTabs,
    roles: ['ADMIN', 'FARMACEUTICO', 'DIRETOR_CLINICO'],
    children: [
      { label: 'Clínicas', href: '/cadastros/clinicas', icon: Building2 },
      { label: 'Leitos', href: '/cadastros/leitos', icon: BedDouble },
      { label: 'Prescrições Médicas', href: '/cadastros/prescricoes-medicas', icon: ClipboardList },
      { label: 'Profissionais / Usuários', href: '/cadastros/profissionais', icon: Users },
      { label: 'Medicamentos e Materiais', href: '/cadastros/medicamentos', icon: Package },
      { label: 'Fornecedores', href: '/cadastros/fornecedores', icon: Truck },
      { label: 'Sinônimos (Farmácia)', href: '/cadastros/sinonimos', icon: Tags },
    ],
  },
  {
    label: 'Relatórios',
    href: '/relatorios/atendimentos',
    icon: BarChart3,
    roles: ['ADMIN', 'DIRETOR_CLINICO', 'FARMACEUTICO'],
    children: [
      { label: 'Atendimentos', href: '/relatorios/atendimentos', icon: Calendar },
      { label: 'Pacientes', href: '/relatorios/pacientes', icon: Users },
      { label: 'Profissionais / Usuários', href: '/relatorios/profissionais', icon: Stethoscope },
      { label: 'Clínicas', href: '/relatorios/clinicas', icon: Building2 },
      { label: 'Leitos', href: '/relatorios/leitos', icon: BedDouble },
      { label: 'Medicamentos', href: '/relatorios/medicamentos', icon: Package },
      { label: 'Fornecedores', href: '/relatorios/fornecedores', icon: Truck },
      { label: 'Prescrições Padrão', href: '/relatorios/prescricoes-padrao', icon: ClipboardList },
      { label: 'Origens de Pacientes', href: '/relatorios/origens', icon: Navigation },
      { label: 'Sinônimos (Farmácia)', href: '/relatorios/sinonimos', icon: Tags },
    ],
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

  // Controle de menus expandidos no sidebar
  const [expandidos, setExpandidos] = useState<Record<string, boolean>>({
    Cadastros: pathname.startsWith('/cadastros'),
    Relatórios: pathname.startsWith('/relatorios'),
  });

  useEffect(() => {
    setMobileOpen(false);
    // Auto-expande o menu ativo ao navegar
    if (pathname.startsWith('/cadastros')) {
      setExpandidos((p) => ({ ...p, Cadastros: true }));
    }
    if (pathname.startsWith('/relatorios')) {
      setExpandidos((p) => ({ ...p, Relatórios: true }));
    }
  }, [pathname, setMobileOpen]);

  const toggleExpandido = (label: string) => {
    setExpandidos((p) => ({ ...p, [label]: !p[label] }));
  };

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

        <nav className="flex-1 px-2 py-3 sm:px-3 space-y-1 overflow-y-auto overscroll-contain" role="navigation">
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
            
            const eCadastros = item.label === 'Cadastros'
            const eRelatorios = item.label === 'Relatórios'
            
            const ativo =
              ativoAdmissoes ||
              (eCadastros && pathname.startsWith('/cadastros')) ||
              (eRelatorios && pathname.startsWith('/relatorios')) ||
              pathname === item.href ||
              pathname.startsWith(`${item.href}/`)

            const temFilhos = item.children && item.children.length > 0;
            const estaExpandido = Boolean(expandidos[item.label]);

            if (temFilhos) {
              return (
                <div key={item.label} className="space-y-0.5">
                  <div className="flex items-center">
                    <Link
                      href={item.children![0].href}
                      title={collapsed ? item.label : undefined}
                      className={cn(
                        'flex-1 flex items-center gap-2.5 rounded-lg text-xs font-medium transition-all duration-150 py-2 px-2.5',
                        collapsed && 'md:justify-center md:px-2',
                        ativo
                          ? 'bg-primary/20 text-white font-bold border border-primary/30'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      )}
                    >
                      <item.icon className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                      <span className={cn('truncate', collapsed && 'md:sr-only')}>{item.label}</span>
                    </Link>

                    {!collapsed && (
                      <button
                        type="button"
                        onClick={() => toggleExpandido(item.label)}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors ml-0.5"
                        title={estaExpandido ? 'Recolher sub-menu' : 'Expandir sub-menu'}
                      >
                        {estaExpandido ? (
                          <ChevronDown className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5" />
                        )}
                      </button>
                    )}
                  </div>

                  {/* Sub-itens expansíveis */}
                  {!collapsed && estaExpandido && (
                    <div className="pl-4 pr-1 py-1 space-y-0.5 border-l-2 border-primary/30 ml-3">
                      {item.children!.map((sub) => {
                        const subAtivo = pathname === sub.href || pathname.startsWith(`${sub.href}/`);
                        const SubIcone = sub.icon;

                        return (
                          <Link
                            key={sub.href}
                            href={sub.href}
                            className={cn(
                              'flex items-center gap-2 rounded-lg text-[11px] font-medium transition-all py-1.5 px-2.5',
                              subAtivo
                                ? 'bg-primary text-white font-bold shadow-xs'
                                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                            )}
                          >
                            <SubIcone className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{sub.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            const Icone = item.icon;
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
            );
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
