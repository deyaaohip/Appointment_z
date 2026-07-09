// ─── Enterprise RBAC Data System ────────────────────────────────

// ─── System Modules ────────────────────────────────────────────
export const SYSTEM_MODULES = [
  { key: 'tenants', labelAr: 'المستأجرين', labelEn: 'Tenants', icon: 'Building2' },
  { key: 'users', labelAr: 'المستخدمين', labelEn: 'Users', icon: 'Users' },
  { key: 'plans', labelAr: 'الباقات', labelEn: 'Plans', icon: 'CreditCard' },
  { key: 'billing', labelAr: 'الفواتير', labelEn: 'Billing', icon: 'FileText' },
  { key: 'roles', labelAr: 'الأدوار والصلاحيات', labelEn: 'Roles & Permissions', icon: 'Shield' },
  { key: 'audit', labelAr: 'سجل العمليات', labelEn: 'Audit Log', icon: 'ClipboardCheck' },
  { key: 'notifications', labelAr: 'الإشعارات', labelEn: 'Notifications', icon: 'Bell' },
  { key: 'reports', labelAr: 'التقارير', labelEn: 'Reports', icon: 'BarChart3' },
  { key: 'system', labelAr: 'النظام', labelEn: 'System', icon: 'Settings' },
  { key: 'servers', labelAr: 'الخوادم', labelEn: 'Servers', icon: 'Server' },
  { key: 'database', labelAr: 'قاعدة البيانات', labelEn: 'Database', icon: 'Database' },
  { key: 'security', labelAr: 'الأمان', labelEn: 'Security', icon: 'Lock' },
  { key: 'cliq', labelAr: 'CLIQ المدفوعات', labelEn: 'CLIQ Payments', icon: 'Wallet' },
] as const

export type ModuleKey = typeof SYSTEM_MODULES[number]['key']

// ─── Permission Actions ────────────────────────────────────────
export const PERMISSION_ACTIONS = [
  { key: 'view', labelAr: 'عرض', labelEn: 'View' },
  { key: 'create', labelAr: 'إنشاء', labelEn: 'Create' },
  { key: 'edit', labelAr: 'تعديل', labelEn: 'Edit' },
  { key: 'delete', labelAr: 'حذف', labelEn: 'Delete' },
  { key: 'export', labelAr: 'تصدير', labelEn: 'Export' },
  { key: 'import', labelAr: 'استيراد', labelEn: 'Import' },
  { key: 'print', labelAr: 'طباعة', labelEn: 'Print' },
  { key: 'approve', labelAr: 'موافقة', labelEn: 'Approve' },
  { key: 'reject', labelAr: 'رفض', labelEn: 'Reject' },
  { key: 'restore', labelAr: 'استعادة', labelEn: 'Restore' },
  { key: 'archive', labelAr: 'أرشفة', labelEn: 'Archive' },
] as const

export type ActionKey = typeof PERMISSION_ACTIONS[number]['key']

// ─── RbacRole Interface ────────────────────────────────────────
export interface RbacRole {
  id: string
  name: string
  nameEn: string
  description: string
  descriptionEn: string
  userCount: number
  isSystem: boolean
  parentId: string | null
  permissions: Record<string, string[]> // module key -> action keys
  createdAt: string
}

// ─── Permission Template ───────────────────────────────────────
export interface PermissionTemplate {
  id: string
  name: string
  nameEn: string
  description: string
  descriptionEn: string
  permissions: Record<string, string[]>
}

// ─── Helper: All actions for a module ──────────────────────────
function allActions(): string[] {
  return PERMISSION_ACTIONS.map(a => a.key)
}

// ─── Default Role Permissions ──────────────────────────────────
function superAdminPerms(): Record<string, string[]> {
  const p: Record<string, string[]> = {}
  SYSTEM_MODULES.forEach(m => { p[m.key] = allActions() })
  return p
}

function tenantOwnerPerms(): Record<string, string[]> {
  return {
    tenants: ['view', 'edit', 'export', 'print'],
    users: ['view', 'create', 'edit', 'delete', 'export', 'print'],
    plans: ['view'],
    billing: ['view', 'create', 'export', 'print'],
    roles: ['view'],
    audit: ['view', 'export'],
    notifications: ['view'],
    reports: ['view', 'export', 'print'],
    system: ['view'],
    servers: [],
    database: [],
    security: ['view'],
    cliq: ['view'],
  }
}

function branchManagerPerms(): Record<string, string[]> {
  return {
    tenants: ['view'],
    users: ['view', 'create', 'edit', 'export'],
    plans: ['view'],
    billing: ['view', 'export', 'print'],
    roles: ['view'],
    audit: ['view'],
    notifications: ['view'],
    reports: ['view', 'export'],
    system: [],
    servers: [],
    database: [],
    security: [],
    cliq: ['view'],
  }
}

function receptionistPerms(): Record<string, string[]> {
  return {
    tenants: ['view'],
    users: ['view'],
    plans: ['view'],
    billing: ['view', 'print'],
    roles: [],
    audit: [],
    notifications: ['view'],
    reports: ['view'],
    system: [],
    servers: [],
    database: [],
    security: [],
    cliq: [],
  }
}

function accountantPerms(): Record<string, string[]> {
  return {
    tenants: ['view'],
    users: ['view'],
    plans: ['view'],
    billing: ['view', 'create', 'edit', 'export', 'print', 'approve', 'reject'],
    roles: [],
    audit: ['view', 'export'],
    notifications: ['view'],
    reports: ['view', 'export', 'print'],
    system: [],
    servers: [],
    database: [],
    security: ['view'],
    cliq: ['view', 'approve', 'reject'],
  }
}

// ─── Initial Roles ─────────────────────────────────────────────
export const INIT_RBAC_ROLES: RbacRole[] = [
  {
    id: 'rbac-1', name: 'مدير النظام', nameEn: 'Super Admin',
    description: 'صلاحيات كاملة على جميع وحدات المنصة بدون استثناء',
    descriptionEn: 'Full access to all platform modules without exception',
    userCount: 1, isSystem: true, parentId: null,
    permissions: superAdminPerms(), createdAt: '2025-01-01',
  },
  {
    id: 'rbac-2', name: 'مالك المستأجر', nameEn: 'Tenant Owner',
    description: 'صلاحيات كاملة على المستأجر مع وصول محدود للوحدات النظامية',
    descriptionEn: 'Full tenant access with limited system module access',
    userCount: 8, isSystem: true, parentId: 'rbac-1',
    permissions: tenantOwnerPerms(), createdAt: '2025-01-01',
  },
  {
    id: 'rbac-3', name: 'مدير الفرع', nameEn: 'Branch Manager',
    description: 'إدارة الفرع والموظفين مع صلاحيات محدودة',
    descriptionEn: 'Branch and employee management with limited permissions',
    userCount: 15, isSystem: true, parentId: 'rbac-2',
    permissions: branchManagerPerms(), createdAt: '2025-01-01',
  },
  {
    id: 'rbac-4', name: 'موظف استقبال', nameEn: 'Receptionist',
    description: 'عرض الحجوزات والعملاء فقط',
    descriptionEn: 'View bookings and customers only',
    userCount: 42, isSystem: true, parentId: null,
    permissions: receptionistPerms(), createdAt: '2025-01-01',
  },
  {
    id: 'rbac-5', name: 'محاسب', nameEn: 'Accountant',
    description: 'عرض التقارير والفواتير مع إمكانية الموافقة على المدفوعات',
    descriptionEn: 'Reports and invoices access with payment approval',
    userCount: 6, isSystem: true, parentId: null,
    permissions: accountantPerms(), createdAt: '2025-01-01',
  },
]

// ─── Permission Templates ──────────────────────────────────────
export const INIT_RBAC_TEMPLATES: PermissionTemplate[] = [
  {
    id: 'tpl-1', name: 'قراءة فقط', nameEn: 'Read Only',
    description: 'صلاحيات العرض فقط لجميع الوحدات',
    descriptionEn: 'View-only permissions for all modules',
    permissions: Object.fromEntries(SYSTEM_MODULES.map(m => [m.key, ['view']])),
  },
  {
    id: 'tpl-2', name: 'مستخدم عادي', nameEn: 'Standard User',
    description: 'عرض وإنشاء وتعديل على الوحدات الأساسية',
    descriptionEn: 'View, create, edit on core modules',
    permissions: Object.fromEntries(SYSTEM_MODULES.map(m => {
      const core = ['tenants', 'users', 'plans', 'billing']
      return [m.key, core.includes(m.key) ? ['view', 'create', 'edit', 'export', 'print'] : ['view']]
    })),
  },
  {
    id: 'tpl-3', name: 'مدير', nameEn: 'Manager',
    description: 'صلاحيات إدارية شاملة مع الحذف',
    descriptionEn: 'Comprehensive management with delete',
    permissions: Object.fromEntries(SYSTEM_MODULES.map(m => {
      const excluded = ['system', 'servers', 'database', 'security']
      return [m.key, excluded.includes(m.key) ? ['view'] : ['view', 'create', 'edit', 'delete', 'export', 'print', 'approve', 'reject', 'archive']]
    })),
  },
  {
    id: 'tpl-4', name: 'صلاحيات كاملة', nameEn: 'Full Access',
    description: 'جميع الصلاحيات على جميع الوحدات',
    descriptionEn: 'All permissions on all modules',
    permissions: Object.fromEntries(SYSTEM_MODULES.map(m => [m.key, allActions()])),
  },
]

// ─── Helper Functions ──────────────────────────────────────────

/** Check if a role has a specific permission */
export function hasPermission(role: RbacRole, module: string, action: string): boolean {
  return role.permissions[module]?.includes(action) || false
}

/** Get all permissions for a specific module */
export function getPermissionsForModule(role: RbacRole, module: string): string[] {
  return role.permissions[module] || []
}

/** Deep clone role permissions */
export function cloneRolePermissions(role: RbacRole): Record<string, string[]> {
  const cloned: Record<string, string[]> = {}
  Object.entries(role.permissions).forEach(([mod, actions]) => {
    cloned[mod] = [...actions]
  })
  return cloned
}

/** Get effective permissions including inherited from parent */
export function getEffectivePermissions(role: RbacRole, allRoles: RbacRole[]): Record<string, string[]> {
  const effective: Record<string, string[]> = {}
  const ownPerms = cloneRolePermissions(role)

  // Start with parent permissions if exists
  if (role.parentId) {
    const parent = allRoles.find(r => r.id === role.parentId)
    if (parent) {
      const parentEffective = getEffectivePermissions(parent, allRoles)
      Object.entries(parentEffective).forEach(([mod, actions]) => {
        effective[mod] = [...actions]
      })
    }
  }

  // Merge own permissions (own takes precedence)
  Object.entries(ownPerms).forEach(([mod, actions]) => {
    if (effective[mod]) {
      // Union of parent + own
      const combined = new Set([...effective[mod], ...actions])
      effective[mod] = Array.from(combined)
    } else {
      effective[mod] = [...actions]
    }
  })

  // Ensure all modules exist in the result
  SYSTEM_MODULES.forEach(m => {
    if (!effective[m.key]) effective[m.key] = []
  })

  return effective
}

/** Get permissions that are inherited vs own */
export function getInheritedVsOwn(role: RbacRole, allRoles: RbacRole[]): {
  inherited: Record<string, string[]>
  own: Record<string, string[]>
} {
  const inherited: Record<string, string[]> = {}
  const own: Record<string, string[]> = {}

  if (role.parentId) {
    const parent = allRoles.find(r => r.id === role.parentId)
    if (parent) {
      const parentEffective = getEffectivePermissions(parent, allRoles)
      Object.entries(parentEffective).forEach(([mod, actions]) => {
        inherited[mod] = [...actions]
      })
    }
  }

  Object.entries(role.permissions).forEach(([mod, actions]) => {
    own[mod] = [...actions]
  })

  return { inherited, own }
}

/** Count total permissions for a role */
export function countPermissions(perms: Record<string, string[]>): number {
  return Object.values(perms).reduce((sum, actions) => sum + actions.length, 0)
}

/** Build permission matrix for display */
export function getPermissionMatrix(roles: RbacRole[]): {
  module: typeof SYSTEM_MODULES[number]
  action: typeof PERMISSION_ACTIONS[number]
  roles: Record<string, boolean>
}[] {
  const matrix: { module: typeof SYSTEM_MODULES[number]; action: typeof PERMISSION_ACTIONS[number]; roles: Record<string, boolean> }[] = []

  SYSTEM_MODULES.forEach(mod => {
    PERMISSION_ACTIONS.forEach(action => {
      const row: { module: typeof SYSTEM_MODULES[number]; action: typeof PERMISSION_ACTIONS[number]; roles: Record<string, boolean> } = {
        module: mod,
        action,
        roles: {},
      }
      roles.forEach(role => {
        row.roles[role.id] = hasPermission(role, mod.key, action.key)
      })
      matrix.push(row)
    })
  })

  return matrix
}

/** Toggle a permission for a role */
export function togglePermission(role: RbacRole, module: string, action: string): Record<string, string[]> {
  const perms = cloneRolePermissions(role)
  if (!perms[module]) perms[module] = []

  if (perms[module].includes(action)) {
    perms[module] = perms[module].filter(a => a !== action)
  } else {
    perms[module].push(action)
  }

  return perms
}

/** Apply a template to a role */
export function applyTemplate(template: PermissionTemplate): Record<string, string[]> {
  const perms: Record<string, string[]> = {}
  Object.entries(template.permissions).forEach(([mod, actions]) => {
    perms[mod] = [...actions]
  })
  return perms
}