// app/api/farmacia/entradas/importar-xml/route.ts
// POST — preview (action=preview) ou confirmação (action=confirmar) de importação XML NF-e

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { auditarLgpd } from '@/lib/auditoria-lgpd'
import { parsearXmlNfe } from '@/lib/farmacia-nfe-xml'
import { registrarEntradaNf } from '@/lib/farmacia-entrada'
import { normalizarSinonimoParaBanco } from '@/lib/medicamento-catalogo-match'

const ROLES = ['ADMIN', 'FARMACEUTICO'] as const
const MAX_XML_BYTES = 5_000_000

const schemaConfirmar = z.object({
  action: z.literal('confirmar'),
  numeroNota: z.string().min(1).max(60),
  serie: z.string().max(20).optional().nullable(),
  fornecedorNome: z.string().max(180).optional().nullable(),
  fornecedorCnpj: z.string().max(20).optional().nullable(),
  emitidaEm: z.string().optional().nullable(),
  recebidaEm: z.string().optional().nullable(),
  chaveNfe: z.string().max(44).optional().nullable(),
  observacoes: z.string().max(2000).optional().nullable(),
  itens: z
    .array(
      z.object({
        medicamentoId: z.string().uuid().optional().nullable(),
        criarNovo: z.boolean().optional().nullable(),
        quantidade: z.number().int().min(1),
        custoUnitario: z.number().min(0).optional().nullable(),
        lote: z.string().max(80).optional().nullable(),
        validade: z.string().optional().nullable(),
        descricaoXml: z.string().optional().nullable(),
        codigoEan: z.string().optional().nullable(),
        codigoAnvisa: z.string().optional().nullable(),
        unidadeComercial: z.string().optional().nullable(),
      })
    )
    .min(1)
    .max(500),
})

async function buscarMedicamentoPorDescricao(
  descricao: string,
  codigoEan?: string | null,
  codigoAnvisa?: string | null
) {
  // 1. Busca por código EAN (Código de barras de 13/14 dígitos)
  if (codigoEan && codigoEan.length >= 8) {
    const porEan = await prisma.tbMedicamento.findFirst({
      where: { ativo: true, codigoEan: codigoEan.trim() },
      select: { id: true, nome: true, principioAtivo: true },
    })
    if (porEan) return porEan
  }

  // 2. Busca por Registro ANVISA (13 dígitos)
  if (codigoAnvisa && codigoAnvisa.length >= 10) {
    const porAnvisa = await prisma.tbMedicamento.findFirst({
      where: { ativo: true, codigoAnvisa: codigoAnvisa.trim() },
      select: { id: true, nome: true, principioAtivo: true },
    })
    if (porAnvisa) return porAnvisa
  }

  // 3. Busca por Sinônimo e De-Para cadastrado
  const norm = normalizarSinonimoParaBanco(descricao)
  if (norm) {
    const sinonimo = await prisma.tbMedicamentoSinonimo.findFirst({
      where: { ativo: true, sinonimoNorm: { contains: norm.slice(0, 30) } },
      include: { medicamento: { select: { id: true, nome: true, principioAtivo: true } } },
    })
    if (sinonimo?.medicamento) return sinonimo.medicamento
  }

  // 4. Busca por Nome ou Princípio Ativo (Contendo na descrição)
  const porNome = await prisma.tbMedicamento.findFirst({
    where: {
      ativo: true,
      OR: [
        { nome: { contains: descricao.slice(0, 40), mode: 'insensitive' } },
        { principioAtivo: { contains: descricao.slice(0, 40), mode: 'insensitive' } },
      ],
    },
    select: { id: true, nome: true, principioAtivo: true },
  })

  return porNome ?? null
}

export async function POST(req: NextRequest) {
  const sessao = await getServerSession(authOptions)
  if (!sessao) return NextResponse.json({ sucesso: false, erro: 'Não autorizado.' }, { status: 401 })
  if (!ROLES.includes(sessao.usuario.role as (typeof ROLES)[number])) {
    return NextResponse.json({ sucesso: false, erro: 'Sem permissão.' }, { status: 403 })
  }

  try {
    const contentType = req.headers.get('content-type') ?? ''

    if (contentType.includes('application/json')) {
      const body = await req.json()
      const validacao = schemaConfirmar.safeParse(body)
      if (!validacao.success) {
        return NextResponse.json(
          { sucesso: false, erro: 'Dados inválidos.', detalhes: validacao.error.flatten().fieldErrors },
          { status: 400 }
        )
      }

      const d = validacao.data

      const duplicada = d.chaveNfe
        ? await prisma.tbFarmaciaEntradaNf.findFirst({ where: { chaveNfe: d.chaveNfe } })
        : null
      if (duplicada) {
        return NextResponse.json(
          { sucesso: false, erro: 'Esta NF-e já foi importada anteriormente.' },
          { status: 409 }
        )
      }

      const entrada = await prisma.$transaction(async (tx) => {
        // Auto-cadastrar medicamentos não vinculados
        const itensProcessados = await Promise.all(
          d.itens.map(async (i) => {
            let finalMedId = i.medicamentoId

            if (!finalMedId || i.criarNovo) {
              const nomeMed = (i.descricaoXml || 'MEDICAMENTO NOVO XML').toUpperCase().trim().slice(0, 150)

              let existente = i.codigoEan
                ? await tx.tbMedicamento.findFirst({ where: { codigoEan: i.codigoEan.trim() } })
                : null

              if (!existente && i.codigoAnvisa) {
                existente = await tx.tbMedicamento.findFirst({ where: { codigoAnvisa: i.codigoAnvisa.trim() } })
              }

              if (!existente) {
                existente = await tx.tbMedicamento.findFirst({ where: { nome: nomeMed } })
              }

              if (existente) {
                finalMedId = existente.id
              } else {
                const novo = await tx.tbMedicamento.create({
                  data: {
                    nome: nomeMed,
                    principioAtivo: (i.descricaoXml || 'Não Informado').trim().slice(0, 100),
                    codigoEan: i.codigoEan || null,
                    codigoAnvisa: i.codigoAnvisa || null,
                    unidade: i.unidadeComercial || 'UN',
                    saldoAtual: 0,
                    ativo: true,
                  },
                })
                finalMedId = novo.id

                if (i.descricaoXml) {
                  const norm = normalizarSinonimoParaBanco(i.descricaoXml)
                  if (norm) {
                    await tx.tbMedicamentoSinonimo
                      .create({
                        data: {
                          medicamentoId: novo.id,
                          sinonimo: i.descricaoXml.slice(0, 120),
                          sinonimoNorm: norm.slice(0, 120),
                        },
                      })
                      .catch(() => null)
                  }
                }
              }
            }

            return {
              medicamentoId: finalMedId!,
              quantidade: i.quantidade,
              custoUnitario: i.custoUnitario,
              lote: i.lote,
              validade: i.validade,
            }
          })
        )

        const created = await registrarEntradaNf(
          tx,
          {
            numeroNota: d.numeroNota,
            serie: d.serie,
            fornecedorNome: d.fornecedorNome,
            fornecedorCnpj: d.fornecedorCnpj,
            emitidaEm: d.emitidaEm,
            recebidaEm: d.recebidaEm,
            observacoes: d.observacoes,
            importadaXml: true,
            chaveNfe: d.chaveNfe,
            itens: itensProcessados,
          },
          sessao.usuario.id
        )

        await tx.tbAuditoriaLog.create({
          data: {
            usuarioId: sessao.usuario.id,
            role: sessao.usuario.role,
            atendimentoId: null,
            acao: 'CRIACAO',
            entidade: 'TbFarmaciaEntradaNf',
            entidadeId: created.id,
            ipOrigem: req.headers.get('x-forwarded-for') ?? null,
            userAgent: req.headers.get('user-agent') ?? null,
            detalhes: { origem: 'importacao-xml', chaveNfe: d.chaveNfe, totalItens: created.itens.length },
          },
        })

        return created
      })

      return NextResponse.json({ sucesso: true, dados: entrada })
    }

    const formData = await req.formData()
    const arquivo = formData.get('xml')
    if (!arquivo || !(arquivo instanceof Blob)) {
      return NextResponse.json({ sucesso: false, erro: 'Envie o arquivo XML no campo "xml".' }, { status: 400 })
    }

    if (arquivo.size > MAX_XML_BYTES) {
      return NextResponse.json({ sucesso: false, erro: 'Arquivo XML excede 5 MB.' }, { status: 400 })
    }

    const xmlText = await arquivo.text()
    const nfe = parsearXmlNfe(xmlText)

    const chaveExistente = nfe.chaveNfe
      ? await prisma.tbFarmaciaEntradaNf.findFirst({ where: { chaveNfe: nfe.chaveNfe } })
      : null

    const itensPreview = await Promise.all(
      nfe.itens.map(async (it) => {
        const sugestao = await buscarMedicamentoPorDescricao(it.descricao, it.codigoEan, it.codigoAnvisa)
        return {
          ...it,
          medicamentoSugerido: sugestao,
          medicamentoId: sugestao?.id ?? null,
        }
      })
    )

    await auditarLgpd({
      usuarioId: sessao.usuario.id,
      role: sessao.usuario.role as never,
      atendimentoId: null,
      acao: 'LEITURA',
      entidade: 'NfeXmlPreview',
      entidadeId: nfe.chaveNfe,
      ipOrigem: req.headers.get('x-forwarded-for') ?? null,
      userAgent: req.headers.get('user-agent') ?? null,
      detalhes: { numeroNota: nfe.numeroNota, totalItens: nfe.itens.length },
    })

    return NextResponse.json({
      sucesso: true,
      preview: true,
      dados: {
        cabecalho: {
          numeroNota: nfe.numeroNota,
          serie: nfe.serie,
          chaveNfe: nfe.chaveNfe,
          fornecedorNome: nfe.fornecedorNome,
          fornecedorCnpj: nfe.fornecedorCnpj,
          emitidaEm: nfe.emitidaEm,
          jaImportada: Boolean(chaveExistente),
        },
        itens: itensPreview,
        avisos: nfe.avisos,
      },
    })
  } catch (e) {
    console.error('[POST /api/farmacia/entradas/importar-xml]', e)
    const msg = e instanceof Error ? e.message : 'Erro interno.'
    return NextResponse.json({ sucesso: false, erro: msg }, { status: 400 })
  }
}
