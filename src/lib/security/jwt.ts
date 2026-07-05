'use server'
import { SignJWT, jwtVerify } from 'jose'

const TOKEN_EXPIRY = '24h'
const REFRESH_EXPIRY = '7d'

let _cachedSecret: Uint8Array | undefined
function getJWTSecret(): Uint8Array {
  if (!_cachedSecret) {
    const secret = process.env.JWT_SECRET
    if (!secret && process.env.NODE_ENV === 'production') {
      throw new Error('FATAL: JWT_SECRET environment variable is required in production')
    }
    _cachedSecret = new TextEncoder().encode(secret || 'bookflow-dev-secret-do-not-use-in-prod')
  }
  return _cachedSecret
}

export interface JWTPayload {
  userId: string
  tenantId: string
  email: string
  role: string
  permissions: Record<string, Record<string, boolean>>
  iat?: number
  exp?: number
}

export async function signToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .setIssuer('bookflow')
    .setAudience('bookflow-api')
    .sign(getJWTSecret())
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJWTSecret(), {
      algorithms: ['HS256'],
      issuer: 'bookflow',
      audience: 'bookflow-api',
    })
    return payload as unknown as JWTPayload
  } catch {
    return null
  }
}

export async function signRefreshToken(userId: string): Promise<string> {
  return new SignJWT({ userId, type: 'refresh' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(REFRESH_EXPIRY)
    .sign(getJWTSecret())
}