// lib/farmacia-interacoes.ts
// Engine de interações baseado em tb_interacao_matriz (principio ativo x principio ativo)

import { prisma } from '@/lib/prisma'

export type RiscoInteracao = 'LEVE' | 'MODERADO' | 'CRITICO'

export type InteracaoDetectada = {
  risco: RiscoInteracao
  principioAtivoNovo: string
  principioAtivoExistente: string
  efeitoClinico: string
  sugestaoSistema: string
}

function normPrincipioAtivo(s: string): string {
  return s.trim().toLowerCase()
}

function paresUnicos(ativos: string[]) {
  const limpos = ativos.map(normPrincipioAtivo).filter(Boolean)
  const out: Array<{ a: string; b: string }> = []
  for (let i = 0; i < limpos.length; i++) {
    for (let j = i + 1; j < limpos.length; j++) {
      const a = limpos[i]
      const b = limpos[j]
      out.push({ a, b })
    }
  }
  return out
}

export async function detectarInteracoesPorPrincipioAtivo({
  principioAtivoNovo,
  principiosAtivosExistentes,
}: {
  principioAtivoNovo: string
  principiosAtivosExistentes: string[]
}): Promise<InteracaoDetectada[]> {
  const novo = normPrincipioAtivo(principioAtivoNovo)
  if (!novo) return []

  const existentes = principiosAtivosExistentes.map(normPrincipioAtivo).filter(Boolean)
  if (existentes.length === 0) return []

  // Consulta por ambos os sentidos (A-B e B-A)
  const rows = await prisma.tbInteracaoMatriz.findMany({
    where: {
      OR: existentes.flatMap((ex) => [
        { principioAtivoA: novo, principioAtivoB: ex },
        { principioAtivoA: ex, principioAtivoB: novo },
      ]),
    },
    orderBy: [{ risco: 'desc' }, { updatedAt: 'desc' }],
    take: 50,
  })

  return rows.map((r) => ({
    risco: r.risco,
    principioAtivoNovo: novo,
    principioAtivoExistente: normPrincipioAtivo(
      r.principioAtivoA === novo ? r.principioAtivoB : r.principioAtivoA
    ),
    efeitoClinico: r.efeitoClinico,
    sugestaoSistema: r.sugestaoSistema,
  }))
}

export async function detectarInteracoesEntreAtivos(ativos: string[]) {
  const pares = paresUnicos(ativos)
  if (pares.length === 0) return []

  const where = {
    OR: pares.flatMap((p) => [
      { principioAtivoA: p.a, principioAtivoB: p.b },
      { principioAtivoA: p.b, principioAtivoB: p.a },
    ]),
  } as const

  return await prisma.tbInteracaoMatriz.findMany({
    where,
    orderBy: [{ risco: 'desc' }, { updatedAt: 'desc' }],
    take: 200,
  })
}
