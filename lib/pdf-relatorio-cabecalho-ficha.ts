// lib/pdf-relatorio-cabecalho-ficha.ts
// Cabeçalho PDF alinhado ao topo da ficha de urgência + rodapé PAJO Tecnologia (relatórios).

import type { PDFDocument, PDFFont, PDFImage, PDFPage } from 'pdf-lib';
import { rgb } from 'pdf-lib';

export type InstituicaoRelatorioPdf = {
  nomeMunicipio: string | null;
  nomeInstituicao: string | null;
  logomarcaUrl: string | null;
  endereco: string | null;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
  cep: string | null;
};

function absolutizeAssetUrl(url: string): string | null {
  const u = url.trim();
  if (!u) return null;
  if (u.startsWith('http://') || u.startsWith('https://')) return u;
  const base = (process.env.NEXTAUTH_URL || process.env.VERCEL_URL || '').replace(/\/$/, '');
  if (!base) return null;
  return u.startsWith('/') ? `${base}${u}` : `${base}/${u}`;
}

function linhaEndereco(inst: InstituicaoRelatorioPdf): string {
  const partes = [
    inst.endereco,
    inst.bairro,
    [inst.cidade, inst.estado].filter(Boolean).join('/') || null,
    inst.cep ? `CEP ${inst.cep}` : null,
  ].filter(Boolean) as string[];
  return partes.length ? partes.join(' — ') : 'Endereço da unidade não cadastrado em Configurações.';
}

/** Distância a partir do TOPO → coordenada Y (pdf-lib, origem em baixo). */
function yFromTop(page: PDFPage, fromTop: number): number {
  return page.getHeight() - fromTop;
}

async function carregarImagemLogo(pdf: PDFDocument, url: string | null): Promise<PDFImage | null> {
  const abs = url ? absolutizeAssetUrl(url) : null;
  if (!abs) return null;
  try {
    const res = await fetch(abs, { cache: 'no-store' });
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    const u8 = new Uint8Array(buf);
    try {
      return await pdf.embedPng(u8);
    } catch {
      return await pdf.embedJpg(u8);
    }
  } catch {
    return null;
  }
}

/**
 * Cabeçalho no arranjo da ficha (logo | unidade | caixa) + faixa cinza.
 * @returns Y (pdf-lib) onde o corpo do relatório deve começar.
 */
export async function drawCabecalhoEstiloFicha(
  pdf: PDFDocument,
  page: PDFPage,
  font: PDFFont,
  fontBold: PDFFont,
  inst: InstituicaoRelatorioPdf,
  opts: {
    rightBoxLabel: string;
    rightBoxMain: string;
    rightBoxSub: string;
    faixaTexto: string;
  }
): Promise<number> {
  const W = page.getWidth();
  const margin = 36;
  const logoSize = 72;
  const rightW = 78;
  const rightX = W - margin - rightW;
  const logoX = margin;
  const topStart = 36;
  const black = rgb(0, 0, 0);
  const grayFill = rgb(0.88, 0.88, 0.9);
  const grayBand = rgb(0.82, 0.82, 0.85);

  const logoBottomPdf = yFromTop(page, topStart + logoSize);

  page.drawRectangle({
    x: logoX,
    y: logoBottomPdf,
    width: logoSize,
    height: logoSize,
    borderColor: black,
    borderWidth: 1,
    color: rgb(1, 1, 1),
  });

  const logoImg = await carregarImagemLogo(pdf, inst.logomarcaUrl);
  if (logoImg) {
    page.drawImage(logoImg, {
      x: logoX,
      y: logoBottomPdf,
      width: logoSize,
      height: logoSize,
    });
    page.drawRectangle({
      x: logoX,
      y: logoBottomPdf,
      width: logoSize,
      height: logoSize,
      borderColor: black,
      borderWidth: 1,
    });
  } else {
    page.drawRectangle({
      x: logoX,
      y: logoBottomPdf,
      width: logoSize,
      height: logoSize,
      borderColor: black,
      borderWidth: 1,
      color: rgb(0.93, 0.93, 0.94),
    });
    page.drawText('Sem logomarca', {
      x: logoX + 6,
      y: logoBottomPdf + logoSize / 2 - 3,
      size: 6,
      font,
      color: rgb(0.35, 0.35, 0.38),
      maxWidth: logoSize - 12,
    });
  }

  const centerX = logoX + logoSize + 14;
  const centerW = Math.max(100, rightX - centerX - 10);
  let fromTop = topStart + 11;
  const municipio = inst.nomeMunicipio?.trim() || 'Município / Secretaria não configurados';
  page.drawText(municipio, {
    x: centerX,
    y: yFromTop(page, fromTop),
    size: 11,
    font: fontBold,
    color: black,
    maxWidth: centerW,
  });
  fromTop += 13;
  const nomeInst = inst.nomeInstituicao?.trim() || 'Instituição não configurada';
  page.drawText(nomeInst, {
    x: centerX,
    y: yFromTop(page, fromTop),
    size: 9,
    font: fontBold,
    color: black,
    maxWidth: centerW,
  });
  fromTop += 11;
  page.drawText(linhaEndereco(inst), {
    x: centerX,
    y: yFromTop(page, fromTop),
    size: 8,
    font,
    color: black,
    maxWidth: centerW,
  });

  const boxH = 46;
  const boxBottomPdf = yFromTop(page, topStart + boxH);
  page.drawRectangle({
    x: rightX,
    y: boxBottomPdf,
    width: rightW,
    height: boxH,
    borderColor: black,
    borderWidth: 2,
    color: grayFill,
  });
  page.drawText(opts.rightBoxLabel.toUpperCase(), {
    x: rightX + 4,
    y: yFromTop(page, topStart + 12),
    size: 7,
    font: fontBold,
    color: black,
    maxWidth: rightW - 8,
  });
  page.drawText(opts.rightBoxMain, {
    x: rightX + 4,
    y: yFromTop(page, topStart + 26),
    size: 9,
    font: fontBold,
    color: black,
    maxWidth: rightW - 8,
  });
  page.drawText(opts.rightBoxSub, {
    x: rightX,
    y: yFromTop(page, topStart + boxH + 6),
    size: 7,
    font,
    color: black,
    maxWidth: rightW + 40,
  });

  const bandTop = topStart + logoSize + 8;
  const bandH = 16;
  page.drawRectangle({
    x: margin,
    y: yFromTop(page, bandTop + bandH),
    width: W - margin * 2,
    height: bandH,
    borderColor: black,
    borderWidth: 2,
    color: grayBand,
  });
  const faixa = opts.faixaTexto.toUpperCase();
  const faixaW = fontBold.widthOfTextAtSize(faixa, 10);
  page.drawText(faixa, {
    x: margin + (W - margin * 2 - faixaW) / 2,
    y: yFromTop(page, bandTop + bandH / 2 + 3),
    size: 10,
    font: fontBold,
    color: black,
  });

  const bodyStartFromTop = bandTop + bandH + 14;
  return yFromTop(page, bodyStartFromTop);
}

export function drawRodapePajoTecnologia(page: PDFPage, font: PDFFont) {
  const W = page.getWidth();
  const texto = 'PAJO Tecnologia';
  const size = 6.5;
  const cor = rgb(0.38, 0.38, 0.42);
  const tw = font.widthOfTextAtSize(texto, size);
  page.drawText(texto, {
    x: (W - tw) / 2,
    y: 22,
    size,
    font,
    color: cor,
  });
}
