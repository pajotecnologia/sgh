import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes } from 'node:crypto'

const STEP_SECONDS = 30
const DIGITS = 6

function base32Encode(input: Buffer) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
  let bits = 0, value = 0, output = ''
  for (const byte of input) {
    value = (value << 8) | byte; bits += 8
    while (bits >= 5) { output += alphabet[(value >>> (bits - 5)) & 31]; bits -= 5 }
  }
  if (bits > 0) output += alphabet[(value << (5 - bits)) & 31]
  return output
}

function base32Decode(input: string) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
  const normalized = input.replace(/=+$/g, '').replace(/\s+/g, '').toUpperCase()
  let bits = 0, value = 0
  const output: number[] = []
  for (const char of normalized) {
    const index = alphabet.indexOf(char)
    if (index < 0) throw new Error('Segredo TOTP inválido.')
    value = (value << 5) | index; bits += 5
    if (bits >= 8) { output.push((value >>> (bits - 8)) & 255); bits -= 8 }
  }
  return Buffer.from(output)
}

export function gerarSegredoTotp() { return base32Encode(randomBytes(20)) }

export function criarUriTotp(secret: string, email: string, issuer = 'SGH') {
  const label = encodeURIComponent(issuer + ':' + email)
  const params = new URLSearchParams({ secret, issuer, algorithm: 'SHA1', digits: String(DIGITS), period: String(STEP_SECONDS) })
  return 'otpauth://totp/' + label + '?' + params.toString()
}

export function verificarTotp(secret: string, code: string, agora = Date.now()) {
  const digits = code.replace(/\D/g, '')
  if (!/^\d{6}$/.test(digits)) return false
  const key = base32Decode(secret), counter = Math.floor(agora / 1000 / STEP_SECONDS)
  for (let deslocamento = -1; deslocamento <= 1; deslocamento++) {
    const buffer = Buffer.alloc(8); buffer.writeBigUInt64BE(BigInt(counter + deslocamento))
    const hash = createHmac('sha1', key).update(buffer).digest(), offset = hash[hash.length - 1] & 0x0f
    const binary = ((hash[offset] & 0x7f) << 24) | (hash[offset + 1] << 16) | (hash[offset + 2] << 8) | hash[offset + 3]
    if (String(binary % 1000000).padStart(6, '0') === digits) return true
  }
  return false
}

function chaveCriptografia() {
  const segredo = process.env.NEXTAUTH_SECRET
  if (!segredo || segredo.length < 32) throw new Error('NEXTAUTH_SECRET ausente ou fraco para proteger MFA.')
  return createHash('sha256').update(segredo).digest()
}

export function criptografarSegredoTotp(secret: string) {
  const iv = randomBytes(12), cipher = createCipheriv('aes-256-gcm', chaveCriptografia(), iv)
  const encrypted = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()])
  return iv.toString('base64url') + '.' + cipher.getAuthTag().toString('base64url') + '.' + encrypted.toString('base64url')
}

export function descriptografarSegredoTotp(payload: string) {
  const [ivRaw, tagRaw, encryptedRaw] = payload.split('.')
  if (!ivRaw || !tagRaw || !encryptedRaw) throw new Error('Segredo MFA inválido.')
  const decipher = createDecipheriv('aes-256-gcm', chaveCriptografia(), Buffer.from(ivRaw, 'base64url'))
  decipher.setAuthTag(Buffer.from(tagRaw, 'base64url'))
  return Buffer.concat([decipher.update(Buffer.from(encryptedRaw, 'base64url')), decipher.final()]).toString('utf8')
}