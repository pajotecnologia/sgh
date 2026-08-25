import type { Metadata } from 'next'
import { RelatorioProfissionais } from '@/components/relatorios/RelatorioProfissionais'

export const metadata: Metadata = { title: 'Relatório de Profissionais' }

export default function PaginaRelatorioProfissionais() {
  return (
    <div className="space-y-4">
      <RelatorioProfissionais />
    </div>
  )
}
