import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { authOptions } from '@/lib/auth'
import { PackagePlus } from 'lucide-react'
import { FormularioMedicamentoFarmacia } from '@/components/farmacia/FormularioMedicamentoFarmacia'

export const metadata: Metadata = { title: 'Novo medicamento' }

const ROLES = ['ADMIN', 'FARMACEUTICO'] as const

export default async function PaginaNovoMedicamentoFarmacia() {
  const sessao = await getServerSession(authOptions)
  if (!sessao) redirect('/login')
  if (!ROLES.includes(sessao.usuario.role as (typeof ROLES)[number])) redirect('/acesso-negado')

  return (
    <div className="max-w-3xl mx-auto space-y-4 w-full min-w-0">
      <div className="min-w-0">
        <Link href="/farmacia/medicamentos" className="no-print text-xs text-primary hover:underline">
          ← Voltar
        </Link>
        <h1 className="page-title flex flex-wrap items-center gap-2 mt-2">
          <PackagePlus className="h-5 w-5 text-primary shrink-0" aria-hidden />
          <span>Novo medicamento</span>
        </h1>
        <p className="page-subtitle">Cadastre o medicamento para habilitar saldo, entradas e dispensação.</p>
      </div>

      <FormularioMedicamentoFarmacia />
    </div>
  )
}
