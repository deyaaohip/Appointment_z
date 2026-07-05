export interface PasswordPolicy {
  minLength: number
  requireUppercase: boolean
  requireLowercase: boolean
  requireNumbers: boolean
  requireSpecialChars: boolean
  preventCommonPasswords: boolean
  maxAgeDays: number
  historyCount: number
}

export const DEFAULT_PASSWORD_POLICY: PasswordPolicy = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  preventCommonPasswords: true,
  maxAgeDays: 90,
  historyCount: 5,
}

const COMMON_PASSWORDS = new Set([
  'password', '123456', '12345678', 'qwerty', 'abc123', 'monkey', 'master',
  'dragon', '111111', 'baseball', 'iloveyou', 'trustno1', 'sunshine',
  'princess', 'football', 'shadow', 'superman', 'michael', 'password1',
])

export function validatePasswordPolicy(password: string, policy: PasswordPolicy = DEFAULT_PASSWORD_POLICY): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (password.length < policy.minLength) {
    errors.push(`Password must be at least ${policy.minLength} characters`)
  }
  if (policy.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Must contain at least one uppercase letter')
  }
  if (policy.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Must contain at least one lowercase letter')
  }
  if (policy.requireNumbers && !/[0-9]/.test(password)) {
    errors.push('Must contain at least one number')
  }
  if (policy.requireSpecialChars && !/[^A-Za-z0-9]/.test(password)) {
    errors.push('Must contain at least one special character')
  }
  if (policy.preventCommonPasswords && COMMON_PASSWORDS.has(password.toLowerCase())) {
    errors.push('This password is too common')
  }

  return { valid: errors.length === 0, errors }
}