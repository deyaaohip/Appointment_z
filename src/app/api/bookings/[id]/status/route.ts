import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'
import { withAuth, optionsHandler, ok, err, internalError, getCorsHeaders } from '@/lib/api-auth'

export async function OPTIONS(request: NextRequest) {
  return optionsHandler(request)
}

const statusTransitionSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show']),
})

const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['completed', 'cancelled', 'no_show', 'in_progress'],
  in_progress: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
  no_show: [],
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await withAuth(request, { resource: 'bookings', action: 'edit' })
    if (auth.error) return auth.error
    const { tenantId: tid } = auth.context

    const { id } = await params
    const body = await request.json()
    const parsed = statusTransitionSchema.safeParse(body)

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

    const booking = await db.booking.findFirst({ where: { id, tenantId: tenant.id } })
    if (!booking) {
      return err('Booking not found', 404, request.headers.get('origin'))
    }

    const { status: newStatus } = parsed.data
    const currentStatus = booking.status

    // Validate status transition
    const allowed = VALID_TRANSITIONS[currentStatus]
    if (!allowed || !allowed.includes(newStatus)) {
      return NextResponse.json(
        {
          error: `Invalid status transition`,
          message: `Cannot transition from "${currentStatus}" to "${newStatus}"`,
          allowedTransitions: allowed,
        },
        { status: 400, headers: getCorsHeaders(request.headers.get('origin')) }
      )
    }

    // If marking as completed, update any pending payments atomically
    const updated = await db.$transaction(async (tx) => {
      if (newStatus === 'completed') {
        await tx.payment.updateMany({
          where: { bookingId: id, status: 'pending' },
          data: { status: 'completed' },
        })
      }

      return await tx.booking.update({
        where: { id },
        data: { status: newStatus },
        include: {
          customer: true,
          employee: { select: { id: true, name: true, avatar: true } },
          branch: true,
          services: { include: { service: true } },
          payments: true,
        },
      })
    })

    return ok(
      {
        booking: updated,
        message: `Booking status updated from "${currentStatus}" to "${newStatus}"`,
      },
      request.headers.get('origin')
    )
  } catch (error) {
    console.error('Status update error:', error)
    return internalError(request.headers.get('origin'))
  }
}