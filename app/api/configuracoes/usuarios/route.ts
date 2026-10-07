// app/api/configuracoes/usuarios/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hash } from 'bcryptjs';
import type { Role } from '@prisma/client';
import type { ApiResponse } from '@/types';

export async function GET() {
  const sessao = await getServerSession(authOptions);
  if (sessao?.usuario?.role !== 'ADMIN') {
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
    const { nome, email, senha, role, crm, coren } = body as Record<string, unknown>;
    const nomeNormalizado = typeof nome === 'string' ? nome.trim() : '';
    const emailNormalizado = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const senhaNormalizada = typeof senha === 'string' ? senha.trim() : '';
    const rolesValidos = new Set<Role>(['ADMIN', 'MEDICO', 'ENFERMEIRO', 'TECNICO_ENFERMAGEM', 'RECEPCIONISTA', 'DIRETOR_CLINICO', 'FARMACEUTICO']);

    if (!nomeNormalizado || !emailNormalizado || !senhaNormalizada || typeof role !== 'string') {
      return NextResponse.json({ sucesso: false, erro: 'Nome, e-mail, senha e perfil são obrigatórios.' }, { status: 400 });
    }
    if (!rolesValidos.has(role as Role)) {
      return NextResponse.json({ sucesso: false, erro: 'Perfil de acesso inválido.' }, { status: 400 });
    }
    if (senhaNormalizada.length < 8 || !/[a-zA-Z]/.test(senhaNormalizada) || !/[\d\W]/.test(senhaNormalizada)) {
      return NextResponse.json({ sucesso: false, erro: 'A senha deve ter pelo menos 8 caracteres, contendo letras e números ou símbolos.' }, { status: 400 });
    }
      return NextResponse.json({ sucesso: false, erro: 'Campos obrigatórios ausentes.' }, { status: 400 });
    }

    const emailExistente = await prisma.usuario.findUnique({ where: { email: emailNormalizado } });
    if (emailExistente) {
      return NextResponse.json({ sucesso: false, erro: 'Este e-mail já está cadastrado.' }, { status: 409 });
    }

    const novoUsuario = await prisma.usuario.create({
      data: {
        nome: nomeNormalizado,
        email: emailNormalizado,
        senhaHash: await hash(senhaNormalizada, 12),
        role: role as Role,
        crm: role === 'MEDICO' && typeof crm === 'string' ? crm.trim() || null : null,
        coren: (role === 'ENFERMEIRO' || role === 'TECNICO_ENFERMAGEM') && typeof coren === 'string' ? coren.trim() || null : null,
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
