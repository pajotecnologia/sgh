import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Building2 } from 'lucide-react'
import { FormularioClinica } from '@/components/cadastros/FormularioClinica'

export const metadata: Metadata = { title: 'Editar clínica' }

export default async function PaginaEditarClinica({ params }: { params: Promise<{ id: string }> }) {
  const sessao = await getServerSession(authOptions)
  if (!sessao) redirect('/login')
  if (sessao.usuario.role !== 'ADMIN') redirect('/acesso-negado')

  const { id } = await params
  const clinica = await prisma.clinica.findUnique({ where: { id } })
  if (!clinica) redirect('/cadastros/clinicas')

  return (
    <div className="max-w-3xl mx-auto space-y-4 w-full min-w-0">
      <div className="min-w-0">
        <Link href="/cadastros/clinicas" className="no-print text-xs text-primary hover:underline">
          ← Voltar
        </Link>
        <h1 className="page-title flex flex-wrap items-center gap-2 mt-2">
          <Building2 className="h-5 w-5 text-primary shrink-0" aria-hidden />
          <span>Editar clínica</span>
        </h1>
        <p className="page-subtitle">Atualize os dados da clínica.</p>
      </div>

      <FormularioClinica
        modo="editar"
        clinicaInicial={{
          id: clinica.id,
          nome: clinica.nome,
          descricao: clinica.descricao ?? '',
          ativo: clinica.ativo,
        }}
      />
    </div>
  )
}
