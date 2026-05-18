import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { schemaCriarPaciente } from '@/lib/validations/paciente';
import { criptografar, descriptografar } from '@/lib/encryption';
import type { ApiResponse } from '@/types';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const sessao = await getServerSession(authOptions);
  if (!sessao) return NextResponse.json({ sucesso: false, erro: 'Não autorizado' }, { status: 401 });

  const { id } = await params;

  try {
    const paciente = await prisma.paciente.findUnique({
      where: { id },
      include: {
        endereco: true,
        medicamentosCont: true,
      },
    });

    if (!paciente) {
      return NextResponse.json({ sucesso: false, erro: 'Paciente não encontrado' }, { status: 404 });
    }

    // Descriptografar CPF para preenchimento (se necessário)
    let cpfLimpo = '';
    try {
      cpfLimpo = descriptografar(paciente.cpfCriptografado);
    } catch {}

    const pacienteDecrypted = {
      ...paciente,
      cpfCriptografado: cpfLimpo,
      nomeExibicao: paciente.nomeCriptografado ? descriptografar(paciente.nomeCriptografado) : paciente.nomeExibicao
    };

    return NextResponse.json({ sucesso: true, dados: pacienteDecrypted });
  } catch (e) {
    return NextResponse.json({ sucesso: false, erro: 'Erro ao buscar paciente' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const sessao = await getServerSession(authOptions);
  if (!sessao) return NextResponse.json({ sucesso: false, erro: 'Não autorizado' }, { status: 401 });

  const { id } = await params;

  try {
    const body = await req.json();
    const validacao = schemaCriarPaciente.safeParse(body);

    if (!validacao.success) {
      return NextResponse.json<ApiResponse<never>>(
        {
          sucesso: false,
          erro: 'Dados inválidos.',
          detalhes: validacao.error.flatten().fieldErrors as Record<string, string[]>
        },
        { status: 400 }
      );
    }

    const { dadosPessoais, endereco, dadosSaude, observacoesIniciais } = validacao.data;

    // Criptografar novamente
    const cpfCriptografado = criptografar(dadosPessoais.cpf.replace(/\D/g, ''));
    const nomeCriptografado = criptografar(dadosPessoais.nome);
    const rgCriptografado = dadosPessoais.rg ? criptografar(dadosPessoais.rg) : undefined;
    const telefoneCriptografado = dadosPessoais.telefone ? criptografar(dadosPessoais.telefone) : undefined;

    const partesNome = dadosPessoais.nome.trim().split(/\s+/);
    const nomeExibicao = partesNome.length > 1
        ? `${partesNome[0]} ${partesNome[partesNome.length - 1].charAt(0)}.`
        : partesNome[0];

    const atualizado = await prisma.$transaction(async (tx) => {
      const p = await tx.paciente.update({
        where: { id },
        data: {
          nomeExibicao,
          nomeCriptografado,
          cpfCriptografado,
          rgCriptografado,
          telefoneCriptografado,
          dataNascimento: new Date(dadosPessoais.dataNascimento),
          sexoBiologico: dadosPessoais.sexoBiologico,
          genero: dadosPessoais.genero || null,
          tipoSanguineo: dadosSaude.tipoSanguineo || 'DESCONHECIDO',
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
        }
      });

      if (endereco.cep) {
        await tx.endereco.upsert({
          where: { pacienteId: id },
          create: {
            pacienteId: id,
            cep: endereco.cep,
            logradouro: endereco.logradouro,
            numero: endereco.numero,
            complemento: endereco.complemento || null,
            bairro: endereco.bairro,
            cidade: endereco.cidade,
            estado: endereco.estado,
          },
          update: {
            cep: endereco.cep,
            logradouro: endereco.logradouro,
            numero: endereco.numero,
            complemento: endereco.complemento || null,
            bairro: endereco.bairro,
            cidade: endereco.cidade,
            estado: endereco.estado,
          }
        });
      }

      // Remover medicamentos antigos e recriar
      await tx.medicamentoContinuo.deleteMany({ where: { pacienteId: id } });
      if (dadosSaude.medicamentosContinuos && dadosSaude.medicamentosContinuos.length > 0) {
        await tx.medicamentoContinuo.createMany({
          data: dadosSaude.medicamentosContinuos.map(m => ({
            pacienteId: id,
            nome: m.nome,
            dose: m.dose || '',
            frequencia: m.frequencia || '',
            observacoes: m.observacoes || null
          }))
        });
      }

      await tx.logAuditoria.create({
        data: {
          usuarioId: sessao.usuario.id,
          acao: 'ATUALIZACAO',
          entidade: 'Paciente',
          entidadeId: id,
          valorNovo: `Edição pelo formulário`,
          ipOrigem: req.headers.get('x-forwarded-for') ?? null,
        }
      });

      return p;
    });

    return NextResponse.json({ sucesso: true, dados: { id: atualizado.id } });
  } catch (error) {
    return NextResponse.json({ sucesso: false, erro: 'Erro interno ao atualizar paciente' }, { status: 500 });
  }
}
