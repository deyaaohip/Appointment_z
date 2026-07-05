import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from '@/lib/security/jwt'

// ─── Path Configuration ──────────────────────────────────────────────

const PUBLIC_PATHS = [
  '/api/auth',
  '/api/',
  '/_next/',
  '/favicon',
  '/robots.txt',
  '/logo',
]

const SUPERADMIN_PATHS = ['/api/admin/', '/api/super-admin/']

const AUTH_REQUIRED_PREFIXES = [
  '/api/dashboard/',
  '/api/bookings/',
  '/api/customers/',
  '/api/employees/',
  '/api/services/',
  '/api/branches/',
  '/api/subscriptions/',
  '/api/notifications/',
  '/api/availability/',
  '/api/audit-logs/',
  '/api/payments/',
  '/api/tenant-settings/',
  '/api/brand-settings/',
  '/api/roles/',
  '/api/coupons/',
]

const ALLOWED_ORIGINS = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map((s) => s.trim())
  : ['http://localhost:3000', 'http://localhost:3456', 'https://preview-9e969ea3-851a-4098-a0a9-024bb4856b9b.space-z.ai']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const origin = request.headers.get('origin')

  // ─── Security headers on all responses ───────────────────────────
  const response = NextResponse.next()
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), interest-cohort=()')
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  response.headers.set('X-Request-ID', crypto.randomUUID())

  // ─── Allow public / static paths ─────────────────────────────────
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p))) {
    // Still apply CORS to API responses
    if (pathname.startsWith('/api/')) {
      applyCors(response, origin)
    }
    return response
  }

  // ─── CORS preflight ─────────────────────────────────────────────
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': resolveOrigin(origin),
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Request-ID',
        'Access-Control-Max-Age': '86400',
        'Access-Control-Allow-Credentials': 'true',
      },
    })
  }

  // ─── SuperAdmin routes: require superadmin role in JWT ──────────
  const isSuperAdminRoute = SUPERADMIN_PATHS.some(
    (prefix) => pathname.startsWith(prefix)
  )

  // ─── Auth-required routes ───────────────────────────────────────
  const isAuthRoute = AUTH_REQUIRED_PREFIXES.some(
    (prefix) => pathname.startsWith(prefix)
  )

  if (isSuperAdminRoute || isAuthRoute) {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401, headers: response.headers }
      )
    }

    // Synchronous JWT verification in Edge Runtime
    // Note: Full async verification happens in the route handler via withAuth()
    // Middleware does a lightweight check to reject clearly invalid tokens early
    const token = authHeader.replace('Bearer ', '')
    if (token.split('.').length !== 3) {
      return NextResponse.json(
        { error: 'Invalid token format', code: 'UNAUTHORIZED' },
        { status: 401, headers: response.headers }
      )
    }

    // For SuperAdmin routes, we need to verify the role
    // This is a lightweight base64 decode check (not cryptographic verification)
    if (isSuperAdminRoute) {
      try {
        const payloadB64 = token.split('.')[1]
        const payloadStr = Buffer.from(payloadB64, 'base64url').toString('utf-8')
        const payload = JSON.parse(payloadStr)
        if (payload.role !== 'superadmin') {
          return NextResponse.json(
            { error: 'Access denied', code: 'FORBIDDEN' },
            { status: 403, headers: response.headers }
          )
        }
      } catch {
        return NextResponse.json(
          { error: 'Invalid token', code: 'UNAUTHORIZED' },
          { status: 401, headers: response.headers }
        )
      }
    }
  }

  applyCors(response, origin)
  return response
}

function resolveOrigin(origin: string | null): string {
  if (origin && ALLOWED_ORIGINS.includes(origin)) return origin
  // Allow any origin in development (preview proxy, etc.)
  if (origin) return origin
  return ALLOWED_ORIGINS[0]
}

function applyCors(response: NextResponse, origin: string | null) {
  response.headers.set('Access-Control-Allow-Origin', resolveOrigin(origin))
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Request-ID')
  response.headers.set('Access-Control-Allow-Credentials', 'true')
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|logo.svg).*)',
  ],
}