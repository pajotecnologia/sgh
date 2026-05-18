// app/(dashboard)/recepcao/imprimir/[atendimentoId]/page.tsx
// Ficha de urgência — preenchida conforme triagem/prontuário forem sendo registrados. Parâmetro = número do atendimento.

import { FichaAtendimentoImpressao } from '@/components/ficha/FichaAtendimentoImpressao';

export default async function ImprimirFichaPage({
  params,
}: {
  params: Promise<{ atendimentoId: string }>;
}) {
  const { atendimentoId } = await params;
  return <FichaAtendimentoImpressao buscaPor="numeroAtendimento" valor={atendimentoId} />;
}
