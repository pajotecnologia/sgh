import type { Metadata } from 'next'
import { RelatorioClinicas } from '@/components/relatorios/RelatorioClinicas'

export const metadata: Metadata = { title: 'Relatório de Clínicas' }

export default function PaginaRelatorioClinicas() {
  return (
    <div className="space-y-4">
      <RelatorioClinicas />
    </div>
  )
}
