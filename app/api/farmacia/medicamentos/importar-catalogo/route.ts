// app/api/farmacia/medicamentos/importar-catalogo/route.ts
// Importação e Carga em Lote do Catálogo Oficial (ANVISA / CMED / CATMAT) + Geração Automática de Sinônimos

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { CATALOGO_OFICIAL_COMPLETO } from '@/lib/catalogo-oficial-dados';
import { normalizarSinonimoParaBanco } from '@/lib/medicamento-catalogo-match';
import { auditarLgpd } from '@/lib/auditoria-lgpd';

const ROLES_ESCRITA = ['ADMIN', 'FARMACEUTICO'] as const;

export async function POST(req: NextRequest) {
  const sessao = await getServerSession(authOptions);
  if (!sessao) {
    return NextResponse.json({ sucesso: false, erro: 'Não autorizado.' }, { status: 401 });
  }

  if (!ROLES_ESCRITA.includes(sessao.usuario.role as (typeof ROLES_ESCRITA)[number])) {
    return NextResponse.json({ sucesso: false, erro: 'Sem permissão para importar catálogo.' }, { status: 403 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const categoriaFiltro = body.categoria || 'TODOS'; // 'TODOS' | 'MEDICAMENTO' | 'MATERIAL'

    const itensParaImportar = CATALOGO_OFICIAL_COMPLETO.filter((item) => {
      if (categoriaFiltro === 'MEDICAMENTO' && item.tipoItem !== 'MEDICAMENTO') return false;
      if (categoriaFiltro === 'MATERIAL' && item.tipoItem !== 'MATERIAL') return false;
      return true;
    });

    let contMedicamentos = 0;
    let contMateriais = 0;
    let contSinonimos = 0;

    for (const item of itensParaImportar) {
      // 1. Verifica se o item já existe pelo nome ou código ANVISA/CATMAT ou EAN
      let existente = await prisma.tbMedicamento.findFirst({
        where: {
          OR: [
            { nome: { equals: item.nome, mode: 'insensitive' } },
            ...(item.codigoAnvisa ? [{ codigoAnvisa: item.codigoAnvisa }] : []),
            ...(item.codigoEan ? [{ codigoEan: item.codigoEan }] : []),
          ],
        },
      });

      if (!existente) {
        existente = await prisma.tbMedicamento.create({
          data: {
            nome: item.nome,
            principioAtivo: item.principioAtivo,
            forma: item.forma || null,
            concentracao: item.concentracao || null,
            unidade: item.unidade || null,
            codigoEan: item.codigoEan || null,
            codigoAnvisa: item.codigoAnvisa || null,
            classeTerapeutica: item.classeTerapeutica || null,
            viaAdministracao: item.viaAdministracao || null,
            mav: item.mav ?? false,
            duplaChecagem: item.duplaChecagem ?? false,
            tipoControle: item.tipoControle || null,
            saldoAtual: 0,
            estoqueMinimo: item.estoqueMinimoSugerido ?? 10,
            ativo: true,
          },
        });

        if (item.tipoItem === 'MEDICAMENTO') {
          contMedicamentos++;
        } else {
          contMateriais++;
        }
      }

      // 2. Criação automática de sinônimos oficiais vinculados
      if (item.sinonimos && item.sinonimos.length > 0 && existente) {
        for (const sinTexto of item.sinonimos) {
          const sinNorm = normalizarSinonimoParaBanco(sinTexto);
          if (!sinNorm) continue;

          const jaExisteSin = await prisma.tbMedicamentoSinonimo.findFirst({
            where: {
              medicamentoId: existente.id,
              sinonimoNorm: sinNorm,
            },
          });

          if (!jaExisteSin) {
            await prisma.tbMedicamentoSinonimo.create({
              data: {
                medicamentoId: existente.id,
                sinonimo: sinTexto.trim(),
                sinonimoNorm: sinNorm,
                ativo: true,
              },
            });
            contSinonimos++;
          }
        }
      }
    }

    await auditarLgpd({
      usuarioId: sessao.usuario.id,
      role: sessao.usuario.role as never,
      atendimentoId: null,
      acao: 'CRIACAO',
      entidade: 'TbMedicamento_CatalogoOficial',
      entidadeId: null,
      ipOrigem: req.headers.get('x-forwarded-for') ?? null,
      userAgent: req.headers.get('user-agent') ?? null,
      detalhes: {
        categoriaFiltro,
        medicamentosImportados: contMedicamentos,
        materiaisImportados: contMateriais,
        sinonimosCriados: contSinonimos,
      },
    });

    return NextResponse.json({
      sucesso: true,
      mensagem: 'Catálogo oficial importado com sucesso!',
      dados: {
        medicamentosNovos: contMedicamentos,
        materiaisNovos: contMateriais,
        sinonimosNovos: contSinonimos,
        totalProcessado: itensParaImportar.length,
      },
    });
  } catch (error) {
    console.error('[POST /api/farmacia/medicamentos/importar-catalogo]', error);
    return NextResponse.json({ sucesso: false, erro: 'Falha ao importar catálogo oficial.' }, { status: 500 });
  }
}
