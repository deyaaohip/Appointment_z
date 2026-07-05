'use client'

import { useState } from 'react'
import { MessageSquare, Send, Clock, Settings, BarChart3, FileText, Plus, Search, Filter, MoreVertical, Check, X, AlertCircle, AlertTriangle, CheckCircle2, Users, CalendarDays, Phone, FileCode, Zap, Bell, ChevronDown, ChevronLeft, ChevronRight, RefreshCw, Pencil, Trash2, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useAppStore } from '@/stores/app-store'
import { t, getDirection } from '@/lib/i18n'
import { toast } from 'sonner'

// ─── CSV Export Helper ─────────────────────────────────────────────

function handleExport(data: Array<Record<string, string>>, filename: string) {
  const csvRows = [
    ['ID', 'Name', 'Status', 'Date', 'Time', 'Type'].join(','),
    ...data.map(row => Object.values(row).map(v => String(v ?? '')).join(',')),
  ]
  const csv = csvRows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// ─── Table Skeleton ────────────────────────────────────────────────

function TableSkeleton({ rows = 6, cols = 5, className }: { rows?: number; cols?: number; className?: string }) {
  return (
    <div className={className}>
      <div className="rounded-lg border overflow-hidden">
        {/* Header skeleton */}
        <div className="flex gap-2 bg-muted/50 p-3">
          {Array.from({ length: cols }).map((_, i) => (
            <Skeleton key={`h-${i}`} className="h-4 flex-1" />
          ))}
        </div>
        {/* Row skeletons */}
        {Array.from({ length: rows }).map((_, r) => (
          <div key={`r-${r}`} className="flex gap-2 p-3 border-t">
            {Array.from({ length: cols }).map((_, c) => (
              <Skeleton key={`c-${c}`} className="h-4 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Sub-components ────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, color, sub }: {
  icon: React.ElementType; label: string; value: string | number; color: string; sub?: string
}) {
  const colorMap: Record<string, string> = {
    green: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400',
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400',
    orange: 'bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400',
    red: 'bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400',
    purple: 'bg-purple-50 text-purple-600 dark:bg-purple-950/30 dark:text-purple-400',
  }
  return (
    <Card>
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
            {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
          </div>
          <div className={`rounded-xl p-2.5 ${colorMap[color] || colorMap.green}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Template Manager ──────────────────────────────────────────────

function TemplatesTab({ locale }: { locale: string }) {
  const isAr = locale === 'ar'
  const dir = getDirection(locale)
  const [search, setSearch] = useState('')
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<{ id: string; name: string; body: string; type: string; lang: string; status: string; variables: string[] } | null>(null)
  const [templateName, setTemplateName] = useState('')
  const [templateContent, setTemplateContent] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  const defaultTemplates = [
    { id: '1', name: isAr ? 'تذكير موعد' : 'Appointment Reminder', type: 'reminder', lang: isAr ? 'عربي' : 'English', status: 'active', variables: ['{{customer_name}}', '{{service_name}}', '{{date}}', '{{time}}'], body: isAr ? 'مرحباً {{customer_name}}، نذكرك بموعدك لخدمة {{service_name}} يوم {{date}} الساعة {{time}}. نتطلع لرؤيتك!' : 'Hello {{customer_name}}, this is a reminder for your {{service_name}} appointment on {{date}} at {{time}}. We look forward to seeing you!' },
    { id: '2', name: isAr ? 'تأكيد حجز' : 'Booking Confirmation', type: 'confirmation', lang: isAr ? 'عربي' : 'English', status: 'active', variables: ['{{customer_name}}', '{{service_name}}', '{{date}}', '{{time}}', '{{location}}'], body: isAr ? 'تم تأكيد حجزك بنجاح! {{customer_name}} - {{service_name}} - {{date}} الساعة {{time}} - {{location}}' : 'Your booking is confirmed! {{customer_name}} - {{service_name}} - {{date}} at {{time}} - {{location}}' },
    { id: '3', name: isAr ? 'إلغاء موعد' : 'Cancellation Notice', type: 'cancellation', lang: isAr ? 'عربي' : 'English', status: 'active', variables: ['{{customer_name}}', '{{service_name}}', '{{date}}'], body: isAr ? 'عذراً {{customer_name}}، تم إلغاء موعدك لخدمة {{service_name}} يوم {{date}}. يمكنك إعادة الحجز في أي وقت.' : 'Sorry {{customer_name}}, your {{service_name}} appointment on {{date}} has been cancelled. You can rebook anytime.' },
    { id: '4', name: isAr ? 'متابعة بعد الزيارة' : 'Follow-up', type: 'followup', lang: 'English', status: 'draft', variables: ['{{customer_name}}', '{{service_name}}'], body: isAr ? 'شكراً لزيارتك {{customer_name}}! نأمل أن تكون تجربتك مع {{service_name}} ممتازة. لا تتردد في حجز موعدك القادم.' : 'Thank you for visiting {{customer_name}}! We hope your {{service_name}} experience was excellent. Book your next appointment today.' },
  ]

  const [templates, setTemplates] = useState(defaultTemplates)

  const filtered = templates.filter(tmpl =>
    tmpl.name.toLowerCase().includes(search.toLowerCase()) ||
    tmpl.type.toLowerCase().includes(search.toLowerCase())
  )

  const typeColors: Record<string, string> = {
    reminder: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    confirmation: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    cancellation: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    followup: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  }

  const extractVariables = (text: string) => {
    const matches = text.match(/\{\{[a-z_]+\}\}/g)
    return [...new Set(matches || [])]
  }

  const openNewTemplate = () => {
    setEditingTemplate(null)
    setTemplateName('')
    setTemplateContent('')
    setTemplateDialogOpen(true)
  }

  const openEditTemplate = (tmpl: typeof templates[number]) => {
    setEditingTemplate(tmpl)
    setTemplateName(tmpl.name)
    setTemplateContent(tmpl.body)
    setTemplateDialogOpen(true)
  }

  const handleSaveTemplate = () => {
    if (!templateName.trim() || !templateContent.trim()) return
    if (editingTemplate) {
      setTemplates(prev => prev.map(t =>
        t.id === editingTemplate.id
          ? { ...t, name: templateName.trim(), body: templateContent.trim(), variables: extractVariables(templateContent) }
          : t
      ))
      toast.success(isAr ? 'تم تحديث القالب بنجاح' : 'Template updated successfully')
    } else {
      const newTmpl = {
        id: `t${Date.now()}`,
        name: templateName.trim(),
        type: 'custom' as const,
        lang: isAr ? 'عربي' : 'English',
        status: 'draft' as const,
        variables: extractVariables(templateContent),
        body: templateContent.trim(),
      }
      setTemplates(prev => [...prev, newTmpl])
      toast.success(isAr ? 'تم إضافة القالب بنجاح' : 'Template added successfully')
    }
    setTemplateDialogOpen(false)
  }

  const handleDeleteTemplate = () => {
    if (!deleteTarget) return
    setTemplates(prev => prev.filter(t => t.id !== deleteTarget))
    setDeleteTarget(null)
    toast.success(isAr ? 'تم حذف القالب' : 'Template deleted')
  }

  return (
    <div dir={dir} className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{isAr ? 'قوالب الرسائل' : 'Message Templates'}</h3>
          <p className="text-sm text-muted-foreground">
            {isAr ? 'إدارة قوالب رسائل الواتساب' : 'Manage WhatsApp message templates'}
          </p>
        </div>
        <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700" onClick={openNewTemplate}>
          <Plus className="h-4 w-4" />
          {isAr ? 'قالب جديد' : 'New Template'}
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={isAr ? 'بحث في القوالب...' : 'Search templates...'}
          className="ps-9"
        />
      </div>

      <div className="grid gap-4">
        {filtered.map((tmpl) => (
          <Card key={tmpl.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-semibold">{tmpl.name}</h4>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${typeColors[tmpl.type] || typeColors.reminder}`}>
                      {tmpl.type}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {tmpl.lang}
                    </Badge>
                    <Badge variant={tmpl.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                      {tmpl.status === 'active' ? (isAr ? 'نشط' : 'Active') : (isAr ? 'مسودة' : 'Draft')}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{tmpl.body}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {tmpl.variables.map((v) => (
                      <code key={v} className="text-xs bg-muted px-1.5 py-0.5 rounded">{v}</code>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button variant="outline" size="sm" onClick={() => openEditTemplate(tmpl)}>{isAr ? 'تعديل' : 'Edit'}</Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEditTemplate(tmpl)}>
                        <Pencil className="h-4 w-4" />
                        {isAr ? 'تعديل' : 'Edit'}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem variant="destructive" onClick={() => setDeleteTarget(tmpl.id)}>
                        <Trash2 className="h-4 w-4" />
                        {isAr ? 'حذف' : 'Delete'}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Template Dialog */}
      <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTemplate ? (isAr ? 'تعديل القالب' : 'Edit Template') : (isAr ? 'قالب جديد' : 'New Template')}</DialogTitle>
            <DialogDescription>
              {editingTemplate ? (isAr ? 'تعديل بيانات القالب' : 'Update template details') : (isAr ? 'إنشاء قالب رسالة جديد' : 'Create a new message template')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>{isAr ? 'اسم القالب' : 'Template Name'}</Label>
              <Input
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder={isAr ? 'مثال: تذكير موعد' : 'e.g. Appointment Reminder'}
              />
            </div>
            <div className="space-y-2">
              <Label>{isAr ? 'محتوى الرسالة' : 'Message Content'}</Label>
              <Textarea
                value={templateContent}
                onChange={(e) => setTemplateContent(e.target.value)}
                placeholder={isAr ? 'مرحباً {{customer_name}}...' : 'Hello {{customer_name}}...'}
                rows={5}
              />
              <p className="text-xs text-muted-foreground">
                {isAr ? 'استخدم {{variable_name}} لإضافة متغيرات' : 'Use {{variable_name}} to add variables'}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTemplateDialogOpen(false)}>
              {isAr ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleSaveTemplate} disabled={!templateName.trim() || !templateContent.trim()}>
              {isAr ? 'حفظ' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{isAr ? 'حذف القالب؟' : 'Delete Template?'}</AlertDialogTitle>
            <AlertDialogDescription>
              {isAr ? 'هل أنت متأكد من حذف هذا القالب؟ لا يمكن التراجع عن هذا الإجراء.' : 'Are you sure you want to delete this template? This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{isAr ? 'إلغاء' : 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-white hover:bg-destructive/90" onClick={handleDeleteTemplate}>
              {isAr ? 'حذف' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ─── Send Reminders Tab ────────────────────────────────────────────

function SendTab({ locale }: { locale: string }) {
  const isAr = locale === 'ar'
  const dir = getDirection(locale)
  const [sendType, setSendType] = useState<'individual' | 'bulk'>('bulk')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(0)
  const [total, setTotal] = useState(0)
  const [sendingId, setSendingId] = useState<string | null>(null)
  const [phone, setPhone] = useState('')
  const [individualSending, setIndividualSending] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isError] = useState(false)

  const defaultBookings = [
    { id: 'b1', customer: isAr ? 'أحمد محمد' : 'Ahmed Mohammed', phone: '+966501234567', service: isAr ? 'قص شعر' : 'Haircut', time: '10:00 AM', reminded: false },
    { id: 'b2', customer: isAr ? 'فاطمة علي' : 'Fatima Ali', phone: '+966509876543', service: isAr ? 'تجميل' : 'Makeup', time: '11:30 AM', reminded: true },
    { id: 'b3', customer: isAr ? 'خالد سعد' : 'Khaled Saad', phone: '+966507654321', service: isAr ? 'مساج' : 'Massage', time: '01:00 PM', reminded: false },
    { id: 'b4', customer: isAr ? 'نورة حسن' : 'Noura Hassan', phone: '+966503456789', service: isAr ? 'عناية بالبشرة' : 'Skincare', time: '02:30 PM', reminded: false },
    { id: 'b5', customer: isAr ? 'عمر يوسف' : 'Omar Youssef', phone: '+966508765432', service: isAr ? 'صبغة شعر' : 'Hair Color', time: '04:00 PM', reminded: true },
  ]

  const [todayBookings, setTodayBookings] = useState(defaultBookings)

  const refetch = () => {
    setIsLoading(true)
    setTimeout(() => {
      setTodayBookings(defaultBookings)
      setIsLoading(false)
    }, 600)
  }

  const handleBulkSend = () => {
    setSending(true)
    setSent(0)
    setTotal(todayBookings.filter(b => !b.reminded).length)
    let count = 0
    const interval = setInterval(() => {
      count++
      setSent(count)
      if (count >= total) {
        clearInterval(interval)
        setSending(false)
      }
    }, 800)
  }

  return (
    <div dir={dir} className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{isAr ? 'إرسال التذكيرات' : 'Send Reminders'}</h3>
          <p className="text-sm text-muted-foreground">
            {isAr ? 'إرسال تذكيرات مواعيد عبر الواتساب' : 'Send appointment reminders via WhatsApp'}
          </p>
        </div>
      </div>

      {/* Type Toggle */}
      <div className="flex gap-2 p-1 bg-muted rounded-lg w-fit">
        <Button
          variant={sendType === 'bulk' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setSendType('bulk')}
          className="gap-2"
        >
          <Users className="h-4 w-4" />
          {isAr ? 'إرسال جماعي' : 'Bulk Send'}
        </Button>
        <Button
          variant={sendType === 'individual' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setSendType('individual')}
          className="gap-2"
        >
          <Send className="h-4 w-4" />
          {isAr ? 'إرسال فردي' : 'Individual'}
        </Button>
      </div>

      {sendType === 'bulk' && (
        <>
          {/* Stats */}
          <Card className="border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <CalendarDays className="h-5 w-5 text-emerald-600" />
                <div>
                  <p className="font-medium">
                    {isAr ? `مواعيد اليوم: ${todayBookings.length} | بانتظار التذكير: ${todayBookings.filter(b => !b.reminded).length}` :
                      `Today's bookings: ${todayBookings.length} | Pending reminders: ${todayBookings.filter(b => !b.reminded).length}`}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {isAr ? 'سيتم إرسال التذكيرات للحجوزات التي لم يتم تذكيرها بعد' :
                      'Reminders will be sent for bookings not yet reminded'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Progress */}
          {sending && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{isAr ? 'جاري الإرسال...' : 'Sending...'}</span>
                  <span className="text-sm text-muted-foreground">{sent}/{total}</span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${total > 0 ? (sent / total) * 100 : 0}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Bookings Table */}
          {isLoading ? (
            <TableSkeleton rows={6} cols={5} className="mb-4" />
          ) : isError || !todayBookings?.length ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-red-50 dark:bg-red-900/30 p-3 mb-3">
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
              <h3 className="text-sm font-semibold">{t(locale, 'common', 'error')}</h3>
              <p className="text-xs text-red-600 dark:text-red-400">{t(locale, 'common', 'tryAgain')}</p>
              <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-3">
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="p-3 font-medium">{isAr ? 'العميل' : 'Customer'}</TableHead>
                    <TableHead className="p-3 font-medium">{isAr ? 'الخدمة' : 'Service'}</TableHead>
                    <TableHead className="p-3 font-medium">{isAr ? 'الوقت' : 'Time'}</TableHead>
                    <TableHead className="p-3 font-medium">{isAr ? 'الحالة' : 'Status'}</TableHead>
                    <TableHead className="p-3 font-medium">{isAr ? 'إجراء' : 'Action'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {todayBookings.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 font-medium text-xs">
                            {b.customer.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium">{b.customer}</p>
                            <p className="text-xs text-muted-foreground" dir="ltr">{b.phone}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="p-3">{b.service}</TableCell>
                      <TableCell className="p-3">{b.time}</TableCell>
                      <TableCell className="p-3">
                        {b.reminded ? (
                          <Badge variant="secondary" className="gap-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                            <CheckCircle2 className="h-3 w-3" />
                            {isAr ? 'تم التذكير' : 'Reminded'}
                          </Badge>
                        ) : (
                          <Badge variant="outline">{isAr ? 'بانتظار' : 'Pending'}</Badge>
                        )}
                      </TableCell>
                      <TableCell className="p-3">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={b.reminded || sending || sendingId === b.id}
                          className="gap-1.5"
                          onClick={() => {
                            setSendingId(b.id)
                            setTimeout(() => {
                              setTodayBookings(prev => prev.map(booking =>
                                booking.id === b.id ? { ...booking, reminded: true } : booking
                              ))
                              setSendingId(null)
                              toast.success(isAr ? `تم إرسال التذكير إلى ${b.customer}` : `Reminder sent to ${b.customer}`)
                            }, 1500)
                          }}
                        >
                          {sendingId === b.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Send className="h-3.5 w-3.5" />
                          )}
                          {sendingId === b.id ? (isAr ? 'جاري الإرسال...' : 'Sending...') : (isAr ? 'إرسال' : 'Send')}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <Button
            className="gap-2 bg-emerald-600 hover:bg-emerald-700"
            onClick={handleBulkSend}
            disabled={sending || todayBookings.filter(b => !b.reminded).length === 0}
          >
            {sending ? (
              <>
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {isAr ? `جاري الإرسال (${sent}/${total})` : `Sending (${sent}/${total})`}
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                {isAr ? `إرسال تذكيرات جماعية (${todayBookings.filter(b => !b.reminded).length})` :
                  `Bulk Send Reminders (${todayBookings.filter(b => !b.reminded).length})`}
              </>
            )}
          </Button>
        </>
      )}

      {sendType === 'individual' && (
        <Card>
          <CardContent className="p-5 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">{isAr ? 'رقم الواتساب' : 'WhatsApp Number'}</label>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                  <Input placeholder="+966XXXXXXXXX" dir="ltr" className="text-start" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{isAr ? 'القالب' : 'Template'}</label>
                <select className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
                  <option>{isAr ? 'تذكير موعد' : 'Appointment Reminder'}</option>
                  <option>{isAr ? 'تأكيد حجز' : 'Booking Confirmation'}</option>
                  <option>{isAr ? 'إلغاء موعد' : 'Cancellation Notice'}</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{isAr ? 'معاينة الرسالة' : 'Message Preview'}</label>
              <div className="rounded-lg border bg-muted/30 p-4 text-sm whitespace-pre-wrap min-h-[100px]">
                {isAr
                  ? 'مرحباً أحمد، نذكرك بموعدك لخدمة قص شعر يوم 2026-06-30 الساعة 10:00 AM. نتطلع لرؤيتك!'
                  : 'Hello Ahmed, this is a reminder for your Haircut appointment on 2026-06-30 at 10:00 AM. We look forward to seeing you!'}
              </div>
            </div>
            <Button
              className="gap-2 bg-emerald-600 hover:bg-emerald-700"
              disabled={individualSending}
              onClick={() => {
                if (!phone.trim()) {
                  toast.error(isAr ? 'يرجى إدخال رقم الواتساب' : 'Please enter a WhatsApp number')
                  return
                }
                setIndividualSending(true)
                setTimeout(() => {
                  setIndividualSending(false)
                  toast.success(isAr ? 'تم إرسال التذكير بنجاح' : 'Reminder sent successfully')
                  setPhone('')
                }, 1500)
              }}
            >
              {individualSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {individualSending ? (isAr ? 'جاري الإرسال...' : 'Sending...') : (isAr ? 'إرسال التذكير' : 'Send Reminder')}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ─── History Tab ───────────────────────────────────────────────────

function HistoryTab({ locale }: { locale: string }) {
  const isAr = locale === 'ar'
  const dir = getDirection(locale)
  const [isLoading, setIsLoading] = useState(false)
  const [isError] = useState(false)

  const defaultHistory = [
    { id: 'h1', customer: isAr ? 'أحمد محمد' : 'Ahmed Mohammed', phone: '+966501234567', template: isAr ? 'تذكير موعد' : 'Appointment Reminder', status: 'delivered', sentAt: '2026-06-30 08:00 AM', readAt: '2026-06-30 08:15 AM' },
    { id: 'h2', customer: isAr ? 'فاطمة علي' : 'Fatima Ali', phone: '+966509876543', template: isAr ? 'تأكيد حجز' : 'Booking Confirmation', status: 'delivered', sentAt: '2026-06-30 07:00 AM', readAt: '2026-06-30 07:30 AM' },
    { id: 'h3', customer: isAr ? 'خالد سعد' : 'Khaled Saad', phone: '+966507654321', template: isAr ? 'تذكير موعد' : 'Appointment Reminder', status: 'sent', sentAt: '2026-06-29 09:00 PM', readAt: null },
    { id: 'h4', customer: isAr ? 'سارة أحمد' : 'Sara Ahmed', phone: '+966504567890', template: isAr ? 'إلغاء موعد' : 'Cancellation Notice', status: 'failed', sentAt: '2026-06-29 03:00 PM', readAt: null },
    { id: 'h5', customer: isAr ? 'نورة حسن' : 'Noura Hassan', phone: '+966503456789', template: isAr ? 'تذكير موعد' : 'Appointment Reminder', status: 'delivered', sentAt: '2026-06-29 10:00 AM', readAt: '2026-06-29 10:05 AM' },
  ]

  const [history, setHistory] = useState(defaultHistory)

  const refetch = () => {
    setIsLoading(true)
    setTimeout(() => {
      setHistory(defaultHistory)
      setIsLoading(false)
    }, 600)
  }

  const statusColors: Record<string, string> = {
    delivered: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    sent: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    failed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  }
  const statusLabels: Record<string, string> = {
    delivered: isAr ? 'تم التوصيل' : 'Delivered',
    sent: isAr ? 'تم الإرسال' : 'Sent',
    failed: isAr ? 'فشل' : 'Failed',
  }

  return (
    <div dir={dir} className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{isAr ? 'سجل التذكيرات' : 'Reminder History'}</h3>
          <p className="text-sm text-muted-foreground">
            {isAr ? 'تتبع جميع التذكيرات المرسلة' : 'Track all sent reminders'}
          </p>
        </div>
        <Button
          variant="outline"
          className="gap-2"
          onClick={() =>
            handleExport(
              history.map(h => ({
                id: h.id,
                name: h.customer,
                status: h.status,
                date: h.sentAt.split(' ')[0],
                time: h.sentAt.split(' ')[1] ?? '',
                type: h.template,
              })),
              'whatsapp-reminder-history'
            )
          }
        >
          <FileText className="h-4 w-4" />
          {isAr ? 'تصدير' : 'Export'}
        </Button>
      </div>

      {isLoading ? (
        <TableSkeleton rows={6} cols={5} className="mb-4" />
      ) : isError || !history?.length ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-red-50 dark:bg-red-900/30 p-3 mb-3">
            <AlertTriangle className="h-5 w-5 text-red-500" />
          </div>
          <h3 className="text-sm font-semibold">{t(locale, 'common', 'error')}</h3>
          <p className="text-xs text-red-600 dark:text-red-400">{t(locale, 'common', 'tryAgain')}</p>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-3">
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="p-3 font-medium">{isAr ? 'العميل' : 'Customer'}</TableHead>
                <TableHead className="p-3 font-medium">{isAr ? 'القالب' : 'Template'}</TableHead>
                <TableHead className="p-3 font-medium">{isAr ? 'الحالة' : 'Status'}</TableHead>
                <TableHead className="p-3 font-medium">{isAr ? 'وقت الإرسال' : 'Sent At'}</TableHead>
                <TableHead className="p-3 font-medium">{isAr ? 'وقت القراءة' : 'Read At'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((h) => (
                <TableRow key={h.id}>
                  <TableCell className="p-3">
                    <div>
                      <p className="font-medium">{h.customer}</p>
                      <p className="text-xs text-muted-foreground" dir="ltr">{h.phone}</p>
                    </div>
                  </TableCell>
                  <TableCell className="p-3">{h.template}</TableCell>
                  <TableCell className="p-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[h.status] || statusColors.sent}`}>
                      {statusLabels[h.status]}
                    </span>
                  </TableCell>
                  <TableCell className="p-3 text-muted-foreground">{h.sentAt}</TableCell>
                  <TableCell className="p-3 text-muted-foreground">{h.readAt || '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

// ─── Auto-Scheduler Tab ────────────────────────────────────────────

function SchedulerTab({ locale }: { locale: string }) {
  const isAr = locale === 'ar'
  const dir = getDirection(locale)
  const [enabled, setEnabled] = useState(true)
  const [hoursBefore, setHoursBefore] = useState('24')

  return (
    <div dir={dir} className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">{isAr ? 'الجدولة التلقائية' : 'Auto-Scheduler'}</h3>
        <p className="text-sm text-muted-foreground">
          {isAr ? 'إعداد الإرسال التلقائي للتذكيرات' : 'Configure automatic reminder scheduling'}
        </p>
      </div>

      <Card>
        <CardContent className="p-5 space-y-5">
          {/* Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400 p-2.5">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium">{isAr ? 'التذكير التلقائي' : 'Auto Reminders'}</p>
                <p className="text-sm text-muted-foreground">
                  {isAr ? 'إرسال تذكيرات تلقائية قبل المواعيد' : 'Send automatic reminders before appointments'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setEnabled(!enabled)}
              className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors ${
                enabled ? 'bg-emerald-500' : 'bg-muted'
              }`}
            >
              <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                enabled ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </button>
          </div>

          {/* Timing */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {isAr ? 'أرسل التذكير قبل' : 'Send reminder before'}
              </label>
              <select
                value={hoursBefore}
                onChange={(e) => setHoursBefore(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="1">1 {isAr ? 'ساعة' : 'hour'}</option>
                <option value="2">2 {isAr ? 'ساعات' : 'hours'}</option>
                <option value="6">6 {isAr ? 'ساعات' : 'hours'}</option>
                <option value="12">12 {isAr ? 'ساعة' : 'hours'}</option>
                <option value="24">24 {isAr ? 'ساعة' : 'hours'}</option>
                <option value="48">48 {isAr ? 'ساعة' : 'hours'}</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {isAr ? 'القالب المستخدم' : 'Template to use'}
              </label>
              <select className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
                <option>{isAr ? 'تذكير موعد' : 'Appointment Reminder'}</option>
                <option>{isAr ? 'تأكيد حجز' : 'Booking Confirmation'}</option>
              </select>
            </div>
          </div>

          <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg text-sm text-amber-700 dark:text-amber-400">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <p>
              {isAr
                ? 'ملاحظة: يجب تأكيد ربط حساب الواتساب التجاري في صفحة الإعدادات لتفعيل التذكيرات التلقائية.'
                : 'Note: You must connect a Business WhatsApp account in Settings to enable auto reminders.'}
            </p>
          </div>

          <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700" disabled={!enabled} onClick={() => {
            toast.success(isAr ? 'تم حفظ إعدادات الجدولة بنجاح' : 'Scheduler settings saved successfully')
          }}>
            <Bell className="h-4 w-4" />
            {isAr ? 'حفظ الإعدادات' : 'Save Settings'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Settings Tab ──────────────────────────────────────────────────

function SettingsTab({ locale }: { locale: string }) {
  const isAr = locale === 'ar'
  const dir = getDirection(locale)
  const [saving, setSaving] = useState(false)

  return (
    <div dir={dir} className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">{isAr ? 'إعدادات الواتساب' : 'WhatsApp Settings'}</h3>
        <p className="text-sm text-muted-foreground">
          {isAr ? 'إعداد تكامل واتساب الأعمال' : 'Configure WhatsApp Business integration'}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-emerald-600" />
              {isAr ? 'حساب الواتساب' : 'WhatsApp Account'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">{isAr ? 'رقم الهاتف التجاري' : 'Business Phone Number'}</label>
              <Input placeholder="+966XXXXXXXXX" dir="ltr" className="text-start" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Access Token</label>
              <Input type="password" placeholder="EAAxxxxxxxxxxxxx" dir="ltr" className="text-start" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Phone Number ID</label>
              <Input placeholder="10xxxxxxxxxx" dir="ltr" className="text-start" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Webhook Verify Token</label>
              <Input placeholder="my_custom_token" dir="ltr" className="text-start" />
            </div>
            <Button className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700" disabled={saving} onClick={() => {
              setSaving(true)
              setTimeout(() => {
                setSaving(false)
                toast.success(isAr ? 'تم الحفظ بنجاح' : 'Saved successfully')
              }, 1500)
            }}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {isAr ? 'حفظ وإعادة الاتصال' : 'Save & Reconnect'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Settings className="h-5 w-5 text-emerald-600" />
              {isAr ? 'إعدادات عامة' : 'General Settings'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{isAr ? 'التذكير التلقائي' : 'Auto Reminders'}</p>
                <p className="text-xs text-muted-foreground">{isAr ? 'تفعيل الإرسال التلقائي' : 'Enable automatic sending'}</p>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                {isAr ? 'مفعّل' : 'Enabled'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{isAr ? 'تقارير التوصيل' : 'Delivery Reports'}</p>
                <p className="text-xs text-muted-foreground">{isAr ? 'تتبع حالة التوصيل' : 'Track delivery status'}</p>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                {isAr ? 'مفعّل' : 'Enabled'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{isAr ? 'إعادة المحاولة' : 'Retry on Failure'}</p>
                <p className="text-xs text-muted-foreground">{isAr ? 'إعادة المحاولة عند الفشل' : 'Retry when sending fails'}</p>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                {isAr ? 'مفعّل' : 'Enabled'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{isAr ? 'حد الإرسال' : 'Rate Limiting'}</p>
                <p className="text-xs text-muted-foreground">{isAr ? 'الحد الأقصى: 50 رسالة/دقيقة' : 'Max: 50 messages/min'}</p>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                50/min
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ─── Main WhatsApp View ────────────────────────────────────────────

export function WhatsAppView() {
  const { locale } = useAppStore()
  const isAr = locale === 'ar'
  const dir = getDirection(locale)

  return (
    <div dir={dir} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="h-7 w-7 text-emerald-600" />
            {isAr ? 'تذكيرات الواتساب' : 'WhatsApp Reminders'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isAr ? 'إدارة تذكيرات المواعيد عبر واتساب' : 'Manage appointment reminders via WhatsApp'}
          </p>
        </div>
        <Badge variant="outline" className="gap-1.5 px-3 py-1.5">
          <div className="h-2 w-2 rounded-full bg-emerald-500" />
          {isAr ? 'متصل' : 'Connected'}
        </Badge>
      </div>

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Send}
          label={isAr ? 'أُرسلت اليوم' : 'Sent Today'}
          value={24}
          color="green"
          sub={isAr ? '+12% من أمس' : '+12% from yesterday'}
        />
        <StatCard
          icon={CheckCircle2}
          label={isAr ? 'تم التوصيل' : 'Delivered'}
          value={22}
          color="blue"
          sub="91.7%"
        />
        <StatCard
          icon={Users}
          label={isAr ? 'مواعيد اليوم' : "Today's Bookings"}
          value={5}
          color="orange"
          sub={isAr ? '3 بانتظار التذكير' : '3 pending reminders'}
        />
        <StatCard
          icon={AlertCircle}
          label={isAr ? 'فشل الإرسال' : 'Failed'}
          value={1}
          color="red"
          sub={isAr ? 'آخر فشل: منذ 3 ساعات' : 'Last fail: 3h ago'}
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="send" className="space-y-4">
        <TabsList className="flex-wrap h-auto gap-1 bg-muted p-1">
          <TabsTrigger value="send" className="gap-1.5 text-xs sm:text-sm">
            <Send className="h-3.5 w-3.5" />
            {isAr ? 'إرسال' : 'Send'}
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-1.5 text-xs sm:text-sm">
            <FileCode className="h-3.5 w-3.5" />
            {isAr ? 'القوالب' : 'Templates'}
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5 text-xs sm:text-sm">
            <Clock className="h-3.5 w-3.5" />
            {isAr ? 'السجل' : 'History'}
          </TabsTrigger>
          <TabsTrigger value="scheduler" className="gap-1.5 text-xs sm:text-sm">
            <Zap className="h-3.5 w-3.5" />
            {isAr ? 'الجدولة' : 'Scheduler'}
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-1.5 text-xs sm:text-sm">
            <Settings className="h-3.5 w-3.5" />
            {isAr ? 'الإعدادات' : 'Settings'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="send"><SendTab locale={locale} /></TabsContent>
        <TabsContent value="templates"><TemplatesTab locale={locale} /></TabsContent>
        <TabsContent value="history"><HistoryTab locale={locale} /></TabsContent>
        <TabsContent value="scheduler"><SchedulerTab locale={locale} /></TabsContent>
        <TabsContent value="settings"><SettingsTab locale={locale} /></TabsContent>
      </Tabs>
    </div>
  )
}