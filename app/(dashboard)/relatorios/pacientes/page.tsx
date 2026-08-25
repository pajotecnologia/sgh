import type { Metadata } from 'next'
import { RelatorioPacientes } from '@/components/relatorios/RelatorioPacientes'

export const metadata: Metadata = { title: 'Relatório de Pacientes' }

export default function PaginaRelatorioPacientes() {
  return (
    <div className="space-y-4">
      <RelatorioPacientes />
    </div>
  )
}
