// app/api/farmacia/sinonimos/gerar-automaticos/route.ts
// Geração Automática em Massa de Sinônimos e Marcas Oficiais para Medicamentos Cadastrados

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { CATALOGO_OFICIAL_COMPLETO } from '@/lib/catalogo-oficial-dados';
import { normalizarSinonimoParaBanco } from '@/lib/medicamento-catalogo-match';
import { auditarLgpd } from '@/lib/auditoria-lgpd';

const ROLES_ESCRITA = ['ADMIN', 'FARMACEUTICO'] as const;

function normalizarTexto(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function POST(req: NextRequest) {
  const sessao = await getServerSession(authOptions);
  if (!sessao) {
    return NextResponse.json({ sucesso: false, erro: 'Não autorizado.' }, { status: 401 });
  }

  if (!ROLES_ESCRITA.includes(sessao.usuario.role as (typeof ROLES_ESCRITA)[number])) {
    return NextResponse.json({ sucesso: false, erro: 'Sem permissão.' }, { status: 403 });
  }

  try {
    const medicamentos = await prisma.tbMedicamento.findMany({
      where: { ativo: true },
      include: { sinonimos: true },
    });

    let contSinonimosCriados = 0;
    let contMedicamentosVinculados = 0;

    for (const med of medicamentos) {
      const medNomeNorm = normalizarTexto(med.nome);
      const medPrincipioNorm = normalizarTexto(med.principioAtivo);

      // Encontra itens de referência do catálogo oficial que correspondam a este medicamento
      const correspondentes = CATALOGO_OFICIAL_COMPLETO.filter((item) => {
        const itemNomeNorm = normalizarTexto(item.nome);
        const itemPrincipioNorm = normalizarTexto(item.principioAtivo);

        // Correspondência por princípio ativo ou por código ANVISA / EAN
        if (med.codigoAnvisa && item.codigoAnvisa && med.codigoAnvisa === item.codigoAnvisa) return true;
        if (med.codigoEan && item.codigoEan && med.codigoEan === item.codigoEan) return true;
        if (medPrincipioNorm && itemPrincipioNorm && (medPrincipioNorm.includes(itemPrincipioNorm) || itemPrincipioNorm.includes(medPrincipioNorm))) return true;
        if (medNomeNorm && itemNomeNorm && (medNomeNorm.includes(itemNomeNorm) || itemNomeNorm.includes(medNomeNorm))) return true;

        return false;
      });

      let vinculouAlgum = false;

      for (const itemRef of correspondentes) {
        if (!itemRef.sinonimos || itemRef.sinonimos.length === 0) continue;

        for (const sinTexto of itemRef.sinonimos) {
          const sinNorm = normalizarSinonimoParaBanco(sinTexto);
          if (!sinNorm) continue;

          // Verifica se este medicamento já possui este sinônimo
          const jaExiste = med.sinonimos.some((s) => s.sinonimoNorm === sinNorm);
          if (jaExiste) continue;

          const jaExisteBanco = await prisma.tbMedicamentoSinonimo.findFirst({
            where: {
              medicamentoId: med.id,
              sinonimoNorm: sinNorm,
            },
          });

          if (!jaExisteBanco) {
            await prisma.tbMedicamentoSinonimo.create({
              data: {
                medicamentoId: med.id,
                sinonimo: sinTexto.trim(),
                sinonimoNorm: sinNorm,
                ativo: true,
              },
            });
            contSinonimosCriados++;
            vinculouAlgum = true;
          }
        }
      }

      if (vinculouAlgum) {
        contMedicamentosVinculados++;
      }
    }

    await auditarLgpd({
      usuarioId: sessao.usuario.id,
      role: sessao.usuario.role as never,
      atendimentoId: null,
      acao: 'CRIACAO',
      entidade: 'TbMedicamentoSinonimo_GeracaoAutomatica',
      entidadeId: null,
      ipOrigem: req.headers.get('x-forwarded-for') ?? null,
      userAgent: req.headers.get('user-agent') ?? null,
      detalhes: {
        medicamentosAnalisados: medicamentos.length,
        medicamentosVinculados: contMedicamentosVinculados,
        sinonimosCriados: contSinonimosCriados,
      },
    });

    return NextResponse.json({
      sucesso: true,
      mensagem: `${contSinonimosCriados} sinônimo(s) gerado(s) com sucesso para ${contMedicamentosVinculados} medicamento(s)!`,
      dados: {
        sinonimosCriados: contSinonimosCriados,
        medicamentosVinculados: contMedicamentosVinculados,
        medicamentosAnalisados: medicamentos.length,
      },
    });
  } catch (error) {
    console.error('[POST /api/farmacia/sinonimos/gerar-automaticos]', error);
    return NextResponse.json({ sucesso: false, erro: 'Erro ao gerar sinônimos automáticos.' }, { status: 500 });
  }
}
