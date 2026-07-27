// app/api/upload/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import {
  MAX_TAMANHO_IMAGEM_PAINEL,
  MAX_TAMANHO_VIDEO_PAINEL,
  tipoMidiaDeArquivo,
} from '@/lib/painel-config'

export async function POST(req: Request) {
  try {
    const sessao = await getServerSession(authOptions)
    if (sessao?.usuario.role !== 'ADMIN') {
      return NextResponse.json({ sucesso: false, erro: 'Acesso negado.' }, { status: 403 })
    }

    const data = await req.formData()
    const file: File | null = data.get('file') as unknown as File

    if (!file) {
      return NextResponse.json({ sucesso: false, erro: 'Nenhum arquivo enviado.' }, { status: 400 })
    }

    const tipo = tipoMidiaDeArquivo(file)
    if (!tipo) {
      return NextResponse.json(
        { sucesso: false, erro: 'Formato não suportado. Use imagem (JPG, PNG, WebP, GIF) ou vídeo (MP4, WebM, MOV).' },
        { status: 400 }
      )
    }

    const maxBytes = tipo === 'video' ? MAX_TAMANHO_VIDEO_PAINEL : MAX_TAMANHO_IMAGEM_PAINEL
    if (file.size > maxBytes) {
      const limiteMb = Math.round(maxBytes / (1024 * 1024))
      return NextResponse.json(
        { sucesso: false, erro: `Arquivo muito grande. Limite: ${limiteMb} MB para ${tipo === 'video' ? 'vídeos' : 'imagens'}.` },
        { status: 400 }
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const uploadDir = join(process.cwd(), 'public', 'uploads')

    try {
      await mkdir(uploadDir, { recursive: true })
    } catch {
      /* pasta já existe */
    }

    const safeName = file.name.replace(/[^\w.\-()]/g, '_')
    const fileName = `${Date.now()}-${safeName}`
    const filePath = join(uploadDir, fileName)

    await writeFile(filePath, buffer)

    return NextResponse.json(
      { sucesso: true, url: `/uploads/${fileName}`, tipo },
      { status: 201 }
    )
  } catch (error) {
    console.error(error)
    return NextResponse.json({ sucesso: false, erro: 'Erro no upload.' }, { status: 500 })
  }
}
