// app/api/configuracoes/usuarios/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hash } from 'bcryptjs';
import type { ApiResponse } from '@/types';

export async function GET() {
  const sessao = await getServerSession(authOptions);
  if (sessao?.usuario.role !== 'ADMIN') {
    return NextResponse.json({ sucesso: false, erro: 'Acesso negado.' }, { status: 403 });
  }

  try {
    const usuarios = await prisma.usuario.findMany({
      where: { deletedAt: null },
      orderBy: { nome: 'asc' },
      select: {
        id: true,
        nome: true,
        email: true,
        role: true,
        crm: true,
        coren: true,
        ativo: true,
        ultimoAcesso: true,
      },
    });
    return NextResponse.json<ApiResponse<any>>({ sucesso: true, dados: usuarios });
  } catch (erro) {
    return NextResponse.json({ sucesso: false, erro: 'Erro ao buscar usuários.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const sessao = await getServerSession(authOptions);
  if (sessao?.usuario.role !== 'ADMIN') {
    return NextResponse.json({ sucesso: false, erro: 'Acesso negado.' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { nome, email, senha, role, crm, coren } = body;

    if (!nome || !email || !senha || !role) {
      return NextResponse.json({ sucesso: false, erro: 'Campos obrigatórios ausentes.' }, { status: 400 });
    }

    const emailExistente = await prisma.usuario.findUnique({ where: { email: email.toLowerCase() } });
    if (emailExistente) {
      return NextResponse.json({ sucesso: false, erro: 'Este e-mail já está cadastrado.' }, { status: 409 });
    }

    const senhaHash = await hash(senha, 12);

    const novoUsuario = await prisma.usuario.create({
      data: {
        nome,
        email: email.toLowerCase(),
        senhaHash,
        role,
        crm: role === 'MEDICO' ? crm : null,
        coren: (role === 'ENFERMEIRO' || role === 'TECNICO_ENFERMAGEM') ? coren : null,
      },
    });

    return NextResponse.json<ApiResponse<any>>({
      sucesso: true,
      dados: { id: novoUsuario.id, nome: novoUsuario.nome },
      mensagem: 'Usuário criado com sucesso.',
    });
  } catch (erro: any) {
    console.error('[POST /api/configuracoes/usuarios]', erro);
    return NextResponse.json({ sucesso: false, erro: 'Erro ao criar usuário.' }, { status: 500 });
  }
}
