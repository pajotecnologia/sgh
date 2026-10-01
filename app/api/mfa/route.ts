import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { criarUriTotp, descriptografarSegredoTotp, gerarSegredoTotp, criptografarSegredoTotp, verificarTotp } from '@/lib/totp'
import { obterIpCliente } from '@/lib/rate-limit'

export async function GET() {
  try {
    const sessao = await getServerSession(authOptions)
    if (!sessao) return NextResponse.json({ sucesso: false, erro: 'Não autorizado.' }, { status: 401 })
    
    const [usuario, instituicao] = await Promise.all([
      prisma.usuario.findUnique({ where: { id: sessao.usuario.id }, select: { id: true, email: true, mfaAtivo: true, nome: true, role: true, crm: true, coren: true } }),
      prisma.instituicao.findFirst({ select: { mfaHabilitado: true } }).catch(() => null),
    ])

    if (!usuario) return NextResponse.json({ sucesso: false, erro: 'Usuário não encontrado.' }, { status: 404 })

    return NextResponse.json({
      sucesso: true,
      ativo: Boolean(usuario.mfaAtivo),
      mfaHabilitadoInstituicao: instituicao?.mfaHabilitado !== false,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        role: usuario.role,
        crm: usuario.crm,
        coren: usuario.coren,
      },
    })
  } catch (err) {
    console.error('[GET /api/mfa] Erro:', err)
    return NextResponse.json({ sucesso: false, erro: 'Erro interno ao consultar status MFA.' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const sessao = await getServerSession(authOptions)
    if (!sessao) return NextResponse.json({ sucesso: false, erro: 'Não autorizado.' }, { status: 401 })

    const instituicao = await prisma.instituicao.findFirst({ select: { mfaHabilitado: true } }).catch(() => null)
    if (instituicao && instituicao.mfaHabilitado === false) {
      return NextResponse.json({ sucesso: false, erro: 'A autenticação 2FA (MFA) foi desativada pela administração da instituição.' }, { status: 403 })
    }

    const usuario = await prisma.usuario.findUnique({ where: { id: sessao.usuario.id }, select: { id: true, email: true, mfaAtivo: true, mfaSecret: true } })
    if (!usuario) return NextResponse.json({ sucesso: false, erro: 'Usuário não encontrado.' }, { status: 404 })
    if (usuario.mfaAtivo) return NextResponse.json({ sucesso: false, erro: 'MFA já está ativo.' }, { status: 409 })

    const secret = gerarSegredoTotp()
    return NextResponse.json({ sucesso: true, secret, otpauthUrl: criarUriTotp(secret, usuario.email) })
  } catch (err) {
    console.error('[POST /api/mfa] Erro:', err)
    return NextResponse.json({ sucesso: false, erro: 'Erro ao gerar configuração MFA.' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const sessao = await getServerSession(authOptions)
    if (!sessao) return NextResponse.json({ sucesso: false, erro: 'Não autorizado.' }, { status: 401 })

    const instituicao = await prisma.instituicao.findFirst({ select: { mfaHabilitado: true } }).catch(() => null)
    if (instituicao && instituicao.mfaHabilitado === false) {
      return NextResponse.json({ sucesso: false, erro: 'A autenticação 2FA (MFA) foi desativada pela administração.' }, { status: 403 })
    }

    const usuario = await prisma.usuario.findUnique({ where: { id: sessao.usuario.id }, select: { id: true, mfaAtivo: true } })
    if (!usuario) return NextResponse.json({ sucesso: false, erro: 'Usuário não encontrado.' }, { status: 404 })
    if (usuario.mfaAtivo) return NextResponse.json({ sucesso: false, erro: 'MFA já está ativo.' }, { status: 409 })

    const body = await req.json().catch(() => null)
    if (!body || typeof body.secret !== 'string' || typeof body.codigo !== 'string') {
      return NextResponse.json({ sucesso: false, erro: 'Segredo e código são obrigatórios.' }, { status: 400 })
    }

    if (!verificarTotp(body.secret, body.codigo)) {
      return NextResponse.json({ sucesso: false, erro: 'Código MFA inválido.' }, { status: 400 })
    }

    await prisma.usuario.update({ where: { id: usuario.id }, data: { mfaSecret: criptografarSegredoTotp(body.secret), mfaAtivo: true } })
    await prisma.eventoMfa.create({ data: { usuarioId: usuario.id, evento: 'MFA_ATIVADO', ipOrigem: obterIpCliente(req), userAgent: req.headers.get('user-agent') } }).catch(() => undefined)

    return NextResponse.json({ sucesso: true })
  } catch (err) {
    console.error('[PUT /api/mfa] Erro:', err)
    return NextResponse.json({ sucesso: false, erro: 'Erro ao validar e ativar MFA.' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const sessao = await getServerSession(authOptions)
    if (!sessao) return NextResponse.json({ sucesso: false, erro: 'Não autorizado.' }, { status: 401 })

    const body = await req.json().catch(() => null)
    if (!body || typeof body.codigo !== 'string') {
      return NextResponse.json({ sucesso: false, erro: 'Código MFA é obrigatório.' }, { status: 400 })
    }

    const usuario = await prisma.usuario.findUnique({ where: { id: sessao.usuario.id }, select: { id: true, mfaAtivo: true, mfaSecret: true } })
    if (!usuario?.mfaAtivo || !usuario.mfaSecret) {
      return NextResponse.json({ sucesso: false, erro: 'MFA não está ativo.' }, { status: 409 })
    }

    if (!verificarTotp(descriptografarSegredoTotp(usuario.mfaSecret), body.codigo)) {
      return NextResponse.json({ sucesso: false, erro: 'Código MFA inválido.' }, { status: 400 })
    }

    await prisma.usuario.update({ where: { id: usuario.id }, data: { mfaSecret: null, mfaAtivo: false } })
    await prisma.eventoMfa.create({ data: { usuarioId: usuario.id, evento: 'MFA_DESATIVADO', ipOrigem: obterIpCliente(req), userAgent: req.headers.get('user-agent') } }).catch(() => undefined)

    return NextResponse.json({ sucesso: true })
  } catch (err) {
    console.error('[DELETE /api/mfa] Erro:', err)
    return NextResponse.json({ sucesso: false, erro: 'Erro ao desativar MFA.' }, { status: 500 })
  }
}
