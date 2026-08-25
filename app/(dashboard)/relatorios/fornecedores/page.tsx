import type { Metadata } from 'next'
import { RelatorioFornecedores } from '@/components/relatorios/RelatorioFornecedores'

export const metadata: Metadata = { title: 'Relatório de Fornecedores' }

export default function PaginaRelatorioFornecedores() {
  return (
    <div className="space-y-4">
      <RelatorioFornecedores />
    </div>
  )
}
