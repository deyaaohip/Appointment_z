import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'
import { withAuth, optionsHandler, ok, err, internalError, getCorsHeaders } from '@/lib/api-auth'
import { isDatabaseAvailable } from '@/lib/demo-mode'
import { demoBrandSettings } from '@/lib/demo-responses'


export async function OPTIONS(request: NextRequest) {
  return optionsHandler(request)
}

const updateBrandSettingsSchema = z.object({
  appName: z.string().min(1, 'App name is required').optional(),
  logo: z.string().optional(),
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
})

// ── GET: Fetch brand settings ──────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    // ── Demo mode fallback ───────────────────────────────────
    const dbOk = await isDatabaseAvailable()
    if (!dbOk) {
      return ok(demoBrandSettings(), request.headers.get('origin'))
    }

    const auth = await withAuth(request, { resource: 'settings', action: 'view' })
    if (auth.error) return auth.error
    const { tenantId: tid } = auth.context

    const tenant = await db.tenant.findFirst({ where: { id: tid, isActive: true } })

    if (!tenant) {
      return err('Tenant not found', 404, request.headers.get('origin'))
    }

    return ok(
      {
        settings: {
          appName: tenant.name,
          logo: tenant.logo,
          primaryColor: tenant.primaryColor,
          secondaryColor: tenant.secondaryColor,
        },
      },
      request.headers.get('origin')
    )
  } catch (error) {
    console.error('Brand settings GET error:', error)
    return internalError(request.headers.get('origin'))
  }
}

// ── PUT: Update brand settings ──────────────────────────────────────
export async function PUT(request: NextRequest) {
  try {
    const auth = await withAuth(request, { resource: 'settings', action: 'edit' })
    if (auth.error) return auth.error
    const { tenantId: tid } = auth.context

    const body = await request.json()
    const parsed = updateBrandSettingsSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400, headers: getCorsHeaders(request.headers.get('origin')) }
      )
    }

    const tenant = await db.tenant.findFirst({ where: { id: tid, isActive: true } })

    if (!tenant) {
      return err('Tenant not found', 404, request.headers.get('origin'))
    }

    // Map appName to tenant name field
    const data: Record<string, string> = { ...parsed.data }
    if (data.appName) {
      data.name = data.appName
      delete data.appName
    }

    const updated = await db.tenant.update({
      where: { id: tenant.id },
      data,
    })

    return ok(
      {
        message: 'Brand settings updated',
        settings: {
          appName: updated.name,
          logo: updated.logo,
          primaryColor: updated.primaryColor,
          secondaryColor: updated.secondaryColor,
        },
      },
      request.headers.get('origin')
    )
  } catch (error) {
    console.error('Brand settings PUT error:', error)
    return internalError(request.headers.get('origin'))
  }
}