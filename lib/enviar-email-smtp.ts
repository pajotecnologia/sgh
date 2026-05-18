import nodemailer from 'nodemailer';
import { prisma } from '@/lib/prisma';
import { descriptografar } from '@/lib/encryption';

export async function obterTransportadorSmtp() {
  const c = await prisma.configSmtp.findUnique({ where: { id: 'default' } });
  if (!c?.ativo || !c.host?.trim()) return null;
  let pass = '';
  try {
    if (c.senhaCriptografada?.trim()) pass = descriptografar(c.senhaCriptografada);
  } catch {
    return null;
  }
  return nodemailer.createTransport({
    host: c.host.trim(),
    port: c.porta,
    secure: c.secure,
    auth: c.usuario?.trim() ? { user: c.usuario.trim(), pass } : undefined,
  });
}

export async function enviarEmailSmtp(op: { para: string; assunto: string; html: string }) {
  const transporter = await obterTransportadorSmtp();
  if (!transporter) {
    throw new Error('SMTP não configurado ou inativo. Configure em Configurações → E-mail (SMTP).');
  }
  const c = await prisma.configSmtp.findUnique({ where: { id: 'default' } });
  if (!c?.emailRemetente?.trim()) {
    throw new Error('E-mail remetente não configurado.');
  }
  const from =
    c.nomeRemetente?.trim() != null && c.nomeRemetente.trim() !== ''
      ? `"${c.nomeRemetente.trim()}" <${c.emailRemetente.trim()}>`
      : c.emailRemetente.trim();
  await transporter.sendMail({
    from,
    to: op.para,
    subject: op.assunto,
    html: op.html,
  });
}
