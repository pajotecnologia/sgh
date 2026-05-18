// POST — Anexar PDF de resultado a um item de requisição de exames

import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { v4 as uuidv4 } from 'uuid';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const ROLES = ['ADMIN', 'MEDICO', 'DIRETOR_CLINICO', 'ENFERMEIRO', 'TECNICO_ENFERMAGEM'] as const;
const MAX_BYTES = 12 * 1024 * 1024;

function isPdfBuffer(buf: Buffer): boolean {
  return buf.length >= 5 && buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46 && buf[4] === 0x2d;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ atendimentoId: string; itemId: string }> }
) {
  const { atendimentoId, itemId } = await params;
  const sessao = await getServerSession(authOptions);
  if (!sessao) return NextResponse.json({ sucesso: false, erro: 'Não autorizado.' }, { status: 401 });
  if (!ROLES.includes(sessao.usuario.role as (typeof ROLES)[number])) {
    return NextResponse.json({ sucesso: false, erro: 'Sem permissão.' }, { status: 403 });
  }

  try {
    const ct = req.headers.get('content-type') ?? '';
    if (!ct.includes('multipart/form-data')) {
      return NextResponse.json({ sucesso: false, erro: 'Use multipart/form-data.' }, { status: 400 });
    }

    const form = await req.formData();
    const file = form.get('arquivo');
    const realizadoEmRaw = (form.get('realizadoEm') as string | null)?.trim() ?? '';

    if (!(file instanceof File)) {
      return NextResponse.json({ sucesso: false, erro: 'Campo "arquivo" (PDF) obrigatório.' }, { status: 400 });
    }
    if (file.size < 1 || file.size > MAX_BYTES) {
      return NextResponse.json({ sucesso: false, erro: 'Arquivo vazio ou acima do limite (12 MB).' }, { status: 400 });
    }
    const nome = file.name?.toLowerCase() ?? '';
    if (!nome.endsWith('.pdf')) {
      return NextResponse.json({ sucesso: false, erro: 'Apenas ficheiros .pdf são aceites.' }, { status: 400 });
    }

    const arrayBuf = await file.arrayBuffer();
    const buf = Buffer.from(arrayBuf);
    if (!isPdfBuffer(buf)) {
      return NextResponse.json({ sucesso: false, erro: 'O ficheiro não parece ser um PDF válido.' }, { status: 400 });
    }

    const item = await prisma.itemRequisicao.findFirst({
      where: { id: itemId },
      include: {
        requisicao: {
          include: {
            prontuario: { select: { atendimentoId: true } },
          },
        },
      },
    });

    if (!item || item.requisicao.prontuario.atendimentoId !== atendimentoId) {
      return NextResponse.json({ sucesso: false, erro: 'Item não encontrado neste atendimento.' }, { status: 404 });
    }

    const quando = realizadoEmRaw ? new Date(realizadoEmRaw) : new Date();
    if (Number.isNaN(quando.getTime())) {
      return NextResponse.json({ sucesso: false, erro: 'Data/hora de realização inválida.' }, { status: 400 });
    }

    const dir = path.join(process.cwd(), 'public', 'uploads', 'exames');
    await mkdir(dir, { recursive: true });
    const fname = `${uuidv4()}.pdf`;
    const diskPath = path.join(dir, fname);
    await writeFile(diskPath, buf);

    const publicPath = `/uploads/exames/${fname}`;

    const atualizado = await prisma.itemRequisicao.update({
      where: { id: itemId },
      data: {
        resultadoPdf: publicPath,
        realizadoEm: quando,
      },
    });

    await prisma.logAuditoria.create({
      data: {
        usuarioId: sessao.usuario.id,
        acao: 'ATUALIZACAO',
        entidade: 'ItemRequisicao',
        entidadeId: itemId,
        valorNovo: `PDF resultado exame (${item.nomeExame})`,
        ipOrigem: req.headers.get('x-forwarded-for') ?? null,
      },
    });

    return NextResponse.json({
      sucesso: true,
      dados: {
        id: atualizado.id,
        resultadoPdf: atualizado.resultadoPdf,
        realizadoEm: atualizado.realizadoEm,
      },
    });
  } catch (erro) {
    console.error('[POST exames/item/pdf]', erro);
    return NextResponse.json({ sucesso: false, erro: 'Erro interno.' }, { status: 500 });
  }
}
