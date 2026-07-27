import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { BedDouble } from 'lucide-react'
import { FormularioLeito } from '@/components/cadastros/FormularioLeito'

export const metadata: Metadata = { title: 'Editar leito' }

export default async function PaginaEditarLeito({ params }: { params: Promise<{ id: string }> }) {
  const sessao = await getServerSession(authOptions)
  if (!sessao) redirect('/login')
  if (sessao.usuario.role !== 'ADMIN') redirect('/acesso-negado')

  const { id } = await params
  const leito = await prisma.leito.findUnique({ where: { id } })
  if (!leito) redirect('/cadastros/leitos')

  return (
    <div className="max-w-3xl mx-auto space-y-4 w-full min-w-0">
      <div className="min-w-0">
        <Link href="/cadastros/leitos" className="no-print text-xs text-primary hover:underline">
          ← Voltar
        </Link>
        <h1 className="page-title flex flex-wrap items-center gap-2 mt-2">
          <BedDouble className="h-5 w-5 text-primary shrink-0" aria-hidden />
          <span>
            Editar leito {leito.ala} • {leito.codigo}
          </span>
        </h1>
        <p className="page-subtitle">Atualize dados do leito (ativação, tipo, ala, etc.).</p>
      </div>

      <FormularioLeito
        modo="editar"
        leitoInicial={{
          id: leito.id,
          clinicaId: leito.clinicaId ?? '',
          ala: leito.ala,
          quarto: leito.quarto ?? '',
          codigo: leito.codigo,
          tipo: leito.tipo,
          status: leito.status,
          ativo: leito.ativo,
          observacoes: leito.observacoes ?? '',
        }}
      />
    </div>
  )
}
