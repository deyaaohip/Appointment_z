// ═══════════════════════════════════════════════════════════════════
// Audit Logging
// ═══════════════════════════════════════════════════════════════════

import { db } from '@/lib/db'

export type AuditAction =
  | 'auth.login' | 'auth.logout' | 'auth.login_failed' | 'auth.password_change'
  | 'booking.create' | 'booking.update' | 'booking.cancel' | 'booking.delete'
  | 'customer.create' | 'customer.update' | 'customer.delete'
  | 'employee.create' | 'employee.update' | 'employee.delete'
  | 'service.create' | 'service.update' | 'service.delete'
  | 'payment.process' | 'payment.refund' | 'payment.receipt_upload'
  | 'settings.update' | 'settings.brand_update'
  | 'role.create' | 'role.update' | 'role.delete'
  | 'export.data' | 'import.data'
  | 'admin.tenant_create' | 'admin.plan_update'

interface AuditLogEntry {
  tenantId: string
  userId: string
  action: AuditAction
  entity: string
  entityId?: string
  details?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
}

export async function createAuditLog(entry: AuditLogEntry): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        tenantId: entry.tenantId,
        userId: entry.userId,
        action: entry.action,
        entity: entry.entity,
        entityId: entry.entityId,
        details: entry.details ? JSON.stringify(entry.details) : undefined,
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
      },
    })
  } catch (error) {
    console.error('Audit log error:', error)
  }
}

export async function getAuditLogs(filters: {
  tenantId: string
  userId?: string
  action?: string
  entity?: string
  limit?: number
  offset?: number
  startDate?: Date
  endDate?: Date
}) {
  const where: Record<string, unknown> = { tenantId: filters.tenantId }

  if (filters.userId) where.userId = filters.userId
  if (filters.action) where.action = filters.action
  if (filters.entity) where.entity = filters.entity
  if (filters.startDate || filters.endDate) {
    where.createdAt = {}
    if (filters.startDate) (where.createdAt as Record<string, unknown>).gte = filters.startDate
    if (filters.endDate) (where.createdAt as Record<string, unknown>).lte = filters.endDate
  }

  const [logs, total] = await Promise.all([
    db.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: filters.limit || 50,
      skip: filters.offset || 0,
      include: {
        user: { select: { name: true, email: true } },
      },
    }),
    db.auditLog.count({ where }),
  ])

  return { logs, total, limit: filters.limit || 50, offset: filters.offset || 0 }
}

// Quick audit helper
export function audit(
  tenantId: string,
  userId: string,
  action: AuditAction,
  entity: string,
  extra?: { entityId?: string; details?: Record<string, unknown>; ip?: string; ua?: string }
) {
  return createAuditLog({
    tenantId,
    userId,
    action,
    entity,
    entityId: extra?.entityId,
    details: extra?.details,
    ipAddress: extra?.ip,
    userAgent: extra?.ua,
  })
}