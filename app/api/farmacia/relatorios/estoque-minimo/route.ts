// app/api/farmacia/relatorios/estoque-minimo/route.ts
// GET — Relatório de medicamentos abaixo do estoque mínimo

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { authOptions } from '@/lib/auth'
import { auditarLgpd } from '@/lib/auditoria-lgpd'
import { listarAbaixoEstoqueMinimo } from '@/lib/farmacia-estoque'
import { prisma } from '@/lib/prisma'
import {
  drawCabecalhoEstiloFicha,
  drawRodapePajoTecnologia,
  type InstituicaoRelatorioPdf,
} from '@/lib/pdf-relatorio-cabecalho-ficha'

const ROLES = ['ADMIN', 'FARMACEUTICO'] as const
const PAGE_MARGIN = 48

export async function GET(req: NextRequest) {
  const sessao = await getServerSession(authOptions)
  if (!sessao) return NextResponse.json({ sucesso: false, erro: 'Não autorizado.' }, { status: 401 })
  if (!ROLES.includes(sessao.usuario.role as (typeof ROLES)[number])) {
    return NextResponse.json({ sucesso: false, erro: 'Sem permissão.' }, { status: 403 })
  }

  const formato = req.nextUrl.searchParams.get('formato') ?? 'json'

  try {
    const abaixo = await listarAbaixoEstoqueMinimo()

    await auditarLgpd({
      usuarioId: sessao.usuario.id,
      role: sessao.usuario.role as never,
      atendimentoId: null,
      acao: 'LEITURA',
      entidade: 'RelatorioEstoqueMinimoFarmacia',
      entidadeId: null,
      ipOrigem: req.headers.get('x-forwarded-for') ?? null,
      userAgent: req.headers.get('user-agent') ?? null,
      detalhes: { total: abaixo.length, formato },
    })

    if (formato === 'pdf') {
      const instRow = await prisma.instituicao.findFirst()
      const inst: InstituicaoRelatorioPdf = {
        nomeMunicipio: instRow?.nomeMunicipio ?? null,
        nomeInstituicao: instRow?.nomeInstituicao ?? null,
        logomarcaUrl: instRow?.logomarcaUrl ?? null,
        endereco: instRow?.endereco ?? null,
        bairro: instRow?.bairro ?? null,
        cidade: instRow?.cidade ?? null,
        estado: instRow?.estado ?? null,
        cep: instRow?.cep ?? null,
      }

      const pdf = await PDFDocument.create()
      const font = await pdf.embedFont(StandardFonts.Helvetica)
      const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold)
      let page = pdf.addPage([595, 842])

      const emitidoFmt = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date())

      let y = await drawCabecalhoEstiloFicha(pdf, page, font, fontBold, inst, {
        rightBoxLabel: 'Relatório',
        rightBoxMain: 'Estoque mín.',
        rightBoxSub: `Emitido: ${emitidoFmt}`,
        faixaTexto: 'Farmácia — Estoque mínimo',
      })

      y -= 20

      page.drawText('Medicamento | Saldo | Mínimo | Déficit', {
        x: PAGE_MARGIN,
        y,
        size: 9,
        font: fontBold,
      })
      y -= 16

      if (abaixo.length === 0) {
        page.drawText('Nenhum medicamento abaixo do estoque mínimo.', { x: PAGE_MARGIN, y, size: 10, font })
      } else {
        for (const m of abaixo) {
          if (y < 80) {
            page = pdf.addPage([595, 842])
            y = page.getHeight() - PAGE_MARGIN
          }
          const deficit = m.estoqueMinimo - m.saldoAtual
          const linha = `${m.nome} | ${m.saldoAtual} | ${m.estoqueMinimo} | ${deficit}`
          page.drawText(linha.slice(0, 95), { x: PAGE_MARGIN, y, size: 9, font })
          y -= 14
        }
      }

      for (const p of pdf.getPages()) {
        drawRodapePajoTecnologia(p, font)
      }
      const bytes = await pdf.save()
      return new NextResponse(Buffer.from(bytes), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'attachment; filename="farmacia-estoque-minimo.pdf"',
        },
      })
    }

    const dados = abaixo.map((m) => ({
      ...m,
      deficit: m.estoqueMinimo - m.saldoAtual,
    }))

    return NextResponse.json({ sucesso: true, dados, total: dados.length })
  } catch (e) {
    console.error('[GET /api/farmacia/relatorios/estoque-minimo]', e)
    return NextResponse.json({ sucesso: false, erro: 'Erro interno.' }, { status: 500 })
  }
}
