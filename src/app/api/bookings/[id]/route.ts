import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'
import { withAuth, optionsHandler, ok, err, internalError, getCorsHeaders } from '@/lib/api-auth'
import { isDatabaseAvailable } from '@/lib/demo-mode'
import { findDemo, enrichDemoBooking, DEMO_BOOKINGS } from '@/lib/demo-data'

export async function OPTIONS(request: NextRequest) {
  return optionsHandler(request)
}

// ===================== GET: Single Booking =====================
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await withAuth(request, { resource: 'bookings', action: 'view' })
    if (auth.error) return auth.error
    const { tenantId: tid } = auth.context

    const { id } = await params

    const dbOk = await isDatabaseAvailable()
    if (!dbOk) {
      const booking = findDemo(DEMO_BOOKINGS, id)
      if (!booking) return err('Booking not found', 404, request.headers.get('origin'))
      return ok({ booking: enrichDemoBooking(booking) }, request.headers.get('origin'))
    }

    const tenant = await db.tenant.findFirst({ where: { id: tid, isActive: true } })
    if (!tenant) {
      return err('No tenant found', 404, request.headers.get('origin'))
    }

    const booking = await db.booking.findFirst({
      where: { id, tenantId: tenant.id },
      include: {
        customer: true,
        branch: true,
        services: { include: { service: true } },
        payments: true,
        parent: { select: { id: true, startDate: true } },
        children: { select: { id: true, startDate: true, status: true } },
      },
    })

    if (!booking) {
      return err('Booking not found', 404, request.headers.get('origin'))
    }

    // Enrich with employee data
    let enriched = { ...booking, employee: null as null | { id: string; name: string; avatar: string | null; email: string | null; phone: string | null } }
    if (booking.employeeId) {
      const emp = await db.employee.findFirst({ where: { id: booking.employeeId }, select: { id: true, name: true, avatar: true, email: true, phone: true } })
      enriched = { ...enriched, employee: emp }
    }

    return ok({ booking: enriched }, request.headers.get('origin'))
  } catch (error) {
    console.error('Booking detail error:', error)
    return internalError(request.headers.get('origin'))
  }
}

// ===================== PUT: Update Booking =====================
const updateBookingSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show']).optional(),
  startDate: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  notes: z.string().optional(),
  internalNotes: z.string().optional(),
  employeeId: z.string().nullable().optional(),
  branchId: z.string().optional(),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await withAuth(request, { resource: 'bookings', action: 'edit' })
    if (auth.error) return auth.error
    const { tenantId: tid } = auth.context

    const { id } = await params
    const body = await request.json()
    const parsed = updateBookingSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400, headers: getCorsHeaders(request.headers.get('origin')) }
      )
    }

    const dbOk = await isDatabaseAvailable()
    if (!dbOk) {
      const booking = findDemo(DEMO_BOOKINGS, id)
      if (!booking) return err('Booking not found', 404, request.headers.get('origin'))
      const updated = { ...booking, ...parsed.data }
      return ok({ booking: enrichDemoBooking(updated as typeof DEMO_BOOKINGS[0]) }, request.headers.get('origin'))
    }

    const tenant = await db.tenant.findFirst({ where: { id: tid, isActive: true } })
    if (!tenant) {
      return err('No tenant found', 404, request.headers.get('origin'))
    }

    const existing = await db.booking.findFirst({ where: { id, tenantId: tenant.id } })
    if (!existing) {
      return err('Booking not found', 404, request.headers.get('origin'))
    }

    const updateData: Record<string, unknown> = {}
    if (parsed.data.status !== undefined) updateData.status = parsed.data.status
    if (parsed.data.notes !== undefined) updateData.notes = parsed.data.notes
    if (parsed.data.internalNotes !== undefined) updateData.internalNotes = parsed.data.internalNotes
    if (parsed.data.employeeId !== undefined) updateData.employeeId = parsed.data.employeeId
    if (parsed.data.branchId !== undefined) updateData.branchId = parsed.data.branchId

    if (parsed.data.startDate || parsed.data.startTime || parsed.data.endTime) {
      const dateStr = parsed.data.startDate
        ? parsed.data.startDate.split('T')[0]
        : existing.startDate.toISOString().split('T')[0]
      const time = parsed.data.startTime ?? existing.startTime
      const end = parsed.data.endTime ?? existing.endTime

      updateData.startDate = new Date(`${dateStr}T${time}`)
      updateData.endDate = new Date(`${dateStr}T${end}`)
      updateData.startTime = time
      updateData.endTime = end
    }

    const booking = await db.booking.update({
      where: { id },
      data: updateData,
      include: {
        customer: true,
        branch: true,
        services: { include: { service: true } },
        payments: true,
      },
    })

    // Enrich with employee data
    let enriched = { ...booking, employee: null as null | { id: string; name: string; avatar: string | null } }
    if (booking.employeeId) {
      const emp = await db.employee.findFirst({ where: { id: booking.employeeId }, select: { id: true, name: true, avatar: true } })
      enriched = { ...enriched, employee: emp }
    }

    return ok({ booking: enriched }, request.headers.get('origin'))
  } catch (error) {
    console.error('Update booking error:', error)
    return internalError(request.headers.get('origin'))
  }
}

// ===================== DELETE: Cancel/Delete Booking =====================
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await withAuth(request, { resource: 'bookings', action: 'delete' })
    if (auth.error) return auth.error
    const { tenantId: tid } = auth.context

    const { id } = await params

    const dbOk = await isDatabaseAvailable()
    if (!dbOk) {
      const booking = findDemo(DEMO_BOOKINGS, id)
      if (!booking) return err('Booking not found', 404, request.headers.get('origin'))
      return ok({ booking: enrichDemoBooking({ ...booking, status: 'cancelled' }), message: 'Booking cancelled successfully' }, request.headers.get('origin'))
    }

    const tenant = await db.tenant.findFirst({ where: { id: tid, isActive: true } })
    if (!tenant) {
      return err('No tenant found', 404, request.headers.get('origin'))
    }

    const existing = await db.booking.findFirst({ where: { id, tenantId: tenant.id } })
    if (!existing) {
      return err('Booking not found', 404, request.headers.get('origin'))
    }

    // Cancel the booking
    const booking = await db.booking.update({
      where: { id },
      data: { status: 'cancelled' },
      include: {
        customer: true,
        branch: true,
        services: { include: { service: true } },
        payments: true,
      },
    })

    // Enrich with employee data
    let enriched = { ...booking, employee: null as null | { id: string; name: string; avatar: string | null } }
    if (booking.employeeId) {
      const emp = await db.employee.findFirst({ where: { id: booking.employeeId }, select: { id: true, name: true, avatar: true } })
      enriched = { ...enriched, employee: emp }
    }

    return ok({ booking: enriched, message: 'Booking cancelled successfully' }, request.headers.get('origin'))
  } catch (error) {
    console.error('Delete booking error:', error)
    return internalError(request.headers.get('origin'))
  }
}