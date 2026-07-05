import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'
import { withAuth, optionsHandler, ok, internalError, getCorsHeaders } from '@/lib/api-auth'

export async function OPTIONS(request: NextRequest) {
  return optionsHandler(request)
}

const querySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format'),
  employeeId: z.string().optional(),
  serviceId: z.string().optional(),
  branchId: z.string().optional(),
})

function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export async function GET(request: NextRequest) {
  try {
    const auth = await withAuth(request, { resource: 'bookings', action: 'view' })
    if (auth.error) return auth.error
    const { tenantId: tid } = auth.context

    const { searchParams } = new URL(request.url)
    const parsed = querySchema.safeParse({
      date: searchParams.get('date') ?? '',
      employeeId: searchParams.get('employeeId') ?? undefined,
      serviceId: searchParams.get('serviceId') ?? undefined,
      branchId: searchParams.get('branchId') ?? undefined,
    })

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400, headers: getCorsHeaders(request.headers.get('origin')) }
      )
    }

    const tenant = await db.tenant.findFirst({ where: { id: tid, isActive: true } })
    if (!tenant) {
      return NextResponse.json({ error: 'No tenant found' }, { status: 404, headers: getCorsHeaders(request.headers.get('origin')) })
    }

    const { date, employeeId, serviceId, branchId } = parsed.data
    const targetDate = new Date(date + 'T00:00:00')
    const dayOfWeek = targetDate.getDay()

    // Get employees to check availability for
    const employeeWhere: Record<string, unknown> = {
      tenantId: tenant.id,
      isActive: true,
    }
    if (employeeId) employeeWhere.id = employeeId
    if (branchId) employeeWhere.branchId = branchId

    const employees = await db.employee.findMany({
      where: employeeWhere,
      include: {
        schedules: {
          where: { dayOfWeek, isWorking: true },
        },
        leaves: {
          where: {
            status: 'approved',
            startDate: { lte: targetDate },
            endDate: { gte: targetDate },
          },
        },
      },
    })

    if (employees.length === 0) {
      return ok({ slots: [] }, request.headers.get('origin'))
    }

    // Get service duration if provided
    let serviceDuration = 30
    if (serviceId) {
      const service = await db.service.findFirst({
        where: { id: serviceId, tenantId: tenant.id },
      })
      if (service) {
        serviceDuration = service.duration + service.bufferAfter + service.bufferBefore
      }
    }

    // Get existing bookings for the date
    const dayStart = new Date(date + 'T00:00:00')
    const dayEnd = new Date(date + 'T23:59:59')

    const existingBookings = await db.booking.findMany({
      where: {
        tenantId: tenant.id,
        startDate: { gte: dayStart, lte: dayEnd },
        status: { notIn: ['cancelled', 'no_show'] },
        ...(employeeId ? { employeeId } : {}),
        ...(branchId ? { branchId } : {}),
      },
      select: {
        employeeId: true,
        startTime: true,
        endTime: true,
      },
    })

    // Generate 30-minute slots for the entire day
    const slots: { startTime: string; endTime: string; available: boolean; availableEmployees: string[] }[] = []
    for (let minutes = 0; minutes < 24 * 60; minutes += 30) {
      const slotStart = minutesToTime(minutes)
      const slotEnd = minutesToTime(minutes + 30)

      const availableEmployees: string[] = []

      for (const emp of employees) {
        // Check if on leave
        if (emp.leaves.length > 0) continue

        // Check if has schedule for this day
        const schedule = emp.schedules[0]
        if (!schedule) continue

        // Check if slot falls within working hours (including buffer)
        const schedStartMin = parseTimeToMinutes(schedule.startTime)
        const schedEndMin = parseTimeToMinutes(schedule.endTime)

        if (minutes + serviceDuration > schedEndMin) continue
        if (minutes < schedStartMin) continue

        // Check break time
        if (schedule.breakStart && schedule.breakEnd) {
          const breakStartMin = parseTimeToMinutes(schedule.breakStart)
          const breakEndMin = parseTimeToMinutes(schedule.breakEnd)
          if (minutes + serviceDuration > breakStartMin && minutes < breakEndMin) continue
        }

        // Check for booking conflicts for this employee
        const hasConflict = existingBookings.some(
          (b) =>
            b.employeeId === emp.id &&
            parseTimeToMinutes(b.startTime) < minutes + serviceDuration &&
            parseTimeToMinutes(b.endTime) > minutes
        )

        if (!hasConflict) {
          availableEmployees.push(emp.id)
        }
      }

      slots.push({
        startTime: slotStart,
        endTime: slotEnd,
        available: availableEmployees.length > 0,
        availableEmployees,
      })
    }

    return ok({ slots }, request.headers.get('origin'))
  } catch (error) {
    console.error('Availability error:', error)
    return internalError(request.headers.get('origin'))
  }
}