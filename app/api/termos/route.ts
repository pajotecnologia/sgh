import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { gerarHashTermo } from '@/lib/termos-eletronicos'

const schemaTermo = z.object({
  atendimentoId: z.string().uuid(),
  tipoTermo: z.string(),
  tituloTermo: z.string(),
  textoCompleto: z.string(),
  nomeSignatario: z.string().min(2),
  cpfSignatario: z.string().min(11),
  parentesco: z.string().default('O próprio'),
  assinaturaCanvasBase64: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const sessao = await getServerSession(authOptions)
    if (!sessao) {
      return NextResponse.json({ sucesso: false, erro: 'Não autorizado.' }, { status: 401 })
    }

    const body = await req.json()
    const v = schemaTermo.safeParse(body)
    if (!v.success) {
      return NextResponse.json({ sucesso: false, erro: 'Dados inválidos.', detalhes: v.error.format() }, { status: 400 })
    }

    const { atendimentoId, tipoTermo, tituloTermo, textoCompleto, nomeSignatario, cpfSignatario, parentesco, assinaturaCanvasBase64 } = v.data
    const timestamp = new Date().toISOString()
    const hashSha256 = gerarHashTermo(textoCompleto, cpfSignatario, timestamp)

    // Gravar registro na auditoria LGPD
    await prisma.logAuditoria.create({
      data: {
        usuarioId: sessao.usuario.id,
        acao: 'CRIACAO',
        entidade: 'TermoConsentimento',
        entidadeId: atendimentoId,
        valorNovo: `Assinatura de ${tituloTermo} por ${nomeSignatario} (Hash: ${hashSha256.slice(0, 16)}...)`,
        ipOrigem: req.headers.get('x-forwarded-for') ?? '127.0.0.1',
        userAgent: req.headers.get('user-agent') ?? 'desconhecido',
      },
    })

    return NextResponse.json({
      sucesso: true,
      mensagem: `${tituloTermo} registrado com sucesso.`,
      dados: {
        atendimentoId,
        tipoTermo,
        tituloTermo,
        nomeSignatario,
        parentesco,
        hashTermoSha256: hashSha256,
        assinadoEm: timestamp,
      },
    })
  } catch (error) {
    console.error('[POST /api/termos]', error)
    return NextResponse.json({ sucesso: false, erro: 'Erro ao registrar termo.' }, { status: 500 })
  }
}
