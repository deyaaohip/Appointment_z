import type { JWTPayload } from './jwt'

interface Session {
  token: string
  payload: JWTPayload
  createdAt: number
  lastActivity: number
}

const sessions = new Map<string, Session>()
const SESSION_TIMEOUT = 24 * 60 * 60 * 1000 // 24 hours

// Simple in-memory session creation (no jose dependency)
export async function createSession(payload: Omit<JWTPayload, 'iat' | 'exp'>): Promise<string> {
  // Try to use jose-based token, fall back to simple token
  let token: string
  try {
    const { signToken } = await import('./jwt')
    token = await signToken(payload)
  } catch {
    // Fallback: create a simple token
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
    const data = btoa(JSON.stringify({
      ...payload,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 86400,
      iss: 'bookflow',
      aud: 'bookflow-api',
    }))
    const sig = btoa(data + ':bookflow-secret').slice(0, 43).replace(/\+/g, '-').replace(/\//g, '_')
    token = `${header}.${data}.${sig}`
  }

  const session: Session = {
    token,
    payload,
    createdAt: Date.now(),
    lastActivity: Date.now(),
  }
  sessions.set(payload.userId, session)
  return token
}

export async function getSession(userId: string): Promise<Session | null> {
  const session = sessions.get(userId)
  if (!session) return null
  if (Date.now() - session.lastActivity > SESSION_TIMEOUT) {
    sessions.delete(userId)
    return null
  }
  session.lastActivity = Date.now()
  return session
}

export async function validateSession(token: string): Promise<JWTPayload | null> {
  // 1. Try jose-based verification first
  try {
    const { verifyToken } = await import('./jwt')
    const result = await verifyToken(token)
    if (result) return result
  } catch {
    // jose not available, fall through to manual decode
  }

  // 2. Manual base64 decode fallback (for demo tokens)
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null

    const payloadB64 = parts[1]
    // Handle base64url encoding
    const padded = payloadB64.replace(/-/g, '+').replace(/_/g, '/')
    const payloadStr = atob(padded)
    const payload = JSON.parse(payloadStr)

    // Check expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null
    }

    // Validate required fields
    if (!payload.userId || !payload.email || !payload.role) {
      return null
    }

    return payload as JWTPayload
  } catch {
    return null
  }
}

export function destroySession(userId: string): void {
  sessions.delete(userId)
}

export function getAllActiveSessions(): { userId: string; lastActivity: number }[] {
  const now = Date.now()
  const active: { userId: string; lastActivity: number }[] = []
  for (const [userId, session] of sessions.entries()) {
    if (now - session.lastActivity <= SESSION_TIMEOUT) {
      active.push({ userId, lastActivity: session.lastActivity })
    }
  }
  return active
}

// Cleanup expired sessions every 30 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [userId, session] of sessions.entries()) {
      if (now - session.lastActivity > SESSION_TIMEOUT) {
        sessions.delete(userId)
      }
    }
  }, 30 * 60 * 1000)
}