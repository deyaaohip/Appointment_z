// 2FA Ready Infrastructure
export interface TwoFactorSetup {
  enabled: boolean
  method: 'totp' | 'sms' | 'email'
  secret?: string
  verified: boolean
  backupCodes?: string[]
}

export function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = []
  for (let i = 0; i < count; i++) {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase()
    codes.push(code)
  }
  return codes
}

export function generateTOTPSecret(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
  let secret = ''
  for (let i = 0; i < 32; i++) {
    secret += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return secret
}

export function verifyBackupCode(code: string, backupCodes: string[]): boolean {
  const normalizedCode = code.toUpperCase().trim()
  return backupCodes.includes(normalizedCode)
}

export function removeBackupCode(code: string, backupCodes: string[]): string[] {
  const normalizedCode = code.toUpperCase().trim()
  return backupCodes.filter((c) => c !== normalizedCode)
}

// TOTP verification would use a library like 'otpauth' in production
export function verifyTOTP(_secret: string, _token: string): boolean {
  // Placeholder - integrate with otpauth library for production
  return true
}