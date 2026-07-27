import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { BarChart3 } from 'lucide-react'
import { FormularioRelatoriosFarmacia } from '@/components/farmacia/FormularioRelatoriosFarmacia'
import { TabelaRelatoriosFarmacia } from '@/components/farmacia/TabelaRelatoriosFarmacia'

export const metadata: Metadata = { title: 'Relatórios' }

const ROLES = ['ADMIN', 'FARMACEUTICO'] as const

export default async function PaginaRelatoriosFarmacia() {
  const sessao = await getServerSession(authOptions)
  if (!sessao) redirect('/login')
  if (!ROLES.includes(sessao.usuario.role as (typeof ROLES)[number])) redirect('/acesso-negado')

  return (
    <div className="max-w-4xl mx-auto space-y-4 w-full min-w-0">
      <div className="min-w-0">
        <h1 className="page-title flex flex-wrap items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary shrink-0" aria-hidden />
          <span>Relatórios — Farmácia</span>
        </h1>
        <p className="page-subtitle">
          Faltantes (prescrições sem saldo) e medicamentos abaixo do estoque mínimo.
        </p>
      </div>

      <FormularioRelatoriosFarmacia />
      <TabelaRelatoriosFarmacia />
    </div>
  )
}
