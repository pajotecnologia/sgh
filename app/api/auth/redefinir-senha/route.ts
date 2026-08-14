import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { hash } from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = typeof body.token === 'string' ? body.token.trim() : '';
    const novaSenha = typeof body.novaSenha === 'string' ? body.novaSenha : '';

    const validarSenhaForte = (s: string) => s.length >= 8 && /[a-zA-Z]/.test(s) && /[\d\W]/.test(s);

    if (!token || !validarSenhaForte(novaSenha)) {
      return NextResponse.json(
        { sucesso: false, erro: 'A senha deve ter pelo menos 8 caracteres, contendo letras e números ou símbolos.' },
        { status: 400 }
      );
    }

    const tokenHash = createHash('sha256').update(token).digest('hex');
    const registro = await prisma.tokenRedefinicaoSenha.findUnique({
      where: { tokenHash },
      include: { usuario: true },
    });

    if (!registro || registro.expiresAt < new Date()) {
      return NextResponse.json(
        { sucesso: false, erro: 'Link inválido ou expirado. Solicite um novo.' },
        { status: 400 }
      );
    }

    const senhaHash = await hash(novaSenha, 12);

    await prisma.$transaction([
      prisma.usuario.update({
        where: { id: registro.usuarioId },
        data: { senhaHash },
      }),
      prisma.tokenRedefinicaoSenha.delete({ where: { id: registro.id } }),
    ]);

    return NextResponse.json({ sucesso: true, mensagem: 'Senha alterada com sucesso.' });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ sucesso: false, erro: 'Erro interno.' }, { status: 500 });
  }
}
