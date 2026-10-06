'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Calendar,
  Users,
  Stethoscope,
  Building2,
  BedDouble,
  Package,
  Truck,
  ClipboardList,
  Navigation,
  Tags,
  Syringe,
  Shield,
  Activity,
  SunMoon,
  LogOut,
  FileText,
  UserCheck,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const RELATORIOS_CLINICOS = [
  { href: '/relatorios/prontuario-medico', label: 'Prontuário Médico', icon: Stethoscope },
  { href: '/relatorios/prontuario-enfermagem', label: 'Prontuário Enfermagem', icon: UserCheck },
  { href: '/relatorios/internamento', label: 'Internamento', icon: Building2 },
  { href: '/relatorios/medicamentos-instrucoes', label: 'Medicamentos & Apraz.', icon: Syringe },
  { href: '/relatorios/ccih', label: 'CCIH & IRAS', icon: Shield },
  { href: '/relatorios/sinais-vitais', label: 'Sinais Vitais', icon: Activity },
  { href: '/relatorios/evolucao-turno', label: 'Evolução Dia/Noite', icon: SunMoon },
  { href: '/relatorios/condicoes-alta', label: 'Condições de Alta', icon: LogOut },
  { href: '/relatorios/sae', label: 'SAE', icon: ClipboardList },
  { href: '/relatorios/multidisciplinar', label: 'Multidisciplinar', icon: Users },
  { href: '/relatorios/laudos-medicos', label: 'Laudos Médicos', icon: FileText },
]

const RELATORIOS_CADASTRAIS = [
  { href: '/relatorios/atendimentos', label: 'Atendimentos', icon: Calendar },
  { href: '/relatorios/pacientes', label: 'Pacientes', icon: Users },
  { href: '/relatorios/profissionais', label: 'Profissionais / Usuários', icon: Stethoscope },
  { href: '/relatorios/clinicas', label: 'Clínicas', icon: Building2 },
  { href: '/relatorios/leitos', label: 'Leitos', icon: BedDouble },
  { href: '/relatorios/medicamentos', label: 'Medicamentos (Catálogo)', icon: Package },
  { href: '/relatorios/fornecedores', label: 'Fornecedores', icon: Truck },
  { href: '/relatorios/prescricoes-padrao', label: 'Prescrições Padrão', icon: ClipboardList },
  { href: '/relatorios/origens', label: 'Origens de Pacientes', icon: Navigation },
  { href: '/relatorios/sinonimos', label: 'Sinônimos (Farmácia)', icon: Tags },
]

export function SubmenuRelatorios() {
  const pathname = usePathname()

  return (
    <div className="no-print space-y-3 pb-3 border-b border-border/60">
      {/* Grupo Clínico */}
      <div className="space-y-1.5">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-1">
          Relatórios Clínicos & Internamento
        </span>
        <nav className="flex flex-wrap gap-1.5" aria-label="Relatórios Clínicos">
          {RELATORIOS_CLINICOS.map((it) => {
            const Icone = it.icon
            const ativo = pathname === it.href || pathname.startsWith(`${it.href}/`)

            return (
              <Link
                key={it.href}
                href={it.href}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors',
                  ativo
                    ? 'border-primary bg-primary/10 text-primary shadow-2xs font-semibold'
                    : 'border-border bg-card text-foreground hover:bg-muted/70'
                )}
                aria-current={ativo ? 'page' : undefined}
              >
                <Icone className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
                {it.label}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Grupo Cadastral */}
      <div className="space-y-1.5">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-1">
          Relatórios Cadastrais & Operacionais
        </span>
        <nav className="flex flex-wrap gap-1.5" aria-label="Relatórios Cadastrais">
          {RELATORIOS_CADASTRAIS.map((it) => {
            const Icone = it.icon
            const ativo =
              pathname === it.href ||
              (it.href === '/relatorios/atendimentos' && pathname === '/relatorios') ||
              pathname.startsWith(`${it.href}/`)

            return (
              <Link
                key={it.href}
                href={it.href}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors',
                  ativo
                    ? 'border-primary bg-primary/10 text-primary shadow-2xs font-semibold'
                    : 'border-border bg-card text-foreground hover:bg-muted/70'
                )}
                aria-current={ativo ? 'page' : undefined}
              >
                <Icone className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
                {it.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
