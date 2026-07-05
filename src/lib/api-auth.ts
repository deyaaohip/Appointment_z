// ============================================================
// Unified API Authentication & Authorization Helper
// ============================================================
// Every API route MUST use `withAuth()` to:
// 1. Validate the JWT token from the Authorization header
// 2. Extract userId, tenantId, role, permissions
// 3. Check RBAC permissions for the requested action
// 4. Apply rate limiting
// 5. Return proper error responses
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/security/session'
import { rateLimit } from '@/lib/security/rate-limit'
import { hasPermission } from '@/lib/security/rbac'
import type { PermissionResource, PermissionAction, PermissionMap } from '@/types'

// ─── CORS Configuration ──────────────────────────────────────────────

const ALLOWED_ORIGINS = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map((s) => s.trim())
  : ['http://localhost:3000', 'http://localhost:3456']

export function getCorsHeaders(origin?: string | null): Record<string, string> {
  const allowed = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Request-ID',
    'Access-Control-Allow-Credentials': 'true',
  }
}

export function optionsHandler(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(request.headers.get('origin')),
  })
}

// ─── Auth Context ────────────────────────────────────────────────────

export interface AuthContext {
  userId: string
  tenantId: string
  email: string
  role: string
  permissions: PermissionMap
  isSuperAdmin: boolean
}

// ─── withAuth: Main authentication middleware for API routes ─────────

interface WithAuthOptions {
  /** Resource to check permission for (e.g., 'bookings', 'customers') */
  resource?: PermissionResource
  /** Action to check permission for (e.g., 'view', 'create', 'edit', 'delete') */
  action?: PermissionAction
  /** Whether to skip auth entirely (for public endpoints) */
  public?: boolean
  /** Apply strict rate limiting (5 req/min) instead of default (100 req/min) */
  strictRateLimit?: boolean
}

/**
 * Extracts and validates the JWT token from the request.
 * Returns the auth context or an error NextResponse.
 *
 * Usage in API routes:
 *   const auth = await withAuth(request, { resource: 'bookings', action: 'create' })
 *   if (auth.error) return auth.error
 *   // auth.context.userId, auth.context.tenantId, etc. are available
 */
export async function withAuth(
  request: NextRequest,
  options: WithAuthOptions = {}
): Promise<{ context: AuthContext } | { error: NextResponse }> {
  const { resource, action, public: isPublic, strictRateLimit } = options

  // ─── Rate limiting ────────────────────────────────────────────────
  const clientId = request.headers.get('x-forwarded-for') || request.ip || 'unknown'
  const rateResult = rateLimit(
    `api:${clientId}`,
    strictRateLimit ? { windowMs: 60_000, maxRequests: 5 } : undefined
  )
  if (!rateResult.allowed) {
    return {
      error: NextResponse.json(
        { error: 'Too many requests', code: 'RATE_LIMITED' },
        {
          status: 429,
          headers: {
            ...getCorsHeaders(request.headers.get('origin')),
            'Retry-After': String(Math.ceil((rateResult.resetAt - Date.now()) / 1000)),
          },
        }
      ),
    }
  }

  // ─── Public endpoints skip auth ───────────────────────────────────
  if (isPublic) {
    // Still resolve tenant for demo mode
    const tenant = await resolveTenant(null)
    return {
      context: {
        userId: '',
        tenantId: tenant?.id || '',
        email: '',
        role: 'viewer',
        permissions: {},
        isSuperAdmin: false,
      },
    }
  }

  // ─── Extract and validate JWT ─────────────────────────────────────
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return {
      error: NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401, headers: getCorsHeaders(request.headers.get('origin')) }
      ),
    }
  }

  const token = authHeader.replace('Bearer ', '')
  const payload = await validateSession(token)
  if (!payload) {
    return {
      error: NextResponse.json(
        { error: 'Invalid or expired token', code: 'UNAUTHORIZED' },
        { status: 401, headers: getCorsHeaders(request.headers.get('origin')) }
      ),
    }
  }

  // ─── Build auth context ───────────────────────────────────────────
  const isSuperAdmin = payload.role === 'superadmin'
  const context: AuthContext = {
    userId: payload.userId,
    tenantId: payload.tenantId,
    email: payload.email,
    role: payload.role,
    permissions: (payload.permissions || {}) as PermissionMap,
    isSuperAdmin,
  }

  // ─── RBAC permission check ────────────────────────────────────────
  if (resource && action && !isSuperAdmin) {
    if (!hasPermission(context.permissions, resource, action)) {
      return {
        error: NextResponse.json(
          {
            error: 'Insufficient permissions',
            code: 'FORBIDDEN',
            required: { resource, action },
          },
          { status: 403, headers: getCorsHeaders(request.headers.get('origin')) }
        ),
      }
    }
  }

  return { context }
}

// ─── Tenant Resolution ───────────────────────────────────────────────

/**
 * Resolves the tenant from the auth context.
 * Falls back to first active tenant only in development.
 */
export async function resolveTenant(tenantId: string | null) {
  const { db } = await import('@/lib/db')
  if (tenantId) {
    return db.tenant.findFirst({ where: { id: tenantId, isActive: true } })
  }
  // Development/demo fallback
  if (process.env.NODE_ENV === 'development') {
    return db.tenant.findFirst({ where: { isActive: true } })
  }
  return null
}

// ─── Pagination Helper ───────────────────────────────────────────────

const MAX_PAGE_SIZE = 100
const DEFAULT_PAGE_SIZE = 20

export function getPagination(searchParams: URLSearchParams) {
  let page = parseInt(searchParams.get('page') ?? '1', 10)
  let limit = parseInt(searchParams.get('limit') ?? String(DEFAULT_PAGE_SIZE), 10)

  // Clamp values
  page = Math.max(1, page)
  limit = Math.max(1, Math.min(MAX_PAGE_SIZE, limit))
  const skip = (page - 1) * limit

  return { page, limit, skip, totalPages: (total: number) => Math.ceil(total / limit) }
}

// ─── Success / Error Response Helpers ────────────────────────────────

export function ok(data: unknown, origin?: string | null, extra?: Record<string, string>) {
  return NextResponse.json(data, {
    status: 200,
    headers: { ...getCorsHeaders(origin), ...extra },
  })
}

export function created(data: unknown, origin?: string | null) {
  return NextResponse.json(data, {
    status: 201,
    headers: getCorsHeaders(origin),
  })
}

export function err(message: string, status: number, origin?: string | null, code?: string) {
  return NextResponse.json(
    { error: message, code: code || 'ERROR' },
    { status, headers: getCorsHeaders(origin) }
  )
}

export function internalError(origin?: string | null) {
  return NextResponse.json(
    { error: 'Internal server error', code: 'INTERNAL_ERROR' },
    { status: 500, headers: getCorsHeaders(origin) }
  )
}