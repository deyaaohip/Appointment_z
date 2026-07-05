'use client'

import { authFetch } from '@/lib/auth-fetch'


import { useState, useMemo, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Search,
  Eye,
  MoreHorizontal,
  Trash2,
  X,
  Loader2,
  Inbox,
  ChevronLeft,
  ChevronRight,
  User,
  Phone,
  Mail,
  Star,
  ShieldBan,
  MessageSquare,
  StickyNote,
  Calendar,
  CreditCard,
  Users,
  Award,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Label } from '@/components/ui/label'

// ─── Types ──────────────────────────────────────────────────────────────────

type MembershipTier = 'regular' | 'silver' | 'gold' | 'platinum' | 'diamond'
type Gender = 'male' | 'female' | 'other'

interface CustomerRow {
  id: string
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  avatar: string | null
  gender: Gender | null
  membershipTier: MembershipTier
  loyaltyPoints: number
  isActive: boolean
  isBlacklisted?: boolean
  source: string
  createdAt: string
  _count: { bookings: number; payments: number }
  totalSpent: number
  lastVisit: string | null
  tags?: string
}

interface CustomerDetail extends CustomerRow {
  dateOfBirth: string | null
  address: string | null
  city: string | null
  country: string | null
  notes: string | null
  portalAccess: boolean
  bookings: CustomerBooking[]
  payments: CustomerPayment[]
  customerNotes?: CustomerNote[]
}

interface CustomerBooking {
  id: string
  startDate: string
  startTime: string
  status: string
  totalPrice: number
  branch?: { id: string; name: string }
  employee?: { id: string; name: string; avatar: string | null } | null
  services?: { id: string; service: { id: string; name: string; price: number } }[]
}

interface CustomerPayment {
  id: string
  amount: number
  method: string
  status: string
  currency: string
  createdAt: string
  transactionId: string | null
}

interface CustomerNote {
  id: string
  content: string
  createdBy: string
  createdAt: string
}

// ─── Constants ──────────────────────────────────────────────────────────────

const PAGE_SIZE = 10

const membershipColors: Record<MembershipTier, string> = {
  regular: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700',
  silver: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  gold: 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
  platinum: 'bg-cyan-50 text-cyan-700 border-cyan-300 dark:bg-cyan-900/30 dark:text-cyan-400 dark:border-cyan-800',
  diamond: 'bg-violet-50 text-violet-700 border-violet-300 dark:bg-violet-900/30 dark:text-violet-400 dark:border-violet-800',
}

const membershipLabels: Record<MembershipTier, string> = {
  regular: 'عادي',
  silver: 'فضي',
  gold: 'ذهبي',
  platinum: 'بلاتيني',
  diamond: 'ألماسي',
}

const fadeVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
}

const staggerContainer = {
  visible: { transition: { staggerChildren: 0.04 } },
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function CustomersView() {
  const { locale } = useAppStore()
  const isMobile = useIsMobile()
  const queryClient = useQueryClient()

  // ── State ──
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [noteInput, setNoteInput] = useState('')
  const [noteSaving, setNoteSaving] = useState(false)

  // ── Queries ──
  const { data: customersData, isLoading: customersLoading } = useQuery({
    queryKey: ['customers', page, search],
    queryFn: () =>
      authFetch(`/api/customers?page=${page}&limit=${PAGE_SIZE}${search ? `&search=${encodeURIComponent(search)}` : ''}`)
        .then((r) => r.json()),
  })

  const { data: detailData, isLoading: detailLoading } = useQuery({
    queryKey: ['customer-detail', detailId],
    queryFn: () => authFetch(`/api/customers/${detailId}`).then((r) => r.json()),
    enabled: !!detailId && detailOpen,
  })

  const customers: CustomerRow[] = customersData?.customers ?? []
  const total = customersData?.total ?? 0
  const totalPages = customersData?.totalPages ?? 1

  const detail: CustomerDetail | null = detailData?.customer ?? null
  const stats = detailData?.stats ?? { totalSpent: 0, totalBookings: 0, lastVisit: null }

  // ── Mutations ──
  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      authFetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: (data) => {
      if (data.error) {
        toast({ title: locale === 'ar' ? 'خطأ' : 'Error', description: data.error, variant: 'destructive' })
        return
      }
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      setCreateOpen(false)
      toast({
        title: locale === 'ar' ? 'تم بنجاح' : 'Success',
        description: locale === 'ar' ? 'تم إضافة العميل بنجاح' : 'Customer created successfully',
      })
    },
    onError: () => {
      toast({
        title: locale === 'ar' ? 'خطأ' : 'Error',
        description: locale === 'ar' ? 'حدث خطأ أثناء إضافة العميل' : 'Failed to create customer',
        variant: 'destructive',
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      authFetch(`/api/customers/${id}`, { method: 'DELETE' }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      setDeleteOpen(false)
      setDeleteId(null)
      toast({
        title: locale === 'ar' ? 'تم بنجاح' : 'Success',
        description: locale === 'ar' ? 'تم حذف العميل بنجاح' : 'Customer deactivated successfully',
      })
    },
    onError: () => {
      toast({
        title: locale === 'ar' ? 'خطأ' : 'Error',
        description: locale === 'ar' ? 'حدث خطأ أثناء حذف العميل' : 'Failed to delete customer',
        variant: 'destructive',
      })
    },
  })

  const editMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      authFetch(`/api/customers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      queryClient.invalidateQueries({ queryKey: ['customer-detail'] })
      setEditOpen(false)
      setEditId(null)
      toast({
        title: locale === 'ar' ? 'تم بنجاح' : 'Success',
        description: locale === 'ar' ? 'تم تحديث العميل بنجاح' : 'Customer updated successfully',
      })
    },
    onError: () => {
      toast({
        title: locale === 'ar' ? 'خطأ' : 'Error',
        description: locale === 'ar' ? 'حدث خطأ أثناء تحديث العميل' : 'Failed to update customer',
        variant: 'destructive',
      })
    },
  })

  const openEdit = useCallback((id: string) => {
    setEditId(id)
    setEditOpen(true)
  }, [])

  // ── Handlers ──
  const handleSearch = useCallback(() => {
    setSearch(searchInput)
    setPage(1)
  }, [searchInput])

  const handleSearchKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') handleSearch()
    },
    [handleSearch],
  )

  const openDetail = useCallback((id: string) => {
    setDetailId(id)
    setDetailOpen(true)
    setNoteInput('')
  }, [])

  const openDelete = useCallback((id: string) => {
    setDeleteId(id)
    setDeleteOpen(true)
  }, [])

  const handleCreate = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      const form = e.currentTarget
      const data = {
        firstName: (form.elements.namedItem('firstName') as HTMLInputElement).value,
        lastName: (form.elements.namedItem('lastName') as HTMLInputElement).value,
        email: (form.elements.namedItem('email') as HTMLInputElement).value,
        phone: (form.elements.namedItem('phone') as HTMLInputElement).value,
        gender: (form.elements.namedItem('gender') as HTMLSelectElement).value || undefined,
        dateOfBirth: (form.elements.namedItem('dateOfBirth') as HTMLInputElement).value || undefined,
        notes: (form.elements.namedItem('notes') as HTMLTextAreaElement).value || undefined,
        tags: ((form.elements.namedItem('tags') as HTMLInputElement).value || '')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      }
      createMutation.mutate(data)
    },
    [createMutation, locale],
  )

  const handleEdit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      if (!editId) return
      const form = e.currentTarget
      const data: Record<string, unknown> = {}
      const firstName = (form.elements.namedItem('editFirstName') as HTMLInputElement)?.value
      const lastName = (form.elements.namedItem('editLastName') as HTMLInputElement)?.value
      const email = (form.elements.namedItem('editEmail') as HTMLInputElement)?.value
      const phone = (form.elements.namedItem('editPhone') as HTMLInputElement)?.value
      const gender = (form.elements.namedItem('editGender') as HTMLSelectElement)?.value
      const notes = (form.elements.namedItem('editNotes') as HTMLTextAreaElement)?.value
      const membershipTier = (form.elements.namedItem('editMembershipTier') as HTMLSelectElement)?.value
      if (firstName) data.firstName = firstName
      if (lastName) data.lastName = lastName
      if (email !== undefined) data.email = email || null
      if (phone !== undefined) data.phone = phone || null
      if (gender) data.gender = gender
      if (notes !== undefined) data.notes = notes || null
      if (membershipTier) data.membershipTier = membershipTier
      editMutation.mutate({ id: editId, data })
    },
    [editId, editMutation],
  )

  const handleAddNote = useCallback(async () => {
    if (!noteInput.trim() || !detailId) return
    setNoteSaving(true)
    try {
      const res = await authFetch(`/api/customers/${detailId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes: detail?.notes ? `${detail.notes}\n[${new Date().toISOString().slice(0, 10)}] ${noteInput.trim()}` : noteInput.trim(),
        }),
      })
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: ['customer-detail', detailId] })
        setNoteInput('')
        toast({
          title: locale === 'ar' ? 'تم بنجاح' : 'Success',
          description: locale === 'ar' ? 'تم إضافة الملاحظة' : 'Note added',
        })
      }
    } catch {
      toast({ title: locale === 'ar' ? 'خطأ' : 'Error', variant: 'destructive' })
    } finally {
      setNoteSaving(false)
    }
  }, [noteInput, detailId, detail?.notes, locale, queryClient])

  // ── Render helpers ──
  const getInitials = (first: string, last: string) =>
    `${first.charAt(0)}${last.charAt(0)}`.toUpperCase()

  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-emerald-500',
      'bg-teal-500',
      'bg-cyan-500',
      'bg-sky-500',
      'bg-violet-500',
      'bg-rose-500',
      'bg-amber-500',
      'bg-lime-500',
    ]
    let hash = 0
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
    return colors[Math.abs(hash) % colors.length]
  }

  const formatTags = (tagsStr?: string): string[] => {
    if (!tagsStr) return []
    try {
      return JSON.parse(tagsStr)
    } catch {
      return []
    }
  }

  // ─── Skeleton ──────────────────────────────────────────────────────────

  const TableSkeleton = () => (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4">
          <Skeleton className="h-9 w-9 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-6 w-16" />
        </div>
      ))}
    </div>
  )

  const CardSkeleton = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-36 rounded-xl" />
      ))}
    </div>
  )

  // ─── Mobile Card ───────────────────────────────────────────────────────

  const CustomerCard = ({ c }: { c: CustomerRow }) => (
    <motion.div
      variants={fadeVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="rounded-xl border border-border bg-card p-4 shadow-sm"
    >
      <div className="flex items-start gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${getAvatarColor(c.firstName + c.lastName)}`}>
          {getInitials(c.firstName, c.lastName)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm truncate">{c.firstName} {c.lastName}</span>
            {c.isBlacklisted && (
              <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                <ShieldBan className="h-3 w-3 ms-1" />
                {locale === 'ar' ? 'محظور' : 'Blacklisted'}
              </Badge>
            )}
            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${membershipColors[c.membershipTier]}`}>
              {membershipLabels[c.membershipTier]}
            </Badge>
          </div>
          {c.email && (
            <p className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-1">
              <Mail className="h-3 w-3 shrink-0" />
              {c.email}
            </p>
          )}
          {c.phone && (
            <p className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-0.5">
              <Phone className="h-3 w-3 shrink-0" />
              {c.phone}
            </p>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align={locale === 'ar' ? 'start' : 'end'}>
            <DropdownMenuItem onClick={() => openDetail(c.id)}>
              <Eye className="h-4 w-4 me-2" />
              {locale === 'ar' ? 'عرض التفاصيل' : 'View Details'}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => openEdit(c.id)}>
              <User className="h-4 w-4 me-2" />
              {locale === 'ar' ? 'تعديل' : 'Edit'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600 focus:text-red-600"
              onClick={() => openDelete(c.id)}
            >
              <Trash2 className="h-4 w-4 me-2" />
              {locale === 'ar' ? 'حذف' : 'Delete'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Star className="h-3 w-3 text-amber-500" />
            {c.loyaltyPoints}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {c._count.bookings}
          </span>
        </div>
        <span className="text-xs font-semibold text-emerald-600">
          {formatCurrency(c.totalSpent, 'SAR', locale)}
        </span>
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
            <Users className="h-7 w-7 text-emerald-600" />
            {locale === 'ar' ? 'العملاء' : 'Customers'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {total > 0
              ? locale === 'ar'
                ? `${total} عميل مسجل`
                : `${total} registered customers`
              : locale === 'ar'
                ? 'لا يوجد عملاء بعد'
                : 'No customers yet'}
          </p>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md"
        >
          <Plus className="h-4 w-4 me-2" />
          {locale === 'ar' ? 'عميل جديد' : 'New Customer'}
        </Button>
      </motion.div>

      {/* ── Search Bar ── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="flex gap-2"
      >
        <div className="relative flex-1 max-w-md">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder={locale === 'ar' ? 'البحث بالاسم، البريد، أو الهاتف...' : 'Search by name, email, or phone...'}
            className="ps-10"
          />
        </div>
        <Button variant="outline" onClick={handleSearch}>
          <Search className="h-4 w-4 me-2" />
          {locale === 'ar' ? 'بحث' : 'Search'}
        </Button>
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
      {customersLoading ? (
        isMobile ? <CardSkeleton /> : <TableSkeleton />
      ) : customers.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          <div className="rounded-full bg-emerald-50 dark:bg-emerald-900/30 p-4 mb-4">
            <Inbox className="h-10 w-10 text-emerald-400" />
          </div>
          <h3 className="text-lg font-semibold">
            {locale === 'ar' ? 'لا يوجد عملاء' : 'No customers found'}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {search
              ? locale === 'ar'
                ? 'لا توجد نتائج للبحث. جرّب كلمات مختلفة.'
                : 'No results found. Try different keywords.'
              : locale === 'ar'
                ? 'ابدأ بإضافة عميلك الأول.'
                : 'Add your first customer to get started.'}
          </p>
          {!search && (
            <Button
              onClick={() => setCreateOpen(true)}
              className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Plus className="h-4 w-4 me-2" />
              {locale === 'ar' ? 'عميل جديد' : 'New Customer'}
            </Button>
          )}
        </motion.div>
      ) : isMobile ? (
        /* ── Mobile Cards ── */
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <AnimatePresence>
            {customers.map((c) => (
              <CustomerCard key={c.id} c={c} />
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        /* ── Desktop Table ── */
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="rounded-xl border border-border bg-card shadow-sm overflow-x-auto"
        >
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="w-12 text-center">#</TableHead>
                <TableHead>{locale === 'ar' ? 'الاسم' : 'Name'}</TableHead>
                <TableHead>{locale === 'ar' ? 'البريد الإلكتروني' : 'Email'}</TableHead>
                <TableHead>{locale === 'ar' ? 'الهاتف' : 'Phone'}</TableHead>
                <TableHead className="text-center">{locale === 'ar' ? 'نقاط الولاء' : 'Loyalty Points'}</TableHead>
                <TableHead className="text-center">{locale === 'ar' ? 'العضوية' : 'Membership'}</TableHead>
                <TableHead className="text-center">{locale === 'ar' ? 'الحجوزات' : 'Bookings'}</TableHead>
                <TableHead className="text-end">{locale === 'ar' ? 'إجمالي الإنفاق' : 'Total Spent'}</TableHead>
                <TableHead className="w-16 text-center">{locale === 'ar' ? 'إجراءات' : 'Actions'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence>
                {customers.map((c, idx) => (
                  <motion.tr
                    key={c.id}
                    variants={fadeVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="border-b border-border last:border-0 transition-colors hover:bg-muted/40"
                  >
                    <TableCell className="text-center text-muted-foreground text-sm">
                      {(page - 1) * PAGE_SIZE + idx + 1}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${getAvatarColor(c.firstName + c.lastName)}`}>
                          {getInitials(c.firstName, c.lastName)}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium text-sm flex items-center gap-1.5">
                            {c.firstName} {c.lastName}
                            {c.isBlacklisted && (
                              <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-5">
                                <ShieldBan className="h-3 w-3 me-0.5" />
                                {locale === 'ar' ? 'محظور' : 'Banned'}
                              </Badge>
                            )}
                          </span>
                          {formatTags(c.tags).length > 0 && (
                            <div className="flex gap-1 mt-0.5 flex-wrap">
                              {formatTags(c.tags).map((tag) => (
                                <span key={tag} className="text-[10px] text-muted-foreground bg-muted rounded px-1.5 py-0">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{c.email || '—'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground" dir="ltr">{c.phone || '—'}</TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex items-center gap-1 text-sm font-medium text-amber-600">
                        <Star className="h-3.5 w-3.5" />
                        {c.loyaltyPoints.toLocaleString(locale === 'ar' ? 'ar-SA' : 'en-US')}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className={`text-xs ${membershipColors[c.membershipTier]}`}>
                        {membershipLabels[c.membershipTier]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center text-sm font-medium">
                      {c._count.bookings}
                    </TableCell>
                    <TableCell className="text-end text-sm font-semibold text-emerald-600">
                      {formatCurrency(c.totalSpent, 'SAR', locale)}
                    </TableCell>
                    <TableCell className="text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align={locale === 'ar' ? 'start' : 'end'}>
                          <DropdownMenuItem onClick={() => openDetail(c.id)}>
                            <Eye className="h-4 w-4 me-2" />
                            {locale === 'ar' ? 'عرض التفاصيل' : 'View Details'}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEdit(c.id)}>
                            <User className="h-4 w-4 me-2" />
                            {locale === 'ar' ? 'تعديل' : 'Edit'}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600 focus:text-red-600"
                            onClick={() => openDelete(c.id)}
                          >
                            <Trash2 className="h-4 w-4 me-2" />
                            {locale === 'ar' ? 'حذف' : 'Delete'}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </TableBody>
          </Table>

          {/* ── Pagination ── */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border px-4 py-3 bg-muted/30">
              <p className="text-sm text-muted-foreground">
                {locale === 'ar'
                  ? `صفحة ${page} من ${totalPages} (${total} عميل)`
                  : `Page ${page} of ${totalPages} (${total} customers)`}
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
        </motion.div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          NEW CUSTOMER DIALOG
         ════════════════════════════════════════════════════════════════════ */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-emerald-600" />
              {locale === 'ar' ? 'عميل جديد' : 'New Customer'}
            </DialogTitle>
            <DialogDescription>
              {locale === 'ar'
                ? 'أدخل بيانات العميل الجديد'
                : 'Enter the new customer details'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">
                  {locale === 'ar' ? 'الاسم الأول' : 'First Name'} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="firstName"
                  name="firstName"
                  required
                  placeholder={locale === 'ar' ? 'محمد' : 'John'}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">
                  {locale === 'ar' ? 'الاسم الأخير' : 'Last Name'} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="lastName"
                  name="lastName"
                  required
                  placeholder={locale === 'ar' ? 'أحمد' : 'Doe'}
                />
              </div>
            </div>

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
                  placeholder="example@email.com"
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gender">{locale === 'ar' ? 'الجنس' : 'Gender'}</Label>
                <Select name="gender" defaultValue="">
                  <SelectTrigger>
                    <SelectValue placeholder={locale === 'ar' ? 'اختر الجنس' : 'Select gender'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">{locale === 'ar' ? 'ذكر' : 'Male'}</SelectItem>
                    <SelectItem value="female">{locale === 'ar' ? 'أنثى' : 'Female'}</SelectItem>
                    <SelectItem value="other">{locale === 'ar' ? 'آخر' : 'Other'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">
                  {locale === 'ar' ? 'تاريخ الميلاد' : 'Date of Birth'}
                </Label>
                <Input id="dateOfBirth" name="dateOfBirth" type="date" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">
                <StickyNote className="h-3.5 w-3.5 inline me-1.5" />
                {locale === 'ar' ? 'ملاحظات' : 'Notes'}
              </Label>
              <Textarea
                id="notes"
                name="notes"
                rows={3}
                placeholder={locale === 'ar' ? 'ملاحظات إضافية...' : 'Additional notes...'}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">
                {locale === 'ar' ? 'الوسوم' : 'Tags'}
              </Label>
              <Input
                id="tags"
                name="tags"
                placeholder={locale === 'ar' ? 'وسوم مفصولة بفواصل (مثال: VIP, عميل دائم)' : 'Comma-separated tags (e.g. VIP, Regular)'}
              />
              <p className="text-xs text-muted-foreground">
                {locale === 'ar' ? 'افصل بين الوسوم بفاصلة' : 'Separate tags with a comma'}
              </p>
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
                {locale === 'ar' ? 'إضافة عميل' : 'Add Customer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ════════════════════════════════════════════════════════════════════
          CUSTOMER DETAIL DIALOG
         ════════════════════════════════════════════════════════════════════ */}
      <Dialog open={detailOpen} onOpenChange={(open) => {
        setDetailOpen(open)
        if (!open) setDetailId(null)
      }}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          {detailLoading || !detail ? (
            <div className="flex-1 p-6 space-y-4">
              <Skeleton className="h-6 w-48" />
              <div className="flex gap-4">
                <Skeleton className="h-16 w-16 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-60" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
              <Skeleton className="h-40 w-full rounded-lg" />
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-emerald-600" />
                  {detail.firstName} {detail.lastName}
                </DialogTitle>
                <DialogDescription>
                  {locale === 'ar' ? 'تفاصيل العميل والسجل' : 'Customer details and history'}
                </DialogDescription>
              </DialogHeader>

              <ScrollArea className="flex-1 -mx-6 px-6">
                <Tabs defaultValue="profile" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
                  <TabsList className="mb-4">
                    <TabsTrigger value="profile">
                      <User className="h-4 w-4 me-1.5" />
                      {locale === 'ar' ? 'الملف الشخصي' : 'Profile'}
                    </TabsTrigger>
                    <TabsTrigger value="bookings">
                      <Calendar className="h-4 w-4 me-1.5" />
                      {locale === 'ar' ? 'الحجوزات' : 'Bookings'}
                    </TabsTrigger>
                    <TabsTrigger value="payments">
                      <CreditCard className="h-4 w-4 me-1.5" />
                      {locale === 'ar' ? 'المدفوعات' : 'Payments'}
                    </TabsTrigger>
                    <TabsTrigger value="notes">
                      <MessageSquare className="h-4 w-4 me-1.5" />
                      {locale === 'ar' ? 'الملاحظات' : 'Notes'}
                    </TabsTrigger>
                  </TabsList>

                  {/* ── Profile Tab ── */}
                  <TabsContent value="profile" className="space-y-4">
                    <div className="flex items-start gap-4 p-4 rounded-xl bg-muted/40 border border-border">
                      <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-xl font-bold text-white ${getAvatarColor(detail.firstName + detail.lastName)}`}>
                        {getInitials(detail.firstName, detail.lastName)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-lg font-bold">{detail.firstName} {detail.lastName}</h3>
                          <Badge variant="outline" className={`text-xs ${membershipColors[detail.membershipTier]}`}>
                            <Award className="h-3 w-3 me-1" />
                            {membershipLabels[detail.membershipTier]}
                          </Badge>
                          {detail.isBlacklisted && (
                            <Badge variant="destructive" className="text-xs">
                              <ShieldBan className="h-3 w-3 me-1" />
                              {locale === 'ar' ? 'محظور' : 'Blacklisted'}
                            </Badge>
                          )}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 mt-3 text-sm">
                          {detail.email && (
                            <p className="flex items-center gap-2 text-muted-foreground">
                              <Mail className="h-3.5 w-3.5 shrink-0" />
                              <span dir="ltr">{detail.email}</span>
                            </p>
                          )}
                          {detail.phone && (
                            <p className="flex items-center gap-2 text-muted-foreground">
                              <Phone className="h-3.5 w-3.5 shrink-0" />
                              <span dir="ltr">{detail.phone}</span>
                            </p>
                          )}
                          {detail.gender && (
                            <p className="flex items-center gap-2 text-muted-foreground">
                              <User className="h-3.5 w-3.5 shrink-0" />
                              {detail.gender === 'male'
                                ? locale === 'ar' ? 'ذكر' : 'Male'
                                : detail.gender === 'female'
                                  ? locale === 'ar' ? 'أنثى' : 'Female'
                                  : locale === 'ar' ? 'آخر' : 'Other'}
                            </p>
                          )}
                          {detail.dateOfBirth && (
                            <p className="flex items-center gap-2 text-muted-foreground">
                              <Calendar className="h-3.5 w-3.5 shrink-0" />
                              {formatDate(detail.dateOfBirth, locale)}
                            </p>
                          )}
                        </div>
                        {formatTags(detail.tags).length > 0 && (
                          <div className="flex gap-1.5 mt-3 flex-wrap">
                            {formatTags(detail.tags).map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <Card className="p-3 text-center">
                        <p className="text-xs text-muted-foreground">{locale === 'ar' ? 'إجمالي الحجوزات' : 'Total Bookings'}</p>
                        <p className="text-xl font-bold text-emerald-600 mt-1">{stats.totalBookings}</p>
                      </Card>
                      <Card className="p-3 text-center">
                        <p className="text-xs text-muted-foreground">{locale === 'ar' ? 'إجمالي الإنفاق' : 'Total Spent'}</p>
                        <p className="text-xl font-bold text-emerald-600 mt-1">{formatCurrency(stats.totalSpent, 'SAR', locale)}</p>
                      </Card>
                      <Card className="p-3 text-center">
                        <p className="text-xs text-muted-foreground">{locale === 'ar' ? 'نقاط الولاء' : 'Loyalty Points'}</p>
                        <p className="text-xl font-bold text-amber-600 mt-1">{detail.loyaltyPoints.toLocaleString(locale === 'ar' ? 'ar-SA' : 'en-US')}</p>
                      </Card>
                      <Card className="p-3 text-center">
                        <p className="text-xs text-muted-foreground">{locale === 'ar' ? 'آخر زيارة' : 'Last Visit'}</p>
                        <p className="text-sm font-bold mt-1">
                          {stats.lastVisit ? formatDate(stats.lastVisit, locale) : '—'}
                        </p>
                      </Card>
                    </div>

                    {detail.notes && (
                      <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm">
                        <p className="font-medium text-amber-800 mb-1 flex items-center gap-1">
                          <StickyNote className="h-3.5 w-3.5" />
                          {locale === 'ar' ? 'ملاحظات' : 'Notes'}
                        </p>
                        <p className="text-amber-700 whitespace-pre-wrap">{detail.notes}</p>
                      </div>
                    )}
                  </TabsContent>

                  {/* ── Bookings Tab ── */}
                  <TabsContent value="bookings">
                    {detail.bookings && detail.bookings.length > 0 ? (
                      <div className="space-y-2">
                        {detail.bookings.map((b) => (
                          <div key={b.id} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {b.services?.map((s) => s.service.name).join(', ') || locale === 'ar' ? 'حجز' : 'Booking'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {b.branch?.name} {b.employee ? `• ${b.employee.name}` : ''}
                              </p>
                            </div>
                            <div className="text-end shrink-0">
                              <p className="text-sm font-semibold">{formatCurrency(b.totalPrice, 'SAR', locale)}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatDate(b.startDate, locale)}
                              </p>
                            </div>
                            <Badge
                              variant="outline"
                              className={
                                b.status === 'completed'
                                  ? 'border-emerald-300 text-emerald-700 bg-emerald-50'
                                  : b.status === 'cancelled'
                                    ? 'border-red-300 text-red-700 bg-red-50'
                                    : b.status === 'confirmed'
                                      ? 'border-blue-300 text-blue-700 bg-blue-50'
                                      : 'border-amber-300 text-amber-700 bg-amber-50'
                              }
                            >
                              {b.status === 'completed'
                                ? locale === 'ar' ? 'مكتمل' : 'Completed'
                                : b.status === 'cancelled'
                                  ? locale === 'ar' ? 'ملغي' : 'Cancelled'
                                  : b.status === 'confirmed'
                                    ? locale === 'ar' ? 'مؤكد' : 'Confirmed'
                                    : b.status === 'pending'
                                      ? locale === 'ar' ? 'معلق' : 'Pending'
                                      : b.status === 'in_progress'
                                        ? locale === 'ar' ? 'جاري' : 'In Progress'
                                        : locale === 'ar' ? 'لم يحضر' : 'No Show'}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Calendar className="h-8 w-8 mx-auto mb-2 opacity-40" />
                        <p className="text-sm">{locale === 'ar' ? 'لا توجد حجوزات' : 'No bookings yet'}</p>
                      </div>
                    )}
                  </TabsContent>

                  {/* ── Payments Tab ── */}
                  <TabsContent value="payments">
                    {detail.payments && detail.payments.length > 0 ? (
                      <div className="space-y-2">
                        {detail.payments.map((p) => (
                          <div key={p.id} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-900/30">
                              <CreditCard className="h-4 w-4 text-emerald-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium">
                                {p.method === 'cash'
                                  ? locale === 'ar' ? 'نقدي' : 'Cash'
                                  : p.method === 'card'
                                    ? locale === 'ar' ? 'بطاقة' : 'Card'
                                    : p.method === 'online'
                                      ? locale === 'ar' ? 'إلكتروني' : 'Online'
                                      : p.method}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatDate(p.createdAt, locale)}
                              </p>
                            </div>
                            <p className="text-sm font-bold text-emerald-600">
                              {formatCurrency(p.amount, p.currency || 'SAR', locale)}
                            </p>
                            <Badge
                              variant="outline"
                              className={
                                p.status === 'paid'
                                  ? 'border-emerald-300 text-emerald-700 bg-emerald-50'
                                  : p.status === 'failed'
                                    ? 'border-red-300 text-red-700 bg-red-50'
                                    : 'border-amber-300 text-amber-700 bg-amber-50'
                              }
                            >
                              {p.status === 'paid'
                                ? locale === 'ar' ? 'مدفوع' : 'Paid'
                                : p.status === 'failed'
                                  ? locale === 'ar' ? 'فاشل' : 'Failed'
                                  : p.status === 'refunded'
                                    ? locale === 'ar' ? 'مسترد' : 'Refunded'
                                    : locale === 'ar' ? 'معلق' : 'Pending'}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <CreditCard className="h-8 w-8 mx-auto mb-2 opacity-40" />
                        <p className="text-sm">{locale === 'ar' ? 'لا توجد مدفوعات' : 'No payments yet'}</p>
                      </div>
                    )}
                  </TabsContent>

                  {/* ── Notes Tab ── */}
                  <TabsContent value="notes" className="space-y-4">
                    {/* Add Note */}
                    <div className="flex gap-2">
                      <Input
                        value={noteInput}
                        onChange={(e) => setNoteInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddNote()
                        }}
                        placeholder={locale === 'ar' ? 'اكتب ملاحظة جديدة...' : 'Write a new note...'}
                        className="flex-1"
                      />
                      <Button
                        onClick={handleAddNote}
                        disabled={!noteInput.trim() || noteSaving}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"
                      >
                        {noteSaving ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Plus className="h-4 w-4" />
                        )}
                      </Button>
                    </div>

                    {/* Notes List */}
                    {detail.customerNotes && detail.customerNotes.length > 0 ? (
                      <div className="space-y-2">
                        {detail.customerNotes.map((note) => (
                          <motion.div
                            key={note.id}
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-3 rounded-lg border border-border bg-muted/20"
                          >
                            <p className="text-sm">{note.content}</p>
                            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                              <MessageSquare className="h-3 w-3" />
                              <span>{note.createdBy}</span>
                              <span>•</span>
                              <span>{formatDate(note.createdAt, locale)}</span>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : detail.notes ? (
                      <div className="p-3 rounded-lg border border-border bg-muted/20">
                        <p className="text-sm whitespace-pre-wrap">{detail.notes}</p>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <StickyNote className="h-8 w-8 mx-auto mb-2 opacity-40" />
                        <p className="text-sm">{locale === 'ar' ? 'لا توجد ملاحظات' : 'No notes yet'}</p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </ScrollArea>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ════════════════════════════════════════════════════════════════════
          EDIT CUSTOMER DIALOG
         ════════════════════════════════════════════════════════════════════ */}
      <Dialog open={editOpen} onOpenChange={(v) => { setEditOpen(v); if (!v) setEditId(null) }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{locale === 'ar' ? 'تعديل العميل' : 'Edit Customer'}</DialogTitle>
            <DialogDescription>
              {locale === 'ar' ? 'تحديث بيانات العميل' : 'Update customer information'}
            </DialogDescription>
          </DialogHeader>
          {editId && (() => {
            const customer = customers.find(c => c.id === editId)
            if (!customer) return null
            return (
              <form onSubmit={handleEdit} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">{locale === 'ar' ? 'الاسم الأول' : 'First Name'}</Label>
                    <Input name="editFirstName" defaultValue={customer.firstName} required className="h-9 text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">{locale === 'ar' ? 'اسم العائلة' : 'Last Name'}</Label>
                    <Input name="editLastName" defaultValue={customer.lastName} required className="h-9 text-sm" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Email</Label>
                  <Input name="editEmail" type="email" defaultValue={customer.email ?? ''} dir="ltr" className="h-9 text-sm text-start" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">{locale === 'ar' ? 'الهاتف' : 'Phone'}</Label>
                  <Input name="editPhone" type="tel" defaultValue={customer.phone ?? ''} dir="ltr" className="h-9 text-sm text-start" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">{locale === 'ar' ? 'الجنس' : 'Gender'}</Label>
                    <Select name="editGender" defaultValue={customer.gender ?? ''}>
                      <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">{locale === 'ar' ? '—' : '—'}</SelectItem>
                        <SelectItem value="male">{locale === 'ar' ? 'ذكر' : 'Male'}</SelectItem>
                        <SelectItem value="female">{locale === 'ar' ? 'أنثى' : 'Female'}</SelectItem>
                        <SelectItem value="other">{locale === 'ar' ? 'آخر' : 'Other'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">{locale === 'ar' ? 'العضوية' : 'Membership'}</Label>
                    <Select name="editMembershipTier" defaultValue={customer.membershipTier}>
                      <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="regular">{locale === 'ar' ? 'عادي' : 'Regular'}</SelectItem>
                        <SelectItem value="silver">{locale === 'ar' ? 'فضي' : 'Silver'}</SelectItem>
                        <SelectItem value="gold">{locale === 'ar' ? 'ذهبي' : 'Gold'}</SelectItem>
                        <SelectItem value="platinum">{locale === 'ar' ? 'بلاتيني' : 'Platinum'}</SelectItem>
                        <SelectItem value="diamond">{locale === 'ar' ? 'ألماسي' : 'Diamond'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">{locale === 'ar' ? 'ملاحظات' : 'Notes'}</Label>
                  <Textarea name="editNotes" defaultValue={customer.notes ?? ''} rows={2} className="text-sm" />
                </div>
                <DialogFooter className="gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setEditOpen(false)} className="h-9">
                    {locale === 'ar' ? 'إلغاء' : 'Cancel'}
                  </Button>
                  <Button type="submit" disabled={editMutation.isPending} className="h-9">
                    {editMutation.isPending && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
                    {locale === 'ar' ? 'حفظ التغييرات' : 'Save Changes'}
                  </Button>
                </DialogFooter>
              </form>
            )
          })()}
        </DialogContent>
      </Dialog>

      {/* ════════════════════════════════════════════════════════════════════
          DELETE CONFIRMATION DIALOG
         ════════════════════════════════════════════════════════════════════ */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {locale === 'ar' ? 'هل أنت متأكد من حذف هذا العميل؟' : 'Are you sure you want to delete this customer?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {locale === 'ar'
                ? 'سيتم تعطيل حساب العميل. يمكنك إعادته لاحقاً.'
                : 'The customer account will be deactivated. You can restore it later.'}
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