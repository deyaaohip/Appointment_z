import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'
import { withAuth, optionsHandler, ok, err, internalError, getCorsHeaders } from '@/lib/api-auth'

export async function OPTIONS(request: NextRequest) {
  return optionsHandler(request)
}

// ===================== GET: Customer Detail =====================
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await withAuth(request, { resource: 'customers', action: 'view' })
    if (auth.error) return auth.error
    const { tenantId: tid } = auth.context

    const { id } = await params
    const tenant = await db.tenant.findFirst({ where: { id: tid, isActive: true } })
    if (!tenant) {
      return err('No tenant found', 404, request.headers.get('origin'))
    }

    const customer = await db.customer.findFirst({
      where: { id, tenantId: tenant.id },
      include: {
        bookings: {
          include: {
            branch: { select: { id: true, name: true } },
            employee: { select: { id: true, name: true, avatar: true } },
            services: { include: { service: true } },
            payments: true,
          },
          orderBy: { startDate: 'desc' },
        },
        payments: {
          orderBy: { createdAt: 'desc' },
        },
        customerNotes: {
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!customer) {
      return err('Customer not found', 404, request.headers.get('origin'))
    }

    // Compute aggregate stats
    const [spentAgg, bookingCount, lastVisit] = await Promise.all([
      db.payment.aggregate({
        _sum: { amount: true },
        where: { customerId: id, status: { in: ['completed', 'paid'] } },
      }),
      db.booking.count({
        where: { customerId: id, status: { not: 'cancelled' } },
      }),
      db.booking.findFirst({
        where: { customerId: id, status: { not: 'cancelled' } },
        orderBy: { startDate: 'desc' },
        select: { startDate: true },
      }),
    ])

    return ok(
      {
        customer,
        stats: {
          totalSpent: spentAgg._sum.amount ?? 0,
          totalBookings: bookingCount,
          lastVisit: lastVisit?.startDate ?? null,
        },
      },
      request.headers.get('origin')
    )
  } catch (error) {
    console.error('Customer detail error:', error)
    return internalError(request.headers.get('origin'))
  }
}

// ===================== PUT: Update Customer =====================
const updateCustomerSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  gender: z.string().optional(),
  dateOfBirth: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  notes: z.string().optional(),
  membershipTier: z.string().optional(),
  loyaltyPoints: z.number().int().optional(),
  isBlacklisted: z.boolean().optional(),
  portalAccess: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  source: z.string().optional(),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await withAuth(request, { resource: 'customers', action: 'edit' })
    if (auth.error) return auth.error
    const { tenantId: tid } = auth.context

    const { id } = await params
    const body = await request.json()
    const parsed = updateCustomerSchema.safeParse(body)

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

    const existing = await db.customer.findFirst({ where: { id, tenantId: tenant.id } })
    if (!existing) {
      return err('Customer not found', 404, request.headers.get('origin'))
    }

    const updateData: Record<string, unknown> = {}
    if (parsed.data.firstName !== undefined) updateData.firstName = parsed.data.firstName
    if (parsed.data.lastName !== undefined) updateData.lastName = parsed.data.lastName
    if (parsed.data.email !== undefined) updateData.email = parsed.data.email || null
    if (parsed.data.phone !== undefined) updateData.phone = parsed.data.phone || null
    if (parsed.data.gender !== undefined) updateData.gender = parsed.data.gender || null
    if (parsed.data.dateOfBirth !== undefined) updateData.dateOfBirth = parsed.data.dateOfBirth ? new Date(parsed.data.dateOfBirth) : null
    if (parsed.data.address !== undefined) updateData.address = parsed.data.address || null
    if (parsed.data.city !== undefined) updateData.city = parsed.data.city || null
    if (parsed.data.country !== undefined) updateData.country = parsed.data.country || null
    if (parsed.data.notes !== undefined) updateData.notes = parsed.data.notes || null
    if (parsed.data.membershipTier !== undefined) updateData.membershipTier = parsed.data.membershipTier
    if (parsed.data.loyaltyPoints !== undefined) updateData.loyaltyPoints = parsed.data.loyaltyPoints
    if (parsed.data.isBlacklisted !== undefined) updateData.isBlacklisted = parsed.data.isBlacklisted
    if (parsed.data.portalAccess !== undefined) updateData.portalAccess = parsed.data.portalAccess
    if (parsed.data.tags !== undefined) updateData.tags = JSON.stringify(parsed.data.tags)
    if (parsed.data.source !== undefined) updateData.source = parsed.data.source

    const customer = await db.customer.update({
      where: { id },
      data: updateData,
    })

    return ok({ customer }, request.headers.get('origin'))
  } catch (error) {
    console.error('Update customer error:', error)
    return internalError(request.headers.get('origin'))
  }
}

// ===================== DELETE: Soft Delete Customer =====================
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await withAuth(request, { resource: 'customers', action: 'delete' })
    if (auth.error) return auth.error
    const { tenantId: tid } = auth.context

    const { id } = await params
    const tenant = await db.tenant.findFirst({ where: { id: tid, isActive: true } })
    if (!tenant) {
      return err('No tenant found', 404, request.headers.get('origin'))
    }

    const existing = await db.customer.findFirst({ where: { id, tenantId: tenant.id } })
    if (!existing) {
      return err('Customer not found', 404, request.headers.get('origin'))
    }

    const customer = await db.customer.update({
      where: { id },
      data: { isActive: false },
    })

    return ok({ customer, message: 'Customer deactivated successfully' }, request.headers.get('origin'))
  } catch (error) {
    console.error('Delete customer error:', error)
    return internalError(request.headers.get('origin'))
  }
}