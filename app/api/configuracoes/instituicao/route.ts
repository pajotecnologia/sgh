// app/api/configuracoes/instituicao/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { ApiResponse } from '@/types';

export async function GET() {
  try {
    const sessao = await getServerSession(authOptions);
    if (!sessao) return NextResponse.json({ sucesso: false, erro: 'Não autorizado.' }, { status: 401 });

    const instituicao = await prisma.instituicao.findFirst();
    return NextResponse.json<ApiResponse<any>>({ sucesso: true, dados: instituicao }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ sucesso: false, erro: 'Erro ao buscar instituição.' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const sessao = await getServerSession(authOptions);
    if (sessao?.usuario.role !== 'ADMIN') {
      return NextResponse.json({ sucesso: false, erro: 'Acesso negado.' }, { status: 403 });
    }

    const dados = await req.json();

    let instituicao = await prisma.instituicao.findFirst();
    if (instituicao) {
      instituicao = await prisma.instituicao.update({
        where: { id: instituicao.id },
        data: {
          nomeMunicipio: dados.nomeMunicipio,
          nomeInstituicao: dados.nomeInstituicao,
          cnes: dados.cnes?.replace(/\D/g, '').slice(0, 7) || null,
          codigoIbgeMunicipio: dados.codigoIbgeMunicipio?.replace(/\D/g, '').slice(0, 7) || null,
          endereco: dados.endereco,
          bairro: dados.bairro,
          cidade: dados.cidade,
          estado: dados.estado,
          cep: dados.cep,
          logomarcaUrl: dados.logomarcaUrl,
        },
      });
    } else {
      instituicao = await prisma.instituicao.create({
        data: {
          nomeMunicipio: dados.nomeMunicipio,
          nomeInstituicao: dados.nomeInstituicao,
          cnes: dados.cnes?.replace(/\D/g, '').slice(0, 7) || null,
          codigoIbgeMunicipio: dados.codigoIbgeMunicipio?.replace(/\D/g, '').slice(0, 7) || null,
          endereco: dados.endereco,
          bairro: dados.bairro,
          cidade: dados.cidade,
          estado: dados.estado,
          cep: dados.cep,
          logomarcaUrl: dados.logomarcaUrl,
        },
      });
    }

    return NextResponse.json<ApiResponse<any>>({ sucesso: true, dados: instituicao }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ sucesso: false, erro: 'Erro ao salvar instituição.' }, { status: 500 });
  }
}
