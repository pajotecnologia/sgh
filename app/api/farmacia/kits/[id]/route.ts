// app/api/farmacia/kits/[id]/route.ts
// Operações individuais de consulta, atualização e exclusão de kits

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const ROLES_LEITURA = ['ADMIN', 'FARMACEUTICO', 'MEDICO', 'DIRETOR_CLINICO', 'ENFERMEIRO', 'TECNICO_ENFERMAGEM'] as const;
const ROLES_ESCRITA = ['ADMIN', 'FARMACEUTICO', 'DIRETOR_CLINICO', 'ENFERMEIRO'] as const;

const schemaItem = z.object({
  id: z.string().uuid().optional(),
  descricaoItem: z.string().min(2).max(180),
  quantidadePadrao: z.number().int().min(1).default(1),
  unidade: z.string().max(30).default('UN'),
  medicamentoId: z.string().uuid().optional().nullable(),
  obrigatorio: z.boolean().default(true),
});

const schemaAtualizarKit = z.object({
  codigo: z.string().max(40).optional().nullable(),
  nome: z.string().min(3).max(150),
  descricao: z.string().max(500).optional().nullable(),
  tipoVinculo: z.enum(['VIA_ADMINISTRACAO', 'PROCEDIMENTO']),
  viaAdministracao: z.string().max(50).optional().nullable(),
  procedimentoNome: z.string().max(120).optional().nullable(),
  ativo: z.boolean().default(true),
  itens: z.array(schemaItem).min(1, 'O kit deve conter pelo menos 1 item.'),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const sessao = await getServerSession(authOptions);
  if (!sessao) return NextResponse.json({ sucesso: false, erro: 'Não autorizado.' }, { status: 401 });
  if (!ROLES_LEITURA.includes(sessao.usuario.role as (typeof ROLES_LEITURA)[number])) {
    return NextResponse.json({ sucesso: false, erro: 'Sem permissão.' }, { status: 403 });
  }

  try {
    const kit = await prisma.tbKitProcedimento.findUnique({
      where: { id },
      include: {
        itens: {
          orderBy: { createdAt: 'asc' },
          include: {
            medicamento: {
              select: {
                id: true,
                nome: true,
                saldoAtual: true,
                unidade: true,
              },
            },
          },
        },
      },
    });

    if (!kit) {
      return NextResponse.json({ sucesso: false, erro: 'Kit não encontrado.' }, { status: 404 });
    }

    return NextResponse.json({ sucesso: true, dados: kit });
  } catch (e) {
    console.error('[GET /api/farmacia/kits/[id]]', e);
    return NextResponse.json({ sucesso: false, erro: 'Erro interno.' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const sessao = await getServerSession(authOptions);
  if (!sessao) return NextResponse.json({ sucesso: false, erro: 'Não autorizado.' }, { status: 401 });
  if (!ROLES_ESCRITA.includes(sessao.usuario.role as (typeof ROLES_ESCRITA)[number])) {
    return NextResponse.json({ sucesso: false, erro: 'Sem permissão.' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const validacao = schemaAtualizarKit.safeParse(body);
    if (!validacao.success) {
      return NextResponse.json(
        { sucesso: false, erro: 'Dados inválidos.', detalhes: validacao.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const d = validacao.data;

    // Atualiza o kit e recria a lista de itens de forma atômica
    const kitAtualizado = await prisma.$transaction(async (tx) => {
      await tx.tbKitProcedimentoItem.deleteMany({ where: { kitId: id } });

      return tx.tbKitProcedimento.update({
        where: { id },
        data: {
          codigo: d.codigo?.trim() || null,
          nome: d.nome.trim(),
          descricao: d.descricao?.trim() || null,
          tipoVinculo: d.tipoVinculo,
          viaAdministracao: d.viaAdministracao?.trim() || null,
          procedimentoNome: d.procedimentoNome?.trim() || null,
          ativo: d.ativo,
          itens: {
            create: d.itens.map((it) => ({
              descricaoItem: it.descricaoItem.trim(),
              quantidadePadrao: it.quantidadePadrao,
              unidade: it.unidade.trim(),
              medicamentoId: it.medicamentoId || null,
              obrigatorio: it.obrigatorio,
            })),
          },
        },
        include: { itens: true },
      });
    });

    return NextResponse.json({ sucesso: true, dados: kitAtualizado });
  } catch (e) {
    console.error('[PUT /api/farmacia/kits/[id]]', e);
    return NextResponse.json({ sucesso: false, erro: 'Erro interno ao atualizar kit.' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const sessao = await getServerSession(authOptions);
  if (!sessao) return NextResponse.json({ sucesso: false, erro: 'Não autorizado.' }, { status: 401 });
  if (!ROLES_ESCRITA.includes(sessao.usuario.role as (typeof ROLES_ESCRITA)[number])) {
    return NextResponse.json({ sucesso: false, erro: 'Sem permissão.' }, { status: 403 });
  }

  try {
    await prisma.tbKitProcedimento.delete({
      where: { id },
    });

    return NextResponse.json({ sucesso: true });
  } catch (e) {
    console.error('[DELETE /api/farmacia/kits/[id]]', e);
    return NextResponse.json({ sucesso: false, erro: 'Erro ao excluir kit.' }, { status: 500 });
  }
}
