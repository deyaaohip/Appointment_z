import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'
import { withAuth, optionsHandler, ok, created, err, internalError, getCorsHeaders } from '@/lib/api-auth'
import { isDatabaseAvailable } from '@/lib/demo-mode'
import { demoServicesList } from '@/lib/demo-responses'


export async function OPTIONS(request: NextRequest) {
  return optionsHandler(request)
}

// ===================== GET: List Services =====================
export async function GET(request: NextRequest) {
  try {
    // ── Demo mode fallback ───────────────────────────────────
    const dbOk = await isDatabaseAvailable()
    if (!dbOk) {
      const sp = new URL(request.url).searchParams
      const page = parseInt(sp.get('page') || '1')
      const limit = parseInt(sp.get('limit') || '20')
      const search = sp.get('search') || undefined
      return ok(demoServicesList(page, limit, search), request.headers.get('origin'))
    }

    const auth = await withAuth(request, { resource: 'services', action: 'view' })
    if (auth.error) return auth.error
    const { tenantId: tid } = auth.context

    const tenant = await db.tenant.findFirst({ where: { id: tid, isActive: true } })
    if (!tenant) {
      return err('No tenant found', 404, request.headers.get('origin'))
    }

    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('categoryId')
    const isActive = searchParams.get('isActive')
    const search = searchParams.get('search')

    const where: Record<string, unknown> = { tenantId: tenant.id }

    if (categoryId) where.categoryId = categoryId
    if (isActive !== null && isActive !== undefined && isActive !== '') {
      where.isActive = isActive === 'true'
    }
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ]
    }

    const services = await db.service.findMany({
      where,
      include: {
        category: true,
        _count: {
          select: { employees: true, bookings: true },
        },
      },
      orderBy: { sortOrder: 'asc' },
    })

    return ok({ services }, request.headers.get('origin'))
  } catch (error) {
    console.error('Services list error:', error)
    return internalError(request.headers.get('origin'))
  }
}

// ===================== POST: Create Service =====================
const createServiceSchema = z.object({
  categoryId: z.string().min(1, 'Category is required'),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  duration: z.number().int().min(5).default(30),
  bufferBefore: z.number().int().min(0).default(0),
  bufferAfter: z.number().int().min(0).default(0),
  price: z.number().min(0).default(0),
  variablePrice: z.boolean().default(false),
  minPrice: z.number().min(0).optional(),
  maxPrice: z.number().min(0).optional(),
  image: z.string().optional(),
  maxCapacity: z.number().int().min(1).default(1),
  isGroupBooking: z.boolean().default(false),
  requireDeposit: z.boolean().default(false),
  depositAmount: z.number().min(0).optional(),
  taxRate: z.number().min(0).default(0),
  sortOrder: z.number().int().default(0),
  customFields: z.array(z.object({ key: z.string().max(100), value: z.string().max(2000) })).default([]),
})

export async function POST(request: NextRequest) {
  try {
    const auth = await withAuth(request, { resource: 'services', action: 'create' })
    if (auth.error) return auth.error
    const { tenantId: tid } = auth.context

    const body = await request.json()
    const parsed = createServiceSchema.safeParse(body)

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

    // Validate category
    const category = await db.serviceCategory.findFirst({
      where: { id: parsed.data.categoryId, tenantId: tenant.id },
    })
    if (!category) {
      return err('Category not found', 400, request.headers.get('origin'))
    }

    const service = await db.service.create({
      data: {
        tenantId: tenant.id,
        categoryId: parsed.data.categoryId,
        name: parsed.data.name,
        description: parsed.data.description || null,
        duration: parsed.data.duration,
        bufferBefore: parsed.data.bufferBefore,
        bufferAfter: parsed.data.bufferAfter,
        price: parsed.data.price,
        variablePrice: parsed.data.variablePrice,
        minPrice: parsed.data.minPrice,
        maxPrice: parsed.data.maxPrice,
        image: parsed.data.image || null,
        maxCapacity: parsed.data.maxCapacity,
        isGroupBooking: parsed.data.isGroupBooking,
        requireDeposit: parsed.data.requireDeposit,
        depositAmount: parsed.data.depositAmount,
        taxRate: parsed.data.taxRate,
        sortOrder: parsed.data.sortOrder,
        customFields: JSON.stringify(parsed.data.customFields),
      },
      include: {
        category: true,
      },
    })

    return created({ service }, request.headers.get('origin'))
  } catch (error) {
    console.error('Create service error:', error)
    return internalError(request.headers.get('origin'))
  }
}