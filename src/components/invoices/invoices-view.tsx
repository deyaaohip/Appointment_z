'use client'

import { authFetch } from '@/lib/auth-fetch'


import { useState, useMemo, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Plus,
  FileText,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Eye,
  MoreHorizontal,
  Download,
  Send,
  Inbox,
  CreditCard,
  User,
  CalendarDays,
  Phone,
  Mail,
} from 'lucide-react'
import { useAppStore } from '@/stores/app-store'
import { t, formatCurrency, formatDate, getDirection, type Locale } from '@/lib/i18n'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

// ─── Types ──────────────────────────────────────────────────────────────────

type InvoiceStatus = 'paid' | 'pending' | 'overdue' | 'cancelled'

interface PaymentCustomer {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
}

interface PaymentBooking {
  id: string
  startDate: string
  status: string
  source: string
}

interface Payment {
  id: string
  amount: number
  method: string
  status: string
  currency: string
  transactionId: string
  createdAt: string
  booking: PaymentBooking
  customer: PaymentCustomer
}

interface PaymentsResponse {
  payments: Payment[]
  total: number
  page: number
  limit: number
  totalPages: number
}

interface InvoiceRow {
  id: string
  invoiceNumber: string
  customer: string
  amount: number
  currency: string
  status: InvoiceStatus
  issueDate: string
  dueDate: string
  raw: Payment
}

const STATUS_CONFIG: Record<InvoiceStatus, { icon: React.ReactNode; className: string }> = {
  paid: { icon: <CheckCircle2 className="h-3.5 w-3.5" />, className: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-400' },
  pending: { icon: <Clock className="h-3.5 w-3.5" />, className: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-400' },
  overdue: { icon: <AlertCircle className="h-3.5 w-3.5" />, className: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-400' },
  cancelled: { icon: <XCircle className="h-3.5 w-3.5" />, className: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-900/40 dark:text-gray-400' },
}

const PAGE_SIZE = 10

// ─── Helpers ────────────────────────────────────────────────────────────────

function mapPaymentStatus(status: string): InvoiceStatus {
  const s = status?.toLowerCase() ?? 'pending'
  if (s === 'paid' || s === 'completed' || s === 'success') return 'paid'
  if (s === 'overdue') return 'overdue'
  if (s === 'cancelled' || s === 'failed' || s === 'refunded') return 'cancelled'
  return 'pending'
}

function toInvoiceRow(p: Payment): InvoiceRow {
  const firstName = p.customer?.firstName ?? ''
  const lastName = p.customer?.lastName ?? ''
  const customerName = `${firstName} ${lastName}`.trim() || '—'
  return {
    id: p.id,
    invoiceNumber: p.transactionId || `PAY-${p.id}`,
    customer: customerName,
    amount: p.amount,
    currency: p.currency || 'SAR',
    status: mapPaymentStatus(p.status),
    issueDate: p.createdAt,
    dueDate: p.booking?.startDate ?? p.createdAt,
    raw: p,
  }
}

// ─── CSV Export ──────────────────────────────────────────────────────────────

function downloadCSV(rows: InvoiceRow[], locale: string) {
  const headers = locale === 'ar'
    ? ['رقم الفاتورة', 'العميل', 'المبلغ', 'الحالة', 'تاريخ الإصدار', 'تاريخ الاستحقاق']
    : ['Invoice #', 'Customer', 'Amount', 'Status', 'Issue Date', 'Due Date']

  const lines = rows.map((r) =>
    [r.invoiceNumber, r.customer, r.amount, r.status, r.issueDate, r.dueDate].join(',')
  )
  const csv = [headers.join(','), ...lines].join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `invoices-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ─── Loading Skeleton ───────────────────────────────────────────────────────

function TableSkeleton() {
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead><Skeleton className="h-4 w-24" /></TableHead>
              <TableHead><Skeleton className="h-4 w-28" /></TableHead>
              <TableHead><Skeleton className="h-4 w-20" /></TableHead>
              <TableHead><Skeleton className="h-4 w-20" /></TableHead>
              <TableHead><Skeleton className="h-4 w-24" /></TableHead>
              <TableHead><Skeleton className="h-4 w-24" /></TableHead>
              <TableHead><Skeleton className="h-4 w-8" /></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 6 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                <TableCell><Skeleton className="h-4 w-20 ms-auto" /></TableCell>
                <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-8 w-8 rounded" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

// ─── Stats Row ──────────────────────────────────────────────────────────────

function StatsRow({ invoices }: { invoices: InvoiceRow[] }) {
  const { locale } = useAppStore()
  const numberFmt = locale === 'ar' ? 'ar-SA' : 'en-US'

  const counts = useMemo(() => {
    const paid = invoices.filter((i) => i.status === 'paid')
    const pending = invoices.filter((i) => i.status === 'pending')
    const overdue = invoices.filter((i) => i.status === 'overdue')
    return { total: invoices.length, paid: paid.length, pending: pending.length, overdue: overdue.length }
  }, [invoices])

  const cards = [
    { label: locale === 'ar' ? 'إجمالي الفواتير' : 'Total Invoices', value: counts.total, icon: <FileText className="h-5 w-5 text-blue-600" />, bg: 'bg-blue-100 dark:bg-blue-900/30' },
    { label: locale === 'ar' ? 'مدفوعة' : 'Paid', value: counts.paid, icon: <CheckCircle2 className="h-5 w-5 text-emerald-600" />, bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
    { label: locale === 'ar' ? 'معلّقة' : 'Pending', value: counts.pending, icon: <Clock className="h-5 w-5 text-amber-600" />, bg: 'bg-amber-100 dark:bg-amber-900/30' },
    { label: locale === 'ar' ? 'متأخرة' : 'Overdue', value: counts.overdue, icon: <AlertCircle className="h-5 w-5 text-red-600" />, bg: 'bg-red-100 dark:bg-red-900/30' },
  ]

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {cards.map((card, i) => (
        <div
          key={i}
          className="animate-in fade-in-0 slide-in-from-bottom-2 duration-300"
          style={{ animationDelay: `${50 + i * 60}ms`, animationFillMode: 'backwards' }}
        >
          <Card className="transition-shadow hover:shadow-md">
            <CardContent className="flex items-center gap-3 p-4">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${card.bg}`}>
                {card.icon}
              </div>
              <div>
                <p className="text-xl font-bold">{card.value.toLocaleString(numberFmt)}</p>
                <p className="text-sm text-muted-foreground">{card.label}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  )
}

// ─── Detail Dialog ──────────────────────────────────────────────────────────

function DetailDialog({
  payment,
  open,
  onOpenChange,
  locale,
}: {
  payment: Payment | null
  open: boolean
  onOpenChange: (v: boolean) => void
  locale: Locale
}) {
  if (!payment) return null

  const customerName = `${payment.customer?.firstName ?? ''} ${payment.customer?.lastName ?? ''}`.trim() || '—'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t(locale, 'common', 'details')}</DialogTitle>
          <DialogDescription>
            {payment.transactionId || `PAY-${payment.id}`}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {/* Customer */}
          <div className="bg-muted/40 rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2 mb-1">
              <User className="h-4 w-4 text-emerald-600" />
              <span className="font-semibold text-sm">{customerName}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Mail className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{payment.customer?.email || '—'}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Phone className="h-3.5 w-3.5 shrink-0" />
              <span>{payment.customer?.phone || '—'}</span>
            </div>
          </div>

          {/* Payment Info */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-muted/40 rounded-lg p-2.5 text-center">
              <CreditCard className="h-4 w-4 mx-auto mb-1 text-emerald-600" />
              <p className="text-[10px] text-muted-foreground">{t(locale, 'common', 'amount')}</p>
              <p className="text-xs font-bold tabular-nums">
                {formatCurrency(payment.amount, payment.currency || 'SAR', locale)}
              </p>
            </div>
            <div className="bg-muted/40 rounded-lg p-2.5 text-center">
              <CalendarDays className="h-4 w-4 mx-auto mb-1 text-emerald-600" />
              <p className="text-[10px] text-muted-foreground">{t(locale, 'invoices', 'issueDate')}</p>
              <p className="text-xs font-medium">{formatDate(payment.createdAt, locale)}</p>
            </div>
          </div>

          <Separator />

          {/* Extra Details */}
          <div className="grid grid-cols-2 gap-2 text-[13px]">
            <div>
              <p className="text-[10px] text-muted-foreground">{t(locale, 'common', 'status')}</p>
              <Badge variant="outline" className={`mt-0.5 gap-1 ${STATUS_CONFIG[mapPaymentStatus(payment.status)]?.className ?? ''}`}>
                {STATUS_CONFIG[mapPaymentStatus(payment.status)]?.icon}
                {t(locale, 'invoices', mapPaymentStatus(payment.status))}
              </Badge>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">{locale === 'ar' ? 'طريقة الدفع' : 'Method'}</p>
              <p className="font-medium capitalize mt-0.5">{payment.method || '—'}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">{locale === 'ar' ? 'رقم العملية' : 'Transaction ID'}</p>
              <p className="font-mono font-medium text-xs mt-0.5">{payment.transactionId || '—'}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">{locale === 'ar' ? 'مصدر الحجز' : 'Source'}</p>
              <p className="font-medium capitalize mt-0.5">{payment.booking?.source || '—'}</p>
            </div>
          </div>

          {/* Booking Info */}
          <div className="bg-muted/30 rounded-lg p-2.5 text-[13px]">
            <div className="flex items-center gap-1.5 mb-1">
              <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">{locale === 'ar' ? 'تاريخ الحجز' : 'Booking Date'}</span>
            </div>
            <p className="font-medium">{formatDate(payment.booking?.startDate ?? payment.createdAt, locale)}</p>
            {payment.booking?.status && (
              <p className="text-[11px] text-muted-foreground mt-0.5 capitalize">
                {locale === 'ar' ? 'حالة الحجز' : 'Booking status'}: {payment.booking.status}
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function InvoicesView() {
  const { locale, setCurrentView } = useAppStore()
  const dir = getDirection(locale)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [detailPayment, setDetailPayment] = useState<Payment | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  // Build query params for server-side filtering/pagination/search
  const queryParams = useMemo(() => {
    const params = new URLSearchParams()
    params.set('page', String(page))
    params.set('limit', String(PAGE_SIZE))
    if (statusFilter !== 'all') {
      params.set('status', statusFilter)
    }
    if (searchQuery.trim()) {
      params.set('search', searchQuery.trim())
    }
    return params.toString()
  }, [page, statusFilter, searchQuery])

  const { data, isLoading } = useQuery<PaymentsResponse>({
    queryKey: ['payments', page, statusFilter, searchQuery],
    queryFn: () => authFetch(`/api/payments?${queryParams}`).then((r) => r.json()),
  })

  const payments: Payment[] = Array.isArray(data?.payments) ? data.payments : []
  const totalPages = data?.totalPages ?? 1
  const total = data?.total ?? 0

  // Transform payments → invoice rows for display
  const invoiceRows: InvoiceRow[] = useMemo(() => payments.map(toInvoiceRow), [payments])

  // Stats are based on total count from API, but we build per-status from current page for simple display
  // Since API handles server-side, we show total from API response
  const allPaymentsQuery = useQuery<PaymentsResponse>({
    queryKey: ['payments', 'stats-all'],
    queryFn: () => authFetch(`/api/payments?page=1&limit=1000`).then((r) => r.json()),
    staleTime: 60_000,
  })
  const allInvoiceRows: InvoiceRow[] = useMemo(
    () => (Array.isArray(allPaymentsQuery.data?.payments) ? allPaymentsQuery.data.payments : []).map(toInvoiceRow),
    [allPaymentsQuery.data],
  )

  const statusTabs: { key: string; labelKey: string }[] = [
    { key: 'all', labelKey: 'allStatuses' },
    { key: 'paid', labelKey: 'paid' },
    { key: 'pending', labelKey: 'pending' },
    { key: 'overdue', labelKey: 'overdue' },
    { key: 'cancelled', labelKey: 'cancelled' },
  ]

  const handleStatusChange = useCallback((key: string) => {
    setStatusFilter(key)
    setPage(1)
  }, [])

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value)
    setPage(1)
  }, [])

  const handleCreate = useCallback(() => {
    setCurrentView('bookings')
    toast.success(locale === 'ar' ? 'تم التحويل لصفحة الحجوزات لإنشاء فاتورة' : 'Redirected to Bookings to create invoice')
  }, [locale, setCurrentView])

  const handleDownload = useCallback(() => {
    if (invoiceRows.length === 0) return
    downloadCSV(invoiceRows, locale)
    toast.success(
      locale === 'ar' ? 'جارٍ تحميل الفواتير...' : 'Downloading invoices...',
    )
  }, [invoiceRows, locale])

  const handleView = useCallback((inv: InvoiceRow) => {
    setDetailPayment(inv.raw)
    setDetailOpen(true)
  }, [])

  return (
    <div dir={dir} className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-1 duration-300">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t(locale, 'invoices', 'title')}</h1>
          <p className="text-sm text-muted-foreground">
            {total} {t(locale, 'common', 'results')}
          </p>
        </div>
        <Button
          className="gap-2 bg-emerald-600 hover:bg-emerald-700"
          onClick={handleCreate}
        >
          <Plus className="h-4 w-4" />
          {t(locale, 'invoices', 'newInvoice')}
        </Button>
      </div>

      {/* Stats Row */}
      {allPaymentsQuery.isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="flex items-center gap-3 p-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-1.5">
                  <Skeleton className="h-5 w-8" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <StatsRow invoices={allInvoiceRows} />
      )}

      {/* Status Filter Tabs + Search */}
      <div className="animate-in fade-in-0 slide-in-from-bottom-2 duration-300" style={{ animationDelay: '100ms', animationFillMode: 'backwards' }}>
        <Card>
          <CardContent className="space-y-3 p-4">
            {/* Status Tabs */}
            <div className="flex flex-wrap gap-2">
              {statusTabs.map((tab) => (
                <Button
                  key={tab.key}
                  variant={statusFilter === tab.key ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleStatusChange(tab.key)}
                  className={
                    statusFilter === tab.key
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : ''
                  }
                >
                  {t(locale, 'invoices', tab.labelKey)}
                </Button>
              ))}
            </div>

            {/* Search */}
            <div className="relative max-w-sm">
              <svg className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              <Input
                placeholder={t(locale, 'common', 'search') + '...'}
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="ps-9"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invoices Table */}
      <div className="animate-in fade-in-0 slide-in-from-bottom-2 duration-300" style={{ animationDelay: '150ms', animationFillMode: 'backwards' }}>
        {isLoading ? (
          <TableSkeleton />
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>{t(locale, 'invoices', 'invoiceNumber')}</TableHead>
                    <TableHead>{t(locale, 'invoices', 'customer')}</TableHead>
                    <TableHead>{t(locale, 'common', 'amount')}</TableHead>
                    <TableHead>{t(locale, 'common', 'status')}</TableHead>
                    <TableHead>{t(locale, 'invoices', 'issueDate')}</TableHead>
                    <TableHead>{t(locale, 'invoices', 'dueDate')}</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoiceRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                        <div className="flex flex-col items-center gap-2">
                          <div className="rounded-full bg-muted/50 p-2">
                            <Inbox className="h-5 w-5 text-muted-foreground" />
                          </div>
                          {t(locale, 'invoices', 'noInvoicesFound')}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    invoiceRows.map((inv, idx) => {
                      const statusCfg = STATUS_CONFIG[inv.status]
                      return (
                        <TableRow
                          key={inv.id}
                          className="border-b hover:bg-muted/30 transition-colors animate-in fade-in-0 slide-in-from-bottom-1"
                          style={{ animationDelay: `${idx * 30}ms`, animationFillMode: 'backwards' }}
                        >
                          <TableCell className="font-mono text-sm font-medium">{inv.invoiceNumber}</TableCell>
                          <TableCell className="text-sm font-medium">{inv.customer}</TableCell>
                          <TableCell className="text-end font-bold text-sm">
                            {formatCurrency(inv.amount, inv.currency, locale)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`gap-1 ${statusCfg.className}`}>
                              {statusCfg.icon}
                              {t(locale, 'invoices', inv.status)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">{formatDate(inv.issueDate, locale)}</TableCell>
                          <TableCell className="text-sm">{formatDate(inv.dueDate, locale)}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleView(inv)}>
                                  <Eye className="h-4 w-4 me-2" />
                                  {t(locale, 'common', 'view')}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {
                                  toast.success(locale === 'ar' ? 'تم إرسال الفاتورة بنجاح' : 'Invoice sent successfully')
                                }}>
                                  <Send className="h-4 w-4 me-2" />
                                  {t(locale, 'invoices', 'sendInvoice')}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={handleDownload}>
                                  <Download className="h-4 w-4 me-2" />
                                  {t(locale, 'invoices', 'downloadInvoice')}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/30">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                    {locale === 'ar' ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                  </Button>
                  <span className="text-sm text-muted-foreground">{page} / {totalPages}</span>
                  <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                    {locale === 'ar' ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Detail Dialog */}
      <DetailDialog
        payment={detailPayment}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        locale={locale}
      />
    </div>
  )
}