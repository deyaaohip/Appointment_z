// ============================================================
// Super Admin Authentication — Completely Separate System
// ============================================================
// This endpoint is independent from tenant authentication.
// Super admin credentials are NOT linked to any tenant.
// ============================================================

import { NextRequest, NextResponse } from 'next/server'

// ─── Super Admin Credentials (hardcoded for demo/platform) ────
const SUPER_ADMINS: Record<string, { password: string; name: string }> = {
  'admin@bookflow.com': {
    password: 'Admin@2024',
    name: 'مدير النظام',
  },
}

// ─── Simple Token Creation (no jose dependency for serverless) ─
function createSuperAdminToken(payload: Record<string, unknown>): string {
  const header = btoa(
    JSON.stringify({ alg: 'HS256', typ: 'JWT' })
  )
  const data = btoa(
    unescape(
      encodeURIComponent(
        JSON.stringify({
          ...payload,
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 86400,
          iss: 'bookflow-superadmin',
          aud: 'bookflow-platform',
        })
      )
    )
  )
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
  const sig = btoa(data + ':bookflow-superadmin-secret')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
  return `${header}.${data}.${sig}`
}

// ─── CORS Helper ──────────────────────────────────────────────
function corsHeaders(origin: string | null): Record<string, string> {
  const allowed = origin || '*'
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Request-ID',
    'Access-Control-Allow-Credentials': 'true',
  }
}

// ─── OPTIONS ──────────────────────────────────────────────────
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(request.headers.get('origin')),
  })
}

// ─── POST: Login ─────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const origin = request.headers.get('origin')
    const body = await request.json().catch(() => null)

    if (!body || !body.email || !body.password) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني وكلمة المرور مطلوبان', code: 'VALIDATION_ERROR' },
        { status: 400, headers: corsHeaders(origin) }
      )
    }

    const { email, password } = body
    const admin = SUPER_ADMINS[email.toLowerCase().trim()]

    if (!admin || admin.password !== password) {
      return NextResponse.json(
        { error: 'بيانات الدخول غير صحيحة', code: 'INVALID_CREDENTIALS' },
        { status: 401, headers: corsHeaders(origin) }
      )
    }

    // Create super admin JWT — NO tenantId, role = 'superadmin'
    const token = createSuperAdminToken({
      userId: 'superadmin-001',
      email: email.toLowerCase().trim(),
      role: 'superadmin',
      name: admin.name,
      isSuperAdmin: true,
      tenantId: null,
    })

    // Full platform permissions
    const allPermissions: Record<string, Record<string, boolean>> = {}
    const resources = [
      'dashboard', 'bookings', 'customers', 'employees', 'services',
      'branches', 'payments', 'reports', 'settings', 'roles',
      'coupons', 'notifications', 'audit_logs', 'whatsapp',
      'subscriptions', 'tenants', 'platform_settings', 'system_health',
      'user_management', 'billing',
    ]
    const actions = ['view', 'create', 'edit', 'delete', 'manage']
    for (const res of resources) {
      allPermissions[res] = {}
      for (const act of actions) {
        allPermissions[res][act] = true
      }
    }

    return NextResponse.json(
      {
        success: true,
        token,
        user: {
          id: 'superadmin-001',
          email: email.toLowerCase().trim(),
          name: admin.name,
          avatar: null,
          phone: null,
          lastLoginAt: new Date().toISOString(),
        },
        role: {
          id: 'superadmin-role',
          name: 'مدير النظام',
          description: 'صلاحيات كاملة على المنصة بالكامل',
        },
        permissions: allPermissions,
        isSuperAdmin: true,
        tenant: null, // Super admin has no tenant
        platformInfo: {
          name: 'BookFlow Platform',
          version: '2.5.0',
          environment: process.env.NODE_ENV || 'production',
        },
      },
      { status: 200, headers: corsHeaders(origin) }
    )
  } catch (error) {
    console.error('Super admin auth error:', error)
    return NextResponse.json(
      { error: 'خطأ في الخادم', code: 'INTERNAL_ERROR' },
      { status: 500, headers: corsHeaders(request.headers.get('origin')) }
    )
  }
}