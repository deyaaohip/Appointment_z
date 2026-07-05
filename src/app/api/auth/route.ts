import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'
import { authRateLimit } from '@/lib/security/rate-limit'
import { sanitizeInput } from '@/lib/security/encryption'
import { createAuditLog } from '@/lib/security/audit'
import { getRolePermissions } from '@/lib/security/rbac'
import { createSession } from '@/lib/security/session'
import { sanitizeObject } from '@/lib/security/validation'

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
    const businessName = parsed.data.businessName
    const phone = parsed.data.phone
    const isDemo = parsed.data.isDemo
    const isRegister = parsed.data.isRegister

    // ── Demo mode: always return full admin access ─────────────────
    if (isDemo) {
      const demoPermissions = getRolePermissions('admin')
      const sessionToken = await createSession({
        userId: 'demo-admin',
        tenantId: 'demo-tenant',
        email,
        role: 'admin',
        permissions: demoPermissions,
      })
      return NextResponse.json(
        {
          user: { id: 'demo-admin', email, name: 'Demo User', avatar: null, phone: null, lastLoginAt: new Date() },
          role: { id: 'admin-role', name: 'admin', description: 'System Administrator' },
          permissions: demoPermissions,
          tenant: {
            id: 'demo-tenant', name: businessName || 'BookFlow Demo', slug: 'demo',
            logo: null, primaryColor: '#059669', secondaryColor: '#0d9488',
            timezone: 'Asia/Riyadh', currency: 'SAR', language: 'ar', theme: 'light',
            branches: [{ id: 'branch-1', name: 'Main Branch' }],
          },
          token: sessionToken,
        },
        { status: 200, headers: { ...corsHeaders, 'X-RateLimit-Remaining': String(remaining) } }
      )
    }

    // ── Try to find or create tenant ──────────────────────────────
    let tenant = await db.tenant.findFirst({
      where: { isActive: true },
      include: { branches: { where: { isActive: true }, select: { id: true, name: true } } },
    })

    if (!tenant) {
      tenant = await db.tenant.create({
        data: {
          name: businessName || 'My Business',
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

    // ── Try to find user ──────────────────────────────────────────
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
              email, name: userName, phone: phone || null, isActive: true,
            },
            include: { role: true, tenant: true },
          })
        })
      } else {
        user = await db.tenantUser.create({
          data: {
            tenantId: tenant.id, roleId: role.id,
            email, name: userName, phone: phone || null, isActive: true,
          },
          include: { role: true, tenant: true },
        })
      }
    }

    const permissions = JSON.parse(user.role.permissions || '{}')

    // Update last login
    await db.tenantUser.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    })

    // Create session token
    const sessionToken = await createSession({
      userId: user.id,
      tenantId: tenant.id,
      email: user.email,
      role: user.role.name,
      permissions,
    })

    // Audit log
    await createAuditLog({
      userId: user.id,
      tenantId: tenant.id,
      action: 'login',
      entity: 'session',
      details: { method: 'email', email },
      ipAddress: clientIp,
      userAgent,
    })

    return NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
          phone: user.phone,
          lastLoginAt: new Date(),
        },
        role: { id: user.role.id, name: user.role.name, description: user.role.description },
        permissions,
        tenant: {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
          logo: tenant.logo,
          primaryColor: tenant.primaryColor,
          secondaryColor: tenant.secondaryColor,
          timezone: tenant.timezone,
          currency: tenant.currency,
          language: tenant.language,
          theme: tenant.theme,
          branches: tenant.branches,
        },
        token: sessionToken,
      },
      {
        status: 200,
        headers: { ...corsHeaders, 'X-RateLimit-Remaining': String(remaining) },
      }
    )
  } catch (error) {
    console.error('Auth error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}