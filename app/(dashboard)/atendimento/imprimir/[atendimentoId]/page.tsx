// app/(dashboard)/atendimento/imprimir/[atendimentoId]/page.tsx
// Ficha de urgência preenchida com triagem e prontuário médico (idêntica à recepção; mesmas props).

import { notFound, redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { atendimentoIncludeFichaUrgencia } from '@/lib/montar-dados-ficha-atendimento';
import { FichaAtendimentoImpressaoFromPayload } from '@/components/ficha/FichaAtendimentoImpressao';

export default async function ImprimirFichaAtendimentoMedicoPage({
  params,
}: {
  params: Promise<{ atendimentoId: string }>;
}) {
  const sessao = await getServerSession(authOptions);
  if (!sessao) redirect('/login');

  if (!['ADMIN', 'MEDICO', 'DIRETOR_CLINICO'].includes(sessao.usuario.role)) {
    redirect('/acesso-negado');
  }

  const { atendimentoId } = await params;

  const atendimento = await prisma.atendimento.findFirst({
    where: { id: atendimentoId, deletedAt: null },
    include: atendimentoIncludeFichaUrgencia,
  });

  if (!atendimento) notFound();

  if (sessao.usuario.role === 'MEDICO') {
    const pode =
      !atendimento.medicoId || atendimento.medicoId === sessao.usuario.id;
    if (!pode) redirect('/acesso-negado');
  }

  return <FichaAtendimentoImpressaoFromPayload atendimento={atendimento} />;
}
