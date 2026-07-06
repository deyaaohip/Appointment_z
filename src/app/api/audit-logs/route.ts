import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAuth, optionsHandler, ok, err, internalError, getPagination } from '@/lib/api-auth'
import { isDatabaseAvailable } from '@/lib/demo-mode'
import { demoAuditLogs } from '@/lib/demo-responses'


export async function OPTIONS(request: NextRequest) {
  return optionsHandler(request)
}

// ===================== GET: List Audit Logs =====================
export async function GET(request: NextRequest) {
  try {
    // ── Demo mode fallback ───────────────────────────────────
    const dbOk = await isDatabaseAvailable()
    if (!dbOk) {
      const sp = new URL(request.url).searchParams
      const page = parseInt(sp.get('page') || '1')
      const limit = parseInt(sp.get('limit') || '20')
      return ok(demoAuditLogs(page, limit), request.headers.get('origin'))
    }

    const auth = await withAuth(request, { resource: 'audit_logs', action: 'view' })
    if (auth.error) return auth.error
    const { tenantId: tid } = auth.context

    const tenant = await db.tenant.findFirst({ where: { id: tid, isActive: true } })
    if (!tenant) {
      return err('No tenant found', 404, request.headers.get('origin'))
    }

    const { searchParams } = new URL(request.url)
    const { page, limit, skip, totalPages } = getPagination(searchParams)
    const search = searchParams.get('search')
    const action = searchParams.get('action')
    const entity = searchParams.get('entity')
    const userId = searchParams.get('userId')

    const where: Record<string, unknown> = { tenantId: tenant.id }

    if (action) where.action = action
    if (entity) where.entity = entity
    if (userId) where.userId = userId

    if (search) {
      where.OR = [
        { action: { contains: search } },
        { entity: { contains: search } },
        { userId: { contains: search } },
      ]
    }

    const [logs, total] = await Promise.all([
      db.auditLog.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.auditLog.count({ where }),
    ])

    return ok({ logs, total, page, totalPages: totalPages(total) }, request.headers.get('origin'))
  } catch (error) {
    console.error('Audit logs list error:', error)
    return internalError(request.headers.get('origin'))
  }
}