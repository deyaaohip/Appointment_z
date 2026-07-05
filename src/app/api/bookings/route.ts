import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'
import { withAuth, optionsHandler, ok, created, err, internalError, getPagination, getCorsHeaders } from '@/lib/api-auth'

export async function OPTIONS(request: NextRequest) {
  return optionsHandler(request)
}

// ===================== GET: List Bookings =====================
export async function GET(request: NextRequest) {
  try {
    const auth = await withAuth(request, { resource: 'bookings', action: 'view' })
    if (auth.error) return auth.error
    const { tenantId: tid } = auth.context

    const tenant = await db.tenant.findFirst({ where: { id: tid, isActive: true } })
    if (!tenant) {
      return err('No tenant found', 404, request.headers.get('origin'))
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const date = searchParams.get('date')
    const branchId = searchParams.get('branchId')
    const employeeId = searchParams.get('employeeId')
    const customerId = searchParams.get('customerId')
    const { page, limit, skip, totalPages } = getPagination(searchParams)

    // Date range filters (for calendar and reports)
    const startDateParam = searchParams.get('startDate')
    const endDateParam = searchParams.get('endDate')

    const where: Record<string, unknown> = { tenantId: tenant.id }

    if (status) where.status = status
    if (branchId) where.branchId = branchId
    if (employeeId) where.employeeId = employeeId
    if (customerId) where.customerId = customerId

    // Date filtering: single date OR date range
    if (startDateParam && endDateParam) {
      where.startDate = { gte: new Date(startDateParam + 'T00:00:00'), lte: new Date(endDateParam + 'T23:59:59') }
    } else if (date) {
      const start = new Date(date)
      start.setHours(0, 0, 0, 0)
      const end = new Date(date)
      end.setHours(23, 59, 59, 999)
      where.startDate = { gte: start, lte: end }
    }

    const [bookings, total] = await Promise.all([
      db.booking.findMany({
        where,
        include: {
          customer: true,
          branch: { select: { id: true, name: true } },
          services: { include: { service: true } },
          payments: true,
        },
        orderBy: { startDate: 'desc' },
        skip,
        take: limit,
      }),
      db.booking.count({ where }),
    ])

    // Enrich bookings with employee data from Employee table
    const employeeIds = [...new Set(bookings.map(b => b.employeeId).filter(Boolean))] as string[]
    const employees = employeeIds.length > 0
      ? await db.employee.findMany({ where: { id: { in: employeeIds } }, select: { id: true, name: true, avatar: true } })
      : []
    const employeeMap = Object.fromEntries(employees.map(e => [e.id, e]))

    const enrichedBookings = bookings.map(b => ({
      ...b,
      employee: b.employeeId ? (employeeMap[b.employeeId] || null) : null,
    }))

    return ok({ bookings: enrichedBookings, total, page, limit, totalPages: totalPages(total) }, request.headers.get('origin'))
  } catch (error) {
    console.error('Bookings list error:', error)
    return internalError(request.headers.get('origin'))
  }
}

// ===================== POST: Create Booking =====================
const createBookingSchema = z.object({
  branchId: z.string().min(1, 'Branch is required'),
  customerId: z.string().min(1, 'Customer is required'),
  employeeId: z.string().optional(),
  startDate: z.string().min(1, 'Start date is required'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  notes: z.string().optional(),
  internalNotes: z.string().optional(),
  source: z.string().default('online'),
  services: z.array(
    z.object({
      serviceId: z.string().min(1),
      quantity: z.number().int().default(1),
      employeeId: z.string().optional(),
    })
  ).min(1, 'At least one service is required'),
})

export async function POST(request: NextRequest) {
  try {
    const auth = await withAuth(request, { resource: 'bookings', action: 'create' })
    if (auth.error) return auth.error
    const { tenantId: tid } = auth.context

    const body = await request.json()
    const parsed = createBookingSchema.safeParse(body)

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

    const { branchId, customerId, employeeId, startDate, startTime, endTime, notes, internalNotes, source, services } =
      parsed.data

    // Validate branch belongs to tenant
    const branch = await db.branch.findFirst({ where: { id: branchId, tenantId: tenant.id } })
    if (!branch) {
      return err('Branch not found', 400, request.headers.get('origin'))
    }

    // Validate customer
    const customer = await db.customer.findFirst({ where: { id: customerId, tenantId: tenant.id } })
    if (!customer) {
      return err('Customer not found', 400, request.headers.get('origin'))
    }

    // Validate services and calculate total
    const serviceRecords = await db.service.findMany({
      where: { id: { in: services.map((s) => s.serviceId) }, tenantId: tenant.id, isActive: true },
    })

    if (serviceRecords.length !== services.length) {
      return err('One or more services not found or inactive', 400, request.headers.get('origin'))
    }

    let totalPrice = 0
    const bookingServices = services.map((s) => {
      const svc = serviceRecords.find((sr) => sr.id === s.serviceId)!
      totalPrice += svc.price * s.quantity
      return {
        serviceId: s.serviceId,
        price: svc.price,
        duration: svc.duration,
        quantity: s.quantity,
        employeeId: s.employeeId ?? employeeId ?? null,
      }
    })

    // Check for time conflicts if employee is assigned
    if (employeeId) {
      const bookingStart = new Date(`${startDate}T${startTime}`)
      const bookingEnd = new Date(`${startDate}T${endTime}`)

      const conflicts = await db.booking.count({
        where: {
          tenantId: tenant.id,
          employeeId,
          branchId,
          status: { notIn: ['cancelled', 'no_show'] },
          startDate: { lt: bookingEnd },
          endDate: { gt: bookingStart },
        },
      })

      if (conflicts > 0) {
        return err('Time conflict: Employee already has a booking at this time', 409, request.headers.get('origin'))
      }

      // Check employee availability / schedule
      const dayOfWeek = new Date(startDate).getDay()
      const schedule = await db.employeeSchedule.findFirst({
        where: {
          employeeId,
          tenantId: tenant.id,
          dayOfWeek,
          isWorking: true,
        },
      })

      if (!schedule) {
        return err('Employee is not available on this day', 400, request.headers.get('origin'))
      }

      if (startTime < schedule.startTime || endTime > schedule.endTime) {
        return err('Booking time is outside employee working hours', 400, request.headers.get('origin'))
      }

      // Check if employee is on leave
      const leaveDate = new Date(startDate)
      leaveDate.setHours(0, 0, 0, 0)
      const nextDay = new Date(leaveDate)
      nextDay.setDate(nextDay.getDate() + 1)

      const onLeave = await db.employeeLeave.count({
        where: {
          employeeId,
          tenantId: tenant.id,
          status: 'approved',
          startDate: { lt: nextDay },
          endDate: { gte: leaveDate },
        },
      })

      if (onLeave > 0) {
        return err('Employee is on leave on this date', 400, request.headers.get('origin'))
      }
    }

    // Create booking
    const booking = await db.booking.create({
      data: {
        tenantId: tenant.id,
        branchId,
        customerId,
        employeeId: employeeId ?? null,
        startDate: new Date(`${startDate}T${startTime}`),
        endDate: new Date(`${startDate}T${endTime}`),
        startTime,
        endTime,
        notes,
        internalNotes,
        source,
        totalPrice,
        status: 'pending',
        services: {
          create: bookingServices,
        },
      },
      include: {
        customer: true,
        branch: true,
        services: { include: { service: true } },
        payments: true,
      },
    })

      // Enrich with employee data
      let bookingWithEmployee = { ...booking }
      if (booking.employeeId) {
        const emp = await db.employee.findFirst({ where: { id: booking.employeeId }, select: { id: true, name: true, avatar: true } })
        bookingWithEmployee = { ...bookingWithEmployee, employee: emp }
      }

    return created({ booking: bookingWithEmployee }, request.headers.get('origin'))
  } catch (error) {
    console.error('Create booking error:', error)
    return internalError(request.headers.get('origin'))
  }
}