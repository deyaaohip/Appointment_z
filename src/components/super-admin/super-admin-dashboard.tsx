'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { useAppStore } from '@/stores/app-store'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import {
  Building2, Users, DollarSign, CalendarDays, ArrowUpRight, ArrowDownRight,
  Activity, CreditCard, Settings, Shield, Eye, Edit, Trash2, Plus,
  Search, BarChart3, Server, Database, Lock, Bell, FileText, UserCog,
  TrendingUp, CheckCircle2, AlertTriangle, RefreshCw, Globe,
  UserPlus, Clock, Monitor, HardDrive, Mail, Download,
  Power, PowerOff, Save, ChevronLeft, ChevronRight,
} from 'lucide-react'

// ─── Animation ──────────────────────────────────────────────────
const fade = { hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0, transition: { duration: 0.25 } } }
const stagger = { visible: { transition: { staggerChildren: 0.04 } } }

// ─── Data Types ─────────────────────────────────────────────────
interface Tenant { id: string; name: string; nameEn: string; plan: string; bookings: number; revenue: number; users: number; status: string; createdAt: string; country: string; email: string }
interface PlatformUser { id: string; name: string; email: string; tenant: string; role: string; status: string; lastLogin: string }
interface SysLog { id: string; level: string; source: string; message: string; timestamp: string }

// ─── Mock Data ──────────────────────────────────────────────────
const TENANTS: Tenant[] = [
  { id: '1', name: 'مركز النور الطبي', nameEn: 'Al Noor Medical', plan: 'Enterprise', bookings: 1250, revenue: 187500, users: 12, status: 'active', createdAt: '2025-01-15', country: 'السعودية', email: 'info@alnoor.sa' },
  { id: '2', name: 'صالون ياسمين', nameEn: 'Yasmin Beauty', plan: 'Professional', bookings: 680, revenue: 54200, users: 8, status: 'active', createdAt: '2025-02-20', country: 'السعودية', email: 'info@yasmin.sa' },
  { id: '3', name: 'أكاديمية المستقبل', nameEn: 'Future Academy', plan: 'Professional', bookings: 420, revenue: 38000, users: 6, status: 'active', createdAt: '2025-03-10', country: 'الإمارات', email: 'info@future-edu.sa' },
  { id: '4', name: 'عيادة الابتسامة', nameEn: 'Smile Clinic', plan: 'Starter', bookings: 45, revenue: 0, users: 2, status: 'trial', createdAt: '2025-06-01', country: 'مصر', email: 'info@smile.eg' },
  { id: '5', name: 'نادي اللياقة الذهبية', nameEn: 'Golden Fitness', plan: 'Professional', bookings: 310, revenue: 22000, users: 5, status: 'suspended', createdAt: '2025-01-28', country: 'الأردن', email: 'info@goldenfit.jo' },
  { id: '6', name: 'مركز التجميل الملكي', nameEn: 'Royal Beauty', plan: 'Enterprise', bookings: 920, revenue: 145000, users: 15, status: 'active', createdAt: '2025-02-01', country: 'السعودية', email: 'info@royalbeauty.sa' },
  { id: '7', name: 'عيادة العيون المتقدمة', nameEn: 'Advanced Eye Clinic', plan: 'Business', bookings: 580, revenue: 72000, users: 10, status: 'active', createdAt: '2025-01-20', country: 'السعودية', email: 'info@adv-eye.sa' },
  { id: '8', name: 'مركز اللياقة البدنية', nameEn: 'Fit Life Center', plan: 'Starter', bookings: 120, revenue: 5990, users: 3, status: 'active', createdAt: '2025-04-15', country: 'الإمارات', email: 'info@fitlife.ae' },
]

const ALL_USERS: PlatformUser[] = [
  { id: '1', name: 'أحمد المنصور', email: 'ahmed@alnoor.sa', tenant: 'مركز النور الطبي', role: 'مالك', status: 'active', lastLogin: '2025-06-18T14:00:00Z' },
  { id: '2', name: 'سارة العتيبي', email: 'sara@yasmin.sa', tenant: 'صالون ياسمين', role: 'مدير', status: 'active', lastLogin: '2025-06-18T12:30:00Z' },
  { id: '3', name: 'محمد القحطاني', email: 'mohammed@royalbeauty.sa', tenant: 'مركز التجميل الملكي', role: 'مالك', status: 'suspended', lastLogin: '2025-06-17T09:00:00Z' },
  { id: '4', name: 'فاطمة الحربي', email: 'fatima@alnoor.sa', tenant: 'مركز النور الطبي', role: 'موظف استقبال', status: 'active', lastLogin: '2025-06-18T10:30:00Z' },
  { id: '5', name: 'خالد الدوسري', email: 'khaled@future-edu.sa', tenant: 'أكاديمية المستقبل', role: 'مالك', status: 'active', lastLogin: '2025-06-17T16:00:00Z' },
  { id: '6', name: 'نورة القحطاني', email: 'noura@royalbeauty.sa', tenant: 'مركز التجميل الملكي', role: 'مدير', status: 'active', lastLogin: '2025-06-18T09:15:00Z' },
  { id: '7', name: 'عبدالله الشمري', email: 'abdullah@adv-eye.sa', tenant: 'عيادة العيون المتقدمة', role: 'مالك', status: 'active', lastLogin: '2025-06-18T11:20:00Z' },
  { id: '8', name: 'ريم السبيعي', email: 'reem@smile-clinic.com', tenant: 'عيادة الابتسامة', role: 'مالك', status: 'active', lastLogin: '2025-06-16T15:00:00Z' },
]

const LOGS: SysLog[] = [
  { id: '1', level: 'success', source: 'الدفع', message: 'دفعة ناجحة: 999 ر.س — Enterprise — مركز النور الطبي', timestamp: '2025-06-18T14:15:00Z' },
  { id: '2', level: 'info', source: 'المستأجرين', message: 'تسجيل مستأجر جديد: عيادة الابتسامة (Trial)', timestamp: '2025-06-18T14:10:00Z' },
  { id: '3', level: 'warn', source: 'النظام', message: 'استخدام الذاكرة تجاوز 80% على الخادم #3', timestamp: '2025-06-18T13:55:00Z' },
  { id: '4', level: 'info', source: 'المستخدمين', message: 'ترقية خطة صالون ياسمين من Starter إلى Professional', timestamp: '2025-06-18T13:45:00Z' },
  { id: '5', level: 'error', source: 'الدفع', message: 'فشل عملية دفع: بطاقة مسربة — نادي اللياقة الذهبية', timestamp: '2025-06-18T12:30:00Z' },
  { id: '6', level: 'success', source: 'النظام', message: 'اكتمل النسخ الاحتياطي اليومي بنجاح (2.4 GB)', timestamp: '2025-06-18T06:00:00Z' },
  { id: '7', level: 'info', source: 'الأمان', message: 'تعليق حساب محمد العتيبي — 3 محاولات فاشلة', timestamp: '2025-06-18T11:00:00Z' },
  { id: '8', level: 'warn', source: 'النظام', message: 'القرص على الخادم #2 عند 85%', timestamp: '2025-06-18T10:20:00Z' },
  { id: '9', level: 'info', source: 'المستأجرين', message: 'تم تفعيل حساب نادي اللياقة الذهبية', timestamp: '2025-06-18T09:00:00Z' },
  { id: '10', level: 'error', source: 'API', message: 'خطأ 500 على /api/bookings — مهلة الطلب', timestamp: '2025-06-18T08:30:00Z' },
  { id: '11', level: 'success', source: 'الدفع', message: 'دفعة ناجحة: 599 ر.س — Business — عيادة العيون المتقدمة', timestamp: '2025-06-18T07:45:00Z' },
  { id: '12', level: 'info', source: 'النظام', message: 'تحديث النظام إلى الإصدار 2.4.1', timestamp: '2025-06-18T03:00:00Z' },
]

const PLANS = [
  { id: '1', name: 'Free', nameAr: 'مجاني', price: 0, tenants: 0, features: ['حجز واحد', 'تقويم أساسي', 'دعم بالبريد'], color: 'bg-gray-500', popular: false },
  { id: '2', name: 'Starter', nameAr: 'أساسي', price: 99, tenants: 15, features: ['50 حجز/شهر', '3 موظفين', 'تقارير أساسية', 'دعم بالبريد'], color: 'bg-sky-500', popular: false },
  { id: '3', name: 'Professional', nameAr: 'احترافي', price: 299, tenants: 120, features: ['حجوزات غير محدودة', '10 موظفين', 'تقارير متقدمة', 'دعم على مدار الساعة'], color: 'bg-violet-500', popular: true },
  { id: '4', name: 'Business', nameAr: 'أعمال', price: 599, tenants: 60, features: ['كل ميزات الاحترافي', '25 موظف', 'API وصول', 'مدير مخصص'], color: 'bg-indigo-500', popular: false },
  { id: '5', name: 'Enterprise', nameAr: 'مؤسسي', price: 999, tenants: 45, features: ['كل الميزات', 'موظفون غير محدودون', 'SLA مخصص', 'نشر خاص'], color: 'bg-emerald-500', popular: false },
]

const ROLES = [
  { id: '1', name: 'مدير النظام', nameEn: 'Super Admin', users: 1, permissions: 20, description: 'صلاحيات كاملة على المنصة' },
  { id: '2', name: 'مالك المستأجر', nameEn: 'Tenant Owner', users: 8, permissions: 18, description: 'صلاحيات كاملة على المستأجر' },
  { id: '3', name: 'مدير الفرع', nameEn: 'Branch Manager', users: 15, permissions: 14, description: 'إدارة الفرع والموظفين' },
  { id: '4', name: 'موظف استقبال', nameEn: 'Receptionist', users: 42, permissions: 8, description: 'إدارة الحجوزات والعملاء' },
  { id: '5', name: 'محاسب', nameEn: 'Accountant', users: 6, permissions: 10, description: 'عرض التقارير والفواتير' },
]

const SERVERS = [
  { id: '1', name: 'API Server #1', region: 'الرياض', status: 'healthy', cpu: 45, memory: 62, disk: 40, uptime: '99.98%', requests: '12.5K/min' },
  { id: '2', name: 'API Server #2', region: 'جدة', status: 'healthy', cpu: 38, memory: 55, disk: 35, uptime: '99.95%', requests: '8.2K/min' },
  { id: '3', name: 'Worker Server', region: 'الرياض', status: 'warning', cpu: 82, memory: 85, disk: 60, uptime: '99.80%', requests: '3.1K/min' },
  { id: '4', name: 'CDN Edge', region: 'دبي', status: 'healthy', cpu: 12, memory: 30, disk: 20, uptime: '100%', requests: '45K/min' },
]

const INVOICES = [
  { id: 'INV-001', tenant: 'مركز النور الطبي', amount: 999, status: 'paid', date: '2025-06-01', plan: 'Enterprise' },
  { id: 'INV-002', tenant: 'صالون ياسمين', amount: 299, status: 'paid', date: '2025-06-01', plan: 'Professional' },
  { id: 'INV-003', tenant: 'أكاديمية المستقبل', amount: 299, status: 'pending', date: '2025-06-01', plan: 'Professional' },
  { id: 'INV-004', tenant: 'عيادة العيون المتقدمة', amount: 599, status: 'paid', date: '2025-06-01', plan: 'Business' },
  { id: 'INV-005', tenant: 'مركز التجميل الملكي', amount: 999, status: 'overdue', date: '2025-05-01', plan: 'Enterprise' },
  { id: 'INV-006', tenant: 'نادي اللياقة الذهبية', amount: 299, status: 'failed', date: '2025-06-01', plan: 'Professional' },
]

// ─── Shared Helpers ─────────────────────────────────────────────
const STATUS_MAP: Record<string, { cls: string; label: string }> = {
  active: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800', label: 'نشط' },
  suspended: { cls: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800', label: 'معلق' },
  trial: { cls: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800', label: 'تجريبي' },
  inactive: { cls: 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800/40 dark:text-gray-400', label: 'غير نشط' },
  paid: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400', label: 'مدفوع' },
  pending: { cls: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400', label: 'معلق' },
  overdue: { cls: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400', label: 'متأخر' },
  failed: { cls: 'bg-red-50 text-red-600 border-red-200 dark:bg-red-950/40 dark:text-red-500', label: 'فاشل' },
  healthy: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400', label: 'سليم' },
  warning: { cls: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400', label: 'تحذير' },
  critical: { cls: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400', label: 'حرج' },
}

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_MAP[status]
  if (!s) return null
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold leading-none ${s.cls}`}>{s.label}</span>
}

const LOG_COLORS: Record<string, string> = {
  info: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-400',
  warn: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
  error: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
  success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
}

const LOG_LABELS: Record<string, string> = {
  info: 'معلومة',
  warn: 'تحذير',
  error: 'خطأ',
  success: 'نجاح',
}

function LogDot({ level }: { level: string }) {
  return <span className={`inline-flex h-2 w-2 rounded-full shrink-0 mt-1.5 ${LOG_COLORS[level] || ''}`} />
}

function PageTitle({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight">{title}</h2>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

function ConfirmDialog({ open, onOpenChange, title, desc, onConfirm, danger }: {
  open: boolean; onOpenChange: (v: boolean) => void; title: string; desc: string; onConfirm: () => void; danger?: boolean
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="text-base">{title}</DialogTitle>
          <DialogDescription className="text-sm leading-relaxed">{desc}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-3 sm:gap-0 pt-2">
          <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>إلغاء</Button>
          <Button className={`flex-1 ${danger ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-violet-600 hover:bg-violet-700'}`} onClick={() => { onConfirm(); onOpenChange(false) }}>تأكيد</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-2"><label className="text-sm font-medium text-foreground">{label}</label>{children}</div>
}

function Toggle({ on, onToggle, color }: { on: boolean; onToggle: () => void; color?: string }) {
  const bg = color === 'amber' ? (on ? 'bg-amber-500' : 'bg-muted') : (on ? 'bg-violet-600' : 'bg-muted')
  return (
    <div onClick={onToggle} className={'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors cursor-pointer ' + bg}>
      <span className={'inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ' + (on ? 'translate-x-5' : 'translate-x-0.5')}></span>
    </div>
  )
}

function KpiCard({ icon: Icon, bg, label, value, sub, trend, delay = 0 }: {
  icon: React.ElementType; bg: string; label: string; value: string | number; sub?: string | null; trend?: number; delay?: number
}) {
  return (
    <motion.div variants={fade} initial="hidden" animate="visible" transition={{ delay }}>
      <Card className="overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1.5 min-w-0">
              <p className="text-xs text-muted-foreground font-medium">{label}</p>
              <p className="text-2xl font-bold tracking-tight">{value}</p>
              {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
            </div>
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${bg}`}>
              <Icon className="h-5 w-5 text-white" />
            </div>
          </div>
          {trend !== undefined && (
            <div className="flex items-center gap-1 mt-3 pt-3 border-t text-xs font-medium">
              {trend >= 0
                ? <><ArrowUpRight className="h-3.5 w-3.5 text-emerald-600" /><span className="text-emerald-600">+{trend}%</span></>
                : <><ArrowDownRight className="h-3.5 w-3.5 text-red-500" /><span className="text-red-500">{trend}%</span></>
              }
              <span className="text-muted-foreground ms-1">مقارنة بالشهر السابق</span>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

function ActionButton({ icon: Icon, label, onClick, variant = 'ghost', danger }: {
  icon: React.ElementType; label?: string; onClick: () => void; variant?: 'ghost' | 'outline'; danger?: boolean
}) {
  return (
    <Button
      size={label ? 'sm' : 'icon'}
      variant={variant}
      className={`h-8 gap-1.5 text-xs ${danger ? 'text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30' : ''} ${!label ? 'w-8' : ''}`}
      onClick={onClick}
    >
      <Icon className="h-3.5 w-3.5" />
      {label && <span className="hidden sm:inline">{label}</span>}
    </Button>
  )
}

function StatCard({ icon: Icon, label, value, color }: {
  icon: React.ElementType; label: string; value: string; color: string
}) {
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${color}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] sm:text-xs text-muted-foreground font-medium">{label}</p>
            <p className="text-base sm:text-lg font-bold truncate">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function EmptyRow({ colSpan, message }: { colSpan: number; message?: string }) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="h-40">
        <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
          <Search className="h-8 w-8 opacity-30" />
          <p className="text-sm font-medium">{message || 'لا توجد نتائج'}</p>
        </div>
      </TableCell>
    </TableRow>
  )
}

// ─── PAGE 1: OVERVIEW ──────────────────────────────────────────
function OverviewPage() {
  const { locale } = useAppStore()
  const totalRevenue = TENANTS.reduce((s, t) => s + t.revenue, 0)
  const totalBookings = TENANTS.reduce((s, t) => s + t.bookings, 0)
  const activeCount = TENANTS.filter(t => t.status === 'active').length

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard icon={Building2} bg="bg-violet-600" label="إجمالي المستأجرين" value={TENANTS.length} sub={`${activeCount} نشط`} trend={12} delay={0} />
        <KpiCard icon={Users} bg="bg-sky-600" label="إجمالي المستخدمين" value={ALL_USERS.length} sub={null} trend={8} delay={0.04} />
        <KpiCard icon={DollarSign} bg="bg-amber-500" label="الإيرادات (ر.س)" value={`${(totalRevenue / 1000).toFixed(0)}K`} sub="هذا الشهر" trend={18} delay={0.08} />
        <KpiCard icon={CalendarDays} bg="bg-emerald-600" label="إجمالي الحجوزات" value={totalBookings.toLocaleString()} sub="آخر 30 يوم" trend={5} delay={0.12} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
        {/* Revenue by Plan */}
        <motion.div variants={fade} initial="hidden" animate="visible" transition={{ delay: 0.15 }} className="xl:col-span-2">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm sm:text-base font-semibold">الإيرادات حسب الباقة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {PLANS.filter(p => p.price > 0).map(p => {
                const rev = TENANTS.filter(t => t.plan === p.name).reduce((s, t) => s + t.revenue, 0)
                const pct = totalRevenue > 0 ? Math.round(rev / totalRevenue * 100) : 0
                return (
                  <div key={p.id} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{p.name}</span>
                      <span className="text-muted-foreground tabular-nums text-xs sm:text-sm">{rev.toLocaleString()} ر.س</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                      <div className={`h-full rounded-full ${p.color} transition-all duration-700`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Activity */}
        <motion.div variants={fade} initial="hidden" animate="visible" transition={{ delay: 0.2 }}>
          <Card className="border-0 shadow-sm h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm sm:text-base font-semibold">آخر النشاطات</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {LOGS.slice(0, 6).map(l => (
                  <div key={l.id} className="flex gap-3 rounded-lg px-2.5 py-2 hover:bg-muted/50 transition-colors">
                    <LogDot level={l.level} />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm leading-relaxed line-clamp-2">{l.message}</p>
                      <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-0.5">{l.source}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Active Tenants Grid */}
      <motion.div variants={fade} initial="hidden" animate="visible" transition={{ delay: 0.25 }}>
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-sm sm:text-base font-semibold">المستأجرون النشطون</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
              {TENANTS.filter(t => t.status === 'active').slice(0, 6).map(t => (
                <button key={t.id} className="flex items-center gap-3 rounded-xl border p-3 text-start hover:bg-accent/50 transition-colors group" onClick={() => toast.info(`تفاصيل: ${t.name}`)}>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/30 text-violet-600 font-bold text-sm">{t.name.charAt(0)}</div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.plan} · {t.bookings.toLocaleString()} حجز</p>
                  </div>
                  <ChevronLeft className="h-4 w-4 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

// ─── PAGE 2: TENANTS ───────────────────────────────────────────
function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>(TENANTS)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [dlg, setDlg] = useState<{ type: string; tenant?: Tenant } | null>(null)
  const [form, setForm] = useState({ name: '', nameEn: '', email: '', country: '', plan: 'Starter' })

  const filtered = useMemo(() => {
    let list = [...tenants]
    if (filter !== 'all') list = list.filter(t => t.status === filter)
    if (search) { const q = search.toLowerCase(); list = list.filter(t => t.name.includes(q) || t.nameEn.toLowerCase().includes(q) || t.email.toLowerCase().includes(q)) }
    return list
  }, [tenants, search, filter])

  const handleSave = useCallback(() => {
    if (!form.name.trim()) { toast.error('يرجى إدخال اسم المستأجر'); return }
    if (dlg?.type === 'add') {
      const n: Tenant = { id: Date.now().toString(), ...form, bookings: 0, revenue: 0, users: 1, status: 'trial', createdAt: new Date().toISOString().split('T')[0] }
      setTenants(p => [n, ...p]); toast.success(`تم إضافة: ${form.name}`)
    } else if (dlg?.tenant) {
      setTenants(p => p.map(t => t.id === dlg.tenant!.id ? { ...t, ...form } : t)); toast.success('تم التحديث')
    }
    setDlg(null)
  }, [form, dlg])

  return (
    <div className="space-y-5">
      <PageTitle title="إدارة المستأجرين" action={<Button className="gap-2 bg-violet-600 hover:bg-violet-700 text-white" onClick={() => { setForm({ name: '', nameEn: '', email: '', country: '', plan: 'Starter' }); setDlg({ type: 'add' }) }}><Plus className="h-4 w-4" />إضافة مستأجر</Button>} />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="بحث بالاسم أو البريد الإلكتروني..." value={search} onChange={e => setSearch(e.target.value)} className="ps-10 h-10" />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-full sm:w-44 h-10"><SelectValue placeholder="الحالة" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الحالات</SelectItem>
            <SelectItem value="active">نشط</SelectItem>
            <SelectItem value="trial">تجريبي</SelectItem>
            <SelectItem value="suspended">معلق</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Desktop Table */}
      <Card className="border-0 shadow-sm overflow-hidden hidden md:block">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="ps-5 font-semibold text-xs uppercase tracking-wider">المستأجر</TableHead>
                <TableHead className="px-3 font-semibold text-xs uppercase tracking-wider">الباقة</TableHead>
                <TableHead className="px-3 font-semibold text-xs uppercase tracking-wider text-end">الحجوزات</TableHead>
                <TableHead className="px-3 font-semibold text-xs uppercase tracking-wider text-end">الإيرادات</TableHead>
                <TableHead className="px-3 font-semibold text-xs uppercase tracking-wider">الحالة</TableHead>
                <TableHead className="pe-5 font-semibold text-xs uppercase tracking-wider text-end">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <EmptyRow colSpan={6} />
              ) : filtered.map(t => (
                <TableRow key={t.id} className="group hover:bg-muted/20 transition-colors">
                  <TableCell className="ps-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/30 text-violet-600 font-bold text-xs">{t.name.charAt(0)}</div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate max-w-[200px]">{t.name}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[200px]" dir="ltr">{t.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-3"><Badge variant="secondary" className="font-medium text-xs">{t.plan}</Badge></TableCell>
                  <TableCell className="px-3 text-end tabular-nums text-sm">{t.bookings.toLocaleString()}</TableCell>
                  <TableCell className="px-3 text-end font-semibold tabular-nums text-sm">{t.revenue.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">ر.س</span></TableCell>
                  <TableCell className="px-3"><StatusBadge status={t.status} /></TableCell>
                  <TableCell className="pe-5">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ActionButton icon={Eye} label="عرض" onClick={() => toast.info(`عرض: ${t.name}`)} />
                      <ActionButton icon={Edit} label="تعديل" onClick={() => { setForm({ name: t.name, nameEn: t.nameEn, email: t.email, country: t.country, plan: t.plan }); setDlg({ type: 'edit', tenant: t }) }} />
                      <ActionButton icon={Trash2} onClick={() => setDlg({ type: 'delete', tenant: t })} danger />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="border-t px-5 py-3 text-xs text-muted-foreground bg-muted/20">
          عرض {filtered.length} من {tenants.length} مستأجر
        </div>
      </Card>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {filtered.length === 0 ? (
          <Card className="border-0 shadow-sm"><CardContent className="py-16 text-center text-muted-foreground text-sm">لا توجد نتائج</CardContent></Card>
        ) : filtered.map(t => (
          <Card key={t.id} className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/30 text-violet-600 font-bold text-sm">{t.name.charAt(0)}</div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{t.name}</p>
                    <p className="text-xs text-muted-foreground truncate" dir="ltr">{t.email}</p>
                  </div>
                </div>
                <StatusBadge status={t.status} />
              </div>
              <div className="grid grid-cols-3 gap-3 mb-3 text-center">
                <div className="rounded-lg bg-muted/50 p-2"><p className="text-[10px] text-muted-foreground">الباقة</p><p className="text-xs font-semibold mt-0.5">{t.plan}</p></div>
                <div className="rounded-lg bg-muted/50 p-2"><p className="text-[10px] text-muted-foreground">الحجوزات</p><p className="text-xs font-semibold mt-0.5 tabular-nums">{t.bookings.toLocaleString()}</p></div>
                <div className="rounded-lg bg-muted/50 p-2"><p className="text-[10px] text-muted-foreground">الإيرادات</p><p className="text-xs font-semibold mt-0.5 tabular-nums">{t.revenue.toLocaleString()}</p></div>
              </div>
              <div className="flex items-center justify-end gap-1 pt-2 border-t">
                <ActionButton icon={Eye} label="عرض" onClick={() => toast.info(`عرض: ${t.name}`)} />
                <ActionButton icon={Edit} label="تعديل" onClick={() => { setForm({ name: t.name, nameEn: t.nameEn, email: t.email, country: t.country, plan: t.plan }); setDlg({ type: 'edit', tenant: t }) }} />
                <ActionButton icon={Trash2} onClick={() => setDlg({ type: 'delete', tenant: t })} danger />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dialogs */}
      <Dialog open={dlg?.type === 'add' || dlg?.type === 'edit'} onOpenChange={() => setDlg(null)}>
        <DialogContent className="max-w-md"><DialogHeader><DialogTitle>{dlg?.type === 'add' ? 'إضافة مستأجر' : 'تعديل المستأجر'}</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <FormField label="الاسم (عربي)"><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></FormField>
            <FormField label="الاسم (إنجليزي)"><Input value={form.nameEn} onChange={e => setForm(p => ({ ...p, nameEn: e.target.value }))} dir="ltr" /></FormField>
            <FormField label="البريد الإلكتروني"><Input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} dir="ltr" /></FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="البلد"><Input value={form.country} onChange={e => setForm(p => ({ ...p, country: e.target.value }))} /></FormField>
              <FormField label="الباقة"><Select value={form.plan} onValueChange={v => setForm(p => ({ ...p, plan: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{PLANS.map(p => <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>)}</SelectContent></Select></FormField>
            </div>
          </div>
          <DialogFooter className="pt-4 gap-3"><Button variant="outline" onClick={() => setDlg(null)}>إلغاء</Button><Button className="bg-violet-600 hover:bg-violet-700 text-white" onClick={handleSave}>حفظ</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <ConfirmDialog open={dlg?.type === 'delete'} onOpenChange={() => setDlg(null)} title="حذف المستأجر" desc={`هل أنت متأكد من حذف "${dlg?.tenant?.name}"؟ لا يمكن التراجع عن هذا الإجراء.`} onConfirm={() => { setTenants(p => p.filter(t => t.id !== dlg?.tenant!.id)); toast.success('تم الحذف') }} danger />
    </div>
  )
}

// ─── PAGE 3: USERS ────────────────────────────────────────────
function UsersPage() {
  const [users, setUsers] = useState<PlatformUser[]>(ALL_USERS)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [dlg, setDlg] = useState<{ type: string; user?: PlatformUser } | null>(null)
  const [form, setForm] = useState({ name: '', email: '', tenant: '', role: 'موظف' })

  const filtered = useMemo(() => {
    let list = [...users]
    if (filter !== 'all') list = list.filter(u => u.status === filter)
    if (search) { const q = search.toLowerCase(); list = list.filter(u => u.name.includes(q) || u.email.toLowerCase().includes(q) || u.tenant.includes(q)) }
    return list
  }, [users, search, filter])

  const handleSave = useCallback(() => {
    if (!form.name.trim() || !form.email.trim()) { toast.error('يرجى إدخال الاسم والبريد'); return }
    if (dlg?.type === 'add') {
      setUsers(p => [{ id: Date.now().toString(), ...form, status: 'active', lastLogin: new Date().toISOString() }, ...p]); toast.success(`تم إضافة: ${form.name}`)
    } else if (dlg?.user) {
      setUsers(p => p.map(u => u.id === dlg.user!.id ? { ...u, ...form } : u)); toast.success('تم التحديث')
    }
    setDlg(null)
  }, [form, dlg])

  return (
    <div className="space-y-5">
      <PageTitle title="إدارة المستخدمين" action={<Button className="gap-2 bg-violet-600 hover:bg-violet-700 text-white" onClick={() => { setForm({ name: '', email: '', tenant: '', role: 'موظف' }); setDlg({ type: 'add' }) }}><UserPlus className="h-4 w-4" />إضافة مستخدم</Button>} />

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="بحث بالاسم أو البريد..." value={search} onChange={e => setSearch(e.target.value)} className="ps-10 h-10" />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-full sm:w-44 h-10"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">الكل</SelectItem><SelectItem value="active">نشط</SelectItem><SelectItem value="suspended">معلق</SelectItem></SelectContent>
        </Select>
      </div>

      {/* Desktop Table */}
      <Card className="border-0 shadow-sm overflow-hidden hidden md:block">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader><TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="ps-5 font-semibold text-xs uppercase tracking-wider">المستخدم</TableHead>
              <TableHead className="px-3 font-semibold text-xs uppercase tracking-wider">البريد</TableHead>
              <TableHead className="px-3 font-semibold text-xs uppercase tracking-wider">المستأجر</TableHead>
              <TableHead className="px-3 font-semibold text-xs uppercase tracking-wider">الدور</TableHead>
              <TableHead className="px-3 font-semibold text-xs uppercase tracking-wider">الحالة</TableHead>
              <TableHead className="pe-5 font-semibold text-xs uppercase tracking-wider text-end">إجراءات</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {filtered.length === 0 ? <EmptyRow colSpan={6} /> : filtered.map(u => (
                <TableRow key={u.id} className="group hover:bg-muted/20 transition-colors">
                  <TableCell className="ps-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-100 dark:bg-sky-900/30 text-sky-600 font-bold text-xs">{u.name.charAt(0)}</div>
                      <span className="font-medium text-sm">{u.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-3 text-sm text-muted-foreground" dir="ltr">{u.email}</TableCell>
                  <TableCell className="px-3 text-sm">{u.tenant}</TableCell>
                  <TableCell className="px-3"><Badge variant="secondary" className="text-xs">{u.role}</Badge></TableCell>
                  <TableCell className="px-3"><StatusBadge status={u.status} /></TableCell>
                  <TableCell className="pe-5">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ActionButton icon={Edit} label="تعديل" onClick={() => { setForm({ name: u.name, email: u.email, tenant: u.tenant, role: u.role }); setDlg({ type: 'edit', user: u }) }} />
                      <ActionButton icon={u.status === 'suspended' ? Power : PowerOff} label={u.status === 'suspended' ? 'تفعيل' : 'تعليق'} onClick={() => setDlg({ type: 'suspend', user: u })} />
                      <ActionButton icon={Trash2} onClick={() => setDlg({ type: 'delete', user: u })} danger />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="border-t px-5 py-3 text-xs text-muted-foreground bg-muted/20">عرض {filtered.length} من {users.length} مستخدم</div>
      </Card>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {filtered.length === 0 ? (
          <Card className="border-0 shadow-sm"><CardContent className="py-16 text-center text-muted-foreground text-sm">لا توجد نتائج</CardContent></Card>
        ) : filtered.map(u => (
          <Card key={u.id} className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-100 dark:bg-sky-900/30 text-sky-600 font-bold text-sm">{u.name.charAt(0)}</div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{u.name}</p>
                    <p className="text-xs text-muted-foreground truncate" dir="ltr">{u.email}</p>
                  </div>
                </div>
                <StatusBadge status={u.status} />
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="rounded-lg bg-muted/50 p-2"><p className="text-[10px] text-muted-foreground">المستأجر</p><p className="text-xs font-semibold mt-0.5 truncate">{u.tenant}</p></div>
                <div className="rounded-lg bg-muted/50 p-2"><p className="text-[10px] text-muted-foreground">الدور</p><p className="text-xs font-semibold mt-0.5">{u.role}</p></div>
              </div>
              <div className="flex items-center justify-end gap-1 pt-2 border-t">
                <ActionButton icon={Edit} label="تعديل" onClick={() => { setForm({ name: u.name, email: u.email, tenant: u.tenant, role: u.role }); setDlg({ type: 'edit', user: u }) }} />
                <ActionButton icon={Trash2} onClick={() => setDlg({ type: 'delete', user: u })} danger />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={dlg?.type === 'add' || dlg?.type === 'edit'} onOpenChange={() => setDlg(null)}>
        <DialogContent className="max-w-md"><DialogHeader><DialogTitle>{dlg?.type === 'add' ? 'إضافة مستخدم' : 'تعديل المستخدم'}</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <FormField label="الاسم"><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></FormField>
            <FormField label="البريد الإلكتروني"><Input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} dir="ltr" /></FormField>
            <FormField label="المستأجر"><Input value={form.tenant} onChange={e => setForm(p => ({ ...p, tenant: e.target.value }))} /></FormField>
            <FormField label="الدور"><Select value={form.role} onValueChange={v => setForm(p => ({ ...p, role: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{['مالك','مدير','موظف استقبال','محاسب'].map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select></FormField>
          </div>
          <DialogFooter className="pt-4 gap-3"><Button variant="outline" onClick={() => setDlg(null)}>إلغاء</Button><Button className="bg-violet-600 hover:bg-violet-700 text-white" onClick={handleSave}>حفظ</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <ConfirmDialog open={dlg?.type === 'delete'} onOpenChange={() => setDlg(null)} title="حذف المستخدم" desc={`حذف "${dlg?.user?.name}"؟`} onConfirm={() => { setUsers(p => p.filter(u => u.id !== dlg?.user!.id)); toast.success('تم الحذف') }} danger />
      <ConfirmDialog open={dlg?.type === 'suspend'} onOpenChange={() => setDlg(null)} title="تغيير الحالة" desc={`${dlg?.user?.status === 'suspended' ? 'تفعيل' : 'تعليق'} "${dlg?.user?.name}"`} onConfirm={() => { setUsers(p => p.map(u => u.id === dlg?.user!.id ? { ...u, status: u.status === 'suspended' ? 'active' : 'suspended' } : u)); toast.success('تم التحديث') }} />
    </div>
  )
}

// ─── PAGE 4: PLANS ─────────────────────────────────────────────
function PlansPage() {
  const [detailPlan, setDetailPlan] = useState<typeof PLANS[0] | null>(null)
  return (
    <div className="space-y-6">
      <PageTitle title="الباقات والاشتراكات" action={<Button className="gap-2 bg-violet-600 hover:bg-violet-700 text-white" onClick={() => toast.success('سيتم فتح نموذج إنشاء باقة جديدة')}><Plus className="h-4 w-4" />إنشاء باقة</Button>} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-5">
        {PLANS.map((p, i) => (
          <motion.div key={p.id} variants={fade} initial="hidden" animate="visible" transition={{ delay: i * 0.04 }}>
            <Card className={`h-full flex flex-col transition-all hover:shadow-lg cursor-pointer border-0 shadow-sm ${p.popular ? 'ring-2 ring-violet-500 shadow-violet-500/10' : ''}`} onClick={() => setDetailPlan(p)}>
              <CardContent className="flex-1 flex flex-col items-center p-5 sm:p-6 pt-7">
                {p.popular && <Badge className="bg-violet-600 text-white mb-3 -mt-1 text-[10px]">الأكثر شعبية</Badge>}
                <div className={`h-12 w-12 rounded-2xl ${p.color} flex items-center justify-center mb-4 shadow-lg`}><CreditCard className="h-6 w-6 text-white" /></div>
                <h3 className="font-bold text-base">{p.name}</h3>
                <p className="text-3xl font-extrabold mt-3 mb-1">{p.price > 0 ? `${p.price}` : 'مجاني'}</p>
                <p className="text-xs text-muted-foreground mb-5">{p.price > 0 ? 'ر.س / شهر' : ''} · {p.tenants} مستأجر</p>
                <Separator className="w-full mb-5" />
                <ul className="space-y-2.5 w-full text-start flex-1">{p.features.map((f, j) => (
                  <li key={j} className="flex items-start gap-2 text-xs sm:text-sm"><CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" /><span>{f}</span></li>
                ))}</ul>
                <Button className={`w-full mt-6 ${p.popular ? 'bg-violet-600 hover:bg-violet-700 text-white' : ''}`} variant={p.popular ? 'default' : 'outline'}>إدارة الباقة</Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
      <Dialog open={!!detailPlan} onOpenChange={() => setDetailPlan(null)}>
        <DialogContent className="max-w-sm"><DialogHeader><DialogTitle>{detailPlan?.name}</DialogTitle></DialogHeader>
          {detailPlan && <div className="space-y-4 pt-2">
            <div className="text-center"><p className="text-3xl font-extrabold">{detailPlan.price > 0 ? `${detailPlan.price} ر.س` : 'مجاني'}</p><p className="text-sm text-muted-foreground mt-1">شهرياً · {detailPlan.tenants} مستأجر</p></div>
            <Separator />
            <ul className="space-y-2">{detailPlan.features.map((f, i) => (<li key={i} className="flex items-center gap-2 text-sm"><CheckCircle2 className="h-4 w-4 text-emerald-500" />{f}</li>))}</ul>
          </div>}
          <DialogFooter><Button variant="outline" onClick={() => setDetailPlan(null)}>إغلاق</Button><Button className="bg-violet-600 hover:bg-violet-700 text-white" onClick={() => { toast.success('سيتم فتح تعديل الباقة'); setDetailPlan(null) }}>تعديل</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── PAGE 5: BILLING ───────────────────────────────────────────
function BillingPage() {
  const [filter, setFilter] = useState('all')
  const filtered = useMemo(() => filter === 'all' ? INVOICES : INVOICES.filter(i => i.status === filter), [filter])
  const totalPaid = INVOICES.filter(i => i.status === 'paid').reduce((s, i) => s + i.amount, 0)
  const totalPending = INVOICES.filter(i => i.status === 'pending' || i.status === 'overdue').reduce((s, i) => s + i.amount, 0)

  return (
    <div className="space-y-5">
      <PageTitle title="الفواتير والمدفوعات" action={<Button className="gap-2 bg-violet-600 hover:bg-violet-700 text-white" onClick={() => toast.success('سيتم إنشاء فاتورة جديدة')}><Plus className="h-4 w-4" />إنشاء فاتورة</Button>} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard icon={CheckCircle2} label="المدفوعات" value={`${totalPaid.toLocaleString()} ر.س`} color="text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30" />
        <StatCard icon={Clock} label="المعلقات" value={`${totalPending.toLocaleString()} ر.س`} color="text-amber-600 bg-amber-50 dark:bg-amber-950/30" />
        <StatCard icon={DollarSign} label="مدفوعة" value={`${INVOICES.filter(i => i.status === 'paid').length}`} color="text-sky-600 bg-sky-50 dark:bg-sky-950/30" />
        <StatCard icon={AlertTriangle} label="متأخرة" value={`${INVOICES.filter(i => i.status === 'overdue').length}`} color="text-red-600 bg-red-50 dark:bg-red-950/30" />
      </div>
      <div className="flex gap-3">
        <Select value={filter} onValueChange={setFilter}><SelectTrigger className="w-44 h-10"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">الكل</SelectItem><SelectItem value="paid">مدفوع</SelectItem><SelectItem value="pending">معلق</SelectItem><SelectItem value="overdue">متأخر</SelectItem><SelectItem value="failed">فاشل</SelectItem></SelectContent></Select>
      </div>

      {/* Desktop Table */}
      <Card className="border-0 shadow-sm overflow-hidden hidden sm:block">
        <div className="overflow-x-auto">
          <Table><TableHeader><TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="ps-5 font-semibold text-xs uppercase tracking-wider">رقم الفاتورة</TableHead>
            <TableHead className="px-3 font-semibold text-xs uppercase tracking-wider">المستأجر</TableHead>
            <TableHead className="px-3 font-semibold text-xs uppercase tracking-wider hidden md:table-cell">الباقة</TableHead>
            <TableHead className="px-3 font-semibold text-xs uppercase tracking-wider text-end">المبلغ</TableHead>
            <TableHead className="px-3 font-semibold text-xs uppercase tracking-wider">الحالة</TableHead>
            <TableHead className="pe-5 font-semibold text-xs uppercase tracking-wider text-end">إجراءات</TableHead>
          </TableRow></TableHeader>
          <TableBody>{filtered.map(inv => (
            <TableRow key={inv.id} className="group hover:bg-muted/20 transition-colors">
              <TableCell className="ps-5 font-mono text-sm font-semibold">{inv.id}</TableCell>
              <TableCell className="px-3 text-sm">{inv.tenant}</TableCell>
              <TableCell className="px-3 hidden md:table-cell"><Badge variant="secondary" className="text-xs">{inv.plan}</Badge></TableCell>
              <TableCell className="px-3 text-end font-semibold tabular-nums text-sm">{inv.amount.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">ر.س</span></TableCell>
              <TableCell className="px-3"><StatusBadge status={inv.status} /></TableCell>
              <TableCell className="pe-5">
                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ActionButton icon={Eye} label="عرض" onClick={() => toast.info(`عرض ${inv.id}`)} />
                  <ActionButton icon={Download} onClick={() => toast.success(`تنزيل ${inv.id}`)} />
                </div>
              </TableCell>
            </TableRow>
          ))}</TableBody></Table>
        </div>
      </Card>

      {/* Mobile Cards */}
      <div className="sm:hidden space-y-3">
        {filtered.map(inv => (
          <Card key={inv.id} className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <p className="font-mono text-sm font-bold">{inv.id}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{inv.tenant}</p>
                </div>
                <StatusBadge status={inv.status} />
              </div>
              <div className="flex items-center justify-between pt-2 border-t">
                <span className="font-bold text-sm">{inv.amount.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">ر.س</span></span>
                <div className="flex gap-1">
                  <ActionButton icon={Eye} onClick={() => toast.info(`عرض ${inv.id}`)} />
                  <ActionButton icon={Download} onClick={() => toast.success(`تنزيل ${inv.id}`)} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

// ─── PAGE 6: ROLES ─────────────────────────────────────────────
function RolesPage() {
  const [addOpen, setAddOpen] = useState(false)
  const [form, setForm] = useState({ name: '', nameEn: '', desc: '' })
  return (
    <div className="space-y-6">
      <PageTitle title="الأدوار والصلاحيات" action={<Button className="gap-2 bg-violet-600 hover:bg-violet-700 text-white" onClick={() => setAddOpen(true)}><Plus className="h-4 w-4" />إضافة دور</Button>} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {ROLES.map((r, i) => (
          <motion.div key={r.id} variants={fade} initial="hidden" animate="visible" transition={{ delay: i * 0.04 }}>
            <Card className="group transition-all hover:shadow-lg border-0 shadow-sm h-full">
              <CardContent className="p-5 sm:p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-900/30"><Shield className="h-5 w-5 text-violet-600" /></div>
                  <Badge variant="secondary" className="text-xs">{r.permissions} صلاحية</Badge>
                </div>
                <h3 className="font-bold text-base">{r.name}</h3>
                <p className="text-xs text-muted-foreground mb-2">{r.nameEn}</p>
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{r.description}</p>
                <div className="flex items-center justify-between pt-3 border-t">
                  <span className="text-xs text-muted-foreground">{r.users} مستخدم</span>
                  <div className="flex gap-1">
                    <ActionButton icon={Edit} label="تعديل" onClick={() => toast.info('تعديل الدور')} />
                    <ActionButton icon={Trash2} onClick={() => toast.success('تم حذف الدور')} danger />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md"><DialogHeader><DialogTitle>إضافة دور جديد</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <FormField label="اسم الدور"><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></FormField>
            <FormField label="الاسم (إنجليزي)"><Input value={form.nameEn} onChange={e => setForm(p => ({ ...p, nameEn: e.target.value }))} dir="ltr" /></FormField>
            <FormField label="الوصف"><Input value={form.desc} onChange={e => setForm(p => ({ ...p, desc: e.target.value }))} /></FormField>
          </div>
          <DialogFooter className="pt-4 gap-3"><Button variant="outline" onClick={() => setAddOpen(false)}>إلغاء</Button><Button className="bg-violet-600 hover:bg-violet-700 text-white" onClick={() => { toast.success('تم إنشاء الدور'); setAddOpen(false) }}>إنشاء</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── PAGE 7: AUDIT ─────────────────────────────────────────────
function AuditPage() {
  const [filter, setFilter] = useState('all')
  const filtered = useMemo(() => filter === 'all' ? LOGS : LOGS.filter(l => l.level === filter), [filter])
  return (
    <div className="space-y-5">
      <PageTitle title="سجل العمليات" action={<Button className="gap-2" variant="outline" onClick={() => toast.success('تم تصدير السجل')}><Download className="h-4 w-4" />تصدير</Button>} />
      <div className="flex flex-wrap gap-2">
        {['all','info','success','warn','error'].map(f => (
          <Button key={f} size="sm" variant={filter === f ? 'default' : 'outline'} className="text-xs h-8 rounded-full px-4" onClick={() => setFilter(f)}>
            {f === 'all' ? 'الكل' : LOG_LABELS[f] || f.toUpperCase()}
          </Button>
        ))}
      </div>

      {/* Desktop Table */}
      <Card className="border-0 shadow-sm overflow-hidden hidden sm:block">
        <div className="overflow-x-auto">
          <Table><TableHeader><TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="ps-5 font-semibold text-xs uppercase tracking-wider w-24">المستوى</TableHead>
            <TableHead className="px-3 font-semibold text-xs uppercase tracking-wider">الرسالة</TableHead>
            <TableHead className="px-3 font-semibold text-xs uppercase tracking-wider hidden md:table-cell">المصدر</TableHead>
            <TableHead className="pe-5 font-semibold text-xs uppercase tracking-wider text-end">التاريخ</TableHead>
          </TableRow></TableHeader>
          <TableBody>{filtered.map(l => (
            <TableRow key={l.id} className="hover:bg-muted/20 transition-colors">
              <TableCell className="ps-5">
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${LOG_COLORS[l.level] || ''}`}>
                  {LOG_LABELS[l.level] || l.level.toUpperCase()}
                </span>
              </TableCell>
              <TableCell className="px-3 text-sm max-w-[400px]">{l.message}</TableCell>
              <TableCell className="px-3 text-xs text-muted-foreground hidden md:table-cell">{l.source}</TableCell>
              <TableCell className="pe-5 text-xs text-muted-foreground whitespace-nowrap text-end">{new Date(l.timestamp).toLocaleString('ar-SA')}</TableCell>
            </TableRow>
          ))}</TableBody></Table>
        </div>
      </Card>

      {/* Mobile List */}
      <div className="sm:hidden space-y-2">
        {filtered.map(l => (
          <Card key={l.id} className="border-0 shadow-sm">
            <CardContent className="p-3">
              <div className="flex items-start gap-3">
                <LogDot level={l.level} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${LOG_COLORS[l.level] || ''}`}>{LOG_LABELS[l.level] || l.level}</span>
                    <span className="text-[10px] text-muted-foreground">{l.source}</span>
                  </div>
                  <p className="text-xs leading-relaxed">{l.message}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{new Date(l.timestamp).toLocaleString('ar-SA')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

// ─── PAGE 8: NOTIFICATIONS ─────────────────────────────────────
function NotificationsPage() {
  const [sendOpen, setSendOpen] = useState(false)
  const [msg, setMsg] = useState({ title: '', body: '', target: 'all' })
  const templates = [
    { id: '1', name: 'ترحيب مستأجر جديد', type: 'بريد إلكتروني', status: 'active', sent: 156 },
    { id: '2', name: 'تذكير بالدفع', type: 'بريد + SMS', status: 'active', sent: 89 },
    { id: '3', name: 'إشعار تعليق الحساب', type: 'بريد إلكتروني', status: 'active', sent: 12 },
    { id: '4', name: 'تقرير أسبوعي', type: 'بريد إلكتروني', status: 'inactive', sent: 0 },
  ]
  return (
    <div className="space-y-5">
      <PageTitle title="الإشعارات" action={<Button className="gap-2 bg-violet-600 hover:bg-violet-700 text-white" onClick={() => setSendOpen(true)}><Bell className="h-4 w-4" />إرسال إشعار</Button>} />

      {/* Desktop Table */}
      <Card className="border-0 shadow-sm overflow-hidden hidden sm:block">
        <div className="overflow-x-auto">
          <Table><TableHeader><TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="ps-5 font-semibold text-xs uppercase tracking-wider">القالب</TableHead>
            <TableHead className="px-3 font-semibold text-xs uppercase tracking-wider hidden md:table-cell">النوع</TableHead>
            <TableHead className="px-3 font-semibold text-xs uppercase tracking-wider">الحالة</TableHead>
            <TableHead className="px-3 font-semibold text-xs uppercase tracking-wider text-end hidden lg:table-cell">مرات الإرسال</TableHead>
            <TableHead className="pe-5 font-semibold text-xs uppercase tracking-wider text-end">إجراءات</TableHead>
          </TableRow></TableHeader>
          <TableBody>{templates.map(t => (
            <TableRow key={t.id} className="group hover:bg-muted/20 transition-colors">
              <TableCell className="ps-5 font-medium text-sm">{t.name}</TableCell>
              <TableCell className="px-3 text-sm hidden md:table-cell">{t.type}</TableCell>
              <TableCell className="px-3"><StatusBadge status={t.status} /></TableCell>
              <TableCell className="px-3 tabular-nums text-sm hidden lg:table-cell text-end">{t.sent}</TableCell>
              <TableCell className="pe-5">
                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ActionButton icon={Edit} label="تعديل" onClick={() => toast.info('تعديل القالب')} />
                  <ActionButton icon={Mail} onClick={() => toast.success('تم إرسال اختبار')} />
                </div>
              </TableCell>
            </TableRow>
          ))}</TableBody></Table>
        </div>
      </Card>

      {/* Mobile Cards */}
      <div className="sm:hidden space-y-3">
        {templates.map(t => (
          <Card key={t.id} className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="min-w-0">
                  <p className="font-medium text-sm">{t.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{t.type} · {t.sent} إرسال</p>
                </div>
                <StatusBadge status={t.status} />
              </div>
              <div className="flex items-center justify-end gap-1 pt-2 border-t">
                <ActionButton icon={Edit} label="تعديل" onClick={() => toast.info('تعديل القالب')} />
                <ActionButton icon={Mail} onClick={() => toast.success('تم إرسال اختبار')} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={sendOpen} onOpenChange={setSendOpen}>
        <DialogContent className="max-w-md"><DialogHeader><DialogTitle>إرسال إشعار</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <FormField label="العنوان"><Input value={msg.title} onChange={e => setMsg(p => ({ ...p, title: e.target.value }))} /></FormField>
            <FormField label="المحتوى"><Input value={msg.body} onChange={e => setMsg(p => ({ ...p, body: e.target.value }))} /></FormField>
            <FormField label="الفئة"><Select value={msg.target} onValueChange={v => setMsg(p => ({ ...p, target: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">الجميع</SelectItem><SelectItem value="active">النشطون</SelectItem><SelectItem value="trial">التجريبية</SelectItem></SelectContent></Select></FormField>
          </div>
          <DialogFooter className="pt-4 gap-3"><Button variant="outline" onClick={() => setSendOpen(false)}>إلغاء</Button><Button className="bg-violet-600 hover:bg-violet-700 text-white" onClick={() => { toast.success('تم الإرسال'); setSendOpen(false) }}>إرسال</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── PAGE 9: REPORTS ───────────────────────────────────────────
function ReportsPage() {
  const reports = [
    { id: '1', name: 'تقرير الإيرادات الشهري', desc: 'ملخص شامل للإيرادات حسب المستأجر والباقة', type: 'مالي', last: '2025-06-18' },
    { id: '2', name: 'تقرير النمو', desc: 'معدلات النمو في المستأجرين والحجوزات', type: 'تشغيلي', last: '2025-06-17' },
    { id: '3', name: 'تقرير الأمان', desc: 'محاولات الدخول والتهديدات الأمنية', type: 'أمني', last: '2025-06-18' },
    { id: '4', name: 'تقرير الأداء', desc: 'أداء الخوادم وAPI واستجابة النظام', type: 'تقني', last: '2025-06-16' },
    { id: '5', name: 'تقرير المستخدمين', desc: 'نشاط المستخدمين وتوزيع الأدوار', type: 'تشغيلي', last: '2025-06-15' },
    { id: '6', name: 'تقرير الفواتير', desc: 'ملخص الفواتير والمدفوعات المتأخرة', type: 'مالي', last: '2025-06-14' },
  ]
  return (
    <div className="space-y-6">
      <PageTitle title="التقارير" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {reports.map((r, i) => (
          <motion.div key={r.id} variants={fade} initial="hidden" animate="visible" transition={{ delay: i * 0.04 }}>
            <Card className="group transition-all hover:shadow-lg border-0 shadow-sm h-full">
              <CardContent className="p-5 sm:p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-100 dark:bg-sky-900/30"><BarChart3 className="h-5 w-5 text-sky-600" /></div>
                  <Badge variant="outline" className="text-xs">{r.type}</Badge>
                </div>
                <h3 className="font-bold text-sm mb-1">{r.name}</h3>
                <p className="text-xs text-muted-foreground mb-5 leading-relaxed">{r.desc}</p>
                <div className="flex items-center justify-between pt-3 border-t">
                  <span className="text-[11px] text-muted-foreground">آخر توليد: {r.last}</span>
                  <div className="flex gap-1">
                    <ActionButton icon={RefreshCw} label="توليد" onClick={() => toast.success('جاري التوليد...')} />
                    <ActionButton icon={Download} onClick={() => toast.success('جاري التنزيل...')} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

// ─── PAGE 10: SYSTEM HEALTH ────────────────────────────────────
function SystemPage() {
  const gauges = [
    { label: 'API', value: 99, icon: Server },
    { label: 'قاعدة البيانات', value: 85, icon: Database },
    { label: 'الذاكرة', value: 78, icon: Monitor },
    { label: 'القرص', value: 62, icon: HardDrive },
    { label: 'CDN', value: 100, icon: Globe },
    { label: 'Worker', value: 95, icon: RefreshCw },
  ]

  const getColor = (v: number) => v > 80 ? 'text-red-500' : v > 60 ? 'text-amber-500' : 'text-emerald-500'

  return (
    <div className="space-y-6">
      <PageTitle title="صحة النظام" action={<Button className="gap-2" variant="outline" onClick={() => toast.success('تم التحديث')}><RefreshCw className="h-4 w-4" />تحديث</Button>} />
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 sm:gap-4">
        {gauges.map((g, i) => (
          <motion.div key={g.label} variants={fade} initial="hidden" animate="visible" transition={{ delay: i * 0.04 }}>
            <Card className="text-center border-0 shadow-sm">
              <CardContent className="p-3 sm:p-4">
                <div className="relative mx-auto h-14 w-14 sm:h-16 sm:w-16 mb-2">
                  <svg className={`h-14 w-14 sm:h-16 sm:w-16 -rotate-90 ${getColor(g.value)}`} viewBox="0 0 64 64">
                    <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="4" className="opacity-15" />
                    <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="4" strokeDasharray={`${2 * Math.PI * 28 * g.value / 100} ${2 * Math.PI * 28}`} strokeLinecap="round" />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-xs sm:text-sm font-bold">{g.value}%</span>
                </div>
                <div className="flex items-center justify-center gap-1.5 text-muted-foreground"><g.icon className="h-3.5 w-3.5" /><span className="text-[10px] sm:text-xs font-medium">{g.label}</span></div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3"><CardTitle className="text-sm sm:text-base font-semibold">سجل النظام</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-0.5">{LOGS.map(l => (
            <div key={l.id} className="flex items-start gap-3 rounded-lg px-3 py-2.5 hover:bg-muted/50 transition-colors">
              <LogDot level={l.level} />
              <div className="min-w-0 flex-1">
                <p className="text-sm leading-relaxed">{l.message}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{l.source} — {new Date(l.timestamp).toLocaleString('ar-SA')}</p>
              </div>
            </div>
          ))}</div>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── PAGE 11: SERVERS ──────────────────────────────────────────
function ServersPage() {
  const [addOpen, setAddOpen] = useState(false)
  const getColor = (v: number) => v > 80 ? 'text-red-500' : v > 60 ? 'text-amber-500' : 'text-emerald-500'

  return (
    <div className="space-y-6">
      <PageTitle title="الخوادم" action={<Button className="gap-2 bg-violet-600 hover:bg-violet-700 text-white" onClick={() => setAddOpen(true)}><Plus className="h-4 w-4" />إضافة خادم</Button>} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        {SERVERS.map((s, i) => (
          <motion.div key={s.id} variants={fade} initial="hidden" animate="visible" transition={{ delay: i * 0.05 }}>
            <Card className="transition-all hover:shadow-lg border-0 shadow-sm">
              <CardContent className="p-5 sm:p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-100 dark:bg-sky-900/30"><Server className="h-5 w-5 text-sky-600" /></div>
                    <div><h3 className="font-bold text-sm">{s.name}</h3><p className="text-xs text-muted-foreground">{s.region}</p></div>
                  </div>
                  <StatusBadge status={s.status} />
                </div>
                <div className="grid grid-cols-4 gap-3 sm:gap-4">
                  {[{ l: 'CPU', v: s.cpu }, { l: 'الذاكرة', v: s.memory }, { l: 'القرص', v: s.disk }, { l: 'Uptime', v: parseInt(s.uptime) }].map(m => (
                    <div key={m.l} className="text-center space-y-1.5">
                      <div className="relative mx-auto h-11 w-11 sm:h-12 sm:w-12">
                        <svg className={`h-11 w-11 sm:h-12 sm:w-12 -rotate-90 ${getColor(m.v)}`} viewBox="0 0 48 48">
                          <circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" strokeWidth="3.5" className="opacity-15" />
                          <circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" strokeWidth="3.5" strokeDasharray={`${2 * Math.PI * 20 * m.v / 100} ${2 * Math.PI * 20}`} strokeLinecap="round" />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold">{m.v}%</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground font-medium">{m.l}</p>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-3 border-t">
                  <span className="text-xs text-muted-foreground">الطلبات: {s.requests}</span>
                  <div className="flex gap-1">
                    <ActionButton icon={RefreshCw} label="إعادة تشغيل" onClick={() => toast.info('إعادة تشغيل الخادم')} />
                    <ActionButton icon={Eye} label="تفاصيل" onClick={() => toast.info('تفاصيل الخادم')} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-sm"><DialogHeader><DialogTitle>إضافة خادم</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <FormField label="اسم الخادم"><Input placeholder="API Server #3" dir="ltr" /></FormField>
            <FormField label="المنطقة"><Select defaultValue="riyadh"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="riyadh">الرياض</SelectItem><SelectItem value="jeddah">جدة</SelectItem><SelectItem value="dubai">دبي</SelectItem></SelectContent></Select></FormField>
          </div>
          <DialogFooter className="pt-4 gap-3"><Button variant="outline" onClick={() => setAddOpen(false)}>إلغاء</Button><Button className="bg-violet-600 hover:bg-violet-700 text-white" onClick={() => { toast.success('تم إضافة الخادم'); setAddOpen(false) }}>إضافة</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── PAGE 12: DATABASE ─────────────────────────────────────────
function DatabasePage() {
  const backups = [
    { id: '1', date: '2025-06-18 06:00', size: '2.4 GB', type: 'تلقائي', status: 'active' },
    { id: '2', date: '2025-06-17 06:00', size: '2.3 GB', type: 'تلقائي', status: 'active' },
    { id: '3', date: '2025-06-16 18:30', size: '2.3 GB', type: 'يدوي', status: 'active' },
    { id: '4', date: '2025-06-16 06:00', size: '2.2 GB', type: 'تلقائي', status: 'suspended' },
  ]
  return (
    <div className="space-y-6">
      <PageTitle title="قاعدة البيانات" action={<Button className="gap-2 bg-violet-600 hover:bg-violet-700 text-white" onClick={() => toast.success('جاري النسخ الاحتياطي...')}><Database className="h-4 w-4" />نسخ احتياطي</Button>} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard icon={Database} label="حجم القاعدة" value="2.4 GB" color="bg-sky-100 dark:bg-sky-900/30 text-sky-600" />
        <StatCard icon={HardDrive} label="عدد الجداول" value="156K" color="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600" />
        <StatCard icon={Activity} label="متوسط الاستجابة" value="23ms" color="bg-amber-100 dark:bg-amber-900/30 text-amber-600" />
        <StatCard icon={Clock} label="النسخ الاحتياطية" value="4" color="bg-violet-100 dark:bg-violet-900/30 text-violet-600" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card className="border-0 shadow-sm"><CardHeader className="pb-3"><CardTitle className="text-sm sm:text-base font-semibold">استخدام الموارد</CardTitle></CardHeader>
          <CardContent className="space-y-5">{[{ l: 'CPU', v: 45 }, { l: 'الذاكرة', v: 72 }, { l: 'القرص', v: 58 }, { l: 'الاتصالات', v: 34 }].map(r => (
            <div key={r.l}><div className="flex justify-between text-sm mb-2"><span className="font-medium">{r.l}</span><span className="tabular-nums font-semibold">{r.v}%</span></div><Progress value={r.v} className="h-2" /></div>
          ))}</CardContent>
        </Card>
        <Card className="border-0 shadow-sm"><CardHeader className="pb-3"><CardTitle className="text-sm sm:text-base font-semibold">النسخ الاحتياطية</CardTitle></CardHeader>
          <CardContent className="space-y-3">{backups.map(b => (
            <div key={b.id} className="flex items-center gap-3 rounded-xl border p-3 sm:p-4 hover:bg-muted/30 transition-colors">
              <StatusBadge status={b.status} />
              <div className="min-w-0 flex-1"><p className="text-sm font-medium">{b.date}</p><p className="text-xs text-muted-foreground">{b.type} · {b.size}</p></div>
              <ActionButton icon={Download} onClick={() => toast.success('جاري التنزيل...')} />
            </div>
          ))}</CardContent>
        </Card>
      </div>
    </div>
  )
}

// ─── PAGE 13: SECURITY ─────────────────────────────────────────
function SecurityPage() {
  const [settings, setSettings] = useState({ twoFactor: true, ipWhitelist: false, bruteForce: true, sessionTimeout: true, auditLog: true, encryptData: true })
  const attempts = [
    { ip: '192.168.1.55', time: '2025-06-18 23:00', status: 'suspended', country: 'مجهول' },
    { ip: '10.0.0.12', time: '2025-06-18 20:15', status: 'suspended', country: 'مجهول' },
    { ip: '172.16.0.8', time: '2025-06-18 15:30', status: 'active', country: 'السعودية' },
  ]
  const toggle = (key: keyof typeof settings) => { setSettings(p => ({ ...p, [key]: !p[key] })); toast.success('تم تحديث الإعداد') }
  const items = [
    { key: 'twoFactor' as const, label: 'المصادقة الثنائية', desc: 'تطلب رمز تحقق إضافي عند تسجيل الدخول' },
    { key: 'ipWhitelist' as const, label: 'القائمة البيضاء لـ IP', desc: 'السماح فقط بعناوين IP المعتمدة' },
    { key: 'bruteForce' as const, label: 'حماية القوة الغاشمة', desc: 'حظر تلقائي بعد 5 محاولات فاشلة' },
    { key: 'sessionTimeout' as const, label: 'انتهاء الجلسة', desc: 'إنهاء الجلسة بعد 30 دقيقة من عدم النشاط' },
    { key: 'auditLog' as const, label: 'تسجيل العمليات', desc: 'تسجيل جميع العمليات الحساسة' },
    { key: 'encryptData' as const, label: 'تشفير البيانات', desc: 'تشفير البيانات الحساسة في التخزين' },
  ]
  return (
    <div className="space-y-6">
      <PageTitle title="الأمان" />
      <Card className="border-0 shadow-sm"><CardHeader className="pb-3"><CardTitle className="text-sm sm:text-base font-semibold">إعدادات الأمان</CardTitle></CardHeader>
        <CardContent className="space-y-0">
          {items.map((s, i) => (
            <div key={s.key}>
              <div className="flex items-center justify-between gap-4 py-3.5">
                <div className="min-w-0"><p className="text-sm font-medium">{s.label}</p><p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{s.desc}</p></div>
                <Toggle on={settings[s.key]} onToggle={() => toggle(s.key)} />
              </div>
              {i < items.length - 1 && <Separator />}
            </div>
          ))}
        </CardContent>
      </Card>
      <Card className="border-0 shadow-sm"><CardHeader className="pb-3"><CardTitle className="text-sm sm:text-base font-semibold flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-500" />محاولات الدخول المشبوهة</CardTitle></CardHeader>
        <CardContent>

          {/* Desktop Table */}
          <div className="hidden sm:block overflow-x-auto">
            <Table><TableHeader><TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="ps-4 font-semibold text-xs uppercase tracking-wider">عنوان IP</TableHead>
              <TableHead className="px-3 font-semibold text-xs uppercase tracking-wider">الوقت</TableHead>
              <TableHead className="px-3 font-semibold text-xs uppercase tracking-wider">الموقع</TableHead>
              <TableHead className="pe-4 font-semibold text-xs uppercase tracking-wider">الحالة</TableHead>
            </TableRow></TableHeader>
            <TableBody>{attempts.map((a, i) => (
              <TableRow key={i} className="hover:bg-muted/20 transition-colors">
                <TableCell className="ps-4 font-mono text-sm" dir="ltr">{a.ip}</TableCell>
                <TableCell className="px-3 text-xs text-muted-foreground">{a.time}</TableCell>
                <TableCell className="px-3 text-sm">{a.country}</TableCell>
                <TableCell className="pe-4"><StatusBadge status={a.status} /></TableCell>
              </TableRow>
            ))}</TableBody></Table>
          </div>

          {/* Mobile List */}
          <div className="sm:hidden space-y-2">
            {attempts.map((a, i) => (
              <div key={i} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                <div className="min-w-0">
                  <p className="font-mono text-sm font-semibold" dir="ltr">{a.ip}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{a.country} · {a.time}</p>
                </div>
                <StatusBadge status={a.status} />
              </div>
            ))}
          </div>

        </CardContent>
      </Card>
    </div>
  )
}

// ─── PAGE 14: SETTINGS ─────────────────────────────────────────
function SettingsPage() {
  const [form, setForm] = useState({ platformName: 'BookFlow', supportEmail: 'support@bookflow.com', currency: 'SAR', timezone: 'Asia/Riyadh', maintenance: false, registration: true, maxTenants: '500', backupFreq: 'daily' })
  return (
    <div className="space-y-6">
      <PageTitle title="إعدادات المنصة" action={<Button className="gap-2 bg-violet-600 hover:bg-violet-700 text-white" onClick={() => toast.success('تم حفظ الإعدادات')}><Save className="h-4 w-4" />حفظ الإعدادات</Button>} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card className="border-0 shadow-sm"><CardHeader className="pb-3"><CardTitle className="text-sm sm:text-base font-semibold">الإعدادات العامة</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <FormField label="اسم المنصة"><Input value={form.platformName} onChange={e => setForm(p => ({ ...p, platformName: e.target.value }))} /></FormField>
            <FormField label="بريد الدعم"><Input type="email" value={form.supportEmail} onChange={e => setForm(p => ({ ...p, supportEmail: e.target.value }))} dir="ltr" /></FormField>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <FormField label="العملة"><Select value={form.currency} onValueChange={v => setForm(p => ({ ...p, currency: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="SAR">ر.س</SelectItem><SelectItem value="AED">د.إ</SelectItem><SelectItem value="USD">$</SelectItem><SelectItem value="EGP">ج.م</SelectItem></SelectContent></Select></FormField>
              <FormField label="المنطقة الزمنية"><Select value={form.timezone} onValueChange={v => setForm(p => ({ ...p, timezone: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Asia/Riyadh">الرياض</SelectItem><SelectItem value="Asia/Dubai">دبي</SelectItem><SelectItem value="Africa/Cairo">القاهرة</SelectItem></SelectContent></Select></FormField>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm"><CardHeader className="pb-3"><CardTitle className="text-sm sm:text-base font-semibold">إعدادات متقدمة</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <FormField label="الحد الأقصى للمستأجرين"><Input type="number" value={form.maxTenants} onChange={e => setForm(p => ({ ...p, maxTenants: e.target.value }))} /></FormField>
            <FormField label="تكرار النسخ الاحتياطي"><Select value={form.backupFreq} onValueChange={v => setForm(p => ({ ...p, backupFreq: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="hourly">كل ساعة</SelectItem><SelectItem value="daily">يومياً</SelectItem><SelectItem value="weekly">أسبوعياً</SelectItem></SelectContent></Select></FormField>
            <Separator />
            {[
              { key: 'maintenance' as const, label: 'وضع الصيانة', desc: 'تعطيل الوصول مؤقتاً', color: 'amber' },
              { key: 'registration' as const, label: 'التسجيل المفتوح', desc: 'السماح بالتسجيل الذاتي', color: 'violet' },
            ].map(s => (
              <div key={s.key} className="flex items-center justify-between gap-4 py-1">
                <div><p className="text-sm font-medium">{s.label}</p><p className="text-xs text-muted-foreground">{s.desc}</p></div>
                <Toggle on={form[s.key]} onToggle={() => { setForm(p => ({ ...p, [s.key]: !p[s.key] })); toast.success('تم التحديث') }} color={s.color} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ─── MAIN ──────────────────────────────────────────────────────
const PAGES: Record<string, () => React.JSX.Element> = {
  sa_overview: OverviewPage,
  sa_tenants: TenantsPage,
  sa_users: UsersPage,
  sa_plans: PlansPage,
  sa_billing: BillingPage,
  sa_roles: RolesPage,
  sa_audit: AuditPage,
  sa_notifications: NotificationsPage,
  sa_reports: ReportsPage,
  sa_system: SystemPage,
  sa_servers: ServersPage,
  sa_database: DatabasePage,
  sa_security: SecurityPage,
  sa_settings: SettingsPage,
}

export function SuperAdminDashboard() {
  const { superAdminView, isAuthenticated, logout } = useAppStore()

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('bf_sa_token') : null
    if (!token && !isAuthenticated) logout()
  }, [isAuthenticated, logout])

  const Page = PAGES[superAdminView] || OverviewPage

  return (
    <motion.div
      key={superAdminView}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="p-4 sm:p-6 lg:p-8 w-full"
    >
      <div className="max-w-[1400px] mx-auto">
        <Page />
      </div>
    </motion.div>
  )
}