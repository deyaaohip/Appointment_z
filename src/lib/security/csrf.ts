import { createHash, randomBytes } from 'crypto'

const csrfTokens = new Map<string, { token: string; createdAt: number }>()
const CSRF_TOKEN_EXPIRY = 3600 * 1000 // 1 hour

export function generateCSRFToken(sessionId: string): string {
  const token = randomBytes(32).toString('hex')
  const hashed = createHash('sha256').update(token).digest('hex')
  csrfTokens.set(sessionId, { token: hashed, createdAt: Date.now() })
  return token
}

export function validateCSRFToken(sessionId: string, token: string): boolean {
  const entry = csrfTokens.get(sessionId)
  if (!entry) return false
  if (Date.now() - entry.createdAt > CSRF_TOKEN_EXPIRY) {
    csrfTokens.delete(sessionId)
    return false
  }
  const hashed = createHash('sha256').update(token).digest('hex')
  return hashed === entry.token
}

export function removeCSRFToken(sessionId: string): void {
  csrfTokens.delete(sessionId)
}