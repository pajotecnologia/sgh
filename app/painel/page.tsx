// app/painel/page.tsx — Painel de Chamada (rota pública, tela cheia para TVs)
import { prisma } from '@/lib/prisma';
import { nomeCompletoParaExibicao } from '@/lib/nome-paciente-exibicao';
import { PainelChamada } from '@/components/painel/PainelChamada';
import { configPainelFromDb, CONFIG_PAINEL_PADRAO } from '@/lib/painel-config';

// Rota dinâmica sob demanda (SSR para TVs e terminais do painel)
export const dynamic = 'force-dynamic';

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
  const configRow = await prisma.configPainel.findFirst();
  const configPainel = configRow
    ? configPainelFromDb(configRow as unknown as Record<string, unknown>)
    : CONFIG_PAINEL_PADRAO;

  return (
    <PainelChamada
      historicoInicial={historicoInicial}
      setor={setor}
      instituicao={instituicao}
      configInicial={configPainel}
    />
  );
}
