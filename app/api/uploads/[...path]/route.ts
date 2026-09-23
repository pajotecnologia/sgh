// app/api/uploads/[...path]/route.ts
// Rota autenticada para servir arquivos armazenados de forma privada em storage/uploads/

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { autorizarArquivoClinico, normalizarCaminhoRelativo } from '@/lib/autorizacao-arquivo';
import { auditarLgpd } from '@/lib/auditoria-lgpd';
import { readFile, stat, realpath } from 'fs/promises';
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
  try {
    const { path: pathSegments } = await params;
    if (!pathSegments || pathSegments.length === 0) {
      return NextResponse.json({ sucesso: false, erro: 'Caminho inválido.' }, { status: 400 });
    }

    // Imagens de mídia institucional podem continuar públicas; conteúdo clínico
    // exige autenticação + autorização no recurso persistido.
    const isImagem = /\.(png|jpe?g|webp|gif|svg)$/i.test(pathSegments[pathSegments.length - 1] ?? '');
    const caminhoClinico = pathSegments.join('/').toLowerCase().startsWith('exames/');
    const sessao = await getServerSession(authOptions);

    if (!sessao && !isImagem) {
      return NextResponse.json({ sucesso: false, erro: 'Não autorizado.' }, { status: 401 });
    }

    const caminhoRelativo = normalizarCaminhoRelativo(pathSegments.join('/'));
    if (!caminhoRelativo) {
      return NextResponse.json({ sucesso: false, erro: 'Caminho inválido.' }, { status: 400 });
    }

    if (!isImagem || caminhoClinico) {
      if (!sessao) {
        return NextResponse.json({ sucesso: false, erro: 'Não autorizado.' }, { status: 401 });
      }

      const autorizacao = await autorizarArquivoClinico({
        caminho: caminhoRelativo,
        usuarioId: sessao.usuario.id,
        role: sessao.usuario.role,
      });

      if (!autorizacao.permitido) {
        return NextResponse.json({ sucesso: false, erro: 'Arquivo não autorizado.' }, { status: 403 });
      }

      await auditarLgpd({
        usuarioId: sessao.usuario.id,
        role: sessao.usuario.role,
        atendimentoId: autorizacao.atendimentoId,
        pacienteId: autorizacao.pacienteId,
        acao: 'VISUALIZACAO_ARQUIVO_CLINICO',
        entidade: autorizacao.entidade,
        entidadeId: autorizacao.entidadeId,
        ipOrigem: req.headers.get('x-forwarded-for'),
        userAgent: req.headers.get('user-agent'),
        detalhes: { caminho: caminhoRelativo },
      });
    }

    // Prevenir Directory Traversal (ex: ../../.env)
    const sanitizedPath = caminhoRelativo;

    let baseStorageDir = process.env.UPLOAD_DIR
      ? path.resolve(process.env.UPLOAD_DIR)
      : path.join(process.cwd(), 'storage', 'uploads');

    let fullPath = path.join(baseStorageDir, sanitizedPath);

    const extensaoSolicitada = path.extname(pathSegments[pathSegments.length - 1] ?? '').toLowerCase();
    const arquivoSensivel = !isImagem || caminhoClinico;

    let fileStat;
    let origemPublica = false;
    try {
      fileStat = await stat(fullPath);
    } catch {
      // Fallback para public/uploads caso arquivo antigo exista lá
      if (arquivoSensivel) {
        return NextResponse.json({ sucesso: false, erro: 'Arquivo não encontrado.' }, { status: 404 });
      }
      origemPublica = true;
      baseStorageDir = path.join(process.cwd(), 'public', 'uploads');
      fullPath = path.join(baseStorageDir, sanitizedPath);
      try {
        fileStat = await stat(fullPath);
      } catch {
        return NextResponse.json({ sucesso: false, erro: 'Arquivo não encontrado.' }, { status: 404 });
      }
    }

    const resolvedBase = path.resolve(baseStorageDir);
    const resolvedPath = path.resolve(fullPath);
    if (!resolvedPath.startsWith(`${resolvedBase}${path.sep}`) && resolvedPath !== resolvedBase) {
      return NextResponse.json({ sucesso: false, erro: 'Acesso negado.' }, { status: 403 });
    }

    const resolvedRealPath = await realpath(resolvedPath);
    if (!resolvedRealPath.startsWith(`${resolvedBase}${path.sep}`)) {
      return NextResponse.json({ sucesso: false, erro: 'Acesso negado.' }, { status: 403 });
    }

    const fileBuffer = await readFile(resolvedRealPath);
    const ext = extensaoSolicitada || path.extname(resolvedRealPath).toLowerCase();
    const contentType = MIME_TYPES[ext] ?? 'application/octet-stream';

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': fileStat.size.toString(),
        'Cache-Control': origemPublica ? 'public, max-age=3600' : 'private, no-store, max-age=0',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('[GET /api/uploads]', error);
    return NextResponse.json({ sucesso: false, erro: 'Erro ao servir o arquivo.' }, { status: 500 });
  }
}
