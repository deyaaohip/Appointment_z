'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { useAppStore } from '@/stores/app-store'
import { t, formatCurrency, formatDateTime, getDirection } from '@/lib/i18n'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Building2, Users, DollarSign, CalendarDays, ArrowUpRight, ArrowDownRight,
  Activity, Wifi, Clock, Shield, TrendingUp, CheckCircle2, Plus,
  BarChart3, Settings, CreditCard, Zap, AlertTriangle, Eye, Edit,
  Trash2, Search, MoreHorizontal, UserPlus, Globe, Lock, Database,
  Server, Cpu, HardDrive, RefreshCw, Download, Filter,
} from 'lucide-react'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip, TooltipContent, TooltipTrigger,
} from '@/components/ui/tooltip'

// ─── Animation ─────────────────────────────────────────────────
const container = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } }
const item = { hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } } }
const fadeUp = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35 } } }

// ─── Mock Data ─────────────────────────────────────────────────
interface Tenant { id: string; name: string; nameEn: string; plan: string; bookings: number; revenue: number; users: number; status: 'active' | 'suspended' | 'trial'; createdAt: string; domain: string; country: string }
interface PlatformUser { id: string; name: string; email: string; tenant: string; role: string; status: 'active' | 'inactive' | 'suspended'; lastLogin: string }
interface PlanDef { id: string; name: string; price: number; currency: string; tenants: number; features: string[]; popular?: boolean }
interface SystemLog { id: string; level: 'info' | 'warn' | 'error' | 'success'; source: string; message: string; timestamp: string }

const TENANTS: Tenant[] = [
  { id: '1', name: 'مركز النور الطبي', nameEn: 'Al Noor Medical', plan: 'Enterprise', bookings: 1250, revenue: 187500, users: 12, status: 'active', createdAt: '2025-01-15', domain: 'alnoor.sa', country: '🇸🇦 السعودية' },
  { id: '2', name: 'صالون ياسمين للتجميل', nameEn: 'Yasmin Beauty Salon', plan: 'Professional', bookings: 680, revenue: 54200, users: 8, status: 'active', createdAt: '2025-02-20', domain: 'yasmin.sa', country: '🇸🇦 السعودية' },
  { id: '3', name: 'أكاديمية المستقبل', nameEn: 'Future Academy', plan: 'Professional', bookings: 420, revenue: 38000, users: 6, status: 'active', createdAt: '2025-03-10', domain: 'future-edu.sa', country: '🇦🇪 الإمارات' },
  { id: '4', name: 'عيادة الابتسامة', nameEn: 'Smile Clinic', plan: 'Starter', bookings: 45, revenue: 0, users: 2, status: 'trial', createdAt: '2025-06-01', domain: '', country: '🇪🇬 مصر' },
  { id: '5', name: 'نادي اللياقة الذهبية', nameEn: 'Golden Fitness', plan: 'Professional', bookings: 310, revenue: 22000, users: 5, status: 'suspended', createdAt: '2025-01-28', domain: 'goldenfit.com', country: '🇯🇴 الأردن' },
  { id: '6', name: 'مركز التجميل الملكي', nameEn: 'Royal Beauty Center', plan: 'Enterprise', bookings: 920, revenue: 145000, users: 15, status: 'active', createdAt: '2025-02-01', domain: 'royalbeauty.sa', country: '🇸🇦 السعودية' },
  { id: '7', name: 'عيادة العيون المتقدمة', nameEn: 'Advanced Eye Clinic', plan: 'Business', bookings: 560, revenue: 78000, users: 9, status: 'active', createdAt: '2025-04-15', domain: 'adv-eye.sa', country: '🇸🇦 السعودية' },
  { id: '8', name: 'مركز الفيزيوترابي', nameEn: 'Physio Center', plan: 'Starter', bookings: 120, revenue: 8500, users: 3, status: 'trial', createdAt: '2025-05-20', domain: '', country: '🇰🇼 الكويت' },
]

const ALL_USERS: PlatformUser[] = [
  { id: '1', name: 'أحمد المطيري', email: 'ahmed@alnoor.sa', tenant: 'مركز النور الطبي', role: 'مالك', status: 'active', lastLogin: '2025-06-18T14:30:00Z' },
  { id: '2', name: 'سارة الأحمد', email: 'sara@yasmin.sa', tenant: 'صالون ياسمين', role: 'مدير', status: 'active', lastLogin: '2025-06-18T13:45:00Z' },
  { id: '3', name: 'محمد العتيبي', email: 'mohammed@goldenfit.com', tenant: 'نادي اللياقة', role: 'مالك', status: 'suspended', lastLogin: '2025-06-10T12:00:00Z' },
  { id: '4', name: 'فاطمة الحربي', email: 'fatima@alnoor.sa', tenant: 'مركز النور الطبي', role: 'موظف استقبال', status: 'active', lastLogin: '2025-06-18T10:30:00Z' },
  { id: '5', name: 'خالد الدوسري', email: 'khaled@future-edu.sa', tenant: 'أكاديمية المستقبل', role: 'مالك', status: 'active', lastLogin: '2025-06-17T16:00:00Z' },
  { id: '6', name: 'نورة القحطاني', email: 'noura@royalbeauty.sa', tenant: 'مركز التجميل الملكي', role: 'مدير', status: 'active', lastLogin: '2025-06-18T09:15:00Z' },
  { id: '7', name: 'عبدالله الشمري', email: 'abdullah@adv-eye.sa', tenant: 'عيادة العيون', role: 'مالك', status: 'active', lastLogin: '2025-06-18T11:20:00Z' },
  { id: '8', name: 'ريم السبيعي', email: 'reem@smile-clinic.com', tenant: 'عيادة الابتسامة', role: 'مالك', status: 'active', lastLogin: '2025-06-16T15:00:00Z' },
  { id: '9', name: 'يزيد الحربي', email: 'yazeed@physio.kw', tenant: 'مركز الفيزيوترابي', role: 'مالك', status: 'active', lastLogin: '2025-06-18T08:00:00Z' },
  { id: '10', name: 'هند الزهراني', email: 'hind@alnoor.sa', tenant: 'مركز النور الطبي', role: 'طبيب', status: 'active', lastLogin: '2025-06-18T14:00:00Z' },
]

const PLANS: PlanDef[] = [
  { id: 'free', name: 'مجاني', price: 0, currency: 'SAR', tenants: 45, features: ['لوحة تحكم أساسية', 'حجوزات محدودة 50/شهر', 'عميل واحد'] },
  { id: 'starter', name: 'الأساسية', price: 99, currency: 'SAR', tenants: 28, features: ['لوحة تحكم كاملة', 'حجوزات غير محدودة', 'موظفين حتى 3', 'فرع واحد', 'تقارير أساسية'] },
  { id: 'professional', name: 'الاحترافية', price: 299, currency: 'SAR', tenants: 18, features: ['كل مميزات الأساسية', 'موظفين حتى 10', 'فروع حتى 5', 'تقارير متقدمة', 'كوبونات', 'أدوار وصلاحيات', 'WhatsApp تكامل'] },
  { id: 'business', name: 'الأعمال', price: 599, currency: 'SAR', tenants: 8, popular: true, features: ['كل مميزات الاحترافية', 'موظفين حتى 25', 'فروع غير محدودة', 'API متقدم', 'سجل عمليات', 'فاتور إلكتروني', 'دعم أولوي'] },
  { id: 'enterprise', name: 'المؤسسية', price: 999, currency: 'SAR', tenants: 4, features: ['كل المميزات', 'موظفين غير محدودة', 'وايت لابل', 'SLA 99.9%', 'مدير حساب مخصص', 'تدريب مخصص', 'دمج مخصص'] },
]

const LOGS: SystemLog[] = [
  { id: '1', level: 'success', source: 'الدفع', message: 'دفعة ناجحة: 999 ر.س — خطة Enterprise — مركز النور الطبي', timestamp: '2025-06-18T14:15:00Z' },
  { id: '2', level: 'info', source: 'المستأجرين', message: 'تسجيل مستأجر جديد: عيادة الابتسامة (Trial)', timestamp: '2025-06-18T14:10:00Z' },
  { id: '3', level: 'warn', source: 'النظام', message: 'استخدام الذاكرة تجاوز 80% على الخادم #3', timestamp: '2025-06-18T13:55:00Z' },
  { id: '4', level: 'info', source: 'المستخدمين', message: 'ترقية خطة صالون ياسمين من Starter إلى Professional', timestamp: '2025-06-18T13:45:00Z' },
  { id: '5', level: 'error', source: 'الدفع', message: 'فشل عملية دفع: بطاقة مسربة — نادي اللياقة الذهبية', timestamp: '2025-06-18T12:30:00Z' },
  { id: '6', level: 'success', source: 'النظام', message: 'اكتمل النسخ الاحتياطي اليومي بنجاح (2.4 GB)', timestamp: '2025-06-18T06:00:00Z' },
  { id: '7', level: 'info', source: 'الأمان', message: 'تم تعليق حساب محمد العتيبي — 3 محاولات فاشلة', timestamp: '2025-06-18T11:00:00Z' },
  { id: '8', level: 'warn', source: 'الأداء', message: 'زمن استجابة API تجاوز 500ms — /api/bookings', timestamp: '2025-06-18T10:20:00Z' },
  { id: '9', level: 'success', source: 'المستأجرين', message: 'تفعيل مركز التجميل الملكي بعد الدفع', timestamp: '2025-06-18T09:30:00Z' },
  { id: '10', level: 'info', source: 'النظام', message: 'تحديث النظام إلى الإصدار 2.5.0 بنجاح', timestamp: '2025-06-18T03:00:00Z' },
]

// ─── Helper Components ─────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const s: Record<string, string> = {
    active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
    suspended: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
    trial: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
    inactive: 'bg-gray-100 text-gray-700 dark:bg-gray-900/40 dark:text-gray-400',
  }
  const l: Record<string, string> = { active: 'نشط', suspended: 'معلق', trial: 'تجريبي', inactive: 'غير نشط' }
  return <Badge variant="outline" className={s[status] || ''}>{l[status] || status}</Badge>
}

function LogBadge({ level }: { level: string }) {
  const s: Record<string, string> = {
    info: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
    warn: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
    error: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
    success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
  }
  return <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${s[level] || ''}`}>{level.toUpperCase()}</span>
}

function KpiCard({ icon, iconBg, value, label, trend, sub }: { icon: React.ReactNode; iconBg: string; value: string; label: string; trend?: number; sub?: string }) {
  const isPos = (trend ?? 0) >= 0
  return (
    <motion.div variants={item}>
      <Card className="transition-shadow hover:shadow-md">
        <CardContent className="flex items-center gap-4 p-4">
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>{icon}</div>
          <div className="min-w-0 flex-1">
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            <p className="text-sm text-muted-foreground truncate">{label}</p>
            {sub && <p className="text-xs text-muted-foreground/70 mt-0.5">{sub}</p>}
          </div>
          {trend !== undefined && (
            <div className={`flex shrink-0 items-center gap-0.5 text-sm font-medium ${isPos ? 'text-emerald-600' : 'text-red-500'}`}>
              {isPos ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
              {Math.abs(trend)}%
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

function HealthGauge({ label, value, status, icon }: { label: string; value: number; status: 'healthy' | 'warning' | 'critical'; icon: React.ReactNode }) {
  const colors = { healthy: 'bg-emerald-500', warning: 'bg-amber-500', critical: 'bg-red-500' }
  const ringColors = { healthy: 'text-emerald-500', warning: 'text-amber-500', critical: 'text-red-500' }
  return (
    <motion.div variants={item} className="flex flex-col items-center gap-2 rounded-xl border p-4">
      <div className="relative flex h-20 w-20 items-center justify-center">
        <svg className={`h-20 w-20 -rotate-90 ${ringColors[status]}`} viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="34" fill="none" stroke="currentColor" strokeWidth="6" className="opacity-15" />
          <circle cx="40" cy="40" r="34" fill="none" stroke="currentColor" strokeWidth="6" strokeDasharray={`${2 * Math.PI * 34 * (value / 100)} ${2 * Math.PI * 34}`} strokeLinecap="round" />
        </svg>
        <span className="absolute text-lg font-bold">{value}%</span>
      </div>
      <div className="text-center">
        <div className="flex items-center justify-center gap-1 text-muted-foreground">{icon}<span className="text-xs font-medium">{label}</span></div>
      </div>
    </motion.div>
  )
}

// ─── Tab: Platform Overview ────────────────────────────────────
function OverviewTab() {
  const { locale } = useAppStore()
  const totalRevenue = TENANTS.reduce((s, t) => s + t.revenue, 0)
  const totalBookings = TENANTS.reduce((s, t) => s + t.bookings, 0)
  const totalUsers = ALL_USERS.length
  const activeTenants = TENANTS.filter(t => t.status === 'active').length
  const numberFmt = locale === 'ar' ? 'ar-SA' : 'en-US'

  const recentActivity = LOGS.slice(0, 6)

  return (
    <div className="space-y-6">
      <motion.div variants={container} initial="hidden" animate="visible" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={<Building2 className="h-6 w-6 text-white" />} iconBg="bg-emerald-500" value={TENANTS.length.toString()} label="إجمالي المستأجرين" trend={12} sub={`${activeTenants} نشط`} />
        <KpiCard icon={<Users className="h-6 w-6 text-white" />} iconBg="bg-blue-500" value={totalUsers.toString()} label="إجمالي المستخدمين" trend={8} />
        <KpiCard icon={<DollarSign className="h-6 w-6 text-white" />} iconBg="bg-amber-500" value={formatCurrency(totalRevenue, 'SAR', locale)} label="إجمالي الإيرادات" trend={18} sub="الشهر الحالي" />
        <KpiCard icon={<CalendarDays className="h-6 w-6 text-white" />} iconBg="bg-violet-500" value={totalBookings.toLocaleString(numberFmt)} label="إجمالي الحجوزات" trend={5} sub="آخر 30 يوم" />
      </motion.div>

      {/* Revenue by Plan */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible" transition={{ delay: 0.1 }}>
        <Card>
          <CardHeader><CardTitle className="text-base">الإيرادات حسب الباقة</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {PLANS.filter(p => p.price > 0).map(plan => {
                const planTenants = TENANTS.filter(t => t.plan === plan.name).length
                const planRevenue = TENANTS.filter(t => t.plan === plan.name).reduce((s, t) => s + t.revenue, 0)
                const pct = totalRevenue > 0 ? Math.round((planRevenue / totalRevenue) * 100) : 0
                return (
                  <div key={plan.id} className="flex items-center gap-4">
                    <span className="w-28 text-sm font-medium truncate">{plan.name}</span>
                    <div className="flex-1 h-3 rounded-full bg-muted overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, delay: 0.2 }} className={`h-full rounded-full ${plan.popular ? 'bg-emerald-500' : 'bg-emerald-400/60'}`} />
                    </div>
                    <span className="w-24 text-sm font-semibold text-end tabular-nums">{formatCurrency(planRevenue, 'SAR', locale)}</span>
                    <span className="w-12 text-xs text-muted-foreground text-end">{planTenants} مستأجر</span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Actions + Activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <motion.div variants={fadeUp} initial="hidden" animate="visible" transition={{ delay: 0.15 }}>
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Zap className="h-5 w-5 text-amber-500" />إجراءات سريعة</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: <UserPlus className="h-5 w-5" />, label: 'إضافة مستأجر', color: 'hover:border-emerald-300 hover:bg-emerald-50/50 dark:hover:border-emerald-800 dark:hover:bg-emerald-900/20' },
                  { icon: <CreditCard className="h-5 w-5" />, label: 'إدارة الباقات', color: 'hover:border-blue-300 hover:bg-blue-50/50 dark:hover:border-blue-800 dark:hover:bg-blue-900/20' },
                  { icon: <Download className="h-5 w-5" />, label: 'تصدير التقرير', color: 'hover:border-violet-300 hover:bg-violet-50/50 dark:hover:border-violet-800 dark:hover:bg-violet-900/20' },
                  { icon: <Settings className="h-5 w-5" />, label: 'إعدادات المنصة', color: 'hover:border-amber-300 hover:bg-amber-50/50 dark:hover:border-amber-800 dark:hover:bg-amber-900/20' },
                ].map(a => (
                  <button key={a.label} onClick={() => toast.info(`سيتم فتح: ${a.label}`)} className={`flex flex-col items-center gap-2.5 rounded-xl border p-4 text-center transition-all ${a.color}`}>
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400">{a.icon}</div>
                    <span className="text-xs font-medium">{a.label}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={fadeUp} initial="hidden" animate="visible" transition={{ delay: 0.2 }}>
          <Card className="h-full">
            <CardHeader><CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5 text-blue-500" />آخر النشاطات</CardTitle></CardHeader>
            <CardContent>
              <ScrollArea className="max-h-64">
                <div className="space-y-1">
                  {recentActivity.map(log => (
                    <div key={log.id} className="flex gap-3 rounded-lg p-2.5 transition-colors hover:bg-muted/50">
                      <div className="mt-0.5"><LogBadge level={log.level} /></div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm">{log.message}</p>
                        <p className="text-xs text-muted-foreground/70 mt-0.5">{formatDateTime(log.timestamp, locale)} — {log.source}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

// ─── Tab: Tenant Management ────────────────────────────────────
function TenantsTab() {
  const { locale } = useAppStore()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null)

  const filtered = useMemo(() => {
    let list = [...TENANTS]
    if (statusFilter !== 'all') list = list.filter(t => t.status === statusFilter)
    if (search) { const q = search.toLowerCase(); list = list.filter(t => t.name.includes(q) || t.nameEn.toLowerCase().includes(q) || t.domain.includes(q)) }
    return list
  }, [search, statusFilter])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="بحث بالاسم أو النطاق..." value={search} onChange={e => setSearch(e.target.value)} className="ps-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">الكل</SelectItem>
            <SelectItem value="active">نشط</SelectItem>
            <SelectItem value="trial">تجريبي</SelectItem>
            <SelectItem value="suspended">معلق</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={() => setDialogOpen(true)} className="gap-2"><Plus className="h-4 w-4" />إضافة مستأجر</Button>
      </div>

      <Card className="p-0">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="ps-4">المستأجر</TableHead>
                <TableHead>الباقة</TableHead>
                <TableHead>الحجوزات</TableHead>
                <TableHead>الإيرادات</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>البلد</TableHead>
                <TableHead className="pe-4 text-center">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(t => (
                <TableRow key={t.id} className="hover:bg-muted/30">
                  <TableCell className="ps-4">
                    <div>
                      <p className="font-medium text-sm">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.domain || 'بدون نطاق'}</p>
                    </div>
                  </TableCell>
                  <TableCell><Badge variant="outline">{t.plan}</Badge></TableCell>
                  <TableCell className="tabular-nums">{t.bookings.toLocaleString()}</TableCell>
                  <TableCell className="tabular-nums font-medium">{t.revenue > 0 ? formatCurrency(t.revenue, 'SAR', locale) : '—'}</TableCell>
                  <TableCell><StatusBadge status={t.status} /></TableCell>
                  <TableCell className="text-sm">{t.country}</TableCell>
                  <TableCell className="pe-4">
                    <div className="flex items-center justify-center gap-1">
                      <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setSelectedTenant(t); setDetailOpen(true) }}><Eye className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>عرض</TooltipContent></Tooltip>
                      <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toast.info(`تعديل: ${t.name}`)}><Edit className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>تعديل</TooltipContent></Tooltip>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => toast.success(`تم إيقاف: ${t.name}`)}><Lock className="h-4 w-4 me-2" />تعليق</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toast.success(`تم تفعيل: ${t.name}`)}><CheckCircle2 className="h-4 w-4 me-2" />تفعيل</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600" onClick={() => toast.error(`تم حذف: ${t.name}`)}><Trash2 className="h-4 w-4 me-2" />حذف</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Tenant Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>إضافة مستأجر جديد</DialogTitle><DialogDescription>أدخل بيانات المستأجر الجديد</DialogDescription></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2"><Label>اسم المستأجر</Label><Input placeholder="مثال: مركز الشفاء الطبي" /></div>
            <div className="grid gap-2"><Label>البريد الإلكتروني</Label><Input type="email" placeholder="admin@clinic.com" /></div>
            <div className="grid gap-2"><Label>البلد</Label><Input placeholder="السعودية" /></div>
            <div className="grid gap-2"><Label>الباقة</Label>
              <Select><SelectTrigger><SelectValue placeholder="اختر خطة" /></SelectTrigger><SelectContent>{PLANS.map(p => <SelectItem key={p.id} value={p.id}>{p.name} — {p.price > 0 ? `${p.price} ر.س/شهر` : 'مجاني'}</SelectItem>)}</SelectContent></Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>إلغاء</Button>
            <Button onClick={() => { toast.success('تم إنشاء المستأجر بنجاح'); setDialogOpen(false) }}>إنشاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{selectedTenant?.name}</DialogTitle><DialogDescription>تفاصيل المستأجر</DialogDescription></DialogHeader>
          {selectedTenant && (
            <div className="grid gap-4 py-2">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-muted-foreground">الباقة:</span><p className="font-medium mt-0.5">{selectedTenant.plan}</p></div>
                <div><span className="text-muted-foreground">الحالة:</span><p className="mt-0.5"><StatusBadge status={selectedTenant.status} /></p></div>
                <div><span className="text-muted-foreground">النطاق:</span><p className="font-medium mt-0.5">{selectedTenant.domain || '—'}</p></div>
                <div><span className="text-muted-foreground">البلد:</span><p className="font-medium mt-0.5">{selectedTenant.country}</p></div>
                <div><span className="text-muted-foreground">الحجوزات:</span><p className="font-medium mt-0.5">{selectedTenant.bookings.toLocaleString()}</p></div>
                <div><span className="text-muted-foreground">الإيرادات:</span><p className="font-medium mt-0.5">{formatCurrency(selectedTenant.revenue, 'SAR', locale)}</p></div>
                <div><span className="text-muted-foreground">المستخدمين:</span><p className="font-medium mt-0.5">{selectedTenant.users}</p></div>
                <div><span className="text-muted-foreground">تاريخ الإنشاء:</span><p className="font-medium mt-0.5">{selectedTenant.createdAt}</p></div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── Tab: Users ────────────────────────────────────────────────
function UsersTab() {
  const { locale } = useAppStore()
  const [search, setSearch] = useState('')
  const [tenantFilter, setTenantFilter] = useState('all')
  const tenantNames = [...new Set(ALL_USERS.map(u => u.tenant))]

  const filtered = useMemo(() => {
    let list = [...ALL_USERS]
    if (tenantFilter !== 'all') list = list.filter(u => u.tenant === tenantFilter)
    if (search) { const q = search.toLowerCase(); list = list.filter(u => u.name.includes(q) || u.email.toLowerCase().includes(q)) }
    return list
  }, [search, tenantFilter])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="بحث بالاسم أو البريد..." value={search} onChange={e => setSearch(e.target.value)} className="ps-9" />
        </div>
        <Select value={tenantFilter} onValueChange={setTenantFilter}>
          <SelectTrigger className="w-48"><SelectValue placeholder="كل المستأجرين" /></SelectTrigger>
          <SelectContent><SelectItem value="all">كل المستأجرين</SelectItem>{tenantNames.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <Card className="p-0">
        <Table>
          <TableHeader><TableRow className="bg-muted/50"><TableHead className="ps-4">المستخدم</TableHead><TableHead>المستأجر</TableHead><TableHead>الدور</TableHead><TableHead>آخر دخول</TableHead><TableHead className="pe-4">الحالة</TableHead></TableRow></TableHeader>
          <TableBody>
            {filtered.map(u => (
              <TableRow key={u.id} className="hover:bg-muted/30">
                <TableCell className="ps-4"><div><p className="font-medium text-sm">{u.name}</p><p className="text-xs text-muted-foreground">{u.email}</p></div></TableCell>
                <TableCell className="text-sm">{u.tenant}</TableCell>
                <TableCell><Badge variant="secondary">{u.role}</Badge></TableCell>
                <TableCell className="text-sm text-muted-foreground">{formatDateTime(u.lastLogin, locale)}</TableCell>
                <TableCell className="pe-4"><StatusBadge status={u.status} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}

// ─── Tab: Plans ────────────────────────────────────────────────
function PlansTab() {
  const { locale } = useAppStore()
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{PLANS.length} باقة متاحة</p>
        <Button className="gap-2" onClick={() => toast.info('إنشاء باقة جديدة')}><Plus className="h-4 w-4" />إضافة باقة</Button>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {PLANS.map(plan => (
          <motion.div key={plan.id} variants={item} initial="hidden" animate="visible">
            <Card className={`relative transition-shadow hover:shadow-md ${plan.popular ? 'border-emerald-500 border-2' : ''}`}>
              {plan.popular && <div className="absolute -top-3 start-1/2 -translate-x-1/2 bg-emerald-500 text-white text-xs font-bold px-3 py-0.5 rounded-full">الأكثر شعبية</div>}
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{plan.name}</CardTitle>
                <CardDescription>
                  <span className="text-2xl font-bold text-foreground">{plan.price > 0 ? `${plan.price}` : 'مجاني'}</span>
                  {plan.price > 0 && <span className="text-muted-foreground"> ر.س/شهر</span>}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground"><Building2 className="h-4 w-4" />{plan.tenants} مستأجر نشط</div>
                <div className="space-y-2">
                  {plan.features.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" /><span>{f}</span></div>
                  ))}
                </div>
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1 gap-1" onClick={() => toast.info(`تعديل: ${plan.name}`)}><Edit className="h-3.5 w-3.5" />تعديل</Button>
                  <Button variant="outline" size="sm" className="gap-1" onClick={() => toast.info(`إحصائيات: ${plan.name}`)}><BarChart3 className="h-3.5 w-3.5" /></Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

// ─── Tab: System Health ────────────────────────────────────────
function HealthTab() {
  const { locale } = useAppStore()
  const services = [
    { name: 'API Server', status: 'healthy' as const, uptime: '99.97%', responseTime: '45ms', connections: 1247 },
    { name: 'Database (Primary)', status: 'healthy' as const, uptime: '99.99%', responseTime: '3ms', connections: 24 },
    { name: 'Database (Replica)', status: 'healthy' as const, uptime: '99.98%', responseTime: '5ms', connections: 18 },
    { name: 'Redis Cache', status: 'healthy' as const, uptime: '99.95%', responseTime: '1ms', connections: 156 },
    { name: 'Queue Worker', status: 'warning' as const, uptime: '98.50%', responseTime: '120ms', connections: 8 },
    { name: 'File Storage', status: 'healthy' as const, uptime: '99.99%', responseTime: '15ms', connections: 0 },
  ]

  return (
    <div className="space-y-6">
      {/* Gauges */}
      <motion.div variants={container} initial="hidden" animate="visible" className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <HealthGauge label="CPU" value={23} status="healthy" icon={<Cpu className="h-4 w-4" />} />
        <HealthGauge label="الذاكرة" value={61} status="healthy" icon={<Server className="h-4 w-4" />} />
        <HealthGauge label="التخزين" value={42} status="healthy" icon={<HardDrive className="h-4 w-4" />} />
        <HealthGauge label="قاعدة البيانات" value={18} status="healthy" icon={<Database className="h-4 w-4" />} />
      </motion.div>

      {/* Services */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible" transition={{ delay: 0.1 }}>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5 text-emerald-600" />حالة الخدمات</CardTitle>
              <Button variant="outline" size="sm" className="gap-2" onClick={() => toast.info('تم تحديث حالة الخدمات')}><RefreshCw className="h-3.5 w-3.5" />تحديث</Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow className="bg-muted/50"><TableHead className="ps-4">الخدمة</TableHead><TableHead>الحالة</TableHead><TableHead>وقت التشغيل</TableHead><TableHead>زمن الاستجابة</TableHead><TableHead className="pe-4">الاتصالات</TableHead></TableRow></TableHeader>
              <TableBody>
                {services.map(s => (
                  <TableRow key={s.name}>
                    <TableCell className="ps-4 font-medium text-sm">{s.name}</TableCell>
                    <TableCell><StatusBadge status={s.status === 'healthy' ? 'active' : s.status === 'warning' ? 'trial' : 'suspended'} /></TableCell>
                    <TableCell className="text-sm tabular-nums">{s.uptime}</TableCell>
                    <TableCell className="text-sm tabular-nums">{s.responseTime}</TableCell>
                    <TableCell className="pe-4 text-sm tabular-nums">{s.connections}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>

      {/* Status Banner */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible" transition={{ delay: 0.15 }}>
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-900/20">
          <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0" />
          <div><p className="font-medium text-emerald-700 dark:text-emerald-400">جميع الخدمات تعمل بشكل طبيعي</p><p className="text-sm text-emerald-600/70 dark:text-emerald-400/70 mt-0.5">آخر فحص: منذ 30 ثانية | لا توجد تنبيهات نشطة</p></div>
        </div>
      </motion.div>
    </div>
  )
}

// ─── Tab: System Logs ──────────────────────────────────────────
function LogsTab() {
  const { locale } = useAppStore()
  const [levelFilter, setLevelFilter] = useState('all')
  const filtered = levelFilter === 'all' ? LOGS : LOGS.filter(l => l.level === levelFilter)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Select value={levelFilter} onValueChange={setLevelFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="كل المستويات" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل المستويات</SelectItem>
            <SelectItem value="info">Info</SelectItem>
            <SelectItem value="warn">Warning</SelectItem>
            <SelectItem value="error">Error</SelectItem>
            <SelectItem value="success">Success</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" className="gap-2" onClick={() => toast.info('تصدير السجلات')}><Download className="h-3.5 w-3.5" />تصدير CSV</Button>
      </div>
      <Card className="p-0">
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow className="bg-muted/50"><TableHead className="w-24 ps-4">المستوى</TableHead><TableHead className="w-32">المصدر</TableHead><TableHead>الرسالة</TableHead><TableHead className="w-44 pe-4">الوقت</TableHead></TableRow></TableHeader>
            <TableBody>
              {filtered.map(l => (
                <TableRow key={l.id} className="hover:bg-muted/30">
                  <TableCell className="ps-4"><LogBadge level={l.level} /></TableCell>
                  <TableCell className="text-sm font-medium">{l.source}</TableCell>
                  <TableCell className="text-sm max-w-md truncate">{l.message}</TableCell>
                  <TableCell className="pe-4 text-sm text-muted-foreground tabular-nums">{formatDateTime(l.timestamp, locale)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Tab: Settings ─────────────────────────────────────────────
function SettingsTab() {
  const [maintenanceMode, setMaintenanceMode] = useState(false)
  const [registration, setRegistration] = useState(true)
  const [notifications, setNotifications] = useState(true)
  const [autoBackup, setAutoBackup] = useState(true)

  const settings = [
    { label: 'وضع الصيانة', desc: 'يعطل الوصول للمنصة مؤقتاً للجميع', value: maintenanceMode, onChange: setMaintenanceMode, icon: <AlertTriangle className="h-5 w-5 text-amber-500" /> },
    { label: 'التسجيل المفتوح', desc: 'السماح للمستخدمين الجدد بالتسجيل تلقائياً', value: registration, onChange: setRegistration, icon: <UserPlus className="h-5 w-5 text-blue-500" /> },
    { label: 'إشعارات النظام', desc: 'إرسال إشعارات تلقائية عند الأحداث المهمة', value: notifications, onChange: setNotifications, icon: <Bell className="h-5 w-5 text-violet-500" /> },
    { label: 'نسخ احتياطي تلقائي', desc: 'نسخ احتياطي يومي لقاعدة البيانات والملفات', value: autoBackup, onChange: setAutoBackup, icon: <Database className="h-5 w-5 text-emerald-500" /> },
  ]

  return (
    <div className="space-y-6 max-w-2xl">
      <motion.div variants={container} initial="hidden" animate="visible" className="space-y-4">
        {settings.map(s => (
          <motion.div key={s.label} variants={item}>
            <Card>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">{s.icon}</div>
                  <div><p className="font-medium text-sm">{s.label}</p><p className="text-xs text-muted-foreground mt-0.5">{s.desc}</p></div>
                </div>
                <Switch checked={s.value} onCheckedChange={v => { s.onChange(v); toast.success(`${s.label}: ${v ? 'مفعّل' : 'معطّل'}`) }} />
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <motion.div variants={fadeUp} initial="hidden" animate="visible" transition={{ delay: 0.2 }}>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5" />إعدادات متقدمة</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2"><Label>حد الحجوزات اليومية (لكل مستأجر)</Label><Input type="number" defaultValue="500" /></div>
              <div className="grid gap-2"><Label>مدة الجلسة (ساعات)</Label><Input type="number" defaultValue="24" /></div>
              <div className="grid gap-2"><Label>حد الملفات المرفوعة (MB)</Label><Input type="number" defaultValue="10" /></div>
              <div className="grid gap-2"><Label>حد الرسائل اليومية</Label><Input type="number" defaultValue="1000" /></div>
            </div>
            <Button className="gap-2" onClick={() => toast.success('تم حفظ الإعدادات بنجاح')}><CheckCircle2 className="h-4 w-4" />حفظ الإعدادات</Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

// ─── Main Export ───────────────────────────────────────────────
export function SuperAdminDashboard() {
  const { locale } = useAppStore()
  const dir = getDirection(locale)

  return (
    <motion.div dir={dir} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Shield className="h-7 w-7 text-emerald-600" />لوحة تحكم المنصة</h1>
          <p className="text-sm text-muted-foreground">إدارة كاملة لجميع المستأجرين والخدمات والإعدادات</p>
        </div>
        <div className="flex items-center gap-2 mt-2 sm:mt-0">
          <Badge variant="outline" className="gap-1.5 px-3 py-1"><Wifi className="h-3.5 w-3.5 text-emerald-500" />المنصة متصلة</Badge>
          <Badge variant="outline" className="gap-1.5 px-3 py-1"><Clock className="h-3.5 w-3.5 text-blue-500" />آخر تحديث: الآن</Badge>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" dir={dir}>
        <TabsList className="flex-wrap h-auto gap-1 bg-muted/50 p-1">
          <TabsTrigger value="overview" className="gap-1.5 text-xs"><BarChart3 className="h-3.5 w-3.5" />نظرة عامة</TabsTrigger>
          <TabsTrigger value="tenants" className="gap-1.5 text-xs"><Building2 className="h-3.5 w-3.5" />المستأجرين</TabsTrigger>
          <TabsTrigger value="users" className="gap-1.5 text-xs"><Users className="h-3.5 w-3.5" />المستخدمين</TabsTrigger>
          <TabsTrigger value="plans" className="gap-1.5 text-xs"><CreditCard className="h-3.5 w-3.5" />الباقات</TabsTrigger>
          <TabsTrigger value="health" className="gap-1.5 text-xs"><Activity className="h-3.5 w-3.5" />صحة النظام</TabsTrigger>
          <TabsTrigger value="logs" className="gap-1.5 text-xs"><ScrollText className="h-3.5 w-3.5" />السجلات</TabsTrigger>
          <TabsTrigger value="settings" className="gap-1.5 text-xs"><Settings className="h-3.5 w-3.5" />الإعدادات</TabsTrigger>
        </TabsList>

        <div className="mt-4">
          <AnimatePresence mode="wait">
            <TabsContent value="overview"><OverviewTab /></TabsContent>
            <TabsContent value="tenants"><TenantsTab /></TabsContent>
            <TabsContent value="users"><UsersTab /></TabsContent>
            <TabsContent value="plans"><PlansTab /></TabsContent>
            <TabsContent value="health"><HealthTab /></TabsContent>
            <TabsContent value="logs"><LogsTab /></TabsContent>
            <TabsContent value="settings"><SettingsTab /></TabsContent>
          </AnimatePresence>
        </div>
      </Tabs>
    </motion.div>
  )
}