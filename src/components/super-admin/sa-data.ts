// ─── Currency ────────────────────────────────────────────────────
export const DEFAULT_CURRENCY = 'JOD'
export const CURRENCY_SYMBOLS: Record<string, { ar: string; en: string }> = {
  JOD: { ar: 'د.أ', en: 'JOD' },
  SAR: { ar: 'ر.س', en: 'SAR' },
  AED: { ar: 'د.إ', en: 'AED' },
  USD: { ar: '$', en: 'USD' },
  EGP: { ar: 'ج.م', en: 'EGP' },
}

export function currencyLabel(locale: string, currency?: string): string {
  const c = currency || DEFAULT_CURRENCY
  const sym = CURRENCY_SYMBOLS[c] || CURRENCY_SYMBOLS.JOD
  return locale === 'en' ? sym.en : sym.ar
}

// ─── Types ───────────────────────────────────────────────────────
export interface Tenant {
  id: string
  name: string
  nameEn: string
  plan: string
  bookings: number
  revenue: number
  users: number
  status: string
  createdAt: string
  country: string
  email: string
  subscriptionStatus: string
  subscriptionEndDate: string
}

export interface PlatformUser {
  id: string
  name: string
  email: string
  tenant: string
  tenantEn: string
  role: string
  status: string
  lastLogin: string
}

export interface SysLog {
  id: string
  level: string
  source: string
  sourceEn: string
  message: string
  messageEn: string
  timestamp: string
}

export interface InvoiceHistoryItem {
  date: string
  action: string
  actionEn: string
  details: string
  detailsEn: string
  by: string
}

export interface Invoice {
  id: string
  tenant: string
  tenantEn: string
  amount: number
  status: string
  date: string
  dueDate: string
  paidDate: string | null
  plan: string
  currency: string
  taxRate: number
  notes: string
  paymentMethod: string
  history: InvoiceHistoryItem[]
}

export interface Role {
  id: string
  name: string
  nameEn: string
  users: number
  permissions: number
  description: string
  descriptionEn: string
  // RBAC fields
  isSystem?: boolean
  parentId?: string | null
  rbacPermissions?: Record<string, string[]>
}

export interface Plan {
  id: string
  name: string
  price: number
  tenants: number
  features: { ar: string; en: string }[]
  color: string
  popular: boolean
  currency: string
}

export interface Server {
  id: string
  name: string
  region: string
  regionEn: string
  status: string
  cpu: number
  memory: number
  disk: number
  uptime: string
  requests: string
}

export interface Backup {
  id: string
  date: string
  size: string
  type: string
  status: string
}

export interface SecurityAttempt {
  ip: string
  time: string
  status: string
  country: string
  countryEn: string
}

export interface NotificationTemplate {
  id: string
  name: string
  nameEn: string
  type: string
  typeEn: string
  status: string
  sent: number
}

export interface Report {
  id: string
  name: string
  nameEn: string
  desc: string
  descEn: string
  type: string
  typeEn: string
  last: string
}

export interface CliqConfig {
  enabled: boolean
  bankName: string
  accountHolder: string
  cliqAlias: string
  instructions: string
  instructionsEn: string
  qrCodeUrl: string | null
  supportContact: string
}

export interface CliqPayment {
  id: string
  tenantName: string
  tenantNameEn: string
  customerName: string
  customerEmail: string
  plan: string
  amount: number
  currency: string
  referenceNumber: string
  notes: string
  screenshotUrl: string | null
  status: 'pending_verification' | 'approved' | 'rejected' | 'info_requested'
  submittedAt: string
  reviewedAt: string | null
  reviewedBy: string | null
  rejectionReason: string | null
  additionalInfoRequest: string | null
}

export type SortDir = 'asc' | 'desc'
export interface SortState { key: string; dir: SortDir }

// ─── Mock Data (bilingual, JOD currency) ─────────────────────────
export const INIT_TENANTS: Tenant[] = [
  { id: '1', name: 'مركز النور الطبي', nameEn: 'Al Noor Medical', plan: 'Enterprise', bookings: 1250, revenue: 37500, users: 12, status: 'active', createdAt: '2025-01-15', country: 'السعودية', email: 'info@alnoor.sa', subscriptionStatus: 'active', subscriptionEndDate: '2026-01-15' },
  { id: '2', name: 'صالون ياسمين', nameEn: 'Yasmin Beauty', plan: 'Professional', bookings: 680, revenue: 10840, users: 8, status: 'active', createdAt: '2025-02-20', country: 'السعودية', email: 'info@yasmin.sa', subscriptionStatus: 'active', subscriptionEndDate: '2025-08-20' },
  { id: '3', name: 'أكاديمية المستقبل', nameEn: 'Future Academy', plan: 'Professional', bookings: 420, revenue: 7600, users: 6, status: 'active', createdAt: '2025-03-10', country: 'الإمارات', email: 'info@future-edu.ae', subscriptionStatus: 'active', subscriptionEndDate: '2025-09-10' },
  { id: '4', name: 'عيادة الابتسامة', nameEn: 'Smile Clinic', plan: 'Starter', bookings: 45, revenue: 0, users: 2, status: 'trial', createdAt: '2025-06-01', country: 'مصر', email: 'info@smile.eg', subscriptionStatus: 'trial', subscriptionEndDate: '2025-07-01' },
  { id: '5', name: 'نادي اللياقة الذهبية', nameEn: 'Golden Fitness', plan: 'Professional', bookings: 310, revenue: 4400, users: 5, status: 'suspended', createdAt: '2025-01-28', country: 'الأردن', email: 'info@goldenfit.jo', subscriptionStatus: 'expired', subscriptionEndDate: '2025-04-28' },
  { id: '6', name: 'مركز التجميل الملكي', nameEn: 'Royal Beauty', plan: 'Enterprise', bookings: 920, revenue: 29000, users: 15, status: 'active', createdAt: '2025-02-01', country: 'السعودية', email: 'info@royalbeauty.sa', subscriptionStatus: 'active', subscriptionEndDate: '2026-02-01' },
  { id: '7', name: 'عيادة العيون المتقدمة', nameEn: 'Advanced Eye Clinic', plan: 'Business', bookings: 580, revenue: 14400, users: 10, status: 'active', createdAt: '2025-01-20', country: 'السعودية', email: 'info@adv-eye.sa', subscriptionStatus: 'active', subscriptionEndDate: '2025-07-20' },
  { id: '8', name: 'مركز اللياقة البدنية', nameEn: 'Fit Life Center', plan: 'Starter', bookings: 120, revenue: 1198, users: 3, status: 'active', createdAt: '2025-04-15', country: 'الإمارات', email: 'info@fitlife.ae', subscriptionStatus: 'active', subscriptionEndDate: '2025-10-15' },
]

export const INIT_USERS: PlatformUser[] = [
  { id: '1', name: 'أحمد المنصور', email: 'ahmed@alnoor.sa', tenant: 'مركز النور الطبي', tenantEn: 'Al Noor Medical', role: 'owner', status: 'active', lastLogin: '2025-06-18T14:00:00Z' },
  { id: '2', name: 'سارة العتيبي', email: 'sara@yasmin.sa', tenant: 'صالون ياسمين', tenantEn: 'Yasmin Beauty', role: 'manager', status: 'active', lastLogin: '2025-06-18T12:30:00Z' },
  { id: '3', name: 'محمد القحطاني', email: 'mohammed@royalbeauty.sa', tenant: 'مركز التجميل الملكي', tenantEn: 'Royal Beauty', role: 'owner', status: 'suspended', lastLogin: '2025-06-17T09:00:00Z' },
  { id: '4', name: 'فاطمة الحربي', email: 'fatima@alnoor.sa', tenant: 'مركز النور الطبي', tenantEn: 'Al Noor Medical', role: 'receptionist', status: 'active', lastLogin: '2025-06-18T10:30:00Z' },
  { id: '5', name: 'خالد الدوسري', email: 'khaled@future-edu.sa', tenant: 'أكاديمية المستقبل', tenantEn: 'Future Academy', role: 'owner', status: 'active', lastLogin: '2025-06-17T16:00:00Z' },
  { id: '6', name: 'نورة القحطاني', email: 'noura@royalbeauty.sa', tenant: 'مركز التجميل الملكي', tenantEn: 'Royal Beauty', role: 'manager', status: 'active', lastLogin: '2025-06-18T09:15:00Z' },
  { id: '7', name: 'عبدالله الشمري', email: 'abdullah@adv-eye.sa', tenant: 'عيادة العيون المتقدمة', tenantEn: 'Advanced Eye Clinic', role: 'owner', status: 'active', lastLogin: '2025-06-18T11:20:00Z' },
  { id: '8', name: 'ريم السبيعي', email: 'reem@smile-clinic.com', tenant: 'عيادة الابتسامة', tenantEn: 'Smile Clinic', role: 'owner', status: 'active', lastLogin: '2025-06-16T15:00:00Z' },
]

export const INIT_LOGS: SysLog[] = [
  { id: '1', level: 'success', source: 'الدفع', sourceEn: 'Payments', message: 'دفعة ناجحة: 250 د.أ — Enterprise — مركز النور الطبي', messageEn: 'Successful payment: 250 JOD — Enterprise — Al Noor Medical', timestamp: '2025-06-18T14:15:00Z' },
  { id: '2', level: 'info', source: 'المستأجرين', sourceEn: 'Tenants', message: 'تسجيل مستأجر جديد: عيادة الابتسامة (Trial)', messageEn: 'New tenant registered: Smile Clinic (Trial)', timestamp: '2025-06-18T14:10:00Z' },
  { id: '3', level: 'warn', source: 'النظام', sourceEn: 'System', message: 'استخدام الذاكرة تجاوز 80% على الخادم #3', messageEn: 'Memory usage exceeded 80% on Server #3', timestamp: '2025-06-18T13:55:00Z' },
  { id: '4', level: 'info', source: 'المستخدمين', sourceEn: 'Users', message: 'ترقية خطة صالون ياسمين من Starter إلى Professional', messageEn: 'Upgraded Yasmin Beauty plan from Starter to Professional', timestamp: '2025-06-18T13:45:00Z' },
  { id: '5', level: 'error', source: 'الدفع', sourceEn: 'Payments', message: 'فشل عملية دفع: بطاقة مسربة — نادي اللياقة الذهبية', messageEn: 'Payment failed: declined card — Golden Fitness', timestamp: '2025-06-18T12:30:00Z' },
  { id: '6', level: 'success', source: 'النظام', sourceEn: 'System', message: 'اكتمل النسخ الاحتياطي اليومي بنجاح (2.4 GB)', messageEn: 'Daily backup completed successfully (2.4 GB)', timestamp: '2025-06-18T06:00:00Z' },
  { id: '7', level: 'info', source: 'الأمان', sourceEn: 'Security', message: 'تعليق حساب محمد العتيبي — 3 محاولات فاشلة', messageEn: 'Suspended Mohammed Al-Otaibi account — 3 failed attempts', timestamp: '2025-06-18T11:00:00Z' },
  { id: '8', level: 'warn', source: 'النظام', sourceEn: 'System', message: 'القرص على الخادم #2 عند 85%', messageEn: 'Disk on Server #2 at 85%', timestamp: '2025-06-18T10:20:00Z' },
  { id: '9', level: 'info', source: 'المستأجرين', sourceEn: 'Tenants', message: 'تم تفعيل حساب نادي اللياقة الذهبية', messageEn: 'Golden Fitness account activated', timestamp: '2025-06-18T09:00:00Z' },
  { id: '10', level: 'error', source: 'API', sourceEn: 'API', message: 'خطأ 500 على /api/bookings — مهلة الطلب', messageEn: 'Error 500 on /api/bookings — request timeout', timestamp: '2025-06-18T08:30:00Z' },
  { id: '11', level: 'success', source: 'الدفع', sourceEn: 'Payments', message: 'دفعة ناجحة: 150 د.أ — Business — عيادة العيون المتقدمة', messageEn: 'Successful payment: 150 JOD — Business — Advanced Eye Clinic', timestamp: '2025-06-18T07:45:00Z' },
  { id: '12', level: 'info', source: 'النظام', sourceEn: 'System', message: 'تحديث النظام إلى الإصدار 2.4.1', messageEn: 'System updated to version 2.4.1', timestamp: '2025-06-18T03:00:00Z' },
  { id: '13', level: 'info', source: 'CLIQ', sourceEn: 'CLIQ', message: 'طلب دفع CLIQ جديد من مركز اللياقة البدنية — Professional', messageEn: 'New CLIQ payment request from Fit Life Center — Professional', timestamp: '2025-06-18T15:30:00Z' },
  { id: '14', level: 'success', source: 'CLIQ', sourceEn: 'CLIQ', message: 'تم قبول دفع CLIQ لعيادة الابتسامة — Starter', messageEn: 'CLIQ payment approved for Smile Clinic — Starter', timestamp: '2025-06-18T16:00:00Z' },
]

export const PLANS: Plan[] = [
  { id: '1', name: 'Free', price: 0, tenants: 0, features: [{ ar: 'حجز واحد', en: '1 Booking' }, { ar: 'تقويم أساسي', en: 'Basic Calendar' }, { ar: 'دعم بالبريد', en: 'Email Support' }], color: 'bg-gray-500', popular: false, currency: 'JOD' },
  { id: '2', name: 'Starter', price: 25, tenants: 15, features: [{ ar: '50 حجز/شهر', en: '50 Bookings/mo' }, { ar: '3 موظفين', en: '3 Employees' }, { ar: 'تقارير أساسية', en: 'Basic Reports' }, { ar: 'دعم بالبريد', en: 'Email Support' }], color: 'bg-sky-500', popular: false, currency: 'JOD' },
  { id: '3', name: 'Professional', price: 75, tenants: 120, features: [{ ar: 'حجوزات غير محدودة', en: 'Unlimited Bookings' }, { ar: '10 موظفين', en: '10 Employees' }, { ar: 'تقارير متقدمة', en: 'Advanced Reports' }, { ar: 'دعم على مدار الساعة', en: '24/7 Support' }], color: 'bg-violet-500', popular: true, currency: 'JOD' },
  { id: '4', name: 'Business', price: 150, tenants: 60, features: [{ ar: 'كل ميزات الاحترافي', en: 'All Pro Features' }, { ar: '25 موظف', en: '25 Employees' }, { ar: 'API وصول', en: 'API Access' }, { ar: 'مدير مخصص', en: 'Dedicated Manager' }], color: 'bg-indigo-500', popular: false, currency: 'JOD' },
  { id: '5', name: 'Enterprise', price: 250, tenants: 45, features: [{ ar: 'كل الميزات', en: 'All Features' }, { ar: 'موظفون غير محدودون', en: 'Unlimited Employees' }, { ar: 'SLA مخصص', en: 'Custom SLA' }, { ar: 'نشر خاص', en: 'Private Deployment' }], color: 'bg-emerald-500', popular: false, currency: 'JOD' },
]

export const INIT_ROLES: Role[] = [
  { id: '1', name: 'مدير النظام', nameEn: 'Super Admin', users: 1, permissions: 20, description: 'صلاحيات كاملة على المنصة', descriptionEn: 'Full platform access' },
  { id: '2', name: 'مالك المستأجر', nameEn: 'Tenant Owner', users: 8, permissions: 18, description: 'صلاحيات كاملة على المستأجر', descriptionEn: 'Full tenant access' },
  { id: '3', name: 'مدير الفرع', nameEn: 'Branch Manager', users: 15, permissions: 14, description: 'إدارة الفرع والموظفين', descriptionEn: 'Branch & employee management' },
  { id: '4', name: 'موظف استقبال', nameEn: 'Receptionist', users: 42, permissions: 8, description: 'إدارة الحجوزات والعملاء', descriptionEn: 'Booking & customer management' },
  { id: '5', name: 'محاسب', nameEn: 'Accountant', users: 6, permissions: 10, description: 'عرض التقارير والفواتير', descriptionEn: 'Reports & invoices access' },
]

export const SERVERS: Server[] = [
  { id: '1', name: 'API Server #1', region: 'الرياض', regionEn: 'Riyadh', status: 'healthy', cpu: 45, memory: 62, disk: 40, uptime: '99.98%', requests: '12.5K/min' },
  { id: '2', name: 'API Server #2', region: 'جدة', regionEn: 'Jeddah', status: 'healthy', cpu: 38, memory: 55, disk: 35, uptime: '99.95%', requests: '8.2K/min' },
  { id: '3', name: 'Worker Server', region: 'الرياض', regionEn: 'Riyadh', status: 'warning', cpu: 82, memory: 85, disk: 60, uptime: '99.80%', requests: '3.1K/min' },
  { id: '4', name: 'CDN Edge', region: 'دبي', regionEn: 'Dubai', status: 'healthy', cpu: 12, memory: 30, disk: 20, uptime: '100%', requests: '45K/min' },
]

export const INVOICES: Invoice[] = [
  { id: 'INV-001', tenant: 'مركز النور الطبي', tenantEn: 'Al Noor Medical', amount: 250, status: 'paid', date: '2025-06-01', dueDate: '2025-07-01', paidDate: '2025-06-03', plan: 'Enterprise', currency: 'JOD', taxRate: 16, notes: '', paymentMethod: 'cliq', history: [{ date: '2025-06-01T10:00:00Z', action: 'إنشاء الفاتورة', actionEn: 'Invoice created', details: 'تم إنشاء فاتورة اشتراك Enterprise', detailsEn: 'Enterprise subscription invoice created', by: 'System' }, { date: '2025-06-02T09:00:00Z', action: 'إرسال تذكير', actionEn: 'Reminder sent', details: 'تم إرسال تذكير بالبريد الإلكتروني', detailsEn: 'Email reminder sent', by: 'System' }, { date: '2025-06-03T14:30:00Z', action: 'دفعة ناجحة', actionEn: 'Payment received', details: 'تم الاستلام عبر CLIQ — TXN-2025-881234', detailsEn: 'Received via CLIQ — TXN-2025-881234', by: 'Super Admin' }] },
  { id: 'INV-002', tenant: 'صالون ياسمين', tenantEn: 'Yasmin Beauty', amount: 75, status: 'paid', date: '2025-06-01', dueDate: '2025-07-01', paidDate: '2025-06-05', plan: 'Professional', currency: 'JOD', taxRate: 16, notes: '', paymentMethod: 'card', history: [{ date: '2025-06-01T10:00:00Z', action: 'إنشاء الفاتورة', actionEn: 'Invoice created', details: 'تم إنشاء فاتورة اشتراك Professional', detailsEn: 'Professional subscription invoice created', by: 'System' }, { date: '2025-06-05T11:00:00Z', action: 'دفعة ناجحة', actionEn: 'Payment received', details: 'تم الاستلام عبر بطاقة ائتمان', detailsEn: 'Received via credit card', by: 'System' }] },
  { id: 'INV-003', tenant: 'أكاديمية المستقبل', tenantEn: 'Future Academy', amount: 75, status: 'pending', date: '2025-06-15', dueDate: '2025-07-15', paidDate: null, plan: 'Professional', currency: 'JOD', taxRate: 16, notes: '', paymentMethod: '', history: [{ date: '2025-06-15T10:00:00Z', action: 'إنشاء الفاتورة', actionEn: 'Invoice created', details: 'تم إنشاء فاتورة اشتراك Professional', detailsEn: 'Professional subscription invoice created', by: 'System' }] },
  { id: 'INV-004', tenant: 'عيادة العيون المتقدمة', tenantEn: 'Advanced Eye Clinic', amount: 150, status: 'paid', date: '2025-06-01', dueDate: '2025-07-01', paidDate: '2025-06-02', plan: 'Business', currency: 'JOD', taxRate: 16, notes: '', paymentMethod: 'bank_transfer', history: [{ date: '2025-06-01T10:00:00Z', action: 'إنشاء الفاتورة', actionEn: 'Invoice created', details: 'تم إنشاء فاتورة اشتراك Business', detailsEn: 'Business subscription invoice created', by: 'System' }, { date: '2025-06-02T16:00:00Z', action: 'دفعة ناجحة', actionEn: 'Payment received', details: 'تم الاستلام عبر تحويل بنكي', detailsEn: 'Received via bank transfer', by: 'Super Admin' }] },
  { id: 'INV-005', tenant: 'مركز التجميل الملكي', tenantEn: 'Royal Beauty', amount: 250, status: 'overdue', date: '2025-05-01', dueDate: '2025-06-01', paidDate: null, plan: 'Enterprise', currency: 'JOD', taxRate: 16, notes: 'تم إرسال 3 تذكيرات', paymentMethod: '', history: [{ date: '2025-05-01T10:00:00Z', action: 'إنشاء الفاتورة', actionEn: 'Invoice created', details: 'تم إنشاء فاتورة اشتراك Enterprise', detailsEn: 'Enterprise subscription invoice created', by: 'System' }, { date: '2025-05-15T09:00:00Z', action: 'إرسال تذكير', actionEn: 'Reminder sent', details: 'التذكير الأول', detailsEn: 'First reminder', by: 'System' }, { date: '2025-05-25T09:00:00Z', action: 'إرسال تذكير', actionEn: 'Reminder sent', details: 'التذكير الثاني', detailsEn: 'Second reminder', by: 'System' }, { date: '2025-06-01T00:00:00Z', action: 'تأخر', actionEn: 'Overdue', details: 'تجاوز تاريخ الاستحقاق', detailsEn: 'Due date passed', by: 'System' }, { date: '2025-06-10T09:00:00Z', action: 'إرسال تذكير', actionEn: 'Reminder sent', details: 'التذكير الثالث — إشعار تأخير', detailsEn: 'Third reminder — overdue notice', by: 'System' }] },
  { id: 'INV-006', tenant: 'نادي اللياقة الذهبية', tenantEn: 'Golden Fitness', amount: 75, status: 'failed', date: '2025-06-01', dueDate: '2025-07-01', paidDate: null, plan: 'Professional', currency: 'JOD', taxRate: 16, notes: 'بطاقة مسربة', paymentMethod: '', history: [{ date: '2025-06-01T10:00:00Z', action: 'إنشاء الفاتورة', actionEn: 'Invoice created', details: 'تم إنشاء فاتورة اشتراك Professional', detailsEn: 'Professional subscription invoice created', by: 'System' }, { date: '2025-06-01T12:30:00Z', action: 'فشل الدفع', actionEn: 'Payment failed', details: 'بطاقة مسربة — رفض البنك', detailsEn: 'Declined card — bank rejected', by: 'Payment Gateway' }] },
]

export const BACKUPS: Backup[] = [
  { id: '1', date: '2025-06-18 06:00', size: '2.4 GB', type: 'automatic', status: 'active' },
  { id: '2', date: '2025-06-17 06:00', size: '2.3 GB', type: 'automatic', status: 'active' },
  { id: '3', date: '2025-06-16 18:30', size: '2.3 GB', type: 'manual', status: 'active' },
  { id: '4', date: '2025-06-16 06:00', size: '2.2 GB', type: 'automatic', status: 'suspended' },
]

export const SECURITY_ATTEMPTS: SecurityAttempt[] = [
  { ip: '192.168.1.55', time: '2025-06-18 23:00', status: 'suspended', country: 'مجهول', countryEn: 'Unknown' },
  { ip: '10.0.0.12', time: '2025-06-18 20:15', status: 'suspended', country: 'مجهول', countryEn: 'Unknown' },
  { ip: '172.16.0.8', time: '2025-06-18 15:30', status: 'active', country: 'السعودية', countryEn: 'Saudi Arabia' },
]

export const NOTIF_TEMPLATES: NotificationTemplate[] = [
  { id: '1', name: 'ترحيب مستأجر جديد', nameEn: 'New Tenant Welcome', type: 'بريد إلكتروني', typeEn: 'Email', status: 'active', sent: 156 },
  { id: '2', name: 'تذكير بالدفع', nameEn: 'Payment Reminder', type: 'بريد + SMS', typeEn: 'Email + SMS', status: 'active', sent: 89 },
  { id: '3', name: 'إشعار تعليق الحساب', nameEn: 'Account Suspension', type: 'بريد إلكتروني', typeEn: 'Email', status: 'active', sent: 12 },
  { id: '4', name: 'تقرير أسبوعي', nameEn: 'Weekly Report', type: 'بريد إلكتروني', typeEn: 'Email', status: 'inactive', sent: 0 },
]

export const REPORTS: Report[] = [
  { id: '1', name: 'تقرير الإيرادات الشهري', nameEn: 'Monthly Revenue Report', desc: 'ملخص شامل للإيرادات حسب المستأجر والباقة', descEn: 'Comprehensive revenue summary by tenant and plan', type: 'مالي', typeEn: 'Financial', last: '2025-06-18' },
  { id: '2', name: 'تقرير النمو', nameEn: 'Growth Report', desc: 'معدلات النمو في المستأجرين والحجوزات', descEn: 'Growth rates in tenants and bookings', type: 'تشغيلي', typeEn: 'Operational', last: '2025-06-17' },
  { id: '3', name: 'تقرير الأمان', nameEn: 'Security Report', desc: 'محاولات الدخول والتهديدات الأمنية', descEn: 'Login attempts and security threats', type: 'أمني', typeEn: 'Security', last: '2025-06-18' },
  { id: '4', name: 'تقرير الأداء', nameEn: 'Performance Report', desc: 'أداء الخوادم وAPI واستجابة النظام', descEn: 'Server, API performance and system response', type: 'تقني', typeEn: 'Technical', last: '2025-06-16' },
  { id: '5', name: 'تقرير المستخدمين', nameEn: 'User Report', desc: 'نشاط المستخدمين وتوزيع الأدوار', descEn: 'User activity and role distribution', type: 'تشغيلي', typeEn: 'Operational', last: '2025-06-15' },
  { id: '6', name: 'تقرير الفواتير', nameEn: 'Billing Report', desc: 'ملخص الفواتير والمدفوعات المتأخرة', descEn: 'Invoice and overdue payments summary', type: 'مالي', typeEn: 'Financial', last: '2025-06-14' },
]

// ─── CLIQ Payment Gateway ────────────────────────────────────────
export const DEFAULT_CLIQ_CONFIG: CliqConfig = {
  enabled: true,
  bankName: 'البنك العربي',
  accountHolder: 'BookFlow for Technology',
  cliqAlias: 'BOOKFLOWJO',
  instructions: 'قم بفتح تطبيق البنك الخاص بك واختر خدمة CLIQ. أدخل الاسم المستعار (Alias) الموضح أدناه وقم بتحويل المبلغ المطلوب. بعد إتمام التحويل، أدخل رقم المرجع الخاص بالتحويل أدناه.',
  instructionsEn: 'Open your banking app and select the CLIQ service. Enter the alias shown below and transfer the required amount. After completing the transfer, enter the transfer reference number below.',
  qrCodeUrl: null,
  supportContact: 'support@bookflow.com',
}

export const INIT_CLIQ_PAYMENTS: CliqPayment[] = [
  { id: 'CLIQ-001', tenantName: 'مركز اللياقة البدنية', tenantNameEn: 'Fit Life Center', customerName: 'أيمن الحسن', customerEmail: 'ayman@fitlife.ae', plan: 'Professional', amount: 75, currency: 'JOD', referenceNumber: 'TXN-2025-884731', notes: '', screenshotUrl: null, status: 'pending_verification', submittedAt: '2025-06-18T15:30:00Z', reviewedAt: null, reviewedBy: null, rejectionReason: null, additionalInfoRequest: null },
  { id: 'CLIQ-002', tenantName: 'عيادة الابتسامة', tenantNameEn: 'Smile Clinic', customerName: 'ريم السبيعي', customerEmail: 'reem@smile-clinic.com', plan: 'Starter', amount: 25, currency: 'JOD', referenceNumber: 'TXN-2025-772145', notes: 'تحويل من حساب الأعمال', screenshotUrl: null, status: 'approved', submittedAt: '2025-06-17T10:00:00Z', reviewedAt: '2025-06-17T14:30:00Z', reviewedBy: 'Super Admin', rejectionReason: null, additionalInfoRequest: null },
  { id: 'CLIQ-003', tenantName: 'صالون ياسمين', tenantNameEn: 'Yasmin Beauty', customerName: 'سارة العتيبي', customerEmail: 'sara@yasmin.sa', plan: 'Professional', amount: 75, currency: 'JOD', referenceNumber: 'TXN-2025-663902', notes: '', screenshotUrl: null, status: 'rejected', submittedAt: '2025-06-16T09:15:00Z', reviewedAt: '2025-06-16T12:00:00Z', reviewedBy: 'Super Admin', rejectionReason: 'رقم المرجع غير صحيح أو لا يطابق المبلغ المطلوب', additionalInfoRequest: null },
]

// ─── Utility: bilingual field accessor ──────────────────────────
export function bField<T extends object>(obj: T, field: keyof T, locale: string): string {
  const enField = `${String(field)}En` as keyof T
  if (locale === 'en' && enField in obj) return String(obj[enField] || obj[field] || '')
  return String(obj[field] || '')
}