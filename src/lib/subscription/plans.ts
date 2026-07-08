// ============================================================
// Subscription Plan Definitions — Single Source of Truth
// ============================================================
// Every module, feature, limit, and integration is defined here.
// NOTHING should be hardcoded elsewhere.
// ============================================================

// ─── Feature IDs ────────────────────────────────────────────
// Every toggleable feature in the app has a unique ID.
export const FEATURE_IDS = {
  // Core
  BASIC_BOOKINGS: 'basic_bookings',
  RECURRING_BOOKINGS: 'recurring_bookings',
  GROUP_BOOKINGS: 'group_bookings',
  WAITLIST: 'waitlist',
  DEPOSITS: 'deposits',

  // Data
  EXPORT_REPORTS: 'export_reports',
  IMPORT_DATA: 'import_data',
  ADVANCED_REPORTS: 'advanced_reports',

  // Communication
  WHATSAPP_REMINDERS: 'whatsapp_reminders',
  EMAIL_CAMPAIGNS: 'email_campaigns',
  EMAIL_REMINDERS: 'email_reminders',
  SMS_NOTIFICATIONS: 'sms_notifications',

  // Operations
  MULTIPLE_BRANCHES: 'multiple_branches',
  EMPLOYEE_MANAGEMENT: 'employee_management',
  RESOURCE_MANAGEMENT: 'resource_management',
  COUPON_MANAGEMENT: 'coupon_management',
  INVOICE_MANAGEMENT: 'invoice_management',

  // Admin
  ROLE_MANAGEMENT: 'role_management',
  AUDIT_LOGS: 'audit_logs',
  API_ACCESS: 'api_access',
  CUSTOM_BRANDING: 'custom_branding',
  BACKUP_RESTORE: 'backup_restore',
  CALENDAR_SYNC: 'calendar_sync',
  CUSTOM_DOMAIN: 'custom_domain',
  WHITE_LABEL: 'white_label',
  PRIORITY_SUPPORT: 'priority_support',
  DEDICATED_MANAGER: 'dedicated_manager',
  CUSTOM_SLA: 'custom_sla',
  PRIVATE_DEPLOYMENT: 'private_deployment',
} as const

export type FeatureId = (typeof FEATURE_IDS)[keyof typeof FEATURE_IDS]

// ─── Module IDs (pages) ────────────────────────────────────
export const MODULE_IDS = {
  DASHBOARD: 'dashboard',
  CALENDAR: 'calendar',
  BOOKINGS: 'bookings',
  CUSTOMERS: 'customers',
  EMPLOYEES: 'employees',
  SERVICES: 'services',
  RESOURCES: 'resources',
  INVOICES: 'invoices',
  PAYMENTS: 'payments',
  SUBSCRIPTIONS: 'subscriptions',
  REPORTS: 'reports',
  NOTIFICATIONS: 'notifications',
  AUDIT_LOGS: 'audit_logs',
  BRANCHES: 'branches',
  COUPONS: 'coupons',
  ROLES: 'roles',
  WHATSAPP: 'whatsapp',
  SETTINGS: 'settings',
} as const

export type ModuleId = (typeof MODULE_IDS)[keyof typeof MODULE_IDS]

// ─── Integration IDs ───────────────────────────────────────
export const INTEGRATION_IDS = {
  WHATSAPP: 'whatsapp_integration',
  EMAIL: 'email_integration',
  SMS: 'sms_integration',
  GOOGLE_CALENDAR: 'google_calendar',
  PAYMENT_GATEWAY: 'payment_gateway',
  STRIPE: 'stripe',
  APPLE_PAY: 'apple_pay',
  MADA: 'mada',
  STC_PAY: 'stc_pay',
} as const

export type IntegrationId = (typeof INTEGRATION_IDS)[keyof typeof INTEGRATION_IDS]

// ─── Usage Limits ──────────────────────────────────────────
export interface PlanLimits {
  maxCustomers: number        // -1 = unlimited
  maxEmployees: number
  maxServices: number
  maxBookingsPerMonth: number
  maxBranches: number
  maxUsers: number
  maxStorage: number          // MB, -1 = unlimited
  maxWhatsappMessages: number // per month
  maxEmailMessages: number    // per month
}

export const DEFAULT_LIMITS: PlanLimits = {
  maxCustomers: -1,
  maxEmployees: -1,
  maxServices: -1,
  maxBookingsPerMonth: -1,
  maxBranches: -1,
  maxUsers: -1,
  maxStorage: -1,
  maxWhatsappMessages: -1,
  maxEmailMessages: -1,
}

// ─── Bilingual Label ──────────────────────────────────────
export interface Bilingual {
  ar: string
  en: string
}

// ─── Plan Definition ───────────────────────────────────────
export interface PlanDefinition {
  slug: string
  name: Bilingual
  description: Bilingual
  price: number           // monthly SAR
  priceYearly: number     // yearly SAR (0 = no yearly discount)
  color: string           // tailwind color class
  popular: boolean

  // Which pages are visible
  modules: ModuleId[]

  // Feature flags
  features: Record<FeatureId, boolean>

  // Usage limits
  limits: PlanLimits

  // Allowed integrations
  integrations: IntegrationId[]

  // RBAC permissions (resource → actions)
  permissions: Record<string, Record<string, boolean>>
}

// ─── Free Plan ──────────────────────────────────────────────
const FREE_PLAN: PlanDefinition = {
  slug: 'free',
  name: { ar: 'مجاني', en: 'Free' },
  description: {
    ar: 'للأعمال الناشئة — ميزات أساسية مجانية',
    en: 'For startups — essential features, free forever',
  },
  price: 0,
  priceYearly: 0,
  color: 'bg-gray-500',
  popular: false,

  modules: [
    MODULE_IDS.DASHBOARD,
    MODULE_IDS.BOOKINGS,
    MODULE_IDS.CUSTOMERS,
    MODULE_IDS.NOTIFICATIONS,
  ],

  features: {
    [FEATURE_IDS.BASIC_BOOKINGS]: true,
    [FEATURE_IDS.RECURRING_BOOKINGS]: false,
    [FEATURE_IDS.GROUP_BOOKINGS]: false,
    [FEATURE_IDS.WAITLIST]: false,
    [FEATURE_IDS.DEPOSITS]: false,
    [FEATURE_IDS.EXPORT_REPORTS]: false,
    [FEATURE_IDS.IMPORT_DATA]: false,
    [FEATURE_IDS.ADVANCED_REPORTS]: false,
    [FEATURE_IDS.WHATSAPP_REMINDERS]: false,
    [FEATURE_IDS.EMAIL_CAMPAIGNS]: false,
    [FEATURE_IDS.EMAIL_REMINDERS]: false,
    [FEATURE_IDS.SMS_NOTIFICATIONS]: false,
    [FEATURE_IDS.MULTIPLE_BRANCHES]: false,
    [FEATURE_IDS.EMPLOYEE_MANAGEMENT]: false,
    [FEATURE_IDS.RESOURCE_MANAGEMENT]: false,
    [FEATURE_IDS.COUPON_MANAGEMENT]: false,
    [FEATURE_IDS.INVOICE_MANAGEMENT]: false,
    [FEATURE_IDS.ROLE_MANAGEMENT]: false,
    [FEATURE_IDS.AUDIT_LOGS]: false,
    [FEATURE_IDS.API_ACCESS]: false,
    [FEATURE_IDS.CUSTOM_BRANDING]: false,
    [FEATURE_IDS.BACKUP_RESTORE]: false,
    [FEATURE_IDS.CALENDAR_SYNC]: false,
    [FEATURE_IDS.CUSTOM_DOMAIN]: false,
    [FEATURE_IDS.WHITE_LABEL]: false,
    [FEATURE_IDS.PRIORITY_SUPPORT]: false,
    [FEATURE_IDS.DEDICATED_MANAGER]: false,
    [FEATURE_IDS.CUSTOM_SLA]: false,
    [FEATURE_IDS.PRIVATE_DEPLOYMENT]: false,
  },

  limits: {
    maxCustomers: 50,
    maxEmployees: 1,
    maxServices: 5,
    maxBookingsPerMonth: 30,
    maxBranches: 1,
    maxUsers: 1,
    maxStorage: 100,
    maxWhatsappMessages: 0,
    maxEmailMessages: 50,
  },

  integrations: [
    INTEGRATION_IDS.EMAIL,
  ],

  permissions: {
    dashboard: { view: true },
    bookings: { view: true, create: true },
    customers: { view: true },
    notifications: { view: true },
  },
}

// ─── Starter Plan ──────────────────────────────────────────
const STARTER_PLAN: PlanDefinition = {
  slug: 'starter',
  name: { ar: 'أساسي', en: 'Starter' },
  description: {
    ar: 'للأعمال الصغيرة — ميزات إضافية للموظفين والخدمات',
    en: 'For small businesses — employee & service features',
  },
  price: 99,
  priceYearly: 950,
  color: 'bg-sky-500',
  popular: false,

  modules: [
    MODULE_IDS.DASHBOARD,
    MODULE_IDS.CALENDAR,
    MODULE_IDS.BOOKINGS,
    MODULE_IDS.CUSTOMERS,
    MODULE_IDS.EMPLOYEES,
    MODULE_IDS.SERVICES,
    MODULE_IDS.NOTIFICATIONS,
  ],

  features: {
    [FEATURE_IDS.BASIC_BOOKINGS]: true,
    [FEATURE_IDS.RECURRING_BOOKINGS]: false,
    [FEATURE_IDS.GROUP_BOOKINGS]: false,
    [FEATURE_IDS.WAITLIST]: true,
    [FEATURE_IDS.DEPOSITS]: false,
    [FEATURE_IDS.EXPORT_REPORTS]: false,
    [FEATURE_IDS.IMPORT_DATA]: false,
    [FEATURE_IDS.ADVANCED_REPORTS]: false,
    [FEATURE_IDS.WHATSAPP_REMINDERS]: false,
    [FEATURE_IDS.EMAIL_CAMPAIGNS]: false,
    [FEATURE_IDS.EMAIL_REMINDERS]: true,
    [FEATURE_IDS.SMS_NOTIFICATIONS]: true,
    [FEATURE_IDS.MULTIPLE_BRANCHES]: false,
    [FEATURE_IDS.EMPLOYEE_MANAGEMENT]: true,
    [FEATURE_IDS.RESOURCE_MANAGEMENT]: false,
    [FEATURE_IDS.COUPON_MANAGEMENT]: false,
    [FEATURE_IDS.INVOICE_MANAGEMENT]: false,
    [FEATURE_IDS.ROLE_MANAGEMENT]: false,
    [FEATURE_IDS.AUDIT_LOGS]: false,
    [FEATURE_IDS.API_ACCESS]: false,
    [FEATURE_IDS.CUSTOM_BRANDING]: false,
    [FEATURE_IDS.BACKUP_RESTORE]: false,
    [FEATURE_IDS.CALENDAR_SYNC]: false,
    [FEATURE_IDS.CUSTOM_DOMAIN]: false,
    [FEATURE_IDS.WHITE_LABEL]: false,
    [FEATURE_IDS.PRIORITY_SUPPORT]: false,
    [FEATURE_IDS.DEDICATED_MANAGER]: false,
    [FEATURE_IDS.CUSTOM_SLA]: false,
    [FEATURE_IDS.PRIVATE_DEPLOYMENT]: false,
  },

  limits: {
    maxCustomers: 200,
    maxEmployees: 3,
    maxServices: 20,
    maxBookingsPerMonth: 200,
    maxBranches: 1,
    maxUsers: 3,
    maxStorage: 500,
    maxWhatsappMessages: 0,
    maxEmailMessages: 500,
  },

  integrations: [
    INTEGRATION_IDS.EMAIL,
    INTEGRATION_IDS.SMS,
  ],

  permissions: {
    dashboard: { view: true },
    bookings: { view: true, create: true, edit: true },
    customers: { view: true, create: true, edit: true },
    employees: { view: true, create: true, edit: true },
    services: { view: true, create: true, edit: true },
    calendar: { view: true },
    notifications: { view: true },
  },
}

// ─── Professional Plan ─────────────────────────────────────
const PROFESSIONAL_PLAN: PlanDefinition = {
  slug: 'professional',
  name: { ar: 'احترافي', en: 'Professional' },
  description: {
    ar: 'للأعمال المتنامية — تقارير متقدمة وفروع متعددة',
    en: 'For growing businesses — advanced reports & multi-branch',
  },
  price: 299,
  priceYearly: 2890,
  color: 'bg-violet-500',
  popular: true,

  modules: [
    MODULE_IDS.DASHBOARD,
    MODULE_IDS.CALENDAR,
    MODULE_IDS.BOOKINGS,
    MODULE_IDS.CUSTOMERS,
    MODULE_IDS.EMPLOYEES,
    MODULE_IDS.SERVICES,
    MODULE_IDS.PAYMENTS,
    MODULE_IDS.REPORTS,
    MODULE_IDS.BRANCHES,
    MODULE_IDS.NOTIFICATIONS,
    MODULE_IDS.SUBSCRIPTIONS,
  ],

  features: {
    [FEATURE_IDS.BASIC_BOOKINGS]: true,
    [FEATURE_IDS.RECURRING_BOOKINGS]: true,
    [FEATURE_IDS.GROUP_BOOKINGS]: false,
    [FEATURE_IDS.WAITLIST]: true,
    [FEATURE_IDS.DEPOSITS]: true,
    [FEATURE_IDS.EXPORT_REPORTS]: true,
    [FEATURE_IDS.IMPORT_DATA]: false,
    [FEATURE_IDS.ADVANCED_REPORTS]: false,
    [FEATURE_IDS.WHATSAPP_REMINDERS]: false,
    [FEATURE_IDS.EMAIL_CAMPAIGNS]: true,
    [FEATURE_IDS.EMAIL_REMINDERS]: true,
    [FEATURE_IDS.SMS_NOTIFICATIONS]: true,
    [FEATURE_IDS.MULTIPLE_BRANCHES]: true,
    [FEATURE_IDS.EMPLOYEE_MANAGEMENT]: true,
    [FEATURE_IDS.RESOURCE_MANAGEMENT]: false,
    [FEATURE_IDS.COUPON_MANAGEMENT]: true,
    [FEATURE_IDS.INVOICE_MANAGEMENT]: true,
    [FEATURE_IDS.ROLE_MANAGEMENT]: false,
    [FEATURE_IDS.AUDIT_LOGS]: false,
    [FEATURE_IDS.API_ACCESS]: false,
    [FEATURE_IDS.CUSTOM_BRANDING]: false,
    [FEATURE_IDS.BACKUP_RESTORE]: false,
    [FEATURE_IDS.CALENDAR_SYNC]: false,
    [FEATURE_IDS.CUSTOM_DOMAIN]: false,
    [FEATURE_IDS.WHITE_LABEL]: false,
    [FEATURE_IDS.PRIORITY_SUPPORT]: false,
    [FEATURE_IDS.DEDICATED_MANAGER]: false,
    [FEATURE_IDS.CUSTOM_SLA]: false,
    [FEATURE_IDS.PRIVATE_DEPLOYMENT]: false,
  },

  limits: {
    maxCustomers: 1000,
    maxEmployees: 10,
    maxServices: 50,
    maxBookingsPerMonth: 1000,
    maxBranches: 3,
    maxUsers: 10,
    maxStorage: 2000,
    maxWhatsappMessages: 0,
    maxEmailMessages: 2000,
  },

  integrations: [
    INTEGRATION_IDS.EMAIL,
    INTEGRATION_IDS.SMS,
    INTEGRATION_IDS.PAYMENT_GATEWAY,
  ],

  permissions: {
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
    notifications: { view: true, create: true },
  },
}

// ─── Business Plan ─────────────────────────────────────────
const BUSINESS_PLAN: PlanDefinition = {
  slug: 'business',
  name: { ar: 'أعمال', en: 'Business' },
  description: {
    ar: 'للأعمال المتوسطة — WhatsApp وإدارة كاملة للموارد',
    en: 'For medium businesses — WhatsApp & full resource management',
  },
  price: 599,
  priceYearly: 5790,
  color: 'bg-indigo-500',
  popular: false,

  modules: [
    MODULE_IDS.DASHBOARD,
    MODULE_IDS.CALENDAR,
    MODULE_IDS.BOOKINGS,
    MODULE_IDS.CUSTOMERS,
    MODULE_IDS.EMPLOYEES,
    MODULE_IDS.SERVICES,
    MODULE_IDS.RESOURCES,
    MODULE_IDS.INVOICES,
    MODULE_IDS.PAYMENTS,
    MODULE_IDS.REPORTS,
    MODULE_IDS.BRANCHES,
    MODULE_IDS.COUPONS,
    MODULE_IDS.NOTIFICATIONS,
    MODULE_IDS.SUBSCRIPTIONS,
  ],

  features: {
    [FEATURE_IDS.BASIC_BOOKINGS]: true,
    [FEATURE_IDS.RECURRING_BOOKINGS]: true,
    [FEATURE_IDS.GROUP_BOOKINGS]: true,
    [FEATURE_IDS.WAITLIST]: true,
    [FEATURE_IDS.DEPOSITS]: true,
    [FEATURE_IDS.EXPORT_REPORTS]: true,
    [FEATURE_IDS.IMPORT_DATA]: true,
    [FEATURE_IDS.ADVANCED_REPORTS]: true,
    [FEATURE_IDS.WHATSAPP_REMINDERS]: true,
    [FEATURE_IDS.EMAIL_CAMPAIGNS]: true,
    [FEATURE_IDS.EMAIL_REMINDERS]: true,
    [FEATURE_IDS.SMS_NOTIFICATIONS]: true,
    [FEATURE_IDS.MULTIPLE_BRANCHES]: true,
    [FEATURE_IDS.EMPLOYEE_MANAGEMENT]: true,
    [FEATURE_IDS.RESOURCE_MANAGEMENT]: true,
    [FEATURE_IDS.COUPON_MANAGEMENT]: true,
    [FEATURE_IDS.INVOICE_MANAGEMENT]: true,
    [FEATURE_IDS.ROLE_MANAGEMENT]: true,
    [FEATURE_IDS.AUDIT_LOGS]: true,
    [FEATURE_IDS.API_ACCESS]: false,
    [FEATURE_IDS.CUSTOM_BRANDING]: false,
    [FEATURE_IDS.BACKUP_RESTORE]: true,
    [FEATURE_IDS.CALENDAR_SYNC]: true,
    [FEATURE_IDS.CUSTOM_DOMAIN]: false,
    [FEATURE_IDS.WHITE_LABEL]: false,
    [FEATURE_IDS.PRIORITY_SUPPORT]: false,
    [FEATURE_IDS.DEDICATED_MANAGER]: false,
    [FEATURE_IDS.CUSTOM_SLA]: false,
    [FEATURE_IDS.PRIVATE_DEPLOYMENT]: false,
  },

  limits: {
    maxCustomers: 5000,
    maxEmployees: 25,
    maxServices: 100,
    maxBookingsPerMonth: 5000,
    maxBranches: 10,
    maxUsers: 25,
    maxStorage: 10000,
    maxWhatsappMessages: 2000,
    maxEmailMessages: 5000,
  },

  integrations: [
    INTEGRATION_IDS.EMAIL,
    INTEGRATION_IDS.SMS,
    INTEGRATION_IDS.WHATSAPP,
    INTEGRATION_IDS.PAYMENT_GATEWAY,
    INTEGRATION_IDS.GOOGLE_CALENDAR,
    INTEGRATION_IDS.STRIPE,
    INTEGRATION_IDS.APPLE_PAY,
    INTEGRATION_IDS.MADA,
    INTEGRATION_IDS.STC_PAY,
  ],

  permissions: {
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
}

// ─── Enterprise Plan ───────────────────────────────────────
const ENTERPRISE_PLAN: PlanDefinition = {
  slug: 'enterprise',
  name: { ar: 'مؤسسي', en: 'Enterprise' },
  description: {
    ar: 'للمؤسسات الكبيرة — كل الميزات مع دعم مخصص',
    en: 'For large enterprises — all features with dedicated support',
  },
  price: 999,
  priceYearly: 9690,
  color: 'bg-emerald-500',
  popular: false,

  modules: [
    MODULE_IDS.DASHBOARD,
    MODULE_IDS.CALENDAR,
    MODULE_IDS.BOOKINGS,
    MODULE_IDS.CUSTOMERS,
    MODULE_IDS.EMPLOYEES,
    MODULE_IDS.SERVICES,
    MODULE_IDS.RESOURCES,
    MODULE_IDS.INVOICES,
    MODULE_IDS.PAYMENTS,
    MODULE_IDS.REPORTS,
    MODULE_IDS.BRANCHES,
    MODULE_IDS.COUPONS,
    MODULE_IDS.ROLES,
    MODULE_IDS.NOTIFICATIONS,
    MODULE_IDS.AUDIT_LOGS,
    MODULE_IDS.WHATSAPP,
    MODULE_IDS.SETTINGS,
    MODULE_IDS.SUBSCRIPTIONS,
  ],

  features: {
    [FEATURE_IDS.BASIC_BOOKINGS]: true,
    [FEATURE_IDS.RECURRING_BOOKINGS]: true,
    [FEATURE_IDS.GROUP_BOOKINGS]: true,
    [FEATURE_IDS.WAITLIST]: true,
    [FEATURE_IDS.DEPOSITS]: true,
    [FEATURE_IDS.EXPORT_REPORTS]: true,
    [FEATURE_IDS.IMPORT_DATA]: true,
    [FEATURE_IDS.ADVANCED_REPORTS]: true,
    [FEATURE_IDS.WHATSAPP_REMINDERS]: true,
    [FEATURE_IDS.EMAIL_CAMPAIGNS]: true,
    [FEATURE_IDS.EMAIL_REMINDERS]: true,
    [FEATURE_IDS.SMS_NOTIFICATIONS]: true,
    [FEATURE_IDS.MULTIPLE_BRANCHES]: true,
    [FEATURE_IDS.EMPLOYEE_MANAGEMENT]: true,
    [FEATURE_IDS.RESOURCE_MANAGEMENT]: true,
    [FEATURE_IDS.COUPON_MANAGEMENT]: true,
    [FEATURE_IDS.INVOICE_MANAGEMENT]: true,
    [FEATURE_IDS.ROLE_MANAGEMENT]: true,
    [FEATURE_IDS.AUDIT_LOGS]: true,
    [FEATURE_IDS.API_ACCESS]: true,
    [FEATURE_IDS.CUSTOM_BRANDING]: true,
    [FEATURE_IDS.BACKUP_RESTORE]: true,
    [FEATURE_IDS.CALENDAR_SYNC]: true,
    [FEATURE_IDS.CUSTOM_DOMAIN]: true,
    [FEATURE_IDS.WHITE_LABEL]: true,
    [FEATURE_IDS.PRIORITY_SUPPORT]: true,
    [FEATURE_IDS.DEDICATED_MANAGER]: true,
    [FEATURE_IDS.CUSTOM_SLA]: true,
    [FEATURE_IDS.PRIVATE_DEPLOYMENT]: false,
  },

  limits: {
    maxCustomers: -1, // unlimited
    maxEmployees: -1,
    maxServices: -1,
    maxBookingsPerMonth: -1,
    maxBranches: -1,
    maxUsers: -1,
    maxStorage: -1,
    maxWhatsappMessages: -1,
    maxEmailMessages: -1,
  },

  integrations: [
    INTEGRATION_IDS.EMAIL,
    INTEGRATION_IDS.SMS,
    INTEGRATION_IDS.WHATSAPP,
    INTEGRATION_IDS.PAYMENT_GATEWAY,
    INTEGRATION_IDS.GOOGLE_CALENDAR,
    INTEGRATION_IDS.STRIPE,
    INTEGRATION_IDS.APPLE_PAY,
    INTEGRATION_IDS.MADA,
    INTEGRATION_IDS.STC_PAY,
  ],

  permissions: {
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

// ─── Plan Registry ─────────────────────────────────────────
export const PLANS: Record<string, PlanDefinition> = {
  free: FREE_PLAN,
  starter: STARTER_PLAN,
  professional: PROFESSIONAL_PLAN,
  business: BUSINESS_PLAN,
  enterprise: ENTERPRISE_PLAN,
}

export const PLAN_SLUGS = Object.keys(PLANS) as string[]

// ─── Helpers ───────────────────────────────────────────────

/** Get a plan by slug. Returns null for unknown slugs. */
export function getPlan(slug: string): PlanDefinition | null {
  return PLANS[slug] ?? null
}

/** Check if a plan includes a specific module (page). */
export function planHasModule(slug: string, moduleId: ModuleId): boolean {
  const plan = PLANS[slug]
  return plan ? plan.modules.includes(moduleId) : false
}

/** Check if a plan includes a specific feature. */
export function planHasFeature(slug: string, featureId: FeatureId): boolean {
  const plan = PLANS[slug]
  return plan ? (plan.features[featureId] ?? false) : false
}

/** Check if a plan includes a specific integration. */
export function planHasIntegration(slug: string, integrationId: IntegrationId): boolean {
  const plan = PLANS[slug]
  return plan ? plan.integrations.includes(integrationId) : false
}

/** Get the limits for a plan. */
export function getPlanLimits(slug: string): PlanLimits {
  const plan = PLANS[slug]
  return plan ? plan.limits : DEFAULT_LIMITS
}

/** Get the RBAC permissions for a plan. */
export function getPlanPermissions(slug: string): Record<string, Record<string, boolean>> {
  const plan = PLANS[slug]
  return plan ? plan.permissions : {}
}

/** Check if a plan has a specific permission. */
export function planHasPermission(
  slug: string,
  resource: string,
  action: string
): boolean {
  const perms = getPlanPermissions(slug)
  return perms[resource]?.[action] ?? false
}

/** Get ordered plans (lowest to highest tier). */
export function getOrderedPlans(): PlanDefinition[] {
  return PLAN_SLUGS.map((s) => PLANS[s])
}

/** Check if target plan is an upgrade from source plan. */
export function isUpgrade(fromSlug: string, toSlug: string): boolean {
  const order = PLAN_SLUGS
  const fromIdx = order.indexOf(fromSlug)
  const toIdx = order.indexOf(toSlug)
  return toIdx > fromIdx
}

/** Get the next plan tier, or null if already at max. */
export function getNextPlan(slug: string): PlanDefinition | null {
  const order = PLAN_SLUGS
  const idx = order.indexOf(slug)
  if (idx < 0 || idx >= order.length - 1) return null
  return PLANS[order[idx + 1]]
}

/** Feature display labels (bilingual) */
export const FEATURE_LABELS: Record<FeatureId, Bilingual> = {
  [FEATURE_IDS.BASIC_BOOKINGS]: { ar: 'حجوزات أساسية', en: 'Basic Bookings' },
  [FEATURE_IDS.RECURRING_BOOKINGS]: { ar: 'حجوزات متكررة', en: 'Recurring Bookings' },
  [FEATURE_IDS.GROUP_BOOKINGS]: { ar: 'حجوزات جماعية', en: 'Group Bookings' },
  [FEATURE_IDS.WAITLIST]: { ar: 'قائمة الانتظار', en: 'Waitlist' },
  [FEATURE_IDS.DEPOSITS]: { ar: 'الدفعات المسبقة', en: 'Deposits' },
  [FEATURE_IDS.EXPORT_REPORTS]: { ar: 'تصدير التقارير', en: 'Export Reports' },
  [FEATURE_IDS.IMPORT_DATA]: { ar: 'استيراد البيانات', en: 'Import Data' },
  [FEATURE_IDS.ADVANCED_REPORTS]: { ar: 'تقارير متقدمة', en: 'Advanced Reports' },
  [FEATURE_IDS.WHATSAPP_REMINDERS]: { ar: 'تذكير واتساب', en: 'WhatsApp Reminders' },
  [FEATURE_IDS.EMAIL_CAMPAIGNS]: { ar: 'حملات بريدية', en: 'Email Campaigns' },
  [FEATURE_IDS.EMAIL_REMINDERS]: { ar: 'تذكير بالبريد', en: 'Email Reminders' },
  [FEATURE_IDS.SMS_NOTIFICATIONS]: { ar: 'إشعارات SMS', en: 'SMS Notifications' },
  [FEATURE_IDS.MULTIPLE_BRANCHES]: { ar: 'فروع متعددة', en: 'Multiple Branches' },
  [FEATURE_IDS.EMPLOYEE_MANAGEMENT]: { ar: 'إدارة الموظفين', en: 'Employee Management' },
  [FEATURE_IDS.RESOURCE_MANAGEMENT]: { ar: 'إدارة الموارد', en: 'Resource Management' },
  [FEATURE_IDS.COUPON_MANAGEMENT]: { ar: 'إدارة الكوبونات', en: 'Coupon Management' },
  [FEATURE_IDS.INVOICE_MANAGEMENT]: { ar: 'إدارة الفواتير', en: 'Invoice Management' },
  [FEATURE_IDS.ROLE_MANAGEMENT]: { ar: 'إدارة الأدوار', en: 'Role Management' },
  [FEATURE_IDS.AUDIT_LOGS]: { ar: 'سجل العمليات', en: 'Audit Logs' },
  [FEATURE_IDS.API_ACCESS]: { ar: 'API وصول', en: 'API Access' },
  [FEATURE_IDS.CUSTOM_BRANDING]: { ar: 'تخصيص العلامة', en: 'Custom Branding' },
  [FEATURE_IDS.BACKUP_RESTORE]: { ar: 'نسخ احتياطي', en: 'Backup & Restore' },
  [FEATURE_IDS.CALENDAR_SYNC]: { ar: 'مزامنة التقويم', en: 'Calendar Sync' },
  [FEATURE_IDS.CUSTOM_DOMAIN]: { ar: 'نطاق مخصص', en: 'Custom Domain' },
  [FEATURE_IDS.WHITE_LABEL]: { ar: 'علامة بيضاء', en: 'White Label' },
  [FEATURE_IDS.PRIORITY_SUPPORT]: { ar: 'دعم أولوي', en: 'Priority Support' },
  [FEATURE_IDS.DEDICATED_MANAGER]: { ar: 'مدير مخصص', en: 'Dedicated Manager' },
  [FEATURE_IDS.CUSTOM_SLA]: { ar: 'SLA مخصص', en: 'Custom SLA' },
  [FEATURE_IDS.PRIVATE_DEPLOYMENT]: { ar: 'نشر خاص', en: 'Private Deployment' },
}

/** Limit display labels (bilingual) */
export const LIMIT_LABELS: Record<keyof PlanLimits, Bilingual> = {
  maxCustomers: { ar: 'العملاء', en: 'Customers' },
  maxEmployees: { ar: 'الموظفين', en: 'Employees' },
  maxServices: { ar: 'الخدمات', en: 'Services' },
  maxBookingsPerMonth: { ar: 'الحجوزات / شهر', en: 'Bookings / month' },
  maxBranches: { ar: 'الفروع', en: 'Branches' },
  maxUsers: { ar: 'المستخدمين', en: 'Users' },
  maxStorage: { ar: 'التخزين (MB)', en: 'Storage (MB)' },
  maxWhatsappMessages: { ar: 'رسائل واتساب / شهر', en: 'WhatsApp msgs / mo' },
  maxEmailMessages: { ar: 'رسائل بريد / شهر', en: 'Email msgs / mo' },
}