// app/api/pacientes/route.ts
// Endpoints: GET /api/pacientes (busca/listagem) | POST /api/pacientes (cadastro)

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { schemaCriarPaciente, schemaBuscaCpf } from '@/lib/validations/paciente';
import { criptografar, hashCpf, mascararCpf } from '@/lib/encryption';
import { gerarNumeroAtendimento } from '@/lib/attendance';
import type { ApiResponse, PaginacaoParams } from '@/types';

// =============================================================================
// GET /api/pacientes — Buscar por CPF ou listar com paginação
// =============================================================================
export async function GET(req: NextRequest) {
  // Verificar autenticação
  const sessao = await getServerSession(authOptions);
  if (!sessao) {
    return NextResponse.json<ApiResponse<never>>(
      { sucesso: false, erro: 'Não autorizado.' },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(req.url);
  const cpf = searchParams.get('cpf');
  const busca = searchParams.get('busca') ?? '';
  const pagina = Math.max(1, parseInt(searchParams.get('pagina') ?? '1'));
  const limite = Math.min(50, parseInt(searchParams.get('limite') ?? '20'));

  try {
    // Busca por CPF específico (para verificar duplicidade no cadastro)
    if (cpf) {
      const validacao = schemaBuscaCpf.safeParse({ cpf });
      if (!validacao.success) {
        return NextResponse.json<ApiResponse<never>>(
          {
            sucesso: false,
            erro: 'CPF inválido.',
            detalhes: validacao.error.flatten().fieldErrors as Record<string, string[]>,
          },
          { status: 400 }
        );
      }

      const cpfHash = hashCpf(cpf);
      const paciente = await prisma.paciente.findUnique({
        where: { cpfHash, deletedAt: null },
        select: {
          id: true,
          nomeExibicao: true,
          dataNascimento: true,
          sexoBiologico: true,
          tipoSanguineo: true,
          convenio: true,
          createdAt: true,
          _count: { select: { atendimentos: true } },
        },
      });

      if (!paciente) {
        return NextResponse.json<ApiResponse<null>>(
          { sucesso: true, dados: null, mensagem: 'Paciente não encontrado.' },
          { status: 200 }
        );
      }

      return NextResponse.json<ApiResponse<typeof paciente>>(
        { sucesso: true, dados: paciente },
        { status: 200 }
      );
    }

    // Listagem paginada com busca por nome
    const [pacientes, total] = await Promise.all([
      prisma.paciente.findMany({
        where: {
          deletedAt: null,
          ...(busca
            ? { nomeExibicao: { contains: busca, mode: 'insensitive' } }
            : {}),
        },
        select: {
          id: true,
          nomeExibicao: true,
          dataNascimento: true,
          sexoBiologico: true,
          tipoSanguineo: true,
          convenio: true,
          createdAt: true,
          _count: { select: { atendimentos: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (pagina - 1) * limite,
        take: limite,
      }),
      prisma.paciente.count({
        where: {
          deletedAt: null,
          ...(busca
            ? { nomeExibicao: { contains: busca, mode: 'insensitive' } }
            : {}),
        },
      }),
    ]);

    return NextResponse.json({
      sucesso: true,
      dados: pacientes,
      total,
      pagina,
      limite,
      totalPaginas: Math.ceil(total / limite),
    });
  } catch (erro) {
    console.error('[GET /api/pacientes] Erro:', erro);
    return NextResponse.json<ApiResponse<never>>(
      { sucesso: false, erro: 'Erro interno do servidor.' },
      { status: 500 }
    );
  }
}

// =============================================================================
// POST /api/pacientes — Cadastrar novo paciente
// =============================================================================
export async function POST(req: NextRequest) {
  // Verificar autenticação e role
  const sessao = await getServerSession(authOptions);
  if (!sessao) {
    return NextResponse.json<ApiResponse<never>>(
      { sucesso: false, erro: 'Não autorizado.' },
      { status: 401 }
    );
  }

  const rolesPermitidos = ['ADMIN', 'RECEPCIONISTA'];
  if (!rolesPermitidos.includes(sessao.usuario.role)) {
    return NextResponse.json<ApiResponse<never>>(
      { sucesso: false, erro: 'Sem permissão para cadastrar pacientes.' },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();

    // Validar payload com Zod
    const validacao = schemaCriarPaciente.safeParse(body);
    if (!validacao.success) {
      return NextResponse.json<ApiResponse<never>>(
        {
          sucesso: false,
          erro: 'Dados inválidos. Verifique os campos e tente novamente.',
          detalhes: validacao.error.flatten().fieldErrors as Record<string, string[]>,
        },
        { status: 400 }
      );
    }

    const { dadosPessoais, endereco, dadosSaude, observacoesIniciais } =
      validacao.data;

    // Verificar duplicidade de CPF
    const cpfHash = hashCpf(dadosPessoais.cpf);
    const jaExiste = await prisma.paciente.findUnique({
      where: { cpfHash },
      select: { id: true, deletedAt: true },
    });

    if (jaExiste) {
      if (jaExiste.deletedAt !== null) {
        // Restaurar o paciente excluído em vez de bloquear
        await prisma.paciente.update({
          where: { id: jaExiste.id },
          data: { deletedAt: null }
        });
        return NextResponse.json<ApiResponse<any>>(
          {
            sucesso: true,
            mensagem: 'O paciente havia sido excluído e foi reativado.',
            dados: { id: jaExiste.id },
          },
          { status: 200 }
        );
      } else {
        return NextResponse.json<ApiResponse<never>>(
          {
            sucesso: false,
            erro: 'Já existe um paciente cadastrado com este CPF.',
          },
          { status: 409 }
        );
      }
    }

    // Criptografar dados sensíveis (LGPD / AES-256-GCM)
    const cpfCriptografado = criptografar(dadosPessoais.cpf.replace(/\D/g, ''));
    const nomeCriptografado = criptografar(dadosPessoais.nome);
    const rgCriptografado = dadosPessoais.rg
      ? criptografar(dadosPessoais.rg)
      : undefined;
    const telefoneCriptografado = dadosPessoais.telefone
      ? criptografar(dadosPessoais.telefone)
      : undefined;

    // Nome de exibição: primeiro nome + inicial do último sobrenome
    // Ex: "Maria Aparecida Santos" → "Maria S."
    const partesNome = dadosPessoais.nome.trim().split(/\s+/);
    const nomeExibicao =
      partesNome.length > 1
        ? `${partesNome[0]} ${partesNome[partesNome.length - 1].charAt(0)}.`
        : partesNome[0];

    // Criar paciente e registros relacionados em uma transação
    const pacienteCriado = await prisma.$transaction(async (tx) => {
      const paciente = await tx.paciente.create({
        data: {
          cpfCriptografado,
          cpfHash,
          nomeCriptografado,
          nomeExibicao,
          rgCriptografado,
          dataNascimento: new Date(dadosPessoais.dataNascimento),
          sexoBiologico: dadosPessoais.sexoBiologico,
          genero: dadosPessoais.genero || null,
          telefoneCriptografado,
          tipoSanguineo: dadosSaude.tipoSanguineo,
          convenio: dadosSaude.convenio || null,
          numeroCarteirinha: dadosSaude.numeroCarteirinha || null,
          observacoesIniciais: observacoesIniciais || null,
          
          naturalidade: dadosPessoais.naturalidade || null,
          nomeMae: dadosPessoais.nomeMae || null,
          escolaridade: dadosPessoais.escolaridade || null,
          racaCor: dadosPessoais.racaCor || null,
          cns: dadosPessoais.cns || null,
          profissao: dadosPessoais.profissao || null,
          acompanhanteNome: dadosPessoais.acompanhanteNome || null,
          acompanhanteTelefone: dadosPessoais.acompanhanteTelefone || null,
          // Criar endereço vinculado
          endereco: {
            create: {
              cep: endereco.cep.replace(/\D/g, ''),
              logradouro: endereco.logradouro,
              numero: endereco.numero,
              complemento: endereco.complemento || null,
              bairro: endereco.bairro,
              cidade: endereco.cidade,
              estado: endereco.estado.toUpperCase(),
            },
          },
          // Criar alergias
          alergias: {
            createMany: {
              data: dadosSaude.alergias.map((a) => ({
                descricao: a.descricao,
                gravidade: a.gravidade,
              })),
            },
          },
          // Criar medicamentos contínuos
          medicamentosCont: {
            createMany: {
              data: dadosSaude.medicamentosContinuos.map((m) => ({
                nome: m.nome,
                dose: m.dose,
                frequencia: m.frequencia,
                observacoes: m.observacoes || null,
              })),
            },
          },
        },
      });

      // Opcional: pode-se registrar um log de auditoria específico ou apenas retornar o paciente


      // Registrar na trilha de auditoria
      await tx.logAuditoria.create({
        data: {
          usuarioId: sessao.usuario.id,
          acao: 'CRIACAO',
          entidade: 'Paciente',
          entidadeId: paciente.id,
          ipOrigem: req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? null,
          userAgent: req.headers.get('user-agent'),
        },
      });

      return paciente;
    });

    return NextResponse.json<ApiResponse<{ id: string; nomeExibicao: string }>>(
      {
        sucesso: true,
        dados: {
          id: pacienteCriado.id,
          nomeExibicao: pacienteCriado.nomeExibicao,
        },
        mensagem: 'Paciente cadastrado com sucesso.',
      },
      { status: 201 }
    );
  } catch (erro) {
    console.error('[POST /api/pacientes] Erro:', erro);
    return NextResponse.json<ApiResponse<never>>(
      { sucesso: false, erro: 'Erro interno do servidor.' },
      { status: 500 }
    );
  }
}
