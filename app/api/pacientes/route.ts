// app/api/pacientes/route.ts
// Endpoints: GET /api/pacientes (busca/listagem) | POST /api/pacientes (cadastro)

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { schemaCriarPaciente, schemaBuscaCpf } from '@/lib/validations/paciente';
import { criptografar, hashCpf, encryptionKeyConfigurada, mensagemErroEncryptionKey } from '@/lib/encryption';
import { obterNomeCompletoPaciente } from '@/lib/nome-paciente-exibicao';
import { gerarNumeroAtendimento } from '@/lib/attendance';
import { temPermissaoUsuario } from '@/lib/permissoes-usuario';
import type { Role } from '@prisma/client';
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
          nomeCriptografado: true,
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

      const nomeCompleto = obterNomeCompletoPaciente(paciente.nomeExibicao, paciente.nomeCriptografado);
      const dadosEnriquecidos = {
        ...paciente,
        nomeExibicao: nomeCompleto,
        nomeCompleto,
      };

      return NextResponse.json<ApiResponse<typeof dadosEnriquecidos>>(
        { sucesso: true, dados: dadosEnriquecidos },
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
          nomeCriptografado: true,
          dataNascimento: true,
          sexoBiologico: true,
          tipoSanguineo: true,
          convenio: true,
          createdAt: true,
          _count: { select: { atendimentos: true } },
        },
        orderBy: { nomeExibicao: 'asc' },
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

    const dados = pacientes.map((p) => {
      const nomeCompleto = obterNomeCompletoPaciente(p.nomeExibicao, p.nomeCriptografado);
      return {
        ...p,
        nomeExibicao: nomeCompleto,
        nomeCompleto,
      };
    });

    return NextResponse.json({
      sucesso: true,
      dados,
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

  const permitido =
    sessao.usuario.role === 'ADMIN' ||
    sessao.usuario.role === 'RECEPCIONISTA' ||
    (await temPermissaoUsuario(sessao.usuario.id, sessao.usuario.role as Role, 'recepcao'));

  if (!permitido) {
    return NextResponse.json<ApiResponse<never>>(
      { sucesso: false, erro: 'Sem permissão para cadastrar pacientes.' },
      { status: 403 }
    );
  }

  try {
    if (!encryptionKeyConfigurada()) {
      return NextResponse.json<ApiResponse<never>>(
        { sucesso: false, erro: mensagemErroEncryptionKey() },
        { status: 503 }
      );
    }

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

    // Nome de exibição: Nome completo do paciente
    const nomeExibicao = dadosPessoais.nome.trim();

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

      // Se for RN (com nomeMae ou nome iniciando com 'RN '), sincronizar com a Ficha de Berçário da mãe
      const nomeMaeStr = dadosPessoais.nomeMae?.trim();
      if (nomeMaeStr || nomeExibicao.toUpperCase().startsWith('RN ')) {
        const queryMae = nomeMaeStr || nomeExibicao.replace(/^RN (DE )?/i, '').trim();
        const atendimentoMae = await tx.atendimento.findFirst({
          where: {
            deletedAt: null,
            paciente: {
              OR: [
                { nomeExibicao: { equals: queryMae, mode: 'insensitive' } },
                { nomeExibicao: { contains: queryMae, mode: 'insensitive' } },
              ],
            },
          },
          orderBy: { createdAt: 'desc' },
          select: { id: true, fichaBercario: true },
        });

        if (atendimentoMae) {
          const sexoFormatado = dadosPessoais.sexoBiologico === 'FEMININO' ? 'Feminino' : 'Masculino';
          const camposBercarioAtuais = (atendimentoMae.fichaBercario?.campos as Record<string, string>) || {};

          await tx.fichaBercario.upsert({
            where: { atendimentoId: atendimentoMae.id },
            create: {
              atendimentoId: atendimentoMae.id,
              campos: {
                ...camposBercarioAtuais,
                rn_vinculado_nome: nomeExibicao,
                rn_vinculado_paciente_id: paciente.id,
                rn_sexo: sexoFormatado,
                rn_nascidoEm: new Date(dadosPessoais.dataNascimento).toISOString().split('T')[0],
                rn_filiacaoMae: queryMae,
              },
            },
            update: {
              campos: {
                ...camposBercarioAtuais,
                rn_vinculado_nome: nomeExibicao,
                rn_vinculado_paciente_id: paciente.id,
                rn_sexo: sexoFormatado,
                rn_nascidoEm: new Date(dadosPessoais.dataNascimento).toISOString().split('T')[0],
                rn_filiacaoMae: queryMae,
              },
            },
          });
        }
      }

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
    const msg = erro instanceof Error && erro.message.includes('ENCRYPTION_KEY')
      ? mensagemErroEncryptionKey()
      : 'Erro interno do servidor.';
    return NextResponse.json<ApiResponse<never>>(
      { sucesso: false, erro: msg },
      { status: msg.includes('ENCRYPTION_KEY') ? 503 : 500 }
    );
  }
}
