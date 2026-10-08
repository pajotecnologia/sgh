// app/(dashboard)/cadastros/kits/page.tsx
// Página de gerenciamento de Kits Automáticos de Insumos e Procedimentos

import type { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { exigirPermissaoMenu } from '@/lib/exigir-permissao-menu';
import { prisma } from '@/lib/prisma';
import { Boxes } from 'lucide-react';
import { GestaoKitsProcedimento, type KitData } from '@/components/cadastros/GestaoKitsProcedimento';
import { garantirKitsHospitalaresPadrao } from '@/lib/cadastros/garantir-kits-padrao';

export const metadata: Metadata = {
  title: 'Kits Automáticos de Insumos e Procedimentos',
};

const ROLES = ['ADMIN', 'FARMACEUTICO', 'DIRETOR_CLINICO', 'ENFERMEIRO'] as const;

export default async function PaginaCadastrosKits() {
  const sessao = await getServerSession(authOptions);
  await exigirPermissaoMenu('cadastros-kits');
  if (!sessao) redirect('/login');
  if (!ROLES.includes(sessao.usuario.role as (typeof ROLES)[number])) redirect('/acesso-negado');

  // Garante a existência dos kits padrão caso seja a primeira execução
  await garantirKitsHospitalaresPadrao();

  const kitsRaw = await prisma.tbKitProcedimento.findMany({
    include: {
      itens: {
        orderBy: { createdAt: 'asc' },
      },
    },
    orderBy: [{ tipoVinculo: 'asc' }, { nome: 'asc' }],
  });

  const kits: KitData[] = kitsRaw.map((k) => ({
    id: k.id,
    codigo: k.codigo,
    nome: k.nome,
    descricao: k.descricao,
    tipoVinculo: k.tipoVinculo,
    viaAdministracao: k.viaAdministracao,
    procedimentoNome: k.procedimentoNome,
    ativo: k.ativo,
    itens: k.itens.map((it) => ({
      id: it.id,
      descricaoItem: it.descricaoItem,
      quantidadePadrao: it.quantidadePadrao,
      unidade: it.unidade ?? 'UN',
      obrigatorio: it.obrigatorio,
    })),
  }));

  return (
    <div className="max-w-6xl mx-auto space-y-6 w-full min-w-0 pb-10">
      {/* Cabeçalho */}
      <div className="min-w-0 bg-card p-5 rounded-2xl border border-border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-base font-bold text-foreground flex items-center gap-2">
            <Boxes className="h-5 w-5 text-primary shrink-0" aria-hidden />
            <span>Kits Automáticos de Insumos e Procedimentos</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Configuração de kits de dispensação automática por via de administração (EV, IM, SC) e procedimentos de enfermagem (curativos, sondagens, punções).
          </p>
        </div>
      </div>

      <GestaoKitsProcedimento kitsIniciais={kits} />
    </div>
  );
}
