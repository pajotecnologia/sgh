import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { authOptions } from '@/lib/auth'
import { Upload } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { FormularioImportacaoXmlNfe } from '@/components/farmacia/FormularioImportacaoXmlNfe'

export const metadata: Metadata = { title: 'Importar XML NF-e' }

const ROLES = ['ADMIN', 'FARMACEUTICO'] as const

export default async function PaginaImportarXmlFarmacia() {
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
          ← Voltar para entradas
        </Link>
        <h1 className="page-title flex flex-wrap items-center gap-2 mt-2">
          <Upload className="h-5 w-5 text-primary shrink-0" aria-hidden />
          <span>Importar XML NF-e</span>
        </h1>
        <p className="page-subtitle">
          Envie o XML da nota fiscal, revise os dados na confirmação prévia e vincule cada item ao catálogo.
        </p>
      </div>

      <FormularioImportacaoXmlNfe medicamentos={medicamentos} />
    </div>
  )
}
