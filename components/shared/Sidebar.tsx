// components/shared/Sidebar.tsx
// Sidebar hospitalar moderna, modular e responsiva com agrupamento por setores clínicos e operacionais

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
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
  ShieldCheck,
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
  UserCircle,
  HelpCircle,
  Sparkles,
  Syringe,
  SunMoon,
  UserCheck,
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import type { Role, UsuarioSessao } from '@/types';
import { cn } from '@/lib/utils';
import { useDashboardNav } from '@/components/shared/dashboard-nav-context';
import { VERSAO_SGH, BUILD_SGH } from '@/lib/versao';

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

interface GrupoNav {
  titulo: string;
  itens: ItemNav[];
}

const ROLES_PRONTUARIO: Role[] = [
  'ADMIN',
  'MEDICO',
  'DIRETOR_CLINICO',
  'ENFERMEIRO',
  'TECNICO_ENFERMAGEM',
  'RECEPCIONISTA',
];

const ROLES_RELATORIOS: Role[] = [
  'ADMIN',
  'DIRETOR_CLINICO',
  'MEDICO',
  'ENFERMEIRO',
  'TECNICO_ENFERMAGEM',
  'FARMACEUTICO',
  'RECEPCIONISTA',
];

const GRUPOS_NAVEGACAO: GrupoNav[] = [
  {
    titulo: 'ATENDIMENTO & CLÍNICA',
    itens: [
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
        label: 'Triagem (Manchester)',
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
        label: 'Mapa de Leitos',
        href: '/internamento/mapa-leitos',
        icon: BedDouble,
        roles: ['ADMIN', 'MEDICO', 'DIRETOR_CLINICO', 'ENFERMEIRO', 'TECNICO_ENFERMAGEM', 'RECEPCIONISTA', 'FARMACEUTICO'],
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
    ],
  },
  {
    titulo: 'FARMÁCIA & SUPRIMENTOS',
    itens: [
      {
        label: 'Farmácia & Dispensação',
        href: '/farmacia',
        icon: ClipboardCheck,
        roles: ['ADMIN', 'FARMACEUTICO'],
      },
      {
        label: 'Entradas de NF',
        href: '/farmacia/entradas',
        icon: Package,
        roles: ['ADMIN', 'FARMACEUTICO'],
      },
      {
        label: 'Saídas de Estoque',
        href: '/farmacia/saidas',
        icon: Truck,
        roles: ['ADMIN', 'FARMACEUTICO'],
      },
    ],
  },
  {
    titulo: 'GESTÃO & CONSULTAS',
    itens: [
      {
        label: 'Painel TV (Chamada)',
        href: '/painel',
        icon: Monitor,
        roles: ['ADMIN', 'ENFERMEIRO', 'MEDICO'],
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
        label: 'Relatórios & Indicadores',
        href: '/relatorios/prontuario-medico',
        icon: BarChart3,
        roles: ROLES_RELATORIOS,
        children: [
          { label: 'Prontuário Médico', href: '/relatorios/prontuario-medico', icon: Stethoscope },
          { label: 'Prontuário Enfermagem', href: '/relatorios/prontuario-enfermagem', icon: UserCheck },
          { label: 'Internamento & Fichas', href: '/relatorios/internamento', icon: Building2 },
          { label: 'Medicamentos & Apraz.', href: '/relatorios/medicamentos-instrucoes', icon: Syringe },
          { label: 'CCIH & IRAS', href: '/relatorios/ccih', icon: Shield },
          { label: 'Sinais Vitais & Balanço', href: '/relatorios/sinais-vitais', icon: Activity },
          { label: 'Evolução Dia/Noite', href: '/relatorios/evolucao-turno', icon: SunMoon },
          { label: 'Condições de Alta', href: '/relatorios/condicoes-alta', icon: LogOut },
          { label: 'SAE Enfermagem', href: '/relatorios/sae', icon: ClipboardList },
          { label: 'Multidisciplinar', href: '/relatorios/multidisciplinar', icon: Users },
          { label: 'Laudos Médicos', href: '/relatorios/laudos-medicos', icon: FileText },
          { label: 'Atendimentos Gerais', href: '/relatorios/atendimentos', icon: Calendar },
          { label: 'Pacientes', href: '/relatorios/pacientes', icon: Users },
          { label: 'Profissionais', href: '/relatorios/profissionais', icon: Stethoscope },
          { label: 'Clínicas', href: '/relatorios/clinicas', icon: Building2 },
          { label: 'Leitos', href: '/relatorios/leitos', icon: BedDouble },
          { label: 'Medicamentos (Catálogo)', href: '/relatorios/medicamentos', icon: Package },
          { label: 'Fornecedores', href: '/relatorios/fornecedores', icon: Truck },
          { label: 'Prescrições Padrão', href: '/relatorios/prescricoes-padrao', icon: ClipboardList },
          { label: 'Origens de Pacientes', href: '/relatorios/origens', icon: Navigation },
          { label: 'Sinônimos (Farmácia)', href: '/relatorios/sinonimos', icon: Tags },
        ],
      },
    ],
  },
  {
    titulo: 'SISTEMA & SEGURANÇA',
    itens: [
      {
        label: 'Auditoria LGPD',
        href: '/auditoria',
        icon: Shield,
        roles: ['ADMIN'],
      },
      {
        label: 'Configurações',
        href: '/configuracoes',
        icon: Settings,
        roles: ['ADMIN'],
      },
    ],
  },
];

interface SidebarProps {
  usuario: UsuarioSessao;
}

export function Sidebar({ usuario }: SidebarProps) {
  const pathname = usePathname();
  const { mobileOpen, setMobileOpen, desktopCollapsed, toggleDesktopCollapsed } = useDashboardNav();

  // Controle de sub-menus expansíveis
  const [expandidos, setExpandidos] = useState<Record<string, boolean>>({
    Cadastros: pathname.startsWith('/cadastros'),
    'Relatórios & Indicadores': pathname.startsWith('/relatorios'),
  });

  useEffect(() => {
    setMobileOpen(false);
    if (pathname.startsWith('/cadastros')) {
      setExpandidos((p) => ({ ...p, Cadastros: true }));
    }
    if (pathname.startsWith('/relatorios')) {
      setExpandidos((p) => ({ ...p, 'Relatórios & Indicadores': true }));
    }
  }, [pathname, setMobileOpen]);

  const toggleExpandido = (label: string) => {
    setExpandidos((p) => ({ ...p, [label]: !p[label] }));
  };

  const gruposFiltrados = useMemo(() => {
    return GRUPOS_NAVEGACAO.map((grupo) => {
      const itensFiltrados = grupo.itens.filter((item) => {
        if (!item.roles) return true;
        return item.roles.includes(usuario.role);
      });
      return {
        ...grupo,
        itens: itensFiltrados,
      };
    }).filter((grupo) => grupo.itens.length > 0);
  }, [usuario.role]);

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
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden no-print"
          aria-label="Fechar menu"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <aside
        className={cn(
          'no-print flex flex-col h-dvh max-h-screen bg-slate-950 text-slate-100 shrink-0 z-50',
          'border-r border-slate-800/80 shadow-2xl md:shadow-none select-none',
          'fixed left-0 top-0 w-[min(18.5rem,100vw-3rem)] transition-all duration-200 ease-out md:static md:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
          collapsed ? 'md:w-[4.5rem] md:min-w-[4.5rem]' : 'md:w-68 md:min-w-[17rem]'
        )}
        aria-label="Navegação principal"
      >
        {/* Topo / Logo */}
        <div
          className={cn(
            'flex items-center gap-3 border-b border-slate-800/80 shrink-0 bg-slate-900/60 backdrop-blur-xs',
            collapsed ? 'md:px-2 md:py-3.5 md:justify-center' : 'px-4 py-3.5 sm:px-5'
          )}
        >
          <div className="p-2 bg-gradient-to-br from-primary to-blue-600 rounded-xl shadow-sm shrink-0 flex items-center justify-center">
            <Activity className="h-5 w-5 text-white" />
          </div>
          <div className={cn('min-w-0 flex-1 overflow-hidden', collapsed && 'md:hidden')}>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white tracking-wide">SGH HOSPITALAR</span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-primary/20 text-primary-foreground border border-primary/30">
                {VERSAO_SGH}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 truncate mt-0.5">Gestão de Saúde & Internação</p>
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

        {/* Lista de Navegação por Grupos */}
        <nav
          className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-4 text-xs scrollbar-thin scrollbar-thumb-slate-800"
          aria-label="Menu principal"
        >
          {gruposFiltrados.map((grupo) => (
            <div key={grupo.titulo} className="space-y-1">
              {!collapsed ? (
                <p className="px-3 py-1 text-[10px] font-bold text-slate-400/90 uppercase tracking-wider">
                  {grupo.titulo}
                </p>
              ) : (
                <div className="my-2 border-t border-slate-800/60" />
              )}

              <div className="space-y-0.5">
                {grupo.itens.map((item) => {
                  const Icon = item.icon;
                  const temFilhos = item.children && item.children.length > 0;
                  const estaAtivo =
                    pathname === item.href ||
                    (item.href !== '/dashboard' && pathname.startsWith(item.href)) ||
                    (temFilhos && item.children?.some((f) => pathname.startsWith(f.href)));
                  const estaExpandido = expandidos[item.label] ?? false;

                  if (temFilhos && !collapsed) {
                    return (
                      <div key={item.label} className="space-y-0.5">
                        <button
                          type="button"
                          onClick={() => toggleExpandido(item.label)}
                          className={cn(
                            'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium text-xs transition-all duration-150',
                            estaAtivo
                              ? 'text-white bg-slate-800/80 shadow-xs'
                              : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                          )}
                        >
                          <Icon className={cn('h-4 w-4 shrink-0', estaAtivo ? 'text-primary' : 'text-slate-400')} />
                          <span className="flex-1 text-left truncate">{item.label}</span>
                          {estaExpandido ? (
                            <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          ) : (
                            <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          )}
                        </button>

                        {estaExpandido ? (
                          <div className="pl-6 pr-1 py-1 space-y-0.5 border-l-2 border-slate-800 ml-4 my-1">
                            {item.children?.map((sub) => {
                              const SubIcon = sub.icon;
                              const subAtivo = pathname === sub.href || pathname.startsWith(sub.href + '/');
                              return (
                                <Link
                                  key={sub.href}
                                  href={sub.href}
                                  className={cn(
                                    'flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[11px] transition-colors',
                                    subAtivo
                                      ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                                  )}
                                >
                                  <SubIcon className="h-3.5 w-3.5 shrink-0 opacity-80" />
                                  <span className="truncate">{sub.label}</span>
                                </Link>
                              );
                            })}
                          </div>
                        ) : null}
                      </div>
                    );
                  }

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={collapsed ? item.label : undefined}
                      className={cn(
                        'flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium text-xs transition-all duration-150 group',
                        collapsed && 'md:justify-center md:px-2 md:py-2.5',
                        estaAtivo
                          ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                      )}
                    >
                      <Icon
                        className={cn(
                          'h-4 w-4 shrink-0 transition-transform group-hover:scale-105',
                          estaAtivo ? 'text-primary-foreground' : 'text-slate-400 group-hover:text-white'
                        )}
                      />
                      <span className={cn('flex-1 truncate', collapsed && 'md:hidden')}>{item.label}</span>
                      {item.badge && !collapsed ? (
                        <span className="ml-auto px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-slate-800 text-slate-300">
                          {item.badge}
                        </span>
                      ) : null}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Rodapé / Perfil do Usuário & Ações Rápidas */}
        <div className="border-t border-slate-800/80 p-3 bg-slate-900/50 shrink-0 space-y-2">
          {/* Card do Usuário */}
          <div
            className={cn(
              'flex items-center gap-2.5 p-2 rounded-xl bg-slate-800/60 border border-slate-700/40',
              collapsed && 'md:p-1 md:justify-center'
            )}
          >
            <div className="relative shrink-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/30 to-blue-500/30 border border-primary/50 flex items-center justify-center font-bold text-primary text-xs">
                {usuario.nome.charAt(0).toUpperCase()}
              </div>
              <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-slate-950" />
            </div>

            <div className={cn('min-w-0 flex-1 overflow-hidden', collapsed && 'md:hidden')}>
              <p className="text-xs font-semibold text-white truncate leading-tight">{usuario.nome}</p>
              <p className="text-[10px] text-slate-400 truncate">
                {labelRole[usuario.role] ?? usuario.role}
              </p>
            </div>
          </div>

          {/* Atalhos Rápidos (Perfil, Segurança 2FA, Manual, Sair) */}
          <div
            className={cn(
              'grid grid-cols-4 gap-1 pt-1 text-slate-400',
              collapsed && 'md:flex md:flex-col md:items-center md:gap-1.5'
            )}
          >
            <Link
              href="/perfil"
              title="Meu Perfil"
              className={cn(
                'flex items-center justify-center p-2 rounded-lg hover:bg-slate-800 hover:text-white transition-colors',
                pathname === '/perfil' && 'bg-slate-800 text-primary font-bold'
              )}
            >
              <UserCircle className="h-4 w-4" />
            </Link>

            <Link
              href="/seguranca/sessoes"
              title="Sessões & Segurança 2FA"
              className={cn(
                'flex items-center justify-center p-2 rounded-lg hover:bg-slate-800 hover:text-white transition-colors',
                pathname === '/seguranca/sessoes' && 'bg-slate-800 text-primary font-bold'
              )}
            >
              <ShieldCheck className="h-4 w-4" />
            </Link>

            <Link
              href="/ajuda"
              title="Manual do Sistema & Ajuda"
              className={cn(
                'flex items-center justify-center p-2 rounded-lg hover:bg-slate-800 hover:text-white transition-colors',
                pathname === '/ajuda' && 'bg-slate-800 text-primary font-bold'
              )}
            >
              <HelpCircle className="h-4 w-4" />
            </Link>

            <button
              type="button"
              title="Encerrar Sessão"
              onClick={async () => {
                try {
                  await signOut({ redirect: false });
                } catch {
                  // Fallback se houver falha de rede
                }
                window.location.href = '/login';
              }}
              className="flex items-center justify-center p-2 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>

          {/* Botão Recolher/Expandir Sidebar Desktop */}
          <button
            type="button"
            onClick={toggleDesktopCollapsed}
            className="hidden md:flex w-full items-center justify-center gap-2 py-1.5 rounded-lg text-[10px] text-slate-500 hover:text-slate-300 hover:bg-slate-800/40 transition-colors"
            title={collapsed ? 'Expandir barra lateral' : 'Recolher barra lateral'}
          >
            {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
            {!collapsed && <span>Recolher menu</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
