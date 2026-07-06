import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'
import { withAuth, optionsHandler, ok, created, err, internalError, getPagination, getCorsHeaders } from '@/lib/api-auth'
import { isDatabaseAvailable } from '@/lib/demo-mode'
import { demoCouponsList } from '@/lib/demo-responses'


export async function OPTIONS(request: NextRequest) {
  return optionsHandler(request)
}

// ===================== GET: List Coupons =====================
export async function GET(request: NextRequest) {
  try {
    // ── Demo mode fallback ───────────────────────────────────
    const dbOk = await isDatabaseAvailable()
    if (!dbOk) {
      const sp = new URL(request.url).searchParams
      const page = parseInt(sp.get('page') || '1')
      const limit = parseInt(sp.get('limit') || '20')
      return ok(demoCouponsList(page, limit), request.headers.get('origin'))
    }

    const auth = await withAuth(request, { resource: 'coupons', action: 'view' })
    if (auth.error) return auth.error
    const { tenantId: tid } = auth.context

    const tenant = await db.tenant.findFirst({ where: { id: tid, isActive: true } })
    if (!tenant) {
      return err('No tenant found', 404, request.headers.get('origin'))
    }

    const { searchParams } = new URL(request.url)
    const { page, limit, skip, totalPages } = getPagination(searchParams)
    const search = searchParams.get('search')
    const isActive = searchParams.get('isActive')

    const where: Record<string, unknown> = { tenantId: tenant.id }

    if (search) {
      where.code = { contains: search }
    }
    if (isActive !== null && isActive !== undefined && isActive !== '') {
      where.isActive = isActive === 'true'
    }

    const [coupons, total] = await Promise.all([
      db.coupon.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.coupon.count({ where }),
    ])

    return ok({ coupons, total, page, totalPages: totalPages(total) }, request.headers.get('origin'))
  } catch (error) {
    console.error('Coupons list error:', error)
    return internalError(request.headers.get('origin'))
  }
}

// ===================== POST: Create Coupon =====================
const createCouponSchema = z.object({
  code: z.string().min(3).max(50),
  type: z.enum(['percentage', 'fixed']),
  value: z.number().min(0).max(1000000),
  valueType: z.enum(['percentage', 'fixed_amount']).optional(),
  minPurchase: z.number().min(0).optional(),
  maxUses: z.number().int().min(1).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  isActive: z.boolean().default(true),
})

export async function POST(request: NextRequest) {
  try {
    const auth = await withAuth(request, { resource: 'coupons', action: 'create' })
    if (auth.error) return auth.error
    const { tenantId: tid } = auth.context

    const body = await request.json()
    const parsed = createCouponSchema.safeParse(body)

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

    // Check for duplicate code within the same tenant
    const existingCode = await db.coupon.findFirst({
      where: { code: parsed.data.code, tenantId: tenant.id },
    })
    if (existingCode) {
      return err('A coupon with this code already exists', 400, request.headers.get('origin'))
    }

    const coupon = await db.coupon.create({
      data: {
        tenantId: tenant.id,
        code: parsed.data.code,
        type: parsed.data.type,
        value: parsed.data.value,
        minPurchase: parsed.data.minPurchase ?? null,
        maxUses: parsed.data.maxUses ?? null,
        startDate: parsed.data.startDate ? new Date(parsed.data.startDate) : new Date(),
        endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        isActive: parsed.data.isActive,
      },
    })

    return created({ coupon }, request.headers.get('origin'))
  } catch (error) {
    console.error('Create coupon error:', error)
    return internalError(request.headers.get('origin'))
  }
}