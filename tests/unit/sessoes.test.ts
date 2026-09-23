import { describe, expect, it } from 'vitest';
import {
  criarIdentificadorSessao,
  hashIdentificadorSessao,
  obterDispositivo,
  DURACAO_SESSAO_MS,
} from '@/lib/sessoes';

describe('segurança de sessões', () => {
  it('gera identificadores únicos e hash determinístico', () => {
    const primeiro = criarIdentificadorSessao();
    const segundo = criarIdentificadorSessao();

    expect(primeiro).not.toBe(segundo);
    expect(hashIdentificadorSessao(primeiro)).toHaveLength(64);
    expect(hashIdentificadorSessao(primeiro)).toBe(hashIdentificadorSessao(primeiro));
    expect(hashIdentificadorSessao(primeiro)).not.toBe(hashIdentificadorSessao(segundo));
  });

  it('mantém a duração da sessão alinhada ao JWT de 8 horas', () => {
    expect(DURACAO_SESSAO_MS).toBe(8 * 60 * 60 * 1000);
  });

  it('identifica navegador e sistema sem armazenar o user-agent inteiro como dispositivo', () => {
    expect(obterDispositivo('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/153.0.0.0 Safari/537.36'))
      .toBe('Chrome / Windows');
    expect(obterDispositivo('Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/150.0 Mobile Safari/537.36'))
      .toBe('Chrome / Android');
    expect(obterDispositivo(null)).toBe('Dispositivo desconhecido');
  });
});
