'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import {
  X, Building2, User, CreditCard, Shield, Activity, Clock,
  Database, HardDrive, Globe, Mail, Phone, MapPin, CalendarDays,
  Users, BarChart3, FileText, CheckCircle2, AlertTriangle, Lock,
  Server, Bell, Zap,
} from 'lucide-react'
import { useSA, StatusBadge, useCurrency } from './sa-helpers'
import { type Tenant, PLANS, INVOICES, INIT_LOGS, COUNTRIES as ALL_COUNTRIES } from './sa-data'

// ─── Types ───────────────────────────────────────────────────────
interface LoginHistoryEntry {
  id: string
  ip: string
  time: string
  device: string
  location: string
  locationEn: string
  status: string
}

// ─── Mock Data ───────────────────────────────────────────────────
function generateMockData(tn: Tenant, lang: 'ar' | 'en') {
  const plan = PLANS.find(p => p.name === tn.plan)
  const loginHistory: LoginHistoryEntry[] = [
    { id: '1', ip: '192.168.1.55', time: '2025-06-18T14:00:00Z', device: 'Chrome / Windows', location: 'عمّان', locationEn: 'Amman', status: 'success' },
    { id: '2', ip: '10.0.0.12', time: '2025-06-17T09:30:00Z', device: 'Safari / macOS', location: 'عمّان', locationEn: 'Amman', status: 'success' },
    { id: '3', ip: '172.16.0.8', time: '2025-06-16T16:00:00Z', device: 'Mobile / iOS', location: lang === 'ar' ? 'الرياض' : 'Riyadh', locationEn: 'Riyadh', status: 'success' },
    { id: '4', ip: '203.0.113.5', time: '2025-06-15T11:00:00Z', device: 'Firefox / Linux', location: lang === 'ar' ? 'جدة' : 'Jeddah', locationEn: 'Jeddah', status: 'failed' },
  ]

  const tenantInvoices = INVOICES.filter(inv => inv.tenant === tn.name || inv.tenantEn === tn.nameEn)
  const tenantLogs = INIT_LOGS.filter(l => l.message.includes(tn.name) || l.messageEn.includes(tn.nameEn))

  const apiUsage = [
    { endpoint: '/api/bookings', calls: tn.bookings * 3, limit: plan ? (plan.name === 'Enterprise' ? 50000 : plan.name === 'Business' ? 20000 : 10000) : 5000 },
    { endpoint: '/api/customers', calls: tn.users * 45, limit: plan ? (plan.name === 'Enterprise' ? 30000 : 10000) : 3000 },
    { endpoint: '/api/reports', calls: tn.users * 12, limit: plan ? 5000 : 1000 },
  ]

  const activeModules = [
    { name: lang === 'ar' ? 'الحجوزات' : 'Bookings', active: true, icon: CalendarDays },
    { name: lang === 'ar' ? 'العملاء' : 'Customers', active: true, icon: Users },
    { name: lang === 'ar' ? 'التقارير' : 'Reports', active: tn.plan !== 'Starter' && tn.plan !== 'Free', icon: BarChart3 },
    { name: lang === 'ar' ? 'الفواتير' : 'Invoicing', active: tn.plan !== 'Free', icon: FileText },
    { name: lang === 'ar' ? 'API' : 'API Access', active: tn.plan === 'Enterprise' || tn.plan === 'Business', icon: Globe },
    { name: lang === 'ar' ? 'الإشعارات' : 'Notifications', active: true, icon: Bell },
  ]

  return { plan, loginHistory, tenantInvoices, tenantLogs, apiUsage, activeModules }
}

// ─── Info Row ────────────────────────────────────────────────────
function InfoRow({ label, value, dir, mono }: { label: string; value: string | number | React.ReactNode; dir?: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between py-2 gap-4">
      <span className="text-xs text-muted-foreground shrink-0">{label}</span>
      <span className={`text-sm font-medium text-end ${mono ? 'font-mono tabular-nums' : ''}`} dir={dir as 'rtl' | 'ltr' | undefined}>
        {value || '—'}
      </span>
    </div>
  )
}

// ─── Section Card ────────────────────────────────────────────────
function SectionCard({ icon: Icon, title, children, delay = 0 }: {
  icon: React.ElementType; title: string; children: React.ReactNode; delay?: number
}) {
  return (
    <motion.div variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }} initial="hidden" animate="visible" transition={{ delay }}>
      <Card className="border-0 shadow-sm h-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/30">
              <Icon className="h-4 w-4 text-violet-600" />
            </div>
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </motion.div>
  )
}

// ════════════════════════════════════════════════════════════════
// MAIN TENANT DETAILS DIALOG
// ════════════════════════════════════════════════════════════════
export function TenantDetailsDialog({
  tenant,
  open,
  onClose,
}: {
  tenant: Tenant
  open: boolean
  onClose: () => void
}) {
  const { t, isRTL, lang } = useSA()
  const { sym } = useCurrency()

  if (!open || !tenant) return null

  const tnName = lang === 'en' ? (tenant.nameEn || tenant.name) : tenant.name
  const mock = generateMockData(tenant, lang)
  const { plan, loginHistory, tenantInvoices, tenantLogs, apiUsage, activeModules } = mock

  const totalInvoiceAmount = tenantInvoices.reduce((s, i) => s + i.amount, 0)
  const paidInvoices = tenantInvoices.filter(i => i.status === 'paid')
  const storageUsed = Math.round((tenant.bookings * 0.05 + tenant.users * 2.5) * 10) / 10
  const storageLimit = plan ? (plan.name === 'Enterprise' ? 100 : plan.name === 'Business' ? 50 : plan.name === 'Professional' ? 20 : 5) : 5
  const dbSize = (storageUsed * 0.4).toFixed(1)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        className="bg-background rounded-2xl shadow-2xl border w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
        dir={isRTL ? 'rtl' : 'ltr'}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-500 text-white text-xl font-bold shadow-lg shadow-violet-500/20">
                {tnName.charAt(0)}
              </div>
              <div>
                <h2 className="text-lg font-bold">{tnName}</h2>
                <p className="text-sm text-muted-foreground" dir="ltr">{tenant.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  <StatusBadge status={tenant.status} locale={lang} />
                  <StatusBadge status={tenant.subscriptionStatus} locale={lang} />
                </div>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {/* Company Information */}
            <SectionCard icon={Building2} title={isRTL ? 'معلومات الشركة' : 'Company Information'} delay={0}>
              <div className="divide-y">
                <InfoRow label={isRTL ? 'الاسم (عربي)' : 'Name (AR)'} value={tenant.name} />
                <InfoRow label={isRTL ? 'الاسم (إنجليزي)' : 'Name (EN)'} value={tenant.nameEn} dir="ltr" />
                <InfoRow label={isRTL ? 'البريد الإلكتروني' : 'Email'} value={tenant.email} dir="ltr" />
                <InfoRow label={isRTL ? 'البلد' : 'Country'} value={tenant.country} />
                <InfoRow label={isRTL ? 'الباقة' : 'Plan'} value={<Badge variant="secondary" className="font-medium">{tenant.plan}</Badge>} />
                <InfoRow label={isRTL ? 'الحجوزات' : 'Bookings'} value={tenant.bookings.toLocaleString()} mono />
                <InfoRow label={isRTL ? 'الإيرادات' : 'Revenue'} value={`${tenant.revenue.toLocaleString()} ${sym}`} mono />
                <InfoRow label={isRTL ? 'المستخدمين' : 'Users'} value={tenant.users} mono />
                <InfoRow label={isRTL ? 'تاريخ الإنشاء' : 'Created'} value={tenant.createdAt} />
              </div>
            </SectionCard>

            {/* Owner Information */}
            <SectionCard icon={User} title={isRTL ? 'معلومات المالك' : 'Owner Information'} delay={0.04}>
              <div className="divide-y">
                <div className="flex items-center gap-3 py-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 font-bold text-lg">
                    {tnName.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{isRTL ? 'مدير النظام' : 'System Admin'}</p>
                    <p className="text-xs text-muted-foreground" dir="ltr">{tenant.email}</p>
                    <Badge variant="secondary" className="text-[10px] mt-1">{isRTL ? 'مالك' : 'Owner'}</Badge>
                  </div>
                </div>
                <InfoRow label={isRTL ? 'حالة الحساب' : 'Account Status'} value={<StatusBadge status={tenant.status} locale={lang} />} />
                <InfoRow label={isRTL ? 'آخر تسجيل دخول' : 'Last Login'} value={loginHistory[0]?.time ? new Date(loginHistory[0].time).toLocaleString(lang === 'ar' ? 'ar-JO' : 'en-JO') : '—'} />
                <InfoRow label={isRTL ? 'إجمالي تسجيلات الدخول' : 'Total Logins'} value={loginHistory.filter(l => l.status === 'success').length.toString()} mono />
              </div>
            </SectionCard>

            {/* Subscription & Plan */}
            <SectionCard icon={CreditCard} title={isRTL ? 'الاشتراك والباقة' : 'Subscription & Plan'} delay={0.08}>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-bold text-base">{tenant.plan}</p>
                    <p className="text-xs text-muted-foreground">{isRTL ? 'الباقة الحالية' : 'Current Plan'}</p>
                  </div>
                  <div className="text-end">
                    <p className="text-xl font-extrabold text-violet-600">{plan?.price || 0} <span className="text-xs font-normal">{sym}/{isRTL ? 'شهر' : 'mo'}</span></p>
                  </div>
                </div>
                <div className="divide-y">
                  <InfoRow label={isRTL ? 'حالة الاشتراك' : 'Subscription Status'} value={<StatusBadge status={tenant.subscriptionStatus} locale={lang} />} />
                  <InfoRow label={isRTL ? 'تاريخ الانتهاء' : 'End Date'} value={tenant.subscriptionEndDate || (isRTL ? 'غير محدد' : 'Not set')} />
                  {plan && plan.features.length > 0 && (
                    <div className="py-2">
                      <p className="text-xs text-muted-foreground mb-2">{isRTL ? 'المميزات:' : 'Features:'}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {plan.features.map((f, i) => (
                          <Badge key={i} variant="outline" className="text-[10px] gap-1">
                            <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                            {lang === 'en' ? f.en : f.ar}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </SectionCard>

            {/* Usage Statistics */}
            <SectionCard icon={Activity} title={isRTL ? 'إحصائيات الاستخدام' : 'Usage Statistics'} delay={0.12}>
              <div className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-muted-foreground">{isRTL ? 'التخزين' : 'Storage'}</span>
                      <span className="font-medium">{storageUsed} / {storageLimit} GB</span>
                    </div>
                    <Progress value={Math.min((storageUsed / storageLimit) * 100, 100)} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-muted-foreground">{isRTL ? 'قاعدة البيانات' : 'Database'}</span>
                      <span className="font-medium">{dbSize} GB</span>
                    </div>
                    <Progress value={Math.min((parseFloat(dbSize) / (storageLimit * 0.5)) * 100, 100)} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-muted-foreground">{isRTL ? 'المستخدمين' : 'Users'}</span>
                      <span className="font-medium">{tenant.users} / {plan?.tenants || '∞'}</span>
                    </div>
                    <Progress value={plan?.tenants ? Math.min((tenant.users / plan.tenants) * 100, 100) : 20} className="h-2" />
                  </div>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-muted/50 p-2.5 text-center">
                    <p className="text-lg font-bold">{tenant.bookings.toLocaleString()}</p>
                    <p className="text-[10px] text-muted-foreground">{isRTL ? 'إجمالي الحجوزات' : 'Total Bookings'}</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-2.5 text-center">
                    <p className="text-lg font-bold">{tenant.revenue.toLocaleString()} <span className="text-xs font-normal">{sym}</span></p>
                    <p className="text-[10px] text-muted-foreground">{isRTL ? 'إجمالي الإيرادات' : 'Total Revenue'}</p>
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* Security & Database Status */}
            <SectionCard icon={Shield} title={isRTL ? 'الأمان وقاعدة البيانات' : 'Security & Database'} delay={0.16}>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-emerald-600" />
                    <span className="text-sm">{isRTL ? 'حالة الأمان' : 'Security Status'}</span>
                  </div>
                  <Badge className={tenant.status === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'}>
                    {tenant.status === 'active' ? (isRTL ? 'آمن' : 'Secure') : (isRTL ? 'يحتاج مراجعة' : 'Needs Review')}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-sky-600" />
                    <span className="text-sm">{isRTL ? 'قاعدة البيانات' : 'Database'}</span>
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
                    {isRTL ? 'نشطة' : 'Active'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <Server className="h-4 w-4 text-violet-600" />
                    <span className="text-sm">{isRTL ? 'الخادم' : 'Server'}</span>
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
                    {isRTL ? 'متصل' : 'Connected'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <HardDrive className="h-4 w-4 text-amber-600" />
                    <span className="text-sm">{isRTL ? 'التخزين' : 'Storage'}</span>
                  </div>
                  <span className="text-xs font-medium">{storageUsed} / {storageLimit} GB ({Math.round(storageUsed / storageLimit * 100)}%)</span>
                </div>
              </div>
            </SectionCard>

            {/* Login History */}
            <SectionCard icon={Clock} title={isRTL ? 'سجل تسجيل الدخول' : 'Login History'} delay={0.2}>
              <div className="space-y-2">
                {loginHistory.map(entry => (
                  <div key={entry.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full shrink-0 ${
                      entry.status === 'success' ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-red-100 dark:bg-red-900/30'
                    }`}>
                      {entry.status === 'success' ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <AlertTriangle className="h-4 w-4 text-red-500" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium">{entry.device}</p>
                      <p className="text-[10px] text-muted-foreground" dir="ltr">{entry.ip} · {lang === 'en' ? entry.locationEn : entry.location}</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {new Date(entry.time).toLocaleString(lang === 'ar' ? 'ar-JO' : 'en-JO', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* API Usage */}
            <SectionCard icon={Globe} title={isRTL ? 'استخدام API' : 'API Usage'} delay={0.24}>
              <div className="space-y-3">
                {apiUsage.map((api, i) => {
                  const pct = Math.min((api.calls / api.limit) * 100, 100)
                  return (
                    <div key={i}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-mono">{api.endpoint}</span>
                        <span className="text-muted-foreground">{api.calls.toLocaleString()} / {api.limit.toLocaleString()}</span>
                      </div>
                      <Progress value={pct} className={`h-1.5 ${pct > 80 ? '[&>div]:bg-red-500' : pct > 60 ? '[&>div]:bg-amber-500' : '[&>div]:bg-emerald-500'}`} />
                    </div>
                  )
                })}
              </div>
            </SectionCard>

            {/* Billing History */}
            <SectionCard icon={FileText} title={isRTL ? 'سجل الفواتير' : 'Billing History'} delay={0.28}>
              {tenantInvoices.length > 0 ? (
                <div className="space-y-2">
                  {tenantInvoices.map(inv => (
                    <div key={inv.id} className="flex items-center justify-between p-2.5 rounded-lg border">
                      <div>
                        <p className="text-xs font-mono font-semibold">{inv.id}</p>
                        <p className="text-[10px] text-muted-foreground">{inv.date}</p>
                      </div>
                      <div className="text-end">
                        <p className="text-sm font-bold">{inv.amount.toLocaleString()} {sym}</p>
                        <StatusBadge status={inv.status} locale={lang} />
                      </div>
                    </div>
                  ))}
                  <Separator />
                  <div className="flex justify-between text-sm font-semibold pt-1">
                    <span>{isRTL ? 'الإجمالي' : 'Total'}</span>
                    <span className="text-violet-600">{totalInvoiceAmount.toLocaleString()} {sym}</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-6">{isRTL ? 'لا توجد فواتير' : 'No invoices yet'}</p>
              )}
            </SectionCard>

            {/* Active Modules */}
            <SectionCard icon={Zap} title={isRTL ? 'الوحدات النشطة' : 'Active Modules'} delay={0.32}>
              <div className="grid grid-cols-2 gap-2">
                {activeModules.map((mod, i) => (
                  <div key={i} className={`flex items-center gap-2.5 p-2.5 rounded-lg border transition-colors ${mod.active ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800' : 'bg-muted/50 opacity-50'}`}>
                    <mod.icon className={`h-4 w-4 shrink-0 ${mod.active ? 'text-emerald-600' : 'text-muted-foreground'}`} />
                    <span className="text-xs font-medium">{mod.name}</span>
                    {mod.active ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 ms-auto" /> : <Lock className="h-3.5 w-3.5 text-muted-foreground ms-auto" />}
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* Recent Activity */}
            <SectionCard icon={Activity} title={isRTL ? 'آخر النشاطات' : 'Recent Activity'} delay={0.36}>
              <div className="space-y-2">
                {tenantLogs.length > 0 ? tenantLogs.slice(0, 5).map(l => (
                  <div key={l.id} className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${
                      l.level === 'success' ? 'bg-emerald-500' : l.level === 'warn' ? 'bg-amber-500' : l.level === 'error' ? 'bg-red-500' : 'bg-sky-500'
                    }`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs leading-relaxed">{lang === 'en' ? l.messageEn : l.message}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {new Date(l.timestamp).toLocaleString(lang === 'ar' ? 'ar-JO' : 'en-JO', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                )) : (
                  <p className="text-sm text-muted-foreground text-center py-6">{isRTL ? 'لا توجد نشاطات' : 'No activity yet'}</p>
                )}
              </div>
            </SectionCard>

          </div>
        </div>

        {/* Footer */}
        <div className="p-5 sm:p-6 border-t bg-muted/30 flex items-center justify-end gap-2">
          <Button variant="outline" onClick={onClose}>{t.close}</Button>
        </div>
      </motion.div>
    </div>
  )
}