import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'
import { withAuth, optionsHandler, ok, err, internalError, getCorsHeaders } from '@/lib/api-auth'
import { isDatabaseAvailable } from '@/lib/demo-mode'
import { findDemo, DEMO_ROLES } from '@/lib/demo-data'

export async function OPTIONS(request: NextRequest) {
  return optionsHandler(request)
}

// ===================== GET: Role Detail =====================
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await withAuth(request, { resource: 'roles', action: 'view' })
    if (auth.error) return auth.error
    const { tenantId: tid } = auth.context

    const { id } = await params

    const dbOk = await isDatabaseAvailable()
    if (!dbOk) {
      const role = findDemo(DEMO_ROLES, id)
      if (!role) return err('Role not found', 404, request.headers.get('origin'))
      return ok({ role: { ...role, _count: { users: role.userCount ?? 0 } } }, request.headers.get('origin'))
    }

    const tenant = await db.tenant.findFirst({ where: { id: tid, isActive: true } })
    if (!tenant) {
      return err('No tenant found', 404, request.headers.get('origin'))
    }

    const role = await db.role.findFirst({
      where: { id, tenantId: tenant.id },
      include: {
        _count: {
          select: { users: true },
        },
      },
    })

    if (!role) {
      return err('Role not found', 404, request.headers.get('origin'))
    }

    return ok({ role }, request.headers.get('origin'))
  } catch (error) {
    console.error('Role detail error:', error)
    return internalError(request.headers.get('origin'))
  }
}

// ===================== PUT: Update Role =====================
const updateRoleSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(500).optional(),
  permissions: z.string().optional(),
  isDefault: z.boolean().optional(),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await withAuth(request, { resource: 'roles', action: 'edit' })
    if (auth.error) return auth.error
    const { tenantId: tid } = auth.context

    const { id } = await params
    const body = await request.json()
    const parsed = updateRoleSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400, headers: getCorsHeaders(request.headers.get('origin')) }
      )
    }

    const dbOk = await isDatabaseAvailable()
    if (!dbOk) {
      const role = findDemo(DEMO_ROLES, id)
      if (!role) return err('Role not found', 404, request.headers.get('origin'))
      const updated = { ...role, ...parsed.data }
      return ok({ role: updated }, request.headers.get('origin'))
    }

    const tenant = await db.tenant.findFirst({ where: { id: tid, isActive: true } })
    if (!tenant) {
      return err('No tenant found', 404, request.headers.get('origin'))
    }

    const existing = await db.role.findFirst({ where: { id, tenantId: tenant.id } })
    if (!existing) {
      return err('Role not found', 404, request.headers.get('origin'))
    }

    // Check for duplicate role name if name is being updated
    if (parsed.data.name && parsed.data.name !== existing.name) {
      const duplicateName = await db.role.findFirst({
        where: { name: parsed.data.name, tenantId: tenant.id },
      })
      if (duplicateName) {
        return err('A role with this name already exists', 400, request.headers.get('origin'))
      }
    }

    const updateData: Record<string, unknown> = {}
    if (parsed.data.name !== undefined) updateData.name = parsed.data.name
    if (parsed.data.description !== undefined) updateData.description = parsed.data.description || null
    if (parsed.data.permissions !== undefined) updateData.permissions = parsed.data.permissions
    if (parsed.data.isDefault !== undefined) updateData.isDefault = parsed.data.isDefault

    const role = await db.role.update({
      where: { id },
      data: updateData,
    })

    return ok({ role }, request.headers.get('origin'))
  } catch (error) {
    console.error('Update role error:', error)
    return internalError(request.headers.get('origin'))
  }
}

// ===================== DELETE: Delete Role =====================
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await withAuth(request, { resource: 'roles', action: 'delete' })
    if (auth.error) return auth.error
    const { tenantId: tid } = auth.context

    const { id } = await params

    const dbOk = await isDatabaseAvailable()
    if (!dbOk) {
      const role = findDemo(DEMO_ROLES, id)
      if (!role) return err('Role not found', 404, request.headers.get('origin'))
      return ok({ success: true, message: 'Role deleted successfully' }, request.headers.get('origin'))
    }

    const tenant = await db.tenant.findFirst({ where: { id: tid, isActive: true } })
    if (!tenant) {
      return err('No tenant found', 404, request.headers.get('origin'))
    }

    const existing = await db.role.findFirst({
      where: { id, tenantId: tenant.id },
      include: { _count: { select: { users: true } } },
    })

    if (!existing) {
      return err('Role not found', 404, request.headers.get('origin'))
    }

    // Prevent deletion of default roles
    if (existing.isDefault) {
      return err('Cannot delete a default role', 400, request.headers.get('origin'))
    }

    // Prevent deletion if role has assigned users
    if (existing._count.users > 0) {
      return err('Cannot delete a role with assigned users. Reassign users first.', 400, request.headers.get('origin'))
    }

    await db.role.delete({
      where: { id },
    })

    return ok({ message: 'Role deleted successfully' }, request.headers.get('origin'))
  } catch (error) {
    console.error('Delete role error:', error)
    return internalError(request.headers.get('origin'))
  }
}