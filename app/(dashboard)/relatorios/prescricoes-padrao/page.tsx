import type { Metadata } from 'next'
import { RelatorioPrescricoesPadrao } from '@/components/relatorios/RelatorioPrescricoesPadrao'

export const metadata: Metadata = { title: 'Relatório de Prescrições Padrão' }

export default function PaginaRelatorioPrescricoesPadrao() {
  return (
    <div className="space-y-4">
      <RelatorioPrescricoesPadrao />
    </div>
  )
}
