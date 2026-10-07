import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import type { Session } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { MENU_PERMISSOES, permissaoPadrao } from '@/lib/permissoes-menu'
import { normalizarPermissoes, obterPermissoesEfetivas, salvarPermissoesUsuario } from '@/lib/permissoes-usuario'
import type { Role } from '@prisma/client'

function admin(sessao: Session | null) {
  return sessao?.usuario?.role === 'ADMIN'
}

export async function GET(req: NextRequest) {
  const sessao = await getServerSession(authOptions)
  if (!sessao) return NextResponse.json({ sucesso: false, erro: 'Não autorizado.' }, { status: 401 })

  const userId = req.nextUrl.searchParams.get('usuarioId') ?? sessao.usuario.id
  const somenteEu = userId === sessao.usuario.id

  if (!somenteEu && !admin(sessao)) {
    return NextResponse.json({ sucesso: false, erro: 'Acesso negado.' }, { status: 403 })
  }

  const usuario = await prisma.usuario.findFirst({
    where: { id: userId, deletedAt: null },
    select: { id: true, nome: true, email: true, role: true, ativo: true },
  })

  if (!usuario) return NextResponse.json({ sucesso: false, erro: 'Usuário não encontrado.' }, { status: 404 })

  const permissoes = await obterPermissoesEfetivas(usuario.id, usuario.role)

  const dados = MENU_PERMISSOES.map((item) => ({
    ...item,
    padrao: permissaoPadrao(item.chave, usuario.role),
    permitido: permissoes[item.chave],
  }))

  return NextResponse.json({
    sucesso: true,
    dados: {
      usuario,
      permissoes,
      itens: dados,
      bloqueioAdmin: usuario.role === 'ADMIN',
    },
  })
}

export async function PUT(req: NextRequest) {
  const sessao = await getServerSession(authOptions)
  if (!admin(sessao)) return NextResponse.json({ sucesso: false, erro: 'Acesso negado.' }, { status: 403 })

  try {
    const body = await req.json()
    const usuarioId = typeof body.usuarioId === 'string' ? body.usuarioId : ''
    if (!usuarioId) {
      return NextResponse.json({ sucesso: false, erro: 'Usuário obrigatório.' }, { status: 400 })
    }

    const usuario = await prisma.usuario.findFirst({
      where: { id: usuarioId, deletedAt: null },
      select: { id: true, role: true },
    })

    if (!usuario) return NextResponse.json({ sucesso: false, erro: 'Usuário não encontrado.' }, { status: 404 })

    // ADMIN permanece com acesso total e não recebe restrições por menu.
    if (usuario.role === 'ADMIN') {
      await prisma.permissaoUsuario.deleteMany({ where: { usuarioId } })
      return NextResponse.json({
        sucesso: true,
        dados: await obterPermissoesEfetivas(usuario.id, usuario.role),
        mensagem: 'Administrador permanece com acesso total.',
      })
    }

    const permissoes = normalizarPermissoes(body.permissoes)
    const efetivas = await salvarPermissoesUsuario(usuario.id, usuario.role as Role, permissoes)

    return NextResponse.json({
      sucesso: true,
      dados: efetivas,
      mensagem: 'Permissões do usuário atualizadas.',
    })
  } catch (erro) {
    console.error('[PUT /api/configuracoes/permissoes]', erro)
    return NextResponse.json({ sucesso: false, erro: 'Erro ao salvar permissões.' }, { status: 500 })
  }
}
