// app/api/configuracoes/painel/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { ApiResponse } from '@/types';

export async function GET() {
  const sessao = await getServerSession(authOptions);
  if (sessao?.usuario.role !== 'ADMIN') {
    return NextResponse.json({ sucesso: false, erro: 'Acesso negado.' }, { status: 403 });
  }

  try {
    let config = await prisma.configPainel.findFirst();
    
    // Se não existir, cria a padrão
    if (!config) {
      config = await prisma.configPainel.create({
        data: {
          vozAtiva: true,
          tipoVoz: 'feminina',
          corPrimaria: '#2563eb',
          corSecundaria: '#f8fafc',
          corTexto: '#1e293b'
        }
      });
    }

    return NextResponse.json<ApiResponse<any>>({ sucesso: true, dados: config });
  } catch (erro) {
    return NextResponse.json({ sucesso: false, erro: 'Erro ao buscar configurações do painel.' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const sessao = await getServerSession(authOptions);
  if (sessao?.usuario.role !== 'ADMIN') {
    return NextResponse.json({ sucesso: false, erro: 'Acesso negado.' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const configExistente = await prisma.configPainel.findFirst();

    if (configExistente) {
      const atualizada = await prisma.configPainel.update({
        where: { id: configExistente.id },
        data: {
          vozAtiva: body.vozAtiva,
          tipoVoz: body.tipoVoz,
          corPrimaria: body.corPrimaria,
          corSecundaria: body.corSecundaria,
          corTexto: body.corTexto,
          mensagemPadrao: body.mensagemPadrao,
          velocidadeVoz: body.velocidadeVoz,
        }
      });
      return NextResponse.json({ sucesso: true, dados: atualizada });
    } else {
      const criada = await prisma.configPainel.create({ data: body });
      return NextResponse.json({ sucesso: true, dados: criada });
    }
  } catch (erro: any) {
    console.error('[PUT /api/configuracoes/painel] ERRO:', erro);
    return NextResponse.json({ 
      sucesso: false, 
      erro: 'Erro ao salvar configurações do painel.',
      detalhes: erro.message 
    }, { status: 500 });
  }
}
