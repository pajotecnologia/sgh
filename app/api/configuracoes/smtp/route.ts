import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { criptografar } from '@/lib/encryption';
import type { ApiResponse } from '@/types';

export async function GET() {
  const sessao = await getServerSession(authOptions);
  if (sessao?.usuario.role !== 'ADMIN') {
    return NextResponse.json({ sucesso: false, erro: 'Acesso negado.' }, { status: 403 });
  }
  try {
    let row = await prisma.configSmtp.findUnique({ where: { id: 'default' } });
    if (!row) {
      row = await prisma.configSmtp.create({
        data: { id: 'default' },
      });
    }
    return NextResponse.json({
      sucesso: true,
      dados: {
        host: row.host,
        porta: row.porta,
        secure: row.secure,
        usuario: row.usuario,
        senhaPreenchida: !!row.senhaCriptografada?.trim(),
        emailRemetente: row.emailRemetente,
        nomeRemetente: row.nomeRemetente,
        ativo: row.ativo,
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ sucesso: false, erro: 'Erro ao carregar SMTP.' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const sessao = await getServerSession(authOptions);
  if (sessao?.usuario.role !== 'ADMIN') {
    return NextResponse.json({ sucesso: false, erro: 'Acesso negado.' }, { status: 403 });
  }
  try {
    const body = await req.json();
    const {
      host,
      porta,
      secure,
      usuario,
      senha,
      emailRemetente,
      nomeRemetente,
      ativo,
    } = body as Record<string, unknown>;

    const senhaStr = typeof senha === 'string' ? senha : '';
    let senhaCriptografada: string | undefined;
    if (senhaStr.trim().length > 0) {
      senhaCriptografada = criptografar(senhaStr);
    }

    const atual = await prisma.configSmtp.upsert({
      where: { id: 'default' },
      create: {
        id: 'default',
        host: typeof host === 'string' ? host : '',
        porta: typeof porta === 'number' ? porta : 587,
        secure: Boolean(secure),
        usuario: typeof usuario === 'string' ? usuario : '',
        senhaCriptografada: senhaCriptografada ?? '',
        emailRemetente: typeof emailRemetente === 'string' ? emailRemetente : '',
        nomeRemetente: typeof nomeRemetente === 'string' ? nomeRemetente : null,
        ativo: Boolean(ativo),
      },
      update: {
        host: typeof host === 'string' ? host : '',
        porta: typeof porta === 'number' ? porta : 587,
        secure: Boolean(secure),
        usuario: typeof usuario === 'string' ? usuario : '',
        ...(senhaCriptografada != null ? { senhaCriptografada } : {}),
        emailRemetente: typeof emailRemetente === 'string' ? emailRemetente : '',
        nomeRemetente: typeof nomeRemetente === 'string' ? nomeRemetente : null,
        ativo: Boolean(ativo),
      },
    });

    return NextResponse.json<ApiResponse<unknown>>({
      sucesso: true,
      mensagem: 'Configurações SMTP salvas.',
      dados: { id: atual.id },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ sucesso: false, erro: 'Erro ao salvar SMTP.' }, { status: 500 });
  }
}
