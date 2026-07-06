import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'
import { withAuth, optionsHandler, ok, err, internalError, getCorsHeaders } from '@/lib/api-auth'
import { isDatabaseAvailable } from '@/lib/demo-mode'
import { demoTenantSettings } from '@/lib/demo-responses'


export async function OPTIONS(request: NextRequest) {
  return optionsHandler(request)
}

const updateSettingsSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  timezone: z.string().optional(),
  currency: z.string().optional(),
  language: z.string().optional(),
  theme: z.string().optional(),
  businessType: z.string().optional(),
})

// ── GET: Fetch tenant settings ──────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    // ── Demo mode fallback ───────────────────────────────────
    const dbOk = await isDatabaseAvailable()
    if (!dbOk) {
      return ok(demoTenantSettings(), request.headers.get('origin'))
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
          name: tenant.name,
          slug: tenant.slug,
          businessType: tenant.businessType,
          domain: tenant.domain,
          logo: tenant.logo,
          primaryColor: tenant.primaryColor,
          secondaryColor: tenant.secondaryColor,
          timezone: tenant.timezone,
          currency: tenant.currency,
          language: tenant.language,
          theme: tenant.theme,
          isActive: tenant.isActive,
        },
      },
      request.headers.get('origin')
    )
  } catch (error) {
    console.error('Tenant settings GET error:', error)
    return internalError(request.headers.get('origin'))
  }
}

// ── PUT: Update tenant settings ────────────────────────────────────
export async function PUT(request: NextRequest) {
  try {
    const auth = await withAuth(request, { resource: 'settings', action: 'edit' })
    if (auth.error) return auth.error
    const { tenantId: tid } = auth.context

    const body = await request.json()
    const parsed = updateSettingsSchema.safeParse(body)

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

    const updated = await db.tenant.update({
      where: { id: tenant.id },
      data: parsed.data,
    })

    return ok(
      {
        message: 'Settings updated',
        settings: {
          name: updated.name,
          slug: updated.slug,
          businessType: updated.businessType,
          domain: updated.domain,
          logo: updated.logo,
          primaryColor: updated.primaryColor,
          secondaryColor: updated.secondaryColor,
          timezone: updated.timezone,
          currency: updated.currency,
          language: updated.language,
          theme: updated.theme,
          isActive: updated.isActive,
        },
      },
      request.headers.get('origin')
    )
  } catch (error) {
    console.error('Tenant settings PUT error:', error)
    return internalError(request.headers.get('origin'))
  }
}