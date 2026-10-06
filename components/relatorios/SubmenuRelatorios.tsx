'use client'

import { useState } from 'react'
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

  const ehCadastral = RELATORIOS_CADASTRAIS.some(
    (it) => pathname === it.href || pathname.startsWith(`${it.href}/`)
  )
  const [abaAtiva, setAbaAtiva] = useState<'clinicos' | 'cadastrais'>(ehCadastral ? 'cadastrais' : 'clinicos')

  const listaExibida = abaAtiva === 'clinicos' ? RELATORIOS_CLINICOS : RELATORIOS_CADASTRAIS

  return (
    <div className="no-print space-y-2.5 pb-3 border-b border-border/60">
      {/* Seletor Segmentado de Categoria */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex rounded-xl bg-muted/60 p-1 border border-border/40 shadow-2xs">
          <button
            type="button"
            onClick={() => setAbaAtiva('clinicos')}
            className={cn(
              'inline-flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all',
              abaAtiva === 'clinicos'
                ? 'bg-background text-primary shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Stethoscope className="h-3.5 w-3.5" />
            Relatórios Clínicos & Assistenciais
            <span className="ml-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold px-1.5 py-0.2">
              {RELATORIOS_CLINICOS.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setAbaAtiva('cadastrais')}
            className={cn(
              'inline-flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all',
              abaAtiva === 'cadastrais'
                ? 'bg-background text-primary shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <ClipboardList className="h-3.5 w-3.5" />
            Cadastros & Operações
            <span className="ml-0.5 rounded-full bg-muted text-muted-foreground text-[10px] font-bold px-1.5 py-0.2">
              {RELATORIOS_CADASTRAIS.length}
            </span>
          </button>
        </div>
      </div>

      {/* Lista de Relatórios Filtrada */}
      <nav className="flex flex-wrap gap-1.5 overflow-x-auto py-0.5" aria-label="Navegação de Relatórios">
        {listaExibida.map((it) => {
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
                'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all shrink-0',
                ativo
                  ? 'border-primary bg-primary text-primary-foreground shadow-xs font-semibold'
                  : 'border-border bg-card text-foreground hover:bg-muted/70'
              )}
              aria-current={ativo ? 'page' : undefined}
            >
              <Icone className={cn('h-3.5 w-3.5 shrink-0', ativo ? 'text-primary-foreground' : 'text-muted-foreground')} aria-hidden />
              {it.label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
