import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function enforceTenantIsolation(
  request: NextRequest,
  tenantId?: string
): Promise<{ allowed: boolean; tenantId: string; response?: NextResponse }> {
  // If no tenantId provided, get the first tenant (demo mode)
  if (!tenantId) {
    const tenant = await db.tenant.findFirst({ where: { isActive: true } })
    if (!tenant) {
      return {
        allowed: false,
        tenantId: '',
        response: NextResponse.json(
          { error: 'No active tenant found', code: 'NO_TENANT' },
          { status: 403 }
        ),
      }
    }
    return { allowed: true, tenantId: tenant.id }
  }

  // Verify tenant exists and is active
  const tenant = await db.tenant.findUnique({
    where: { id: tenantId },
    select: { id: true, isActive: true, name: true },
  })

  if (!tenant || !tenant.isActive) {
    return {
      allowed: false,
      tenantId,
      response: NextResponse.json(
        { error: 'Tenant not found or inactive', code: 'TENANT_INACTIVE' },
        { status: 403 }
      ),
    }
  }

  return { allowed: true, tenantId: tenant.id }
}

export function withTenantScope(tenantId: string) {
  return { tenantId }
}