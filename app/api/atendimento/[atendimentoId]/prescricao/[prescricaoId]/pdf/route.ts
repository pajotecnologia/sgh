// app/api/atendimento/[atendimentoId]/prescricao/[prescricaoId]/pdf/route.ts
// Geração de PDF oficial da prescrição médica (com suporte a pdf-lib)

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { drawCabecalhoEstiloFicha, drawRodapePajoTecnologia } from '@/lib/pdf-relatorio-cabecalho-ficha';
import { descriptografarSeguro } from '@/lib/encryption';
import { abreviarViaPrescricao } from '@/lib/relatorio-prescricao-dinamico';

const ROLES = ['ADMIN', 'MEDICO', 'DIRETOR_CLINICO', 'ENFERMEIRO', 'TECNICO_ENFERMAGEM', 'FARMACEUTICO'] as const;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ atendimentoId: string; prescricaoId: string }> }
) {
  const sessao = await getServerSession(authOptions);
  if (!sessao) {
    return NextResponse.json({ sucesso: false, erro: 'Não autorizado.' }, { status: 401 });
  }

  if (!ROLES.includes(sessao.usuario.role as (typeof ROLES)[number])) {
    return NextResponse.json({ sucesso: false, erro: 'Sem permissão.' }, { status: 403 });
  }

  try {
    const { atendimentoId, prescricaoId } = await params;

    const prescricao = await prisma.prescricao.findFirst({
      where: { id: prescricaoId, prontuario: { atendimentoId } },
      include: {
        itens: true,
        prontuario: {
          include: {
            atendimento: {
              include: {
                paciente: true,
                medico: { select: { nome: true, crm: true } },
                leito: { select: { ala: true, quarto: true, codigo: true } },
              },
            },
          },
        },
      },
    });

    if (!prescricao) {
      return NextResponse.json({ sucesso: false, erro: 'Prescrição não encontrada.' }, { status: 404 });
    }

    const instDb = await prisma.instituicao.findFirst();
    const inst = {
      nomeMunicipio: instDb?.nomeMunicipio ?? null,
      nomeInstituicao: instDb?.nomeInstituicao ?? null,
      logomarcaUrl: instDb?.logomarcaUrl ?? null,
      endereco: instDb?.endereco ?? null,
      bairro: instDb?.bairro ?? null,
      cidade: instDb?.cidade ?? null,
      estado: instDb?.estado ?? null,
      cep: instDb?.cep ?? null,
    };

    const doc = await PDFDocument.create();
    const page = doc.addPage([595.28, 841.89]); // Folha A4 (pontos pt)
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

    const atendimento = prescricao.prontuario.atendimento;
    const paciente = atendimento.paciente;
    const nomeCompleto = descriptografarSeguro(paciente.nomeCriptografado) ?? paciente.nomeExibicao;
    const cpf = descriptografarSeguro(paciente.cpfCriptografado) ?? '—';

    let curY = await drawCabecalhoEstiloFicha(doc, page, font, fontBold, inst, {
      rightBoxLabel: 'ATENDIMENTO',
      rightBoxMain: atendimento.numeroAtendimento,
      rightBoxSub: `Prescrição #${prescricao.numeroPrescricao}`,
      faixaTexto: prescricao.tipo === 'RECEITA_ALTA' ? 'RECEITA DE ALTA HOSPITALAR' : 'PRESCRIÇÃO MÉDICA — PS / INTERNAÇÃO',
    });

    const margin = 36;
    const W = page.getWidth();
    const black = rgb(0, 0, 0);

    // Box de Identificação do Paciente
    page.drawRectangle({
      x: margin,
      y: curY - 48,
      width: W - margin * 2,
      height: 48,
      borderColor: rgb(0.7, 0.7, 0.7),
      borderWidth: 1,
      color: rgb(0.96, 0.96, 0.98),
    });

    const dataNascStr = paciente.dataNascimento ? new Date(paciente.dataNascimento).toLocaleDateString('pt-BR') : '—';
    const leitoStr = atendimento.leito ? `${atendimento.leito.ala} - Leito ${atendimento.leito.codigo}` : (atendimento.sala ?? 'Acolhimento/PS');

    page.drawText(`PACIENTE: ${nomeCompleto.toUpperCase()}`, { x: margin + 8, y: curY - 16, size: 9, font: fontBold, color: black });
    page.drawText(`CPF: ${cpf}   |   NASCIMENTO: ${dataNascStr}   |   SEXO: ${paciente.sexoBiologico}`, { x: margin + 8, y: curY - 28, size: 8, font, color: black });
    page.drawText(`SETOR/LEITO: ${leitoStr}   |   EMISSÃO: ${new Date(prescricao.emitidaEm).toLocaleString('pt-BR')}`, { x: margin + 8, y: curY - 40, size: 8, font, color: black });

    curY -= 64;

    // Tabela de Medicamentos
    const colX = { num: margin + 6, med: margin + 28, dose: margin + 220, via: margin + 310, freq: margin + 370 };
    page.drawRectangle({
      x: margin,
      y: curY - 18,
      width: W - margin * 2,
      height: 18,
      color: rgb(0.88, 0.88, 0.92),
      borderColor: black,
      borderWidth: 1,
    });

    page.drawText('#', { x: colX.num, y: curY - 13, size: 8, font: fontBold, color: black });
    page.drawText('MEDICAMENTO / ITEM', { x: colX.med, y: curY - 13, size: 8, font: fontBold, color: black });
    page.drawText('DOSE', { x: colX.dose, y: curY - 13, size: 8, font: fontBold, color: black });
    page.drawText('VIA', { x: colX.via, y: curY - 13, size: 8, font: fontBold, color: black });
    page.drawText('FREQUÊNCIA', { x: colX.freq, y: curY - 13, size: 8, font: fontBold, color: black });

    curY -= 24;

    prescricao.itens.forEach((item, idx) => {
      if (curY < 120) return; // Evitar estouro de página simples

      const numStr = `${idx + 1}.`;
      const doseStr = [item.dose, item.unidadeMedida].filter(Boolean).join(' ');
      const viaAbbrev = abreviarViaPrescricao(item.via);

      page.drawText(numStr, { x: colX.num, y: curY, size: 8, font: fontBold, color: black });
      page.drawText(item.nomeMedicamento.slice(0, 38), { x: colX.med, y: curY, size: 8, font: fontBold, color: black });
      page.drawText(doseStr || '—', { x: colX.dose, y: curY, size: 8, font, color: black });
      page.drawText(viaAbbrev, { x: colX.via, y: curY, size: 8, font, color: black });
      page.drawText(item.frequencia || '—', { x: colX.freq, y: curY, size: 8, font, color: black });

      if (item.observacoes?.trim()) {
        curY -= 11;
        page.drawText(`Obs: ${item.observacoes.slice(0, 75)}`, { x: colX.med, y: curY, size: 7.5, font, color: rgb(0.3, 0.3, 0.3) });
      }

      curY -= 16;
    });

    if (prescricao.observacoes?.trim()) {
      curY -= 10;
      page.drawText(`OBSERVAÇÕES GERAIS: ${prescricao.observacoes}`, {
        x: margin,
        y: curY,
        size: 8,
        font,
        color: black,
        maxWidth: W - margin * 2,
      });
      curY -= 20;
    }

    // Assinatura e Carimbo do Médico
    const medicoNome = atendimento.medico?.nome ?? sessao.usuario.nome;
    const medicoCrm = atendimento.medico?.crm ?? (sessao.usuario as { crm?: string }).crm ?? '—';

    const sigY = 90;
    page.drawLine({
      start: { x: W / 2 - 120, y: sigY + 20 },
      end: { x: W / 2 + 120, y: sigY + 20 },
      thickness: 1,
      color: black,
    });
    page.drawText(`Dr(a). ${medicoNome}`, {
      x: (W - fontBold.widthOfTextAtSize(`Dr(a). ${medicoNome}`, 9)) / 2,
      y: sigY + 8,
      size: 9,
      font: fontBold,
      color: black,
    });
    page.drawText(`CRM: ${medicoCrm}`, {
      x: (W - font.widthOfTextAtSize(`CRM: ${medicoCrm}`, 8)) / 2,
      y: sigY - 2,
      size: 8,
      font,
      color: black,
    });

    drawRodapePajoTecnologia(page, font);

    const pdfBytes = await doc.save();

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="prescricao-${prescricao.numeroPrescricao}.pdf"`,
      },
    });
  } catch (error) {
    console.error('[GET /api/atendimento/prescricao/pdf]', error);
    return NextResponse.json({ sucesso: false, erro: 'Erro ao gerar PDF da prescrição.' }, { status: 500 });
  }
}
