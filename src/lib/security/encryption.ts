import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12
const AUTH_TAG_LENGTH = 16

function _getEncryptionKey(): string {
  const key = process.env.ENCRYPTION_KEY
  if (!key && process.env.NODE_ENV === 'production') {
    throw new Error('FATAL: ENCRYPTION_KEY environment variable is required in production')
  }
  return key || 'bookflow-dev-encryption-key-32bytes'
}

let _cachedKey: string | undefined
function getEncryptionKey(): string {
  if (!_cachedKey) _cachedKey = _getEncryptionKey()
  return _cachedKey
}

function getKey(): Buffer {
  return createHash('sha256').update(getEncryptionKey()).digest()
}

export function encrypt(plaintext: string): string {
  const key = getKey()
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH })
  let encrypted = cipher.update(plaintext, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  const authTag = cipher.getAuthTag()
  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted
}

export function decrypt(ciphertext: string): string | null {
  try {
    const key = getKey()
    const parts = ciphertext.split(':')
    if (parts.length !== 3) return null
    const iv = Buffer.from(parts[0], 'hex')
    const authTag = Buffer.from(parts[1], 'hex')
    const encrypted = parts[2]
    const decipher = createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH })
    decipher.setAuthTag(authTag)
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
  } catch {
    return null
  }
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = createHash('sha256').update(password + salt).digest('hex')
  return `${salt}:${hash}`
}

export function verifyPassword(password: string, hashedPassword: string): boolean {
  const [salt, hash] = hashedPassword.split(':')
  if (!salt || !hash) return false
  const computedHash = createHash('sha256').update(password + salt).digest('hex')
  return computedHash === hash
}

export function sanitizeInput(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}