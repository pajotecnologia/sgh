import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hash } from 'bcryptjs';
import type { ApiResponse } from '@/types';
import type { Role } from '@prisma/client';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const sessao = await getServerSession(authOptions);
  if (sessao?.usuario.role !== 'ADMIN') {
    return NextResponse.json({ sucesso: false, erro: 'Acesso negado.' }, { status: 403 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const { nome, email, role, ativo, senha, crm, coren } = body as Record<string, unknown>;

    const existente = await prisma.usuario.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existente) {
      return NextResponse.json({ sucesso: false, erro: 'Usuário não encontrado.' }, { status: 404 });
    }

    if (typeof email === 'string' && email.toLowerCase() !== existente.email) {
      const dup = await prisma.usuario.findUnique({
        where: { email: email.toLowerCase() },
      });
      if (dup && dup.id !== id) {
        return NextResponse.json({ sucesso: false, erro: 'Este e-mail já está em uso.' }, { status: 409 });
      }
    }

    const senhaNova = typeof senha === 'string' && senha.trim().length > 0 ? senha.trim() : null;
    const senhaHash = senhaNova ? await hash(senhaNova, 12) : undefined;

    const roleVal = typeof role === 'string' ? (role as Role) : existente.role;

    await prisma.usuario.update({
      where: { id },
      data: {
        ...(typeof nome === 'string' ? { nome } : {}),
        ...(typeof email === 'string' ? { email: email.toLowerCase() } : {}),
        ...(typeof role === 'string' ? { role: roleVal } : {}),
        ...(typeof ativo === 'boolean' ? { ativo } : {}),
        ...(senhaHash ? { senhaHash } : {}),
        crm: roleVal === 'MEDICO' && typeof crm === 'string' ? crm : roleVal === 'MEDICO' ? existente.crm : null,
        coren:
          roleVal === 'ENFERMEIRO' || roleVal === 'TECNICO_ENFERMAGEM'
            ? typeof coren === 'string'
              ? coren
              : existente.coren
            : null,
      },
    });

    return NextResponse.json<ApiResponse<null>>({ sucesso: true, mensagem: 'Usuário atualizado.', dados: null });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ sucesso: false, erro: 'Erro ao atualizar usuário.' }, { status: 500 });
  }
}
