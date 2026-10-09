// app/(dashboard)/farmacia/ajuste-estoque/page.tsx
import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { exigirPermissaoMenu } from '@/lib/exigir-permissao-menu'
import { PainelAjusteEstoqueDinamico } from '@/components/farmacia/PainelAjusteEstoqueDinamico'

export const metadata: Metadata = {
  title: 'Ajuste de Estoque e Inventário',
  description: 'Ajuste dinâmico de estoque, contagem física e lotes em massa na farmácia hospitalar',
}

const ROLES = ['ADMIN', 'FARMACEUTICO'] as const

export default async function PaginaAjusteEstoqueFarmacia() {
  const sessao = await getServerSession(authOptions)
  if (!sessao) redirect('/login')
  await exigirPermissaoMenu('farmacia')

  if (!ROLES.includes(sessao.usuario.role as (typeof ROLES)[number])) {
    redirect('/acesso-negado')
  }

  return <PainelAjusteEstoqueDinamico />
}
