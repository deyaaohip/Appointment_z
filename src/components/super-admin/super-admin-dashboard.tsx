'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { useAppStore } from '@/stores/app-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Building2, Users, DollarSign, CalendarDays, ArrowUpRight, ArrowDownRight,
  Activity, CreditCard, Settings, Shield, Eye, Edit, Trash2, Plus,
  Search, BarChart3, Server, Database, Lock, Bell, FileText, UserCog,
  TrendingUp, CheckCircle2, XCircle, AlertTriangle, RefreshCw,
} from 'lucide-react'

// ─── Animation Variants ──────────────────────────────────────
const container = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } }
const item = { hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } } }
const fadeUp = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35 } } }

// ─── Data Types ──────────────────────────────────────────────
interface Tenant { id: string; name: string; nameEn: string; plan: string; bookings: number; revenue: number; users: number; status: string; createdAt: string; country: string }
interface PlatformUser { id: string; name: string; email: string; tenant: string; role: string; status: string; lastLogin: string }
interface SystemLog { id: string; level: string; source: string; message: string; timestamp: string }

// ─── Mock Data ───────────────────────────────────────────────
const TENANTS: Tenant[] = [
  { id: '1', name: 'مركز النور الطبي', nameEn: 'Al Noor Medical', plan: 'Enterprise', bookings: 1250, revenue: 187500, users: 12, status: 'active', createdAt: '2025-01-15', country: '🇸🇦 السعودية' },
  { id: '2', name: 'صالون ياسمين للتجميل', nameEn: 'Yasmin Beauty', plan: 'Professional', bookings: 680, revenue: 54200, users: 8, status: 'active', createdAt: '2025-02-20', country: '🇸🇦 السعودية' },
  { id: '3', name: 'أكاديمية المستقبل', nameEn: 'Future Academy', plan: 'Professional', bookings: 420, revenue: 38000, users: 6, status: 'active', createdAt: '2025-03-10', country: '🇦🇪 الإمارات' },
  { id: '4', name: 'عيادة الابتسامة', nameEn: 'Smile Clinic', plan: 'Starter', bookings: 45, revenue: 0, users: 2, status: 'trial', createdAt: '2025-06-01', country: '🇪🇬 مصر' },
  { id: '5', name: 'نادي اللياقة الذهبية', nameEn: 'Golden Fitness', plan: 'Professional', bookings: 310, revenue: 22000, users: 5, status: 'suspended', createdAt: '2025-01-28', country: '🇯🇴 الأردن' },
  { id: '6', name: 'مركز التجميل الملكي', nameEn: 'Royal Beauty', plan: 'Enterprise', bookings: 920, revenue: 145000, users: 15, status: 'active', createdAt: '2025-02-01', country: '🇸🇦 السعودية' },
  { id: '7', name: 'عيادة العيون المتقدمة', nameEn: 'Advanced Eye', plan: 'Business', bookings: 560, revenue: 78000, users: 9, status: 'active', createdAt: '2025-04-15', country: '🇸🇦 السعودية' },
  { id: '8', name: 'مركز الفيزيوترابي', nameEn: 'Physio Center', plan: 'Starter', bookings: 120, revenue: 8500, users: 3, status: 'trial', createdAt: '2025-05-20', country: '🇰🇼 الكويت' },
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
]

const LOGS: SystemLog[] = [
  { id: '1', level: 'success', source: 'الدفع', message: 'دفعة ناجحة: 999 ر.س — Enterprise — مركز النور الطبي', timestamp: '2025-06-18T14:15:00Z' },
  { id: '2', level: 'info', source: 'المستأجرين', message: 'تسجيل مستأجر جديد: عيادة الابتسامة (Trial)', timestamp: '2025-06-18T14:10:00Z' },
  { id: '3', level: 'warn', source: 'النظام', message: 'استخدام الذاكرة تجاوز 80% على الخادم #3', timestamp: '2025-06-18T13:55:00Z' },
  { id: '4', level: 'info', source: 'المستخدمين', message: 'ترقية خطة صالون ياسمين من Starter إلى Professional', timestamp: '2025-06-18T13:45:00Z' },
  { id: '5', level: 'error', source: 'الدفع', message: 'فشل عملية دفع: بطاقة مسربة — نادي اللياقة الذهبية', timestamp: '2025-06-18T12:30:00Z' },
  { id: '6', level: 'success', source: 'النظام', message: 'اكتمل النسخ الاحتياطي اليومي بنجاح (2.4 GB)', timestamp: '2025-06-18T06:00:00Z' },
  { id: '7', level: 'info', source: 'الأمان', message: 'تعليق حساب محمد العتيبي — 3 محاولات فاشلة', timestamp: '2025-06-18T11:00:00Z' },
  { id: '8', level: 'warn', source: 'الأداء', message: 'زمن استجابة API تجاوز 500ms — /api/bookings', timestamp: '2025-06-18T10:20:00Z' },
  { id: '9', level: 'success', source: 'المستأجرين', message: 'تفعيل مركز التجميل الملكي بعد الدفع', timestamp: '2025-06-18T09:30:00Z' },
  { id: '10', level: 'info', source: 'النظام', message: 'تحديث النظام إلى الإصدار 2.5.0 بنجاح', timestamp: '2025-06-18T03:00:00Z' },
]

// ─── Helper: Status Badge ────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
    suspended: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
    trial: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
    inactive: 'bg-gray-100 text-gray-600 dark:bg-gray-900/40 dark:text-gray-400',
  }
  const labels: Record<string, string> = { active: 'نشط', suspended: 'معلق', trial: 'تجريبي', inactive: 'غير نشط' }
  return <Badge variant="outline" className={map[status] || ''}>{labels[status] || status}</Badge>
}

function LogBadge({ level }: { level: string }) {
  const map: Record<string, string> = {
    info: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
    warn: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
    error: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
    success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
  }
  return <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${map[level] || ''}`}>{level.toUpperCase()}</span>
}

// ─── KPI Card ────────────────────────────────────────────────
function KpiCard({ icon, iconBg, value, label, trend }: { icon: React.ReactNode; iconBg: string; value: string; label: string; trend?: number }) {
  const isPos = (trend ?? 0) >= 0
  return (
    <motion.div variants={item}>
      <Card className="transition-shadow hover:shadow-md">
        <CardContent className="flex items-center gap-4 p-4">
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>{icon}</div>
          <div className="min-w-0 flex-1">
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            <p className="text-sm text-muted-foreground truncate">{label}</p>
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

// ─── Tab: Overview ───────────────────────────────────────────
function OverviewTab() {
  const totalRevenue = TENANTS.reduce((s, t) => s + t.revenue, 0)
  const totalBookings = TENANTS.reduce((s, t) => s + t.bookings, 0)
  const activeTenants = TENANTS.filter(t => t.status === 'active').length

  return (
    <div className="space-y-6">
      <motion.div variants={container} initial="hidden" animate="visible" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={<Building2 className="h-6 w-6 text-white" />} iconBg="bg-violet-500" value={TENANTS.length.toString()} label="إجمالي المستأجرين" trend={12} />
        <KpiCard icon={<Users className="h-6 w-6 text-white" />} iconBg="bg-blue-500" value={ALL_USERS.length.toString()} label="إجمالي المستخدمين" trend={8} />
        <KpiCard icon={<DollarSign className="h-6 w-6 text-white" />} iconBg="bg-amber-500" value={`${(totalRevenue / 1000).toFixed(0)}K`} label="إجمالي الإيرادات (ر.س)" trend={18} />
        <KpiCard icon={<CalendarDays className="h-6 w-6 text-white" />} iconBg="bg-emerald-500" value={totalBookings.toLocaleString()} label="إجمالي الحجوزات" trend={5} />
      </motion.div>

      {/* Plans Revenue */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible" transition={{ delay: 0.1 }}>
        <Card>
          <CardHeader><CardTitle className="text-base">الإيرادات حسب الباقة</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { name: 'المؤسسية', revenue: TENANTS.filter(t => t.plan === 'Enterprise').reduce((s, t) => s + t.revenue, 0), color: 'bg-violet-500' },
                { name: 'الأعمال', revenue: TENANTS.filter(t => t.plan === 'Business').reduce((s, t) => s + t.revenue, 0), color: 'bg-blue-500' },
                { name: 'الاحترافية', revenue: TENANTS.filter(t => t.plan === 'Professional').reduce((s, t) => s + t.revenue, 0), color: 'bg-emerald-500' },
                { name: 'الأساسية', revenue: TENANTS.filter(t => t.plan === 'Starter').reduce((s, t) => s + t.revenue, 0), color: 'bg-amber-500' },
              ].map(plan => {
                const pct = totalRevenue > 0 ? Math.round((plan.revenue / totalRevenue) * 100) : 0
                return (
                  <div key={plan.name} className="flex items-center gap-4">
                    <span className="w-24 text-sm font-medium">{plan.name}</span>
                    <div className="flex-1 h-3 rounded-full bg-muted overflow-hidden">
                      <div className={`h-full rounded-full ${plan.color} transition-all duration-700`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-20 text-sm font-semibold text-end">{plan.revenue.toLocaleString()} ر.س</span>
                    <span className="w-10 text-xs text-muted-foreground text-end">{pct}%</span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Activity + Quick Actions */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <motion.div variants={fadeUp} initial="hidden" animate="visible" transition={{ delay: 0.15 }}>
          <Card className="h-full">
            <CardHeader><CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5 text-blue-500" />آخر النشاطات</CardTitle></CardHeader>
            <CardContent>
              <ScrollArea className="max-h-64">
                <div className="space-y-2">
                  {LOGS.slice(0, 6).map(log => (
                    <div key={log.id} className="flex gap-3 rounded-lg p-2 hover:bg-muted/50 transition-colors">
                      <LogBadge level={log.level} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm">{log.message}</p>
                        <p className="text-xs text-muted-foreground">{log.source} — {new Date(log.timestamp).toLocaleString('ar-SA')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={fadeUp} initial="hidden" animate="visible" transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5 text-violet-500" />إجراءات سريعة</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: <Plus className="h-5 w-5" />, label: 'إضافة مستأجر', color: 'hover:border-violet-300 hover:bg-violet-50/50' },
                  { icon: <CreditCard className="h-5 w-5" />, label: 'إدارة الباقات', color: 'hover:border-blue-300 hover:bg-blue-50/50' },
                  { icon: <BarChart3 className="h-5 w-5" />, label: 'تصدير تقرير', color: 'hover:border-emerald-300 hover:bg-emerald-50/50' },
                  { icon: <RefreshCw className="h-5 w-5" />, label: 'تحديث النظام', color: 'hover:border-amber-300 hover:bg-amber-50/50' },
                ].map(a => (
                  <button key={a.label} onClick={() => toast.info(`سيتم فتح: ${a.label}`)} className={`flex flex-col items-center gap-2.5 rounded-xl border p-4 text-center transition-all ${a.color}`}>
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 text-violet-600">{a.icon}</div>
                    <span className="text-xs font-medium">{a.label}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

// ─── Tab: Tenants ────────────────────────────────────────────
function TenantsTab() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [detailOpen, setDetailOpen] = useState(false)
  const [selected, setSelected] = useState<Tenant | null>(null)

  const filtered = useMemo(() => {
    let list = [...TENANTS]
    if (statusFilter !== 'all') list = list.filter(t => t.status === statusFilter)
    if (search) { const q = search.toLowerCase(); list = list.filter(t => t.name.includes(q) || t.nameEn.toLowerCase().includes(q)) }
    return list
  }, [search, statusFilter])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="بحث بالاسم..." value={search} onChange={e => setSearch(e.target.value)} className="ps-9" />
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
        <Button className="gap-2 bg-violet-600 hover:bg-violet-700"><Plus className="h-4 w-4" />إضافة مستأجر</Button>
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
                <TableHead>المستخدمين</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>التاريخ</TableHead>
                <TableHead className="pe-4"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(t => (
                <TableRow key={t.id} className="hover:bg-muted/30 cursor-pointer" onClick={() => { setSelected(t); setDetailOpen(true) }}>
                  <TableCell className="ps-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 font-bold text-sm">{t.name.charAt(0)}</div>
                      <div>
                        <p className="font-medium text-sm">{t.name}</p>
                        <p className="text-xs text-muted-foreground">{t.nameEn}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell><Badge variant="secondary">{t.plan}</Badge></TableCell>
                  <TableCell className="font-medium">{t.bookings.toLocaleString()}</TableCell>
                  <TableCell className="font-medium">{t.revenue.toLocaleString()} ر.س</TableCell>
                  <TableCell>{t.users}</TableCell>
                  <TableCell><StatusBadge status={t.status} /></TableCell>
                  <TableCell className="text-xs text-muted-foreground">{t.createdAt}</TableCell>
                  <TableCell className="pe-4"><Eye className="h-4 w-4 text-muted-foreground" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Tenant Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selected?.name}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">الباقة</p>
                  <p className="font-semibold">{selected.plan}</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">الحالة</p>
                  <StatusBadge status={selected.status} />
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">الحجوزات</p>
                  <p className="font-semibold">{selected.bookings.toLocaleString()}</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">الإيرادات</p>
                  <p className="font-semibold">{selected.revenue.toLocaleString()} ر.س</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">المستخدمين</p>
                  <p className="font-semibold">{selected.users}</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">البلد</p>
                  <p className="font-semibold">{selected.country}</p>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button className="flex-1 gap-2" variant="outline"><Edit className="h-4 w-4" />تعديل</Button>
                <Button className="flex-1 gap-2" variant="outline"><Eye className="h-4 w-4" />عرض التفاصيل</Button>
                <Button className="gap-2 text-red-600 hover:bg-red-50" variant="ghost"><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailOpen(false)}>إغلاق</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── Tab: Users ──────────────────────────────────────────────
function UsersTab() {
  const [search, setSearch] = useState('')
  const filtered = useMemo(() => {
    if (!search) return ALL_USERS
    const q = search.toLowerCase()
    return ALL_USERS.filter(u => u.name.includes(q) || u.email.toLowerCase().includes(q) || u.tenant.includes(q))
  }, [search])

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="بحث بالاسم أو الإيميل..." value={search} onChange={e => setSearch(e.target.value)} className="ps-9" />
        </div>
        <Button className="gap-2 bg-violet-600 hover:bg-violet-700"><UserPlus className="h-4 w-4" />إضافة مستخدم</Button>
      </div>
      <Card className="p-0">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="ps-4">المستخدم</TableHead>
                <TableHead>البريد</TableHead>
                <TableHead>المستأجر</TableHead>
                <TableHead>الدور</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>آخر دخول</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(u => (
                <TableRow key={u.id} className="hover:bg-muted/30">
                  <TableCell className="ps-4 font-medium">{u.name}</TableCell>
                  <TableCell className="text-muted-foreground" dir="ltr">{u.email}</TableCell>
                  <TableCell>{u.tenant}</TableCell>
                  <TableCell><Badge variant="secondary">{u.role}</Badge></TableCell>
                  <TableCell><StatusBadge status={u.status} /></TableCell>
                  <TableCell className="text-xs text-muted-foreground">{new Date(u.lastLogin).toLocaleString('ar-SA')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Tab: System Health ──────────────────────────────────────
function SystemTab() {
  const healthItems = [
    { label: 'API Server', value: 99, status: 'healthy' as const, icon: <Server className="h-4 w-4" /> },
    { label: 'Database', value: 85, status: 'healthy' as const, icon: <Database className="h-4 w-4" /> },
    { label: 'Memory', value: 78, status: 'healthy' as const, icon: <Activity className="h-4 w-4" /> },
    { label: 'Disk Space', value: 62, status: 'healthy' as const, icon: <Server className="h-4 w-4" /> },
    { label: 'CDN', value: 100, status: 'healthy' as const, icon: <Globe className="h-4 w-4" /> },
    { label: 'Queue Worker', value: 95, status: 'healthy' as const, icon: <RefreshCw className="h-4 w-4" /> },
  ]
  const colors = { healthy: 'text-emerald-500', warning: 'text-amber-500', critical: 'text-red-500' }

  return (
    <div className="space-y-6">
      <motion.div variants={container} initial="hidden" animate="visible" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {healthItems.map(h => (
          <motion.div key={h.label} variants={item} className="flex flex-col items-center gap-2 rounded-xl border p-4">
            <div className="relative flex h-16 w-16 items-center justify-center">
              <svg className={`h-16 w-16 -rotate-90 ${colors[h.status]}`} viewBox="0 0 64 64">
                <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="5" className="opacity-15" />
                <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="5" strokeDasharray={`${2 * Math.PI * 28 * (h.value / 100)} ${2 * Math.PI * 28}`} strokeLinecap="round" />
              </svg>
              <span className="absolute text-sm font-bold">{h.value}%</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">{h.icon}<span className="text-xs font-medium">{h.label}</span></div>
          </motion.div>
        ))}
      </motion.div>

      {/* Audit Logs */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible" transition={{ delay: 0.1 }}>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-violet-500" />سجل النظام</CardTitle></CardHeader>
          <CardContent>
            <ScrollArea className="max-h-80">
              <div className="space-y-2">
                {LOGS.map(log => (
                  <div key={log.id} className="flex gap-3 rounded-lg p-2.5 hover:bg-muted/50 transition-colors">
                    <LogBadge level={log.level} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm">{log.message}</p>
                      <p className="text-xs text-muted-foreground">{log.source} — {new Date(log.timestamp).toLocaleString('ar-SA')}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

// ─── Placeholder for other tabs ──────────────────────────────
function PlaceholderTab({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="rounded-2xl bg-violet-50 dark:bg-violet-950/20 p-6 mb-4">
        <Shield className="h-12 w-12 text-violet-500" />
      </div>
      <h2 className="text-2xl font-bold mb-2">{title}</h2>
      <p className="text-muted-foreground">هذه الصفحة قيد التطوير وستكون متاحة قريبًا</p>
      <Badge variant="secondary" className="mt-4">قادم قريبًا</Badge>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────
export function SuperAdminDashboard() {
  const { superAdminView } = useAppStore()
  const [activeTab, setActiveTab] = useState('overview')

  // Map sidebar view to tab
  const viewToTab: Record<string, string> = {
    sa_overview: 'overview',
    sa_tenants: 'tenants',
    sa_users: 'users',
    sa_system: 'system',
    sa_audit: 'system',
  }

  const currentTab = viewToTab[superAdminView] || 'overview'

  return (
    <Tabs value={currentTab} onValueChange={setActiveTab} className="space-y-6">
      <TabsList className="bg-muted/50">
        <TabsTrigger value="overview" className="gap-1.5"><BarChart3 className="h-4 w-4" />نظرة عامة</TabsTrigger>
        <TabsTrigger value="tenants" className="gap-1.5"><Building2 className="h-4 w-4" />المستأجرين</TabsTrigger>
        <TabsTrigger value="users" className="gap-1.5"><Users className="h-4 w-4" />المستخدمين</TabsTrigger>
        <TabsTrigger value="system" className="gap-1.5"><Server className="h-4 w-4" />النظام</TabsTrigger>
      </TabsList>

      <TabsContent value="overview"><OverviewTab /></TabsContent>
      <TabsContent value="tenants"><TenantsTab /></TabsContent>
      <TabsContent value="users"><UsersTab /></TabsContent>
      <TabsContent value="system"><SystemTab /></TabsContent>
    </Tabs>
  )
}