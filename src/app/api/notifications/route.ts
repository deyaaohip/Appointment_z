import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'
import { withAuth, optionsHandler, ok, err, internalError, getCorsHeaders } from '@/lib/api-auth'
import { isDatabaseAvailable } from '@/lib/demo-mode'
import { demoNotifications } from '@/lib/demo-responses'


export async function OPTIONS(request: NextRequest) {
  return optionsHandler(request)
}

// ===================== GET: List Notifications =====================
export async function GET(request: NextRequest) {
  try {
    // ── Demo mode fallback ───────────────────────────────────
    const dbOk = await isDatabaseAvailable()
    if (!dbOk) {
      return ok(demoNotifications(), request.headers.get('origin'))
    }

    const auth = await withAuth(request, { resource: 'notifications', action: 'view' })
    if (auth.error) return auth.error
    const { tenantId: tid } = auth.context

    const tenant = await db.tenant.findFirst({ where: { id: tid, isActive: true } })
    if (!tenant) {
      return err('No tenant found', 404, request.headers.get('origin'))
    }

    const notifications = await db.notification.findMany({
      where: { tenantId: tenant.id },
      orderBy: [{ isRead: 'asc' }, { createdAt: 'desc' }],
      take: 50,
    })

    const unreadCount = await db.notification.count({
      where: { tenantId: tenant.id, isRead: false },
    })

    return ok({ notifications, unreadCount }, request.headers.get('origin'))
  } catch (error) {
    console.error('Notifications list error:', error)
    return internalError(request.headers.get('origin'))
  }
}

// ===================== POST: Mark Notification as Read =====================
const markReadSchema = z.object({
  id: z.string().min(1, 'Notification ID is required'),
})

export async function POST(request: NextRequest) {
  try {
    const auth = await withAuth(request, { resource: 'notifications', action: 'create' })
    if (auth.error) return auth.error
    const { tenantId: tid } = auth.context

    const body = await request.json()
    const parsed = markReadSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400, headers: getCorsHeaders(request.headers.get('origin')) }
      )
    }

    const tenant = await db.tenant.findFirst({ where: { id: tid, isActive: true } })
    if (!tenant) {
      return err('No tenant found', 404, request.headers.get('origin'))
    }

    const notification = await db.notification.findFirst({
      where: { id: parsed.data.id, tenantId: tenant.id },
    })

    if (!notification) {
      return err('Notification not found', 404, request.headers.get('origin'))
    }

    const updated = await db.notification.update({
      where: { id: parsed.data.id },
      data: { isRead: true },
    })

    return ok(
      { notification: updated, message: 'Notification marked as read' },
      request.headers.get('origin')
    )
  } catch (error) {
    console.error('Mark notification error:', error)
    return internalError(request.headers.get('origin'))
  }
}