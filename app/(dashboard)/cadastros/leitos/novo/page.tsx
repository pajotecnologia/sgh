import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { authOptions } from '@/lib/auth'
import { BedDouble } from 'lucide-react'
import { FormularioLeito } from '@/components/cadastros/FormularioLeito'

export const metadata: Metadata = { title: 'Novo leito' }

export default async function PaginaNovoLeito() {
  const sessao = await getServerSession(authOptions)
  if (!sessao) redirect('/login')
  if (sessao.usuario.role !== 'ADMIN') redirect('/acesso-negado')

  return (
    <div className="max-w-3xl mx-auto space-y-4 w-full min-w-0">
      <div className="min-w-0">
        <Link href="/cadastros/leitos" className="no-print text-xs text-primary hover:underline">
          ← Voltar
        </Link>
        <h1 className="page-title flex flex-wrap items-center gap-2 mt-2">
          <BedDouble className="h-5 w-5 text-primary shrink-0" aria-hidden />
          <span>Novo leito</span>
        </h1>
        <p className="page-subtitle">Cadastre leitos para seleção durante o internamento.</p>
      </div>

      <FormularioLeito modo="criar" />
    </div>
  )
}
