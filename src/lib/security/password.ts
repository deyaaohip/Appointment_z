// ═══════════════════════════════════════════════════════════════════
// Password Policies & Hashing
// Uses Web Crypto API for PBKDF2 hashing
// ═══════════════════════════════════════════════════════════════════

export const PASSWORD_RULES = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecial: true,
  specialChars: '!@#$%^&*()_+-=[]{}|;:,.<>?',
  preventCommonPasswords: true,
  preventUserInfo: true,
} as const

export interface PasswordValidation {
  isValid: boolean
  score: number          // 0-100
  errors: string[]
  warnings: string[]
}

// Common passwords blacklist
const COMMON_PASSWORDS = new Set([
  'password', '123456', '12345678', 'qwerty', 'abc123', 'monkey',
  'master', 'dragon', 'login', 'princess', 'football', 'shadow',
  'sunshine', 'trustno1', 'iloveyou', 'batman', 'access', 'hello',
  'charlie', 'donald', 'password1', 'qwerty123', 'admin', 'root',
  'demo123', 'pass', 'test', 'guest', 'letmein', 'welcome',
])

function getCharTypeScore(password: string): { upper: number; lower: number; numbers: number; special: number } {
  let upper = 0, lower = 0, numbers = 0, special = 0
  for (const ch of password) {
    if (/[A-Z]/.test(ch)) upper++
    else if (/[a-z]/.test(ch)) lower++
    else if (/[0-9]/.test(ch)) numbers++
    else special++
  }
  return { upper, lower, numbers, special }
}

export function validatePasswordPolicy(
  password: string,
  userInfo?: { name?: string; email?: string }
): PasswordValidation {
  const errors: string[] = []
  const warnings: string[] = []
  let score = 0

  // Length scoring
  if (password.length < PASSWORD_RULES.minLength) {
    errors.push(`Minimum ${PASSWORD_RULES.minLength} characters required`)
  } else {
    score += Math.min(25, (password.length / PASSWORD_RULES.maxLength) * 40)
  }

  // Character type checks
  const types = getCharTypeScore(password)

  if (PASSWORD_RULES.requireUppercase && types.upper === 0) {
    errors.push('At least one uppercase letter required')
  } else if (types.upper > 0) score += 15

  if (PASSWORD_RULES.requireLowercase && types.lower === 0) {
    errors.push('At least one lowercase letter required')
  } else if (types.lower > 0) score += 15

  if (PASSWORD_RULES.requireNumbers && types.numbers === 0) {
    errors.push('At least one number required')
  } else if (types.numbers > 0) score += 15

  if (PASSWORD_RULES.requireSpecial && types.special === 0) {
    errors.push(`At least one special character required (${PASSWORD_RULES.specialChars})`)
  } else if (types.special > 0) score += 15

  // Unique characters bonus
  const uniqueChars = new Set(password.toLowerCase()).size
  score += Math.min(15, uniqueChars * 2)

  // Sequential chars penalty
  let sequential = 0
  for (let i = 1; i < password.length; i++) {
    const diff = Math.abs(password.charCodeAt(i) - password.charCodeAt(i - 1))
    if (diff === 1) sequential++
  }
  if (sequential > 3) {
    score -= 10
    warnings.push('Avoid sequential characters')
  }

  // Common password check
  if (PASSWORD_RULES.preventCommonPasswords && COMMON_PASSWORDS.has(password.toLowerCase())) {
    errors.push('This password is too common')
    score = 0
  }

  // User info check
  if (PASSWORD_RULES.preventUserInfo && userInfo) {
    const lower = password.toLowerCase()
    if (userInfo.name && lower.includes(userInfo.name.toLowerCase().split(' ')[0])) {
      errors.push('Password must not contain your name')
    }
    if (userInfo.email) {
      const emailLocal = userInfo.email.split('@')[0].toLowerCase()
      if (lower.includes(emailLocal)) {
        errors.push('Password must not contain your email')
      }
    }
  }

  score = Math.max(0, Math.min(100, score))

  return {
    isValid: errors.length === 0,
    score,
    errors,
    warnings,
  }
}

// PBKDF2 Hashing with Web Crypto
const PBKDF2_ITERATIONS = 100000
const HASH_ALGORITHM = 'SHA-256'
const SALT_LENGTH = 32

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH))
  const encoder = new TextEncoder()

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  )

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: HASH_ALGORITHM,
    },
    keyMaterial,
    256
  )

  const hashHex = Array.from(new Uint8Array(derivedBits))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
  const saltHex = Array.from(salt)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')

  return `${PBKDF2_ITERATIONS}:${saltHex}:${hashHex}`
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  try {
    const [iterationsStr, saltHex, hashHex] = storedHash.split(':')
    const iterations = parseInt(iterationsStr, 10)
    const salt = new Uint8Array(saltHex.match(/.{1,2}/g)!.map(b => parseInt(b, 16)))
    const encoder = new TextEncoder()

    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveBits']
    )

    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt,
        iterations,
        hash: HASH_ALGORITHM,
      },
      keyMaterial,
      256
    )

    const computedHash = Array.from(new Uint8Array(derivedBits))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')

    return computedHash === hashHex
  } catch {
    return false
  }
}

// 2FA Ready - TOTP Secret Generation
export function generate2FASecret(): string {
  const buffer = crypto.getRandomValues(new Uint8Array(20))
  return Array.from(buffer).map(b => b.toString(16).padStart(2, '0')).join('')
}

export function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = []
  for (let i = 0; i < count; i++) {
    const bytes = crypto.getRandomValues(new Uint8Array(4))
    const code = Array.from(bytes).map(b => (b % 10).toString()).join('')
    codes.push(code)
  }
  return codes
}