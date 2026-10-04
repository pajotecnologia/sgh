// app/(dashboard)/recepcao/imprimir-senha/[atendimentoId]/page.tsx
// Impressão rápida do ticket térmico de 80mm para entrega ao paciente na recepção

import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { resolverSenhaETipo } from '@/lib/senhas';
import { nomeCompletoParaExibicao } from '@/lib/nome-paciente-exibicao';
import { TicketSenha80mm } from '@/components/recepcao/TicketSenha80mm';

export default async function PaginaImprimirSenha({
  params,
  searchParams,
}: {
  params: Promise<{ atendimentoId: string }>;
  searchParams: Promise<{ auto?: string }>;
}) {
  const { atendimentoId } = await params;
  const { auto } = await searchParams;

  const atendimento = await prisma.atendimento.findFirst({
    where: {
      OR: [
        { id: atendimentoId },
        { numeroAtendimento: atendimentoId },
      ],
      deletedAt: null,
    },
    include: {
      paciente: {
        select: {
          nomeExibicao: true,
          nomeCriptografado: true,
          dataNascimento: true,
        },
      },
      origem: { select: { descricao: true } },
    },
  });

  if (!atendimento) {
    notFound();
  }

  const instituicao = await prisma.instituicao.findFirst({
    select: { nomeInstituicao: true, nomeMunicipio: true },
  });

  const { senha, tipo } = resolverSenhaETipo({
    numeroAtendimento: atendimento.numeroAtendimento,
    dataNascimento: atendimento.paciente.dataNascimento,
    obstetrico: atendimento.obstetrico,
  });

  const nomePaciente = nomeCompletoParaExibicao(
    atendimento.paciente.nomeExibicao,
    atendimento.paciente.nomeCriptografado
  );

  return (
    <TicketSenha80mm
      nomeInstituicao={instituicao?.nomeInstituicao ?? 'SGH - HOSPITAL GERAL'}
      unidadeNome={instituicao?.nomeMunicipio ?? atendimento.setor ?? 'PRONTO ATENDIMENTO'}
      senha={senha}
      tipoInfo={tipo}
      nomePaciente={nomePaciente}
      numeroAtendimento={atendimento.numeroAtendimento}
      dataHora={atendimento.createdAt}
      autoImprimir={auto !== '0' && auto !== 'false'}
    />
  );
}
