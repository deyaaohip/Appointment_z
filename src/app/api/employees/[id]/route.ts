import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'
import { withAuth, optionsHandler, ok, err, internalError, getCorsHeaders } from '@/lib/api-auth'

export async function OPTIONS(request: NextRequest) {
  return optionsHandler(request)
}

// ===================== GET: Employee Detail =====================
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await withAuth(request, { resource: 'employees', action: 'view' })
    if (auth.error) return auth.error
    const { tenantId: tid } = auth.context

    const { id } = await params
    const tenant = await db.tenant.findFirst({ where: { id: tid, isActive: true } })
    if (!tenant) {
      return err('No tenant found', 404, request.headers.get('origin'))
    }

    const employee = await db.employee.findFirst({
      where: { id, tenantId: tenant.id },
      include: {
        branch: true,
        schedules: {
          orderBy: { dayOfWeek: 'asc' },
        },
        services: {
          include: { service: { include: { category: true } } },
        },
        leaves: {
          where: { startDate: { gte: new Date() } },
          orderBy: { startDate: 'asc' },
        },
      },
    })

    if (!employee) {
      return err('Employee not found', 404, request.headers.get('origin'))
    }

    // Today's bookings
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const todayBookings = await db.booking.findMany({
      where: {
        employeeId: id,
        tenantId: tenant.id,
        startDate: { gte: today, lt: tomorrow },
      },
      include: {
        customer: { select: { id: true, firstName: true, lastName: true, phone: true } },
        services: { include: { service: true } },
        branch: { select: { id: true, name: true } },
      },
      orderBy: { startTime: 'asc' },
    })

    // Performance stats
    const [totalCompleted, totalRevenue, avgRating] = await Promise.all([
      db.booking.count({
        where: { employeeId: id, tenantId: tenant.id, status: 'completed' },
      }),
      db.booking.aggregate({
        _sum: { totalPrice: true },
        where: { employeeId: id, tenantId: tenant.id, status: 'completed' },
      }),
      // No rating model, default to 0
      Promise.resolve(0),
    ])

    // This month stats
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
    const [monthBookings, monthRevenue] = await Promise.all([
      db.booking.count({
        where: {
          employeeId: id,
          tenantId: tenant.id,
          status: 'completed',
          startDate: { gte: monthStart },
        },
      }),
      db.booking.aggregate({
        _sum: { totalPrice: true },
        where: {
          employeeId: id,
          tenantId: tenant.id,
          status: 'completed',
          startDate: { gte: monthStart },
        },
      }),
    ])

    return ok(
      {
        employee,
        todayBookings,
        performance: {
          totalCompleted,
          totalRevenue: totalRevenue._sum.totalPrice ?? 0,
          avgRating,
          monthBookings,
          monthRevenue: monthRevenue._sum.totalPrice ?? 0,
        },
      },
      request.headers.get('origin')
    )
  } catch (error) {
    console.error('Employee detail error:', error)
    return internalError(request.headers.get('origin'))
  }
}

// ===================== PUT: Update Employee =====================
const updateEmployeeSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  avatar: z.string().optional(),
  bio: z.string().optional(),
  specialization: z.string().optional(),
  commissionRate: z.number().min(0).max(100).optional(),
  branchId: z.string().optional(),
  isActive: z.boolean().optional(),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await withAuth(request, { resource: 'employees', action: 'edit' })
    if (auth.error) return auth.error
    const { tenantId: tid } = auth.context

    const { id } = await params
    const body = await request.json()
    const parsed = updateEmployeeSchema.safeParse(body)

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

    const existing = await db.employee.findFirst({ where: { id, tenantId: tenant.id } })
    if (!existing) {
      return err('Employee not found', 404, request.headers.get('origin'))
    }

    const updateData: Record<string, unknown> = {}
    if (parsed.data.name !== undefined) updateData.name = parsed.data.name
    if (parsed.data.email !== undefined) updateData.email = parsed.data.email || null
    if (parsed.data.phone !== undefined) updateData.phone = parsed.data.phone || null
    if (parsed.data.avatar !== undefined) updateData.avatar = parsed.data.avatar || null
    if (parsed.data.bio !== undefined) updateData.bio = parsed.data.bio || null
    if (parsed.data.specialization !== undefined) updateData.specialization = parsed.data.specialization || null
    if (parsed.data.commissionRate !== undefined) updateData.commissionRate = parsed.data.commissionRate
    if (parsed.data.branchId !== undefined) updateData.branchId = parsed.data.branchId
    if (parsed.data.isActive !== undefined) updateData.isActive = parsed.data.isActive

    const employee = await db.employee.update({
      where: { id },
      data: updateData,
      include: {
        branch: { select: { id: true, name: true } },
      },
    })

    return ok({ employee }, request.headers.get('origin'))
  } catch (error) {
    console.error('Update employee error:', error)
    return internalError(request.headers.get('origin'))
  }
}

// ===================== DELETE: Soft Delete Employee =====================
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await withAuth(request, { resource: 'employees', action: 'delete' })
    if (auth.error) return auth.error
    const { tenantId: tid } = auth.context

    const { id } = await params
    const tenant = await db.tenant.findFirst({ where: { id: tid, isActive: true } })
    if (!tenant) {
      return err('No tenant found', 404, request.headers.get('origin'))
    }

    const existing = await db.employee.findFirst({ where: { id, tenantId: tenant.id } })
    if (!existing) {
      return err('Employee not found', 404, request.headers.get('origin'))
    }

    const employee = await db.employee.update({
      where: { id },
      data: { isActive: false },
    })

    return ok({ employee, message: 'Employee deactivated successfully' }, request.headers.get('origin'))
  } catch (error) {
    console.error('Delete employee error:', error)
    return internalError(request.headers.get('origin'))
  }
}