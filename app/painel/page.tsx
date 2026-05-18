// app/painel/page.tsx — Painel de Chamada (rota pública, tela cheia para TVs)
import { prisma } from '@/lib/prisma';
import { nomeCompletoParaExibicao } from '@/lib/nome-paciente-exibicao';
import { PainelChamada } from '@/components/painel/PainelChamada';

// Revalidar a cada 30s (SSR + ISR como fallback se Pusher não conectar)
export const revalidate = 30;

export default async function PaginaPainel({
  searchParams,
}: {
  searchParams: Promise<{ setor?: string }>;
}) {
  const params = await searchParams;
  const setor = params.setor ?? 'GERAL';

  // Carregar as últimas 5 chamadas do setor para exibição inicial
  const chamadasIniciais = await prisma.chamadaPainel.findMany({
    where: { setorPainel: setor },
    include: {
      atendimento: {
        include: {
          paciente: { select: { nomeExibicao: true, nomeCriptografado: true } },
          triagem: { select: { corClassificacao: true } },
        },
      },
    },
    orderBy: { chamadoEm: 'desc' },
    take: 5,
  });

  const historicoInicial = chamadasIniciais.map((c) => ({
    id: c.id,
    nomePaciente: nomeCompletoParaExibicao(
      c.atendimento.paciente.nomeExibicao,
      c.atendimento.paciente.nomeCriptografado
    ),
    numeroAtendimento: c.atendimento.numeroAtendimento,
    salaDestino: c.salaDestino,
    corTriagem: c.atendimento.triagem?.corClassificacao ?? null,
    chamadoEm: c.chamadoEm.toISOString(),
    setorPainel: c.setorPainel,
  }));
  const instituicao = await prisma.instituicao.findFirst();

  return <PainelChamada historicoInicial={historicoInicial} setor={setor} instituicao={instituicao} />;
}
