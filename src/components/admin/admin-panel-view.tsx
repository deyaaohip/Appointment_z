'use client'

import { authFetch } from '@/lib/auth-fetch'


import { useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { useQuery } from '@tanstack/react-query'
import {
  Building2,
  Users,
  DollarSign,
  CalendarDays,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Wifi,
  Clock,
  Shield,
  TrendingUp,
  CheckCircle2,
  Plus,
  BarChart3,
  Settings,
  CreditCard,
  Zap,
} from 'lucide-react'
import { useAppStore } from '@/stores/app-store'
import { t, formatCurrency, formatDateTime, getDirection } from '@/lib/i18n'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// ─── Animation Variants ─────────────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
}

// ─── Mock Data ──────────────────────────────────────────────────────────────

interface TenantRow {
  id: string
  name: string
  plan: string
  bookings: number
  revenue: number
  status: 'active' | 'suspended' | 'trial'
}

const MOCK_TENANTS: TenantRow[] = [
  { id: '1', name: 'مركز النور الطبي', plan: 'Enterprise', bookings: 1250, revenue: 187500, status: 'active' },
  { id: '2', name: 'صالون ياسمين', plan: 'Professional', bookings: 680, revenue: 54200, status: 'active' },
  { id: '3', name: 'أكاديمية المستقبل', plan: 'Professional', bookings: 420, revenue: 38000, status: 'active' },
  { id: '4', name: 'عيادة الأسنان الحديثة', plan: 'Starter', bookings: 45, revenue: 0, status: 'trial' },
  { id: '5', name: 'نادي اللياقة الذهبية', plan: 'Professional', bookings: 310, revenue: 22000, status: 'suspended' },
  { id: '6', name: 'مركز التجميل الملكي', plan: 'Enterprise', bookings: 920, revenue: 145000, status: 'active' },
]

const MOCK_ACTIVITY = [
  { id: '1', user: 'أحمد المطيري', action: 'tenant_created', time: '2025-01-18T14:30:00Z', desc: 'تم إنشاء مستأجر جديد: عيادة الابتسامة' },
  { id: '2', user: 'نظام الدفع', action: 'payment_success', time: '2025-01-18T14:15:00Z', desc: 'دفعة ناجحة: 599 ر.س — خطة Enterprise' },
  { id: '3', user: 'سارة الأحمد', action: 'plan_upgrade', time: '2025-01-18T13:45:00Z', desc: 'ترقية من Starter إلى Professional' },
  { id: '4', user: 'محمد العتيبي', action: 'tenant_suspended', time: '2025-01-18T12:00:00Z', desc: 'تعليق المستأجر: نادي اللياقة الذهبية' },
  { id: '5', user: 'النظام', action: 'backup_complete', time: '2025-01-18T06:00:00Z', desc: 'اكتمل النسخ الاحتياطي اليومي بنجاح' },
  { id: '6', user: 'فاطمة الحربي', action: 'support_ticket', time: '2025-01-18T10:30:00Z', desc: 'تذكرة دعم جديدة: مشكلة في ربط النطاق' },
]

// ─── Sub-Components ─────────────────────────────────────────────────────────

function TenantStatusBadge({ status }: { status: string }) {
  const { locale } = useAppStore()
  const styles: Record<string, string> = {
    active: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-400',
    suspended: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-400',
    trial: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-400',
  }
  return (
    <Badge variant="outline" className={styles[status] ?? ''}>
      {t(locale, 'admin', status)}
    </Badge>
  )
}

function KpiCard({
  icon,
  iconBg,
  value,
  label,
  trend,
}: {
  icon: React.ReactNode
  iconBg: string
  value: string
  label: string
  trend: number
}) {
  const isPositive = trend >= 0
  return (
    <motion.div variants={itemVariants}>
      <Card className="transition-shadow duration-200 hover:shadow-md">
        <CardContent className="flex items-center gap-4 p-4">
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${iconBg}`}>
            {icon}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-2xl font-bold leading-tight tracking-tight">{value}</p>
            <p className="truncate text-sm text-muted-foreground">{label}</p>
          </div>
          <div
            className={`flex shrink-0 items-center gap-0.5 text-sm font-medium ${
              isPositive ? 'text-emerald-600' : 'text-red-500'
            }`}
          >
            {isPositive ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
            {Math.abs(trend)}%
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function HealthBar({ label, value, status }: { label: string; value: number; status: 'healthy' | 'warning' | 'critical' }) {
  const colorMap = {
    healthy: 'bg-emerald-500',
    warning: 'bg-amber-500',
    critical: 'bg-red-500',
  }
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{value}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-muted">
        <div className={`h-full rounded-full transition-all ${colorMap[status]}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function AdminPanelView() {
  const { locale, setCurrentView } = useAppStore()
  const dir = getDirection(locale)

  const [addTenantOpen, setAddTenantOpen] = useState(false)
  const [tenantName, setTenantName] = useState('')
  const [tenantEmail, setTenantEmail] = useState('')
  const [tenantPlan, setTenantPlan] = useState('')
  const numberFmt = locale === 'ar' ? 'ar-SA' : 'en-US'

  const totalUsers = MOCK_TENANTS.reduce((sum, t) => sum + Math.floor(t.bookings * 0.2), 0)
  const totalRevenue = MOCK_TENANTS.reduce((sum, t) => sum + t.revenue, 0)
  const totalBookings = MOCK_TENANTS.reduce((sum, t) => sum + t.bookings, 0)

  const { data: topTenants = [], isLoading, error: topTenantsError } = useQuery({
    queryKey: ['admin-tenants'],
    queryFn: () => authFetch('/api/admin/tenants').then(r => r.json()),
  })

  const quickActions = [
    { icon: <Plus className="h-5 w-5" />, label: t(locale, 'admin', 'addTenant') ?? (locale === 'ar' ? 'إضافة مستأجر' : 'Add Tenant'), onClick: () => setAddTenantOpen(true) },
    { icon: <BarChart3 className="h-5 w-5" />, label: t(locale, 'nav', 'reports'), onClick: () => setCurrentView('reports') },
    { icon: <Settings className="h-5 w-5" />, label: t(locale, 'nav', 'settings'), onClick: () => setCurrentView('settings') },
    { icon: <CreditCard className="h-5 w-5" />, label: t(locale, 'admin', 'planManagement'), onClick: () => setCurrentView('subscriptions') },
  ]

  return (
    <motion.div
      dir={dir}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="space-y-6"
    >
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">{t(locale, 'admin', 'title')}</h1>
        <p className="text-sm text-muted-foreground">{t(locale, 'admin', 'systemOverview')}</p>
      </div>

      {/* ── KPI Cards ──────────────────────────────────────────────────── */}
      <motion.div
        dir={dir}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <KpiCard
          icon={<Building2 className="h-6 w-6 text-white" />}
          iconBg="bg-emerald-500"
          value={MOCK_TENANTS.length.toLocaleString(numberFmt)}
          label={t(locale, 'admin', 'totalTenants')}
          trend={12}
        />
        <KpiCard
          icon={<Users className="h-6 w-6 text-white" />}
          iconBg="bg-blue-500"
          value={totalUsers.toLocaleString(numberFmt)}
          label={t(locale, 'admin', 'totalUsers')}
          trend={8}
        />
        <KpiCard
          icon={<DollarSign className="h-6 w-6 text-white" />}
          iconBg="bg-amber-500"
          value={formatCurrency(totalRevenue, 'SAR', locale)}
          label={t(locale, 'admin', 'totalRevenue')}
          trend={18}
        />
        <KpiCard
          icon={<CalendarDays className="h-6 w-6 text-white" />}
          iconBg="bg-violet-500"
          value={totalBookings.toLocaleString(numberFmt)}
          label={t(locale, 'admin', 'totalBookings')}
          trend={5}
        />
      </motion.div>

      {/* ── Quick Actions Grid ──────────────────────────────────────────── */}
      <motion.div
        dir={dir}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.15 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-500" />
              {locale === 'ar' ? 'إجراءات سريعة' : 'Quick Actions'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <motion.div
              dir={dir}
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-2 gap-3 sm:grid-cols-4"
            >
              {quickActions.map((action) => (
                <motion.button
                  key={action.label}
                  variants={itemVariants}
                  onClick={action.onClick}
                  className="flex flex-col items-center gap-3 rounded-xl border border-border bg-background p-5 text-center transition-all hover:border-emerald-300 hover:shadow-md hover:bg-emerald-50/50 dark:hover:border-emerald-800 dark:hover:bg-emerald-900/20"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400">
                    {action.icon}
                  </div>
                  <span className="text-sm font-medium">{action.label}</span>
                </motion.button>
              ))}
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── System Health + Recent Activity ────────────────────────────── */}
      <div dir={dir} className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* System Health */}
        <motion.div
          dir={dir}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.2 }}
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-emerald-600" />
                {t(locale, 'admin', 'systemHealth')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Status indicators */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: <Wifi className="h-4 w-4" />, label: t(locale, 'admin', 'systemOnline'), color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30' },
                  { icon: <Clock className="h-4 w-4" />, label: '99.97%', color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30', sublabel: t(locale, 'admin', 'uptime') },
                  { icon: <Activity className="h-4 w-4" />, label: '45ms', color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30', sublabel: t(locale, 'admin', 'avgResponseTime') },
                  { icon: <TrendingUp className="h-4 w-4" />, label: '24', color: 'text-violet-600 bg-violet-100 dark:bg-violet-900/30', sublabel: locale === 'ar' ? 'اتصالات قاعدة البيانات' : 'DB Connections' },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    transition={{ delay: 0.25 + i * 0.05 }}
                    className={`flex items-center gap-3 rounded-lg p-3 ${item.color}`}
                  >
                    {item.icon}
                    <div>
                      <p className="text-sm font-bold">{item.label}</p>
                      {item.sublabel && <p className="text-xs opacity-75">{item.sublabel}</p>}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Resource bars */}
              <div className="space-y-3 pt-2">
                <HealthBar label={t(locale, 'admin', 'cpuUsage')} value={23} status="healthy" />
                <HealthBar label={t(locale, 'admin', 'memoryUsage')} value={61} status="healthy" />
                <HealthBar label={t(locale, 'admin', 'storageUsage')} value={42} status="healthy" />
              </div>

              <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-800 dark:bg-emerald-900/20">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                  {t(locale, 'admin', 'systemOnline')} — {t(locale, 'admin', 'activeConnections')}: 1,247
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Activity Feed */}
        <motion.div
          dir={dir}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.25 }}
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-500" />
                {t(locale, 'admin', 'recentActivity')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-96">
                <div className="space-y-1">
                  {MOCK_ACTIVITY.map((activity, i) => (
                    <motion.div
                      key={activity.id}
                      variants={itemVariants}
                      initial="hidden"
                      animate="visible"
                      transition={{ delay: 0.3 + i * 0.05 }}
                      className="flex gap-3 rounded-lg p-3 transition-colors hover:bg-muted/50"
                    >
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                        {activity.user[0]}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{activity.user}</p>
                        <p className="text-sm text-muted-foreground">{activity.desc}</p>
                        <p className="mt-1 text-xs text-muted-foreground/70">
                          {formatDateTime(activity.time, locale)}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* ── Top Tenants ──────────────────────────────────────────────────── */}
      <motion.div
        dir={dir}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.3 }}
      >
        {/* Top Tenants */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-lg" />
            ))}
          </div>
        ) : topTenantsError || topTenants.length === 0 ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-lg" />
            ))}
          </div>
        ) : (
          <Card className="p-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">{t(locale, 'admin', 'topTenants')}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-10 ps-4 text-center">#</TableHead>
                      <TableHead>{t(locale, 'admin', 'tenantName')}</TableHead>
                      <TableHead>{t(locale, 'admin', 'plan')}</TableHead>
                      <TableHead className="text-end pe-4">{t(locale, 'admin', 'bookings')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topTenants.map((t, idx) => (
                      <TableRow key={t.id} className="hover:bg-muted/50">
                        <TableCell className="w-10 ps-4 text-center font-medium text-muted-foreground">{idx + 1}</TableCell>
                        <TableCell className="font-medium">{t.name}</TableCell>
                        <TableCell className="text-center">{t.plan || '—'}</TableCell>
                        <TableCell className="text-end pe-4 tabular-nums">{t.totalBookings ?? 0}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </motion.div>

      {/* ── Add Tenant Dialog ────────────────────────────────────────── */}
      <Dialog open={addTenantOpen} onOpenChange={setAddTenantOpen}>
        <DialogContent dir={dir}>
          <DialogHeader>
            <DialogTitle>{locale === 'ar' ? 'إضافة مستأجر جديد' : 'Add New Tenant'}</DialogTitle>
            <DialogDescription>
              {locale === 'ar' ? 'أدخل بيانات المستأجر الجديد لإنشائه في النظام.' : 'Enter the new tenant details to create them in the system.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="tenant-name">{locale === 'ar' ? 'اسم المستأجر' : 'Tenant Name'}</Label>
              <Input
                id="tenant-name"
                value={tenantName}
                onChange={(e) => setTenantName(e.target.value)}
                placeholder={locale === 'ar' ? 'مثال: مركز النور الطبي' : 'e.g. Al Noor Medical Center'}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="tenant-email">{locale === 'ar' ? 'البريد الإلكتروني' : 'Email'}</Label>
              <Input
                id="tenant-email"
                type="email"
                value={tenantEmail}
                onChange={(e) => setTenantEmail(e.target.value)}
                placeholder="example@clinic.com"
              />
            </div>
            <div className="grid gap-2">
              <Label>{locale === 'ar' ? 'الخطة' : 'Plan'}</Label>
              <Select value={tenantPlan} onValueChange={setTenantPlan}>
                <SelectTrigger>
                  <SelectValue placeholder={locale === 'ar' ? 'اختر خطة' : 'Select a plan'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="starter">Starter</SelectItem>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddTenantOpen(false)}>
              {locale === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button
              onClick={() => {
                toast.success(
                  locale === 'ar'
                    ? `تم إنشاء المستأجر "${tenantName}" بنجاح`
                    : `Tenant "${tenantName}" created successfully`
                )
                setTenantName('')
                setTenantEmail('')
                setTenantPlan('')
                setAddTenantOpen(false)
              }}
            >
              {locale === 'ar' ? 'حفظ' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}