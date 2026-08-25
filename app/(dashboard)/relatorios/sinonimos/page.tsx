import type { Metadata } from 'next'
import { RelatorioSinonimos } from '@/components/relatorios/RelatorioSinonimos'

export const metadata: Metadata = { title: 'Relatório de Sinônimos' }

export default function PaginaRelatorioSinonimos() {
  return (
    <div className="space-y-4">
      <RelatorioSinonimos />
    </div>
  )
}
