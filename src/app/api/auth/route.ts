import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { authRateLimit } from '@/lib/security/rate-limit'
import { sanitizeInput } from '@/lib/security/encryption'
import { getRolePermissions } from '@/lib/security/rbac'
import { createSession } from '@/lib/security/session'
import { sanitizeObject } from '@/lib/security/validation'
import { isDatabaseAvailable } from '@/lib/demo-mode'
import {
  DEMO_TENANT, DEMO_BRANCHES, DEMO_SERVICES, DEMO_EMPLOYEES,
  DEMO_CUSTOMERS, DEMO_BOOKINGS, DEMO_COUPONS, DEMO_ROLES, DEMO_PAYMENTS,
} from '@/lib/demo-data'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().optional(),
  name: z.string().optional(),
  phone: z.string().optional(),
  businessName: z.string().optional(),
  isRegister: z.boolean().optional(),
  isDemo: z.boolean().optional(),
})

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders })
}

// ── Demo mode response builder ──────────────────────────────────
function buildDemoResponse(email: string, name: string, remaining: number) {
  const demoPermissions = getRolePermissions('admin')
  return {
    user: {
      id: 'demo-admin',
      email,
      name: name || email.split('@')[0],
      avatar: null,
      phone: null,
      lastLoginAt: new Date().toISOString(),
    },
    role: { id: 'demo-role-1', name: 'admin', description: 'مدير النظام - صلاحيات كاملة' },
    permissions: demoPermissions,
    tenant: {
      id: DEMO_TENANT.id,
      name: DEMO_TENANT.name,
      slug: DEMO_TENANT.slug,
      logo: DEMO_TENANT.logo,
      primaryColor: DEMO_TENANT.primaryColor,
      secondaryColor: DEMO_TENANT.secondaryColor,
      timezone: DEMO_TENANT.timezone,
      currency: DEMO_TENANT.currency,
      language: DEMO_TENANT.language,
      theme: DEMO_TENANT.theme,
      branches: DEMO_BRANCHES.map(b => ({ id: b.id, name: b.name })),
    },
    demoMode: true,
  }
}

export async function POST(request: NextRequest) {
  const clientIp = request.headers.get('x-forwarded-for') || 'unknown'
  const userAgent = request.headers.get('user-agent') || 'unknown'

  // Rate limiting
  const { allowed, remaining } = authRateLimit(clientIp)
  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many login attempts. Please try again later.', code: 'RATE_LIMITED' },
      { status: 429, headers: { ...corsHeaders, 'X-RateLimit-Remaining': '0' } }
    )
  }

  try {
    const body = await request.json()
    const sanitizedBody = sanitizeObject(body)
    const parsed = loginSchema.safeParse(sanitizedBody)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400, headers: corsHeaders }
      )
    }

    const email = sanitizeInput(parsed.data.email.toLowerCase())
    const userName = parsed.data.name || email.split('@')[0]
    const isDemo = parsed.data.isDemo

    // ── Explicit demo mode ─────────────────────────────────────
    if (isDemo) {
      const demoData = buildDemoResponse(email, userName, remaining)
      const sessionToken = await createSession({
        userId: 'demo-admin',
        tenantId: DEMO_TENANT.id,
        email,
        role: 'admin',
        permissions: demoData.permissions,
      })
      return NextResponse.json(
        { ...demoData, token: sessionToken },
        { status: 200, headers: { ...corsHeaders, 'X-RateLimit-Remaining': String(remaining) } }
      )
    }

    // ── Check if database is available ────────────────────────
    const dbAvailable = await isDatabaseAvailable()
    if (!dbAvailable) {
      // Auto-fallback to demo mode when DB is not available
      const demoData = buildDemoResponse(email, userName, remaining)
      const sessionToken = await createSession({
        userId: 'demo-admin',
        tenantId: DEMO_TENANT.id,
        email,
        role: 'admin',
        permissions: demoData.permissions,
      })
      return NextResponse.json(
        { ...demoData, token: sessionToken },
        { status: 200, headers: { ...corsHeaders, 'X-RateLimit-Remaining': String(remaining) } }
      )
    }

    // ── Database is available: normal auth flow ───────────────
    const { db } = await import('@/lib/db')
    const { createAuditLog } = await import('@/lib/security/audit')

    let tenant = await db.tenant.findFirst({
      where: { isActive: true },
      include: { branches: { where: { isActive: true }, select: { id: true, name: true } } },
    })

    if (!tenant) {
      tenant = await db.tenant.create({
        data: {
          name: 'My Business',
          slug: 'default',
          isActive: true,
          primaryColor: '#059669',
          secondaryColor: '#0d9488',
          timezone: 'Asia/Riyadh',
          currency: 'SAR',
          language: 'ar',
          theme: 'light',
          branches: { create: { name: 'Main Branch', isActive: true } },
        },
        include: { branches: { where: { isActive: true }, select: { id: true, name: true } } },
      })
    }

    let user = await db.tenantUser.findFirst({
      where: { email, tenantId: tenant.id, isActive: true },
      include: { role: true, tenant: true },
    })

    if (!user) {
      const role = await db.role.findFirst({ where: { tenantId: tenant.id, isDefault: true } })
      if (!role) {
        user = await db.$transaction(async (tx) => {
          const createdRole = await tx.role.create({
            data: {
              tenantId: tenant.id, name: 'admin', description: 'System Administrator',
              isDefault: true, permissions: JSON.stringify(getRolePermissions('admin')),
            },
          })
          return await tx.tenantUser.create({
            data: {
              tenantId: tenant.id, roleId: createdRole.id,
              email, name: userName, phone: null, isActive: true,
            },
            include: { role: true, tenant: true },
          })
        })
      } else {
        user = await db.tenantUser.create({
          data: {
            tenantId: tenant.id, roleId: role.id,
            email, name: userName, phone: null, isActive: true,
          },
          include: { role: true, tenant: true },
        })
      }
    }

    const permissions = JSON.parse(user.role.permissions || '{}')

    await db.tenantUser.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    })

    const sessionToken = await createSession({
      userId: user.id,
      tenantId: tenant.id,
      email: user.email,
      role: user.role.name,
      permissions,
    })

    try {
      await createAuditLog({
        userId: user.id,
        tenantId: tenant.id,
        action: 'login',
        entity: 'session',
        details: { method: 'email', email },
        ipAddress: clientIp,
        userAgent,
      })
    } catch { /* audit log is non-critical */ }

    return NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
          phone: user.phone,
          lastLoginAt: new Date().toISOString(),
        },
        role: { id: user.role.id, name: user.role.name, description: user.role.description },
        permissions,
        tenant: {
          id: tenant.id, name: tenant.name, slug: tenant.slug,
          logo: tenant.logo, primaryColor: tenant.primaryColor, secondaryColor: tenant.secondaryColor,
          timezone: tenant.timezone, currency: tenant.currency,
          language: tenant.language, theme: tenant.theme,
          branches: tenant.branches,
        },
        token: sessionToken,
      },
      { status: 200, headers: { ...corsHeaders, 'X-RateLimit-Remaining': String(remaining) } }
    )
  } catch (error) {
    console.error('Auth error:', error)
    // Last resort: return demo mode on any error
    try {
      const body = await request.json().catch(() => ({}))
      const email = (body.email || 'demo@bookflow.com').toLowerCase()
      const name = body.name || email.split('@')[0]
      const demoData = buildDemoResponse(email, name, 5)
      const sessionToken = await createSession({
        userId: 'demo-admin',
        tenantId: DEMO_TENANT.id,
        email,
        role: 'admin',
        permissions: demoData.permissions,
      })
      return NextResponse.json(
        { ...demoData, token: sessionToken },
        { status: 200, headers: corsHeaders }
      )
    } catch {
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500, headers: corsHeaders }
      )
    }
  }
}