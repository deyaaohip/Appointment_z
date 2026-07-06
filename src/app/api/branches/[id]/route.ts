import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'
import { withAuth, optionsHandler, ok, err, internalError, getCorsHeaders } from '@/lib/api-auth'
import { isDatabaseAvailable } from '@/lib/demo-mode'
import { findDemo, DEMO_BRANCHES, DEMO_EMPLOYEES } from '@/lib/demo-data'

export async function OPTIONS(request: NextRequest) {
  return optionsHandler(request)
}

// ===================== GET: Branch Detail =====================
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await withAuth(request, { resource: 'branches', action: 'view' })
    if (auth.error) return auth.error
    const { tenantId: tid } = auth.context

    const { id } = await params

    const dbOk = await isDatabaseAvailable()
    if (!dbOk) {
      const branch = findDemo(DEMO_BRANCHES, id)
      if (!branch) return err('Branch not found', 404, request.headers.get('origin'))
      const employees = DEMO_EMPLOYEES.filter(e => e.branchId === id).map(e => ({ id: e.id, name: e.name, avatar: null }))
      return ok({ branch: { ...branch, employees } }, request.headers.get('origin'))
    }

    const tenant = await db.tenant.findFirst({ where: { id: tid, isActive: true } })
    if (!tenant) {
      return err('No tenant found', 404, request.headers.get('origin'))
    }

    const branch = await db.branch.findFirst({
      where: { id, tenantId: tenant.id },
      include: {
        employees: {
          where: { isActive: true },
          select: { id: true, name: true, avatar: true },
        },
      },
    })

    if (!branch) {
      return err('Branch not found', 404, request.headers.get('origin'))
    }

    return ok({ branch }, request.headers.get('origin'))
  } catch (error) {
    console.error('Branch detail error:', error)
    return internalError(request.headers.get('origin'))
  }
}

// ===================== PUT: Update Branch =====================
const updateBranchSchema = z.object({
  name: z.string().min(1).optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  isActive: z.boolean().optional(),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await withAuth(request, { resource: 'branches', action: 'edit' })
    if (auth.error) return auth.error
    const { tenantId: tid } = auth.context

    const { id } = await params
    const body = await request.json()
    const parsed = updateBranchSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400, headers: getCorsHeaders(request.headers.get('origin')) }
      )
    }

    const dbOk = await isDatabaseAvailable()
    if (!dbOk) {
      const branch = findDemo(DEMO_BRANCHES, id)
      if (!branch) return err('Branch not found', 404, request.headers.get('origin'))
      const updated = { ...branch, ...parsed.data }
      return ok({ branch: updated }, request.headers.get('origin'))
    }

    const tenant = await db.tenant.findFirst({ where: { id: tid, isActive: true } })
    if (!tenant) {
      return err('No tenant found', 404, request.headers.get('origin'))
    }

    const existing = await db.branch.findFirst({ where: { id, tenantId: tenant.id } })
    if (!existing) {
      return err('Branch not found', 404, request.headers.get('origin'))
    }

    const updateData: Record<string, unknown> = {}
    if (parsed.data.name !== undefined) updateData.name = parsed.data.name
    if (parsed.data.address !== undefined) updateData.address = parsed.data.address || null
    if (parsed.data.city !== undefined) updateData.city = parsed.data.city || null
    if (parsed.data.country !== undefined) updateData.country = parsed.data.country || null
    if (parsed.data.phone !== undefined) updateData.phone = parsed.data.phone || null
    if (parsed.data.email !== undefined) updateData.email = parsed.data.email || null
    if (parsed.data.isActive !== undefined) updateData.isActive = parsed.data.isActive

    const branch = await db.branch.update({
      where: { id },
      data: updateData,
    })

    return ok({ branch }, request.headers.get('origin'))
  } catch (error) {
    console.error('Update branch error:', error)
    return internalError(request.headers.get('origin'))
  }
}

// ===================== DELETE: Soft Delete Branch =====================
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await withAuth(request, { resource: 'branches', action: 'delete' })
    if (auth.error) return auth.error
    const { tenantId: tid } = auth.context

    const { id } = await params

    const dbOk = await isDatabaseAvailable()
    if (!dbOk) {
      const branch = findDemo(DEMO_BRANCHES, id)
      if (!branch) return err('Branch not found', 404, request.headers.get('origin'))
      return ok({ branch: { ...branch, isActive: false }, message: 'Branch deactivated successfully' }, request.headers.get('origin'))
    }

    const tenant = await db.tenant.findFirst({ where: { id: tid, isActive: true } })
    if (!tenant) {
      return err('No tenant found', 404, request.headers.get('origin'))
    }

    const existing = await db.branch.findFirst({ where: { id, tenantId: tenant.id } })
    if (!existing) {
      return err('Branch not found', 404, request.headers.get('origin'))
    }

    const branch = await db.branch.update({
      where: { id },
      data: { isActive: false },
    })

    return ok({ branch, message: 'Branch deactivated successfully' }, request.headers.get('origin'))
  } catch (error) {
    console.error('Delete branch error:', error)
    return internalError(request.headers.get('origin'))
  }
}