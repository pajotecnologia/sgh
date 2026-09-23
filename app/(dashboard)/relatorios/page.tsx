import type { Metadata } from 'next'
import { PainelRelatoriosGerenciais } from '@/components/relatorios/PainelRelatoriosGerenciais'

export const metadata: Metadata = { title: 'Relatórios Gerenciais' }

export default function PaginaRelatoriosIndex() {
  return (
    <div className="max-w-6xl mx-auto py-2">
      <PainelRelatoriosGerenciais />
    </div>
  )
}
