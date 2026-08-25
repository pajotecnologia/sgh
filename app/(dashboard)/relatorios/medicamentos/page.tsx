import type { Metadata } from 'next'
import { RelatorioMedicamentos } from '@/components/relatorios/RelatorioMedicamentos'

export const metadata: Metadata = { title: 'Relatório de Medicamentos' }

export default function PaginaRelatorioMedicamentos() {
  return (
    <div className="space-y-4">
      <RelatorioMedicamentos />
    </div>
  )
}
