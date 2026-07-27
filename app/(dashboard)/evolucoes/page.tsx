import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { NotebookPen } from 'lucide-react'
import { authOptions } from '@/lib/auth'
import { carregarListaInternados, ROLES_LISTA_INTERNADOS } from '@/lib/internacao-lista'
import { ListaPacientesInternados } from '@/components/internamento/ListaPacientesInternados'
import { parsePaginacao } from '@/lib/paginacao'

export const metadata: Metadata = { title: 'Prontuário Enfermagem' }

export default async function PaginaEvolucoes({
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
      variant="enfermagem"
      titulo="Prontuário Enfermagem"
      icone={NotebookPen}
      basePath="/evolucoes"
      atendimentos={atendimentos}
      totalInternados={totalInternados}
      podeVerMedicacaoPendente={podeVerMedicacaoPendente}
      temFiltro={temFiltro}
      filtros={{ nome, prontuario, dataInicio, dataFim }}
      pagina={pagina}
      porPagina={porPagina}
      subtitulo="Internação, enfermagem, CCIH, sinais vitais, evolução por turno, SAE e avaliação multidisciplinar. Selecione o paciente para abrir o módulo correspondente."
    />
  )
}
