import type { Metadata } from 'next'
import { RelatorioLeitos } from '@/components/relatorios/RelatorioLeitos'

export const metadata: Metadata = { title: 'Relatório de Leitos' }

export default function PaginaRelatorioLeitos() {
  return (
    <div className="space-y-4">
      <RelatorioLeitos />
    </div>
  )
}
