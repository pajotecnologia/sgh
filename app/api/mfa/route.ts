import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { criarUriTotp, descriptografarSegredoTotp, gerarSegredoTotp, criptografarSegredoTotp, verificarTotp } from '@/lib/totp'
import { obterIpCliente } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  const sessao = await getServerSession(authOptions)
  if (!sessao) return NextResponse.json({ sucesso: false, erro: 'Não autorizado.' }, { status: 401 })
  const usuario = await prisma.usuario.findUnique({ where: { id: sessao.usuario.id }, select: { id: true, email: true, mfaAtivo: true, mfaSecret: true } })
  if (!usuario) return NextResponse.json({ sucesso: false, erro: 'Usuário não encontrado.' }, { status: 404 })
  if (usuario.mfaAtivo) return NextResponse.json({ sucesso: false, erro: 'MFA já está ativo.' }, { status: 409 })
  const secret = gerarSegredoTotp()
  return NextResponse.json({ sucesso: true, secret, otpauthUrl: criarUriTotp(secret, usuario.email) })
}

export async function PUT(req: NextRequest) {
  const sessao = await getServerSession(authOptions)
  if (!sessao) return NextResponse.json({ sucesso: false, erro: 'Não autorizado.' }, { status: 401 })
  const usuario = await prisma.usuario.findUnique({ where: { id: sessao.usuario.id }, select: { id: true, mfaAtivo: true } })
  if (!usuario) return NextResponse.json({ sucesso: false, erro: 'Usuário não encontrado.' }, { status: 404 })
  if (usuario.mfaAtivo) return NextResponse.json({ sucesso: false, erro: 'MFA já está ativo.' }, { status: 409 })
  const body = await req.json().catch(() => null)
  if (!body || typeof body.secret !== 'string' || typeof body.codigo !== 'string') return NextResponse.json({ sucesso: false, erro: 'Segredo e código são obrigatórios.' }, { status: 400 })
  if (!verificarTotp(body.secret, body.codigo)) return NextResponse.json({ sucesso: false, erro: 'Código MFA inválido.' }, { status: 400 })
  await prisma.usuario.update({ where: { id: usuario.id }, data: { mfaSecret: criptografarSegredoTotp(body.secret), mfaAtivo: true } })
  await prisma.eventoMfa.create({ data: { usuarioId: usuario.id, evento: 'MFA_ATIVADO', ipOrigem: obterIpCliente(req), userAgent: req.headers.get('user-agent') } })
  return NextResponse.json({ sucesso: true })
}

export async function DELETE(req: NextRequest) {
  const sessao = await getServerSession(authOptions)
  if (!sessao) return NextResponse.json({ sucesso: false, erro: 'Não autorizado.' }, { status: 401 })
  const body = await req.json().catch(() => null)
  if (!body || typeof body.codigo !== 'string') return NextResponse.json({ sucesso: false, erro: 'Código MFA é obrigatório.' }, { status: 400 })
  const usuario = await prisma.usuario.findUnique({ where: { id: sessao.usuario.id }, select: { id: true, mfaAtivo: true, mfaSecret: true } })
  if (!usuario?.mfaAtivo || !usuario.mfaSecret) return NextResponse.json({ sucesso: false, erro: 'MFA não está ativo.' }, { status: 409 })
  if (!verificarTotp(descriptografarSegredoTotp(usuario.mfaSecret), body.codigo)) return NextResponse.json({ sucesso: false, erro: 'Código MFA inválido.' }, { status: 400 })
  await prisma.usuario.update({ where: { id: usuario.id }, data: { mfaSecret: null, mfaAtivo: false } })
  await prisma.eventoMfa.create({ data: { usuarioId: usuario.id, evento: 'MFA_DESATIVADO', ipOrigem: obterIpCliente(req), userAgent: req.headers.get('user-agent') } })
  return NextResponse.json({ sucesso: true })
}
