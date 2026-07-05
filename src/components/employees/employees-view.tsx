'use client'

import { authFetch } from '@/lib/auth-fetch'


import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Eye,
  X,
  Loader2,
  Inbox,
  User,
  Phone,
  Mail,
  Calendar,
  Clock,
  MapPin,
  Briefcase,
  Percent,
  Star,
  DollarSign,
  TrendingUp,
  CalendarOff,
  Scissors,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  BadgeCheck,
  Coffee,
  Pencil,
  Trash2,
  Search,
  MoreHorizontal,
} from 'lucide-react'

import { useAppStore } from '@/stores/app-store'
import { t, formatDate, formatCurrency, type Locale } from '@/lib/i18n'
import { useIsMobile } from '@/hooks/use-mobile'
import { toast } from '@/hooks/use-toast'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

// ─── Types ──────────────────────────────────────────────────────────────────

interface Branch {
  id: string
  name: string
  _count?: { employees: number; bookings: number }
}

interface EmployeeScheduleRow {
  id: string
  dayOfWeek: number
  startTime: string
  endTime: string
  breakStart: string | null
  breakEnd: string | null
  isWorking: boolean
}

interface EmployeeService {
  id: string
  service: {
    id: string
    name: string
    price: number
    duration: number
    category?: { id: string; name: string } | null
  }
  canPerform: boolean
}

interface EmployeeLeave {
  id: string
  startDate: string
  endDate: string
  reason: string | null
  status: string
}

interface EmployeeBooking {
  id: string
  startDate: string
  startTime: string
  endTime: string
  status: string
  totalPrice: number
  customer?: { id: string; firstName: string; lastName: string; phone: string | null }
  services?: { id: string; service: { id: string; name: string } }[]
  branch?: { id: string; name: string }
}

interface EmployeePerformance {
  totalCompleted: number
  totalRevenue: number
  avgRating: number
  monthBookings: number
  monthRevenue: number
}

interface EmployeeRow {
  id: string
  name: string
  email: string | null
  phone: string | null
  avatar: string | null
  bio: string | null
  specialization: string | null
  commissionRate: number
  isActive: boolean
  branchId: string
  branch: { id: string; name: string }
  schedules: EmployeeScheduleRow[]
  _count: { services: number }
  bookingCount: number
}

interface EmployeeDetail extends EmployeeRow {
  services: EmployeeService[]
  leaves: EmployeeLeave[]
}

interface EmployeeDetailResponse {
  employee: EmployeeDetail
  todayBookings: EmployeeBooking[]
  performance: EmployeePerformance
}

// ─── Constants ──────────────────────────────────────────────────────────────

const dayNamesAr = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
const dayNamesEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const avatarColors = [
  'bg-emerald-500',
  'bg-teal-500',
  'bg-cyan-500',
  'bg-sky-500',
  'bg-violet-500',
  'bg-rose-500',
  'bg-amber-500',
  'bg-lime-600',
]

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
}

const stagger = {
  visible: { transition: { staggerChildren: 0.06 } },
}

const PAGE_SIZE = 12

// ─── Sub-Components ──────────────────────────────────────────────────────────

function CardsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-52 rounded-xl" />
      ))}
    </div>
  )
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function EmployeesView() {
  const { locale } = useAppStore()
  const isMobile = useIsMobile()
  const queryClient = useQueryClient()

  // ── State ──
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [branchFilter, setBranchFilter] = useState<string>('')
  const [createOpen, setCreateOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [detailTab, setDetailTab] = useState('profile')
  const [editOpen, setEditOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  // ── Queries ──
  const { data: branchesData } = useQuery({
    queryKey: ['branches'],
    queryFn: () => authFetch('/api/branches').then((r) => r.json()),
  })

  const { data: employeesData, isLoading: employeesLoading } = useQuery({
    queryKey: ['employees', branchFilter, page, search],
    queryFn: () => {
      const params = new URLSearchParams()
      if (branchFilter) params.set('branchId', branchFilter)
      if (search) params.set('search', search)
      params.set('page', String(page))
      params.set('limit', String(PAGE_SIZE))
      const qs = params.toString()
      return authFetch(`/api/employees${qs ? `?${qs}` : ''}`).then((r) => r.json())
    },
  })

  const { data: detailData, isLoading: detailLoading } = useQuery<
    EmployeeDetailResponse | undefined
  >({
    queryKey: ['employee-detail', detailId],
    queryFn: () => authFetch(`/api/employees/${detailId}`).then((r) => r.json()),
    enabled: !!detailId && detailOpen,
  })

  const branches: Branch[] = branchesData?.branches ?? []
  const employees: EmployeeRow[] = employeesData?.employees ?? []
  const total = employeesData?.total ?? 0
  const totalPages = employeesData?.totalPages ?? 1

  const detailEmployee: EmployeeDetail | null = detailData?.employee ?? null
  const todayBookings: EmployeeBooking[] = detailData?.todayBookings ?? []
  const performance: EmployeePerformance = detailData?.performance ?? {
    totalCompleted: 0,
    totalRevenue: 0,
    avgRating: 0,
    monthBookings: 0,
    monthRevenue: 0,
  }

  // ── Mutations ──
  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      authFetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: (data) => {
      if (data.error) {
        toast({
          title: locale === 'ar' ? 'خطأ' : 'Error',
          description: data.error,
          variant: 'destructive',
        })
        return
      }
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      setCreateOpen(false)
      toast({
        title: locale === 'ar' ? 'تم بنجاح' : 'Success',
        description: locale === 'ar' ? 'تم إضافة الموظف بنجاح' : 'Employee created successfully',
      })
    },
    onError: () => {
      toast({
        title: locale === 'ar' ? 'خطأ' : 'Error',
        description: locale === 'ar' ? 'حدث خطأ أثناء إضافة الموظف' : 'Failed to create employee',
        variant: 'destructive',
      })
    },
  })

  const editMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      authFetch(`/api/employees/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: (data) => {
      if (data.error) {
        toast({
          title: locale === 'ar' ? 'خطأ' : 'Error',
          description: data.error,
          variant: 'destructive',
        })
        return
      }
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      queryClient.invalidateQueries({ queryKey: ['employee-detail'] })
      setEditOpen(false)
      setEditId(null)
      toast({
        title: locale === 'ar' ? 'تم بنجاح' : 'Success',
        description: locale === 'ar' ? 'تم تحديث الموظف بنجاح' : 'Employee updated successfully',
      })
    },
    onError: () => {
      toast({
        title: locale === 'ar' ? 'خطأ' : 'Error',
        description: locale === 'ar' ? 'حدث خطأ أثناء تحديث الموظف' : 'Failed to update employee',
        variant: 'destructive',
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      authFetch(`/api/employees/${id}`, { method: 'DELETE' }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      setDeleteOpen(false)
      setDeleteId(null)
      toast({
        title: locale === 'ar' ? 'تم بنجاح' : 'Success',
        description: locale === 'ar' ? 'تم حذف الموظف بنجاح' : 'Employee deleted successfully',
      })
    },
    onError: () => {
      toast({
        title: locale === 'ar' ? 'خطأ' : 'Error',
        description: locale === 'ar' ? 'حدث خطأ أثناء حذف الموظف' : 'Failed to delete employee',
        variant: 'destructive',
      })
    },
  })

  // ── Handlers ──
  const openDetail = useCallback((id: string, tab?: string) => {
    setDetailId(id)
    setDetailTab(tab || 'profile')
    setDetailOpen(true)
  }, [])

  const openEdit = useCallback((id: string) => {
    setEditId(id)
    setEditOpen(true)
  }, [])

  const openDelete = useCallback((id: string) => {
    setDeleteId(id)
    setDeleteOpen(true)
  }, [])

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setSearch(searchInput)
      setPage(1)
    }, 400)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [searchInput])

  const handleCreate = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      const form = e.currentTarget
      const data = {
        name: (form.elements.namedItem('name') as HTMLInputElement).value,
        email: (form.elements.namedItem('email') as HTMLInputElement).value || undefined,
        phone: (form.elements.namedItem('phone') as HTMLInputElement).value || undefined,
        specialization: (form.elements.namedItem('specialization') as HTMLInputElement).value || undefined,
        branchId: (form.elements.namedItem('branchId') as HTMLSelectElement).value,
        commissionRate: parseFloat((form.elements.namedItem('commissionRate') as HTMLInputElement).value) || 0,
        bio: (form.elements.namedItem('bio') as HTMLTextAreaElement).value || undefined,
      }
      createMutation.mutate(data)
    },
    [createMutation],
  )

  const handleEdit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      if (!editId) return
      const form = e.currentTarget
      const data: Record<string, unknown> = {
        name: (form.elements.namedItem('editName') as HTMLInputElement)?.value,
        email: (form.elements.namedItem('editEmail') as HTMLInputElement)?.value || null,
        phone: (form.elements.namedItem('editPhone') as HTMLInputElement)?.value || null,
        specialization: (form.elements.namedItem('editSpecialization') as HTMLInputElement)?.value || null,
        branchId: (form.elements.namedItem('editBranchId') as HTMLSelectElement)?.value,
        commissionRate: parseFloat((form.elements.namedItem('editCommissionRate') as HTMLInputElement)?.value) || 0,
        bio: (form.elements.namedItem('editBio') as HTMLTextAreaElement)?.value || null,
        isActive: (form.elements.namedItem('editIsActive') as HTMLInputElement)?.checked ?? true,
      }
      editMutation.mutate({ id: editId, data })
    },
    [editId, editMutation],
  )

  // ── Render helpers ──
  const getInitials = (name: string) =>
    name
      .split(' ')
      .map((w) => w.charAt(0))
      .slice(0, 2)
      .join('')
      .toUpperCase()

  const getAvatarColor = (name: string) => {
    let hash = 0
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
    return avatarColors[Math.abs(hash) % avatarColors.length]
  }

  const getDayName = (day: number) =>
    locale === 'ar' ? dayNamesAr[day] : dayNamesEn[day]

  const formatTime = (time: string) => {
    if (!time) return ''
    const [h, m] = time.split(':')
    const hour = parseInt(h, 10)
    const ampm = hour >= 12 ? 'م' : 'ص'
    const h12 = hour % 12 || 12
    return `${h12}:${m} ${ampm}`
  }

  // ─── Employee Card ─────────────────────────────────────────────────────

  const EmployeeCard = ({ emp }: { emp: EmployeeRow }) => (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      exit="exit"
      whileHover={{ y: -2 }}
      className="rounded-xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${getAvatarColor(emp.name)}`}
        >
          {getInitials(emp.name)}
        </div>
        <div className="flex-1 min-w-0">
          {/* Name + Status */}
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm truncate">{emp.name}</h3>
            <Badge
              variant={emp.isActive ? 'default' : 'secondary'}
              className={
                emp.isActive
                  ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-400 dark:border-emerald-800 text-[10px] px-1.5 py-0'
                  : 'text-[10px] px-1.5 py-0'
              }
            >
              {emp.isActive ? (
                <>
                  <BadgeCheck className="h-3 w-3 me-0.5" />
                  {locale === 'ar' ? 'نشط' : 'Active'}
                </>
              ) : (
                locale === 'ar' ? 'غير نشط' : 'Inactive'
              )}
            </Badge>
          </div>

          {/* Specialization */}
          {emp.specialization && (
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
              <Briefcase className="h-3 w-3 shrink-0" />
              {emp.specialization}
            </p>
          )}

          {/* Branch */}
          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
            <MapPin className="h-3 w-3 shrink-0" />
            {emp.branch?.name}
          </p>
        </div>
      </div>

      <Separator className="my-3" />

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-xs text-muted-foreground">{locale === 'ar' ? 'حجوزات اليوم' : 'Today'}</p>
          <p className="text-lg font-bold text-emerald-600">{emp.bookingCount}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{locale === 'ar' ? 'الخدمات' : 'Services'}</p>
          <p className="text-lg font-bold text-emerald-600">{emp._count.services}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{locale === 'ar' ? 'العمولة' : 'Commission'}</p>
          <p className="text-lg font-bold text-emerald-600">{emp.commissionRate}%</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-4">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 text-xs"
          onClick={() => openDetail(emp.id, 'schedule')}
        >
          <Calendar className="h-3.5 w-3.5 me-1.5" />
          {locale === 'ar' ? 'الجدول' : 'Schedule'}
        </Button>
        <Button
          variant="default"
          size="sm"
          className="flex-1 text-xs bg-emerald-600 hover:bg-emerald-700"
          onClick={() => openDetail(emp.id, 'profile')}
        >
          <Eye className="h-3.5 w-3.5 me-1.5" />
          {locale === 'ar' ? 'الملف الشخصي' : 'Profile'}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="text-xs px-2">
              <MoreHorizontal className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => openEdit(emp.id)}>
              <Pencil className="h-4 w-4 me-2" />
              {locale === 'ar' ? 'تعديل' : 'Edit'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600 focus:text-red-600"
              onClick={() => openDelete(emp.id)}
            >
              <Trash2 className="h-4 w-4 me-2" />
              {locale === 'ar' ? 'حذف' : 'Delete'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.div>
  )

  // ─── Main Render ───────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Briefcase className="h-7 w-7 text-emerald-600" />
            {locale === 'ar' ? 'الموظفون' : 'Employees'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {total > 0
              ? locale === 'ar'
                ? `${total} موظف مسجل`
                : `${total} registered employees`
              : locale === 'ar'
                ? 'لا يوجد موظفون بعد'
                : 'No employees yet'}
          </p>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md"
        >
          <Plus className="h-4 w-4 me-2" />
          {locale === 'ar' ? 'موظف جديد' : 'New Employee'}
        </Button>
      </motion.div>

      {/* ── Branch Filter ── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="flex items-center gap-3"
      >
        <MapPin className="h-4 w-4 text-muted-foreground" />
        <Select
          value={branchFilter}
          onValueChange={(v) => setBranchFilter(v === '__all__' ? '' : v)}
        >
          <SelectTrigger className="w-64">
            <SelectValue
              placeholder={locale === 'ar' ? 'جميع الفروع' : 'All Branches'}
            />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">
              {locale === 'ar' ? 'جميع الفروع' : 'All Branches'}
            </SelectItem>
            {branches.map((b) => (
              <SelectItem key={b.id} value={b.id}>
                {b.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {branchFilter && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setBranchFilter('')}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </motion.div>

      {/* ── Search Bar ── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.06 }}
        className="flex gap-2"
      >
        <div className="relative flex-1 max-w-md">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={locale === 'ar' ? 'البحث بالاسم، البريد، أو الهاتف...' : 'Search by name, email, or phone...'}
            className="ps-10"
          />
        </div>
        {search && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setSearch('')
              setSearchInput('')
              setPage(1)
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </motion.div>

      {/* ── Content ── */}
      {employeesLoading ? (
        <CardsSkeleton />
      ) : employees.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          <div className="rounded-full bg-emerald-50 dark:bg-emerald-900/30 p-4 mb-4">
            <Inbox className="h-10 w-10 text-emerald-400" />
          </div>
          <h3 className="text-lg font-semibold">
            {locale === 'ar' ? 'لا يوجد موظفون' : 'No employees found'}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {branchFilter
              ? locale === 'ar'
                ? 'لا يوجد موظفون في هذا الفرع.'
                : 'No employees in this branch.'
              : locale === 'ar'
                ? 'ابدأ بإضافة موظفك الأول.'
                : 'Add your first employee to get started.'}
          </p>
          {!branchFilter && (
            <Button
              onClick={() => setCreateOpen(true)}
              className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Plus className="h-4 w-4 me-2" />
              {locale === 'ar' ? 'موظف جديد' : 'New Employee'}
            </Button>
          )}
        </motion.div>
      ) : (
        <>
          {/* ── Employee Cards Grid ── */}
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            <AnimatePresence>
              {employees.map((emp) => (
                <EmployeeCard key={emp.id} emp={emp} />
              ))}
            </AnimatePresence>
          </motion.div>

          {/* ── Pagination ── */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border px-4 py-3 bg-muted/30 rounded-lg">
              <p className="text-sm text-muted-foreground">
                {locale === 'ar'
                  ? `صفحة ${page} من ${totalPages} (${total} موظف)`
                  : `Page ${page} of ${totalPages} (${total} employees)`}
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  {locale === 'ar' ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                </Button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const start = Math.max(1, Math.min(page - 2, totalPages - 4))
                  const p = start + i
                  if (p > totalPages) return null
                  return (
                    <Button
                      key={p}
                      variant={p === page ? 'default' : 'outline'}
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setPage(p)}
                    >
                      {p}
                    </Button>
                  )
                })}
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  {locale === 'ar' ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          NEW EMPLOYEE DIALOG
         ════════════════════════════════════════════════════════════════════ */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-emerald-600" />
              {locale === 'ar' ? 'موظف جديد' : 'New Employee'}
            </DialogTitle>
            <DialogDescription>
              {locale === 'ar'
                ? 'أدخل بيانات الموظف الجديد'
                : 'Enter the new employee details'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">
                {locale === 'ar' ? 'الاسم' : 'Name'} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                required
                placeholder={locale === 'ar' ? 'أحمد محمد' : 'John Smith'}
              />
            </div>

            {/* Email & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">
                  <Mail className="h-3.5 w-3.5 inline me-1.5" />
                  {locale === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  dir="ltr"
                  placeholder="employee@email.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">
                  <Phone className="h-3.5 w-3.5 inline me-1.5" />
                  {locale === 'ar' ? 'الهاتف' : 'Phone'}
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  dir="ltr"
                  placeholder="+966 5X XXX XXXX"
                />
              </div>
            </div>

            {/* Specialization & Branch */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="specialization">
                  <Briefcase className="h-3.5 w-3.5 inline me-1.5" />
                  {locale === 'ar' ? 'التخصص' : 'Specialization'}
                </Label>
                <Input
                  id="specialization"
                  name="specialization"
                  placeholder={locale === 'ar' ? 'حلاق، مصفف شعر...' : 'Barber, Hair Stylist...'}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="branchId">
                  <MapPin className="h-3.5 w-3.5 inline me-1.5" />
                  {locale === 'ar' ? 'الفرع' : 'Branch'} <span className="text-red-500">*</span>
                </Label>
                <Select name="branchId" required>
                  <SelectTrigger>
                    <SelectValue placeholder={locale === 'ar' ? 'اختر الفرع' : 'Select branch'} />
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
            </div>

            {/* Commission Rate */}
            <div className="space-y-2">
              <Label htmlFor="commissionRate">
                <Percent className="h-3.5 w-3.5 inline me-1.5" />
                {locale === 'ar' ? 'نسبة العمولة' : 'Commission Rate'}
              </Label>
              <Input
                id="commissionRate"
                name="commissionRate"
                type="number"
                min="0"
                max="100"
                step="0.5"
                dir="ltr"
                defaultValue="0"
                placeholder="0"
              />
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <Label htmlFor="bio">
                {locale === 'ar' ? 'نبذة عن الموظف' : 'Bio'}
              </Label>
              <Textarea
                id="bio"
                name="bio"
                rows={3}
                placeholder={locale === 'ar' ? 'نبذة مختصرة عن خبرات الموظف...' : 'A brief description of the employee experience...'}
              />
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateOpen(false)}
              >
                {locale === 'ar' ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {createMutation.isPending ? (
                  <Loader2 className="h-4 w-4 me-2 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 me-2" />
                )}
                {locale === 'ar' ? 'إضافة موظف' : 'Add Employee'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ════════════════════════════════════════════════════════════════════
          EDIT EMPLOYEE DIALOG
         ════════════════════════════════════════════════════════════════════ */}
      <Dialog open={editOpen} onOpenChange={(v) => { setEditOpen(v); if (!v) setEditId(null) }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5 text-emerald-600" />
              {locale === 'ar' ? 'تعديل الموظف' : 'Edit Employee'}
            </DialogTitle>
            <DialogDescription>
              {locale === 'ar'
                ? 'تحديث بيانات الموظف'
                : 'Update employee information'}
            </DialogDescription>
          </DialogHeader>
          {editId && (() => {
            const employee = employees.find(e => e.id === editId)
            if (!employee) return null
            return (
              <form onSubmit={handleEdit} className="space-y-4">
                {/* Name */}
                <div className="space-y-2">
                  <Label htmlFor="editName">
                    {locale === 'ar' ? 'الاسم' : 'Name'} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="editName"
                    name="editName"
                    required
                    defaultValue={employee.name}
                    placeholder={locale === 'ar' ? 'أحمد محمد' : 'John Smith'}
                  />
                </div>

                {/* Email & Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="editEmail">
                      <Mail className="h-3.5 w-3.5 inline me-1.5" />
                      {locale === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                    </Label>
                    <Input
                      id="editEmail"
                      name="editEmail"
                      type="email"
                      dir="ltr"
                      defaultValue={employee.email ?? ''}
                      placeholder="employee@email.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editPhone">
                      <Phone className="h-3.5 w-3.5 inline me-1.5" />
                      {locale === 'ar' ? 'الهاتف' : 'Phone'}
                    </Label>
                    <Input
                      id="editPhone"
                      name="editPhone"
                      type="tel"
                      dir="ltr"
                      defaultValue={employee.phone ?? ''}
                      placeholder="+966 5X XXX XXXX"
                    />
                  </div>
                </div>

                {/* Specialization & Branch */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="editSpecialization">
                      <Briefcase className="h-3.5 w-3.5 inline me-1.5" />
                      {locale === 'ar' ? 'التخصص' : 'Specialization'}
                    </Label>
                    <Input
                      id="editSpecialization"
                      name="editSpecialization"
                      defaultValue={employee.specialization ?? ''}
                      placeholder={locale === 'ar' ? 'حلاق، مصفف شعر...' : 'Barber, Hair Stylist...'}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editBranchId">
                      <MapPin className="h-3.5 w-3.5 inline me-1.5" />
                      {locale === 'ar' ? 'الفرع' : 'Branch'} <span className="text-red-500">*</span>
                    </Label>
                    <Select name="editBranchId" defaultValue={employee.branchId}>
                      <SelectTrigger>
                        <SelectValue placeholder={locale === 'ar' ? 'اختر الفرع' : 'Select branch'} />
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
                </div>

                {/* Commission Rate */}
                <div className="space-y-2">
                  <Label htmlFor="editCommissionRate">
                    <Percent className="h-3.5 w-3.5 inline me-1.5" />
                    {locale === 'ar' ? 'نسبة العمولة' : 'Commission Rate'}
                  </Label>
                  <Input
                    id="editCommissionRate"
                    name="editCommissionRate"
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    dir="ltr"
                    defaultValue={employee.commissionRate}
                    placeholder="0"
                  />
                </div>

                {/* Bio */}
                <div className="space-y-2">
                  <Label htmlFor="editBio">
                    {locale === 'ar' ? 'نبذة عن الموظف' : 'Bio'}
                  </Label>
                  <Textarea
                    id="editBio"
                    name="editBio"
                    rows={3}
                    defaultValue={employee.bio ?? ''}
                    placeholder={locale === 'ar' ? 'نبذة مختصرة عن خبرات الموظف...' : 'A brief description of the employee experience...'}
                  />
                </div>

                {/* Active Toggle */}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="editIsActive"
                    name="editIsActive"
                    defaultChecked={employee.isActive}
                    className="hidden"
                  />
                  <Switch
                    checked={employee.isActive}
                    onCheckedChange={(checked) => {
                      const input = document.querySelector('#editIsActive') as HTMLInputElement
                      if (input) input.checked = checked
                    }}
                  />
                  <Label htmlFor="editIsActive" className="cursor-pointer">
                    {locale === 'ar' ? 'موظف نشط' : 'Active Employee'}
                  </Label>
                </div>

                <DialogFooter className="gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditOpen(false)}
                  >
                    {locale === 'ar' ? 'إلغاء' : 'Cancel'}
                  </Button>
                  <Button
                    type="submit"
                    disabled={editMutation.isPending}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {editMutation.isPending ? (
                      <Loader2 className="h-4 w-4 me-2 animate-spin" />
                    ) : (
                      <Pencil className="h-4 w-4 me-2" />
                    )}
                    {locale === 'ar' ? 'حفظ التغييرات' : 'Save Changes'}
                  </Button>
                </DialogFooter>
              </form>
            )
          })()}
        </DialogContent>
      </Dialog>

      {/* ════════════════════════════════════════════════════════════════════
          EMPLOYEE DETAIL DIALOG
         ════════════════════════════════════════════════════════════════════ */}
      <Dialog open={detailOpen} onOpenChange={(open) => {
        setDetailOpen(open)
        if (!open) setDetailId(null)
      }}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          {detailLoading || !detailEmployee ? (
            <div className="flex-1 p-6 space-y-4">
              <div className="flex gap-4">
                <Skeleton className="h-16 w-16 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-4 w-48" />
                </div>
              </div>
              <Skeleton className="h-40 w-full rounded-lg" />
              <Skeleton className="h-32 w-full rounded-lg" />
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white ${getAvatarColor(detailEmployee.name)}`}
                  >
                    {getInitials(detailEmployee.name)}
                  </div>
                  {detailEmployee.name}
                  <Badge
                    variant={detailEmployee.isActive ? 'default' : 'secondary'}
                    className={
                      detailEmployee.isActive
                        ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-400 dark:border-emerald-800'
                        : ''
                    }
                  >
                    {detailEmployee.isActive
                      ? locale === 'ar'
                        ? 'نشط'
                        : 'Active'
                      : locale === 'ar'
                        ? 'غير نشط'
                        : 'Inactive'}
                  </Badge>
                </DialogTitle>
                <DialogDescription>
                  {detailEmployee.specialization ||
                    (locale === 'ar' ? 'موظف' : 'Employee')}
                  {' · '}
                  {detailEmployee.branch?.name}
                </DialogDescription>
              </DialogHeader>

              <ScrollArea className="flex-1 -mx-6 px-6">
                <Tabs value={detailTab} onValueChange={setDetailTab} dir={locale === 'ar' ? 'rtl' : 'ltr'}>
                  <TabsList className="mb-4">
                    <TabsTrigger value="profile">
                      <User className="h-4 w-4 me-1.5" />
                      {locale === 'ar' ? 'الملف الشخصي' : 'Profile'}
                    </TabsTrigger>
                    <TabsTrigger value="schedule">
                      <Calendar className="h-4 w-4 me-1.5" />
                      {locale === 'ar' ? 'الجدول الأسبوعي' : 'Schedule'}
                    </TabsTrigger>
                    <TabsTrigger value="today">
                      <Clock className="h-4 w-4 me-1.5" />
                      {locale === 'ar' ? 'حجوزات اليوم' : "Today's Bookings"}
                    </TabsTrigger>
                    <TabsTrigger value="performance">
                      <BarChart3 className="h-4 w-4 me-1.5" />
                      {locale === 'ar' ? 'الأداء' : 'Performance'}
                    </TabsTrigger>
                  </TabsList>

                  {/* ── Profile Tab ── */}
                  <TabsContent value="profile" className="space-y-4">
                    {/* Profile Card */}
                    <div className="flex items-start gap-4 p-4 rounded-xl bg-muted/40 border border-border">
                      <div
                        className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-full text-2xl font-bold text-white ${getAvatarColor(detailEmployee.name)}`}
                      >
                        {getInitials(detailEmployee.name)}
                      </div>
                      <div className="flex-1 min-w-0 space-y-3">
                        <div>
                          <h3 className="text-xl font-bold">{detailEmployee.name}</h3>
                          {detailEmployee.specialization && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                              <Briefcase className="h-3.5 w-3.5" />
                              {detailEmployee.specialization}
                            </p>
                          )}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-sm">
                          {detailEmployee.email && (
                            <p className="flex items-center gap-2 text-muted-foreground">
                              <Mail className="h-3.5 w-3.5 shrink-0" />
                              <span dir="ltr">{detailEmployee.email}</span>
                            </p>
                          )}
                          {detailEmployee.phone && (
                            <p className="flex items-center gap-2 text-muted-foreground">
                              <Phone className="h-3.5 w-3.5 shrink-0" />
                              <span dir="ltr">{detailEmployee.phone}</span>
                            </p>
                          )}
                          <p className="flex items-center gap-2 text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5 shrink-0" />
                            {detailEmployee.branch?.name}
                          </p>
                          <p className="flex items-center gap-2 text-muted-foreground">
                            <Percent className="h-3.5 w-3.5 shrink-0" />
                            {locale === 'ar' ? 'عمولة' : 'Commission'}: {detailEmployee.commissionRate}%
                          </p>
                        </div>
                        {detailEmployee.bio && (
                          <p className="text-sm text-muted-foreground border-t border-border pt-2">
                            {detailEmployee.bio}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Active Leaves */}
                    {detailEmployee.leaves && detailEmployee.leaves.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                          <CalendarOff className="h-4 w-4 text-amber-500" />
                          {locale === 'ar' ? 'الإجازات النشطة' : 'Active Leaves'}
                        </h4>
                        <div className="space-y-2">
                          {detailEmployee.leaves.map((leave) => (
                            <div
                              key={leave.id}
                              className="flex items-center gap-3 p-3 rounded-lg border border-amber-200 bg-amber-50/50"
                            >
                              <CalendarOff className="h-4 w-4 text-amber-500 shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium">
                                  {formatDate(leave.startDate, locale)} — {formatDate(leave.endDate, locale)}
                                </p>
                                {leave.reason && (
                                  <p className="text-xs text-muted-foreground">{leave.reason}</p>
                                )}
                              </div>
                              <Badge
                                variant="outline"
                                className={
                                  leave.status === 'approved'
                                    ? 'border-emerald-300 text-emerald-700 bg-emerald-50'
                                    : leave.status === 'rejected'
                                      ? 'border-red-300 text-red-700 bg-red-50'
                                      : 'border-amber-300 text-amber-700 bg-amber-50'
                                }
                              >
                                {leave.status === 'approved'
                                  ? locale === 'ar' ? 'موافق' : 'Approved'
                                  : leave.status === 'rejected'
                                    ? locale === 'ar' ? 'مرفوض' : 'Rejected'
                                    : locale === 'ar' ? 'معلق' : 'Pending'}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Services */}
                    {detailEmployee.services && detailEmployee.services.filter((s) => s.canPerform).length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                          <Scissors className="h-4 w-4 text-emerald-500" />
                          {locale === 'ar' ? 'الخدمات المتاحة' : 'Available Services'}
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {detailEmployee.services
                            .filter((s) => s.canPerform)
                            .map((es) => (
                              <Badge
                                key={es.id}
                                variant="outline"
                                className="border-emerald-200 text-emerald-700 bg-emerald-50/50 py-1 px-3"
                              >
                                <Scissors className="h-3 w-3 me-1" />
                                {es.service.name}
                                <span className="ms-2 text-muted-foreground">
                                  {formatCurrency(es.service.price, 'SAR', locale)}
                                </span>
                              </Badge>
                            ))}
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  {/* ── Schedule Tab ── */}
                  <TabsContent value="schedule">
                    <div className="rounded-xl border border-border overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50 hover:bg-muted/50">
                            <TableHead>{locale === 'ar' ? 'اليوم' : 'Day'}</TableHead>
                            <TableHead>{locale === 'ar' ? 'الحالة' : 'Status'}</TableHead>
                            <TableHead>{locale === 'ar' ? 'ساعات العمل' : 'Working Hours'}</TableHead>
                            <TableHead>{locale === 'ar' ? 'الاستراحة' : 'Break'}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {Array.from({ length: 7 }).map((_, dayIdx) => {
                            const schedule = detailEmployee.schedules?.find(
                              (s) => s.dayOfWeek === dayIdx,
                            )
                            const isWorking = schedule?.isWorking ?? false
                            return (
                              <TableRow key={dayIdx}>
                                <TableCell className="font-medium">
                                  {getDayName(dayIdx)}
                                </TableCell>
                                <TableCell>
                                  {isWorking ? (
                                    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-400 dark:border-emerald-800 text-xs">
                                      {locale === 'ar' ? 'يعمل' : 'Working'}
                                    </Badge>
                                  ) : (
                                    <Badge variant="secondary" className="text-xs">
                                      {locale === 'ar' ? 'إجازة' : 'Off'}
                                    </Badge>
                                  )}
                                </TableCell>
                                <TableCell className="text-sm" dir="ltr">
                                  {isWorking && schedule?.startTime
                                    ? `${formatTime(schedule.startTime)} - ${formatTime(schedule.endTime)}`
                                    : '—'}
                                </TableCell>
                                <TableCell className="text-sm" dir="ltr">
                                  {isWorking && schedule?.breakStart ? (
                                    <span className="flex items-center gap-1">
                                      <Coffee className="h-3 w-3" />
                                      {formatTime(schedule.breakStart)} - {formatTime(schedule.breakEnd ?? '')}
                                    </span>
                                  ) : (
                                    '—'
                                  )}
                                </TableCell>
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </TabsContent>

                  {/* ── Today's Bookings Tab ── */}
                  <TabsContent value="today">
                    {todayBookings.length > 0 ? (
                      <div className="space-y-2">
                        {todayBookings.map((b) => (
                          <motion.div
                            key={b.id}
                            initial={{ opacity: 0, x: locale === 'ar' ? 12 : -12 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors"
                          >
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                              <Clock className="h-5 w-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium">
                                {b.services?.map((s) => s.service.name).join(', ') ||
                                  (locale === 'ar' ? 'حجز' : 'Booking')}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {b.customer
                                  ? `${b.customer.firstName} ${b.customer.lastName}`
                                  : '—'}
                                {b.customer?.phone && (
                                  <span dir="ltr" className="ms-2">({b.customer.phone})</span>
                                )}
                              </p>
                            </div>
                            <div className="text-end shrink-0">
                              <p className="text-sm font-medium" dir="ltr">
                                {b.startTime} - {b.endTime}
                              </p>
                              <p className="text-xs font-semibold text-emerald-600">
                                {formatCurrency(b.totalPrice, 'SAR', locale)}
                              </p>
                            </div>
                            <Badge
                              variant="outline"
                              className={
                                b.status === 'completed'
                                  ? 'border-emerald-300 text-emerald-700 bg-emerald-50'
                                  : b.status === 'in_progress'
                                    ? 'border-blue-300 text-blue-700 bg-blue-50'
                                    : b.status === 'cancelled'
                                      ? 'border-red-300 text-red-700 bg-red-50'
                                      : 'border-amber-300 text-amber-700 bg-amber-50'
                              }
                            >
                              {b.status === 'completed'
                                ? locale === 'ar' ? 'مكتمل' : 'Completed'
                                : b.status === 'in_progress'
                                  ? locale === 'ar' ? 'جاري' : 'In Progress'
                                  : b.status === 'cancelled'
                                    ? locale === 'ar' ? 'ملغي' : 'Cancelled'
                                    : b.status === 'confirmed'
                                      ? locale === 'ar' ? 'مؤكد' : 'Confirmed'
                                      : locale === 'ar' ? 'معلق' : 'Pending'}
                            </Badge>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-muted-foreground">
                        <Calendar className="h-10 w-10 mx-auto mb-3 opacity-30" />
                        <p className="font-medium">
                          {locale === 'ar' ? 'لا توجد حجوزات اليوم' : 'No bookings today'}
                        </p>
                        <p className="text-sm mt-1">
                          {locale === 'ar'
                            ? 'يوم فارغ لهذا الموظف'
                            : 'This employee has a free day'}
                        </p>
                      </div>
                    )}
                  </TabsContent>

                  {/* ── Performance Tab ── */}
                  <TabsContent value="performance" className="space-y-4">
                    {/* Performance Stats Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <Card className="p-4 text-center">
                        <div className="flex items-center justify-center mb-2">
                          <div className="rounded-full bg-emerald-50 dark:bg-emerald-900/30 p-2">
                            <BadgeCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                          </div>
                        </div>
                        <p className="text-2xl font-bold text-emerald-600">
                          {performance.totalCompleted}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {locale === 'ar' ? 'حجوزات مكتملة' : 'Completed'}
                        </p>
                      </Card>
                      <Card className="p-4 text-center">
                        <div className="flex items-center justify-center mb-2">
                          <div className="rounded-full bg-emerald-50 dark:bg-emerald-900/30 p-2">
                            <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                          </div>
                        </div>
                        <p className="text-2xl font-bold text-emerald-600">
                          {formatCurrency(performance.totalRevenue, 'SAR', locale)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {locale === 'ar' ? 'إجمالي الإيرادات' : 'Total Revenue'}
                        </p>
                      </Card>
                      <Card className="p-4 text-center">
                        <div className="flex items-center justify-center mb-2">
                          <div className="rounded-full bg-amber-50 p-2">
                            <TrendingUp className="h-5 w-5 text-amber-600" />
                          </div>
                        </div>
                        <p className="text-2xl font-bold text-amber-600">
                          {performance.monthBookings}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {locale === 'ar' ? 'حجوزات الشهر' : 'This Month'}
                        </p>
                      </Card>
                      <Card className="p-4 text-center">
                        <div className="flex items-center justify-center mb-2">
                          <div className="rounded-full bg-cyan-50 p-2">
                            <Star className="h-5 w-5 text-cyan-600" />
                          </div>
                        </div>
                        <p className="text-2xl font-bold text-cyan-600">
                          {performance.avgRating > 0 ? performance.avgRating.toFixed(1) : '—'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {locale === 'ar' ? 'متوسط التقييم' : 'Avg Rating'}
                        </p>
                      </Card>
                    </div>

                    {/* Monthly Revenue Breakdown */}
                    <Card className="p-4">
                      <h4 className="text-sm font-semibold mb-3 flex items-center gap-1.5">
                        <BarChart3 className="h-4 w-4 text-emerald-600" />
                        {locale === 'ar' ? 'ملخص الشهر الحالي' : 'Current Month Summary'}
                      </h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">
                            {locale === 'ar' ? 'حجوزات الشهر' : 'Monthly Bookings'}
                          </span>
                          <span className="text-sm font-bold">{performance.monthBookings}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">
                            {locale === 'ar' ? 'إيرادات الشهر' : 'Monthly Revenue'}
                          </span>
                          <span className="text-sm font-bold text-emerald-600">
                            {formatCurrency(performance.monthRevenue, 'SAR', locale)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">
                            {locale === 'ar' ? 'نسبة العمولة' : 'Commission Rate'}
                          </span>
                          <span className="text-sm font-bold">
                            {detailEmployee.commissionRate}%
                          </span>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold">
                            {locale === 'ar' ? 'العمولة المستحقة (الشهر)' : 'Est. Commission (Month)'}
                          </span>
                          <span className="text-base font-bold text-emerald-600">
                            {formatCurrency(
                              (performance.monthRevenue * detailEmployee.commissionRate) / 100,
                              'SAR',
                              locale,
                            )}
                          </span>
                        </div>
                        {/* Visual progress bar */}
                        <div>
                          <div className="flex justify-between text-xs text-muted-foreground mb-1">
                            <span>{locale === 'ar' ? 'حصة الموظف' : 'Employee Share'}</span>
                            <span>{detailEmployee.commissionRate}%</span>
                          </div>
                          <Progress value={detailEmployee.commissionRate} className="h-2" />
                        </div>
                      </div>
                    </Card>
                  </TabsContent>
                </Tabs>
              </ScrollArea>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ════════════════════════════════════════════════════════════════════
          DELETE CONFIRMATION DIALOG
         ════════════════════════════════════════════════════════════════════ */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {locale === 'ar' ? 'هل أنت متأكد من حذف هذا الموظف؟' : 'Are you sure you want to delete this employee?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {locale === 'ar'
                ? 'سيتم حذف الموظف نهائياً. هذا الإجراء لا يمكن التراجع عنه.'
                : 'The employee will be permanently deleted. This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>
              {locale === 'ar' ? 'إلغاء' : 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              disabled={deleteMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
              {locale === 'ar' ? 'حذف' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}