// app/api/configuracoes/instituicao/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { ApiResponse } from '@/types';

export async function GET() {
  try {
    const sessao = await getServerSession(authOptions);
    if (!sessao) {
      return NextResponse.json({ sucesso: false, erro: 'Não autorizado.' }, { status: 401 });
    }

    const instituicao = await prisma.instituicao.findFirst();
    return NextResponse.json<ApiResponse<any>>({ sucesso: true, dados: instituicao }, { status: 200 });
  } catch (error) {
    console.error('[GET /api/configuracoes/instituicao] Erro:', error);
    return NextResponse.json({ sucesso: false, erro: 'Erro ao buscar instituição.' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const sessao = await getServerSession(authOptions);
    if (!sessao || !['ADMIN', 'DIRETOR_CLINICO'].includes(sessao.usuario.role)) {
      return NextResponse.json({ sucesso: false, erro: 'Acesso negado. Apenas administradores podem alterar as configurações.' }, { status: 403 });
    }

    const dados = await req.json();

    const dadosHigienizados = {
      nomeMunicipio: dados.nomeMunicipio?.trim() || 'Município',
      nomeInstituicao: dados.nomeInstituicao?.trim() || 'Hospital',
      cnes: dados.cnes ? String(dados.cnes).replace(/\D/g, '').slice(0, 7) || null : null,
      codigoIbgeMunicipio: dados.codigoIbgeMunicipio ? String(dados.codigoIbgeMunicipio).replace(/\D/g, '').slice(0, 7) || null : null,
      endereco: dados.endereco?.trim() || null,
      bairro: dados.bairro?.trim() || null,
      cidade: dados.cidade?.trim() || null,
      estado: dados.estado ? dados.estado.trim().slice(0, 2).toUpperCase() : null,
      cep: dados.cep ? String(dados.cep).replace(/\D/g, '').slice(0, 8) || null : null,
      logomarcaUrl: dados.logomarcaUrl || null,
      buscaAutomaticaCatalogo: dados.buscaAutomaticaCatalogo !== false,
      mfaHabilitado: dados.mfaHabilitado !== false,
    };

    let instituicao = await prisma.instituicao.findFirst();
    if (instituicao) {
      instituicao = await prisma.instituicao.update({
        where: { id: instituicao.id },
        data: dadosHigienizados,
      });
    } else {
      instituicao = await prisma.instituicao.create({
        data: dadosHigienizados,
      });
    }

    // Se houver logomarca em Base64 ou URL de upload, sincroniza na tabela de uploads para persistência
    if (dadosHigienizados.logomarcaUrl && dadosHigienizados.logomarcaUrl.startsWith('data:image/')) {
      try {
        const mimeType = dadosHigienizados.logomarcaUrl.split(';')[0]?.replace('data:', '') || 'image/png';
        await prisma.uploadSistema.upsert({
          where: { nomeArquivo: 'logomarca-instituicao' },
          update: {
            mimeType,
            dadosBase64: dadosHigienizados.logomarcaUrl,
            tamanhoBytes: dadosHigienizados.logomarcaUrl.length,
          },
          create: {
            nomeArquivo: 'logomarca-instituicao',
            mimeType,
            dadosBase64: dadosHigienizados.logomarcaUrl,
            tamanhoBytes: dadosHigienizados.logomarcaUrl.length,
          },
        });
      } catch (errUpload) {
        console.warn('[PUT /api/configuracoes/instituicao] Aviso ao persistir upload em banco:', errUpload);
      }
    }

    return NextResponse.json<ApiResponse<any>>({ sucesso: true, dados: instituicao }, { status: 200 });
  } catch (error) {
    console.error('[PUT /api/configuracoes/instituicao] Erro:', error);
    return NextResponse.json({
      sucesso: false,
      erro: 'Erro ao salvar instituição.',
      detalhes: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
