import { db } from '@/lib/db'

export interface AuditAction {
  userId: string
  tenantId: string
  action: string
  entity: string
  entityId?: string
  details?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
}

export async function createAuditLog(entry: AuditAction): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        userId: entry.userId,
        tenantId: entry.tenantId,
        action: entry.action,
        entity: entry.entity,
        entityId: entry.entityId,
        details: entry.details ? JSON.stringify(entry.details) : null,
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
      },
    })
  } catch (error) {
    console.error('Audit log error:', error)
  }
}

export async function getAuditLogs(
  tenantId: string,
  options: { page?: number; pageSize?: number; entity?: string; userId?: string } = {}
) {
  const { page = 1, pageSize = 20, entity, userId } = options
  const where: Record<string, unknown> = { tenantId }
  if (entity) where.entity = entity
  if (userId) where.userId = userId

  const [logs, total] = await Promise.all([
    db.auditLog.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.auditLog.count({ where }),
  ])

  return {
    data: logs,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  }
}