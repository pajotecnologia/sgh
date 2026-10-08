// app/api/farmacia/kits/route.ts
// API de consulta e cadastro de kits automáticos de procedimentos e materiais

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { garantirKitsHospitalaresPadrao } from '@/lib/cadastros/garantir-kits-padrao';

const ROLES_LEITURA = ['ADMIN', 'FARMACEUTICO', 'MEDICO', 'DIRETOR_CLINICO', 'ENFERMEIRO', 'TECNICO_ENFERMAGEM'] as const;
const ROLES_ESCRITA = ['ADMIN', 'FARMACEUTICO', 'DIRETOR_CLINICO', 'ENFERMEIRO'] as const;

const schemaItem = z.object({
  descricaoItem: z.string().min(2).max(180),
  quantidadePadrao: z.number().int().min(1).default(1),
  unidade: z.string().max(30).default('UN'),
  medicamentoId: z.string().uuid().optional().nullable(),
  obrigatorio: z.boolean().default(true),
});

const schemaCriarKit = z.object({
  codigo: z.string().max(40).optional().nullable(),
  nome: z.string().min(3).max(150),
  descricao: z.string().max(500).optional().nullable(),
  tipoVinculo: z.enum(['VIA_ADMINISTRACAO', 'PROCEDIMENTO']).default('PROCEDIMENTO'),
  viaAdministracao: z.string().max(50).optional().nullable(),
  procedimentoNome: z.string().max(120).optional().nullable(),
  ativo: z.boolean().default(true),
  itens: z.array(schemaItem).min(1, 'O kit deve conter pelo menos 1 item.'),
});

export async function GET(req: NextRequest) {
  const sessao = await getServerSession(authOptions);
  if (!sessao) return NextResponse.json({ sucesso: false, erro: 'Não autorizado.' }, { status: 401 });
  if (!ROLES_LEITURA.includes(sessao.usuario.role as (typeof ROLES_LEITURA)[number])) {
    return NextResponse.json({ sucesso: false, erro: 'Sem permissão.' }, { status: 403 });
  }

  try {
    // Garante kits padrão se banco estiver vazio
    await garantirKitsHospitalaresPadrao();

    const url = new URL(req.url);
    const q = (url.searchParams.get('q') ?? '').trim();
    const via = (url.searchParams.get('via') ?? '').trim();
    const tipoVinculo = (url.searchParams.get('tipoVinculo') ?? '').trim();
    const apenasAtivos = (url.searchParams.get('ativo') ?? 'true').trim() !== 'false';

    const kits = await prisma.tbKitProcedimento.findMany({
      where: {
        ...(apenasAtivos ? { ativo: true } : {}),
        ...(via ? { viaAdministracao: via } : {}),
        ...(tipoVinculo ? { tipoVinculo } : {}),
        ...(q
          ? {
              OR: [
                { nome: { contains: q, mode: 'insensitive' } },
                { codigo: { contains: q, mode: 'insensitive' } },
                { procedimentoNome: { contains: q, mode: 'insensitive' } },
                { descricao: { contains: q, mode: 'insensitive' } },
                {
                  itens: {
                    some: {
                      descricaoItem: { contains: q, mode: 'insensitive' },
                    },
                  },
                },
              ],
            }
          : {}),
      },
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
      orderBy: [{ tipoVinculo: 'asc' }, { nome: 'asc' }],
    });

    return NextResponse.json({ sucesso: true, dados: kits });
  } catch (e) {
    console.error('[GET /api/farmacia/kits]', e);
    return NextResponse.json({ sucesso: false, erro: 'Erro interno ao consultar kits.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const sessao = await getServerSession(authOptions);
  if (!sessao) return NextResponse.json({ sucesso: false, erro: 'Não autorizado.' }, { status: 401 });
  if (!ROLES_ESCRITA.includes(sessao.usuario.role as (typeof ROLES_ESCRITA)[number])) {
    return NextResponse.json({ sucesso: false, erro: 'Sem permissão para cadastrar kits.' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const validacao = schemaCriarKit.safeParse(body);
    if (!validacao.success) {
      return NextResponse.json(
        { sucesso: false, erro: 'Dados inválidos.', detalhes: validacao.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const d = validacao.data;
    const kitCriado = await prisma.tbKitProcedimento.create({
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
      include: {
        itens: true,
      },
    });

    return NextResponse.json({ sucesso: true, dados: kitCriado }, { status: 201 });
  } catch (e) {
    console.error('[POST /api/farmacia/kits]', e);
    return NextResponse.json({ sucesso: false, erro: 'Erro interno ao criar kit.' }, { status: 500 });
  }
}
