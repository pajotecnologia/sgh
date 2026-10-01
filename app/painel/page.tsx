// app/painel/page.tsx — Painel de Chamada (rota pública, tela cheia para TVs)
import { prisma } from '@/lib/prisma';
import { nomeCompletoParaExibicao } from '@/lib/nome-paciente-exibicao';
import { PainelChamada } from '@/components/painel/PainelChamada';
import { configPainelFromDb, CONFIG_PAINEL_PADRAO } from '@/lib/painel-config';
import { buscarProximosChamados, type ProximoChamadoItem } from '@/lib/painel-proximos';
import type { CorTriagem } from '@/types';

// Rota dinâmica sob demanda (SSR para TVs e terminais do painel)
export const dynamic = 'force-dynamic';

interface ChamadaHistoricoItem {
  id: string;
  nomePaciente: string;
  numeroAtendimento: string;
  salaDestino: string;
  corTriagem: CorTriagem | null;
  chamadoEm: string;
  setorPainel: string;
}

export default async function PaginaPainel({
  searchParams,
}: {
  searchParams?: Promise<{ setor?: string }> | { setor?: string };
}) {
  let setor = 'GERAL';
  try {
    const resolvedParams = searchParams ? await Promise.resolve(searchParams) : null;
    if (resolvedParams?.setor) {
      setor = String(resolvedParams.setor);
    }
  } catch {
    setor = 'GERAL';
  }

  let historicoInicial: ChamadaHistoricoItem[] = [];
  let proximosIniciais: ProximoChamadoItem[] = [];
  let instituicao: { nomeInstituicao?: string; logomarcaUrl?: string | null } | null = null;
  let configPainel = CONFIG_PAINEL_PADRAO;

  // Carregar histórico de chamadas com tratamento defensivo
  try {
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

    historicoInicial = (chamadasIniciais || [])
      .filter((c) => Boolean(c && c.atendimento && c.atendimento.paciente))
      .map((c) => ({
        id: c.id,
        nomePaciente: nomeCompletoParaExibicao(
          c.atendimento?.paciente?.nomeExibicao,
          c.atendimento?.paciente?.nomeCriptografado
        ),
        numeroAtendimento: c.atendimento?.numeroAtendimento ?? '---',
        salaDestino: c.salaDestino ?? 'Consultório',
        corTriagem: (c.atendimento?.triagem?.corClassificacao as CorTriagem) ?? null,
        chamadoEm: c.chamadoEm ? new Date(c.chamadoEm).toISOString() : new Date().toISOString(),
        setorPainel: c.setorPainel ?? setor,
      }));
  } catch (err) {
    console.error('[PaginaPainel] Erro ao carregar chamadas iniciais:', err);
  }

  // Carregar fila dos próximos pacientes
  try {
    proximosIniciais = await buscarProximosChamados(setor, 5);
  } catch (err) {
    console.error('[PaginaPainel] Erro ao carregar próximos iniciais:', err);
  }

  // Carregar dados da instituição (serializados como objeto simples)
  try {
    const instRaw = await prisma.instituicao.findFirst({
      select: { nomeInstituicao: true, logomarcaUrl: true },
    });
    if (instRaw) {
      instituicao = {
        nomeInstituicao: instRaw.nomeInstituicao,
        logomarcaUrl: instRaw.logomarcaUrl,
      };
    }
  } catch (err) {
    console.error('[PaginaPainel] Erro ao carregar instituição:', err);
  }

  // Carregar configuração do painel
  try {
    const configRow = await prisma.configPainel.findFirst();
    if (configRow) {
      configPainel = configPainelFromDb(configRow as unknown as Record<string, unknown>);
    }
  } catch (err) {
    console.error('[PaginaPainel] Erro ao carregar config painel:', err);
  }

  return (
    <PainelChamada
      historicoInicial={historicoInicial}
      proximosIniciais={proximosIniciais}
      setor={setor}
      instituicao={instituicao}
      configInicial={configPainel}
    />
  );
}
