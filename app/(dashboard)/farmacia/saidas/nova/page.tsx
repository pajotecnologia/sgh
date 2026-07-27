import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { authOptions } from '@/lib/auth'
import { FileUp } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { FormularioSaidaManualFarmacia } from '@/components/farmacia/FormularioSaidaManualFarmacia'

export const metadata: Metadata = { title: 'Nova saída (manual)' }

const ROLES = ['ADMIN', 'FARMACEUTICO'] as const

export default async function PaginaNovaSaidaManualFarmacia() {
  const sessao = await getServerSession(authOptions)
  if (!sessao) redirect('/login')
  if (!ROLES.includes(sessao.usuario.role as (typeof ROLES)[number])) redirect('/acesso-negado')

  const medicamentos = await prisma.tbMedicamento.findMany({
    where: { ativo: true },
    select: { id: true, nome: true, principioAtivo: true, saldoAtual: true },
    orderBy: [{ nome: 'asc' }],
    take: 1500,
  })

  return (
    <div className="max-w-4xl mx-auto space-y-4 w-full min-w-0">
      <div className="min-w-0">
        <Link href="/farmacia/saidas" className="no-print text-xs text-primary hover:underline">
          ← Voltar
        </Link>
        <h1 className="page-title flex flex-wrap items-center gap-2 mt-2">
          <FileUp className="h-5 w-5 text-primary shrink-0" aria-hidden />
          <span>Nova saída (baixa manual)</span>
        </h1>
        <p className="page-subtitle">Use para ajustes de estoque, perdas, devoluções, etc.</p>
      </div>

      <FormularioSaidaManualFarmacia medicamentos={medicamentos} />
    </div>
  )
}
