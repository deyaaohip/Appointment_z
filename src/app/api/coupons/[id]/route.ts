import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'
import { withAuth, optionsHandler, ok, err, internalError, getCorsHeaders } from '@/lib/api-auth'
import { isDatabaseAvailable } from '@/lib/demo-mode'
import { findDemo, DEMO_COUPONS } from '@/lib/demo-data'

export async function OPTIONS(request: NextRequest) {
  return optionsHandler(request)
}

// ===================== GET: Coupon Detail =====================
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await withAuth(request, { resource: 'coupons', action: 'view' })
    if (auth.error) return auth.error
    const { tenantId: tid } = auth.context

    const { id } = await params

    const dbOk = await isDatabaseAvailable()
    if (!dbOk) {
      const coupon = findDemo(DEMO_COUPONS, id)
      if (!coupon) return err('Coupon not found', 404, request.headers.get('origin'))
      return ok({ coupon }, request.headers.get('origin'))
    }

    const tenant = await db.tenant.findFirst({ where: { id: tid, isActive: true } })
    if (!tenant) {
      return err('No tenant found', 404, request.headers.get('origin'))
    }

    const coupon = await db.coupon.findFirst({
      where: { id, tenantId: tenant.id },
    })

    if (!coupon) {
      return err('Coupon not found', 404, request.headers.get('origin'))
    }

    return ok({ coupon }, request.headers.get('origin'))
  } catch (error) {
    console.error('Coupon detail error:', error)
    return internalError(request.headers.get('origin'))
  }
}

// ===================== PUT: Update Coupon =====================
const updateCouponSchema = z.object({
  code: z.string().min(3).max(50).optional(),
  type: z.enum(['percentage', 'fixed']).optional(),
  value: z.number().min(0).max(1000000).optional(),
  valueType: z.enum(['percentage', 'fixed_amount']).optional(),
  minPurchase: z.number().min(0).optional(),
  maxUses: z.number().int().min(1).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  isActive: z.boolean().optional(),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await withAuth(request, { resource: 'coupons', action: 'edit' })
    if (auth.error) return auth.error
    const { tenantId: tid } = auth.context

    const { id } = await params
    const body = await request.json()
    const parsed = updateCouponSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400, headers: getCorsHeaders(request.headers.get('origin')) }
      )
    }

    const dbOk = await isDatabaseAvailable()
    if (!dbOk) {
      const coupon = findDemo(DEMO_COUPONS, id)
      if (!coupon) return err('Coupon not found', 404, request.headers.get('origin'))
      const updated = { ...coupon, ...parsed.data }
      return ok({ coupon: updated }, request.headers.get('origin'))
    }

    const tenant = await db.tenant.findFirst({ where: { id: tid, isActive: true } })
    if (!tenant) {
      return err('No tenant found', 404, request.headers.get('origin'))
    }

    const existing = await db.coupon.findFirst({ where: { id, tenantId: tenant.id } })
    if (!existing) {
      return err('Coupon not found', 404, request.headers.get('origin'))
    }

    // Check for duplicate code if code is being updated
    if (parsed.data.code && parsed.data.code !== existing.code) {
      const duplicateCode = await db.coupon.findFirst({
        where: { code: parsed.data.code, tenantId: tenant.id },
      })
      if (duplicateCode) {
        return err('A coupon with this code already exists', 400, request.headers.get('origin'))
      }
    }

    const updateData: Record<string, unknown> = {}
    if (parsed.data.code !== undefined) updateData.code = parsed.data.code
    if (parsed.data.type !== undefined) updateData.type = parsed.data.type
    if (parsed.data.value !== undefined) updateData.value = parsed.data.value
    if (parsed.data.minPurchase !== undefined) updateData.minPurchase = parsed.data.minPurchase
    if (parsed.data.maxUses !== undefined) updateData.maxUses = parsed.data.maxUses
    if (parsed.data.startDate !== undefined && parsed.data.startDate !== '') updateData.startDate = new Date(parsed.data.startDate)
    if (parsed.data.endDate !== undefined && parsed.data.endDate !== '') updateData.endDate = new Date(parsed.data.endDate)
    if (parsed.data.isActive !== undefined) updateData.isActive = parsed.data.isActive

    const coupon = await db.coupon.update({
      where: { id },
      data: updateData,
    })

    return ok({ coupon }, request.headers.get('origin'))
  } catch (error) {
    console.error('Update coupon error:', error)
    return internalError(request.headers.get('origin'))
  }
}

// ===================== DELETE: Soft Delete Coupon =====================
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await withAuth(request, { resource: 'coupons', action: 'delete' })
    if (auth.error) return auth.error
    const { tenantId: tid } = auth.context

    const { id } = await params

    const dbOk = await isDatabaseAvailable()
    if (!dbOk) {
      const coupon = findDemo(DEMO_COUPONS, id)
      if (!coupon) return err('Coupon not found', 404, request.headers.get('origin'))
      return ok({ coupon: { ...coupon, isActive: false }, message: 'Coupon deactivated successfully' }, request.headers.get('origin'))
    }

    const tenant = await db.tenant.findFirst({ where: { id: tid, isActive: true } })
    if (!tenant) {
      return err('No tenant found', 404, request.headers.get('origin'))
    }

    const existing = await db.coupon.findFirst({ where: { id, tenantId: tenant.id } })
    if (!existing) {
      return err('Coupon not found', 404, request.headers.get('origin'))
    }

    const coupon = await db.coupon.update({
      where: { id },
      data: { isActive: false },
    })

    return ok({ coupon, message: 'Coupon deactivated successfully' }, request.headers.get('origin'))
  } catch (error) {
    console.error('Delete coupon error:', error)
    return internalError(request.headers.get('origin'))
  }
}