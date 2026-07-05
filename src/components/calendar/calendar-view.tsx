'use client'

import { authFetch } from '@/lib/auth-fetch'


import { useState, useMemo, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  CalendarX,
  Plus,
  RefreshCw,
  Loader2,
  Pencil,
  Trash2,
  Phone,
  MapPin,
  User,
  Briefcase,
  StickyNote,
  MoreVertical,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAppStore } from '@/stores/app-store'
import { t, formatDate, getDirection, formatCurrency } from '@/lib/i18n'
import type { Locale } from '@/lib/i18n'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

// ─── Types ──────────────────────────────────────────────────────────────────

type ViewMode = 'day' | 'week' | 'month'
type BookingStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'

interface BookingService {
  service: { name: string; duration: number; price: number }
}

interface BookingRow {
  id: string
  status: BookingStatus
  startDate: string
  startTime: string
  endTime: string
  totalPrice: number
  notes: string | null
  customer: { id: string; firstName: string; lastName: string; phone?: string | null }
  employee: { id: string; name: string } | null
  branch: { id: string; name: string }
  services: BookingService[]
}

interface CustomerOption {
  id: string
  firstName: string
  lastName: string
  phone?: string | null
}

interface ServiceOption {
  id: string
  name: string
  duration: number
  price: number
}

interface EmployeeOption {
  id: string
  name: string
  specialization?: string | null
}

interface BranchOption {
  id: string
  name: string
}

// ─── Constants ──────────────────────────────────────────────────────────────

const DAY_NAMES_AR = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
const DAY_NAMES_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_NAMES_AR = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
const MONTH_NAMES_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

const HOURS_FULL = Array.from({ length: 14 }, (_, i) => i + 7) // 7AM – 8PM
const HOUR_HEIGHT = 64 // px per hour

const today = new Date()

const STATUS_STYLES: Record<BookingStatus, { dot: string; border: string; badge: string }> = {
  pending: { dot: 'bg-amber-500', border: 'border-s-amber-500 bg-amber-50 dark:bg-amber-900/20', badge: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-400' },
  confirmed: { dot: 'bg-emerald-500', border: 'border-s-emerald-500 bg-emerald-50 dark:bg-emerald-900/20', badge: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' },
  in_progress: { dot: 'bg-blue-500', border: 'border-s-blue-500 bg-blue-50 dark:bg-blue-900/20', badge: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  completed: { dot: 'bg-violet-500', border: 'border-s-violet-500 bg-violet-50 dark:bg-violet-900/20', badge: 'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-800 dark:bg-violet-900/30 dark:text-violet-400' },
  cancelled: { dot: 'bg-red-400', border: 'border-s-red-500 bg-red-50 dark:bg-red-900/20 opacity-60', badge: 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-400' },
  no_show: { dot: 'bg-orange-500', border: 'border-s-orange-500 bg-orange-50 dark:bg-orange-900/20', badge: 'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800 dark:bg-orange-900/30 dark:text-orange-400' },
}

const ALL_STATUSES: BookingStatus[] = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show']

function statusLabel(status: BookingStatus, locale: Locale): string {
  const map: Record<BookingStatus, { ar: string; en: string }> = {
    pending: { ar: 'معلّق', en: 'Pending' },
    confirmed: { ar: 'مؤكد', en: 'Confirmed' },
    in_progress: { ar: 'جاري', en: 'In Progress' },
    completed: { ar: 'مكتمل', en: 'Completed' },
    cancelled: { ar: 'ملغي', en: 'Cancelled' },
    no_show: { ar: 'لم يحضر', en: 'No Show' },
  }
  return map[status]?.[locale] ?? status
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function formatDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function getDaysInMonth(date: Date): Date[] {
  const year = date.getFullYear()
  const month = date.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startPad = firstDay.getDay()
  const days: Date[] = []
  for (let i = -startPad; i < lastDay.getDate(); i++) {
    days.push(new Date(year, month, i + 1))
  }
  while (days.length % 7 !== 0) {
    const last = days[days.length - 1]
    days.push(new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1))
  }
  return days
}

function getWeekDays(date: Date): Date[] {
  const day = date.getDay()
  const start = new Date(date)
  start.setDate(start.getDate() - day)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start)
    d.setDate(d.getDate() + i)
    return d
  })
}

function getDateRange(viewMode: ViewMode, currentDate: Date): { startDate: string; endDate: string } {
  if (viewMode === 'day') {
    const s = formatDateStr(currentDate)
    return { startDate: s, endDate: s }
  }
  if (viewMode === 'week') {
    const days = getWeekDays(currentDate)
    const start = new Date(days[0])
    start.setDate(start.getDate() - 1)
    const end = new Date(days[6])
    end.setDate(end.getDate() + 1)
    return { startDate: formatDateStr(start), endDate: formatDateStr(end) }
  }
  // month view: include prev/next month padding
  const allDays = getDaysInMonth(currentDate)
  const start = allDays[0]
  const end = allDays[allDays.length - 1]
  return { startDate: formatDateStr(start), endDate: formatDateStr(end) }
}

function getBookingDateStr(booking: BookingRow): string {
  if (!booking.startDate) return ''
  return booking.startDate.substring(0, 10)
}

function timeToMinutes(time: string): number {
  const parts = time.split(':')
  return parseInt(parts[0]) * 60 + parseInt(parts[1])
}

// ─── Animation Variants ─────────────────────────────────────────────────────

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } },
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.01 } },
}

// ─── Appointment Block (day/week view) ──────────────────────────────────────

function AppointmentBlock({
  booking,
  locale,
  onClick,
}: {
  booking: BookingRow
  locale: Locale
  onClick: () => void
}) {
  const startMinutes = timeToMinutes(booking.startTime)
  const endMinutes = timeToMinutes(booking.endTime)
  const duration = Math.max(endMinutes - startMinutes, 15)
  const top = ((startMinutes - 7 * 60) / 60) * HOUR_HEIGHT
  const height = Math.max(32, (duration / 60) * HOUR_HEIGHT)
  const style = STATUS_STYLES[booking.status] ?? STATUS_STYLES.pending
  const serviceName = booking.services?.[0]?.service?.name ?? ''
  const customerName = `${booking.customer?.firstName ?? ''} ${booking.customer?.lastName ?? ''}`.trim()

  return (
    <motion.div
      variants={itemVariants}
      initial="hidden"
      animate="visible"
      className={cn(
        'absolute start-1 end-1 z-10 rounded-md border-s-4 ps-2 pe-1 py-1 text-xs cursor-pointer transition-shadow hover:shadow-md',
        style.border,
      )}
      style={{ top: `${top}px`, height: `${height}px` }}
      onClick={onClick}
    >
      <p className="font-semibold truncate">{serviceName}</p>
      <p className="truncate text-muted-foreground">{customerName}</p>
      {height > 48 && (
        <p className="text-muted-foreground">{booking.startTime} – {booking.endTime}</p>
      )}
    </motion.div>
  )
}

// ─── Loading Skeleton ───────────────────────────────────────────────────────

function CalendarSkeleton() {
  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-32" />
        </div>
        <div className="grid grid-cols-7 gap-px">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
        <div className="grid grid-cols-7 gap-px">
          {Array.from({ length: 35 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Create Booking Dialog ──────────────────────────────────────────────────

function CreateBookingDialog({
  open,
  onOpenChange,
  locale,
  defaultDate,
  defaultTime,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  locale: Locale
  defaultDate?: string
  defaultTime?: string
}) {
  const queryClient = useQueryClient()

  const [branchId, setBranchId] = useState('')
  const [customerId, setCustomerId] = useState('')
  const [employeeId, setEmployeeId] = useState('')
  const [serviceId, setServiceId] = useState('')
  const [date, setDate] = useState(defaultDate ?? '')
  const [startTime, setStartTime] = useState(defaultTime ?? '')
  const initialEndTime = useMemo(() => {
    if (!defaultTime) return ''
    const parts = defaultTime.split(':')
    const h = parseInt(parts[0]) + 1
    return `${String(h).padStart(2, '0')}:${parts[1]}`
  }, [defaultTime])
  const [endTime, setEndTime] = useState(initialEndTime)
  const [notes, setNotes] = useState('')

  const { data: customersData } = useQuery({
    queryKey: ['customers-list'],
    queryFn: () => authFetch('/api/customers?limit=100').then((r) => r.json()),
  })
  const customers: CustomerOption[] = Array.isArray(customersData?.customers) ? customersData.customers : []

  const { data: servicesData } = useQuery({
    queryKey: ['services-list'],
    queryFn: () => authFetch('/api/services?limit=100').then((r) => r.json()),
  })
  const services: ServiceOption[] = Array.isArray(servicesData?.services) ? servicesData.services : []

  const { data: employeesData } = useQuery({
    queryKey: ['employees-list'],
    queryFn: () => authFetch('/api/employees?limit=100').then((r) => r.json()),
  })
  const employees: EmployeeOption[] = Array.isArray(employeesData?.employees) ? employeesData.employees : []

  const { data: branchesData } = useQuery({
    queryKey: ['branches-list'],
    queryFn: () => authFetch('/api/branches').then((r) => r.json()),
  })
  const branches: BranchOption[] = Array.isArray(branchesData?.branches) ? branchesData.branches : []

  const effectiveBranchId = branchId || (branches.length > 0 ? branches[0].id : '')

  const createMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      authFetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).then((r) => {
        if (!r.ok) throw new Error('Failed to create booking')
        return r.json()
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings-calendar'] })
      toast.success(t(locale, 'bookings', 'bookingCreated'))
      resetAndClose()
    },
    onError: () => {
      toast.error(t(locale, 'common', 'error'))
    },
  })

  const resetAndClose = () => {
    setCustomerId('')
    setEmployeeId('')
    setServiceId('')
    setDate('')
    setStartTime('')
    setEndTime('')
    setNotes('')
    onOpenChange(false)
  }

  const handleSubmit = () => {
    const finalBranchId = effectiveBranchId
    if (!finalBranchId || !customerId || !serviceId || !date || !startTime || !endTime) {
      toast.error(t(locale, 'common', 'required'))
      return
    }
    createMutation.mutate({
      branchId: finalBranchId,
      customerId,
      employeeId: employeeId || undefined,
      startDate: date,
      startTime,
      endTime,
      notes: notes || undefined,
      services: [{ serviceId, quantity: 1 }],
    })
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { resetAndClose() } else { onOpenChange(true) } }}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t(locale, 'bookings', 'newBooking')}</DialogTitle>
          <DialogDescription>{t(locale, 'bookings', 'selectService')}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label>{t(locale, 'calendar', 'customer')}</Label>
            <Select value={customerId} onValueChange={setCustomerId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t(locale, 'bookings', 'selectCustomer')} />
              </SelectTrigger>
              <SelectContent>
                {customers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.firstName} {c.lastName}{c.phone ? ` — ${c.phone}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>{t(locale, 'calendar', 'service')}</Label>
            <Select value={serviceId} onValueChange={setServiceId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t(locale, 'bookings', 'selectService')} />
              </SelectTrigger>
              <SelectContent>
                {services.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name} — {formatCurrency(s.price, 'SAR', locale)} ({s.duration} {locale === 'ar' ? 'دقيقة' : 'min'})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>{t(locale, 'calendar', 'employee')} ({t(locale, 'common', 'optional')})</Label>
            <Select value={employeeId} onValueChange={setEmployeeId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t(locale, 'bookings', 'selectEmployee')} />
              </SelectTrigger>
              <SelectContent>
                {employees.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>{t(locale, 'bookings', 'selectBranch')}</Label>
            <Select value={branchId} onValueChange={setBranchId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t(locale, 'bookings', 'selectBranch')} />
              </SelectTrigger>
              <SelectContent>
                {branches.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>{t(locale, 'common', 'date')}</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="grid gap-2" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>{t(locale, 'bookings', 'startTime')}</Label>
              <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>{t(locale, 'bookings', 'endTime')}</Label>
              <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
          </div>

          <div className="grid gap-2">
            <Label>{t(locale, 'calendar', 'notes')} ({t(locale, 'common', 'optional')})</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={resetAndClose}>{t(locale, 'common', 'cancel')}</Button>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={handleSubmit}
            disabled={createMutation.isPending}
          >
            {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin me-2" />}
            {t(locale, 'common', 'save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── View / Edit / Delete Dialog ────────────────────────────────────────────

function ViewEditDialog({
  booking,
  open,
  onOpenChange,
  locale,
}: {
  booking: BookingRow | null
  open: boolean
  onOpenChange: (open: boolean) => void
  locale: Locale
}) {
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)
  const [editDate, setEditDate] = useState(booking?.startDate?.substring(0, 10) ?? '')
  const [editStartTime, setEditStartTime] = useState(booking?.startTime ?? '')
  const [editEndTime, setEditEndTime] = useState(booking?.endTime ?? '')
  const [editStatus, setEditStatus] = useState<BookingStatus>(booking?.status ?? 'pending')
  const [editNotes, setEditNotes] = useState(booking?.notes ?? '')
  const [deleteOpen, setDeleteOpen] = useState(false)

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
      authFetch(`/api/bookings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).then((r) => {
        if (!r.ok) throw new Error('Failed to update')
        return r.json()
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings-calendar'] })
      toast.success(t(locale, 'bookings', 'bookingUpdated'))
      setIsEditing(false)
      onOpenChange(false)
    },
    onError: () => {
      toast.error(t(locale, 'common', 'error'))
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      authFetch(`/api/bookings/${id}`, { method: 'DELETE' }).then((r) => {
        if (!r.ok) throw new Error('Failed to delete')
        return r.json()
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings-calendar'] })
      toast.success(t(locale, 'bookings', 'bookingDeleted'))
      setDeleteOpen(false)
      onOpenChange(false)
    },
    onError: () => {
      toast.error(t(locale, 'common', 'error'))
    },
  })

  const statusChangeMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: BookingStatus }) =>
      authFetch(`/api/bookings/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      }).then((r) => {
        if (!r.ok) throw new Error('Failed to update status')
        return r.json()
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings-calendar'] })
      toast.success(t(locale, 'bookings', 'bookingUpdated'))
      onOpenChange(false)
    },
    onError: () => {
      toast.error(t(locale, 'common', 'error'))
    },
  })

  if (!booking) return null

  const style = STATUS_STYLES[booking.status] ?? STATUS_STYLES.pending
  const customerName = `${booking.customer?.firstName ?? ''} ${booking.customer?.lastName ?? ''}`.trim()
  const serviceNames = booking.services?.map((s) => s.service.name).join(', ') ?? ''
  const totalPrice = booking.totalPrice ?? booking.services?.reduce((sum, s) => sum + s.service.price, 0) ?? 0

  const handleSave = () => {
    updateMutation.mutate({
      id: booking.id,
      body: {
        startDate: editDate,
        startTime: editStartTime,
        endTime: editEndTime,
        status: editStatus,
        notes: editNotes,
      },
    })
  }

  const handleStatusChange = (status: BookingStatus) => {
    statusChangeMutation.mutate({ id: booking.id, status })
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>{t(locale, 'common', 'details')}</DialogTitle>
              <div className="flex items-center gap-2">
                <Badge className={style.badge}>{statusLabel(booking.status, locale)}</Badge>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align={locale === 'ar' ? 'start' : 'end'}>
                    {ALL_STATUSES.filter((s) => s !== booking.status).map((s) => (
                      <DropdownMenuItem key={s} onClick={() => handleStatusChange(s)}>
                        <span className={cn('h-2 w-2 rounded-full me-2', STATUS_STYLES[s].dot)} />
                        {statusLabel(s, locale)}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </DialogHeader>

          {isEditing ? (
            <div className="grid gap-4 py-2">
              <div className="grid gap-2">
                <Label>{t(locale, 'common', 'status')}</Label>
                <Select value={editStatus} onValueChange={(v) => setEditStatus(v as BookingStatus)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ALL_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        <span className="flex items-center gap-2">
                          <span className={cn('h-2 w-2 rounded-full', STATUS_STYLES[s].dot)} />
                          {statusLabel(s, locale)}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>{t(locale, 'common', 'date')}</Label>
                <Input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>{t(locale, 'bookings', 'startTime')}</Label>
                  <Input type="time" value={editStartTime} onChange={(e) => setEditStartTime(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label>{t(locale, 'bookings', 'endTime')}</Label>
                  <Input type="time" value={editEndTime} onChange={(e) => setEditEndTime(e.target.value)} />
                </div>
              </div>

              <div className="grid gap-2">
                <Label>{t(locale, 'calendar', 'notes')}</Label>
                <Textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} rows={2} />
              </div>
            </div>
          ) : (
            <div className="grid gap-3 py-2 text-sm">
              <div className="flex items-start gap-3">
                <User className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                <div>
                  <p className="font-medium">{customerName}</p>
                  {booking.customer?.phone && (
                    <p className="text-muted-foreground">{booking.customer.phone}</p>
                  )}
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Briefcase className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                <div>
                  <p className="font-medium">{serviceNames}</p>
                  <p className="text-muted-foreground">{formatCurrency(totalPrice, 'SAR', locale)}</p>
                </div>
              </div>
              {booking.employee && (
                <div className="flex items-start gap-3">
                  <User className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                  <p>{booking.employee.name}</p>
                </div>
              )}
              {booking.branch && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                  <p>{booking.branch.name}</p>
                </div>
              )}
              <div className="flex items-start gap-3">
                <Clock className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                <p>
                  {formatDate(booking.startDate, locale)}
                  {' · '}
                  {booking.startTime} – {booking.endTime}
                </p>
              </div>
              {booking.notes && (
                <div className="flex items-start gap-3">
                  <StickyNote className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                  <p className="text-muted-foreground">{booking.notes}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            {isEditing ? (
              <>
                <Button variant="outline" onClick={() => setIsEditing(false)}>{t(locale, 'common', 'cancel')}</Button>
                <Button onClick={handleSave} disabled={updateMutation.isPending}>
                  {updateMutation.isPending && <Loader2 className="h-4 w-4 animate-spin me-2" />}
                  {t(locale, 'common', 'save')}
                </Button>
              </>
            ) : (
              <>
                <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
                  <Trash2 className="h-4 w-4 me-2" />
                  {t(locale, 'common', 'delete')}
                </Button>
                <Button variant="outline" onClick={() => setIsEditing(true)}>
                  <Pencil className="h-4 w-4 me-2" />
                  {t(locale, 'common', 'edit')}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t(locale, 'common', 'delete')}?</AlertDialogTitle>
            <AlertDialogDescription>
              {locale === 'ar'
                ? 'هل أنت متأكد من حذف هذا الحجز؟ لا يمكن التراجع عن هذا الإجراء.'
                : 'Are you sure you want to delete this booking? This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t(locale, 'common', 'cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => deleteMutation.mutate(booking.id)}
            >
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 animate-spin me-2" />}
              {t(locale, 'common', 'delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

// ─── Filter Bar ─────────────────────────────────────────────────────────────

function FilterBar({
  locale,
  employees,
  branches,
  selectedEmployee,
  onEmployeeChange,
  selectedStatus,
  onStatusChange,
  selectedBranch,
  onBranchChange,
}: {
  locale: Locale
  employees: EmployeeOption[]
  branches: BranchOption[]
  selectedEmployee: string
  onEmployeeChange: (v: string) => void
  selectedStatus: string
  onStatusChange: (v: string) => void
  selectedBranch: string
  onBranchChange: (v: string) => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Select value={selectedEmployee} onValueChange={onEmployeeChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder={locale === 'ar' ? 'جميع الموظفين' : 'All Employees'} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">{locale === 'ar' ? 'جميع الموظفين' : 'All Employees'}</SelectItem>
          {employees.map((e) => (
            <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={selectedStatus} onValueChange={onStatusChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder={t(locale, 'bookings', 'allStatuses')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">{t(locale, 'bookings', 'allStatuses')}</SelectItem>
          {ALL_STATUSES.map((s) => (
            <SelectItem key={s} value={s}>
              <span className="flex items-center gap-2">
                <span className={cn('h-2 w-2 rounded-full', STATUS_STYLES[s].dot)} />
                {statusLabel(s, locale)}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={selectedBranch} onValueChange={onBranchChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder={locale === 'ar' ? 'جميع الفروع' : 'All Branches'} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">{locale === 'ar' ? 'جميع الفروع' : 'All Branches'}</SelectItem>
          {branches.map((b) => (
            <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function CalendarView() {
  const { locale } = useAppStore()
  const dir = getDirection(locale)
  const queryClient = useQueryClient()

  const [viewMode, setViewMode] = useState<ViewMode>('month')
  const [currentDate, setCurrentDate] = useState(new Date())

  // Filters
  const [filterEmployee, setFilterEmployee] = useState('__all__')
  const [filterStatus, setFilterStatus] = useState('__all__')
  const [filterBranch, setFilterBranch] = useState('__all__')

  // Dialogs
  const [createOpen, setCreateOpen] = useState(false)
  const [createDefaultDate, setCreateDefaultDate] = useState('')
  const [createDefaultTime, setCreateDefaultTime] = useState('')
  const [viewBooking, setViewBooking] = useState<BookingRow | null>(null)
  const [viewOpen, setViewOpen] = useState(false)

  // ─── Date range for fetching ─────────────────────────────────────────
  const { startDate: fetchStart, endDate: fetchEnd } = useMemo(
    () => getDateRange(viewMode, currentDate),
    [viewMode, currentDate],
  )

  // ─── Fetch bookings ──────────────────────────────────────────────────
  const { data: bookingsData, isLoading, isError, refetch } = useQuery({
    queryKey: ['bookings-calendar', fetchStart, fetchEnd],
    queryFn: () =>
      authFetch(`/api/bookings?startDate=${fetchStart}&endDate=${fetchEnd}&limit=200`).then((r) => r.json()),
  })

  const rawBookings: BookingRow[] = Array.isArray(bookingsData?.bookings) ? bookingsData.bookings : []

  // ─── Fetch filter data ───────────────────────────────────────────────
  const { data: employeesData } = useQuery({
    queryKey: ['employees-list'],
    queryFn: () => authFetch('/api/employees?limit=100').then((r) => r.json()),
  })
  const employees: EmployeeOption[] = Array.isArray(employeesData?.employees) ? employeesData.employees : []

  const { data: branchesData } = useQuery({
    queryKey: ['branches-list'],
    queryFn: () => authFetch('/api/branches').then((r) => r.json()),
  })
  const branches: BranchOption[] = Array.isArray(branchesData?.branches) ? branchesData.branches : []

  // ─── Apply client-side filters ───────────────────────────────────────
  const filteredBookings = useMemo(() => {
    let result = rawBookings
    if (filterEmployee !== '__all__') {
      result = result.filter((b) => b.employee?.id === filterEmployee)
    }
    if (filterStatus !== '__all__') {
      result = result.filter((b) => b.status === filterStatus)
    }
    if (filterBranch !== '__all__') {
      result = result.filter((b) => b.branch?.id === filterBranch)
    }
    return result
  }, [rawBookings, filterEmployee, filterStatus, filterBranch])

  // ─── Navigation ─────────────────────────────────────────────────────
  const navigate = useCallback((direction: -1 | 1) => {
    const d = new Date(currentDate)
    if (viewMode === 'day') d.setDate(d.getDate() + direction)
    else if (viewMode === 'week') d.setDate(d.getDate() + 7 * direction)
    else d.setMonth(d.getMonth() + direction)
    setCurrentDate(d)
  }, [currentDate, viewMode])

  const goToday = useCallback(() => setCurrentDate(new Date()), [])

  // ─── Handlers ────────────────────────────────────────────────────────
  const handleCreateFromSlot = useCallback((date: string, time: string) => {
    setCreateDefaultDate(date)
    setCreateDefaultTime(time)
    setCreateOpen(true)
  }, [])

  const handleBookingClick = useCallback((booking: BookingRow) => {
    setViewBooking(booking)
    setViewOpen(true)
  }, [])

  // ─── Computed ────────────────────────────────────────────────────────
  const dayNames = locale === 'ar' ? DAY_NAMES_AR : DAY_NAMES_EN
  const monthNames = locale === 'ar' ? MONTH_NAMES_AR : MONTH_NAMES_EN
  const currentHour = today.getHours()

  const headerLabel = useMemo(() => {
    if (viewMode === 'day') return formatDate(currentDate, locale)
    if (viewMode === 'week') {
      const week = getWeekDays(currentDate)
      return `${formatDate(week[0], locale)} — ${formatDate(week[6], locale)}`
    }
    return `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`
  }, [viewMode, currentDate, locale, monthNames])

  // ─── Shared Header ───────────────────────────────────────────────────
  function renderHeader() {
    return (
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">{t(locale, 'calendar', 'title')}</h1>
        <div className="flex items-center gap-2">
          <Button
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            size="sm"
            onClick={() => { setCreateDefaultDate(''); setCreateDefaultTime(''); setCreateOpen(true) }}
          >
            <Plus className="h-4 w-4 me-2" />
            {t(locale, 'bookings', 'newBooking')}
          </Button>
          <Button variant="outline" size="sm" onClick={goToday}>
            {t(locale, 'calendar', 'goToToday')}
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => navigate(-1)}>
            {locale === 'ar' ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
          <span className="text-sm font-medium min-w-44 text-center">{headerLabel}</span>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => navigate(1)}>
            {locale === 'ar' ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    )
  }

  function renderViewToggle() {
    return (
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <ToggleGroup type="single" value={viewMode} onValueChange={(v) => { if (v) setViewMode(v as ViewMode) }}>
          <ToggleGroupItem value="day">{t(locale, 'calendar', 'dayView')}</ToggleGroupItem>
          <ToggleGroupItem value="week">{t(locale, 'calendar', 'weekView')}</ToggleGroupItem>
          <ToggleGroupItem value="month">{t(locale, 'calendar', 'monthView')}</ToggleGroupItem>
        </ToggleGroup>
        <FilterBar
          locale={locale}
          employees={employees}
          branches={branches}
          selectedEmployee={filterEmployee}
          onEmployeeChange={setFilterEmployee}
          selectedStatus={filterStatus}
          onStatusChange={setFilterStatus}
          selectedBranch={filterBranch}
          onBranchChange={setFilterBranch}
        />
      </div>
    )
  }

  // ─── Error State ─────────────────────────────────────────────────────
  if (isError) {
    return (
      <div dir={dir} className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-1 duration-300">
        {renderHeader()}
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-20 gap-3">
            <CalendarX className="h-12 w-12 text-muted-foreground/50" />
            <p className="text-muted-foreground text-sm">{t(locale, 'common', 'error')}</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 me-2" />
              {t(locale, 'common', 'refresh')}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ─── Loading State ───────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div dir={dir} className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-1 duration-300">
        {renderHeader()}
        {renderViewToggle()}
        <CalendarSkeleton />
      </div>
    )
  }

  // ─── Empty State ─────────────────────────────────────────────────────
  if (rawBookings.length === 0) {
    return (
      <div dir={dir} className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-1 duration-300">
        {renderHeader()}
        {renderViewToggle()}
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-20 gap-3">
            <CalendarX className="h-12 w-12 text-muted-foreground/50" />
            <p className="text-muted-foreground text-sm">{t(locale, 'calendar', 'noAppointments')}</p>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              size="sm"
              onClick={() => { setCreateDefaultDate(''); setCreateDefaultTime(''); setCreateOpen(true) }}
            >
              <Plus className="h-4 w-4 me-2" />
              {t(locale, 'bookings', 'newBooking')}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ─── Day View ────────────────────────────────────────────────────────
  if (viewMode === 'day') {
    const dayStr = formatDateStr(currentDate)
    const dayAppts = filteredBookings.filter((b) => getBookingDateStr(b) === dayStr)
    const isTodayCell = isSameDay(currentDate, today)

    return (
      <div dir={dir} className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-1 duration-300">
        {renderHeader()}
        {renderViewToggle()}

        <AnimatePresence mode="wait">
          <motion.div
            key="day"
            initial={{ opacity: 0, x: locale === 'ar' ? -10 : 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: locale === 'ar' ? 10 : -10 }}
            transition={{ duration: 0.25 }}
            className="grid grid-cols-1 gap-4 lg:grid-cols-[200px_1fr]"
          >
            {/* Time Slot Sidebar */}
            <Card>
              <CardContent className="p-3">
                <h3 className="mb-3 text-sm font-semibold">{t(locale, 'calendar', 'timeSlot')}</h3>
                <div className="space-y-1 max-h-[500px] overflow-y-auto">
                  {HOURS_FULL.map((hour) => {
                    const slotTime = `${String(hour).padStart(2, '0')}:00`
                    const hasAppt = dayAppts.some((a) => a.startTime.startsWith(`${hour}`))
                    return (
                      <button
                        key={hour}
                        className={cn(
                          'flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted',
                          hasAppt && 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400',
                        )}
                        onClick={() => handleCreateFromSlot(dayStr, slotTime)}
                      >
                        <span className="flex items-center gap-2">
                          <Clock className="h-3.5 w-3.5" />
                          {slotTime}
                        </span>
                        {hasAppt && <span className="h-2 w-2 rounded-full bg-emerald-500" />}
                      </button>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Main Day Grid */}
            <Card className="overflow-hidden">
              <div className={cn(
                'border-b bg-muted/50 p-3 text-center',
                isTodayCell && 'bg-emerald-50 dark:bg-emerald-900/20',
              )}>
                <p className="text-xs text-muted-foreground">{dayNames[currentDate.getDay()]}</p>
                <p className={cn('text-lg font-bold', isTodayCell && 'text-emerald-600')}>{currentDate.getDate()}</p>
                <p className="text-xs text-muted-foreground">
                  {dayAppts.length} {t(locale, 'calendar', 'appointments')}
                </p>
              </div>

              <div className="overflow-y-auto max-h-[500px]">
                <div className="relative">
                  {HOURS_FULL.map((hour) => (
                    <div key={hour} className="flex border-b" style={{ height: `${HOUR_HEIGHT}px` }}>
                      <div className="w-16 shrink-0 flex items-start justify-end pe-2 text-xs text-muted-foreground pt-1">
                        {String(hour).padStart(2, '0')}:00
                      </div>
                      <div
                        className="flex-1 relative border-s cursor-pointer hover:bg-muted/20 transition-colors"
                        onClick={() => handleCreateFromSlot(dayStr, `${String(hour).padStart(2, '0')}:00`)}
                      />
                    </div>
                  ))}

                  {isTodayCell && currentHour >= 7 && currentHour <= 20 && (
                    <div
                      className="absolute start-16 end-0 z-20 flex items-center before:absolute before:start-0 before:end-0 before:border-t-2 before:border-red-500 pointer-events-none"
                      style={{ top: `${(currentHour - 7 + (today.getMinutes() / 60)) * HOUR_HEIGHT}px` }}
                    >
                      <div className="h-3 w-3 rounded-full bg-red-500 -ms-1.5" />
                    </div>
                  )}

                  {dayAppts.map((appt) => (
                    <AppointmentBlock
                      key={appt.id}
                      booking={appt}
                      locale={locale}
                      onClick={() => handleBookingClick(appt)}
                    />
                  ))}
                </div>
              </div>
            </Card>
          </motion.div>
        </AnimatePresence>

        <CreateBookingDialog
          key={createDefaultDate + createDefaultTime}
          open={createOpen}
          onOpenChange={setCreateOpen}
          locale={locale}
          defaultDate={createDefaultDate}
          defaultTime={createDefaultTime}
        />
        <ViewEditDialog
          key={viewBooking?.id ?? ''}
          booking={viewBooking}
          open={viewOpen}
          onOpenChange={setViewOpen}
          locale={locale}
        />
      </div>
    )
  }

  // ─── Week View ───────────────────────────────────────────────────────
  if (viewMode === 'week') {
    const days = getWeekDays(currentDate)

    return (
      <div dir={dir} className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-1 duration-300">
        {renderHeader()}
        {renderViewToggle()}

        <AnimatePresence mode="wait">
          <motion.div
            key="week"
            initial={{ opacity: 0, x: locale === 'ar' ? -10 : 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: locale === 'ar' ? 10 : -10 }}
            transition={{ duration: 0.25 }}
          >
            <Card className="overflow-hidden">
              <div className="grid border-b bg-muted/50" style={{ gridTemplateColumns: `56px repeat(${days.length}, 1fr)` }}>
                <div className="p-2" />
                {days.map((day, i) => {
                  const isTodayCell = isSameDay(day, today)
                  return (
                    <div key={i} className={cn('p-2 text-center border-s', isTodayCell && 'bg-emerald-50 dark:bg-emerald-900/20')}>
                      <p className="text-xs text-muted-foreground">{dayNames[day.getDay()]}</p>
                      <p className={cn('text-lg font-bold', isTodayCell && 'text-emerald-600')}>{day.getDate()}</p>
                    </div>
                  )
                })}
              </div>

              <div className="overflow-x-auto">
                <div className="overflow-y-auto max-h-[500px]">
                  <div className="grid" style={{ gridTemplateColumns: `56px repeat(${days.length}, 1fr)` }}>
                    <div className="relative">
                      {HOURS_FULL.map((hour) => (
                        <div key={hour} className="flex items-start justify-end pe-2 text-xs text-muted-foreground" style={{ height: `${HOUR_HEIGHT}px` }}>
                          {String(hour).padStart(2, '0')}:00
                        </div>
                      ))}
                    </div>

                    {days.map((day, dayIdx) => {
                      const dayStr = formatDateStr(day)
                      const dayAppts = filteredBookings.filter((b) => getBookingDateStr(b) === dayStr)
                      const isTodayCell = isSameDay(day, today)

                      return (
                        <div key={dayIdx} className={cn('relative border-s', isTodayCell && 'bg-emerald-50/30 dark:bg-emerald-900/10')}>
                          {HOURS_FULL.map((hour) => (
                            <div
                              key={hour}
                              className="border-b cursor-pointer hover:bg-muted/20 transition-colors"
                              style={{ height: `${HOUR_HEIGHT}px` }}
                              onClick={() => handleCreateFromSlot(dayStr, `${String(hour).padStart(2, '0')}:00`)}
                            />
                          ))}
                          {isTodayCell && currentHour >= 7 && currentHour <= 20 && (
                            <div
                              className="absolute start-0 end-0 z-20 flex items-center before:absolute before:start-0 before:end-0 before:border-t-2 before:border-red-500 pointer-events-none"
                              style={{ top: `${(currentHour - 7 + (today.getMinutes() / 60)) * HOUR_HEIGHT}px` }}
                            >
                              <div className="h-3 w-3 rounded-full bg-red-500 -ms-1.5" />
                            </div>
                          )}
                          {dayAppts.map((appt) => (
                            <AppointmentBlock
                              key={appt.id}
                              booking={appt}
                              locale={locale}
                              onClick={() => handleBookingClick(appt)}
                            />
                          ))}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        </AnimatePresence>

        <CreateBookingDialog
          key={createDefaultDate + createDefaultTime}
          open={createOpen}
          onOpenChange={setCreateOpen}
          locale={locale}
          defaultDate={createDefaultDate}
          defaultTime={createDefaultTime}
        />
        <ViewEditDialog
          key={viewBooking?.id ?? ''}
          booking={viewBooking}
          open={viewOpen}
          onOpenChange={setViewOpen}
          locale={locale}
        />
      </div>
    )
  }

  // ─── Month View ──────────────────────────────────────────────────────
  const monthDays = getDaysInMonth(currentDate)
  const MAX_VISIBLE_BARS = 3

  return (
    <div dir={dir} className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-1 duration-300">
      {renderHeader()}
      {renderViewToggle()}

      <AnimatePresence mode="wait">
        <motion.div
          key="month"
          initial={{ opacity: 0, x: locale === 'ar' ? -10 : 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: locale === 'ar' ? 10 : -10 }}
          transition={{ duration: 0.25 }}
        >
          <Card>
            <CardContent className="p-2">
              <div className="overflow-x-auto">
                {/* Day Headers */}
                <div className="grid grid-cols-7 gap-px mb-1 min-w-[600px]">
                  {dayNames.map((name, i) => (
                    <div key={i} className="py-2 text-center text-xs font-semibold text-muted-foreground">
                      {name}
                    </div>
                  ))}
                </div>

                {/* Day Cells */}
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-7 gap-px rounded-lg overflow-hidden border min-w-[600px]"
                >
                  {monthDays.map((day, i) => {
                    const isCurrentMonth = day.getMonth() === currentDate.getMonth()
                    const isTodayCell = isSameDay(day, today)
                    const dayStr = formatDateStr(day)
                    const dayAppts = filteredBookings.filter((b) => getBookingDateStr(b) === dayStr)
                    const visibleAppts = dayAppts.slice(0, MAX_VISIBLE_BARS)
                    const overflowCount = dayAppts.length - MAX_VISIBLE_BARS

                    return (
                      <motion.div
                        key={i}
                        variants={itemVariants}
                        transition={{ delay: i * 0.006 }}
                        className={cn(
                          'min-h-28 p-1.5 border-s bg-background transition-colors hover:bg-muted/30 cursor-pointer',
                          !isCurrentMonth && 'bg-muted/30 text-muted-foreground',
                          isTodayCell && 'bg-emerald-50 dark:bg-emerald-900/20 ring-2 ring-inset ring-emerald-500',
                        )}
                        onClick={(e) => {
                          // Only create if clicking on empty area (not on an appointment bar)
                          const target = e.target as HTMLElement
                          if (!target.closest('[data-appt-bar]')) {
                            handleCreateFromSlot(dayStr, '09:00')
                          }
                        }}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className={cn(
                            'inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold',
                            isTodayCell && 'bg-emerald-600 text-white',
                          )}>
                            {day.getDate()}
                          </span>
                          {dayAppts.length > 0 && (
                            <span className="text-[10px] text-muted-foreground">{dayAppts.length}</span>
                          )}
                        </div>
                        <div className="flex flex-col gap-0.5">
                          {visibleAppts.map((appt) => {
                            const style = STATUS_STYLES[appt.status] ?? STATUS_STYLES.pending
                            const svcName = appt.services?.[0]?.service?.name ?? ''
                            return (
                              <div
                                key={appt.id}
                                data-appt-bar
                                className={cn(
                                  'rounded-md border-s-2 ps-1.5 pe-1 py-0.5 text-[11px] leading-tight truncate cursor-pointer transition-shadow hover:shadow-sm',
                                  style.border,
                                )}
                                onClick={(e) => { e.stopPropagation(); handleBookingClick(appt) }}
                              >
                                <span className="font-semibold">{svcName}</span>
                              </div>
                            )
                          })}
                          {overflowCount > 0 && (
                            <button
                              className="text-[11px] text-muted-foreground hover:text-foreground ps-1.5 text-start"
                              onClick={(e) => { e.stopPropagation() }}
                            >
                              +{overflowCount} {t(locale, 'common', 'more')}
                            </button>
                          )}
                        </div>
                      </motion.div>
                    )
                  })}
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      <CreateBookingDialog
        key={createDefaultDate + createDefaultTime}
        open={createOpen}
        onOpenChange={setCreateOpen}
        locale={locale}
        defaultDate={createDefaultDate}
        defaultTime={createDefaultTime}
      />
      <ViewEditDialog
        key={viewBooking?.id ?? ''}
        booking={viewBooking}
        open={viewOpen}
        onOpenChange={setViewOpen}
        locale={locale}
      />
    </div>
  )
}