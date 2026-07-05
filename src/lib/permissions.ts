// ============================================================
// Central Permission Service — Single Source of Truth
// ============================================================
// This module provides all authorization logic for the entire app.
// EVERY sidebar item, API endpoint, and page guard MUST use this.
// ============================================================

import type { PermissionResource, PermissionAction, PermissionMap } from '@/types'

// ─── Plan → Permission Mapping ──────────────────────────────────────────
// Maps each subscription plan slug to the RBAC permissions it grants.
// Permissions NOT listed here are denied by default.

export interface PermissionMapping {
  [resource: string]: {
    [action: string]: boolean
  }
}

export const PLAN_PERMISSIONS: Record<string, PermissionMapping> = {
  free: {
    dashboard: { view: true },
    bookings: { view: true, create: true },
    customers: { view: true },
    notifications: { view: true },
  },
  starter: {
    dashboard: { view: true },
    bookings: { view: true, create: true },
    customers: { view: true },
    employees: { view: true },
    services: { view: true },
    calendar: { view: true },
  },
  professional: {
    dashboard: { view: true },
    bookings: { view: true, create: true, edit: true, delete: true },
    customers: { view: true, create: true, edit: true, delete: true },
    employees: { view: true, create: true, edit: true, delete: true },
    services: { view: true, create: true, edit: true, delete: true },
    calendar: { view: true },
    payments: { view: true },
    reports: { view: true, export: true },
    branches: { view: true, create: true, edit: true },
    coupons: { view: true, create: true, edit: true, delete: true },
  },
  business: {
    dashboard: { view: true, export: true },
    bookings: { view: true, create: true, edit: true, delete: true, manage: true },
    customers: { view: true, create: true, edit: true, delete: true, manage: true },
    employees: { view: true, create: true, edit: true, delete: true, manage: true },
    services: { view: true, create: true, edit: true, delete: true, manage: true },
    calendar: { view: true, manage: true },
    payments: { view: true, create: true, manage: true },
    reports: { view: true, export: true, manage: true },
    branches: { view: true, create: true, edit: true, delete: true, manage: true },
    resources: { view: true, create: true, edit: true, delete: true, manage: true },
    invoices: { view: true, create: true, edit: true, delete: true, manage: true },
    coupons: { view: true, create: true, edit: true, delete: true, manage: true },
    notifications: { view: true, create: true, manage: true },
    audit_logs: { view: true, create: true, export: true, manage: true },
    roles: { view: true, create: true, edit: true, delete: true, manage: true },
  },
  enterprise: {
    dashboard: { view: true, create: true, edit: true, delete: true, export: true, manage: true },
    bookings: { view: true, create: true, edit: true, delete: true, manage: true },
    customers: { view: true, create: true, edit: true, delete: true, manage: true },
    employees: { view: true, create: true, edit: true, delete: true, manage: true },
    services: { view: true, create: true, edit: true, delete: true, manage: true },
    calendar: { view: true, create: true, edit: true, delete: true, manage: true },
    payments: { view: true, create: true, edit: true, delete: true, manage: true },
    reports: { view: true, create: true, edit: true, delete: true, export: true, manage: true },
    branches: { view: true, create: true, edit: true, delete: true, manage: true },
    resources: { view: true, create: true, edit: true, delete: true, manage: true },
    invoices: { view: true, create: true, edit: true, delete: true, manage: true },
    coupons: { view: true, create: true, edit: true, delete: true, manage: true },
    notifications: { view: true, create: true, edit: true, manage: true },
    audit_logs: { view: true, create: true, edit: true, export: true, manage: true },
    roles: { view: true, create: true, edit: true, delete: true, manage: true },
    settings: { view: true, create: true, edit: true, delete: true, manage: true },
  },
}

// ─── SuperAdmin Permissions (only for platform owner) ──────────────────────
export const SUPERADMIN_PERMISSIONS: PermissionMapping = {
  adminDashboard: { view: true, create: true, edit: true, delete: true, export: true, manage: true },
  tenants: { view: true, create: true, edit: true, delete: true, export: true, manage: true },
  plans: { view: true, create: true, edit: true, delete: true, export: true, manage: true },
  users: { view: true, create: true, edit: true, delete: true, export: true, manage: true },
  globalSettings: { view: true, create: true, edit: true, delete: true, export: true, manage: true },
  billing: { view: true, create: true, edit: true, delete: true, export: true, manage: true },
  systemLogs: { view: true, create: true, export: true, manage: true },
  auditLogs: { view: true, create: true, export: true, manage: true },
  platformHealth: { view: true },
}

// ─── Navigation item definition generated from permissions ────────────────
export interface NavItemDef {
  key: string
  labelAr: string
  labelEn: string
  icon: string // lucide icon name
  section?: 'main' | 'management' | 'settings'
  permissionResource?: PermissionResource
  superAdminOnly?: boolean
}

// Icon name → lucide-react icon import
const ICON_MAP: Record<string, string> = {
  dashboard: 'LayoutDashboard',
  calendar: 'CalendarDays',
  bookings: 'CalendarCheck',
  customers: 'Users',
  employees: 'UserCog',
  services: 'Package',
  resources: 'Box',
  invoices: 'FileText',
  payments: 'CreditCard',
  subscriptions: 'Crown',
  reports: 'BarChart3',
  notifications: 'Bell',
  audit_logs: 'ScrollText',
  branches: 'Building2',
  coupons: 'Tag',
  roles: 'Shield',
  settings: 'Settings',
  // SuperAdmin
  adminDashboard: 'Monitor',
  tenants: 'Building2',
  plans: 'CreditCard',
  users: 'Users',
  globalSettings: 'Settings',
  billing: 'Receipt',
  systemLogs: 'ScrollText',
  auditLogs: 'ScrollText',
  platformHealth: 'Activity',
}

export const SUPERADMIN_NAV: NavItemDef[] = [
  { key: 'adminDashboard', labelAr: 'لوحة تحكم المنصة', labelEn: 'Admin Dashboard', icon: 'Monitor', section: 'settings', superAdminOnly: true },
  { key: 'tenants', labelAr: 'العملاء', labelEn: 'Tenants', icon: 'Building2', section: 'settings', superAdminOnly: true },
  { key: 'plans', labelAr: 'الباقات', labelEn: 'Plans', icon: 'CreditCard', section: 'settings', superAdminOnly: true },
  { key: 'users', labelAr: 'المستخدمين', labelEn: 'Users', icon: 'Users', section: 'settings', superAdminOnly: true },
  { key: 'globalSettings', labelAr: 'الإعدادات العامة', labelEn: 'Global Settings', icon: 'Settings', section: 'settings', superAdminOnly: true },
  { key: 'billing', labelAr: 'الفوترة', labelEn: 'Billing', icon: 'Receipt', section: 'settings', superAdminOnly: true },
  { key: 'systemLogs', labelAr: 'سجلات النظام', labelEn: 'System Logs', icon: 'ScrollText', section: 'settings', superAdminOnly: true },
  { key: 'auditLogs', labelAr: 'سجل المراجعة', labelEn: 'Audit Logs', icon: 'ScrollText', section: 'settings', superAdminOnly: true },
  { key: 'platformHealth', labelAr: 'صحة المنصة', labelEn: 'Platform Health', icon: 'Activity', section: 'settings', superAdminOnly: true },
]

// ─── Permission check helpers ───────────────────────────────────────────────

export function getPermissionsForPlan(planSlug: string): PermissionMapping | null {
  return PLAN_PERMISSIONS[planSlug] ?? null
}

export function hasPermission(
  permissions: PermissionMap,
  resource: string,
  action: string
): boolean {
  // Direct check
  if (permissions?.[resource]?.[action] !== undefined) {
    return permissions[resource][action] as boolean
  }
  // Alias: DB stores may use different action names
  const aliases: Record<string, string> = {
    read: 'view', update: 'edit', write: 'edit',
  }
  for (const [alias, canonical] of Object.entries(aliases)) {
    if (canonical === action) {
      return permissions[resource]?.[alias] ?? false
    }
  }
  return false
}

export function getCanViewResources(permissions: PermissionMapping): string[] {
  const resources: string[] = []
  for (const [resource, actions] of Object.entries(permissions)) {
    for (const [action, granted] of Object.entries(actions)) {
      if (granted) {
        resources.push(resource)
        break // one permission per resource is enough
      }
    }
  }
  return resources
}

// ─── Generate navigation items from permissions ────────────────────────

export function generateNavItems(
  permissions: PermissionMapping,
  isSuperAdmin: boolean = false
): NavItemDef[] {
  const items: NavItemDef[] = []

  // Add tenant items from permissions
  for (const [resource, actions] of Object.entries(permissions)) {
    const hasView = actions.view === true || actions.read === true
    if (!hasView) continue

    const label = RESOURCE_LABELS[resource]
    items.push({
      key: resource,
      labelAr: label?.ar || resource,
      labelEn: label?.en || resource,
      icon: ICON_MAP[resource] || 'Circle',
      section: (label?.section || 'main') as NavItemDef['section'],
    })
  }

  return items
}

export function generateNavSections(
  items: NavItemDef[],
  isSuperAdmin: boolean = false
): { section: string; items: NavItemDef[] }[] {
  const sections: Record<string, NavItemDef[]> = {}

  for (const item of items) {
    const section = item.section || 'main'
    if (!sections[section]) sections[section] = []
    sections[section].push(item)
  }

  return Object.entries(sections).map(([section, items]) => ({
    section: section === 'main' ? (isSuperAdmin ? 'إدارة النظام' : 'الرئيسية')
      : section === 'management' ? 'الإدارة' : 'الإعدادات',
    items,
  }))
}

// ─── Resource labels ──────────────────────────────────────────────────

const RESOURCE_LABELS: Record<string, { ar: string; en: string; section: string }> = {
  dashboard: { ar: 'لوحة التحكم', en: 'Dashboard', section: 'main' },
  calendar: { ar: 'التقويم', en: 'Calendar', section: 'main' },
  bookings: { ar: 'الحجوزات', en: 'Bookings', section: 'main' },
  customers: { ar: 'العملاء', en: 'Customers', section: 'main' },
  employees: { ar: 'الموظفين', en: 'Employees', section: 'main' },
  services: { ar: 'الخدمات', en: 'Services', section: 'main' },
  resources: { ar: 'الموارد', en: 'Resources', section: 'main' },
  invoices: { ar: 'الفواتير', en: 'Invoices', section: 'main' },
  payments: { ar: 'المدفوعات', en: 'Payments', section: 'main' },
  subscriptions: { ar: 'الاشتراكات', en: 'Subscriptions', section: 'main' },
  reports: { ar: 'التقارير', en: 'Reports', section: 'main' },
  notifications: { ar: 'الإشعارات', en: 'Notifications', section: 'management' },
  audit_logs: { ar: 'سجل العمليات', en: 'Audit Logs', section: 'management' },
  branches: { ar: 'الفروع', en: 'Branches', section: 'management' },
  coupons: { ar: 'الكوبونات', en: 'Coupons', section: 'management' },
  roles: { ar: 'الأدوار والصلاحيات', en: 'Roles & Permissions', section: 'management' },
  settings: { ar: 'الإعدادات', en: 'Settings', section: 'settings' },
}