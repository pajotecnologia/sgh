import { prisma } from '@/lib/prisma'

export type IndicadorOperacional = {
  chave: string
  titulo: string
  valor: number
  descricao: string
  href: string
  prioridade: 'normal' | 'atencao' | 'critico'
}

export async function obterIndicadoresOperacionais(): Promise<IndicadorOperacional[]> {
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)

  const [aguardandoTriagem, emTriagem, aguardandoAtendimento, aguardandoInternacao, internados, criticosHoje] =
    await Promise.all([
      prisma.atendimento.count({ where: { status: 'AGUARDANDO_TRIAGEM', deletedAt: null } }),
      prisma.atendimento.count({ where: { status: 'EM_TRIAGEM', deletedAt: null } }),
      prisma.atendimento.count({ where: { status: 'AGUARDANDO_ATENDIMENTO', deletedAt: null } }),
      prisma.atendimento.count({ where: { status: 'AGUARDANDO_INTERNACAO', deletedAt: null } }),
      prisma.atendimento.count({ where: { status: 'INTERNADO', deletedAt: null } }),
      prisma.triagem.count({
        where: {
          createdAt: { gte: hoje },
          corClassificacao: { in: ['VERMELHO', 'LARANJA'] },
        },
      }),
    ])

  return [
    { chave: 'aguardando-triagem', titulo: 'Aguardando triagem', valor: aguardandoTriagem, descricao: 'Pacientes na fila inicial', href: '/triagem', prioridade: aguardandoTriagem > 10 ? 'atencao' : 'normal' },
    { chave: 'em-triagem', titulo: 'Em triagem', valor: emTriagem, descricao: 'Triagens em andamento', href: '/triagem', prioridade: 'normal' },
    { chave: 'aguardando-atendimento', titulo: 'Aguardando atendimento', valor: aguardandoAtendimento, descricao: 'Prontos para avaliação clínica', href: '/atendimento', prioridade: aguardandoAtendimento > 10 ? 'atencao' : 'normal' },
    { chave: 'criticos-hoje', titulo: 'Classificações críticas hoje', valor: criticosHoje, descricao: 'Manchester vermelho ou laranja', href: '/triagem', prioridade: criticosHoje > 0 ? 'critico' : 'normal' },
    { chave: 'aguardando-internacao', titulo: 'Aguardando internação', valor: aguardandoInternacao, descricao: 'Solicitações pendentes de leito', href: '/internamento', prioridade: aguardandoInternacao > 0 ? 'atencao' : 'normal' },
    { chave: 'internados', titulo: 'Pacientes internados', valor: internados, descricao: 'Atendimentos atualmente internados', href: '/internamento', prioridade: 'normal' },
  ]
}
