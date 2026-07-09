'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Separator } from '@/components/ui/separator'
import {
  Database, Activity, Zap, HardDrive, Cpu, Server, AlertTriangle,
  Wifi, BarChart3, Lock, Hash, CircleAlert, RotateCw, Shield,
  ArrowUpDown, Layers, Timer, Box, Bug, XCircle,
} from 'lucide-react'
import { useSA, StatusBadge, PageTitle, StatCard, fade, gaugeColor } from './sa-helpers'

// ─── Mock Data ─────────────────────────────────────────────────
const HEALTH_METRICS = [
  { key: 'cpu', label: { ar: 'استخدام المعالج', en: 'CPU Usage' }, value: 34, icon: Cpu },
  { key: 'ram', label: { ar: 'استخدام الذاكرة', en: 'RAM Usage' }, value: 58, icon: Server },
  { key: 'storage', label: { ar: 'استخدام التخزين', en: 'Storage Usage' }, value: 45, icon: HardDrive },
  { key: 'pool', label: { ar: 'مجموعة الاتصالات', en: 'Connection Pool' }, value: 68, icon: Wifi },
]

const SLOW_QUERIES = [
  { id: 1, query: { ar: 'SELECT * FROM appointments WHERE clinic_id = ? AND date BETWEEN ? AND ? ORDER BY created_at DESC', en: 'SELECT * FROM appointments WHERE clinic_id = ? AND date BETWEEN ? AND ? ORDER BY created_at DESC' }, duration: '2,340ms', database: { ar: 'عيادات_الرياض', en: 'riyadh_clinic' }, timestamp: '2025-01-15 14:23:11', calls: 847 },
  { id: 2, query: { ar: 'SELECT u.*, COUNT(b.id) as booking_count FROM users u LEFT JOIN bookings b ON...', en: 'SELECT u.*, COUNT(b.id) as booking_count FROM users u LEFT JOIN bookings b ON...' }, duration: '1,890ms', database: { ar: 'منصة_أساسية', en: 'core_platform' }, timestamp: '2025-01-15 14:18:45', calls: 423 },
  { id: 3, query: { ar: 'UPDATE inventory SET quantity = quantity - ? WHERE product_id = ? AND branch_id = ?', en: 'UPDATE inventory SET quantity = quantity - ? WHERE product_id = ? AND branch_id = ?' }, duration: '1,560ms', database: { ar: 'مخزون_جدة', en: 'jeddah_inventory' }, timestamp: '2025-01-15 14:12:30', calls: 1204 },
  { id: 4, query: { ar: 'SELECT DISTINCT s.service_id, s.name, s.price FROM services s JOIN booking_services bs...', en: 'SELECT DISTINCT s.service_id, s.name, s.price FROM services s JOIN booking_services bs...' }, duration: '1,210ms', database: { ar: 'صالونات_دبي', en: 'dubai_salons' }, timestamp: '2025-01-15 14:05:22', calls: 567 },
  { id: 5, query: { ar: 'INSERT INTO audit_logs (action, user_id, entity, details) VALUES (?, ?, ?, ?) ON DUPLICATE...', en: 'INSERT INTO audit_logs (action, user_id, entity, details) VALUES (?, ?, ?, ?) ON DUPLICATE...' }, duration: '980ms', database: { ar: 'منصة_أساسية', en: 'core_platform' }, timestamp: '2025-01-15 13:58:17', calls: 2891 },
  { id: 6, query: { ar: 'SELECT p.*, u.name as patient_name FROM prescriptions p JOIN patients u ON p.patient_id = u.id WHERE...', en: 'SELECT p.*, u.name as patient_name FROM prescriptions p JOIN patients u ON p.patient_id = u.id WHERE...' }, duration: '870ms', database: { ar: 'عيادات_عمّان', en: 'amman_clinics' }, timestamp: '2025-01-15 13:45:03', calls: 312 },
]

const CONNECTIONS = [
  { id: 1, source: { ar: 'خادم التطبيق - 1', en: 'App Server - 1' }, database: { ar: 'منصة_أساسية', en: 'core_platform' }, user: 'bf_app_user', status: 'active', duration: '4h 23m' },
  { id: 2, source: { ar: 'خادم التطبيق - 2', en: 'App Server - 2' }, database: { ar: 'منصة_أساسية', en: 'core_platform' }, user: 'bf_app_user', status: 'active', duration: '3h 58m' },
  { id: 3, source: { ar: 'خادم التقارير', en: 'Report Server' }, database: { ar: 'تحليلات', en: 'analytics_db' }, user: 'bf_readonly', status: 'idle', duration: '0h 12m' },
  { id: 4, source: { ar: 'مهمة الصيانة', en: 'Maintenance Job' }, database: { ar: 'منصة_أساسية', en: 'core_platform' }, user: 'bf_admin', status: 'active', duration: '0h 45m' },
  { id: 5, source: { ar: 'اتصال خارجي', en: 'External Connection' }, database: { ar: 'سجلات', en: 'logs_db' }, user: 'bf_logs', status: 'idle', duration: '1h 07m' },
]

const INDEXES = [
  { name: 'idx_appointments_clinic_date', table: 'appointments', size: '124 MB', usage: 94, fragmentation: 3 },
  { name: 'idx_bookings_user_status', table: 'bookings', size: '89 MB', usage: 87, fragmentation: 12 },
  { name: 'idx_users_email_unique', table: 'users', size: '45 MB', usage: 78, fragmentation: 5 },
  { name: 'idx_inventory_product_branch', table: 'inventory', size: '67 MB', usage: 45, fragmentation: 28 },
  { name: 'idx_audit_logs_timestamp', table: 'audit_logs', size: '210 MB', usage: 62, fragmentation: 15 },
  { name: 'idx_payments_tenant_date', table: 'payments', size: '98 MB', usage: 91, fragmentation: 8 },
]

const PERF_METRICS = [
  { label: { ar: 'استعلامات/ثانية', en: 'Queries/sec' }, value: '1,247', icon: ArrowUpDown, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30' },
  { label: { ar: 'معاملات/ثانية', en: 'Transactions/sec' }, value: '342', icon: RotateCw, color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/30' },
  { label: { ar: 'نسبة ضربات الكاش', en: 'Cache Hit Ratio' }, value: '97.3%', icon: Zap, color: 'text-violet-600 bg-violet-50 dark:bg-violet-950/30' },
  { label: { ar: 'تجمع المخزن المؤقت', en: 'Buffer Pool' }, value: '2.1 GB', icon: Layers, color: 'text-cyan-600 bg-cyan-50 dark:bg-cyan-950/30' },
  { label: { ar: 'جداول مؤقتة', en: 'Temp Tables' }, value: '23', icon: Box, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/30' },
  { label: { ar: 'انتظار الأقفال', en: 'Lock Waits' }, value: '4', icon: Lock, color: 'text-orange-600 bg-orange-50 dark:bg-orange-950/30' },
  { label: { ar: 'اختناقات', en: 'Deadlocks' }, value: '0', icon: XCircle, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30' },
  { label: { ar: 'أخطاء', en: 'Errors' }, value: '2', icon: Bug, color: 'text-red-600 bg-red-50 dark:bg-red-950/30' },
]

function fragBadge(frag: number, lang: 'ar' | 'en') {
  if (frag <= 10) return <span className="inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 px-2 py-0.5 text-[11px] font-semibold">{frag}%</span>
  if (frag <= 20) return <span className="inline-flex items-center rounded-full bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 px-2 py-0.5 text-[11px] font-semibold">{frag}%</span>
  return <span className="inline-flex items-center rounded-full bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-400 px-2 py-0.5 text-[11px] font-semibold">{frag}%</span>
}

export function DatabaseMonitoringPage() {
  const { t, isRTL, lang } = useSA()
  const [healthStatus] = useState<'healthy' | 'warning' | 'critical'>('healthy')

  const kpis = useMemo(() => [
    { icon: Database, bg: 'bg-violet-600', label: lang === 'ar' ? 'حجم قاعدة البيانات' : 'Database Size', value: '2.4 GB' },
    { icon: Wifi, bg: 'bg-cyan-600', label: lang === 'ar' ? 'الاتصالات النشطة' : 'Active Connections', value: '34' },
    { icon: Timer, bg: 'bg-amber-600', label: lang === 'ar' ? 'متوسط استجابة الاستعلام' : 'Avg Query Response', value: '23ms' },
    { icon: Shield, bg: 'bg-emerald-600', label: lang === 'ar' ? 'وقت التشغيل' : 'Uptime', value: '99.97%' },
  ], [lang])

  return (
    <div className="space-y-5" dir={isRTL ? 'rtl' : 'ltr'}>
      <PageTitle title={lang === 'ar' ? 'مراقبة قاعدة البيانات' : 'Database Monitoring'} />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <motion.div key={i} variants={fade} initial="hidden" animate="visible" transition={{ delay: i * 0.04 }}>
            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1.5 min-w-0">
                    <p className="text-xs text-muted-foreground font-medium">{kpi.label}</p>
                    <p className="text-2xl font-bold tracking-tight">{kpi.value}</p>
                  </div>
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${kpi.bg}`}>
                    <kpi.icon className="h-5 w-5 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Database Health + Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Database Health */}
        <motion.div variants={fade} initial="hidden" animate="visible" transition={{ delay: 0.16 }}>
          <Card className="border-0 shadow-sm h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Activity className="h-4 w-4 text-violet-600" />
                {lang === 'ar' ? 'صحة قاعدة البيانات' : 'Database Health'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 justify-center py-3">
                <div className={`h-4 w-4 rounded-full ${healthStatus === 'healthy' ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]' : healthStatus === 'warning' ? 'bg-amber-500' : 'bg-red-500'}`} />
                <StatusBadge status={healthStatus} locale={lang} />
              </div>
              <Separator />
              {HEALTH_METRICS.map(m => (
                <div key={m.key} className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <m.icon className="h-3.5 w-3.5" />
                      {m.label[lang]}
                    </span>
                    <span className={`font-semibold ${gaugeColor(m.value)}`}>{m.value}%</span>
                  </div>
                  <Progress value={m.value} className="h-2" />
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Performance Metrics */}
        <motion.div variants={fade} initial="hidden" animate="visible" transition={{ delay: 0.20 }} className="lg:col-span-2">
          <Card className="border-0 shadow-sm h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-violet-600" />
                {lang === 'ar' ? 'مقاييس الأداء' : 'Performance Metrics'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {PERF_METRICS.map((m, i) => (
                  <StatCard key={i} icon={m.icon} label={m.label[lang]} value={m.value} color={m.color} />
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Slow Queries */}
      <motion.div variants={fade} initial="hidden" animate="visible" transition={{ delay: 0.24 }}>
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              {lang === 'ar' ? 'الاستعلامات البطيئة' : 'Slow Queries'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider">{lang === 'ar' ? 'الاستعلام' : 'Query'}</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-end">{lang === 'ar' ? 'المدة' : 'Duration'}</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider">{lang === 'ar' ? 'قاعدة البيانات' : 'Database'}</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-end">{lang === 'ar' ? 'التوقيت' : 'Timestamp'}</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-end">{lang === 'ar' ? 'الاستدعاءات' : 'Calls'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {SLOW_QUERIES.map(q => (
                    <TableRow key={q.id}>
                      <TableCell className="max-w-[300px]">
                        <div className="flex items-start gap-2">
                          <CircleAlert className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                          <code className="text-[11px] leading-relaxed text-muted-foreground truncate block" dir="ltr">{q.query[lang]}</code>
                        </div>
                      </TableCell>
                      <TableCell className="text-end text-sm font-mono text-amber-600">{q.duration}</TableCell>
                      <TableCell className="text-sm">{q.database[lang]}</TableCell>
                      <TableCell className="text-end text-xs text-muted-foreground font-mono">{q.timestamp}</TableCell>
                      <TableCell className="text-end text-sm font-medium">{q.calls.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Active Connections + Index Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Active Connections */}
        <motion.div variants={fade} initial="hidden" animate="visible" transition={{ delay: 0.28 }}>
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Wifi className="h-4 w-4 text-cyan-600" />
                {lang === 'ar' ? 'الاتصالات النشطة' : 'Active Connections'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider">{lang === 'ar' ? 'المصدر' : 'Source'}</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider">{lang === 'ar' ? 'قاعدة البيانات' : 'Database'}</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider">{lang === 'ar' ? 'المستخدم' : 'User'}</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider">{lang === 'ar' ? 'الحالة' : 'Status'}</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-end">{lang === 'ar' ? 'المدة' : 'Duration'}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {CONNECTIONS.map(c => (
                      <TableRow key={c.id}>
                        <TableCell className="text-sm font-medium">{c.source[lang]}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{c.database[lang]}</TableCell>
                        <TableCell className="text-xs font-mono">{c.user}</TableCell>
                        <TableCell><StatusBadge status={c.status} locale={lang} /></TableCell>
                        <TableCell className="text-end text-sm font-mono">{c.duration}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Index Health */}
        <motion.div variants={fade} initial="hidden" animate="visible" transition={{ delay: 0.32 }}>
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Hash className="h-4 w-4 text-violet-600" />
                {lang === 'ar' ? 'صحة الفهارس' : 'Index Health'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider">{lang === 'ar' ? 'اسم الفهرس' : 'Index Name'}</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider">{lang === 'ar' ? 'الجدول' : 'Table'}</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-end">{lang === 'ar' ? 'الحجم' : 'Size'}</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-end">{lang === 'ar' ? 'الاستخدام' : 'Usage %'}</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-end">{lang === 'ar' ? 'التجزئة' : 'Fragmentation'}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {INDEXES.map(idx => (
                      <TableRow key={idx.name}>
                        <TableCell><code className="text-[11px] font-mono" dir="ltr">{idx.name}</code></TableCell>
                        <TableCell className="text-sm font-medium">{idx.table}</TableCell>
                        <TableCell className="text-end text-sm text-muted-foreground">{idx.size}</TableCell>
                        <TableCell className="text-end">
                          <span className={`text-sm font-semibold ${gaugeColor(100 - idx.usage)}`}>{idx.usage}%</span>
                        </TableCell>
                        <TableCell className="text-end">{fragBadge(idx.fragmentation, lang)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}