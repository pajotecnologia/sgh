import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Package } from 'lucide-react'
import { TabelaListagemMedicamentos } from '@/components/farmacia/TabelaListagemMedicamentos'

export const metadata: Metadata = { title: 'Cadastro de Medicamentos e Materiais' }

const ROLES = ['ADMIN', 'FARMACEUTICO'] as const

export default async function PaginaCadastrosMedicamentos() {
  const sessao = await getServerSession(authOptions)
  if (!sessao) redirect('/login')
  if (!ROLES.includes(sessao.usuario.role as (typeof ROLES)[number])) redirect('/acesso-negado')

  const meds = await prisma.tbMedicamento.findMany({
    where: { ativo: true },
    orderBy: [{ nome: 'asc' }],
    take: 1000,
  })

  return (
    <div className="max-w-6xl mx-auto space-y-4 w-full min-w-0 pb-8">
      <div className="min-w-0 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <h1 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Package className="h-5 w-5 text-primary shrink-0" aria-hidden />
          <span>Cadastro Mestre de Medicamentos e Materiais Hospitalares</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Gerenciamento completo do catálogo hospitalar, controle de saldo, medicamentos de alta vigilância (MAV) e insumos.
        </p>
      </div>

      <TabelaListagemMedicamentos medicamentos={meds} />
    </div>
  )
}
