import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAuth, optionsHandler, ok, err, internalError, getPagination } from '@/lib/api-auth'

export async function OPTIONS(request: NextRequest) {
  return optionsHandler(request)
}

// ===================== GET: List Payments =====================
export async function GET(request: NextRequest) {
  try {
    const auth = await withAuth(request, { resource: 'payments', action: 'view' })
    if (auth.error) return auth.error
    const { tenantId: tid } = auth.context

    const tenant = await db.tenant.findFirst({ where: { id: tid, isActive: true } })
    if (!tenant) {
      return err('No tenant found', 404, request.headers.get('origin'))
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const bookingId = searchParams.get('bookingId')
    const customerId = searchParams.get('customerId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const { page, limit, skip, totalPages } = getPagination(searchParams)

    const where: Record<string, unknown> = { tenantId: tenant.id }

    if (status) where.status = status
    if (bookingId) where.bookingId = bookingId
    if (customerId) where.customerId = customerId

    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) {
        const start = new Date(startDate)
        start.setHours(0, 0, 0, 0)
        ;(where.createdAt as Record<string, unknown>).gte = start
      }
      if (endDate) {
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        ;(where.createdAt as Record<string, unknown>).lte = end
      }
    }

    const [payments, total] = await Promise.all([
      db.payment.findMany({
        where,
        include: {
          booking: {
            select: { id: true, startDate: true, status: true, source: true },
          },
          customer: {
            select: { id: true, firstName: true, lastName: true, email: true, phone: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.payment.count({ where }),
    ])

    return ok({ payments, total, page, limit, totalPages: totalPages(total) }, request.headers.get('origin'))
  } catch (error) {
    console.error('Payments list error:', error)
    return internalError(request.headers.get('origin'))
  }
}