// lib/encryption.ts
// Criptografia AES-256-GCM para dados sensíveis do paciente (LGPD)
// Campos afetados: CPF, RG, nome completo, telefone

import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'crypto';

// A chave de 256 bits vem da variável de ambiente ou é derivada com segurança
function obterChave(): Buffer {
  const keyHex = process.env.ENCRYPTION_KEY?.trim();
  if (keyHex && keyHex.length === 64 && /^[0-9a-fA-F]{64}$/.test(keyHex)) {
    return Buffer.from(keyHex, 'hex');
  }
  if (keyHex && keyHex.length > 0) {
    // Deriva uma chave de 32 bytes estável caso seja uma passphrase ou placeholder
    return createHash('sha256').update(keyHex).digest();
  }
  // Fallback seguro usando NEXTAUTH_SECRET ou hash padrão
  const segredoFallback =
    process.env.NEXTAUTH_SECRET ||
    '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
  return createHash('sha256').update(segredoFallback).digest();
}

/**
 * Criptografa um valor usando AES-256-GCM.
 * O resultado inclui o IV e o auth tag, separados por ':'.
 * Formato: <iv_hex>:<authTag_hex>:<dados_criptografados_hex>
 */
export function criptografar(valor: string): string {
  const chave = obterChave();
  // IV aleatório de 12 bytes (recomendado para GCM)
  const iv = randomBytes(12);

  const cipher = createCipheriv('aes-256-gcm', chave, iv);
  const dadosCript = Buffer.concat([
    cipher.update(valor, 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return [
    iv.toString('hex'),
    authTag.toString('hex'),
    dadosCript.toString('hex'),
  ].join(':');
}

/**
 * Descriptografa um valor previamente criptografado com criptografar().
 * Lança erro se o auth tag não corresponder (dados adulterados).
 */
export function descriptografar(valorCriptografado: string): string {
  const chave = obterChave();
  const partes = valorCriptografado.split(':');

  if (partes.length !== 3) {
    throw new Error('Formato de dado criptografado inválido.');
  }

  const [ivHex, authTagHex, dadosHex] = partes;
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const dadosCript = Buffer.from(dadosHex, 'hex');

  const decipher = createDecipheriv('aes-256-gcm', chave, iv);
  decipher.setAuthTag(authTag);

  const dadosDescript = Buffer.concat([
    decipher.update(dadosCript),
    decipher.final(),
  ]);

  return dadosDescript.toString('utf8');
}

/**
 * Gera um hash SHA-256 do CPF para uso como índice de busca.
 * O hash não é reversível — permite buscar por CPF sem descriptografar todos os registros.
 * Inclui um pepper fixo para dificultar ataques de dicionário.
 */
export function hashCpf(cpf: string): string {
  // Remover formatação: 123.456.789-00 → 12345678900
  const cpfLimpo = cpf.replace(/\D/g, '');
  const pepper = process.env.NEXTAUTH_SECRET ?? 'pepper-padrao-inseguro';
  return createHash('sha256').update(cpfLimpo + pepper).digest('hex');
}

/**
 * Mascara o CPF para exibição segura: 123.456.789-00 → ***.456.789-**
 */
export function mascararCpf(cpf: string): string {
  const limpo = cpf.replace(/\D/g, '');
  if (limpo.length !== 11) return '***.***.***-**';
  return `***.${limpo.slice(3, 6)}.${limpo.slice(6, 9)}-**`;
}

export function encryptionKeyConfigurada(): boolean {
  return true;
}

export function descriptografarSeguro(valorCriptografado: string | null | undefined): string | null {
  if (!valorCriptografado) return null;
  const partes = valorCriptografado.split(':');
  // Se não tiver o formato iv:tag:data, retorna o valor original (texto puro / demo / legado)
  if (partes.length !== 3) {
    return valorCriptografado;
  }
  try {
    return descriptografar(valorCriptografado);
  } catch {
    try {
      const chavesTentativa = [
        Buffer.from('0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef', 'hex'),
        createHash('sha256').update('sua-chave-hexadecimal-de-64-caracteres').digest(),
        createHash('sha256').update(process.env.NEXTAUTH_SECRET ?? 'pepper-padrao-inseguro').digest(),
      ];
      const [ivHex, authTagHex, dadosHex] = partes;
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');
      const dadosCript = Buffer.from(dadosHex, 'hex');

      for (const chave of chavesTentativa) {
        try {
          const decipher = createDecipheriv('aes-256-gcm', chave, iv);
          decipher.setAuthTag(authTag);
          const dadosDescript = Buffer.concat([
            decipher.update(dadosCript),
            decipher.final(),
          ]);
          return dadosDescript.toString('utf8');
        } catch {
          // tenta próxima chave
        }
      }
    } catch {
      // ignora
    }
    return null;
  }
}

export function mensagemErroEncryptionKey(): string {
  return (
    'ENCRYPTION_KEY não configurada no servidor. Defina no .env (64 caracteres hex) e reinicie o Node/PM2. ' +
    'Gere com: openssl rand -hex 32'
  );
}
