// Lista de pacientes aguardando recepção pela enfermagem

import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { UserPlus, FileText } from 'lucide-react'
import { authOptions } from '@/lib/auth'
import { PainelAdmissoes } from '@/components/internamento/PainelAdmissoes'

export const metadata: Metadata = { title: 'Admissões — Enfermagem' }

const ROLES = ['ADMIN', 'ENFERMEIRO', 'TECNICO_ENFERMAGEM', 'RECEPCIONISTA', 'MEDICO', 'DIRETOR_CLINICO']

export default async function PaginaAdmissoesEnfermagem() {
  const sessao = await getServerSession(authOptions)
  if (!sessao) redirect('/login')
  if (!ROLES.includes(sessao.usuario.role)) redirect('/acesso-negado')

  return (
    <div className="max-w-5xl mx-auto space-y-6 w-full min-w-0">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="page-title flex flex-wrap items-center gap-2 text-foreground">
            <UserPlus className="h-6 w-6 sm:h-7 sm:w-7 text-primary shrink-0" aria-hidden />
            <span>Admissões — Enfermagem</span>
          </h1>
          <p className="page-subtitle">
            Solicitações médicas de internação aguardando recepção e pacientes já internados.
            Atribua o leito, preencha a ficha de internamento e confirme a internação efetiva.
          </p>
        </div>
        <Link
          href="/prontuario"
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted/50"
        >
          <FileText className="h-4 w-4" aria-hidden />
          Pacientes já internados
        </Link>
      </div>

      <PainelAdmissoes />
    </div>
  )
}
