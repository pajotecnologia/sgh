// GET — PDF com lista de atendimentos criados num dia civil (timezone do servidor)
// Cabeçalho no padrão da ficha institucional + rodapé PAJO Tecnologia.

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  drawCabecalhoEstiloFicha,
  drawRodapePajoTecnologia,
  type InstituicaoRelatorioPdf,
} from '@/lib/pdf-relatorio-cabecalho-ficha';

const DATA_RE = /^\d{4}-\d{2}-\d{2}$/;
const FOOTER_RESERVE = 40;
const PAGE_MARGIN = 48;

function intervaloDiaLocal(dataStr: string): { inicio: Date; fim: Date } {
  const [y, m, d] = dataStr.split('-').map((x) => parseInt(x, 10));
  if (!y || m < 1 || m > 12 || d < 1 || d > 31) {
    throw new Error('data inválida');
  }
  const inicio = new Date(y, m - 1, d, 0, 0, 0, 0);
  const fim = new Date(y, m - 1, d + 1, 0, 0, 0, 0);
  if (Number.isNaN(inicio.getTime()) || Number.isNaN(fim.getTime())) {
    throw new Error('data inválida');
  }
  return { inicio, fim };
}

export async function GET(req: NextRequest) {
  const sessao = await getServerSession(authOptions);
  if (!sessao) return NextResponse.json({ sucesso: false, erro: 'Não autorizado.' }, { status: 401 });
  if (!['ADMIN', 'DIRETOR_CLINICO'].includes(sessao.usuario.role)) {
    return NextResponse.json({ sucesso: false, erro: 'Sem permissão.' }, { status: 403 });
  }

  const dataStr = req.nextUrl.searchParams.get('data')?.trim() ?? '';
  if (!DATA_RE.test(dataStr)) {
    return NextResponse.json(
      { sucesso: false, erro: 'Parâmetro "data" obrigatório no formato YYYY-MM-DD.' },
      { status: 400 }
    );
  }

  let inicio: Date;
  let fim: Date;
  try {
    ({ inicio, fim } = intervaloDiaLocal(dataStr));
  } catch {
    return NextResponse.json({ sucesso: false, erro: 'Data inválida.' }, { status: 400 });
  }

  try {
    const [lista, instRow] = await Promise.all([
      prisma.atendimento.findMany({
        where: {
          deletedAt: null,
          createdAt: { gte: inicio, lt: fim },
        },
        orderBy: { createdAt: 'asc' },
        select: {
          numeroAtendimento: true,
          status: true,
          setor: true,
          sala: true,
          createdAt: true,
          paciente: { select: { nomeExibicao: true } },
        },
      }),
      prisma.instituicao.findFirst(),
    ]);

    const inst: InstituicaoRelatorioPdf = {
      nomeMunicipio: instRow?.nomeMunicipio ?? null,
      nomeInstituicao: instRow?.nomeInstituicao ?? null,
      logomarcaUrl: instRow?.logomarcaUrl ?? null,
      endereco: instRow?.endereco ?? null,
      bairro: instRow?.bairro ?? null,
      cidade: instRow?.cidade ?? null,
      estado: instRow?.estado ?? null,
      cep: instRow?.cep ?? null,
    };

    const pdf = await PDFDocument.create();
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);
    const bodySize = 9;
    const titleLineSize = 10;

    const pageW = 595.28;
    const pageH = 841.89;
    let page = pdf.addPage([pageW, pageH]);

    const emitidoFmt = new Date().toLocaleString('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
    });

    let y = await drawCabecalhoEstiloFicha(pdf, page, font, fontBold, inst, {
      rightBoxLabel: 'Relatório',
      rightBoxMain: dataStr,
      rightBoxSub: `Emitido: ${emitidoFmt}`,
      faixaTexto: 'Atendimentos do dia',
    });

    y -= 8;
    page.drawText(`Total de atendimentos na data: ${lista.length}`, {
      x: PAGE_MARGIN,
      y,
      size: titleLineSize,
      font: fontBold,
      color: rgb(0.1, 0.1, 0.14),
    });
    y -= titleLineSize + 14;

    const drawLines = (lines: string[]) => {
      const altura = lines.length * (bodySize + 3) + 10;
      if (y - altura < PAGE_MARGIN + FOOTER_RESERVE) {
        page = pdf.addPage([pageW, pageH]);
        y = pageH - PAGE_MARGIN;
      }
      for (const line of lines) {
        page.drawText(line, {
          x: PAGE_MARGIN,
          y,
          size: bodySize,
          font,
          color: rgb(0.1, 0.1, 0.12),
          maxWidth: pageW - PAGE_MARGIN * 2,
        });
        y -= bodySize + 3;
      }
      y -= 8;
    };

    if (lista.length === 0) {
      drawLines(['Nenhum atendimento registado neste dia.']);
    } else {
      for (const a of lista) {
        const hora = a.createdAt.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
        const setor = a.setor?.trim() || '—';
        const sala = a.sala?.trim() || '—';
        drawLines([
          `${a.numeroAtendimento}  |  ${a.paciente.nomeExibicao}`,
          `Status: ${a.status}  ·  Setor: ${setor}  ·  Sala: ${sala}`,
          `Aberto em: ${hora}`,
          '—'.repeat(76),
        ]);
      }
    }

    for (const p of pdf.getPages()) {
      drawRodapePajoTecnologia(p, font);
    }

    const bytes = await pdf.save();
    const fname = `atendimentos-${dataStr}.pdf`;

    return new NextResponse(Buffer.from(bytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fname}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (erro) {
    console.error('[GET relatorios/atendimentos-dia]', erro);
    return NextResponse.json({ sucesso: false, erro: 'Erro interno.' }, { status: 500 });
  }
}
