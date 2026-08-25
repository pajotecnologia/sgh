import type { Metadata } from 'next'
import { FormularioRelatorioAtendimentosDia } from '@/components/relatorios/FormularioRelatorioAtendimentosDia'

export const metadata: Metadata = { title: 'Atendimentos do Dia | Relatórios' }

export default function PaginaRelatorioAtendimentos() {
  return (
    <div className="max-w-4xl mx-auto">
      <FormularioRelatorioAtendimentosDia />
    </div>
  )
}
