// app/api/uploads/[...path]/route.ts
// Rota autenticada para servir arquivos armazenados de forma privada em storage/uploads/

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { readFile, stat } from 'fs/promises';
import path from 'path';

const MIME_TYPES: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: pathSegments } = await params;
  if (!pathSegments || pathSegments.length === 0) {
    return NextResponse.json({ sucesso: false, erro: 'Caminho inválido.' }, { status: 400 });
  }

  // Se não for imagem (ex: PDFs sensíveis/exames), exige sessão autenticada
  const isImagem = /\.(png|jpe?g|webp|gif|svg)$/i.test(pathSegments[pathSegments.length - 1] ?? '');
  const sessao = await getServerSession(authOptions);

  if (!sessao && !isImagem) {
    return NextResponse.json({ sucesso: false, erro: 'Não autorizado.' }, { status: 401 });
  }

    // Prevenir Directory Traversal (ex: ../../.env)
    const sanitizedPath = pathSegments
      .map((p) => p.replace(/[^\w.\-()]/g, '_'))
      .join(path.sep);

    let baseStorageDir = process.env.UPLOAD_DIR
      ? path.resolve(process.env.UPLOAD_DIR)
      : path.join(process.cwd(), 'storage', 'uploads');

    let fullPath = path.join(baseStorageDir, sanitizedPath);

    let fileStat;
    try {
      fileStat = await stat(fullPath);
    } catch {
      // Fallback para public/uploads caso arquivo antigo exista lá
      baseStorageDir = path.join(process.cwd(), 'public', 'uploads');
      fullPath = path.join(baseStorageDir, sanitizedPath);
      try {
        fileStat = await stat(fullPath);
      } catch {
        return NextResponse.json({ sucesso: false, erro: 'Arquivo não encontrado.' }, { status: 404 });
      }
    }

    const resolvedPath = path.resolve(fullPath);
    if (!resolvedPath.startsWith(path.resolve(baseStorageDir)) && !resolvedPath.startsWith(path.resolve(process.cwd(), 'public', 'uploads'))) {
      return NextResponse.json({ sucesso: false, erro: 'Acesso negado.' }, { status: 403 });
    }

    const fileBuffer = await readFile(resolvedPath);
    const ext = path.extname(resolvedPath).toLowerCase();
    const contentType = MIME_TYPES[ext] ?? 'application/octet-stream';

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': fileStat.size.toString(),
        'Cache-Control': 'private, max-age=3600',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('[GET /api/uploads]', error);
    return NextResponse.json({ sucesso: false, erro: 'Erro ao servir o arquivo.' }, { status: 500 });
  }
}
