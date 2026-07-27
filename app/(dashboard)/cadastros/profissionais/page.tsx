import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { authOptions } from '@/lib/auth'
import { Users } from 'lucide-react'

export const metadata: Metadata = { title: 'Profissionais' }

export default async function PaginaProfissionais() {
  const sessao = await getServerSession(authOptions)
  if (!sessao) redirect('/login')
  if (sessao.usuario.role !== 'ADMIN') redirect('/acesso-negado')

  return (
    <div className="max-w-5xl mx-auto space-y-4 w-full min-w-0">
      <div className="min-w-0">
        <h1 className="page-title flex flex-wrap items-center gap-2">
          <Users className="h-5 w-5 text-primary shrink-0" aria-hidden />
          <span>Profissionais (login)</span>
        </h1>
        <p className="page-subtitle">
          O cadastro de médicos, enfermeiros e técnicos já é feito via <strong>Configurações → Usuários</strong> (com vínculo ao login).
        </p>
      </div>

      <div className="bg-card border border-border rounded-xl p-4 space-y-2">
        <p className="text-xs text-muted-foreground">
          Acesse para cadastrar/vincular o profissional ao acesso:
        </p>
        <Link
          href="/configuracoes"
          className="no-print inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-3 py-2 text-xs font-semibold hover:bg-primary/90 transition-colors"
        >
          Abrir Configurações → Usuários
        </Link>
      </div>
    </div>
  )
}
