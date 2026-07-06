import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'
import { withAuth, optionsHandler, ok, err, internalError, getCorsHeaders } from '@/lib/api-auth'
import { isDatabaseAvailable } from '@/lib/demo-mode'
import { findDemo, DEMO_SERVICES, DEMO_SERVICE_CATEGORIES, DEMO_BOOKINGS } from '@/lib/demo-data'

export async function OPTIONS(request: NextRequest) {
  return optionsHandler(request)
}

// ===================== GET: Service Detail =====================
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await withAuth(request, { resource: 'services', action: 'view' })
    if (auth.error) return auth.error
    const { tenantId: tid } = auth.context

    const { id } = await params

    const dbOk = await isDatabaseAvailable()
    if (!dbOk) {
      const service = findDemo(DEMO_SERVICES, id)
      if (!service) return err('Service not found', 404, request.headers.get('origin'))
      const cat = findDemo(DEMO_SERVICE_CATEGORIES, service.categoryId)
      return ok({ service: { ...service, category: cat ? { id: cat.id, name: cat.name, description: cat.description, color: cat.color, icon: cat.icon } : null, employees: [], _count: { bookings: DEMO_BOOKINGS.filter(b => b.serviceId === id).length } } }, request.headers.get('origin'))
    }

    const tenant = await db.tenant.findFirst({ where: { id: tid, isActive: true } })
    if (!tenant) {
      return err('No tenant found', 404, request.headers.get('origin'))
    }

    const service = await db.service.findFirst({
      where: { id, tenantId: tenant.id },
      include: {
        category: true,
        employees: {
          include: {
            employee: {
              include: {
                branch: { select: { id: true, name: true } },
              },
            },
          },
        },
        _count: {
          select: { bookings: true },
        },
      },
    })

    if (!service) {
      return err('Service not found', 404, request.headers.get('origin'))
    }

    return ok({ service }, request.headers.get('origin'))
  } catch (error) {
    console.error('Service detail error:', error)
    return internalError(request.headers.get('origin'))
  }
}

// ===================== PUT: Update Service =====================
const updateServiceSchema = z.object({
  name: z.string().min(1).optional(),
  categoryId: z.string().optional(),
  description: z.string().optional(),
  duration: z.number().int().min(5).optional(),
  bufferBefore: z.number().int().min(0).optional(),
  bufferAfter: z.number().int().min(0).optional(),
  price: z.number().min(0).optional(),
  variablePrice: z.boolean().optional(),
  minPrice: z.number().min(0).optional(),
  maxPrice: z.number().min(0).optional(),
  image: z.string().optional(),
  maxCapacity: z.number().int().min(1).optional(),
  isGroupBooking: z.boolean().optional(),
  requireDeposit: z.boolean().optional(),
  depositAmount: z.number().min(0).optional(),
  taxRate: z.number().min(0).optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
  customFields: z.array(z.object({ key: z.string().max(100), value: z.string().max(2000) })).optional(),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await withAuth(request, { resource: 'services', action: 'edit' })
    if (auth.error) return auth.error
    const { tenantId: tid } = auth.context

    const { id } = await params
    const body = await request.json()
    const parsed = updateServiceSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400, headers: getCorsHeaders(request.headers.get('origin')) }
      )
    }

    const dbOk = await isDatabaseAvailable()
    if (!dbOk) {
      const service = findDemo(DEMO_SERVICES, id)
      if (!service) return err('Service not found', 404, request.headers.get('origin'))
      const updated = { ...service, ...parsed.data }
      return ok({ service: updated }, request.headers.get('origin'))
    }

    const tenant = await db.tenant.findFirst({ where: { id: tid, isActive: true } })
    if (!tenant) {
      return err('No tenant found', 404, request.headers.get('origin'))
    }

    const existing = await db.service.findFirst({ where: { id, tenantId: tenant.id } })
    if (!existing) {
      return err('Service not found', 404, request.headers.get('origin'))
    }

    const updateData: Record<string, unknown> = {}
    if (parsed.data.name !== undefined) updateData.name = parsed.data.name
    if (parsed.data.categoryId !== undefined) updateData.categoryId = parsed.data.categoryId
    if (parsed.data.description !== undefined) updateData.description = parsed.data.description || null
    if (parsed.data.duration !== undefined) updateData.duration = parsed.data.duration
    if (parsed.data.bufferBefore !== undefined) updateData.bufferBefore = parsed.data.bufferBefore
    if (parsed.data.bufferAfter !== undefined) updateData.bufferAfter = parsed.data.bufferAfter
    if (parsed.data.price !== undefined) updateData.price = parsed.data.price
    if (parsed.data.variablePrice !== undefined) updateData.variablePrice = parsed.data.variablePrice
    if (parsed.data.minPrice !== undefined) updateData.minPrice = parsed.data.minPrice
    if (parsed.data.maxPrice !== undefined) updateData.maxPrice = parsed.data.maxPrice
    if (parsed.data.image !== undefined) updateData.image = parsed.data.image || null
    if (parsed.data.maxCapacity !== undefined) updateData.maxCapacity = parsed.data.maxCapacity
    if (parsed.data.isGroupBooking !== undefined) updateData.isGroupBooking = parsed.data.isGroupBooking
    if (parsed.data.requireDeposit !== undefined) updateData.requireDeposit = parsed.data.requireDeposit
    if (parsed.data.depositAmount !== undefined) updateData.depositAmount = parsed.data.depositAmount
    if (parsed.data.taxRate !== undefined) updateData.taxRate = parsed.data.taxRate
    if (parsed.data.sortOrder !== undefined) updateData.sortOrder = parsed.data.sortOrder
    if (parsed.data.isActive !== undefined) updateData.isActive = parsed.data.isActive
    if (parsed.data.customFields !== undefined) updateData.customFields = JSON.stringify(parsed.data.customFields)

    const service = await db.service.update({
      where: { id },
      data: updateData,
      include: { category: true },
    })

    return ok({ service }, request.headers.get('origin'))
  } catch (error) {
    console.error('Update service error:', error)
    return internalError(request.headers.get('origin'))
  }
}

// ===================== DELETE: Soft Delete Service =====================
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await withAuth(request, { resource: 'services', action: 'delete' })
    if (auth.error) return auth.error
    const { tenantId: tid } = auth.context

    const { id } = await params

    const dbOk = await isDatabaseAvailable()
    if (!dbOk) {
      const service = findDemo(DEMO_SERVICES, id)
      if (!service) return err('Service not found', 404, request.headers.get('origin'))
      return ok({ service: { ...service, isActive: false }, message: 'Service deactivated successfully' }, request.headers.get('origin'))
    }

    const tenant = await db.tenant.findFirst({ where: { id: tid, isActive: true } })
    if (!tenant) {
      return err('No tenant found', 404, request.headers.get('origin'))
    }

    const existing = await db.service.findFirst({ where: { id, tenantId: tenant.id } })
    if (!existing) {
      return err('Service not found', 404, request.headers.get('origin'))
    }

    const service = await db.service.update({
      where: { id },
      data: { isActive: false },
    })

    return ok({ service, message: 'Service deactivated successfully' }, request.headers.get('origin'))
  } catch (error) {
    console.error('Delete service error:', error)
    return internalError(request.headers.get('origin'))
  }
}