import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'
import { withAuth, optionsHandler, ok, created, err, internalError, getCorsHeaders } from '@/lib/api-auth'

export async function OPTIONS(request: NextRequest) {
  return optionsHandler(request)
}

// ===================== GET: List Employees =====================
export async function GET(request: NextRequest) {
  try {
    const auth = await withAuth(request, { resource: 'employees', action: 'view' })
    if (auth.error) return auth.error
    const { tenantId: tid } = auth.context

    const tenant = await db.tenant.findFirst({ where: { id: tid, isActive: true } })
    if (!tenant) {
      return err('No tenant found', 404, request.headers.get('origin'))
    }

    const { searchParams } = new URL(request.url)
    const branchId = searchParams.get('branchId')
    const isActive = searchParams.get('isActive')
    const search = searchParams.get('search')

    const where: Record<string, unknown> = { tenantId: tenant.id }

    if (branchId) where.branchId = branchId
    if (isActive !== null && isActive !== undefined && isActive !== '') {
      where.isActive = isActive === 'true'
    }
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
      ]
    }

    const employees = await db.employee.findMany({
      where,
      include: {
        branch: { select: { id: true, name: true } },
        schedules: {
          where: { isWorking: true },
          orderBy: { dayOfWeek: 'asc' },
        },
        _count: {
          select: { services: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Enrich with booking count
    const enriched = await Promise.all(
      employees.map(async (e) => {
        const bookingCount = await db.booking.count({
          where: { employeeId: e.id, tenantId: tenant.id, status: { not: 'cancelled' } },
        })
        return { ...e, bookingCount }
      })
    )

    return ok({ employees: enriched }, request.headers.get('origin'))
  } catch (error) {
    console.error('Employees list error:', error)
    return internalError(request.headers.get('origin'))
  }
}

// ===================== POST: Create Employee =====================
const createEmployeeSchema = z.object({
  branchId: z.string().min(1, 'Branch is required'),
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  bio: z.string().optional(),
  specialization: z.string().optional(),
  commissionRate: z.number().min(0).max(100).default(0),
})

export async function POST(request: NextRequest) {
  try {
    const auth = await withAuth(request, { resource: 'employees', action: 'create' })
    if (auth.error) return auth.error
    const { tenantId: tid } = auth.context

    const body = await request.json()
    const parsed = createEmployeeSchema.safeParse(body)

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

    // Validate branch
    const branch = await db.branch.findFirst({ where: { id: parsed.data.branchId, tenantId: tenant.id } })
    if (!branch) {
      return err('Branch not found', 400, request.headers.get('origin'))
    }

    const employee = await db.employee.create({
      data: {
        tenantId: tenant.id,
        branchId: parsed.data.branchId,
        name: parsed.data.name,
        email: parsed.data.email || null,
        phone: parsed.data.phone || null,
        bio: parsed.data.bio || null,
        specialization: parsed.data.specialization || null,
        commissionRate: parsed.data.commissionRate,
      },
      include: {
        branch: { select: { id: true, name: true } },
      },
    })

    return created({ employee }, request.headers.get('origin'))
  } catch (error) {
    console.error('Create employee error:', error)
    return internalError(request.headers.get('origin'))
  }
}