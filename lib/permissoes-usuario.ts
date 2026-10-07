import 'server-only'

import type { Role } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { MENU_PERMISSOES, permissaoPadrao, type ChavePermissao } from '@/lib/permissoes-menu'

export async function obterPermissoesEfetivas(usuarioId: string, role: Role) {
  if (role === 'ADMIN') {
    return Object.fromEntries(MENU_PERMISSOES.map((item) => [item.chave, true])) as Record<ChavePermissao, boolean>
  }

  const overrides = await prisma.permissaoUsuario.findMany({
    where: { usuarioId },
    select: { chave: true, permitido: true },
  })
  const mapa = new Map(overrides.map((item) => [item.chave, item.permitido]))

  return Object.fromEntries(
    MENU_PERMISSOES.map((item) => [
      item.chave,
      mapa.has(item.chave) ? mapa.get(item.chave)! : permissaoPadrao(item.chave, role),
    ])
  ) as Record<ChavePermissao, boolean>
}

export async function temPermissaoUsuario(
  usuarioId: string,
  role: Role,
  chave: ChavePermissao
): Promise<boolean> {
  if (role === 'ADMIN') return true

  const override = await prisma.permissaoUsuario.findUnique({
    where: { usuarioId_chave: { usuarioId, chave } },
    select: { permitido: true },
  })

  return override?.permitido ?? permissaoPadrao(chave, role)
}

export async function salvarPermissoesUsuario(
  usuarioId: string,
  role: Role,
  permissoes: Partial<Record<ChavePermissao, boolean>>
) {
  const permitidas = new Set(MENU_PERMISSOES.map((item) => item.chave))

  await prisma.$transaction(async (tx) => {
    for (const [chave, permitido] of Object.entries(permissoes)) {
      if (!permitidas.has(chave as ChavePermissao) || typeof permitido !== 'boolean') continue

      const valorPadrao = permissaoPadrao(chave as ChavePermissao, role)

      // Não criamos override desnecessário. Assim, mudança de cargo continua
      // herdando automaticamente o padrão enquanto o administrador não ajustar.
      if (permitido === valorPadrao) {
        await tx.permissaoUsuario.deleteMany({
          where: { usuarioId, chave },
        })
      } else {
        await tx.permissaoUsuario.upsert({
          where: { usuarioId_chave: { usuarioId, chave } },
          create: { usuarioId, chave, permitido },
          update: { permitido },
        })
      }
    }
  })

  return obterPermissoesEfetivas(usuarioId, role)
}

export function normalizarPermissoes(
  valor: unknown
): Partial<Record<ChavePermissao, boolean>> {
  if (!valor || typeof valor !== 'object' || Array.isArray(valor)) return {}

  const resultado: Partial<Record<ChavePermissao, boolean>> = {}
  const permitidas = new Set(MENU_PERMISSOES.map((item) => item.chave))

  for (const [chave, permitido] of Object.entries(valor as Record<string, unknown>)) {
    if (permitidas.has(chave as ChavePermissao) && typeof permitido === 'boolean') {
      resultado[chave as ChavePermissao] = permitido
    }
  }

  return resultado
}
