import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAuth, optionsHandler, ok, internalError } from '@/lib/api-auth'
import { isDatabaseAvailable } from '@/lib/demo-mode'
import { demoAdminTenants } from '@/lib/demo-responses'


export async function OPTIONS(request: NextRequest) {
  return optionsHandler(request)
}

export async function GET(request: NextRequest) {
  try {
    // ── Demo mode fallback ───────────────────────────────────
    const dbOk = await isDatabaseAvailable()
    if (!dbOk) {
      return ok(demoAdminTenants(), request.headers.get('origin'))
    }

    const auth = await withAuth(request, { resource: 'settings', action: 'view' })
    if (auth.error) return auth.error

    const tenants = await db.tenant.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        primaryColor: true,
        language: true,
        createdAt: true,
        _count: {
          select: {
            users: true,
            branches: true,
            bookings: true,
            customers: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })

    return ok({ tenants }, request.headers.get('origin'))
  } catch (error) {
    console.error('Admin tenants error:', error)
    return internalError(request.headers.get('origin'))
  }
}