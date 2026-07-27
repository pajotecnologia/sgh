// lib/cep.ts
// Integração com a API ViaCEP para autopreenchimento de endereço

import type { RespostaViaCEP, DadosEndereco } from '@/types';

/**
 * Busca endereço pelo CEP usando a API pública ViaCEP.
 * Funciona no browser (formulário) e no servidor.
 */
export async function buscarCep(cep: string): Promise<DadosEndereco> {
  const cepLimpo = cep.replace(/\D/g, '');

  if (cepLimpo.length !== 8) {
    throw new Error('CEP deve ter 8 dígitos.');
  }

  const init: RequestInit =
    typeof window === 'undefined'
      ? { next: { revalidate: 86400 } }
      : { cache: 'no-store' };

  const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`, init);

  if (!response.ok) {
    throw new Error('Falha ao consultar o serviço de CEP. Tente novamente.');
  }

  const dados: RespostaViaCEP = await response.json();

  if (dados.erro) {
    throw new Error('CEP não encontrado. Verifique o número digitado.');
  }

  return {
    cep: cepLimpo,
    logradouro: dados.logradouro,
    complemento: dados.complemento || undefined,
    bairro: dados.bairro,
    cidade: dados.localidade,
    estado: dados.uf,
    numero: '',
  };
}

export function formatarCep(cep: string): string {
  const limpo = cep.replace(/\D/g, '');
  if (limpo.length !== 8) return cep;
  return `${limpo.slice(0, 5)}-${limpo.slice(5)}`;
}
