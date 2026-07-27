// lib/medicamento-catalogo-match.ts
// Matching de medicamento/princípio ativo contra tb_medicamento:
// - normaliza acentos/caixa/espaços
// - aplica sinônimos (ex.: AAS ↔ ácido acetilsalicílico)
// - fallback por contains com scoring (evitar falso-positivo)

import { prisma } from '@/lib/prisma'

type CatalogoMatch = {
  medicamentoId: string
  principioAtivoCanonico: string
  motivo: 'EXATO_PRINCIPIO' | 'EXATO_NOME' | 'SINONIMO' | 'CONTAINS'
  score: number
}

function normalizarTexto(raw: string): string {
  return raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

// Sinônimos comuns (ampliar conforme necessidade)
const SINONIMOS: Record<string, string> = {
  aas: 'acido acetilsalicilico',
  'ácido acetilsalicílico': 'acido acetilsalicilico',
  'acido acetilsalicilico': 'acido acetilsalicilico',
  dipirona: 'metamizol',
  metamizol: 'metamizol',
}

function expandirChaves(input: string): string[] {
  const base = normalizarTexto(input)
  if (!base) return []
  const out = new Set<string>([base])
  const sin = SINONIMOS[base]
  if (sin) out.add(normalizarTexto(sin))
  return Array.from(out)
}

function normalizarParaPersistencia(raw: string): string {
  return normalizarTexto(raw)
}

function scoreMatch({
  entrada,
  nomeCatalogo,
  principioCatalogo,
}: {
  entrada: string
  nomeCatalogo: string
  principioCatalogo: string
}): number {
  const e = normalizarTexto(entrada)
  const n = normalizarTexto(nomeCatalogo)
  const p = normalizarTexto(principioCatalogo)

  if (!e) return 0
  if (e === p) return 100
  if (e === n) return 95
  if (SINONIMOS[e] && normalizarTexto(SINONIMOS[e]) === p) return 90
  if (p.startsWith(e) || n.startsWith(e)) return 80
  if (p.includes(e) || n.includes(e)) return 70
  return 0
}

export async function resolverMedicamentoCatalogo({
  nomeMedicamento,
  principioAtivo,
}: {
  nomeMedicamento: string
  principioAtivo: string
}): Promise<CatalogoMatch | null> {
  const nome = (nomeMedicamento ?? '').trim()
  const pa = (principioAtivo ?? '').trim()

  const chaves = new Set<string>()
  for (const k of expandirChaves(pa)) chaves.add(k)
  for (const k of expandirChaves(nome)) chaves.add(k)
  const keys = Array.from(chaves).filter(Boolean)
  if (keys.length === 0) return null

  // 0) Sinônimos persistidos no banco (tb_medicamento_sinonimo)
  // Se houver sinonimoNorm = qualquer chave, escolhe o medicamento com maior saldo.
  const sinonimoDb = await prisma.tbMedicamentoSinonimo.findFirst({
    where: { ativo: true, sinonimoNorm: { in: keys } },
    include: { medicamento: true },
    orderBy: [{ medicamento: { saldoAtual: 'desc' } }, { updatedAt: 'desc' }],
  })
  if (sinonimoDb) {
    return {
      medicamentoId: sinonimoDb.medicamentoId,
      principioAtivoCanonico: sinonimoDb.medicamento.principioAtivo,
      motivo: 'SINONIMO',
      score: 90,
    }
  }

  // 1) Exato por princípio ativo / nome (case-insensitive)
  const exato = await prisma.tbMedicamento.findFirst({
    where: {
      ativo: true,
      OR: keys.flatMap((k) => [
        { principioAtivo: { equals: k, mode: 'insensitive' } },
        { nome: { equals: k, mode: 'insensitive' } },
      ]),
    },
    orderBy: [{ saldoAtual: 'desc' }, { updatedAt: 'desc' }],
  })
  if (exato) {
    const motivo: CatalogoMatch['motivo'] =
      keys.some((k) => normalizarTexto(exato.principioAtivo) === normalizarTexto(k))
        ? 'EXATO_PRINCIPIO'
        : 'EXATO_NOME'

    return {
      medicamentoId: exato.id,
      principioAtivoCanonico: exato.principioAtivo,
      motivo,
      score: 100,
    }
  }

  // 2) Fallback por contains: consulta limitada e escolhe melhor score
  // Para reduzir ruído: só usar tokens com >= 3 chars
  const tokens = keys
    .flatMap((k) => k.split(' '))
    .map((t) => t.trim())
    .filter((t) => t.length >= 3)

  if (tokens.length === 0) return null

  const candidatos = await prisma.tbMedicamento.findMany({
    where: {
      ativo: true,
      OR: tokens.flatMap((t) => [
        { principioAtivo: { contains: t, mode: 'insensitive' } },
        { nome: { contains: t, mode: 'insensitive' } },
      ]),
    },
    orderBy: [{ saldoAtual: 'desc' }, { updatedAt: 'desc' }],
    take: 25,
  })

  let melhor: (CatalogoMatch & { motivo: CatalogoMatch['motivo'] }) | null = null
  for (const c of candidatos) {
    const s1 = scoreMatch({ entrada: pa, nomeCatalogo: c.nome, principioCatalogo: c.principioAtivo })
    const s2 = scoreMatch({ entrada: nome, nomeCatalogo: c.nome, principioCatalogo: c.principioAtivo })
    const s = Math.max(s1, s2)
    if (s < 70) continue
    const cand: CatalogoMatch = {
      medicamentoId: c.id,
      principioAtivoCanonico: c.principioAtivo,
      motivo: 'CONTAINS',
      score: s,
    }
    if (!melhor || cand.score > melhor.score) melhor = cand
  }

  return melhor
}

export function normalizarSinonimoParaBanco(raw: string): string {
  return normalizarParaPersistencia(raw)
}
