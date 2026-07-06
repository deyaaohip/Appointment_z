import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'
import { withAuth, optionsHandler, ok, created, err, internalError, getPagination, getCorsHeaders } from '@/lib/api-auth'
import { isDatabaseAvailable } from '@/lib/demo-mode'
import { demoCustomersList } from '@/lib/demo-responses'


export async function OPTIONS(request: NextRequest) {
  return optionsHandler(request)
}

// ===================== GET: List Customers =====================
export async function GET(request: NextRequest) {
  try {
    // ── Demo mode fallback ───────────────────────────────────
    const dbOk = await isDatabaseAvailable()
    if (!dbOk) {
      const sp = new URL(request.url).searchParams
      const page = parseInt(sp.get('page') || '1')
      const limit = parseInt(sp.get('limit') || '20')
      const search = sp.get('search') || undefined
      return ok(demoCustomersList(page, limit, search), request.headers.get('origin'))
    }

    const auth = await withAuth(request, { resource: 'customers', action: 'view' })
    if (auth.error) return auth.error
    const { tenantId: tid } = auth.context

    const tenant = await db.tenant.findFirst({ where: { id: tid, isActive: true } })
    if (!tenant) {
      return err('No tenant found', 404, request.headers.get('origin'))
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const membershipTier = searchParams.get('membershipTier')
    const isActive = searchParams.get('isActive')
    const { page, limit, skip, totalPages } = getPagination(searchParams)

    const where: Record<string, unknown> = { tenantId: tenant.id }

    if (search) {
      where.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
      ]
    }
    if (membershipTier) where.membershipTier = membershipTier
    if (isActive !== null && isActive !== undefined && isActive !== '') {
      where.isActive = isActive === 'true'
    }

    const [customers, total] = await Promise.all([
      db.customer.findMany({
        where,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          avatar: true,
          gender: true,
          membershipTier: true,
          loyaltyPoints: true,
          isActive: true,
          source: true,
          createdAt: true,
          _count: { select: { bookings: true, payments: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.customer.count({ where }),
    ])

    // Enrich with total spent and last visit
    const enrichedCustomers = await Promise.all(
      customers.map(async (c) => {
        const spentAgg = await db.payment.aggregate({
          _sum: { amount: true },
          where: { customerId: c.id, status: { in: ['completed', 'paid'] } },
        })

        const lastBooking = await db.booking.findFirst({
          where: { customerId: c.id, status: { not: 'cancelled' } },
          orderBy: { startDate: 'desc' },
          select: { startDate: true },
        })

        return {
          ...c,
          totalSpent: spentAgg._sum.amount ?? 0,
          lastVisit: lastBooking?.startDate ?? null,
        }
      })
    )

    return ok({ customers: enrichedCustomers, total, page, limit, totalPages: totalPages(total) }, request.headers.get('origin'))
  } catch (error) {
    console.error('Customers list error:', error)
    return internalError(request.headers.get('origin'))
  }
}

// ===================== POST: Create Customer =====================
const createCustomerSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  gender: z.string().optional(),
  dateOfBirth: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  notes: z.string().optional(),
  source: z.string().default('direct'),
  tags: z.array(z.string()).default([]),
})

export async function POST(request: NextRequest) {
  try {
    const auth = await withAuth(request, { resource: 'customers', action: 'create' })
    if (auth.error) return auth.error
    const { tenantId: tid } = auth.context

    const body = await request.json()
    const parsed = createCustomerSchema.safeParse(body)

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

    // Check for duplicate email
    if (parsed.data.email) {
      const existing = await db.customer.findFirst({
        where: { email: parsed.data.email, tenantId: tenant.id },
      })
      if (existing) {
        return err('A customer with this email already exists', 409, request.headers.get('origin'))
      }
    }

    const customer = await db.customer.create({
      data: {
        tenantId: tenant.id,
        firstName: parsed.data.firstName,
        lastName: parsed.data.lastName,
        email: parsed.data.email || null,
        phone: parsed.data.phone || null,
        gender: parsed.data.gender || null,
        dateOfBirth: parsed.data.dateOfBirth ? new Date(parsed.data.dateOfBirth) : null,
        address: parsed.data.address || null,
        city: parsed.data.city || null,
        country: parsed.data.country || null,
        notes: parsed.data.notes || null,
        source: parsed.data.source,
        tags: JSON.stringify(parsed.data.tags),
      },
    })

    return created({ customer }, request.headers.get('origin'))
  } catch (error) {
    console.error('Create customer error:', error)
    return internalError(request.headers.get('origin'))
  }
}