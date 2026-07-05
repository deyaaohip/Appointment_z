import { signToken, verifyToken, type JWTPayload } from './jwt'

interface Session {
  token: string
  payload: JWTPayload
  createdAt: number
  lastActivity: number
}

const sessions = new Map<string, Session>()
const SESSION_TIMEOUT = 24 * 60 * 60 * 1000 // 24 hours

export async function createSession(payload: Omit<JWTPayload, 'iat' | 'exp'>): Promise<string> {
  const token = await signToken(payload)
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
  return verifyToken(token)
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