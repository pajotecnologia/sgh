import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { authOptions } from '@/lib/auth'
import { ClipboardList } from 'lucide-react'
import { FormularioPrescricaoMedicaPadrao } from '@/components/cadastros/FormularioPrescricaoMedicaPadrao'

export const metadata: Metadata = { title: 'Nova prescrição padrão' }

export default async function PaginaNovaPrescricaoMedica() {
  const sessao = await getServerSession(authOptions)
  if (!sessao) redirect('/login')
  if (sessao.usuario.role !== 'ADMIN') redirect('/acesso-negado')

  return (
    <div className="max-w-4xl mx-auto space-y-4 w-full min-w-0">
      <div className="min-w-0">
        <Link href="/cadastros/prescricoes-medicas" className="no-print text-xs text-primary hover:underline">
          ← Voltar
        </Link>
        <h1 className="page-title flex flex-wrap items-center gap-2 mt-2">
          <ClipboardList className="h-5 w-5 text-primary shrink-0" aria-hidden />
          <span>Nova prescrição padrão</span>
        </h1>
        <p className="page-subtitle">
          Cadastre o formulário em duas colunas — textos fixos à esquerda e preenchimento à direita na prescrição.
        </p>
      </div>

      <FormularioPrescricaoMedicaPadrao modo="criar" />
    </div>
  )
}
