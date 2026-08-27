// Redireciona após login conforme o perfil (evita corrida de cookie no cliente)

import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import type { Role } from '@/types'

export const dynamic = 'force-dynamic';

const DESTINO_POR_ROLE: Partial<Record<Role, string>> = {
  FARMACEUTICO: '/farmacia',
  RECEPCIONISTA: '/recepcao',
  ENFERMEIRO: '/medicacao',
  TECNICO_ENFERMAGEM: '/medicacao',
  MEDICO: '/atendimento',
  DIRETOR_CLINICO: '/atendimento',
  ADMIN: '/dashboard',
}

export default async function PaginaEntrando() {
  const sessao = await getServerSession(authOptions)
  if (!sessao?.usuario?.role) redirect('/login')

  const destino = DESTINO_POR_ROLE[sessao.usuario.role] ?? '/dashboard'
  redirect(destino)
}
