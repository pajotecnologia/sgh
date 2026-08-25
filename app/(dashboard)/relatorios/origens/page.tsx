import type { Metadata } from 'next'
import { RelatorioOrigens } from '@/components/relatorios/RelatorioOrigens'

export const metadata: Metadata = { title: 'Relatório de Origens' }

export default function PaginaRelatorioOrigens() {
  return (
    <div className="space-y-4">
      <RelatorioOrigens />
    </div>
  )
}
