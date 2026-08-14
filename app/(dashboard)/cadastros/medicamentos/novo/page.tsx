import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { authOptions } from '@/lib/auth'
import { PackagePlus } from 'lucide-react'
import { FormularioMedicamentoFarmacia } from '@/components/farmacia/FormularioMedicamentoFarmacia'

export const metadata: Metadata = { title: 'Novo medicamento' }

const ROLES = ['ADMIN', 'FARMACEUTICO'] as const

export default async function PaginaNovoMedicamentoCadastros() {
  const sessao = await getServerSession(authOptions)
  if (!sessao) redirect('/login')
  if (!ROLES.includes(sessao.usuario.role as (typeof ROLES)[number])) redirect('/acesso-negado')

  return (
    <div className="max-w-3xl mx-auto space-y-4 w-full min-w-0 pb-8">
      <div className="min-w-0 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <Link href="/cadastros/medicamentos" className="no-print text-xs text-primary font-semibold hover:underline">
          ← Voltar para Cadastro de Medicamentos
        </Link>
        <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex flex-wrap items-center gap-2 mt-2">
          <PackagePlus className="h-5 w-5 text-primary shrink-0" aria-hidden />
          <span>Novo Medicamento</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Cadastre o medicamento para habilitar saldo, entradas por NFe e prescrições.</p>
      </div>

      <FormularioMedicamentoFarmacia />
    </div>
  )
}
