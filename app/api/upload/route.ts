// app/api/upload/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export async function POST(req: Request) {
  try {
    const sessao = await getServerSession(authOptions);
    if (sessao?.usuario.role !== 'ADMIN') {
      return NextResponse.json({ sucesso: false, erro: 'Acesso negado.' }, { status: 403 });
    }

    const data = await req.formData();
    const file: File | null = data.get('file') as unknown as File;

    if (!file) {
      return NextResponse.json({ sucesso: false, erro: 'Nenhum arquivo enviado.' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Salvar na pasta public/uploads
    const uploadDir = join(process.cwd(), 'public', 'uploads');
    
    // Garantir que a pasta existe
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch {}

    // Gerar nome unico
    const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
    const filePath = join(uploadDir, fileName);

    await writeFile(filePath, buffer);

    return NextResponse.json({ sucesso: true, url: `/uploads/${fileName}` }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ sucesso: false, erro: 'Erro no upload.' }, { status: 500 });
  }
}
