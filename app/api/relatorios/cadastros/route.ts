// app/api/relatorios/cadastros/route.ts — Relatórios em JSON ou PDF dos cadastros do sistema

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
import { obterNomeCompletoPaciente } from '@/lib/nome-paciente-exibicao';

const FOOTER_RESERVE = 40;
const PAGE_MARGIN = 36;

function formatarDataBr(val: Date | string | null | undefined): string {
  if (!val) return '—';
  if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}/.test(val)) {
    const [y, m, d] = val.split('T')[0].split('-');
    return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
  }
  const date = typeof val === 'string' ? new Date(val) : val;
  if (Number.isNaN(date.getTime())) return '—';
  const dia = String(date.getDate()).padStart(2, '0');
  const mes = String(date.getMonth() + 1).padStart(2, '0');
  const ano = date.getFullYear();
  return `${dia}/${mes}/${ano}`;
}

function formatarDataHoraBr(val: Date | string | null | undefined): string {
  if (!val) return '—';
  const d = typeof val === 'string' ? new Date(val) : val;
  if (Number.isNaN(d.getTime())) return '—';
  const dia = String(d.getDate()).padStart(2, '0');
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const ano = d.getFullYear();
  const hora = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${dia}/${mes}/${ano} ${hora}:${min}`;
}

export async function GET(req: NextRequest) {
  const sessao = await getServerSession(authOptions);
  if (!sessao) {
    return NextResponse.json({ sucesso: false, erro: 'Não autorizado.' }, { status: 401 });
  }

  const role = sessao.usuario.role;
  if (!['ADMIN', 'DIRETOR_CLINICO', 'FARMACEUTICO'].includes(role)) {
    return NextResponse.json({ sucesso: false, erro: 'Sem permissão.' }, { status: 403 });
  }

  const tipo = req.nextUrl.searchParams.get('tipo')?.trim() || '';
  const format = req.nextUrl.searchParams.get('format')?.trim() || 'json';
  const busca = req.nextUrl.searchParams.get('busca')?.trim() || '';
  const filtroStatus = req.nextUrl.searchParams.get('status')?.trim() || '';
  const filtroRole = req.nextUrl.searchParams.get('role')?.trim() || '';

  try {
    let titulo = '';
    let colunas: string[] = [];
    let dadosLinhas: string[][] = [];
    let payloadJson: any = null;

    if (tipo === 'pacientes') {
      titulo = 'Relatório de Cadastros de Pacientes';
      colunas = ['Nome Completo', 'CPF / RG', 'Data Nasc.', 'Sexo', 'Convênio', 'Cadastro Em'];
      const pacientes = await prisma.paciente.findMany({
        where: {
          deletedAt: null,
          ...(busca
            ? {
                OR: [
                  { nomeExibicao: { contains: busca, mode: 'insensitive' } },
                  { convenio: { contains: busca, mode: 'insensitive' } },
                ],
              }
            : {}),
        },
        orderBy: { createdAt: 'desc' },
      });

      payloadJson = pacientes.map((p) => {
        const nomeComp = obterNomeCompletoPaciente(p.nomeExibicao, p.nomeCriptografado);
        return {
          id: p.id,
          nomeCompleto: nomeComp,
          dataNascimento: p.dataNascimento,
          sexoBiologico: p.sexoBiologico,
          convenio: p.convenio || 'Particular',
          numeroCarteirinha: p.numeroCarteirinha || '—',
          createdAt: p.createdAt,
        };
      });

      dadosLinhas = payloadJson.map((p: any) => [
        p.nomeCompleto,
        'Sim (Criptografado)',
        formatarDataBr(p.dataNascimento),
        p.sexoBiologico,
        p.convenio,
        formatarDataBr(p.createdAt),
      ]);
    } else if (tipo === 'profissionais') {
      titulo = 'Relatório de Profissionais e Usuários';
      colunas = ['Nome', 'E-mail', 'Perfil / Role', 'CRM / COREN', 'Status', 'Cadastrado Em'];
      const usuarios = await prisma.usuario.findMany({
        where: {
          deletedAt: null,
          ...(filtroRole ? { role: filtroRole as any } : {}),
          ...(filtroStatus ? { ativo: filtroStatus === 'ativo' } : {}),
          ...(busca
            ? {
                OR: [
                  { nome: { contains: busca, mode: 'insensitive' } },
                  { email: { contains: busca, mode: 'insensitive' } },
                  { crm: { contains: busca, mode: 'insensitive' } },
                  { coren: { contains: busca, mode: 'insensitive' } },
                ],
              }
            : {}),
        },
        orderBy: { nome: 'asc' },
      });

      payloadJson = usuarios.map((u) => ({
        id: u.id,
        nome: u.nome,
        email: u.email,
        role: u.role,
        crm: u.crm || null,
        coren: u.coren || null,
        ativo: u.ativo,
        createdAt: u.createdAt,
      }));

      dadosLinhas = usuarios.map((u) => [
        u.nome,
        u.email,
        u.role,
        u.crm ? `CRM ${u.crm}` : u.coren ? `COREN ${u.coren}` : '—',
        u.ativo ? 'Ativo' : 'Inativo',
        formatarDataBr(u.createdAt),
      ]);
    } else if (tipo === 'clinicas') {
      titulo = 'Relatório de Cadastros de Clínicas';
      colunas = ['Nome da Clínica', 'Descrição', 'Status', 'Leitos Vinculados', 'Cadastrada Em'];
      const clinicas = await prisma.clinica.findMany({
        where: {
          ...(filtroStatus ? { ativo: filtroStatus === 'ativo' } : {}),
          ...(busca ? { nome: { contains: busca, mode: 'insensitive' } } : {}),
        },
        include: { leitos: { select: { id: true } } },
        orderBy: { nome: 'asc' },
      });

      payloadJson = clinicas.map((c) => ({
        id: c.id,
        nome: c.nome,
        descricao: c.descricao || '—',
        ativo: c.ativo,
        qtdLeitos: c.leitos.length,
        createdAt: c.createdAt,
      }));

      dadosLinhas = clinicas.map((c) => [
        c.nome,
        c.descricao || '—',
        c.ativo ? 'Ativa' : 'Inativa',
        String(c.leitos.length),
        formatarDataBr(c.createdAt),
      ]);
    } else if (tipo === 'leitos') {
      titulo = 'Relatório de Cadastros de Leitos';
      colunas = ['Código', 'Ala', 'Quarto', 'Tipo', 'Clínica', 'Status Ocupação', 'Ativo'];
      const leitos = await prisma.leito.findMany({
        where: {
          ...(filtroStatus ? { status: filtroStatus as any } : {}),
          ...(busca
            ? {
                OR: [
                  { codigo: { contains: busca, mode: 'insensitive' } },
                  { ala: { contains: busca, mode: 'insensitive' } },
                  { quarto: { contains: busca, mode: 'insensitive' } },
                ],
              }
            : {}),
        },
        include: { clinicaRef: { select: { nome: true } } },
        orderBy: [{ ala: 'asc' }, { codigo: 'asc' }],
      });

      payloadJson = leitos.map((l) => ({
        id: l.id,
        codigo: l.codigo,
        ala: l.ala,
        quarto: l.quarto || '—',
        tipo: l.tipo,
        clinica: l.clinicaRef?.nome || l.clinica || '—',
        status: l.status,
        ativo: l.ativo,
      }));

      dadosLinhas = leitos.map((l) => [
        l.codigo,
        l.ala,
        l.quarto || '—',
        l.tipo,
        l.clinicaRef?.nome || l.clinica || '—',
        l.status,
        l.ativo ? 'Sim' : 'Não',
      ]);
    } else if (tipo === 'medicamentos') {
      titulo = 'Relatório de Catálogo de Medicamentos';
      colunas = ['Nome', 'Princípio Ativo', 'Forma', 'Saldo Atual', 'Estoque Mín.', 'MAV / Retenção'];
      const meps = await prisma.tbMedicamento.findMany({
        where: {
          ...(filtroStatus ? { ativo: filtroStatus === 'ativo' } : {}),
          ...(busca
            ? {
                OR: [
                  { nome: { contains: busca, mode: 'insensitive' } },
                  { principioAtivo: { contains: busca, mode: 'insensitive' } },
                ],
              }
            : {}),
        },
        orderBy: { nome: 'asc' },
      });

      payloadJson = meps.map((m) => ({
        id: m.id,
        nome: m.nome,
        principioAtivo: m.principioAtivo,
        forma: m.forma || '—',
        saldoAtual: m.saldoAtual,
        estoqueMinimo: m.estoqueMinimo,
        mav: m.mav,
        tipoControle: m.tipoControle || '—',
        ativo: m.ativo,
      }));

      dadosLinhas = meps.map((m) => [
        m.nome,
        m.principioAtivo,
        m.forma || '—',
        String(m.saldoAtual),
        String(m.estoqueMinimo),
        m.mav ? 'Sim (MAV)' : m.tipoControle || 'Livre',
      ]);
    } else if (tipo === 'fornecedores') {
      titulo = 'Relatório de Fornecedores da Farmácia';
      colunas = ['Razão Social', 'Nome Fantasia', 'CNPJ', 'Telefone', 'Cidade/UF', 'Status'];
      const fornecedores = await prisma.tbFornecedor.findMany({
        where: {
          ...(filtroStatus ? { ativo: filtroStatus === 'ativo' } : {}),
          ...(busca
            ? {
                OR: [
                  { razaoSocial: { contains: busca, mode: 'insensitive' } },
                  { cnpj: { contains: busca, mode: 'insensitive' } },
                ],
              }
            : {}),
        },
        orderBy: { razaoSocial: 'asc' },
      });

      payloadJson = fornecedores.map((f) => ({
        id: f.id,
        razaoSocial: f.razaoSocial,
        nomeFantasia: f.nomeFantasia || '—',
        cnpj: f.cnpj,
        telefone: f.telefone || '—',
        email: f.email || '—',
        cidadeUf: f.cidade ? `${f.cidade}/${f.uf || ''}` : '—',
        ativo: f.ativo,
      }));

      dadosLinhas = fornecedores.map((f) => [
        f.razaoSocial,
        f.nomeFantasia || '—',
        f.cnpj,
        f.telefone || '—',
        f.cidade ? `${f.cidade}/${f.uf || ''}` : '—',
        f.ativo ? 'Ativo' : 'Inativo',
      ]);
    } else if (tipo === 'prescricoes-padrao') {
      titulo = 'Relatório de Prescrições Médicas Padrão';
      colunas = ['Nome da Prescrição Padrão', 'Coluna Esquerda', 'Coluna Direita', 'Qtd Itens', 'Status'];
      const prescricoes = await prisma.prescricaoMedicaPadrao.findMany({
        where: {
          ...(filtroStatus ? { ativo: filtroStatus === 'ativo' } : {}),
          ...(busca ? { nome: { contains: busca, mode: 'insensitive' } } : {}),
        },
        include: { itens: { select: { id: true } } },
        orderBy: { nome: 'asc' },
      });

      payloadJson = prescricoes.map((p) => ({
        id: p.id,
        nome: p.nome,
        descricao: p.descricao || '—',
        nomeColunaEsquerda: p.nomeColunaEsquerda,
        nomeColunaDireita: p.nomeColunaDireita,
        qtdItens: p.itens.length,
        ativo: p.ativo,
      }));

      dadosLinhas = prescricoes.map((p) => [
        p.nome,
        p.nomeColunaEsquerda,
        p.nomeColunaDireita,
        String(p.itens.length),
        p.ativo ? 'Ativa' : 'Inativa',
      ]);
    } else if (tipo === 'origens') {
      titulo = 'Relatório de Origens de Pacientes';
      colunas = ['Descrição', 'Procedência na Ficha', 'Total Atendimentos', 'Status'];
      const origens = await prisma.origemPaciente.findMany({
        where: {
          ...(filtroStatus ? { ativo: filtroStatus === 'ativo' } : {}),
          ...(busca ? { descricao: { contains: busca, mode: 'insensitive' } } : {}),
        },
        include: { atendimentos: { select: { id: true } } },
        orderBy: { descricao: 'asc' },
      });

      payloadJson = origens.map((o) => ({
        id: o.id,
        descricao: o.descricao,
        procedenciaFicha: o.procedenciaFicha || '—',
        totalAtendimentos: o.atendimentos.length,
        ativo: o.ativo,
      }));

      dadosLinhas = origens.map((o) => [
        o.descricao,
        o.procedenciaFicha || '—',
        String(o.atendimentos.length),
        o.ativo ? 'Ativa' : 'Inativa',
      ]);
    } else if (tipo === 'sinonimos') {
      titulo = 'Relatório de Sinônimos de Medicamentos';
      colunas = ['Sinônimo', 'Medicamento Associado', 'Princípio Ativo', 'Status'];
      const sinonimos = await prisma.tbMedicamentoSinonimo.findMany({
        where: {
          ...(filtroStatus ? { ativo: filtroStatus === 'ativo' } : {}),
          ...(busca
            ? {
                OR: [
                  { sinonimo: { contains: busca, mode: 'insensitive' } },
                  { medicamento: { nome: { contains: busca, mode: 'insensitive' } } },
                ],
              }
            : {}),
        },
        include: { medicamento: { select: { nome: true, principioAtivo: true } } },
        orderBy: { sinonimo: 'asc' },
      });

      payloadJson = sinonimos.map((s) => ({
        id: s.id,
        sinonimo: s.sinonimo,
        medicamentoNome: s.medicamento.nome,
        principioAtivo: s.medicamento.principioAtivo,
        ativo: s.ativo,
      }));

      dadosLinhas = sinonimos.map((s) => [
        s.sinonimo,
        s.medicamento.nome,
        s.medicamento.principioAtivo,
        s.ativo ? 'Ativo' : 'Inativo',
      ]);
    } else {
      return NextResponse.json({ sucesso: false, erro: 'Tipo de cadastro não reconhecido.' }, { status: 400 });
    }

    if (format === 'json') {
      return NextResponse.json({
        sucesso: true,
        tipo,
        titulo,
        total: payloadJson.length,
        dados: payloadJson,
      });
    }

    // PDF Export format
    const instRow = await prisma.instituicao.findFirst();
    const inst: InstituicaoRelatorioPdf = {
      nomeMunicipio: instRow?.nomeMunicipio ?? null,
      nomeInstituicao: instRow?.nomeInstituicao ?? null,
      logomarcaUrl: instRow?.logomarcaUrl ?? null,
      cnes: instRow?.cnes ?? null,
      endereco: instRow?.endereco ?? null,
      bairro: instRow?.bairro ?? null,
      cidade: instRow?.cidade ?? null,
      estado: instRow?.estado ?? null,
      cep: instRow?.cep ?? null,
    };

    const pdf = await PDFDocument.create();
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);
    const bodySize = 8;
    const titleSize = 10;

    const pageW = 595.28;
    const pageH = 841.89;
    let page = pdf.addPage([pageW, pageH]);

    const emitidoFmt = formatarDataHoraBr(new Date());

    let y = await drawCabecalhoEstiloFicha(pdf, page, font, fontBold, inst, {
      rightBoxMain: 'Relatório Gerencial',
      rightBoxSub: `Emitido em: ${emitidoFmt}`,
      faixaTexto: titulo,
    });

    y -= 10;
    page.drawText(`Total de registros listados: ${dadosLinhas.length}`, {
      x: PAGE_MARGIN,
      y,
      size: titleSize,
      font: fontBold,
      color: rgb(0.1, 0.1, 0.14),
    });
    y -= titleSize + 12;

    // Draw Headers
    const colWidth = (pageW - PAGE_MARGIN * 2) / colunas.length;
    for (let c = 0; c < colunas.length; c++) {
      page.drawText(colunas[c], {
        x: PAGE_MARGIN + c * colWidth,
        y,
        size: bodySize + 0.5,
        font: fontBold,
        color: rgb(0, 0, 0),
        maxWidth: colWidth - 4,
      });
    }
    y -= bodySize + 6;

    page.drawLine({
      start: { x: PAGE_MARGIN, y },
      end: { x: pageW - PAGE_MARGIN, y },
      thickness: 1,
      color: rgb(0.7, 0.7, 0.7),
    });
    y -= 10;

    if (dadosLinhas.length === 0) {
      page.drawText('Nenhum registro encontrado.', {
        x: PAGE_MARGIN,
        y,
        size: bodySize,
        font,
        color: rgb(0.4, 0.4, 0.4),
      });
    } else {
      for (const linha of dadosLinhas) {
        if (y < PAGE_MARGIN + FOOTER_RESERVE) {
          page = pdf.addPage([pageW, pageH]);
          y = pageH - PAGE_MARGIN - 20;

          for (let c = 0; c < colunas.length; c++) {
            page.drawText(colunas[c], {
              x: PAGE_MARGIN + c * colWidth,
              y,
              size: bodySize + 0.5,
              font: fontBold,
              color: rgb(0, 0, 0),
              maxWidth: colWidth - 4,
            });
          }
          y -= bodySize + 6;
          page.drawLine({
            start: { x: PAGE_MARGIN, y },
            end: { x: pageW - PAGE_MARGIN, y },
            thickness: 1,
            color: rgb(0.7, 0.7, 0.7),
          });
          y -= 10;
        }

        for (let c = 0; c < linha.length; c++) {
          const val = String(linha[c] ?? '—');
          page.drawText(val, {
            x: PAGE_MARGIN + c * colWidth,
            y,
            size: bodySize,
            font,
            color: rgb(0.15, 0.15, 0.18),
            maxWidth: colWidth - 6,
          });
        }
        y -= bodySize + 7;
      }
    }

    for (const p of pdf.getPages()) {
      drawRodapePajoTecnologia(p, font);
    }

    const bytes = await pdf.save();
    const fname = `relatorio-${tipo}-${new Date().toISOString().slice(0, 10)}.pdf`;

    return new NextResponse(Buffer.from(bytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${fname}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (erro) {
    console.error(`[GET /api/relatorios/cadastros?tipo=${tipo}]`, erro);
    return NextResponse.json({ sucesso: false, erro: 'Erro ao gerar relatório.' }, { status: 500 });
  }
}
