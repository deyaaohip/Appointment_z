import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAuth, optionsHandler, ok, internalError } from '@/lib/api-auth'

export async function OPTIONS(request: NextRequest) {
  return optionsHandler(request)
}

export async function GET(request: NextRequest) {
  try {
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