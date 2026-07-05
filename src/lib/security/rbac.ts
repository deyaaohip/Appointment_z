import type { PermissionResource, PermissionAction, PermissionMap } from '@/types'

const DEFAULT_PERMISSIONS: PermissionMap = {
  dashboard: { view: true, create: false, edit: false, delete: false, export: true, manage: false },
  bookings: { view: true, create: true, edit: true, delete: true, export: true, manage: true },
  customers: { view: true, create: true, edit: true, delete: true, export: true, manage: true },
  employees: { view: true, create: true, edit: true, delete: true, export: true, manage: true },
  services: { view: true, create: true, edit: true, delete: true, export: true, manage: true },
  branches: { view: true, create: true, edit: true, delete: false, export: true, manage: false },
  payments: { view: true, create: false, edit: false, delete: false, export: true, manage: false },
  reports: { view: true, create: false, edit: false, delete: false, export: true, manage: false },
  settings: { view: true, create: false, edit: true, delete: false, export: false, manage: true },
  roles: { view: true, create: true, edit: true, delete: true, export: true, manage: true },
  coupons: { view: true, create: true, edit: true, delete: true, export: true, manage: true },
  notifications: { view: true, create: false, edit: false, delete: false, export: false, manage: false },
  audit_logs: { view: true, create: false, edit: false, delete: false, export: true, manage: false },
  whatsapp: { view: true, create: true, edit: true, delete: false, export: true, manage: true },
}

// Map between DB-stored action names and the canonical RBAC action names
const ACTION_ALIASES: Record<string, string> = {
  read: 'view',
  update: 'edit',
  write: 'edit',
  manage_all: 'manage',
}

export function hasPermission(
  permissions: PermissionMap,
  resource: PermissionResource,
  action: PermissionAction
): boolean {
  // Direct check
  const direct = permissions?.[resource]?.[action]
  if (direct !== undefined) return direct

  // Alias check: e.g., 'read' → 'view', 'update' → 'edit'
  for (const [alias, canonical] of Object.entries(ACTION_ALIASES)) {
    if (canonical === action && permissions?.[resource]?.[alias] !== undefined) {
      return permissions[resource][alias] as boolean
    }
  }

  return false
}

export function getDefaultPermissions(): PermissionMap {
  return JSON.parse(JSON.stringify(DEFAULT_PERMISSIONS))
}

export function getRolePermissions(roleName: string): PermissionMap {
  const base = getDefaultPermissions()
  if (roleName === 'admin' || roleName === 'owner') {
    // Full access — use canonical action names
    const canonicalActions: PermissionAction[] = ['view', 'create', 'edit', 'delete', 'export', 'manage']
    for (const resource of Object.keys(base)) {
      for (const action of canonicalActions) {
        base[resource][action] = true
      }
    }
  } else if (roleName === 'receptionist') {
    base.employees.manage = false
    base.roles.manage = false
    base.settings.manage = false
    base.audit_logs.view = false
  } else if (roleName === 'viewer') {
    for (const resource of Object.keys(base)) {
      for (const action of Object.keys(base[resource])) {
        if (action !== 'view' && action !== 'export') {
          base[resource][action as PermissionAction] = false
        }
      }
    }
  }
  return base
}