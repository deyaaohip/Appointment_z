import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'
import { withAuth, optionsHandler, ok, created, err, internalError, getCorsHeaders } from '@/lib/api-auth'
import { isDatabaseAvailable } from '@/lib/demo-mode'
import { demoBranchesList } from '@/lib/demo-responses'


export async function OPTIONS(request: NextRequest) {
  return optionsHandler(request)
}

// ===================== GET: List Branches =====================
export async function GET(request: NextRequest) {
  try {
    // ── Demo mode fallback ───────────────────────────────────
    const dbOk = await isDatabaseAvailable()
    if (!dbOk) {
      return ok(demoBranchesList(), request.headers.get('origin'))
    }

    const auth = await withAuth(request, { resource: 'branches', action: 'view' })
    if (auth.error) return auth.error
    const { tenantId: tid } = auth.context

    const tenant = await db.tenant.findFirst({ where: { id: tid, isActive: true } })
    if (!tenant) {
      return err('No tenant found', 404, request.headers.get('origin'))
    }

    const branches = await db.branch.findMany({
      where: { tenantId: tenant.id },
      include: {
        _count: {
          select: {
            employees: true,
            bookings: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    return ok({ branches }, request.headers.get('origin'))
  } catch (error) {
    console.error('Branches list error:', error)
    return internalError(request.headers.get('origin'))
  }
}

// ===================== POST: Create Branch =====================
const createBranchSchema = z.object({
  name: z.string().min(2).max(200),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  timezone: z.string().optional(),
  isActive: z.boolean().default(true),
})

export async function POST(request: NextRequest) {
  try {
    const auth = await withAuth(request, { resource: 'branches', action: 'create' })
    if (auth.error) return auth.error
    const { tenantId: tid } = auth.context

    const body = await request.json()
    const parsed = createBranchSchema.safeParse(body)

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

    const branch = await db.branch.create({
      data: {
        tenantId: tenant.id,
        name: parsed.data.name,
        address: parsed.data.address || null,
        city: parsed.data.city || null,
        country: parsed.data.country || null,
        phone: parsed.data.phone || null,
        email: parsed.data.email || null,
        timezone: parsed.data.timezone || 'UTC',
        isActive: parsed.data.isActive,
      },
    })

    return created({ branch }, request.headers.get('origin'))
  } catch (error) {
    console.error('Create branch error:', error)
    return internalError(request.headers.get('origin'))
  }
}