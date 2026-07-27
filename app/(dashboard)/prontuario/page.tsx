import type { Metadata } from 'next'
import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { FileText } from 'lucide-react'
import { authOptions } from '@/lib/auth'
import { carregarListaInternados, ROLES_LISTA_INTERNADOS } from '@/lib/internacao-lista'
import { ListaPacientesInternados } from '@/components/internamento/ListaPacientesInternados'
import { parsePaginacao } from '@/lib/paginacao'

export const metadata: Metadata = { title: 'Prontuário Médico' }

export default async function PaginaProntuario({
  searchParams,
}: {
  searchParams: Promise<{
    nome?: string
    prontuario?: string
    dataInicio?: string
    dataFim?: string
    n?: string
    pagina?: string
    porPagina?: string
  }>
}) {
  const sessao = await getServerSession(authOptions)
  if (!sessao) redirect('/login')
  if (!ROLES_LISTA_INTERNADOS.includes(sessao.usuario.role)) {
    redirect('/acesso-negado')
  }

  const role = sessao.usuario.role
  const podeVerMedicacaoPendente = ['ADMIN', 'ENFERMEIRO', 'TECNICO_ENFERMAGEM'].includes(role)

  const params = await searchParams
  const { pagina, porPagina, skip, take } = parsePaginacao(params)
  const nome = params.nome ?? params.n?.trim() ?? ''
  const prontuario = params.prontuario ?? ''
  const dataInicio = params.dataInicio ?? ''
  const dataFim = params.dataFim ?? ''
  const temFiltro = Boolean(nome.trim() || prontuario.trim() || dataInicio || dataFim)

  const { atendimentos, total: totalInternados } = await carregarListaInternados(
    { nome, prontuario, dataInicio, dataFim },
    skip,
    take
  )

  return (
    <ListaPacientesInternados
      variant="medico"
      titulo="Prontuário Médico"
      icone={FileText}
      basePath="/prontuario"
      atendimentos={atendimentos}
      totalInternados={totalInternados}
      podeVerMedicacaoPendente={podeVerMedicacaoPendente}
      temFiltro={temFiltro}
      filtros={{ nome, prontuario, dataInicio, dataFim }}
      pagina={pagina}
      porPagina={porPagina}
      subtitulo={
        <>
          Evolução médica, prescrições e laudos. Novas admissões em{' '}
          <Link href="/internamento/admissoes" className="text-primary hover:underline font-medium">
            Admissões
          </Link>
          .
        </>
      }
    />
  )
}
