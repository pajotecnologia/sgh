import { NextRequest, NextResponse } from 'next/server';
import { createHash, randomBytes } from 'crypto';
import { prisma } from '@/lib/prisma';
import { enviarEmailSmtp } from '@/lib/enviar-email-smtp';
import { verificarRateLimit, obterIpCliente } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    const ip = obterIpCliente(req);
    const rl = verificarRateLimit(`recuperar-senha:${ip}`, { limite: 5, janelaSegundos: 60 });
    if (!rl.sucesso) {
      return NextResponse.json(
        { sucesso: false, erro: `Muitas solicitações. Tente novamente em ${rl.retryAfterSegundos} segundos.` },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfterSegundos) } }
      );
    }

    const body = await req.json();
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    if (!email || !email.includes('@')) {
      return NextResponse.json({ sucesso: false, erro: 'E-mail inválido.' }, { status: 400 });
    }

    const usuario = await prisma.usuario.findFirst({
      where: { email, deletedAt: null, ativo: true },
      select: { id: true, nome: true, email: true },
    });

    // Resposta uniforme (evita enumeração de usuários)
    const msgOk = {
      sucesso: true,
      mensagem:
        'Se o e-mail existir em nosso sistema, você receberá um link para redefinir a senha.',
    };

    if (!usuario) {
      return NextResponse.json(msgOk);
    }

    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.$transaction([
      prisma.tokenRedefinicaoSenha.deleteMany({ where: { usuarioId: usuario.id } }),
      prisma.tokenRedefinicaoSenha.create({
        data: {
          tokenHash,
          usuarioId: usuario.id,
          expiresAt,
        },
      }),
    ]);

    const base =
      process.env.NEXTAUTH_URL?.replace(/\/$/, '') ||
      req.headers.get('origin') ||
      'http://localhost:3000';
    const link = `${base}/redefinir-senha?token=${rawToken}`;

    try {
      await enviarEmailSmtp({
        para: usuario.email,
        assunto: 'Redefinição de senha — SGH',
        html: `
          <p>Olá, <strong>${usuario.nome}</strong>.</p>
          <p>Recebemos um pedido para redefinir sua senha no sistema.</p>
          <p><a href="${link}">Clique aqui para criar uma nova senha</a> (válido por 1 hora).</p>
          <p>Se você não solicitou, ignore este e-mail.</p>
          <p style="font-size:12px;color:#666">${link}</p>
        `,
      });
    } catch (mailErr: unknown) {
      console.error('[recuperar-senha] e-mail:', mailErr);
      return NextResponse.json(
        {
          sucesso: false,
          erro:
            'Não foi possível enviar o e-mail. Verifique as configurações SMTP em Configurações (administrador).',
        },
        { status: 503 }
      );
    }

    return NextResponse.json(msgOk);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ sucesso: false, erro: 'Erro interno.' }, { status: 500 });
  }
}
