'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import {
  Database, HardDrive, Clock, CheckCircle2, ShieldCheck, Download,
  RotateCcw, Trash2, Plus, CloudUpload, Settings, History, FileText,
  Lock, Unlock, Eye, Shield, Layers, CalendarDays, Archive, Activity,
} from 'lucide-react'
import { useSA, StatusBadge, PageTitle, FormField, Toggle, ConfirmDialog, PrimaryBtn, ActionBtn, fade } from './sa-helpers'

// ─── Types ────────────────────────────────────────────────────
type BackupStatus = 'completed' | 'running' | 'failed' | 'expired'
type BackupType = 'full' | 'incremental'
type BackupMethod = 'automatic' | 'manual' | 'scheduled'

interface BackupItem {
  id: number
  name: { ar: string; en: string }
  date: string
  size: string
  type: BackupType
  method: BackupMethod
  status: BackupStatus
  encrypted: boolean
  verified: boolean
  location: { ar: string; en: string }
  duration: string
}

// ─── Mock Data ────────────────────────────────────────────────
const INITIAL_BACKUPS: BackupItem[] = [
  { id: 1, name: { ar: 'نسخة احتياطية يومية', en: 'Daily Backup' }, date: '2025-01-15 14:00', size: '2.4 GB', type: 'full', method: 'automatic', status: 'completed', encrypted: true, verified: true, location: { ar: 'تخزين سحابي - AWS S3', en: 'Cloud - AWS S3' }, duration: '12m 34s' },
  { id: 2, name: { ar: 'نسخة تزايديه صباحية', en: 'Morning Incremental' }, date: '2025-01-15 08:00', size: '340 MB', type: 'incremental', method: 'scheduled', status: 'completed', encrypted: true, verified: true, location: { ar: 'تخزين محلي', en: 'Local Storage' }, duration: '3m 12s' },
  { id: 3, name: { ar: 'نسخة أسبوعية', en: 'Weekly Backup' }, date: '2025-01-14 02:00', size: '2.3 GB', type: 'full', method: 'scheduled', status: 'completed', encrypted: true, verified: true, location: { ar: 'تخزين سحابي - AWS S3', en: 'Cloud - AWS S3' }, duration: '11m 48s' },
  { id: 4, name: { ar: 'نسخة يدوية طارئة', en: 'Emergency Manual' }, date: '2025-01-13 16:30', size: '2.1 GB', type: 'full', method: 'manual', status: 'completed', encrypted: false, verified: true, location: { ar: 'تخزين محلي', en: 'Local Storage' }, duration: '15m 02s' },
  { id: 5, name: { ar: 'نسخة تزايديه مسائية', en: 'Evening Incremental' }, date: '2025-01-13 20:00', size: '280 MB', type: 'incremental', method: 'automatic', status: 'failed', encrypted: true, verified: false, location: { ar: 'تخزين سحابي - AWS S3', en: 'Cloud - AWS S3' }, duration: '—' },
  { id: 6, name: { ar: 'نسخة قديمة', en: 'Old Backup' }, date: '2024-12-01 02:00', size: '1.8 GB', type: 'full', method: 'scheduled', status: 'expired', encrypted: true, verified: true, location: { ar: 'تخزين محلي', en: 'Local Storage' }, duration: '9m 55s' },
]

const RESTORE_POINTS = [
  { date: '2025-01-15 14:00', desc: { ar: 'قبل تحديث الجدول الزمني', en: 'Before schedule update' } },
  { date: '2025-01-14 02:00', desc: { ar: 'بعد ترحيل قاعدة البيانات', en: 'After database migration' } },
  { date: '2025-01-13 16:30', desc: { ar: 'قبل حذف بيانات الاختبار', en: 'Before test data cleanup' } },
  { date: '2025-01-10 02:00', desc: { ar: 'نسخة أسبوعية منتظمة', en: 'Regular weekly backup' } },
]

const BACKUP_LOGS = [
  { timestamp: '2025-01-15 14:12:34', action: { ar: 'إنشاء نسخة احتياطية', en: 'Backup Created' }, status: 'completed' as const, details: { ar: 'اكتملت النسخة اليومية بنجاح', en: 'Daily backup completed successfully' } },
  { timestamp: '2025-01-15 14:12:50', action: { ar: 'التحقق من النسخة', en: 'Backup Verified' }, status: 'completed' as const, details: { ar: 'تم التحقق من سلامة الملف', en: 'File integrity verified' } },
  { timestamp: '2025-01-13 20:03:11', action: { ar: 'فشل النسخة التزايدية', en: 'Incremental Failed' }, status: 'failed' as const, details: { ar: 'انتهت مهلة الاتصال بقاعدة البيانات', en: 'Database connection timeout' } },
  { timestamp: '2025-01-13 20:05:00', action: { ar: 'إعادة المحاولة', en: 'Retry Attempt' }, status: 'completed' as const, details: { ar: 'تمت إعادة المحاولة بنجاح', en: 'Retry succeeded' } },
  { timestamp: '2025-01-12 02:00:15', action: { ar: 'حذف نسخة منتهية الصلاحية', en: 'Expired Backup Deleted' }, status: 'completed' as const, details: { ar: 'تم حذف 2 نسخة منتهية الصلاحية', en: '2 expired backups removed' } },
]

export function BackupSystemPage() {
  const { t, isRTL, lang } = useSA()
  const [backups, setBackups] = useState<BackupItem[]>(INITIAL_BACKUPS)
  const [restoreId, setRestoreId] = useState<number | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  // Config state
  const [config, setConfig] = useState({
    automatic: true, incremental: true, encryption: true,
    compression: true, verification: true, cloudBackup: true,
  })
  const [frequency, setFrequency] = useState('daily')
  const [retention, setRetention] = useState('30')
  const [cloudProvider, setCloudProvider] = useState('aws')

  // Manual backup form
  const [formName, setFormName] = useState('')
  const [formType, setFormType] = useState<'full' | 'incremental'>('full')
  const [formNotes, setFormNotes] = useState('')

  const nextId = useMemo(() => Math.max(...backups.map(b => b.id), 0) + 1, [backups])

  const handleCreateBackup = (type: 'full' | 'incremental') => {
    const nameKey = type === 'full'
      ? { ar: 'نسخة كاملة يدوية', en: 'Manual Full Backup' }
      : { ar: 'نسخة تزايدية يدوية', en: 'Manual Incremental Backup' }
    const newBackup: BackupItem = {
      id: nextId,
      name: formName.trim() ? { ar: formName, en: formName } : nameKey,
      date: new Date().toISOString().replace('T', ' ').slice(0, 16),
      size: type === 'full' ? '2.4 GB' : '180 MB',
      type,
      method: 'manual',
      status: 'running',
      encrypted: config.encryption,
      verified: false,
      location: config.cloudBackup
        ? (cloudProvider === 'aws' ? { ar: 'تخزين سحابي - AWS S3', en: 'Cloud - AWS S3' } : cloudProvider === 'azure' ? { ar: 'تخزين سحابي - Azure', en: 'Cloud - Azure Blob' } : { ar: 'تخزين سحابي - Google', en: 'Cloud - Google Cloud' })
        : { ar: 'تخزين محلي', en: 'Local Storage' },
      duration: '...',
    }
    setBackups(prev => [newBackup, ...prev])
    toast.info(lang === 'ar' ? 'بدأت عملية النسخ الاحتياطي' : 'Backup process started')
    setFormName('')
    setFormNotes('')
    // Simulate completion
    setTimeout(() => {
      setBackups(prev => prev.map(b => b.id === newBackup.id ? { ...b, status: 'completed' as const, duration: type === 'full' ? '12m 30s' : '2m 45s', verified: config.verification } : b))
      toast.success(lang === 'ar' ? 'اكتملت النسخة الاحتياطية بنجاح' : 'Backup completed successfully')
    }, 2000)
  }

  const handleRestore = () => {
    if (!restoreId) return
    toast.info(lang === 'ar' ? 'جارٍ استعادة النسخة الاحتياطية...' : 'Restoring backup...')
    setTimeout(() => toast.success(lang === 'ar' ? 'تمت الاستعادة بنجاح' : 'Restore completed successfully'), 1500)
  }

  const handleDelete = () => {
    if (!deleteId) return
    setBackups(prev => prev.filter(b => b.id !== deleteId))
    toast.success(lang === 'ar' ? 'تم حذف النسخة الاحتياطية' : 'Backup deleted successfully')
  }

  const kpis = [
    { icon: Database, bg: 'bg-violet-600', label: lang === 'ar' ? 'إجمالي النسخ' : 'Total Backups', value: String(backups.length) },
    { icon: Clock, bg: 'bg-cyan-600', label: lang === 'ar' ? 'آخر نسخة' : 'Last Backup', value: lang === 'ar' ? 'منذ ساعتين' : '2 hours ago' },
    { icon: HardDrive, bg: 'bg-amber-600', label: lang === 'ar' ? 'التخزين المستخدم' : 'Storage Used', value: '28.4 GB' },
    { icon: CheckCircle2, bg: 'bg-emerald-600', label: lang === 'ar' ? 'نسبة النجاح' : 'Success Rate', value: '98.2%' },
  ]

  const toggleCfg = (key: keyof typeof config) => setConfig(p => ({ ...p, [key]: !p[key] }))

  return (
    <div className="space-y-5" dir={isRTL ? 'rtl' : 'ltr'}>
      <PageTitle title={lang === 'ar' ? 'نظام النسخ الاحتياطي' : 'Backup System'} />

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

      {/* Config + Create Backup */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Backup Config */}
        <motion.div variants={fade} initial="hidden" animate="visible" transition={{ delay: 0.16 }}>
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Settings className="h-4 w-4 text-violet-600" />
                {lang === 'ar' ? 'إعدادات النسخ الاحتياطي' : 'Backup Configuration'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {([
                ['automatic', lang === 'ar' ? 'نسخ احتياطي تلقائي' : 'Automatic Backup'],
                ['incremental', lang === 'ar' ? 'نسخ تزايدي' : 'Incremental Backup'],
                ['encryption', lang === 'ar' ? 'التشفير' : 'Encryption'],
                ['compression', lang === 'ar' ? 'الضغط' : 'Compression'],
                ['verification', lang === 'ar' ? 'التحقق' : 'Verification'],
                ['cloudBackup', lang === 'ar' ? 'نسخ سحابي' : 'Cloud Backup'],
              ] as const).map(([key, label]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-sm">{label}</span>
                  <Toggle on={config[key]} onToggle={() => toggleCfg(key)} />
                </div>
              ))}
              <Separator />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <FormField label={lang === 'ar' ? 'التكرار' : 'Frequency'}>
                  <Select value={frequency} onValueChange={setFrequency}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">{lang === 'ar' ? 'كل ساعة' : 'Hourly'}</SelectItem>
                      <SelectItem value="daily">{lang === 'ar' ? 'يومي' : 'Daily'}</SelectItem>
                      <SelectItem value="weekly">{lang === 'ar' ? 'أسبوعي' : 'Weekly'}</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>
                <FormField label={lang === 'ar' ? 'فترة الاحتفاظ (أيام)' : 'Retention (Days)'}>
                  <Select value={retention} onValueChange={setRetention}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[7, 14, 30, 60, 90].map(d => (
                        <SelectItem key={d} value={String(d)}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
                <FormField label={lang === 'ar' ? 'مزود السحابة' : 'Cloud Provider'}>
                  <Select value={cloudProvider} onValueChange={setCloudProvider}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="aws">AWS S3</SelectItem>
                      <SelectItem value="azure">Azure Blob</SelectItem>
                      <SelectItem value="google">Google Cloud</SelectItem>
                      <SelectItem value="none">{lang === 'ar' ? 'بدون' : 'None'}</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Create Backup */}
        <motion.div variants={fade} initial="hidden" animate="visible" transition={{ delay: 0.20 }}>
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Plus className="h-4 w-4 text-violet-600" />
                {lang === 'ar' ? 'إنشاء نسخة احتياطية' : 'Create Backup'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button className="flex-1 gap-2 bg-violet-600 hover:bg-violet-700 text-white" onClick={() => handleCreateBackup('full')}>
                  <Database className="h-4 w-4" />
                  {lang === 'ar' ? 'نسخة كاملة' : 'Full Backup'}
                </Button>
                <Button className="flex-1 gap-2 bg-violet-600 hover:bg-violet-700 text-white" onClick={() => handleCreateBackup('incremental')}>
                  <Layers className="h-4 w-4" />
                  {lang === 'ar' ? 'نسخة تزايدية' : 'Incremental Backup'}
                </Button>
              </div>
              <Separator />
              <div className="space-y-3">
                <FormField label={lang === 'ar' ? 'اسم النسخة' : 'Backup Name'}>
                  <Input value={formName} onChange={e => setFormName(e.target.value)} placeholder={lang === 'ar' ? 'اسم اختياري...' : 'Optional name...'} className="h-9" />
                </FormField>
                <FormField label={lang === 'ar' ? 'النوع' : 'Type'}>
                  <Select value={formType} onValueChange={v => setFormType(v as 'full' | 'incremental')}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full">{lang === 'ar' ? 'كاملة' : 'Full'}</SelectItem>
                      <SelectItem value="incremental">{lang === 'ar' ? 'تزايدية' : 'Incremental'}</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>
                <FormField label={lang === 'ar' ? 'ملاحظات' : 'Notes'}>
                  <Textarea value={formNotes} onChange={e => setFormNotes(e.target.value)} placeholder={lang === 'ar' ? 'ملاحظات اختيارية...' : 'Optional notes...'} rows={2} />
                </FormField>
                <Button className="w-full gap-2 bg-violet-600 hover:bg-violet-700 text-white" onClick={() => handleCreateBackup(formType)}>
                  <CloudUpload className="h-4 w-4" />
                  {lang === 'ar' ? 'بدء النسخ الاحتياطي' : 'Start Backup'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Backup List */}
      <motion.div variants={fade} initial="hidden" animate="visible" transition={{ delay: 0.24 }}>
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Archive className="h-4 w-4 text-violet-600" />
              {lang === 'ar' ? 'قائمة النسخ الاحتياطية' : 'Backup List'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider">{lang === 'ar' ? 'الاسم' : 'Name'}</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-end">{lang === 'ar' ? 'التاريخ' : 'Date'}</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-end">{lang === 'ar' ? 'الحجم' : 'Size'}</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider">{lang === 'ar' ? 'النوع' : 'Type'}</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider">{lang === 'ar' ? 'الطريقة' : 'Method'}</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider">{lang === 'ar' ? 'الحالة' : 'Status'}</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-center">{lang === 'ar' ? 'تشفير' : 'Enc'}</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-center">{lang === 'ar' ? 'تحقق' : 'Ver'}</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-end">{lang === 'ar' ? 'المدة' : 'Duration'}</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-end">{lang === 'ar' ? 'إجراءات' : 'Actions'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {backups.map(b => (
                    <TableRow key={b.id}>
                      <TableCell className="text-sm font-medium max-w-[150px] truncate">{b.name[lang]}</TableCell>
                      <TableCell className="text-end text-xs text-muted-foreground font-mono">{b.date}</TableCell>
                      <TableCell className="text-end text-sm">{b.size}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold border ${b.type === 'full' ? 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-400' : 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-400'}`}>
                          {b.type === 'full' ? (lang === 'ar' ? 'كاملة' : 'Full') : (lang === 'ar' ? 'تزايدية' : 'Incr.')}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {b.method === 'automatic' ? (lang === 'ar' ? 'تلقائي' : 'Auto') : b.method === 'scheduled' ? (lang === 'ar' ? 'مجدول' : 'Sched.') : (lang === 'ar' ? 'يدوي' : 'Manual')}
                      </TableCell>
                      <TableCell><StatusBadge status={b.status} locale={lang} /></TableCell>
                      <TableCell className="text-center">{b.encrypted ? <Lock className="h-3.5 w-3.5 text-emerald-500 inline" /> : <Unlock className="h-3.5 w-3.5 text-muted-foreground inline" />}</TableCell>
                      <TableCell className="text-center">{b.verified ? <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 inline" /> : <Eye className="h-3.5 w-3.5 text-muted-foreground inline" />}</TableCell>
                      <TableCell className="text-end text-xs font-mono">{b.duration}</TableCell>
                      <TableCell className="text-end">
                        <div className="flex items-center justify-end gap-1">
                          <ActionBtn icon={Download} label={lang === 'ar' ? 'تحميل' : 'Download'} onClick={() => toast.info(lang === 'ar' ? 'جارٍ التحميل...' : 'Downloading...')} />
                          <ActionBtn icon={RotateCcw} label={lang === 'ar' ? 'استعادة' : 'Restore'} onClick={() => setRestoreId(b.id)} />
                          <ActionBtn icon={Trash2} onClick={() => setDeleteId(b.id)} danger />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Restore Points + Backup Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Restore Points */}
        <motion.div variants={fade} initial="hidden" animate="visible" transition={{ delay: 0.28 }}>
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <History className="h-4 w-4 text-violet-600" />
                {lang === 'ar' ? 'نقاط الاستعادة' : 'Restore Points'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {RESTORE_POINTS.map((rp, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/40 hover:bg-muted/70 transition-colors">
                  <CalendarDays className="h-4 w-4 text-violet-500 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{rp.desc[lang]}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 font-mono">{rp.date}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Backup Logs */}
        <motion.div variants={fade} initial="hidden" animate="visible" transition={{ delay: 0.32 }}>
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4 text-violet-600" />
                {lang === 'ar' ? 'سجل النسخ الاحتياطي' : 'Backup Logs'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider">{lang === 'ar' ? 'التوقيت' : 'Timestamp'}</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider">{lang === 'ar' ? 'الإجراء' : 'Action'}</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider">{lang === 'ar' ? 'الحالة' : 'Status'}</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider">{lang === 'ar' ? 'التفاصيل' : 'Details'}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {BACKUP_LOGS.map((log, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-[11px] font-mono text-muted-foreground whitespace-nowrap">{log.timestamp}</TableCell>
                        <TableCell className="text-sm font-medium">{log.action[lang]}</TableCell>
                        <TableCell><StatusBadge status={log.status} locale={lang} /></TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{log.details[lang]}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Restore Confirm Dialog */}
      <ConfirmDialog
        open={restoreId !== null}
        onOpenChange={() => setRestoreId(null)}
        title={lang === 'ar' ? 'تأكيد الاستعادة' : 'Confirm Restore'}
        desc={lang === 'ar' ? 'هل أنت متأكد من استعادة هذه النسخة الاحتياطية؟ سيتم استبدال البيانات الحالية.' : 'Are you sure you want to restore this backup? Current data will be replaced.'}
        onConfirm={handleRestore}
      />

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={() => setDeleteId(null)}
        title={lang === 'ar' ? 'تأكيد الحذف' : 'Confirm Delete'}
        desc={lang === 'ar' ? 'هل أنت متأكد من حذف هذه النسخة الاحتياطية؟ لا يمكن التراجع عن هذا الإجراء.' : 'Are you sure you want to delete this backup? This action cannot be undone.'}
        onConfirm={handleDelete}
        danger
      />
    </div>
  )
}