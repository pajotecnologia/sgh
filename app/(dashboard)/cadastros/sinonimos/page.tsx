import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Tags } from 'lucide-react'
import { GestaoSinonimosFarmacia } from '@/components/farmacia/GestaoSinonimosFarmacia'

export const metadata: Metadata = { title: 'Sinônimos de Medicamentos' }

const ROLES = ['ADMIN', 'FARMACEUTICO'] as const

export default async function PaginaCadastrosSinonimos() {
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
    <div className="max-w-6xl mx-auto space-y-4 w-full min-w-0 pb-8">
      <div className="min-w-0 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <h1 className="text-base font-bold text-slate-900 dark:text-slate-100 flex flex-wrap items-center gap-2">
          <Tags className="h-5 w-5 text-primary shrink-0" aria-hidden />
          <span>Cadastro de Sinônimos e Abreviações</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Cadastre abreviações, nomes comerciais e sinônimos para melhorar a busca e o vínculo automático no catálogo (ex.: AAS ↔ ácido acetilsalicílico).
        </p>
      </div>

      <GestaoSinonimosFarmacia medicamentos={medicamentos} />
    </div>
  )
}
