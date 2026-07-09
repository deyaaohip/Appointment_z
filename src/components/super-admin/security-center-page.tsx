'use client'
import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Separator } from '@/components/ui/separator'
import { Shield, ShieldAlert, Lock, Unlock, Users, Activity, LogOut, XCircle, CheckCircle2, AlertOctagon, Monitor, Smartphone, Globe, Clock, Key, Fingerprint, Eye, Trash2 } from 'lucide-react'
import { useSA, StatusBadge, PageTitle, Toggle, ConfirmDialog, StatCard, KpiCard, ActionBtn, PrimaryBtn, fade, gaugeColor, LogDot } from './sa-helpers'

// ─── Mock Data ──────────────────────────────────────────────
const loginData = [
  { day_en: 'Sat', day_ar: 'السبت', success: 45, failed: 2 },
  { day_en: 'Sun', day_ar: 'الأحد', success: 38, failed: 1 },
  { day_en: 'Mon', day_ar: 'الإثنين', success: 52, failed: 3 },
  { day_en: 'Tue', day_ar: 'الثلاثاء', success: 41, failed: 0 },
  { day_en: 'Wed', day_ar: 'الأربعاء', success: 48, failed: 4 },
  { day_en: 'Thu', day_ar: 'الخميس', success: 30, failed: 1 },
  { day_en: 'Fri', day_ar: 'الجمعة', success: 25, failed: 1 },
]

const initSessions = [
  { id: '1', user_en: 'Ahmad Ali', user_ar: 'أحمد علي', ip: '192.168.1.45', device_en: 'Desktop', device_ar: 'سطح المكتب', deviceIcon: Monitor, loc_en: 'Amman', loc_ar: 'عمّان', time: '10:32 AM', status: 'active' as const },
  { id: '2', user_en: 'Sara Khalid', user_ar: 'سارة خالد', ip: '10.0.0.12', device_en: 'Mobile', device_ar: 'جوال', deviceIcon: Smartphone, loc_en: 'Irbid', loc_ar: 'إربد', time: '09:15 AM', status: 'active' as const },
  { id: '3', user_en: 'Omar Hassan', user_ar: 'عمر حسن', ip: '172.16.0.8', device_en: 'Desktop', device_ar: 'سطح المكتب', deviceIcon: Monitor, loc_en: 'Aqaba', loc_ar: 'العقبة', time: '08:45 AM', status: 'active' as const },
  { id: '4', user_en: 'Lina Majed', user_ar: 'لينا ماجد', ip: '203.0.113.50', device_en: 'Mobile', device_ar: 'جوال', deviceIcon: Smartphone, loc_en: 'Zarqa', loc_ar: 'الزرقاء', time: '07:20 AM', status: 'active' as const },
  { id: '5', user_en: 'Yazan Rami', user_ar: 'يزان رامي', ip: '10.0.0.55', device_en: 'Desktop', device_ar: 'سطح المكتب', deviceIcon: Globe, loc_en: 'Amman', loc_ar: 'عمّان', time: '06:10 AM', status: 'active' as const },
]

const initBlockedIps = [
  { id: '1', ip: '45.33.32.156', reason_en: 'Brute Force', reason_ar: 'هجوم القوة الغاشمة', blocked: '2025-01-15 14:20', expires: '2025-01-22 14:20', attempts: 47 },
  { id: '2', ip: '185.220.101.1', reason_en: 'Malware Source', reason_ar: 'مصدر برمجيات خبيثة', blocked: '2025-01-14 09:10', expires: '2025-02-14 09:10', attempts: 12 },
  { id: '3', ip: '103.21.244.0', reason_en: 'DDoS Attempt', reason_ar: 'محاولة هجوم DDoS', blocked: '2025-01-13 22:05', expires: '2025-01-20 22:05', attempts: 234 },
  { id: '4', ip: '91.219.236.18', reason_en: 'Spam Bot', reason_ar: 'بوت رسائل مزعجة', blocked: '2025-01-12 16:30', expires: '2025-01-19 16:30', attempts: 89 },
]

const securityEvents = [
  { type_en: 'login_failed', type_ar: 'فشل تسجيل الدخول', severity: 'high' as const, src_en: '185.220.101.1', src_ar: '185.220.101.1', msg_en: 'Multiple failed login attempts detected', msg_ar: 'تم اكتشاف عدة محاولات فاشلة لتسجيل الدخول', time: '2 min ago' },
  { type_en: 'brute_force', type_ar: 'هجوم القوة الغاشمة', severity: 'critical' as const, src_en: '45.33.32.156', src_ar: '45.33.32.156', msg_en: 'Brute force attack blocked', msg_ar: 'تم حظر هجوم القوة الغاشمة', time: '15 min ago' },
  { type_en: 'suspicious_activity', type_ar: 'نشاط مشبوه', severity: 'medium' as const, src_en: '10.0.0.99', src_ar: '10.0.0.99', msg_en: 'Unusual access pattern from known IP', msg_ar: 'نمط وصول غير معتاد من IP معروف', time: '32 min ago' },
  { type_en: 'permission_denied', type_ar: 'رفض الصلاحية', severity: 'high' as const, src_en: '203.0.113.50', src_ar: '203.0.113.50', msg_en: 'Privilege escalation attempt blocked', msg_ar: 'تم حظر محاولة تصعيد الصلاحيات', time: '1 hr ago' },
  { type_en: 'ip_blocked', type_ar: 'حظر IP', severity: 'medium' as const, src_en: '103.21.244.0', src_ar: '103.21.244.0', msg_en: 'IP automatically blocked after rate limit exceeded', msg_ar: 'تم حظر IP تلقائياً بعد تجاوز حد المعدل', time: '2 hr ago' },
  { type_en: 'new_device', type_ar: 'جهاز جديد', severity: 'low' as const, src_en: '192.168.1.100', src_ar: '192.168.1.100', msg_en: 'Login from new device requires verification', msg_ar: 'تسجيل الدخول من جهاز جديد يتطلب التحقق', time: '3 hr ago' },
]

const initSecurityHeaders = [
  { name: 'Content-Security-Policy', enabled: true, value: "default-src 'self'" },
  { name: 'X-Frame-Options', enabled: true, value: 'DENY' },
  { name: 'X-Content-Type-Options', enabled: true, value: 'nosniff' },
  { name: 'Strict-Transport-Security', enabled: true, value: 'max-age=31536000' },
  { name: 'X-XSS-Protection', enabled: false, value: '-' },
  { name: 'Referrer-Policy', enabled: true, value: 'strict-origin-when-cross-origin' },
]

const auditLogs = [
  { time: '2025-01-15 14:32', user_en: 'Admin', user_ar: 'المدير', action_en: 'Updated', action_ar: 'تحديث', resource_en: 'Security Policy', resource_ar: 'سياسة الأمان', details_en: 'Changed max login attempts', details_ar: 'تعديل عدد محاولات الدخول القصوى', ip: '192.168.1.1', level: 'info' as const },
  { time: '2025-01-15 13:15', user_en: 'System', user_ar: 'النظام', action_en: 'Blocked', action_ar: 'حظر', resource_en: 'IP 45.33.32.156', resource_ar: 'IP 45.33.32.156', details_en: 'Automatic block after 47 failed attempts', details_ar: 'حظر تلقائي بعد 47 محاولة فاشلة', ip: 'System', level: 'error' as const },
  { time: '2025-01-15 11:40', user_en: 'Admin', user_ar: 'المدير', action_en: 'Enabled', action_ar: 'تفعيل', resource_en: 'Two-Factor Auth', resource_ar: 'المصادقة الثنائية', details_en: 'Required for all admin accounts', details_ar: 'مطلوبة لجميع حسابات المديرين', ip: '192.168.1.1', level: 'success' as const },
  { time: '2025-01-15 09:22', user_en: 'System', user_ar: 'النظام', action_en: 'Warning', action_ar: 'تحذير', resource_en: 'SSL Certificate', resource_ar: 'شهادة SSL', details_en: 'Certificate expires in 14 days', details_ar: 'الشهادة تنتهي خلال 14 يوم', ip: 'System', level: 'warn' as const },
  { time: '2025-01-14 16:50', user_en: 'Admin', user_ar: 'المدير', action_en: 'Reviewed', action_ar: 'مراجعة', resource_en: 'Audit Logs', resource_ar: 'سجل التدقيق', details_en: 'Exported 500 log entries', details_ar: 'تصدير 500 سجل', ip: '192.168.1.1', level: 'info' as const },
]

const initSettings = { tfa: true, ipWhitelist: false, bruteForce: true, sessionTimeout: true, auditLog: true, encryption: true, rateLimit: true, botProtection: false }

const sevColors: Record<string, string> = {
  critical: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400',
  high: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-400',
  medium: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400',
  low: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-400',
}
const sevLabels: Record<string, { ar: string; en: string }> = {
  critical: { ar: 'حرج', en: 'Critical' },
  high: { ar: 'عالي', en: 'High' },
  medium: { ar: 'متوسط', en: 'Medium' },
  low: { ar: 'منخفض', en: 'Low' },
}

const TH = 'font-semibold text-xs uppercase tracking-wider'

// ─── Component ──────────────────────────────────────────────
export function SecurityCenterPage() {
  const { t, isRTL, lang } = useSA()
  const l = lang === 'ar'
  const [sessions, setSessions] = useState(initSessions)
  const [blockedIps, setBlockedIps] = useState(initBlockedIps)
  const [settings, setSettings] = useState(initSettings)
  const [headers, setHeaders] = useState(initSecurityHeaders)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const maxLogin = useMemo(() => Math.max(...loginData.map(d => d.success + d.failed)), [])

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings(s => ({ ...s, [key]: !s[key] }))
    toast.success(l ? 'تم تحديث الإعداد' : 'Setting updated')
  }

  const toggleHeader = (name: string) => {
    setHeaders(hs => hs.map(h => h.name === name ? { ...h, enabled: !h.enabled } : h))
    toast.success(l ? 'تم تحديث الرأس' : 'Header updated')
  }

  const terminateSession = (id: string) => {
    setSessions(s => s.filter(x => x.id !== id))
    toast.success(l ? 'تم إنهاء الجلسة' : 'Session terminated')
  }

  const terminateAll = () => {
    setSessions([])
    setConfirmOpen(false)
    toast.success(l ? 'تم إنهاء جميع الجلسات' : 'All sessions terminated')
  }

  const unblockIp = (id: string) => {
    setBlockedIps(ips => ips.filter(x => x.id !== id))
    toast.success(l ? 'تم إلغاء حظر IP' : 'IP unblocked')
  }

  const settingItems = [
    { key: 'tfa' as const, icon: Fingerprint, label_en: 'Two-Factor Authentication', label_ar: 'المصادقة الثنائية' },
    { key: 'ipWhitelist' as const, icon: Globe, label_en: 'IP Whitelist', label_ar: 'القائمة البيضاء للـ IP' },
    { key: 'bruteForce' as const, icon: ShieldAlert, label_en: 'Brute Force Protection', label_ar: 'الحماية من القوة الغاشمة' },
    { key: 'sessionTimeout' as const, icon: Clock, label_en: 'Session Timeout (30 min)', label_ar: 'انتهاء الجلسة (30 دقيقة)' },
    { key: 'auditLog' as const, icon: Activity, label_en: 'Audit Logging', label_ar: 'سجل التدقيق' },
    { key: 'encryption' as const, icon: Key, label_en: 'Data Encryption', label_ar: 'تشفير البيانات' },
    { key: 'rateLimit' as const, icon: AlertOctagon, label_en: 'Rate Limiting', label_ar: 'تحديد المعدل' },
    { key: 'botProtection' as const, icon: Shield, label_en: 'Bot Protection', label_ar: 'حماية البوتات' },
  ]

  return (
    <div className="space-y-5">
      <PageTitle title={l ? 'مركز الأمان' : 'Security Center'} />

      {/* ── KPI Row ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={Shield} bg="bg-emerald-600" label={l ? 'درجة الأمان' : 'Security Score'} value="87/100" sub={l ? 'جيد' : 'Good'} delay={0} />
        <KpiCard icon={ShieldAlert} bg="bg-amber-500" label={l ? 'مستوى الخطر' : 'Risk Level'} value={l ? 'منخفض' : 'Low'} sub={l ? 'لا توجد تهديدات نشطة' : 'No active threats'} delay={0.04} />
        <KpiCard icon={Lock} bg="bg-red-600" label={l ? 'محاولات فاشلة' : 'Failed Logins'} value="12" sub={l ? 'آخر 24 ساعة' : 'Last 24 hours'} delay={0.08} />
        <KpiCard icon={Shield} bg="bg-violet-600" label={l ? 'IPs محظورة' : 'Blocked IPs'} value="3" sub={l ? 'حظورات نشطة' : 'Active blocks'} delay={0.12} />
      </div>

      {/* ── Login Activity + Active Sessions ────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div variants={fade} initial="hidden" animate="visible" transition={{ delay: 0.04 }}>
          <Card className="border-0 shadow-sm h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">{l ? 'نشاط تسجيل الدخول' : 'Login Activity'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {loginData.map(d => (
                <div key={d.day_en} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-8 shrink-0">{l ? d.day_ar : d.day_en}</span>
                  <div className="flex-1 flex items-center gap-1.5">
                    <div className="h-4 bg-emerald-500 rounded-full" style={{ width: `${(d.success / maxLogin) * 100}%` }} />
                    <div className="h-4 bg-red-500 rounded-full" style={{ width: `${Math.max((d.failed / maxLogin) * 100, d.failed ? 4 : 0)}%` }} />
                  </div>
                  <span className="text-[11px] text-muted-foreground tabular-nums w-14 text-end">{d.success}/{d.failed}</span>
                </div>
              ))}
              <div className="flex items-center gap-4 pt-2">
                <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />{l ? 'ناجح' : 'Success'}
                </span>
                <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500" />{l ? 'فاشل' : 'Failed'}
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={fade} initial="hidden" animate="visible" transition={{ delay: 0.08 }}>
          <Card className="border-0 shadow-sm h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">{l ? 'الجلسات النشطة' : 'Active Sessions'}</CardTitle>
                {sessions.length > 0 && (
                  <PrimaryBtn icon={LogOut} label={l ? 'إنهاء الكل' : 'Terminate All'} onClick={() => setConfirmOpen(true)} />
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className={TH}>{l ? 'المستخدم' : 'User'}</TableHead>
                      <TableHead className={TH}>IP</TableHead>
                      <TableHead className={TH}>{l ? 'الجهاز' : 'Device'}</TableHead>
                      <TableHead className={TH}>{l ? 'الموقع' : 'Location'}</TableHead>
                      <TableHead className={TH}>{l ? 'وقت الدخول' : 'Login Time'}</TableHead>
                      <TableHead className={TH}>{l ? 'الحالة' : 'Status'}</TableHead>
                      <TableHead className={TH} />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sessions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center text-sm text-muted-foreground">
                          {l ? 'لا توجد جلسات نشطة' : 'No active sessions'}
                        </TableCell>
                      </TableRow>
                    ) : sessions.map(s => {
                      const DI = s.deviceIcon
                      return (
                        <TableRow key={s.id}>
                          <TableCell className="font-medium text-sm">{l ? s.user_ar : s.user_en}</TableCell>
                          <TableCell className="font-mono text-xs" dir="ltr">{s.ip}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5 text-xs">
                              <DI className="h-3.5 w-3.5 text-muted-foreground" />
                              {l ? s.device_ar : s.device_en}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs">{l ? s.loc_ar : s.loc_en}</TableCell>
                          <TableCell className="text-xs tabular-nums">{s.time}</TableCell>
                          <TableCell><StatusBadge status={s.status} locale={lang} /></TableCell>
                          <TableCell>
                            <ActionBtn icon={Trash2} label={l ? 'إنهاء' : 'Terminate'} onClick={() => terminateSession(s.id)} danger />
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* ── Blocked IPs + Security Events ───────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div variants={fade} initial="hidden" animate="visible" transition={{ delay: 0.12 }}>
          <Card className="border-0 shadow-sm h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">{l ? 'IPs محظورة' : 'Blocked IPs'}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className={TH}>IP</TableHead>
                      <TableHead className={TH}>{l ? 'السبب' : 'Reason'}</TableHead>
                      <TableHead className={TH}>{l ? 'وقت الحظر' : 'Blocked At'}</TableHead>
                      <TableHead className={TH}>{l ? 'الانتهاء' : 'Expires At'}</TableHead>
                      <TableHead className={TH}>{l ? 'المحاولات' : 'Attempts'}</TableHead>
                      <TableHead className={TH} />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {blockedIps.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center text-sm text-muted-foreground">
                          {l ? 'لا توجد IPs محظورة' : 'No blocked IPs'}
                        </TableCell>
                      </TableRow>
                    ) : blockedIps.map(ip => (
                      <TableRow key={ip.id}>
                        <TableCell className="font-mono text-xs" dir="ltr">{ip.ip}</TableCell>
                        <TableCell className="text-xs">{l ? ip.reason_ar : ip.reason_en}</TableCell>
                        <TableCell className="text-xs tabular-nums whitespace-nowrap">{ip.blocked}</TableCell>
                        <TableCell className="text-xs tabular-nums whitespace-nowrap">{ip.expires}</TableCell>
                        <TableCell className="text-xs tabular-nums text-end">{ip.attempts}</TableCell>
                        <TableCell>
                          <ActionBtn icon={Unlock} label={l ? 'إلغاء الحظر' : 'Unblock'} onClick={() => unblockIp(ip.id)} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={fade} initial="hidden" animate="visible" transition={{ delay: 0.16 }}>
          <Card className="border-0 shadow-sm h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">{l ? 'أحداث الأمان' : 'Security Events'}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className={TH}>{l ? 'النوع' : 'Type'}</TableHead>
                      <TableHead className={TH}>{l ? 'الشدة' : 'Severity'}</TableHead>
                      <TableHead className={TH}>{l ? 'المصدر' : 'Source'}</TableHead>
                      <TableHead className={TH}>{l ? 'الرسالة' : 'Message'}</TableHead>
                      <TableHead className={TH}>{l ? 'الوقت' : 'Time'}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {securityEvents.map((e, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-xs font-medium">{l ? e.type_ar : e.type_en}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${sevColors[e.severity]}`}>
                            {sevLabels[e.severity][lang]}
                          </span>
                        </TableCell>
                        <TableCell className="font-mono text-xs" dir="ltr">{l ? e.src_ar : e.src_en}</TableCell>
                        <TableCell className="text-xs max-w-[180px] truncate">{l ? e.msg_ar : e.msg_en}</TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{e.time}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* ── Security Settings ───────────────────────────────── */}
      <motion.div variants={fade} initial="hidden" animate="visible" transition={{ delay: 0.2 }}>
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">{l ? 'إعدادات الأمان' : 'Security Settings'}</CardTitle>
          </CardHeader>
          <CardContent>
            {settingItems.map((item, idx) => (
              <div key={item.key}>
                {idx > 0 && <Separator className="my-3" />}
                <div className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                      <item.icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <span className="text-sm font-medium">{l ? item.label_ar : item.label_en}</span>
                  </div>
                  <Toggle on={settings[item.key]} onToggle={() => toggleSetting(item.key)} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Security Headers ────────────────────────────────── */}
      <motion.div variants={fade} initial="hidden" animate="visible" transition={{ delay: 0.24 }}>
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">{l ? 'رؤوس الأمان' : 'Security Headers'}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className={TH}>{l ? 'الرأس' : 'Header'}</TableHead>
                  <TableHead className={TH}>{l ? 'الحالة' : 'Status'}</TableHead>
                  <TableHead className={TH}>{l ? 'القيمة' : 'Value'}</TableHead>
                  <TableHead className={TH} />
                </TableRow>
              </TableHeader>
              <TableBody>
                {headers.map(h => (
                  <TableRow key={h.name}>
                    <TableCell className="font-mono text-xs" dir="ltr">{h.name}</TableCell>
                    <TableCell>
                      <StatusBadge status={h.enabled ? 'active' : 'suspended'} locale={lang} />
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground" dir="ltr">{h.value || '—'}</TableCell>
                    <TableCell>
                      <ActionBtn icon={h.enabled ? XCircle : CheckCircle2} onClick={() => toggleHeader(h.name)} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Audit Logs ──────────────────────────────────────── */}
      <motion.div variants={fade} initial="hidden" animate="visible" transition={{ delay: 0.28 }}>
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">{l ? 'سجل التدقيق' : 'Audit Logs'}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className={TH}>{l ? 'التوقيت' : 'Timestamp'}</TableHead>
                    <TableHead className={TH}>{l ? 'المستخدم' : 'User'}</TableHead>
                    <TableHead className={TH}>{l ? 'الإجراء' : 'Action'}</TableHead>
                    <TableHead className={TH}>{l ? 'المورد' : 'Resource'}</TableHead>
                    <TableHead className={TH}>{l ? 'التفاصيل' : 'Details'}</TableHead>
                    <TableHead className={TH}>IP</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs.map((log, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-xs tabular-nums whitespace-nowrap">{log.time}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-xs">
                          <LogDot level={log.level} />
                          {l ? log.user_ar : log.user_en}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs font-medium">{l ? log.action_ar : log.action_en}</TableCell>
                      <TableCell className="text-xs">{l ? log.resource_ar : log.resource_en}</TableCell>
                      <TableCell className="text-xs max-w-[200px] truncate text-muted-foreground">{l ? log.details_ar : log.details_en}</TableCell>
                      <TableCell className="text-xs font-mono" dir="ltr">{log.ip}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Confirm Dialog ──────────────────────────────────── */}
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={l ? 'إنهاء جميع الجلسات' : 'Terminate All Sessions'}
        desc={l ? 'هل أنت متأكد من إنهاء جميع الجلسات النشطة؟ سيتم تسجيل خروج جميع المستخدمين.' : 'Are you sure you want to terminate all active sessions? All users will be logged out.'}
        onConfirm={terminateAll}
        danger
      />
    </div>
  )
}