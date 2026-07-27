import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { authOptions } from '@/lib/auth'
import { FileDown } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { FormularioEntradaNfFarmacia } from '@/components/farmacia/FormularioEntradaNfFarmacia'

export const metadata: Metadata = { title: 'Nova entrada (NF)' }

const ROLES = ['ADMIN', 'FARMACEUTICO'] as const

export default async function PaginaNovaEntradaFarmacia() {
  const sessao = await getServerSession(authOptions)
  if (!sessao) redirect('/login')
  if (!ROLES.includes(sessao.usuario.role as (typeof ROLES)[number])) redirect('/acesso-negado')

  const medicamentos = await prisma.tbMedicamento.findMany({
    where: { ativo: true },
    select: { id: true, nome: true, principioAtivo: true },
    orderBy: [{ nome: 'asc' }],
    take: 1500,
  })

  return (
    <div className="max-w-4xl mx-auto space-y-4 w-full min-w-0">
      <div className="min-w-0">
        <Link href="/farmacia/entradas" className="no-print text-xs text-primary hover:underline">
          ← Voltar
        </Link>
        <h1 className="page-title flex flex-wrap items-center gap-2 mt-2">
          <FileDown className="h-5 w-5 text-primary shrink-0" aria-hidden />
          <span>Nova entrada (Nota Fiscal)</span>
        </h1>
        <p className="page-subtitle">Informe os dados da NF e os itens recebidos para atualizar o saldo.</p>
      </div>

      <FormularioEntradaNfFarmacia medicamentos={medicamentos} />
    </div>
  )
}
