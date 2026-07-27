// app/(dashboard)/farmacia/sinonimos/page.tsx

import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Tags } from 'lucide-react'
import { GestaoSinonimosFarmacia } from '@/components/farmacia/GestaoSinonimosFarmacia'

export const metadata: Metadata = { title: 'Sinônimos de Medicamentos' }

const ROLES = ['ADMIN', 'FARMACEUTICO'] as const

export default async function PaginaSinonimosFarmacia() {
  const sessao = await getServerSession(authOptions)
  if (!sessao) redirect('/login')
  if (!ROLES.includes(sessao.usuario.role as (typeof ROLES)[number])) redirect('/acesso-negado')

  const medicamentos = await prisma.tbMedicamento.findMany({
    where: { ativo: true },
    select: { id: true, nome: true, principioAtivo: true },
    orderBy: [{ nome: 'asc' }],
    take: 1000,
  })

  return (
    <div className="max-w-5xl mx-auto space-y-4 w-full min-w-0">
      <div className="min-w-0">
        <h1 className="page-title flex flex-wrap items-center gap-2">
          <Tags className="h-5 w-5 text-primary shrink-0" aria-hidden />
          <span>Sinônimos de Medicamentos</span>
        </h1>
        <p className="page-subtitle">
          Cadastre abreviações/sinônimos para melhorar o vínculo automático com o catálogo (ex.: AAS ↔ ácido
          acetilsalicílico).
        </p>
      </div>

      <GestaoSinonimosFarmacia medicamentos={medicamentos} />
    </div>
  )
}
