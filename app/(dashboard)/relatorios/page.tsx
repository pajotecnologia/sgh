import type { Metadata } from 'next'
import { PainelRelatoriosGerenciais } from '@/components/relatorios/PainelRelatoriosGerenciais'
import { SubmenuRelatorios } from '@/components/relatorios/SubmenuRelatorios'
import { BarChart3 } from 'lucide-react'

export const metadata: Metadata = { title: 'Central de Relatórios Gerenciais' }

export default function PaginaRelatoriosIndex() {
  return (
    <div className="max-w-6xl mx-auto space-y-6 py-2">
      <div className="space-y-1">
        <h1 className="page-title flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
          <BarChart3 className="h-7 w-7 text-primary" />
          Central de Relatórios Gerenciais & Clínicos
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Selecione abaixo o relatório desejado para visualização, filtros específicos e exportação em PDF institucional ou CSV.
        </p>
      </div>

      <SubmenuRelatorios />

      <div className="pt-2">
        <PainelRelatoriosGerenciais />
      </div>
    </div>
  )
}
