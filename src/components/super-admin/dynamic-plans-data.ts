// ─── Dynamic Plan Feature/Limit/Quota System ─────────────────

export interface PlanLimit {
  id: string
  key: string
  labelAr: string
  labelEn: string
  value: number | boolean
  unit?: string
  icon: string
  category: 'bookings' | 'users' | 'storage' | 'api' | 'ai' | 'branches' | 'roles' | 'reports' | 'integrations' | 'support' | 'branding'
}

export interface DynamicPlan {
  id: string
  name: string
  price: number
  color: string
  popular: boolean
  currency: string
  features: { ar: string; en: string }[]
  limits: PlanLimit[]
}

// ─── Limit Definitions ──────────────────────────────────────────
export function generateDefaultLimits(price: number, planName: string): PlanLimit[] {
  const isFree = price === 0
  const isStarter = planName === 'Starter'
  const isPro = planName === 'Professional'
  const isBiz = planName === 'Business'
  const isEnt = planName === 'Enterprise'

  return [
    // Bookings
    { id: 'bookings_monthly', key: 'bookings_monthly', labelAr: 'حجوزات شهرياً', labelEn: 'Monthly Bookings', value: isFree ? 10 : isStarter ? 50 : isPro ? 999999 : isBiz ? 999999 : 999999, unit: '', icon: 'CalendarDays', category: 'bookings' },
    { id: 'bookings_advance', key: 'bookings_advance', labelAr: 'حجز مسبق', labelEn: 'Advance Booking', value: isPro || isBiz || isEnt, icon: 'Clock', category: 'bookings' },

    // Users
    { id: 'users_max', key: 'users_max', labelAr: 'عدد الموظفين', labelEn: 'Max Employees', value: isFree ? 1 : isStarter ? 3 : isPro ? 10 : isBiz ? 25 : 999, unit: '', icon: 'Users', category: 'users' },
    { id: 'users_branch_managers', key: 'users_branch_managers', labelAr: 'مدراء الفروع', labelEn: 'Branch Managers', value: isFree ? 0 : isStarter ? 1 : isPro ? 3 : isBiz ? 10 : 999, unit: '', icon: 'UserCog', category: 'users' },
    { id: 'users_receptionists', key: 'users_receptionists', labelAr: 'موظفي الاستقبال', labelEn: 'Receptionists', value: isFree ? 1 : isStarter ? 2 : isPro ? 10 : isBiz ? 25 : 999, unit: '', icon: 'Users', category: 'users' },

    // Branches
    { id: 'branches_max', key: 'branches_max', labelAr: 'عدد الفروع', labelEn: 'Max Branches', value: isFree ? 1 : isStarter ? 1 : isPro ? 5 : isBiz ? 15 : 999, unit: '', icon: 'Building2', category: 'branches' },

    // Storage
    { id: 'storage_gb', key: 'storage_gb', labelAr: 'التخزين', labelEn: 'Storage', value: isFree ? 1 : isStarter ? 5 : isPro ? 20 : isBiz ? 50 : 100, unit: 'GB', icon: 'HardDrive', category: 'storage' },
    { id: 'storage_attachments', key: 'storage_attachments', labelAr: 'مرفقات الحجوزات', labelEn: 'Booking Attachments', value: isFree ? false : isStarter ? false : isPro ? true : true, icon: 'FileText', category: 'storage' },

    // API
    { id: 'api_calls', key: 'api_calls', labelAr: 'استدعاءات API شهرياً', labelEn: 'API Calls/mo', value: isFree ? 100 : isStarter ? 1000 : isPro ? 10000 : isBiz ? 50000 : 999999, unit: '', icon: 'Globe', category: 'api' },
    { id: 'api_webhooks', key: 'api_webhooks', labelAr: 'Webhooks', labelEn: 'Webhooks', value: isFree ? false : isStarter ? false : isPro ? true : true, icon: 'Zap', category: 'api' },
    { id: 'api_access', key: 'api_access', labelAr: 'وصول API', labelEn: 'API Access', value: isFree ? false : isStarter ? false : isPro ? true : true, icon: 'Globe', category: 'api' },

    // AI
    { id: 'ai_credits', key: 'ai_credits', labelAr: 'أرصدة AI', labelEn: 'AI Credits/mo', value: isFree ? 0 : isStarter ? 50 : isPro ? 500 : isBiz ? 2000 : 99999, unit: '', icon: 'Sparkles', category: 'ai' },
    { id: 'ai_smart_scheduling', key: 'ai_smart_scheduling', labelAr: 'جدولة ذكية', labelEn: 'Smart Scheduling', value: isFree ? false : isPro || isBiz || isEnt, icon: 'Sparkles', category: 'ai' },
    { id: 'ai_suggestions', key: 'ai_suggestions', labelAr: 'اقتراحات AI', labelEn: 'AI Suggestions', value: isFree ? false : isPro || isBiz || isEnt, icon: 'Sparkles', category: 'ai' },

    // Roles
    { id: 'roles_custom', key: 'roles_custom', labelAr: 'أدوار مخصصة', labelEn: 'Custom Roles', value: isFree ? false : isStarter ? false : isPro ? true : true, icon: 'Shield', category: 'roles' },
    { id: 'roles_max', key: 'roles_max', labelAr: 'عدد الأدوار', labelEn: 'Max Roles', value: isFree ? 2 : isStarter ? 3 : isPro ? 10 : isBiz ? 25 : 999, unit: '', icon: 'Shield', category: 'roles' },

    // Reports
    { id: 'reports_basic', key: 'reports_basic', labelAr: 'تقارير أساسية', labelEn: 'Basic Reports', value: isFree ? true : true, icon: 'BarChart3', category: 'reports' },
    { id: 'reports_advanced', key: 'reports_advanced', labelAr: 'تقارير متقدمة', labelEn: 'Advanced Reports', value: isFree ? false : isStarter ? false : isPro ? true : true, icon: 'BarChart3', category: 'reports' },
    { id: 'reports_export', key: 'reports_export', labelAr: 'تصدير التقارير', labelEn: 'Report Export', value: isFree ? false : isStarter ? false : isPro ? true : true, icon: 'Download', category: 'reports' },
    { id: 'reports_custom', key: 'reports_custom', labelAr: 'تقارير مخصصة', labelEn: 'Custom Reports', value: isFree ? false : false : isPro ? false : isBiz || isEnt, icon: 'BarChart3', category: 'reports' },

    // Integrations
    { id: 'integrations_cliq', key: 'integrations_cliq', labelAr: 'CLIQ', labelEn: 'CLIQ Payment', value: true, icon: 'Wallet', category: 'integrations' },
    { id: 'integrations_sms', key: 'integrations_sms', labelAr: 'رسائل SMS', labelEn: 'SMS', value: isFree ? false : isStarter ? false : isPro || isBiz || isEnt, icon: 'Mail', category: 'integrations' },
    { id: 'integrations_whatsapp', key: 'integrations_whatsapp', labelAr: 'واتساب', labelEn: 'WhatsApp', value: isFree ? false : false : isPro ? false : isBiz || isEnt, icon: 'Bell', category: 'integrations' },
    { id: 'integrations_custom', key: 'integrations_custom', labelAr: 'تكاملات مخصصة', labelEn: 'Custom Integrations', value: isFree ? false : false : isPro ? false : isEnt, icon: 'Zap', category: 'integrations' },

    // Support
    { id: 'support_email', key: 'support_email', labelAr: 'دعم بالبريد', labelEn: 'Email Support', value: true, icon: 'Mail', category: 'support' },
    { id: 'support_chat', key: 'support_chat', labelAr: 'دعم مباشر', labelEn: 'Live Chat', value: isFree ? false : isPro || isBiz || isEnt, icon: 'Bell', category: 'support' },
    { id: 'support_priority', key: 'support_priority', labelAr: 'دعم ذو أولوية', labelEn: 'Priority Support', value: isFree ? false : false : isBiz || isEnt, icon: 'Zap', category: 'support' },
    { id: 'support_dedicated', key: 'support_dedicated', labelAr: 'مدير مخصص', labelEn: 'Dedicated Manager', value: isEnt, icon: 'UserCog', category: 'support' },

    // Branding
    { id: 'branding_custom', key: 'branding_custom', labelAr: 'تخصيص العلامة', labelEn: 'Custom Branding', value: isFree ? false : isStarter ? false : isPro || isBiz || isEnt, icon: 'Palette', category: 'branding' },
    { id: 'branding_domain', key: 'branding_domain', labelAr: 'نطاق مخصص', labelEn: 'Custom Domain', value: isFree ? false : false : isBiz || isEnt, icon: 'Globe', category: 'branding' },
    { id: 'branding_white_label', key: 'branding_white_label', labelAr: 'علامة بيضاء', labelEn: 'White Label', value: isEnt, icon: 'Layers', category: 'branding' },
  ]
}

// ─── Feature descriptions for display ────────────────────────────
export const LIMIT_CATEGORIES = [
  { key: 'bookings', labelAr: 'الحجوزات', labelEn: 'Bookings', color: 'text-sky-600 bg-sky-50 dark:bg-sky-950/30' },
  { key: 'users', labelAr: 'المستخدمين', labelEn: 'Users', color: 'text-violet-600 bg-violet-50 dark:bg-violet-950/30' },
  { key: 'branches', labelAr: 'الفروع', labelEn: 'Branches', color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/30' },
  { key: 'storage', labelAr: 'التخزين', labelEn: 'Storage', color: 'text-orange-600 bg-orange-50 dark:bg-orange-950/30' },
  { key: 'api', labelAr: 'API', labelEn: 'API', color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/30' },
  { key: 'ai', labelAr: 'الذكاء الاصطناعي', labelEn: 'AI', color: 'text-pink-600 bg-pink-50 dark:bg-pink-950/30' },
  { key: 'roles', labelAr: 'الأدوار', labelEn: 'Roles', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30' },
  { key: 'reports', labelAr: 'التقارير', labelEn: 'Reports', color: 'text-cyan-600 bg-cyan-50 dark:bg-cyan-950/30' },
  { key: 'integrations', labelAr: 'التكاملات', labelEn: 'Integrations', color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/30' },
  { key: 'support', labelAr: 'الدعم', labelEn: 'Support', color: 'text-teal-600 bg-teal-50 dark:bg-teal-950/30' },
  { key: 'branding', labelAr: 'العلامة التجارية', labelEn: 'Branding', color: 'text-fuchsia-600 bg-fuchsia-50 dark:bg-fuchsia-950/30' },
]

// ─── Build dynamic plans from base data ─────────────────────────
import { PLANS } from './sa-data'

export function buildDynamicPlans(): DynamicPlan[] {
  return PLANS.map(p => ({
    id: p.id,
    name: p.name,
    price: p.price,
    color: p.color,
    popular: p.popular,
    currency: p.currency,
    features: p.features,
    limits: generateDefaultLimits(p.price, p.name),
  }))
}

// ─── Sync tenant permissions when plan changes ─────────────────
export function getTenantPermissionsForPlan(planName: string, allPlans: DynamicPlan[]): Record<string, boolean> {
  const plan = allPlans.find(p => p.name === planName)
  if (!plan) return {}
  const perms: Record<string, boolean> = {}
  plan.limits.forEach(l => {
    perms[l.key] = !!l.value
  })
  return perms
}