// lib/ficha-urgencia.ts — Montagem de dados comuns à ficha de urgência (recepção e atendimento médico)

import { format, differenceInYears } from 'date-fns';
import { descriptografar, mascararCpf } from '@/lib/encryption';
import type { PacienteFichaCabecalho } from '@/components/ficha/FichaUrgenciaDocumento';

type PacienteComEndereco = {
  nomeExibicao: string;
  nomeCriptografado: string | null;
  cpfCriptografado: string;
  telefoneCriptografado: string | null;
  dataNascimento: Date;
  sexoBiologico: string;
  naturalidade: string | null;
  nomeMae: string | null;
  cns: string | null;
  escolaridade: string | null;
  profissao: string | null;
  racaCor: string | null;
  convenio: string | null;
  acompanhanteNome: string | null;
  acompanhanteTelefone: string | null;
  endereco: {
    logradouro: string;
    numero: string;
    complemento: string | null;
    bairro: string;
    cidade: string;
    estado: string;
    cep: string;
  } | null;
};

export function montarPacienteFichaCabecalho(p: PacienteComEndereco): PacienteFichaCabecalho {
  let nomeCompleto = p.nomeExibicao;
  try {
    if (p.nomeCriptografado) nomeCompleto = descriptografar(p.nomeCriptografado);
  } catch {
    nomeCompleto = p.nomeExibicao;
  }

  let cpf = '***.***.***-**';
  try {
    cpf = mascararCpf(descriptografar(p.cpfCriptografado));
  } catch {
    cpf = '***.***.***-**';
  }

  const idade = differenceInYears(new Date(), new Date(p.dataNascimento));
  const idadeFmt = `${idade} ano${idade !== 1 ? 's' : ''}`;

  const enderecoFmt = p.endereco
    ? `${p.endereco.logradouro}, ${p.endereco.numero}${p.endereco.complemento ? ` - ${p.endereco.complemento}` : ''} - ${p.endereco.bairro}, ${p.endereco.cidade}/${p.endereco.estado} - CEP ${p.endereco.cep}`
    : '';

  const nascFmt = format(new Date(p.dataNascimento), 'dd/MM/yyyy');

  let telefoneFmt = '';
  try {
    if (p.telefoneCriptografado) telefoneFmt = descriptografar(p.telefoneCriptografado);
  } catch {
    telefoneFmt = '';
  }

  return {
    nomeCompleto,
    idadeFmt,
    sexoBiologico: p.sexoBiologico,
    nascFmt,
    cpf,
    naturalidade: p.naturalidade ?? '',
    nomeMae: p.nomeMae ?? '',
    telefoneFmt,
    cns: p.cns ?? '',
    escolaridade: p.escolaridade ?? '',
    profissao: p.profissao ?? '',
    racaCor: p.racaCor ?? '',
    convenio: p.convenio ?? '',
    acompanhanteNome: p.acompanhanteNome ?? '',
    acompanhanteTelefone: p.acompanhanteTelefone ?? '',
    enderecoFmt,
  };
}

export function exameFisicoParaTexto(exame: unknown): string {
  if (exame == null) return '';
  if (typeof exame === 'string') return exame.trim();
  const linhas: string[] = [];
  function walk(val: unknown, caminho: string) {
    if (val == null) return;
    if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') {
      const s = String(val).trim();
      if (s) linhas.push(caminho ? `${caminho}: ${s}` : s);
      return;
    }
    if (Array.isArray(val)) {
      val.forEach((item, i) => walk(item, `${caminho}[${i + 1}]`));
      return;
    }
    if (typeof val === 'object') {
      for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
        const c = caminho ? `${caminho} › ${k}` : k;
        walk(v, c);
      }
    }
  }
  walk(exame, '');
  return linhas.join('\n');
}
