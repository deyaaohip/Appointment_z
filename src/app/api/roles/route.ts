import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'
import { withAuth, optionsHandler, ok, created, err, internalError, getCorsHeaders } from '@/lib/api-auth'
import { isDatabaseAvailable } from '@/lib/demo-mode'
import { demoRolesList } from '@/lib/demo-responses'


export async function OPTIONS(request: NextRequest) {
  return optionsHandler(request)
}

// ===================== GET: List Roles =====================
export async function GET(request: NextRequest) {
  try {
    // ── Demo mode fallback ───────────────────────────────────
    const dbOk = await isDatabaseAvailable()
    if (!dbOk) {
      return ok(demoRolesList(), request.headers.get('origin'))
    }

    const auth = await withAuth(request, { resource: 'roles', action: 'view' })
    if (auth.error) return auth.error
    const { tenantId: tid } = auth.context

    const tenant = await db.tenant.findFirst({ where: { id: tid, isActive: true } })
    if (!tenant) {
      return err('No tenant found', 404, request.headers.get('origin'))
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')

    const where: Record<string, unknown> = { tenantId: tenant.id }

    if (search) {
      where.name = { contains: search }
    }

    const roles = await db.role.findMany({
      where,
      include: {
        _count: {
          select: { users: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    return ok({ roles }, request.headers.get('origin'))
  } catch (error) {
    console.error('Roles list error:', error)
    return internalError(request.headers.get('origin'))
  }
}

// ===================== POST: Create Role =====================
const createRoleSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  permissions: z.string().optional(),
  isDefault: z.boolean().default(false),
})

export async function POST(request: NextRequest) {
  try {
    const auth = await withAuth(request, { resource: 'roles', action: 'create' })
    if (auth.error) return auth.error
    const { tenantId: tid } = auth.context

    const body = await request.json()
    const parsed = createRoleSchema.safeParse(body)

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

    // Check for duplicate role name within the same tenant
    const existingRole = await db.role.findFirst({
      where: { name: parsed.data.name, tenantId: tenant.id },
    })
    if (existingRole) {
      return err('A role with this name already exists', 400, request.headers.get('origin'))
    }

    const role = await db.role.create({
      data: {
        tenantId: tenant.id,
        name: parsed.data.name,
        description: parsed.data.description || null,
        permissions: parsed.data.permissions || '{}',
        isDefault: parsed.data.isDefault,
      },
    })

    return created({ role }, request.headers.get('origin'))
  } catch (error) {
    console.error('Create role error:', error)
    return internalError(request.headers.get('origin'))
  }
}