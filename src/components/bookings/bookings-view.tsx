'use client'

import { authFetch } from '@/lib/auth-fetch'


import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Eye, MoreHorizontal, ChevronLeft, ChevronRight,
  Clock, User, MapPin, CalendarDays, Loader2, Inbox,
  Search, ArrowUp, ArrowDown,
} from 'lucide-react'
import { useAppStore } from '@/stores/app-store'
import { t, formatDate, formatCurrency } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { useIsMobile } from '@/hooks/use-mobile'
import { toast } from 'sonner'

type BookingStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'

interface BookingRow {
  id: string
  status: BookingStatus
  type: string
  startDate: string
  startTime: string
  endTime: string
  notes: string | null
  source: string
  totalPrice: number
  customer: { id: string; firstName: string; lastName: string; phone?: string | null }
  employee: { id: string; name: string } | null
  branch: { id: string; name: string }
  services: { service: { name: string; duration: number; price: number } }[]
  payments: { amount: number; status: string; method: string }[]
}

const statusConfig: Record<BookingStatus, { labelAr: string; labelEn: string; className: string }> = {
  pending: { labelAr: 'معلّقة', labelEn: 'Pending', className: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-400' },
  confirmed: { labelAr: 'مؤكدة', labelEn: 'Confirmed', className: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' },
  in_progress: { labelAr: 'جاري التنفيذ', labelEn: 'In Progress', className: 'border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400' },
  completed: { labelAr: 'مكتملة', labelEn: 'Completed', className: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  cancelled: { labelAr: 'ملغية', labelEn: 'Cancelled', className: 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-400' },
  no_show: { labelAr: 'لم يحضر', labelEn: 'No Show', className: 'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800 dark:bg-orange-900/30 dark:text-orange-400' },
}

const PAGE_SIZE = 10

export function BookingsView() {
  const { locale } = useAppStore()
  const isMobile = useIsMobile()
  const queryClient = useQueryClient()
  const dir = locale === 'ar' ? 'rtl' : 'ltr'

  const [activeStatus, setActiveStatus] = useState<BookingStatus | 'all'>('all')
  const [page, setPage] = useState(1)
  const [detailBooking, setDetailBooking] = useState<BookingRow | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortField, setSortField] = useState<'totalPrice' | 'startDate'>('totalPrice')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [detailOpen, setDetailOpen] = useState(false)

  const { data: bookingsData, isLoading } = useQuery({
    queryKey: ['bookings', activeStatus, page, searchQuery, sortField, sortDir],
    queryFn: () => {
      const params = new URLSearchParams()
      if (activeStatus !== 'all') params.set('status', activeStatus)
      params.set('page', String(page))
      params.set('limit', String(PAGE_SIZE))
      if (searchQuery.trim()) params.set('search', searchQuery.trim())
      params.set('sortField', sortField)
      params.set('sortDir', sortDir)
      return authFetch(`/api/bookings?${params}`).then((r) => r.json())
    },
  })

  const bookings: BookingRow[] = Array.isArray(bookingsData?.bookings) ? bookingsData.bookings : []
  const totalPages = bookingsData?.totalPages ?? 1
  const total = bookingsData?.total ?? 0

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      authFetch(`/api/bookings/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      toast.success(t(locale, 'bookings', 'statusUpdated'))
    },
    onError: () => {
      toast.error(t(locale, 'bookings', 'statusUpdateFailed'))
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      authFetch(`/api/bookings/${id}`, { method: 'DELETE' }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      toast.success(t(locale, 'bookings', 'bookingDeleted'))
    },
  })

  const statusTabs: { key: BookingStatus | 'all'; labelKey: string }[] = [
    { key: 'all', labelKey: 'statusAll' },
    { key: 'pending', labelKey: 'statusPending' },
    { key: 'confirmed', labelKey: 'statusConfirmed' },
    { key: 'in_progress', labelKey: 'statusInProgress' },
    { key: 'completed', labelKey: 'statusCompleted' },
    { key: 'cancelled', labelKey: 'statusCancelled' },
    { key: 'no_show', labelKey: 'statusNoShow' },
  ]

  return (
    <div dir={dir} className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-1 duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div>
          <p className="text-sm text-muted-foreground">
            {total} {t(locale, 'bookings', 'totalBookings')}
          </p>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1">
        {statusTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setActiveStatus(tab.key); setPage(1) }}
            className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all duration-150 ${
              activeStatus === tab.key
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            {t(locale, 'bookings', tab.labelKey)}
          </button>
        ))}
      </div>

      {/* Search */}
  <div className="flex items-center gap-2 mb-3">
    <div className="relative flex-1">
      <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder={locale === 'ar' ? 'بحث...' : 'Search...'}
        className="h-8 sm:h-9 w-full ps-9 pe-3 bg-background text-foreground/80"
        value={searchQuery}
        onChange={(e) => { setSearchQuery(e.target.value); setPage(1) }}
      />
    </div>
  </div>

      {/* Sort Controls */}
      <div className="flex items-center gap-2 mb-3">
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs"
          onClick={() => setSortField((f) => (f === 'totalPrice' ? 'startDate' : 'totalPrice'))}
        >
          {sortField === 'totalPrice'
            ? (locale === 'ar' ? 'المبلغ' : 'Amount')
            : (locale === 'ar' ? 'التاريخ' : 'Date')}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs"
          onClick={() => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))}
        >
          {sortDir === 'asc' ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />}
          {sortDir === 'asc'
            ? (locale === 'ar' ? 'تصاعدي' : 'Asc')
            : (locale === 'ar' ? 'تنازلي' : 'Desc')}
        </Button>
      </div>
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-lg" />
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center animate-in fade-in-0 duration-300">
          <div className="rounded-full bg-muted/50 p-3 mb-3">
            <Inbox className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-sm font-semibold mb-0.5">
            {t(locale, 'bookings', 'noBookingsFound')}
          </h3>
          <p className="text-xs text-muted-foreground">
            {t(locale, 'bookings', 'noBookingsForStatus')}
          </p>
        </div>
      ) : isMobile ? (
        /* Mobile Cards */
        <div className="space-y-2">
          {bookings.map((b, i) => (
            <div
              key={b.id}
              className="rounded-lg border bg-card p-3 shadow-sm animate-in fade-in-0 slide-in-from-bottom-1"
              style={{ animationDelay: `${i * 40}ms`, animationFillMode: 'backwards' }}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 text-[11px] font-semibold">
                    {b.customer.firstName[0]}
                  </div>
                  <span className="font-semibold text-[13px]">
                    {b.customer.firstName} {b.customer.lastName}
                  </span>
                </div>
                <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${statusConfig[b.status]?.className}`}>
                  {locale === 'ar' ? statusConfig[b.status]?.labelAr : statusConfig[b.status]?.labelEn}
                </Badge>
              </div>
              <div className="space-y-1 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <CalendarDays className="h-3 w-3 shrink-0" />
                  <span>{formatDate(b.startDate, locale)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3 w-3 shrink-0" />
                  <span className="tabular-nums">{b.startTime} - {b.endTime}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3 w-3 shrink-0" />
                  <span>{b.branch?.name || '—'}</span>
                </div>
                {b.services?.[0]?.service && (
                  <p className="truncate mt-0.5">
                    {b.services.map((s) => s.service.name).join(', ')}
                  </p>
                )}
              </div>
              <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t">
                <span className="text-sm font-semibold text-emerald-600 tabular-nums">
                  {formatCurrency(b.totalPrice, 'SAR', locale)}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => { setDetailBooking(b); setDetailOpen(true) }}
                >
                  <Eye className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Desktop Table */
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="w-10 ps-4 pe-2 text-center">#</TableHead>
                    <TableHead>{t(locale, 'bookings', 'customer')}</TableHead>
                    <TableHead>{t(locale, 'bookings', 'service')}</TableHead>
                    <TableHead>{t(locale, 'bookings', 'employee')}</TableHead>
                    <TableHead>{t(locale, 'common', 'date')}</TableHead>
                    <TableHead>{t(locale, 'common', 'time')}</TableHead>
                    <TableHead>{t(locale, 'common', 'status')}</TableHead>
                    <TableHead className="text-end pe-4">{t(locale, 'common', 'amount')}</TableHead>
                    <TableHead className="w-10 pe-3"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.map((b, i) => (
                    <TableRow
                      key={b.id}
                      className="cursor-pointer animate-in fade-in-0"
                      style={{ animationDelay: `${i * 25}ms`, animationFillMode: 'backwards' }}
                      onClick={() => { setDetailBooking(b); setDetailOpen(true) }}
                    >
                      <TableCell className="ps-4 pe-2 text-center font-mono text-xs text-muted-foreground">
                        {(page - 1) * PAGE_SIZE + i + 1}
                      </TableCell>
                      <TableCell className="font-medium text-[13px]">
                        {b.customer.firstName} {b.customer.lastName}
                      </TableCell>
                      <TableCell className="text-[13px] max-w-[180px] truncate">
                        {b.services?.map((s) => s.service.name).join(', ') || '—'}
                      </TableCell>
                      <TableCell className="text-[13px]">
                        {b.employee?.name || t(locale, 'bookings', 'unassigned')}
                      </TableCell>
                      <TableCell className="text-[13px] whitespace-nowrap">{formatDate(b.startDate, locale)}</TableCell>
                      <TableCell className="text-[13px] tabular-nums whitespace-nowrap">{b.startTime} - {b.endTime}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-[10px] ${statusConfig[b.status]?.className}`}>
                          {locale === 'ar' ? statusConfig[b.status]?.labelAr : statusConfig[b.status]?.labelEn}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-end pe-4 font-medium text-[13px] tabular-nums">
                        {formatCurrency(b.totalPrice, 'SAR', locale)}
                      </TableCell>
                      <TableCell className="pe-3">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <MoreHorizontal className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); statusMutation.mutate({ id: b.id, status: 'confirmed' }) }}>
                              {t(locale, 'bookings', 'confirmAction')}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); statusMutation.mutate({ id: b.id, status: 'completed' }) }}>
                              {t(locale, 'bookings', 'completeAction')}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); statusMutation.mutate({ id: b.id, status: 'cancelled' }) }}>
                              {t(locale, 'bookings', 'cancelAction')}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(b.id) }}
                            >
                              {t(locale, 'bookings', 'deleteAction')}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-2.5 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  {locale === 'ar' ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
                </Button>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  {locale === 'ar' ? <ChevronLeft className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Booking Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          {detailBooking && (
            <>
              <DialogHeader>
                <DialogTitle className="text-base">
                  {t(locale, 'bookings', 'bookingDetails')}
                </DialogTitle>
                <DialogDescription className="text-xs">
                  #{detailBooking.id.slice(0, 8)}...
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                {/* Status */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{t(locale, 'common', 'status')}</span>
                  <Badge variant="outline" className={`text-[11px] ${statusConfig[detailBooking.status]?.className}`}>
                    {locale === 'ar' ? statusConfig[detailBooking.status]?.labelAr : statusConfig[detailBooking.status]?.labelEn}
                  </Badge>
                </div>

                {/* Customer */}
                <div className="rounded-lg border p-3">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 font-semibold text-xs shrink-0">
                      {detailBooking.customer.firstName[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{detailBooking.customer.firstName} {detailBooking.customer.lastName}</p>
                      {detailBooking.customer.phone && (
                        <p className="text-xs text-muted-foreground truncate" dir="ltr">{detailBooking.customer.phone}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Services */}
                {detailBooking.services?.length > 0 && (
                  <div>
                    <p className="text-xs font-medium mb-1.5 text-muted-foreground">{t(locale, 'bookings', 'services')}</p>
                    <div className="space-y-1">
                      {detailBooking.services.map((s, i) => (
                        <div key={i} className="flex items-center justify-between text-[13px] bg-muted/40 rounded-md px-3 py-2">
                          <span className="truncate me-2">{s.service.name}</span>
                          <span className="font-medium tabular-nums shrink-0">{formatCurrency(s.service.price, 'SAR', locale)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Timing */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-muted/40 rounded-lg p-2.5 text-center">
                    <CalendarDays className="h-4 w-4 mx-auto mb-1 text-emerald-600" />
                    <p className="text-[10px] text-muted-foreground">{t(locale, 'common', 'date')}</p>
                    <p className="text-xs font-medium">{formatDate(detailBooking.startDate, locale)}</p>
                  </div>
                  <div className="bg-muted/40 rounded-lg p-2.5 text-center">
                    <Clock className="h-4 w-4 mx-auto mb-1 text-emerald-600" />
                    <p className="text-[10px] text-muted-foreground">{t(locale, 'common', 'time')}</p>
                    <p className="text-xs font-medium tabular-nums">{detailBooking.startTime} - {detailBooking.endTime}</p>
                  </div>
                </div>

                {/* Employee & Branch */}
                <div className="grid grid-cols-2 gap-2 text-[13px]">
                  <div>
                    <p className="text-[10px] text-muted-foreground">{t(locale, 'bookings', 'employee')}</p>
                    <p className="font-medium truncate">{detailBooking.employee?.name || '—'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">{t(locale, 'bookings', 'branch')}</p>
                    <p className="font-medium truncate">{detailBooking.branch?.name || '—'}</p>
                  </div>
                </div>

                {/* Notes */}
                {detailBooking.notes && (
                  <div>
                    <p className="text-xs font-medium mb-1">{t(locale, 'bookings', 'notes')}</p>
                    <p className="text-xs text-muted-foreground bg-muted/40 rounded-md p-2.5 leading-relaxed">
                      {detailBooking.notes}
                    </p>
                  </div>
                )}

                {/* Total */}
                <div className="flex items-center justify-between pt-2.5 border-t">
                  <span className="text-sm font-semibold">{t(locale, 'common', 'total')}</span>
                  <span className="text-lg font-bold text-emerald-600 tabular-nums">
                    {formatCurrency(detailBooking.totalPrice, 'SAR', locale)}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                  {detailBooking.status === 'pending' && (
                    <Button
                      size="sm"
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                      onClick={() => {
                        statusMutation.mutate({ id: detailBooking.id, status: 'confirmed' })
                        setDetailOpen(false)
                      }}
                    >
                      {t(locale, 'bookings', 'confirmBooking')}
                    </Button>
                  )}
                  {detailBooking.status === 'confirmed' && (
                    <Button
                      size="sm"
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                      onClick={() => {
                        statusMutation.mutate({ id: detailBooking.id, status: 'completed' })
                        setDetailOpen(false)
                      }}
                    >
                      {t(locale, 'bookings', 'completeAction')}
                    </Button>
                  )}
                  {!['completed', 'cancelled'].includes(detailBooking.status) && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        statusMutation.mutate({ id: detailBooking.id, status: 'cancelled' })
                        setDetailOpen(false)
                      }}
                    >
                      {t(locale, 'bookings', 'cancelAction')}
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}