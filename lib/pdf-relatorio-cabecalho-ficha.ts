// lib/pdf-relatorio-cabecalho-ficha.ts
// Cabeçalho PDF alinhado ao padrão da instituição + rodapé PAJO Tecnologia.

import fs from 'fs';
import path from 'path';
import type { PDFDocument, PDFFont, PDFImage, PDFPage } from 'pdf-lib';
import { rgb } from 'pdf-lib';

export type InstituicaoRelatorioPdf = {
  nomeMunicipio: string | null;
  nomeInstituicao: string | null;
  logomarcaUrl: string | null;
  cnes?: string | null;
  endereco: string | null;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
  cep: string | null;
};

function linhaEndereco(inst: InstituicaoRelatorioPdf): string {
  const partes = [
    inst.endereco,
    inst.bairro,
    [inst.cidade, inst.estado].filter(Boolean).join('/') || null,
    inst.cep ? `CEP ${inst.cep}` : null,
  ].filter(Boolean) as string[];
  return partes.length ? partes.join(' — ') : 'Endereço da unidade não cadastrado';
}

/** Distância a partir do TOPO → coordenada Y (pdf-lib, origem em baixo). */
function yFromTop(page: PDFPage, fromTop: number): number {
  return page.getHeight() - fromTop;
}

async function carregarImagemLogo(pdf: PDFDocument, url: string | null): Promise<PDFImage | null> {
  if (!url || !url.trim()) return null;
  const u = url.trim();

  try {
    let u8: Uint8Array | null = null;

    // 1. Se for Base64 Data URI (data:image/png;base64,...)
    if (u.startsWith('data:image/')) {
      const parts = u.split(',');
      if (parts.length > 1) {
        const base64Data = parts[1];
        const buf = Buffer.from(base64Data, 'base64');
        u8 = new Uint8Array(buf);
      }
    }

    // 2. Se for um arquivo local no sistema de arquivos (/uploads, /public/uploads, etc.)
    if (!u8 && !u.startsWith('http://') && !u.startsWith('https://')) {
      const cleanPath = u.startsWith('/') ? u.slice(1) : u;
      const possiblePaths = [
        path.join(process.cwd(), 'public', cleanPath),
        path.join(process.cwd(), cleanPath),
      ];
      for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
          const buf = fs.readFileSync(p);
          u8 = new Uint8Array(buf);
          break;
        }
      }
    }

    // 3. Se for URL absoluta HTTP/HTTPS ou se o arquivo local não foi localizado
    if (!u8) {
      let fetchUrl = u;
      if (u.startsWith('/')) {
        const baseUrl = process.env.NEXTAUTH_URL || 'http://127.0.0.1:3000';
        fetchUrl = `${baseUrl.replace(/\/$/, '')}${u}`;
      }
      const res = await fetch(fetchUrl, { cache: 'no-store' });
      if (res.ok) {
        const buf = await res.arrayBuffer();
        u8 = new Uint8Array(buf);
      }
    }

    if (!u8) return null;

    // Embutir na biblioteca pdf-lib
    try {
      return await pdf.embedPng(u8);
    } catch {
      return await pdf.embedJpg(u8);
    }
  } catch (err) {
    console.error('[carregarImagemLogo PDF]', err);
    return null;
  }
}

/**
 * Cabeçalho elegante para relatórios:
 * Logo (Esquerda) | Dados da Instituição (Centro) | Data/Emissão (Direita - sem caixa) + Faixa do Relatório.
 * @returns Y (pdf-lib) onde o corpo do relatório deve começar.
 */
export async function drawCabecalhoEstiloFicha(
  pdf: PDFDocument,
  page: PDFPage,
  font: PDFFont,
  fontBold: PDFFont,
  inst: InstituicaoRelatorioPdf,
  opts: {
    rightBoxLabel?: string;
    rightBoxMain?: string;
    rightBoxSub?: string;
    faixaTexto: string;
  }
): Promise<number> {
  const W = page.getWidth();
  const margin = 36;
  const logoSize = 64;
  const logoX = margin;
  const topStart = 32;
  const black = rgb(0.1, 0.1, 0.14);
  const darkBlue = rgb(0.08, 0.2, 0.45);
  const grayText = rgb(0.35, 0.38, 0.42);
  const grayBand = rgb(0.93, 0.95, 0.98);
  const bandBorder = rgb(0.8, 0.84, 0.9);

  const logoBottomPdf = yFromTop(page, topStart + logoSize);

  const logoImg = await carregarImagemLogo(pdf, inst.logomarcaUrl);
  if (logoImg) {
    page.drawImage(logoImg, {
      x: logoX,
      y: logoBottomPdf,
      width: logoSize,
      height: logoSize,
    });
  } else {
    page.drawRectangle({
      x: logoX,
      y: logoBottomPdf,
      width: logoSize,
      height: logoSize,
      borderColor: rgb(0.85, 0.85, 0.88),
      borderWidth: 1,
      color: rgb(0.96, 0.96, 0.98),
    });
    page.drawText('SGH', {
      x: logoX + (logoSize - fontBold.widthOfTextAtSize('SGH', 10)) / 2,
      y: logoBottomPdf + logoSize / 2 - 4,
      size: 10,
      font: fontBold,
      color: darkBlue,
    });
  }

  const centerX = logoX + logoSize + 14;
  const rightReservedW = 140;
  const centerW = W - margin * 2 - logoSize - 14 - rightReservedW;

  let fromTop = topStart + 8;
  const municipio = inst.nomeMunicipio?.trim() || 'Prefeitura Municipal / Secretaria de Saúde';
  page.drawText(municipio.toUpperCase(), {
    x: centerX,
    y: yFromTop(page, fromTop),
    size: 8.5,
    font: fontBold,
    color: grayText,
    maxWidth: centerW,
  });

  fromTop += 13;
  const nomeInst = inst.nomeInstituicao?.trim() || 'Sistema de Gestão Hospitalar - SGH';
  page.drawText(nomeInst, {
    x: centerX,
    y: yFromTop(page, fromTop),
    size: 11.5,
    font: fontBold,
    color: darkBlue,
    maxWidth: centerW,
  });

  fromTop += 14;
  let endStr = linhaEndereco(inst);
  if (inst.cnes) {
    endStr += ` — CNES: ${inst.cnes}`;
  }
  page.drawText(endStr, {
    x: centerX,
    y: yFromTop(page, fromTop),
    size: 8,
    font,
    color: black,
    maxWidth: centerW + 30,
  });

  // Emissão no lado direito (Texto Limpo sem retângulo)
  const rightX = W - margin;
  let rightFromTop = topStart + 10;
  if (opts.rightBoxMain || opts.rightBoxLabel) {
    const mainTxt = opts.rightBoxMain || opts.rightBoxLabel || '';
    const mainW = fontBold.widthOfTextAtSize(mainTxt, 9);
    page.drawText(mainTxt, {
      x: rightX - mainW,
      y: yFromTop(page, rightFromTop),
      size: 9,
      font: fontBold,
      color: darkBlue,
    });
    rightFromTop += 12;
  }

  if (opts.rightBoxSub) {
    const subTxt = opts.rightBoxSub;
    const subW = font.widthOfTextAtSize(subTxt, 7.5);
    page.drawText(subTxt, {
      x: rightX - subW,
      y: yFromTop(page, rightFromTop),
      size: 7.5,
      font,
      color: grayText,
    });
  }

  // Faixa de Título do Relatório
  const bandTop = topStart + logoSize + 10;
  const bandH = 20;
  page.drawRectangle({
    x: margin,
    y: yFromTop(page, bandTop + bandH),
    width: W - margin * 2,
    height: bandH,
    borderColor: bandBorder,
    borderWidth: 1,
    color: grayBand,
  });

  const faixa = opts.faixaTexto.toUpperCase();
  const faixaW = fontBold.widthOfTextAtSize(faixa, 10);
  page.drawText(faixa, {
    x: margin + (W - margin * 2 - faixaW) / 2,
    y: yFromTop(page, bandTop + bandH / 2 + 3),
    size: 10,
    font: fontBold,
    color: darkBlue,
  });

  const bodyStartFromTop = bandTop + bandH + 16;
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
    y: 20,
    size,
    font,
    color: cor,
  });
}
