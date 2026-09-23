import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { BedDouble } from 'lucide-react'
import { authOptions } from '@/lib/auth'
import { MapaLeitosVisual } from '@/components/internamento/MapaLeitosVisual'

export const metadata: Metadata = {
  title: 'Mapa Visual de Leitos — Gestão de Internação',
  description: 'Visão hospitalar em tempo real de leitos, ocupação, transferências e pacientes internados.',
}

const ROLES_PERMITIDOS = [
  'ADMIN',
  'MEDICO',
  'DIRETOR_CLINICO',
  'ENFERMEIRO',
  'TECNICO_ENFERMAGEM',
  'RECEPCIONISTA',
  'FARMACEUTICO',
]

export default async function PaginaMapaLeitos() {
  const sessao = await getServerSession(authOptions)
  if (!sessao) redirect('/login')
  if (!ROLES_PERMITIDOS.includes(sessao.usuario.role)) redirect('/acesso-negado')

  return (
    <div className="max-w-7xl mx-auto space-y-6 w-full min-w-0">
      <div>
        <h1 className="page-title flex flex-wrap items-center gap-2 text-foreground">
          <BedDouble className="h-6 w-6 sm:h-7 sm:w-7 text-primary shrink-0" aria-hidden />
          <span>Mapa de Leitos Hospitalares</span>
        </h1>
        <p className="page-subtitle">
          Painel de ocupação em tempo real por clínica e ala. Monitore disponibilidade, tempo de internação, realize transferências ágeis e gerencie bloqueios de leitos.
        </p>
      </div>

      <MapaLeitosVisual />
    </div>
  )
}
