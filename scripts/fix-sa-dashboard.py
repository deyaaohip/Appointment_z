# This script generates the complete SuperAdminDashboard component
import os

content = r"""'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { useAppStore } from '@/stores/app-store'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import {
  Building2, Users, DollarSign, CalendarDays, ArrowUpRight, ArrowDownRight,
  Activity, CreditCard, Settings, Shield, Eye, Edit, Trash2, Plus,
  Search, BarChart3, Server, Database, Lock, Bell, FileText, UserCog,
  TrendingUp, CheckCircle2, XCircle, AlertTriangle, RefreshCw, Globe,
  UserPlus, Wifi, Clock, Monitor, HardDrive, Mail, Key, Download,
  Filter, Save, Power, PowerOff, Copy, ExternalLink, ChevronDown,
} from 'lucide-react'

/* ═══════════════════════════════════════════════════════════════
   ANIMATION VARIANTS
   ═══════════════════════════════════════════════════════════════ */
const fadeIn = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } } }
const stagger = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } }

/* ═══════════════════════════════════════════════════════════════
   MOCK DATA
   ═══════════════════════════════════════════════════════════════ */
interface Tenant {
  id: string; name: string; nameEn: string; plan: string; bookings: number
  revenue: number; users: number; status: string; createdAt: string; country: string; email: string
}
interface PlatformUser {
  id: string; name: string; email: string; tenant: string; role: string
  status: string; lastLogin: string
}
interface SysLog {
  id: string; level: string; source: string; message: string; timestamp: string
}

const INIT_TENANTS: Tenant[] = [
  { id: '1', name: 'مركز النور الطبي', nameEn: 'Al Noor Medical', plan: 'Enterprise', bookings: 1250, revenue: 187500, users: 12, status: 'active', createdAt: '2025-01-15', country: 'السعودية', email: 'info@alnoor.sa' },
  { id: '2', name: 'صالون ياسمين', nameEn: 'Yasmin Beauty', plan: 'Professional', bookings: 680, revenue: 54200, users: 8, status: 'active', createdAt: '2025-02-20', country: 'السعودية', email: 'info@yasmin.sa' },
  { id: '3', name: 'أكاديمية المستقبل', nameEn: 'Future Academy', plan: 'Professional', bookings: 420, revenue: 38000, users: 6, status: 'active', createdAt: '2025-03-10', country: 'الإمارات', email: 'info@future-edu.sa' },
  { id: '4', name: 'عيادة الابتسامة', nameEn: 'Smile Clinic', plan: 'Starter', bookings: 45, revenue: 0, users: 2, status: 'trial', createdAt: '2025-06-01', country: 'مصر', email: 'info@smile.eg' },
  { id: '5', name: 'نادي اللياقة الذهبية', nameEn: 'Golden Fitness', plan: 'Professional', bookings: 310, revenue: 22000, users: 5, status: 'suspended', createdAt: '2025-01-28', country: 'الأردن', email: 'info@goldenfit.jo' },
  { id: '6', name: 'مركز التجميل الملكي', nameEn: 'Royal Beauty', plan: 'Enterprise', bookings: 920, revenue: 145000, users: 15, status: 'active', createdAt: '2025-02-01', country: 'السعودية', email: 'info@royalbeauty.sa' },
  { id: '7', name: 'عيادة العيون المتقدمة', nameEn: 'Advanced Eye', plan: 'Business', bookings: 560, revenue: 78000, users: 9, status: 'active', createdAt: '2025-04-15', country: 'السعودية', email: 'info@adveye.sa' },
  { id: '8', name: 'مركز الفيزيوترابي', nameEn: 'Physio Center', plan: 'Starter', bookings: 120, revenue: 8500, users: 3, status: 'trial', createdAt: '2025-05-20', country: 'الكويت', email: 'info@physio.kw' },
]

const INIT_USERS: PlatformUser[] = [
  { id: '1', name: 'أحمد المطيري', email: 'ahmed@alnoor.sa', tenant: 'مركز النور الطبي', role: 'مالك', status: 'active', lastLogin: '2025-06-18T14:30:00Z' },
  { id: '2', name: 'سارة الأحمد', email: 'sara@yasmin.sa', tenant: 'صالون ياسمين', role: 'مدير', status: 'active', lastLogin: '2025-06-18T13:45:00Z' },
  { id: '3', name: 'محمد العتيبي', email: 'mohammed@goldenfit.com', tenant: 'نادي اللياقة', role: 'مالك', status: 'suspended', lastLogin: '2025-06-10T12:00:00Z' },
  { id: '4', name: 'فاطمة الحربي', email: 'fatima@alnoor.sa', tenant: 'مركز النور الطبي', role: 'موظف استقبال', status: 'active', lastLogin: '2025-06-18T10:30:00Z' },
  { id: '5', name: 'خالد الدوسري', email: 'khaled@future-edu.sa', tenant: 'أكاديمية المستقبل', role: 'مالك', status: 'active', lastLogin: '2025-06-17T16:00:00Z' },
  { id: '6', name: 'نورة القحطاني', email: 'noura@royalbeauty.sa', tenant: 'مركز التجميل الملكي', role: 'مدير', status: 'active', lastLogin: '2025-06-18T09:15:00Z' },
  { id: '7', name: 'عبدالله الشمري', email: 'abdullah@adv-eye.sa', tenant: 'عيادة العيون', role: 'مالك', status: 'active', lastLogin: '2025-06-18T11:20:00Z' },
  { id: '8', name: 'ريم السبيعي', email: 'reem@smile-clinic.com', tenant: 'عيادة الابتسامة', role: 'مالك', status: 'active', lastLogin: '2025-06-16T15:00:00Z' },
]

const INIT_LOGS: SysLog[] = [
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
  { id: '11', level: 'error', source: 'الأمان', message: 'محاولة وصول غير مصرح بها من IP: 192.168.1.55', timestamp: '2025-06-17T23:00:00Z' },
  { id: '12', level: 'success', source: 'النسخ الاحتياطي', message: 'نسخ احتياطي كامل للقاعدة — 1.8 GB', timestamp: '2025-06-17T22:00:00Z' },
]

const PLANS = [
  { id: 'free', name: 'مجاني', price: 0, color: 'bg-gray-500', features: ['لوحة تحكم أساسية', '50 حجز/شهر', 'مستخدم واحد'], tenants: 45 },
  { id: 'starter', name: 'أساسية', price: 99, color: 'bg-amber-500', features: ['حجوزات غير محدودة', '3 موظفين', 'فرع واحد', 'تقارير أساسية'], tenants: 28 },
  { id: 'professional', name: 'احترافية', price: 299, color: 'bg-blue-500', features: ['10 موظفين', '5 فروع', 'تقارير متقدمة', 'كوبونات', 'أدوار وصلاحيات'], tenants: 18 },
  { id: 'business', name: 'أعمال', price: 599, color: 'bg-violet-500', popular: true, features: ['25 موظف', 'فروع غير محدودة', 'API متقدم', 'سجل عمليات', 'فاتورة إلكترونية', 'دعم أولوي'], tenants: 8 },
  { id: 'enterprise', name: 'مؤسسية', price: 999, color: 'bg-emerald-500', features: ['موظفين غير محدودين', 'وايت لابل', 'SLA 99.9%', 'مدير حساب', 'تدريب مخصص', 'دمج مخصص'], tenants: 4 },
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

/* ═══════════════════════════════════════════════════════════════
   SHARED HELPERS
   ═══════════════════════════════════════════════════════════════ */
function StatusBadge({ status }: { status: string }) {
  const m: Record<string, string> = {
    active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
    suspended: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 border-red-200 dark:border-red-800',
    trial: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    inactive: 'bg-gray-100 text-gray-600 dark:bg-gray-800/40 dark:text-gray-400',
    paid: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 border-emerald-200',
    pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 border-amber-200',
    overdue: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 border-red-200',
    failed: 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-500 border-red-200',
    healthy: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 border-emerald-200',
    warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 border-amber-200',
    critical: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 border-red-200',
  }
  const labels: Record<string, string> = { active: 'نشط', suspended: 'معلق', trial: 'تجريبي', inactive: 'غير نشط', paid: 'مدفوع', pending: 'معلق', overdue: 'متأخر', failed: 'فاشل', healthy: 'سليم', warning: 'تحذير', critical: 'حرج' }
  return <Badge variant="outline" className={`text-xs ${m[status] || ''}`}>{labels[status] || status}</Badge>
}

function LogBadge({ level }: { level: string }) {
  const m: Record<string, string> = {
    info: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
    warn: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
    error: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
    success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
  }
  return <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold shrink-0 ${m[level] || ''}`}>{level.toUpperCase()}</span>
}

function KpiCard({ icon, iconBg, value, label, trend }: { icon: React.ReactNode; iconBg: string; value: string; label: string; trend?: number }) {
  const isUp = (trend ?? 0) >= 0
  return (
    <motion.div variants={fadeIn}>
      <Card className="h-full transition-shadow hover:shadow-md">
        <CardContent className="flex items-center gap-3 sm:gap-4 p-4">
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>{icon}</div>
          <div className="min-w-0 flex-1">
            <p className="text-xl sm:text-2xl font-bold tracking-tight">{value}</p>
            <p className="text-xs sm:text-sm text-muted-foreground truncate">{label}</p>
          </div>
          {trend !== undefined && (
            <div className={`hidden sm:flex shrink-0 items-center gap-0.5 text-xs font-medium ${isUp ? 'text-emerald-600' : 'text-red-500'}`}>
              {isUp ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
              {Math.abs(trend)}%
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

function Gauge({ value, size = 'md' }: { value: number; size?: 'sm' | 'md' }) {
  const r = size === 'sm' ? 22 : 28
  const circ = 2 * Math.PI * r
  const color = value > 80 ? 'text-red-500' : value > 60 ? 'text-amber-500' : 'text-emerald-500'
  const dim = size === 'sm' ? 'h-12 w-12 text-[10px]' : 'h-16 w-16 text-xs'
  return (
    <div className={`relative flex ${dim} items-center justify-center`}>
      <svg className={`h-full w-full -rotate-90 ${color}`} viewBox="0 0 64 64">
        <circle cx="32" cy="32" r={r} fill="none" stroke="currentColor" strokeWidth="5" className="opacity-15" />
        <circle cx="32" cy="32" r={r} fill="none" stroke="currentColor" strokeWidth="5" strokeDasharray={`${circ * value / 100} ${circ}`} strokeLinecap="round" />
      </svg>
      <span className="absolute font-bold">{value}%</span>
    </div>
  )
}

function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
      <h3 className="text-lg font-semibold">{title}</h3>
      {action}
    </div>
  )
}

function EmptyState({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-4">
      <div className="rounded-2xl bg-violet-50 dark:bg-violet-950/20 p-5 mb-4">{icon}</div>
      <h3 className="text-lg font-bold mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm">{desc}</p>
    </div>
  )
}

function ConfirmDialog({ open, onOpenChange, title, desc, onConfirm, variant = 'default' }: {
  open: boolean; onOpenChange: (o: boolean) => void; title: string; desc: string; onConfirm: () => void; variant?: 'default' | 'danger'
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>{desc}</DialogDescription></DialogHeader>
        <DialogFooter className="flex-row gap-2">
          <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>إلغاء</Button>
          <Button className={`flex-1 ${variant === 'danger' ? 'bg-red-600 hover:bg-red-700 text-white' : ''}`} onClick={() => { onConfirm(); onOpenChange(false) }}>
            تأكيد
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/* ═══════════════════════════════════════════════════════════════
   PAGE 1: OVERVIEW
   ═══════════════════════════════════════════════════════════════ */
function OverviewPage() {
  const totalRevenue = INIT_TENANTS.reduce((s, t) => s + t.revenue, 0)
  const totalBookings = INIT_TENANTS.reduce((s, t) => s + t.bookings, 0)
  const activeCount = INIT_TENANTS.filter(t => t.status === 'active').length

  return (
    <div className="space-y-5">
      <motion.div variants={stagger} initial="hidden" animate="visible" className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard icon={<Building2 className="h-5 w-5 text-white" />} iconBg="bg-violet-500" value={`${INIT_TENANTS.length}`} label="إجمالي المستأجرين" trend={12} />
        <KpiCard icon={<Users className="h-5 w-5 text-white" />} iconBg="bg-blue-500" value={`${INIT_USERS.length}`} label="إجمالي المستخدمين" trend={8} />
        <KpiCard icon={<DollarSign className="h-5 w-5 text-white" />} iconBg="bg-amber-500" value={`${(totalRevenue / 1000).toFixed(0)}K`} label="الإيرادات (ر.س)" trend={18} />
        <KpiCard icon={<CalendarDays className="h-5 w-5 text-white" />} iconBg="bg-emerald-500" value={totalBookings.toLocaleString()} label="الحجوزات" trend={5} />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <motion.div variants={fadeIn} initial="hidden" animate="visible" transition={{ delay: 0.1 }}>
          <Card className="h-full">
            <CardHeader className="pb-3"><CardTitle className="text-sm sm:text-base flex items-center gap-2"><Activity className="h-4 w-4 text-blue-500" />آخر النشاطات</CardTitle></CardHeader>
            <CardContent><ScrollArea className="max-h-72"><div className="space-y-2">{INIT_LOGS.slice(0, 6).map(l => (
              <div key={l.id} className="flex gap-2 sm:gap-3 rounded-lg p-2 hover:bg-muted/50">
                <LogBadge level={l.level} />
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm leading-relaxed">{l.message}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">{l.source} — {new Date(l.timestamp).toLocaleString('ar-SA')}</p>
                </div>
              </div>
            ))}</div></ScrollArea></CardContent>
          </Card>
        </motion.div>

        <motion.div variants={fadeIn} initial="hidden" animate="visible" transition={{ delay: 0.15 }}>
          <Card className="h-full">
            <CardHeader className="pb-3"><CardTitle className="text-sm sm:text-base">إحصائيات الباقات</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {PLANS.filter(p => p.price > 0).map(p => {
                const rev = INIT_TENANTS.filter(t => t.plan === p.name).reduce((s, t) => s + t.revenue, 0)
                const pct = totalRevenue > 0 ? Math.round(rev / totalRevenue * 100) : 0
                return (
                  <div key={p.id} className="flex items-center gap-3">
                    <span className="w-20 sm:w-28 text-xs sm:text-sm font-medium truncate">{p.name}</span>
                    <div className="flex-1 h-2.5 rounded-full bg-muted overflow-hidden">
                      <div className={`h-full rounded-full ${p.color} transition-all duration-700`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-16 sm:w-20 text-xs sm:text-sm font-semibold text-end tabular-nums">{rev.toLocaleString()} ر.س</span>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div variants={fadeIn} initial="hidden" animate="visible" transition={{ delay: 0.2 }}>
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm sm:text-base">المستأجرون النشطون</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {INIT_TENANTS.filter(t => t.status === 'active').slice(0, 6).map(t => (
                <div key={t.id} className="flex items-center gap-3 rounded-xl border p-3 hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => toast.info(`فتح تفاصيل: ${t.name}`)}>
                  <div className="h-10 w-10 shrink-0 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 font-bold text-sm">{t.name.charAt(0)}</div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.plan} · {t.bookings} حجز</p>
                  </div>
                  <Badge variant="secondary" className="text-[10px] shrink-0">{t.revenue > 0 ? `${(t.revenue / 1000).toFixed(0)}K` : '0'} ر.س</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   PAGE 2: TENANTS
   ═══════════════════════════════════════════════════════════════ */
function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>(INIT_TENANTS)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [dlg, setDlg] = useState<{ type: 'add' | 'edit' | 'delete' | 'suspend' | 'detail'; tenant?: Tenant } | null>(null)
  const [form, setForm] = useState({ name: '', nameEn: '', email: '', country: '', plan: 'Starter' })

  const filtered = useMemo(() => {
    let list = [...tenants]
    if (filter !== 'all') list = list.filter(t => t.status === filter)
    if (search) { const q = search.toLowerCase(); list = list.filter(t => t.name.includes(q) || t.nameEn.toLowerCase().includes(q) || t.email.toLowerCase().includes(q)) }
    return list
  }, [tenants, search, filter])

  const openAdd = useCallback(() => { setForm({ name: '', nameEn: '', email: '', country: '', plan: 'Starter' }); setDlg({ type: 'add' }) }, [])
  const openEdit = useCallback((t: Tenant) => { setForm({ name: t.name, nameEn: t.nameEn, email: t.email, country: t.country, plan: t.plan }); setDlg({ type: 'edit', tenant: t }) }, [])
  const openDelete = useCallback((t: Tenant) => setDlg({ type: 'delete', tenant: t }), [])
  const openSuspend = useCallback((t: Tenant) => setDlg({ type: 'suspend', tenant: t }), [])
  const openDetail = useCallback((t: Tenant) => setDlg({ type: 'detail', tenant: t }), [])

  const handleSave = useCallback(() => {
    if (!form.name.trim()) { toast.error('يرجى إدخال اسم المستأجر'); return }
    if (dlg?.type === 'add') {
      const n: Tenant = { id: Date.now().toString(), name: form.name, nameEn: form.nameEn || form.name, email: form.email, country: form.country || 'السعودية', plan: form.plan, bookings: 0, revenue: 0, users: 1, status: 'trial', createdAt: new Date().toISOString().split('T')[0] }
      setTenants(p => [n, ...p]); toast.success(`تم إضافة المستأجر: ${form.name}`)
    } else if (dlg?.tenant) {
      setTenants(p => p.map(t => t.id === dlg.tenant!.id ? { ...t, name: form.name, nameEn: form.nameEn, email: form.email, country: form.country, plan: form.plan } : t))
      toast.success('تم تحديث المستأجر')
    }
    setDlg(null)
  }, [form, dlg])

  const handleDelete = useCallback(() => {
    if (!dlg?.tenant) return
    setTenants(p => p.filter(t => t.id !== dlg.tenant!.id)); toast.success('تم حذف المستأجر')
  }, [dlg])

  const handleToggleSuspend = useCallback(() => {
    if (!dlg?.tenant) return
    setTenants(p => p.map(t => t.id === dlg.tenant!.id ? { ...t, status: t.status === 'suspended' ? 'active' : 'suspended' } : t))
    toast.success(dlg.tenant.status === 'suspended' ? 'تم تفعيل المستأجر' : 'تم تعليق المستأجر')
  }, [dlg])

  return (
    <div className="space-y-4">
      <SectionHeader title="إدارة المستأجرين" action={<Button className="gap-2 bg-violet-600 hover:bg-violet-700 text-sm" onClick={openAdd}><Plus className="h-4 w-4" />إضافة مستأجر</Button>} />
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1"><Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="بحث بالاسم أو البريد..." value={search} onChange={e => setSearch(e.target.value)} className="ps-9" /></div>
        <Select value={filter} onValueChange={setFilter}><SelectTrigger className="w-full sm:w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">الكل</SelectItem><SelectItem value="active">نشط</SelectItem><SelectItem value="trial">تجريبي</SelectItem><SelectItem value="suspended">معلق</SelectItem></SelectContent></Select>
      </div>
      <Card className="overflow-hidden"><CardContent className="p-0"><div className="overflow-x-auto">
        <Table><TableHeader><TableRow className="bg-muted/50"><TableHead className="ps-4">المستأجر</TableHead><TableHead className="hidden md:table-cell">الباقة</TableHead><TableHead className="hidden lg:table-cell">الحجوزات</TableHead><TableHead>الإيرادات</TableHead><TableHead className="hidden sm:table-cell">الحالة</TableHead><TableHead className="pe-4 text-end">إجراءات</TableHead></TableRow></TableHeader>
        <TableBody>{filtered.map(t => (
          <TableRow key={t.id} className="hover:bg-muted/30">
            <TableCell className="ps-4"><div className="flex items-center gap-3"><div className="h-9 w-9 shrink-0 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 font-bold text-xs">{t.name.charAt(0)}</div><div className="min-w-0"><p className="font-medium text-sm truncate">{t.name}</p><p className="text-xs text-muted-foreground truncate">{t.email}</p></div></div></TableCell>
            <TableCell className="hidden md:table-cell"><Badge variant="secondary">{t.plan}</Badge></TableCell>
            <TableCell className="hidden lg:table-cell tabular-nums">{t.bookings.toLocaleString()}</TableCell>
            <TableCell className="font-medium tabular-nums">{t.revenue.toLocaleString()} <span className="text-xs text-muted-foreground">ر.س</span></TableCell>
            <TableCell className="hidden sm:table-cell"><StatusBadge status={t.status} /></TableCell>
            <TableCell className="pe-4">
              <div className="flex items-center justify-end gap-1">
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openDetail(t)}><Eye className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(t)}><Edit className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-amber-600" onClick={() => openSuspend(t)}>{t.status === 'suspended' ? <Power className="h-4 w-4" /> : <PowerOff className="h-4 w-4" />}</Button>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600" onClick={() => openDelete(t)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </TableCell>
          </TableRow>
        ))}</TableBody></Table>
      </div></CardContent></Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dlg?.type === 'add' || dlg?.type === 'edit'} onOpenChange={() => setDlg(null)}>
        <DialogContent className="max-w-md"><DialogHeader><DialogTitle>{dlg?.type === 'add' ? 'إضافة مستأجر جديد' : 'تعديل المستأجر'}</DialogTitle><DialogDescription>أدخل بيانات المستأجر</DialogDescription></DialogHeader>
          <div className="space-y-3">
            <div><label className="text-sm font-medium mb-1 block">الاسم (عربي)</label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="مثال: مركز النور الطبي" /></div>
            <div><label className="text-sm font-medium mb-1 block">الاسم (إنجليزي)</label><Input value={form.nameEn} onChange={e => setForm(p => ({ ...p, nameEn: e.target.value }))} placeholder="Al Noor Medical" dir="ltr" /></div>
            <div><label className="text-sm font-medium mb-1 block">البريد الإلكتروني</label><Input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="info@example.com" dir="ltr" /></div>
            <div><label className="text-sm font-medium mb-1 block">البلد</label><Input value={form.country} onChange={e => setForm(p => ({ ...p, country: e.target.value }))} placeholder="السعودية" /></div>
            <div><label className="text-sm font-medium mb-1 block">الباقة</label><Select value={form.plan} onValueChange={v => setForm(p => ({ ...p, plan: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{['Starter','Professional','Business','Enterprise'].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDlg(null)}>إلغاء</Button><Button className="bg-violet-600 hover:bg-violet-700" onClick={handleSave}>حفظ</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={dlg?.type === 'detail'} onOpenChange={() => setDlg(null)}>
        <DialogContent className="max-w-lg"><DialogHeader><DialogTitle>{dlg?.tenant?.name}</DialogTitle></DialogHeader>
          {dlg?.tenant && <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[{ l: 'الباقة', v: dlg.tenant.plan }, { l: 'الحالة', v: '' }, { l: 'البلد', v: dlg.tenant.country }, { l: 'الحجوزات', v: dlg.tenant.bookings.toLocaleString() }, { l: 'الإيرادات', v: `${dlg.tenant.revenue.toLocaleString()} ر.س` }, { l: 'المستخدمين', v: `${dlg.tenant.users}` }].map((item, i) => (
                <div key={i} className="rounded-lg bg-muted/50 p-3"><p className="text-xs text-muted-foreground">{item.l}</p><div className="mt-1">{item.l === 'الحالة' ? <StatusBadge status={dlg.tenant.status} /> : <p className="font-semibold text-sm">{item.v}</p>}</div></div>
              ))}
            </div>
            <Separator /><p className="text-xs text-muted-foreground">تاريخ التسجيل: {dlg.tenant.createdAt} | البريد: {dlg.tenant.email}</p>
          </div>}
          <DialogFooter><Button variant="outline" onClick={() => setDlg(null)}>إغلاق</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={dlg?.type === 'delete'} onOpenChange={() => setDlg(null)} title="حذف المستأجر" desc={`هل أنت متأكد من حذف "${dlg?.tenant?.name}"؟ لا يمكن التراجع عن هذا الإجراء.`} onConfirm={handleDelete} variant="danger" />
      <ConfirmDialog open={dlg?.type === 'suspend'} onOpenChange={() => setDlg(null)} title={dlg?.tenant?.status === 'suspended' ? 'تفعيل المستأجر' : 'تعليق المستأجر'} desc={`${dlg?.tenant?.status === 'suspended' ? 'تفعيل' : 'تعليق'} المستأجر "${dlg?.tenant?.name}"`} onConfirm={handleToggleSuspend} />
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   PAGE 3: USERS
   ═══════════════════════════════════════════════════════════════ */
function UsersPage() {
  const [users, setUsers] = useState<PlatformUser[]>(INIT_USERS)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [dlg, setDlg] = useState<{ type: 'add' | 'edit' | 'delete' | 'suspend'; user?: PlatformUser } | null>(null)
  const [form, setForm] = useState({ name: '', email: '', tenant: '', role: 'موظف' })

  const filtered = useMemo(() => {
    let list = [...users]
    if (filter !== 'all') list = list.filter(u => u.status === filter)
    if (search) { const q = search.toLowerCase(); list = list.filter(u => u.name.includes(q) || u.email.toLowerCase().includes(q) || u.tenant.includes(q)) }
    return list
  }, [users, search, filter])

  const openAdd = useCallback(() => { setForm({ name: '', email: '', tenant: '', role: 'موظف' }); setDlg({ type: 'add' }) }, [])
  const openEdit = useCallback((u: PlatformUser) => { setForm({ name: u.name, email: u.email, tenant: u.tenant, role: u.role }); setDlg({ type: 'edit', user: u }) }, [])

  const handleSave = useCallback(() => {
    if (!form.name.trim() || !form.email.trim()) { toast.error('يرجى إدخال الاسم والبريد'); return }
    if (dlg?.type === 'add') {
      const n: PlatformUser = { id: Date.now().toString(), name: form.name, email: form.email, tenant: form.tenant || 'غير محدد', role: form.role, status: 'active', lastLogin: new Date().toISOString() }
      setUsers(p => [n, ...p]); toast.success(`تم إضافة: ${form.name}`)
    } else if (dlg?.user) {
      setUsers(p => p.map(u => u.id === dlg.user!.id ? { ...u, name: form.name, email: form.email, tenant: form.tenant, role: form.role } : u))
      toast.success('تم تحديث المستخدم')
    }
    setDlg(null)
  }, [form, dlg])

  const handleDelete = useCallback(() => { if (!dlg?.user) return; setUsers(p => p.filter(u => u.id !== dlg.user!.id)); toast.success('تم حذف المستخدم') }, [dlg])
  const handleToggle = useCallback(() => { if (!dlg?.user) return; setUsers(p => p.map(u => u.id === dlg.user!.id ? { ...u, status: u.status === 'suspended' ? 'active' : 'suspended' } : u)); toast.success('تم تحديث الحالة') }, [dlg])

  return (
    <div className="space-y-4">
      <SectionHeader title="إدارة المستخدمين" action={<Button className="gap-2 bg-violet-600 hover:bg-violet-700 text-sm" onClick={openAdd}><UserPlus className="h-4 w-4" />إضافة مستخدم</Button>} />
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1"><Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="بحث بالاسم أو البريد أو المستأجر..." value={search} onChange={e => setSearch(e.target.value)} className="ps-9" /></div>
        <Select value={filter} onValueChange={setFilter}><SelectTrigger className="w-full sm:w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">الكل</SelectItem><SelectItem value="active">نشط</SelectItem><SelectItem value="suspended">معلق</SelectItem></SelectContent></Select>
      </div>
      <Card className="overflow-hidden"><CardContent className="p-0"><div className="overflow-x-auto">
        <Table><TableHeader><TableRow className="bg-muted/50"><TableHead className="ps-4">المستخدم</TableHead><TableHead className="hidden md:table-cell">البريد</TableHead><TableHead className="hidden sm:table-cell">المستأجر</TableHead><TableHead className="hidden lg:table-cell">الدور</TableHead><TableHead>الحالة</TableHead><TableHead className="pe-4 text-end">إجراءات</TableHead></TableRow></TableHeader>
        <TableBody>{filtered.map(u => (
          <TableRow key={u.id} className="hover:bg-muted/30">
            <TableCell className="ps-4"><div className="flex items-center gap-3"><div className="h-8 w-8 shrink-0 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 font-bold text-xs">{u.name.charAt(0)}</div><p className="font-medium text-sm truncate">{u.name}</p></div></TableCell>
            <TableCell className="hidden md:table-cell text-muted-foreground text-sm" dir="ltr">{u.email}</TableCell>
            <TableCell className="hidden sm:table-cell text-sm">{u.tenant}</TableCell>
            <TableCell className="hidden lg:table-cell"><Badge variant="secondary" className="text-xs">{u.role}</Badge></TableCell>
            <TableCell><StatusBadge status={u.status} /></TableCell>
            <TableCell className="pe-4"><div className="flex items-center justify-end gap-1"><Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(u)}><Edit className="h-4 w-4" /></Button><Button size="icon" variant="ghost" className="h-8 w-8 text-amber-600" onClick={() => setDlg({ type: 'suspend', user: u })}><PowerOff className="h-4 w-4" /></Button><Button size="icon" variant="ghost" className="h-8 w-8 text-red-600" onClick={() => setDlg({ type: 'delete', user: u })}><Trash2 className="h-4 w-4" /></Button></div></TableCell>
          </TableRow>
        ))}</TableBody></Table>
      </div></CardContent></Card>

      <Dialog open={dlg?.type === 'add' || dlg?.type === 'edit'} onOpenChange={() => setDlg(null)}>
        <DialogContent className="max-w-md"><DialogHeader><DialogTitle>{dlg?.type === 'add' ? 'إضافة مستخدم' : 'تعديل المستخدم'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><label className="text-sm font-medium mb-1 block">الاسم</label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
            <div><label className="text-sm font-medium mb-1 block">البريد</label><Input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} dir="ltr" /></div>
            <div><label className="text-sm font-medium mb-1 block">المستأجر</label><Input value={form.tenant} onChange={e => setForm(p => ({ ...p, tenant: e.target.value }))} /></div>
            <div><label className="text-sm font-medium mb-1 block">الدور</label><Select value={form.role} onValueChange={v => setForm(p => ({ ...p, role: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{['مالك','مدير','موظف استقبال','محاسب'].map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDlg(null)}>إلغاء</Button><Button className="bg-violet-600 hover:bg-violet-700" onClick={handleSave}>حفظ</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <ConfirmDialog open={dlg?.type === 'delete'} onOpenChange={() => setDlg(null)} title="حذف المستخدم" desc={`حذف "${dlg?.user?.name}"؟`} onConfirm={handleDelete} variant="danger" />
      <ConfirmDialog open={dlg?.type === 'suspend'} onOpenChange={() => setDlg(null)} title="تغيير الحالة" desc={`${dlg?.user?.status === 'suspended' ? 'تفعيل' : 'تعليق'} "${dlg?.user?.name}"`} onConfirm={handleToggle} />
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   PAGE 4: PLANS
   ═══════════════════════════════════════════════════════════════ */
function PlansPage() {
  const [plans] = useState(PLANS)
  const [detailPlan, setDetailPlan] = useState<typeof plans[0] | null>(null)
  return (
    <div className="space-y-4">
      <SectionHeader title="الباقات والاشتراكات" action={<Button className="gap-2 bg-violet-600 hover:bg-violet-700 text-sm" onClick={() => toast.success('سيتم فتح نموذج إنشاء باقة جديدة')}><Plus className="h-4 w-4" />إنشاء باقة</Button>} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {plans.map(p => (
          <motion.div key={p.id} variants={fadeIn} initial="hidden" animate="visible" transition={{ delay: plans.indexOf(p) * 0.05 }}>
            <Card className={`h-full relative transition-shadow hover:shadow-lg cursor-pointer ${p.popular ? 'border-violet-500 border-2' : ''}`} onClick={() => setDetailPlan(p)}>
              {p.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2"><Badge className="bg-violet-600 text-white">الأكثر شعبية</Badge></div>}
              <CardContent className="pt-6 flex flex-col items-center text-center p-5">
                <div className={`h-12 w-12 rounded-xl ${p.color} flex items-center justify-center mb-3`}><CreditCard className="h-6 w-6 text-white" /></div>
                <h3 className="font-bold text-lg">{p.name}</h3>
                <p className="text-2xl font-bold mt-2">{p.price > 0 ? `${p.price}` : 'مجاني'} <span className="text-sm font-normal text-muted-foreground">{p.price > 0 ? 'ر.س/شهر' : ''}</span></p>
                <p className="text-xs text-muted-foreground mt-1">{p.tenants} مستأجر</p>
                <Separator className="my-4 w-full" />
                <ul className="space-y-2 w-full text-start">{p.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm"><CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" /><span>{f}</span></li>
                ))}</ul>
                <Button className="w-full mt-4 bg-violet-600 hover:bg-violet-700" variant={p.popular ? 'default' : 'outline'}>إدارة الباقة</Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
      <Dialog open={!!detailPlan} onOpenChange={() => setDetailPlan(null)}>
        <DialogContent className="max-w-md"><DialogHeader><DialogTitle>{detailPlan?.name}</DialogTitle><DialogDescription>تفاصيل الباقة</DialogDescription></DialogHeader>
          {detailPlan && <div className="space-y-4">
            <div className="text-center"><p className="text-3xl font-bold">{detailPlan.price > 0 ? `${detailPlan.price} ر.س` : 'مجاني'}<span className="text-sm text-muted-foreground font-normal">/شهر</span></p><p className="text-sm text-muted-foreground mt-1">{detailPlan.tenants} مستأجر مشترك حالياً</p></div>
            <Separator /><div className="space-y-2">{detailPlan.features.map((f, i) => (<div key={i} className="flex items-center gap-2 text-sm"><CheckCircle2 className="h-4 w-4 text-emerald-500" />{f}</div>))}</div>
          </div>}
          <DialogFooter className="gap-2"><Button variant="outline" onClick={() => setDetailPlan(null)}>إغلاق</Button><Button className="bg-violet-600 hover:bg-violet-700" onClick={() => { toast.success('سيتم فتح تعديل الباقة'); setDetailPlan(null) }}>تعديل الباقة</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   PAGE 5: BILLING
   ═══════════════════════════════════════════════════════════════ */
function BillingPage() {
  const [invoices] = useState(INVOICES)
  const [filter, setFilter] = useState('all')
  const filtered = useMemo(() => filter === 'all' ? invoices : invoices.filter(i => i.status === filter), [invoices, filter])
  const totalPaid = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.amount, 0)
  const totalPending = invoices.filter(i => i.status === 'pending' || i.status === 'overdue').reduce((s, i) => s + i.amount, 0)

  return (
    <div className="space-y-4">
      <SectionHeader title="الفواتير والمدفوعات" action={<Button className="gap-2 bg-violet-600 hover:bg-violet-700 text-sm" onClick={() => toast.success('سيتم إنشاء فاتورة جديدة')}><Plus className="h-4 w-4" />إنشاء فاتورة</Button>} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard icon={<DollarSign className="h-5 w-5 text-white" />} iconBg="bg-emerald-500" value={`${totalPaid.toLocaleString()}`} label="المدفوعات (ر.س)" />
        <KpiCard icon={<Clock className="h-5 w-5 text-white" />} iconBg="bg-amber-500" value={`${totalPending.toLocaleString()}`} label="المعلقة (ر.س)" />
        <KpiCard icon={<CheckCircle2 className="h-5 w-5 text-white" />} iconBg="bg-blue-500" value={`${invoices.filter(i => i.status === 'paid').length}`} label="فواتير مدفوعة" />
        <KpiCard icon={<AlertTriangle className="h-5 w-5 text-white" />} iconBg="bg-red-500" value={`${invoices.filter(i => i.status === 'overdue').length}`} label="فواتير متأخرة" />
      </div>
      <div className="flex gap-3">
        <Select value={filter} onValueChange={setFilter}><SelectTrigger className="w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">الكل</SelectItem><SelectItem value="paid">مدفوع</SelectItem><SelectItem value="pending">معلق</SelectItem><SelectItem value="overdue">متأخر</SelectItem><SelectItem value="failed">فاشل</SelectItem></SelectContent></Select>
      </div>
      <Card className="overflow-hidden"><CardContent className="p-0"><div className="overflow-x-auto">
        <Table><TableHeader><TableRow className="bg-muted/50"><TableHead className="ps-4">رقم الفاتورة</TableHead><TableHead>المستأجر</TableHead><TableHead className="hidden sm:table-cell">الباقة</TableHead><TableHead>المبلغ</TableHead><TableHead>الحالة</TableHead><TableHead className="hidden md:table-cell">التاريخ</TableHead><TableHead className="pe-4 text-end">إجراءات</TableHead></TableRow></TableHeader>
        <TableBody>{filtered.map(inv => (
          <TableRow key={inv.id} className="hover:bg-muted/30">
            <TableCell className="ps-4 font-mono text-sm font-medium">{inv.id}</TableCell>
            <TableCell className="text-sm">{inv.tenant}</TableCell>
            <TableCell className="hidden sm:table-cell"><Badge variant="secondary">{inv.plan}</Badge></TableCell>
            <TableCell className="font-semibold tabular-nums">{inv.amount.toLocaleString()} ر.س</TableCell>
            <TableCell><StatusBadge status={inv.status} /></TableCell>
            <TableCell className="hidden md:table-cell text-xs text-muted-foreground">{inv.date}</TableCell>
            <TableCell className="pe-4"><div className="flex justify-end gap-1"><Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={() => toast.info(`عرض فاتورة ${inv.id}`)}><Eye className="h-3.5 w-3.5" /><span className="hidden sm:inline">عرض</span></Button><Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={() => toast.success(`تم تنزيل فاتورة ${inv.id}`)}><Download className="h-3.5 w-3.5" /></Button></div></TableCell>
          </TableRow>
        ))}</TableBody></Table>
      </div></CardContent></Card>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   PAGE 6: ROLES
   ═══════════════════════════════════════════════════════════════ */
function RolesPage() {
  const [roles] = useState(ROLES)
  const [addOpen, setAddOpen] = useState(false)
  const [form, setForm] = useState({ name: '', nameEn: '', desc: '' })
  return (
    <div className="space-y-4">
      <SectionHeader title="الأدوار والصلاحيات" action={<Button className="gap-2 bg-violet-600 hover:bg-violet-700 text-sm" onClick={() => setAddOpen(true)}><Plus className="h-4 w-4" />إضافة دور</Button>} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {roles.map(r => (
          <Card key={r.id} className="transition-shadow hover:shadow-md cursor-pointer" onClick={() => toast.info(`فتح صلاحيات الدور: ${r.name}`)}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="h-10 w-10 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center"><Shield className="h-5 w-5 text-violet-600" /></div>
                <Badge variant="secondary">{r.permissions} صلاحية</Badge>
              </div>
              <h3 className="font-bold">{r.name}</h3>
              <p className="text-xs text-muted-foreground mb-3">{r.nameEn}</p>
              <p className="text-sm text-muted-foreground mb-4">{r.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{r.users} مستخدم</span>
                <div className="flex gap-1"><Button size="icon" variant="ghost" className="h-7 w-7" onClick={e => { e.stopPropagation(); toast.info('تعديل الدور') }}><Edit className="h-3.5 w-3.5" /></Button><Button size="icon" variant="ghost" className="h-7 w-7 text-red-600" onClick={e => { e.stopPropagation(); toast.success('تم حذف الدور') }}><Trash2 className="h-3.5 w-3.5" /></Button></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md"><DialogHeader><DialogTitle>إضافة دور جديد</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><label className="text-sm font-medium mb-1 block">اسم الدور (عربي)</label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
            <div><label className="text-sm font-medium mb-1 block">اسم الدور (إنجليزي)</label><Input value={form.nameEn} onChange={e => setForm(p => ({ ...p, nameEn: e.target.value }))} dir="ltr" /></div>
            <div><label className="text-sm font-medium mb-1 block">الوصف</label><Input value={form.desc} onChange={e => setForm(p => ({ ...p, desc: e.target.value }))} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setAddOpen(false)}>إلغاء</Button><Button className="bg-violet-600 hover:bg-violet-700" onClick={() => { toast.success('تم إنشاء الدور'); setAddOpen(false) }}>إنشاء</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   PAGE 7: AUDIT LOGS
   ═══════════════════════════════════════════════════════════════ */
function AuditPage() {
  const [logs] = useState(INIT_LOGS)
  const [filter, setFilter] = useState('all')
  const filtered = useMemo(() => filter === 'all' ? logs : logs.filter(l => l.level === filter), [logs, filter])
  return (
    <div className="space-y-4">
      <SectionHeader title="سجل العمليات" action={<Button className="gap-2 text-sm" variant="outline" onClick={() => toast.success('تم تصدير السجل')}><Download className="h-4 w-4" />تصدير السجل</Button>} />
      <div className="flex flex-wrap gap-2">
        {['all','info','success','warn','error'].map(f => (<Button key={f} size="sm" variant={filter === f ? 'default' : 'outline'} className="text-xs" onClick={() => setFilter(f)}>{f === 'all' ? 'الكل' : f.toUpperCase()}</Button>))}
      </div>
      <Card><CardContent className="p-0"><div className="overflow-x-auto">
        <Table><TableHeader><TableRow className="bg-muted/50"><TableHead className="ps-4 w-24">المستوى</TableHead><TableHead>الرسالة</TableHead><TableHead className="hidden sm:table-cell">المصدر</TableHead><TableHead className="pe-4">التاريخ</TableHead></TableRow></TableHeader>
        <TableBody>{filtered.map(l => (
          <TableRow key={l.id} className="hover:bg-muted/30">
            <TableCell className="ps-4"><LogBadge level={l.level} /></TableCell>
            <TableCell className="text-sm">{l.message}</TableCell>
            <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">{l.source}</TableCell>
            <TableCell className="text-xs text-muted-foreground pe-4 whitespace-nowrap">{new Date(l.timestamp).toLocaleString('ar-SA')}</TableCell>
          </TableRow>
        ))}</TableBody></Table>
      </div></CardContent></Card>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   PAGE 8: NOTIFICATIONS
   ═══════════════════════════════════════════════════════════════ */
function NotificationsPage() {
  const [templates] = useState([
    { id: '1', name: 'ترحيب مستأجر جديد', type: 'بريد إلكتروني', status: 'active', sent: 156 },
    { id: '2', name: 'تذكير بالدفع', type: 'بريد + SMS', status: 'active', sent: 89 },
    { id: '3', name: 'إشعار تعليق الحساب', type: 'بريد إلكتروني', status: 'active', sent: 12 },
    { id: '4', name: 'تقرير أسبوعي', type: 'بريد إلكتروني', status: 'inactive', sent: 0 },
  ])
  const [sendOpen, setSendOpen] = useState(false)
  const [msg, setMsg] = useState({ title: '', body: '', target: 'all' })
  return (
    <div className="space-y-4">
      <SectionHeader title="الإشعارات" action={<Button className="gap-2 bg-violet-600 hover:bg-violet-700 text-sm" onClick={() => setSendOpen(true)}><Bell className="h-4 w-4" />إرسال إشعار</Button>} />
      <Card className="overflow-hidden"><CardContent className="p-0"><div className="overflow-x-auto">
        <Table><TableHeader><TableRow className="bg-muted/50"><TableHead className="ps-4">القالب</TableHead><TableHead className="hidden sm:table-cell">النوع</TableHead><TableHead>الحالة</TableHead><TableHead className="hidden md:table-cell">مرات الإرسال</TableHead><TableHead className="pe-4 text-end">إجراءات</TableHead></TableRow></TableHeader>
        <TableBody>{templates.map(t => (
          <TableRow key={t.id} className="hover:bg-muted/30">
            <TableCell className="ps-4 font-medium text-sm">{t.name}</TableCell>
            <TableCell className="hidden sm:table-cell text-sm">{t.type}</TableCell>
            <TableCell><StatusBadge status={t.status} /></TableCell>
            <TableCell className="hidden md:table-cell tabular-nums">{t.sent}</TableCell>
            <TableCell className="pe-4"><div className="flex justify-end gap-1"><Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => toast.info('تعديل القالب')}><Edit className="h-3.5 w-3.5" /></Button><Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => toast.success('تم إرسال اختبار')}><Mail className="h-3.5 w-3.5" /></Button></div></TableCell>
          </TableRow>
        ))}</TableBody></Table>
      </div></CardContent></Card>
      <Dialog open={sendOpen} onOpenChange={setSendOpen}>
        <DialogContent className="max-w-md"><DialogHeader><DialogTitle>إرسال إشعار</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><label className="text-sm font-medium mb-1 block">العنوان</label><Input value={msg.title} onChange={e => setMsg(p => ({ ...p, title: e.target.value }))} placeholder="عنوان الإشعار" /></div>
            <div><label className="text-sm font-medium mb-1 block">المحتوى</label><Input value={msg.body} onChange={e => setMsg(p => ({ ...p, body: e.target.value }))} placeholder="نص الإشعار" /></div>
            <div><label className="text-sm font-medium mb-1 block">الفئة المستهدفة</label><Select value={msg.target} onValueChange={v => setMsg(p => ({ ...p, target: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">جميع المستأجرين</SelectItem><SelectItem value="active">المستأجرون النشطون</SelectItem><SelectItem value="trial">الحسابات التجريبية</SelectItem><SelectItem value="enterprise">خطة مؤسسية</SelectItem></SelectContent></Select></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setSendOpen(false)}>إلغاء</Button><Button className="bg-violet-600 hover:bg-violet-700" onClick={() => { toast.success('تم إرسال الإشعار بنجاح'); setSendOpen(false) }}>إرسال</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   PAGE 9: REPORTS
   ═══════════════════════════════════════════════════════════════ */
function ReportsPage() {
  const reports = [
    { id: '1', name: 'تقرير الإيرادات الشهري', desc: 'ملخص شامل للإيرادات حسب المستأجر والباقة', type: 'مالي', lastGen: '2025-06-18' },
    { id: '2', name: 'تقرير النمو', desc: 'معدلات النمو في المستأجرين والحجوزات', type: 'تشغيلي', lastGen: '2025-06-17' },
    { id: '3', name: 'تقرير الأمان', desc: 'محاولات الدخول والتهديدات الأمنية', type: 'أمني', lastGen: '2025-06-18' },
    { id: '4', name: 'تقرير الأداء', desc: 'أداء الخوادم وAPI واستجابة النظام', type: 'تقني', lastGen: '2025-06-16' },
    { id: '5', name: 'تقرير المستخدمين', desc: 'نشاط المستخدمين وتوزيع الأدوار', type: 'تشغيلي', lastGen: '2025-06-15' },
  ]
  return (
    <div className="space-y-4">
      <SectionHeader title="التقارير" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {reports.map(r => (
          <Card key={r.id} className="transition-shadow hover:shadow-md">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center"><BarChart3 className="h-5 w-5 text-blue-600" /></div>
                <Badge variant="outline" className="text-xs">{r.type}</Badge>
              </div>
              <h3 className="font-bold text-sm mb-1">{r.name}</h3>
              <p className="text-xs text-muted-foreground mb-4">{r.desc}</p>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">آخر توليد: {r.lastGen}</span>
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => toast.success('جاري توليد التقرير...')}><RefreshCw className="h-3 w-3" />توليد</Button>
                  <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={() => toast.success('جاري التنزيل...')}><Download className="h-3 w-3" /></Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   PAGE 10: SYSTEM HEALTH
   ═══════════════════════════════════════════════════════════════ */
function SystemPage() {
  const gauges = [
    { label: 'API', value: 99, icon: <Server className="h-3.5 w-3.5" /> },
    { label: 'قاعدة البيانات', value: 85, icon: <Database className="h-3.5 w-3.5" /> },
    { label: 'الذاكرة', value: 78, icon: <Monitor className="h-3.5 w-3.5" /> },
    { label: 'القرص', value: 62, icon: <HardDrive className="h-3.5 w-3.5" /> },
    { label: 'CDN', value: 100, icon: <Globe className="h-3.5 w-3.5" /> },
    { label: 'Worker', value: 95, icon: <RefreshCw className="h-3.5 w-3.5" /> },
  ]
  return (
    <div className="space-y-5">
      <SectionHeader title="صحة النظام" action={<Button className="gap-2 text-sm" variant="outline" onClick={() => toast.success('تم تحديث البيانات')}><RefreshCw className="h-4 w-4" />تحديث</Button>} />
      <motion.div variants={stagger} initial="hidden" animate="visible" className="grid grid-cols-3 sm:grid-cols-6 gap-3 sm:gap-4">
        {gauges.map(g => (
          <motion.div key={g.label} variants={fadeIn} className="flex flex-col items-center gap-2 rounded-xl border p-3 sm:p-4">
            <Gauge value={g.value} size="sm" />
            <div className="flex items-center gap-1 text-muted-foreground">{g.icon}<span className="text-[10px] sm:text-xs font-medium">{g.label}</span></div>
          </motion.div>
        ))}
      </motion.div>
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm sm:text-base">سجل النظام</CardTitle></CardHeader>
        <CardContent><ScrollArea className="max-h-80"><div className="space-y-2">{INIT_LOGS.map(l => (
          <div key={l.id} className="flex gap-2 rounded-lg p-2.5 hover:bg-muted/50"><LogBadge level={l.level} /><div className="min-w-0 flex-1"><p className="text-xs sm:text-sm">{l.message}</p><p className="text-[10px] text-muted-foreground">{l.source} — {new Date(l.timestamp).toLocaleString('ar-SA')}</p></div></div>
        ))}</div></ScrollArea></CardContent>
      </Card>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   PAGE 11: SERVERS
   ═══════════════════════════════════════════════════════════════ */
function ServersPage() {
  const [servers] = useState(SERVERS)
  const [addOpen, setAddOpen] = useState(false)
  return (
    <div className="space-y-4">
      <SectionHeader title="الخوادم" action={<Button className="gap-2 bg-violet-600 hover:bg-violet-700 text-sm" onClick={() => setAddOpen(true)}><Plus className="h-4 w-4" />إضافة خادم</Button>} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {servers.map(s => (
          <Card key={s.id} className="transition-shadow hover:shadow-md">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3"><div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center"><Server className="h-5 w-5 text-blue-600" /></div><div><h3 className="font-bold text-sm">{s.name}</h3><p className="text-xs text-muted-foreground">{s.region}</p></div></div>
                <StatusBadge status={s.status} />
              </div>
              <div className="grid grid-cols-4 gap-3">
                {[{ l: 'CPU', v: s.cpu }, { l: 'الذاكرة', v: s.memory }, { l: 'القرص', v: s.disk }, { l: 'Uptime', v: parseInt(s.uptime) }].map(m => (
                  <div key={m.l} className="text-center"><Gauge value={m.v} size="sm" /><p className="text-[10px] text-muted-foreground mt-1">{m.l}</p></div>
                ))}
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground"><span>الطلبات: {s.requests}</span><div className="flex gap-1"><Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => toast.info('إعادة تشغيل الخادم')}><RefreshCw className="h-3 w-3" /></Button><Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => toast.info('تفاصيل الخادم')}><Eye className="h-3 w-3" /></Button></div></div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-sm"><DialogHeader><DialogTitle>إضافة خادم</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><label className="text-sm font-medium mb-1 block">اسم الخادم</label><Input placeholder="API Server #3" /></div>
            <div><label className="text-sm font-medium mb-1 block">المنطقة</label><Select defaultValue="riyadh"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="riyadh">الرياض</SelectItem><SelectItem value="jeddah">جدة</SelectItem><SelectItem value="dubai">دبي</SelectItem></SelectContent></Select></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setAddOpen(false)}>إلغاء</Button><Button className="bg-violet-600 hover:bg-violet-700" onClick={() => { toast.success('تم إضافة الخادم'); setAddOpen(false) }}>إضافة</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   PAGE 12: DATABASE
   ═══════════════════════════════════════════════════════════════ */
function DatabasePage() {
  const [backups] = useState([
    { id: '1', date: '2025-06-18 06:00', size: '2.4 GB', type: 'تلقائي', status: 'success' },
    { id: '2', date: '2025-06-17 06:00', size: '2.3 GB', type: 'تلقائي', status: 'success' },
    { id: '3', date: '2025-06-16 18:30', size: '2.3 GB', type: 'يدوي', status: 'success' },
    { id: '4', date: '2025-06-16 06:00', size: '2.2 GB', type: 'تلقائي', status: 'failed' },
  ])
  return (
    <div className="space-y-5">
      <SectionHeader title="قاعدة البيانات" action={<Button className="gap-2 bg-violet-600 hover:bg-violet-700 text-sm" onClick={() => toast.success('جاري إنشاء نسخة احتياطية...')}><Database className="h-4 w-4" />نسخ احتياطي الآن</Button>} />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiCard icon={<Database className="h-5 w-5 text-white" />} iconBg="bg-blue-500" value="2.4 GB" label="حجم القاعدة" />
        <KpiCard icon={<HardDrive className="h-5 w-5 text-white" />} iconBg="bg-emerald-500" value="156K" label="عدد الجداول" />
        <KpiCard icon={<Activity className="h-5 w-5 text-white" />} iconBg="bg-amber-500" value="23ms" label="متوسط الاستجابة" />
        <KpiCard icon={<Clock className="h-5 w-5 text-white" />} iconBg="bg-violet-500" value="4" label="النسخ الاحتياطية" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm sm:text-base">استخدام الموارد</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {[{ l: 'CPU', v: 45 }, { l: 'الذاكرة', v: 72 }, { l: 'القرص', v: 58 }, { l: 'الاتصالات', v: 34 }].map(r => (
              <div key={r.l}><div className="flex justify-between text-sm mb-1"><span>{r.l}</span><span className="font-medium tabular-nums">{r.v}%</span></div><Progress value={r.v} className="h-2" /></div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm sm:text-base flex items-center gap-2"><Database className="h-4 w-4 text-blue-500" />النسخ الاحتياطية</CardTitle></CardHeader>
          <CardContent><div className="space-y-2">{backups.map(b => (
            <div key={b.id} className="flex items-center gap-3 rounded-lg border p-3">
              <StatusBadge status={b.status === 'success' ? 'active' : 'suspended'} />
              <div className="min-w-0 flex-1"><p className="text-sm font-medium">{b.date}</p><p className="text-xs text-muted-foreground">{b.type} · {b.size}</p></div>
              <Button size="sm" variant="ghost" className="h-7 text-xs shrink-0" onClick={() => toast.success('جاري التنزيل...')}><Download className="h-3.5 w-3.5" /></Button>
            </div>
          ))}</div></CardContent>
        </Card>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   PAGE 13: SECURITY
   ═══════════════════════════════════════════════════════════════ */
function SecurityPage() {
  const [settings, setSettings] = useState({ twoFactor: true, ipWhitelist: false, bruteForce: true, sessionTimeout: true, auditLog: true, encryptData: true })
  const [attempts] = useState([
    { ip: '192.168.1.55', time: '2025-06-18 23:00', status: 'blocked', country: 'مجهول' },
    { ip: '10.0.0.12', time: '2025-06-18 20:15', status: 'blocked', country: 'مجهول' },
    { ip: '172.16.0.8', time: '2025-06-18 15:30', status: 'allowed', country: 'السعودية' },
  ])
  const toggle = (key: keyof typeof settings) => { setSettings(p => ({ ...p, [key]: !p[key] })); toast.success('تم تحديث الإعداد') }
  return (
    <div className="space-y-5">
      <SectionHeader title="الأمان" />
      <Card><CardHeader><CardTitle className="text-sm sm:text-base flex items-center gap-2"><Lock className="h-4 w-4 text-violet-500" />إعدادات الأمان</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {[{ key: 'twoFactor' as const, label: 'المصادقة الثنائية', desc: 'تطلب رمز تحقق إضافي عند تسجيل الدخول' },
            { key: 'ipWhitelist' as const, label: 'القائمة البيضاء لعناوين IP', desc: 'السماح فقط بعناوين IP المعتمدة للوصول' },
            { key: 'bruteForce' as const, label: 'حماية القوة الغاشمة', desc: 'حظر تلقائي بعد 5 محاولات فاشلة' },
            { key: 'sessionTimeout' as const, label: 'انتهاء الجلسة', desc: 'إنهاء الجلسة بعد 30 دقيقة من عدم النشاط' },
            { key: 'auditLog' as const, label: 'تسجيل العمليات', desc: 'تسجيل جميع العمليات الحساسة في السجل' },
            { key: 'encryptData' as const, label: 'تشفير البيانات', desc: 'تشفير البيانات الحساسة في التخزين' },
          ].map(s => (
            <div key={s.key} className="flex items-center justify-between gap-4 py-2">
              <div className="min-w-0"><p className="text-sm font-medium">{s.label}</p><p className="text-xs text-muted-foreground">{s.desc}</p></div>
              <button onClick={() => toggle(s.key)} className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${settings[s.key] ? 'bg-violet-600' : 'bg-muted'}`}>
                <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${settings[s.key] ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-sm sm:text-base flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-500" />محاولات الدخول المشبوهة</CardTitle></CardHeader>
        <CardContent><div className="overflow-x-auto">
          <Table><TableHeader><TableRow className="bg-muted/50"><TableHead className="ps-4">عنوان IP</TableHead><TableHead>الوقت</TableHead><TableHead className="hidden sm:table-cell">الموقع</TableHead><TableHead className="pe-4">الحالة</TableHead></TableRow></TableHeader>
          <TableBody>{attempts.map((a, i) => (
            <TableRow key={i} className="hover:bg-muted/30">
              <TableCell className="ps-4 font-mono text-sm" dir="ltr">{a.ip}</TableCell>
              <TableCell className="text-xs text-muted-foreground">{a.time}</TableCell>
              <TableCell className="hidden sm:table-cell text-sm">{a.country}</TableCell>
              <TableCell className="pe-4"><StatusBadge status={a.status === 'blocked' ? 'suspended' : 'active'} /></TableCell>
            </TableRow>
          ))}</TableBody></Table>
        </div></CardContent>
      </Card>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   PAGE 14: SETTINGS
   ═══════════════════════════════════════════════════════════════ */
function SettingsPage() {
  const [form, setForm] = useState({ platformName: 'BookFlow', supportEmail: 'support@bookflow.com', currency: 'SAR', timezone: 'Asia/Riyadh', maintenance: false, registration: true, maxTenants: '500', backupFreq: 'daily' })
  const handleSave = () => { toast.success('تم حفظ الإعدادات بنجاح') }
  return (
    <div className="space-y-5">
      <SectionHeader title="إعدادات المنصة" action={<Button className="gap-2 bg-violet-600 hover:bg-violet-700 text-sm" onClick={handleSave}><Save className="h-4 w-4" />حفظ الإعدادات</Button>} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card><CardHeader><CardTitle className="text-sm sm:text-base">الإعدادات العامة</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div><label className="text-sm font-medium mb-1 block">اسم المنصة</label><Input value={form.platformName} onChange={e => setForm(p => ({ ...p, platformName: e.target.value }))} /></div>
            <div><label className="text-sm font-medium mb-1 block">بريد الدعم</label><Input type="email" value={form.supportEmail} onChange={e => setForm(p => ({ ...p, supportEmail: e.target.value }))} dir="ltr" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-sm font-medium mb-1 block">العملة</label><Select value={form.currency} onValueChange={v => setForm(p => ({ ...p, currency: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="SAR">ر.س (SAR)</SelectItem><SelectItem value="AED">د.إ (AED)</SelectItem><SelectItem value="USD">$ (USD)</SelectItem><SelectItem value="EGP">ج.م (EGP)</SelectItem></SelectContent></Select></div>
              <div><label className="text-sm font-medium mb-1 block">المنطقة الزمنية</label><Select value={form.timezone} onValueChange={v => setForm(p => ({ ...p, timezone: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Asia/Riyadh">الرياض</SelectItem><SelectItem value="Asia/Dubai">دبي</SelectItem><SelectItem value="Africa/Cairo">القاهرة</SelectItem></SelectContent></Select></div>
            </div>
          </CardContent>
        </Card>
        <Card><CardHeader><CardTitle className="text-sm sm:text-base">إعدادات متقدمة</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div><label className="text-sm font-medium mb-1 block">الحد الأقصى للمستأجرين</label><Input type="number" value={form.maxTenants} onChange={e => setForm(p => ({ ...p, maxTenants: e.target.value }))} /></div>
            <div><label className="text-sm font-medium mb-1 block">تكرار النسخ الاحتياطي</label><Select value={form.backupFreq} onValueChange={v => setForm(p => ({ ...p, backupFreq: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="hourly">كل ساعة</SelectItem><SelectItem value="daily">يومياً</SelectItem><SelectItem value="weekly">أسبوعياً</SelectItem></SelectContent></Select></div>
            <div className="flex items-center justify-between py-2"><div><p className="text-sm font-medium">وضع الصيانة</p><p className="text-xs text-muted-foreground">تعطيل الوصول مؤقتاً للصيانة</p></div>
              <button onClick={() => { setForm(p => ({ ...p, maintenance: !p.maintenance })); toast.success('تم تحديث الوضع') }} className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${form.maintenance ? 'bg-amber-500' : 'bg-muted'}`}><span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${form.maintenance ? 'translate-x-6' : 'translate-x-1'}`} /></button>
            </div>
            <div className="flex items-center justify-between py-2"><div><p className="text-sm font-medium">التسجيل المفتوح</p><p className="text-xs text-muted-foreground">السماح بالتسجيل الذاتي للمستأجرين</p></div>
              <button onClick={() => { setForm(p => ({ ...p, registration: !p.registration })); toast.success('تم تحديث الإعداد') }} className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${form.registration ? 'bg-violet-600' : 'bg-muted'}`}><span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${form.registration ? 'translate-x-6' : 'translate-x-1'}`} /></button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   MAIN: SuperAdminDashboard
   ═══════════════════════════════════════════════════════════════ */
const PAGE_MAP: Record<string, () => React.JSX.Element> = {
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

  // Security: redirect if no auth
  useEffect(() => {
    const token = localStorage.getItem('bf_sa_token')
    if (!token && !isAuthenticated) { logout() }
  }, [isAuthenticated, logout])

  const PageComponent = PAGE_MAP[superAdminView] || OverviewPage

  return (
    <motion.div key={superAdminView} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="p-4 sm:p-6 max-w-[1600px] mx-auto w-full">
      <PageComponent />
    </motion.div>
  )
}
"""

filepath = '/home/z/my-project/src/components/super-admin/super-admin-dashboard.tsx'
with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print(f'Written {len(content)} chars to {filepath}')
