import type { Metadata } from 'next'
import { GestaoFornecedoresFarmacia } from '@/components/farmacia/GestaoFornecedoresFarmacia'

export const metadata: Metadata = { title: 'Cadastro de Fornecedores' }

export default function PaginaCadastrosFornecedores() {
  return (
    <div className="max-w-6xl mx-auto space-y-4 w-full min-w-0 pb-8">
      <GestaoFornecedoresFarmacia />
    </div>
  )
}
