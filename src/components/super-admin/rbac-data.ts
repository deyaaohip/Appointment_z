// ─── Enterprise RBAC Data System ────────────────────────────────

// ─── API Endpoints per module ──────────────────────────────────
export const API_ENDPOINTS: Record<string, { method: string; path: string; labelAr: string; labelEn: string }[]> = {
  tenants: [
    { method: 'GET', path: '/api/tenants', labelAr: 'قائمة المستأجرين', labelEn: 'List Tenants' },
    { method: 'POST', path: '/api/tenants', labelAr: 'إنشاء مستأجر', labelEn: 'Create Tenant' },
    { method: 'GET', path: '/api/tenants/:id', labelAr: 'تفاصيل المستأجر', labelEn: 'Get Tenant' },
    { method: 'PUT', path: '/api/tenants/:id', labelAr: 'تعديل المستأجر', labelEn: 'Update Tenant' },
    { method: 'DELETE', path: '/api/tenants/:id', labelAr: 'حذف المستأجر', labelEn: 'Delete Tenant' },
    { method: 'POST', path: '/api/tenants/:id/suspend', labelAr: 'تعليق المستأجر', labelEn: 'Suspend Tenant' },
    { method: 'POST', path: '/api/tenants/:id/activate', labelAr: 'تفعيل المستأجر', labelEn: 'Activate Tenant' },
  ],
  users: [
    { method: 'GET', path: '/api/users', labelAr: 'قائمة المستخدمين', labelEn: 'List Users' },
    { method: 'POST', path: '/api/users', labelAr: 'إنشاء مستخدم', labelEn: 'Create User' },
    { method: 'PUT', path: '/api/users/:id', labelAr: 'تعديل مستخدم', labelEn: 'Update User' },
    { method: 'DELETE', path: '/api/users/:id', labelAr: 'حذف مستخدم', labelEn: 'Delete User' },
    { method: 'POST', path: '/api/users/:id/suspend', labelAr: 'تعليق مستخدم', labelEn: 'Suspend User' },
    { method: 'GET', path: '/api/users/export', labelAr: 'تصدير المستخدمين', labelEn: 'Export Users' },
  ],
  plans: [
    { method: 'GET', path: '/api/plans', labelAr: 'قائمة الباقات', labelEn: 'List Plans' },
    { method: 'POST', path: '/api/plans', labelAr: 'إنشاء باقة', labelEn: 'Create Plan' },
    { method: 'PUT', path: '/api/plans/:id', labelAr: 'تعديل باقة', labelEn: 'Update Plan' },
    { method: 'DELETE', path: '/api/plans/:id', labelAr: 'حذف باقة', labelEn: 'Delete Plan' },
  ],
  billing: [
    { method: 'GET', path: '/api/invoices', labelAr: 'قائمة الفواتير', labelEn: 'List Invoices' },
    { method: 'POST', path: '/api/invoices', labelAr: 'إنشاء فاتورة', labelEn: 'Create Invoice' },
    { method: 'GET', path: '/api/invoices/:id', labelAr: 'تفاصيل الفاتورة', labelEn: 'Get Invoice' },
    { method: 'POST', path: '/api/invoices/:id/pay', labelAr: 'دفع فاتورة', labelEn: 'Pay Invoice' },
    { method: 'POST', path: '/api/invoices/:id/refund', labelAr: 'إرجاع فاتورة', labelEn: 'Refund Invoice' },
    { method: 'GET', path: '/api/invoices/export', labelAr: 'تصدير الفواتير', labelEn: 'Export Invoices' },
  ],
  roles: [
    { method: 'GET', path: '/api/roles', labelAr: 'قائمة الأدوار', labelEn: 'List Roles' },
    { method: 'POST', path: '/api/roles', labelAr: 'إنشاء دور', labelEn: 'Create Role' },
    { method: 'PUT', path: '/api/roles/:id', labelAr: 'تعديل دور', labelEn: 'Update Role' },
    { method: 'DELETE', path: '/api/roles/:id', labelAr: 'حذف دور', labelEn: 'Delete Role' },
    { method: 'POST', path: '/api/roles/:id/clone', labelAr: 'نسخ دور', labelEn: 'Clone Role' },
  ],
  audit: [
    { method: 'GET', path: '/api/audit-logs', labelAr: 'سجل العمليات', labelEn: 'Audit Logs' },
    { method: 'GET', path: '/api/audit-logs/export', labelAr: 'تصدير السجل', labelEn: 'Export Logs' },
  ],
  notifications: [
    { method: 'GET', path: '/api/notifications/templates', labelAr: 'قوالب الإشعارات', labelEn: 'Notification Templates' },
    { method: 'POST', path: '/api/notifications/send', labelAr: 'إرسال إشعار', labelEn: 'Send Notification' },
    { method: 'PUT', path: '/api/notifications/templates/:id', labelAr: 'تعديل قالب', labelEn: 'Update Template' },
  ],
  reports: [
    { method: 'GET', path: '/api/reports', labelAr: 'قائمة التقارير', labelEn: 'List Reports' },
    { method: 'POST', path: '/api/reports/:id/generate', labelAr: 'توليد تقرير', labelEn: 'Generate Report' },
    { method: 'GET', path: '/api/reports/:id/download', labelAr: 'تحميل تقرير', labelEn: 'Download Report' },
  ],
  system: [
    { method: 'GET', path: '/api/system/health', labelAr: 'صحة النظام', labelEn: 'System Health' },
    { method: 'POST', path: '/api/system/refresh', labelAr: 'تحديث النظام', labelEn: 'Refresh System' },
  ],
  servers: [
    { method: 'GET', path: '/api/servers', labelAr: 'قائمة الخوادم', labelEn: 'List Servers' },
    { method: 'POST', path: '/api/servers', labelAr: 'إضافة خادم', labelEn: 'Add Server' },
    { method: 'POST', path: '/api/servers/:id/restart', labelAr: 'إعادة تشغيل', labelEn: 'Restart Server' },
    { method: 'DELETE', path: '/api/servers/:id', labelAr: 'حذف خادم', labelEn: 'Delete Server' },
  ],
  database: [
    { method: 'GET', path: '/api/database/status', labelAr: 'حالة قاعدة البيانات', labelEn: 'DB Status' },
    { method: 'POST', path: '/api/database/backup', labelAr: 'نسخ احتياطي', labelEn: 'Create Backup' },
    { method: 'GET', path: '/api/database/backups', labelAr: 'قائمة النسخ', labelEn: 'List Backups' },
  ],
  security: [
    { method: 'GET', path: '/api/security/settings', labelAr: 'إعدادات الأمان', labelEn: 'Security Settings' },
    { method: 'PUT', path: '/api/security/settings', labelAr: 'تعديل إعدادات الأمان', labelEn: 'Update Security' },
    { method: 'GET', path: '/api/security/attempts', labelAr: 'محاولات الدخول', labelEn: 'Login Attempts' },
  ],
  cliq: [
    { method: 'GET', path: '/api/cliq/payments', labelAr: 'مدفوعات CLIQ', labelEn: 'CLIQ Payments' },
    { method: 'POST', path: '/api/cliq/payments/:id/approve', labelAr: 'موافقة الدفع', labelEn: 'Approve Payment' },
    { method: 'POST', path: '/api/cliq/payments/:id/reject', labelAr: 'رفض الدفع', labelEn: 'Reject Payment' },
    { method: 'GET', path: '/api/cliq/config', labelAr: 'إعدادات CLIQ', labelEn: 'CLIQ Config' },
    { method: 'PUT', path: '/api/cliq/config', labelAr: 'تعديل إعدادات CLIQ', labelEn: 'Update CLIQ Config' },
  ],
}

// ─── UI Buttons per module ──────────────────────────────────────
export const UI_BUTTONS: Record<string, { key: string; labelAr: string; labelEn: string; requiredAction: string }[]> = {
  tenants: [
    { key: 'btn_add', labelAr: 'إضافة مستأجر', labelEn: 'Add Tenant', requiredAction: 'create' },
    { key: 'btn_edit', labelAr: 'تعديل', labelEn: 'Edit', requiredAction: 'edit' },
    { key: 'btn_delete', labelAr: 'حذف', labelEn: 'Delete', requiredAction: 'delete' },
    { key: 'btn_suspend', labelAr: 'تعليق', labelEn: 'Suspend', requiredAction: 'edit' },
    { key: 'btn_extend', labelAr: 'تمديد اشتراك', labelEn: 'Extend', requiredAction: 'edit' },
    { key: 'btn_export', labelAr: 'تصدير Excel', labelEn: 'Export Excel', requiredAction: 'export' },
  ],
  users: [
    { key: 'btn_add', labelAr: 'إضافة مستخدم', labelEn: 'Add User', requiredAction: 'create' },
    { key: 'btn_edit', labelAr: 'تعديل', labelEn: 'Edit', requiredAction: 'edit' },
    { key: 'btn_delete', labelAr: 'حذف', labelEn: 'Delete', requiredAction: 'delete' },
    { key: 'btn_toggle', labelAr: 'تعليق/تفعيل', labelEn: 'Toggle Status', requiredAction: 'edit' },
    { key: 'btn_export', labelAr: 'تصدير', labelEn: 'Export', requiredAction: 'export' },
  ],
  billing: [
    { key: 'btn_create', labelAr: 'إنشاء فاتورة', labelEn: 'Create Invoice', requiredAction: 'create' },
    { key: 'btn_view', labelAr: 'عرض', labelEn: 'View', requiredAction: 'view' },
    { key: 'btn_mark_paid', labelAr: 'تحديد كمدفوع', labelEn: 'Mark Paid', requiredAction: 'approve' },
    { key: 'btn_refund', labelAr: 'إرجاع', labelEn: 'Refund', requiredAction: 'reject' },
    { key: 'btn_export', labelAr: 'تصدير Excel', labelEn: 'Export Excel', requiredAction: 'export' },
    { key: 'btn_print', labelAr: 'طباعة', labelEn: 'Print', requiredAction: 'print' },
    { key: 'btn_send_email', labelAr: 'إرسال بالبريد', labelEn: 'Send Email', requiredAction: 'view' },
    { key: 'btn_download_pdf', labelAr: 'تحميل PDF', labelEn: 'Download PDF', requiredAction: 'export' },
  ],
  plans: [
    { key: 'btn_add', labelAr: 'إنشاء باقة', labelEn: 'Create Plan', requiredAction: 'create' },
    { key: 'btn_edit', labelAr: 'تعديل', labelEn: 'Edit', requiredAction: 'edit' },
    { key: 'btn_delete', labelAr: 'حذف', labelEn: 'Delete', requiredAction: 'delete' },
  ],
  roles: [
    { key: 'btn_add', labelAr: 'إضافة دور', labelEn: 'Add Role', requiredAction: 'create' },
    { key: 'btn_edit', labelAr: 'تعديل', labelEn: 'Edit', requiredAction: 'edit' },
    { key: 'btn_delete', labelAr: 'حذف', labelEn: 'Delete', requiredAction: 'delete' },
    { key: 'btn_clone', labelAr: 'نسخ', labelEn: 'Clone', requiredAction: 'create' },
    { key: 'btn_matrix', labelAr: 'عرض المصفوفة', labelEn: 'View Matrix', requiredAction: 'view' },
  ],
  audit: [
    { key: 'btn_export', labelAr: 'تصدير السجل', labelEn: 'Export Logs', requiredAction: 'export' },
  ],
  cliq: [
    { key: 'btn_approve', labelAr: 'موافقة', labelEn: 'Approve', requiredAction: 'approve' },
    { key: 'btn_reject', labelAr: 'رفض', labelEn: 'Reject', requiredAction: 'reject' },
    { key: 'btn_request_info', labelAr: 'طلب معلومات', labelEn: 'Request Info', requiredAction: 'edit' },
    { key: 'btn_new_payment', labelAr: 'تسجيل دفع جديد', labelEn: 'New Payment', requiredAction: 'create' },
  ],
}

// ─── Page visibility mapping (module -> sidebar view ID) ───────
export const PAGE_VISIBILITY_MAP: Record<string, string[]> = {
  tenants: ['sa_tenants'],
  users: ['sa_users'],
  plans: ['sa_plans'],
  billing: ['sa_billing'],
  roles: ['sa_roles'],
  audit: ['sa_audit'],
  notifications: ['sa_notifications'],
  reports: ['sa_reports'],
  system: ['sa_system'],
  servers: ['sa_servers'],
  database: ['sa_database'],
  security: ['sa_security'],
  cliq: ['sa_cliq'],
}

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
  // Enhanced RBAC fields
  claims: RbacClaim[]
  policies: RbacPolicy[]
  hiddenPages: string[] // sidebar view IDs this role cannot see
}

// ─── Claims (JWT-like) ─────────────────────────────────────────
export interface RbacClaim {
  key: string       // e.g. 'role', 'tenant_id', 'plan', 'max_users'
  value: string     // e.g. 'super_admin', 'tenant-1', 'enterprise', '100'
  type: 'role' | 'tenant' | 'plan' | 'limit' | 'custom'
  labelAr: string
  labelEn: string
}

// ─── Policy (deny/allow rules) ─────────────────────────────────
export interface RbacPolicy {
  id: string
  name: string
  nameEn: string
  effect: 'allow' | 'deny'
  module: string       // module key or '*'
  action: string      // action key or '*'
  condition?: string  // e.g. 'tenant.status === "active"'
  conditionAr?: string
  conditionEn?: string
  priority: number     // lower = higher priority
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

// ─── Method-to-action mapping for API auth ──────────────────────
export const METHOD_ACTION_MAP: Record<string, string> = {
  GET: 'view', POST: 'create', PUT: 'edit', PATCH: 'edit', DELETE: 'delete',
}

/** Check if an API endpoint is authorized for a role */
export function isApiAuthorized(role: RbacRole, method: string, path: string): { authorized: boolean; reason: string } {
  // Find which module this endpoint belongs to
  for (const [mod, endpoints] of Object.entries(API_ENDPOINTS)) {
    const match = endpoints.find(e => e.path === path && e.method === method)
    if (match) {
      // Check policies first (deny rules take priority)
      for (const policy of (role.policies || []).sort((a, b) => a.priority - b.priority)) {
        if (policy.module === '*' || policy.module === mod) {
          if (policy.action === '*' || policy.action === METHOD_ACTION_MAP[method]) {
            if (policy.effect === 'deny') {
              return { authorized: false, reason: policy.nameEn || policy.name }
            }
          }
        }
      }
      // Check permissions
      const required = METHOD_ACTION_MAP[method] || 'view'
      const allowed = role.permissions[mod] || []
      if (allowed.includes(required)) {
        return { authorized: true, reason: '' }
      }
      return { authorized: false, reason: `Missing '${required}' on module '${mod}'` }
    }
  }
  // Endpoint not in registry — allow by default for Super Admin
  return { authorized: true, reason: '' }
}

/** Check button visibility for a role */
export function isButtonVisible(role: RbacRole, module: string, buttonKey: string): boolean {
  const buttons = UI_BUTTONS[module] || []
  const btn = buttons.find(b => b.key === buttonKey)
  if (!btn) return true // unknown button — show by default
  return (role.permissions[module] || []).includes(btn.requiredAction)
}

/** Get hidden pages for a role */
export function getHiddenPages(role: RbacRole, allRoles: RbacRole[]): string[] {
  const effective = getEffectivePermissions(role, allRoles)
  const hidden: string[] = []
  SYSTEM_MODULES.forEach(m => {
    const perms = effective[m.key] || []
    if (!perms.includes('view')) {
      const pages = PAGE_VISIBILITY_MAP[m.key] || []
      hidden.push(...pages)
    }
  })
  // Add explicitly hidden pages
  if (role.hiddenPages) hidden.push(...role.hiddenPages)
  return [...new Set(hidden)]
}

/** Generate mock JWT claims payload for a role */
export function generateJwtClaims(role: RbacRole): Record<string, string> {
  const claims: Record<string, string> = {
    sub: role.id,
    role: role.nameEn.toLowerCase().replace(/\s+/g, '_'),
    name: role.nameEn,
    nameAr: role.name,
    iss: 'bookflow-sa',
    aud: 'bookflow-platform',
    iat: Math.floor(Date.now() / 1000).toString(),
    exp: Math.floor(Date.now() / 1000 + 86400).toString(),
  }
  // Add custom claims from role
  ;(role.claims || []).forEach(c => { claims[c.key] = c.value })
  // Add permissions as compact claim
  const permsStr = Object.entries(role.permissions)
    .filter(([, actions]) => actions.length > 0)
    .map(([mod, actions]) => `${mod}:${actions.join(',')}`)
    .join(';')
  claims.permissions = permsStr
  return claims
}

/** Simulate a 403 response for unauthorized API access */
export function simulate403(endpoint: string, method: string, role: RbacRole): { status: number; body: { error: string; message: string; required: string } } | null {
  const { authorized, reason } = isApiAuthorized(role, method, endpoint)
  if (!authorized) {
    return {
      status: 403,
      body: {
        error: 'Forbidden',
        message: reason,
        required: `${method} ${endpoint}`,
      },
    }
  }
  return null
}

// ─── Initial Roles (with Claims, Policies, hiddenPages) ────────
export const INIT_RBAC_ROLES: RbacRole[] = [
  {
    id: 'rbac-1', name: 'مدير النظام', nameEn: 'Super Admin',
    description: 'صلاحيات كاملة على جميع وحدات المنصة بدون استثناء',
    descriptionEn: 'Full access to all platform modules without exception',
    userCount: 1, isSystem: true, parentId: null,
    permissions: superAdminPerms(), createdAt: '2025-01-01',
    claims: [
      { key: 'role', value: 'super_admin', type: 'role', labelAr: 'الدور', labelEn: 'Role' },
      { key: 'scope', value: 'platform', type: 'custom', labelAr: 'النطاق', labelEn: 'Scope' },
      { key: 'access_level', value: 'full', type: 'custom', labelAr: 'مستوى الوصول', labelEn: 'Access Level' },
    ],
    policies: [],
    hiddenPages: [],
  },
  {
    id: 'rbac-2', name: 'مالك المستأجر', nameEn: 'Tenant Owner',
    description: 'صلاحيات كاملة على المستأجر مع وصول محدود للوحدات النظامية',
    descriptionEn: 'Full tenant access with limited system module access',
    userCount: 8, isSystem: true, parentId: 'rbac-1',
    permissions: tenantOwnerPerms(), createdAt: '2025-01-01',
    claims: [
      { key: 'role', value: 'tenant_owner', type: 'role', labelAr: 'الدور', labelEn: 'Role' },
      { key: 'scope', value: 'tenant', type: 'tenant', labelAr: 'النطاق', labelEn: 'Scope' },
      { key: 'max_users', value: '100', type: 'limit', labelAr: 'الحد الأقصى للمستخدمين', labelEn: 'Max Users' },
    ],
    policies: [
      { id: 'p-1', name: 'منع حذف النظام', nameEn: 'Deny System Delete', effect: 'deny', module: 'system', action: 'delete', priority: 1 },
    ],
    hiddenPages: ['sa_servers', 'sa_database'],
  },
  {
    id: 'rbac-3', name: 'مدير الفرع', nameEn: 'Branch Manager',
    description: 'إدارة الفرع والموظفين مع صلاحيات محدودة',
    descriptionEn: 'Branch and employee management with limited permissions',
    userCount: 15, isSystem: true, parentId: 'rbac-2',
    permissions: branchManagerPerms(), createdAt: '2025-01-01',
    claims: [
      { key: 'role', value: 'branch_manager', type: 'role', labelAr: 'الدور', labelEn: 'Role' },
      { key: 'scope', value: 'branch', type: 'tenant', labelAr: 'النطاق', labelEn: 'Scope' },
      { key: 'max_users', value: '25', type: 'limit', labelAr: 'الحد الأقصى للمستخدمين', labelEn: 'Max Users' },
    ],
    policies: [
      { id: 'p-2', name: 'منع حذف المستأجر', nameEn: 'Deny Tenant Delete', effect: 'deny', module: 'tenants', action: 'delete', priority: 1 },
      { id: 'p-3', name: 'منع تعديل الفواتير', nameEn: 'Deny Invoice Edit', effect: 'deny', module: 'billing', action: 'edit', priority: 1 },
    ],
    hiddenPages: ['sa_system', 'sa_servers', 'sa_database', 'sa_security', 'sa_roles', 'sa_audit'],
  },
  {
    id: 'rbac-4', name: 'موظف استقبال', nameEn: 'Receptionist',
    description: 'عرض الحجوزات والعملاء فقط',
    descriptionEn: 'View bookings and customers only',
    userCount: 42, isSystem: true, parentId: null,
    permissions: receptionistPerms(), createdAt: '2025-01-01',
    claims: [
      { key: 'role', value: 'receptionist', type: 'role', labelAr: 'الدور', labelEn: 'Role' },
      { key: 'scope', value: 'branch', type: 'tenant', labelAr: 'النطاق', labelEn: 'Scope' },
    ],
    policies: [
      { id: 'p-4', name: 'منع إنشاء الفواتير', nameEn: 'Deny Invoice Create', effect: 'deny', module: 'billing', action: 'create', priority: 1 },
    ],
    hiddenPages: ['sa_system', 'sa_servers', 'sa_database', 'sa_security', 'sa_roles', 'sa_audit', 'sa_cliq', 'sa_reports'],
  },
  {
    id: 'rbac-5', name: 'محاسب', nameEn: 'Accountant',
    description: 'عرض التقارير والفواتير مع إمكانية الموافقة على المدفوعات',
    descriptionEn: 'Reports and invoices access with payment approval',
    userCount: 6, isSystem: true, parentId: null,
    permissions: accountantPerms(), createdAt: '2025-01-01',
    claims: [
      { key: 'role', value: 'accountant', type: 'role', labelAr: 'الدور', labelEn: 'Role' },
      { key: 'scope', value: 'tenant', type: 'tenant', labelAr: 'النطاق', labelEn: 'Scope' },
      { key: 'can_approve_payments', value: 'true', type: 'custom', labelAr: 'يمكن الموافقة على المدفوعات', labelEn: 'Can Approve Payments' },
    ],
    policies: [
      { id: 'p-5', name: 'منع حذف المستخدمين', nameEn: 'Deny User Delete', effect: 'deny', module: 'users', action: 'delete', priority: 1 },
    ],
    hiddenPages: ['sa_system', 'sa_servers', 'sa_database', 'sa_security', 'sa_roles'],
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