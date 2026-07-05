'use client'

import { authFetch } from '@/lib/auth-fetch'


import { useState, useMemo, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Loader2,
  Inbox,
  Search,
  Tag,
  Copy,
  Percent,
  DollarSign,
  Calendar,
  Hash,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react'

import { useAppStore } from '@/stores/app-store'
import { t, formatDate, formatCurrency, getDirection, type Locale } from '@/lib/i18n'
import { toast } from '@/hooks/use-toast'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
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

// ─── Types ──────────────────────────────────────────────────────────────────

interface CouponRow {
  id: string
  code: string
  type: 'percentage' | 'fixed'
  value: number
  minPurchase: number | null
  maxUses: number | null
  usedCount: number
  startDate: string
  endDate: string
  isActive: boolean
  createdAt: string
}

interface CouponForm {
  code: string
  type: 'percentage' | 'fixed'
  value: number
  minPurchase: number
  maxUses: number
  startDate: string
  endDate: string
  isActive: boolean
}

// ─── Constants ──────────────────────────────────────────────────────────────

const emptyForm: CouponForm = {
  code: '',
  type: 'percentage',
  value: 10,
  minPurchase: 0,
  maxUses: 100,
  startDate: new Date().toISOString().split('T')[0],
  endDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
  isActive: true,
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
}

const stagger = {
  visible: { transition: { staggerChildren: 0.04 } },
}

// ─── Sub-Components ──────────────────────────────────────────────────────────

function TableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-14 w-full rounded-lg" />
      ))}
    </div>
  )
}

function UsageBar({
  used,
  max,
  locale,
}: {
  used: number
  max: number | null
  locale: Locale
}) {
  const pct = max ? Math.min((used / max) * 100, 100) : 0
  const isAr = locale === 'ar'

  return (
    <div className="flex items-center gap-3 min-w-[140px]">
      <Progress value={pct} className="h-2 flex-1" />
      <span className="text-xs text-muted-foreground whitespace-nowrap tabular-nums">
        {used}/{max ?? '∞'}
      </span>
    </div>
  )
}

function CouponCodeBadge({ code, locale }: { code: string; locale: Locale }) {
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code)
    toast({
      title: t(locale, 'common', 'copied'),
      description: code,
    })
  }, [code, locale])

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/80 hover:bg-muted transition-colors font-mono text-sm font-medium cursor-pointer group"
      title={isAr ? 'نسخ الرمز' : 'Copy code'}
    >
      <Tag className="h-3.5 w-3.5 text-primary" />
      <span>{code}</span>
      <Copy className="h-3 w-3 opacity-0 group-hover:opacity-60 transition-opacity" />
    </button>
  )
}

function isExpired(endDate: string): boolean {
  return new Date(endDate) < new Date()
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function CouponsView() {
  const { locale } = useAppStore()
  const queryClient = useQueryClient()
  const dir = getDirection(locale)
  const isAr = locale === 'ar'

  // ── State ──
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [form, setForm] = useState<CouponForm>(emptyForm)

  // ── Queries ──
  const { data: couponsData, isLoading } = useQuery({
    queryKey: ['coupons'],
    queryFn: async () => {
      const res = await authFetch('/api/coupons')
      if (!res.ok) throw new Error('Failed to fetch coupons')
      return res.json() as Promise<{ coupons: CouponRow[] }>
    },
  })

  const coupons = couponsData?.coupons ?? []

  // ── Filtered ──
  const filtered = useMemo(() => {
    let result = coupons

    if (statusFilter === 'active') {
      result = result.filter((c) => c.isActive && !isExpired(c.endDate))
    } else if (statusFilter === 'inactive') {
      result = result.filter((c) => !c.isActive || isExpired(c.endDate))
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter((c) => c.code.toLowerCase().includes(q))
    }

    return result
  }, [coupons, search, statusFilter])

  // ── Mutations ──
  const createMutation = useMutation({
    mutationFn: async (data: CouponForm) => {
      const res = await authFetch('/api/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to create coupon')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] })
      setCreateOpen(false)
      setForm(emptyForm)
      toast({ title: t(locale, 'coupons', 'couponCreated') })
    },
    onError: () => {
      toast({ title: t(locale, 'common', 'error'), variant: 'destructive' })
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CouponForm> }) => {
      const res = await authFetch(`/api/coupons/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to update coupon')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] })
      setEditOpen(false)
      setSelectedId(null)
      setForm(emptyForm)
      toast({ title: t(locale, 'coupons', 'couponUpdated') })
    },
    onError: () => {
      toast({ title: t(locale, 'common', 'error'), variant: 'destructive' })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await authFetch(`/api/coupons/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete coupon')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] })
      setDeleteOpen(false)
      setSelectedId(null)
      toast({ title: t(locale, 'coupons', 'couponDeleted') })
    },
    onError: () => {
      toast({ title: t(locale, 'common', 'error'), variant: 'destructive' })
    },
  })

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const res = await authFetch(`/api/coupons/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive }),
      })
      if (!res.ok) throw new Error('Failed to toggle coupon')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] })
    },
  })

  // ── Handlers ──
  const openCreate = useCallback(() => {
    setForm(emptyForm)
    setCreateOpen(true)
  }, [])

  const openEdit = useCallback((coupon: CouponRow) => {
    setSelectedId(coupon.id)
    setForm({
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      minPurchase: coupon.minPurchase ?? 0,
      maxUses: coupon.maxUses ?? 100,
      startDate: coupon.startDate.split('T')[0],
      endDate: coupon.endDate.split('T')[0],
      isActive: coupon.isActive,
    })
    setEditOpen(true)
  }, [])

  const openDelete = useCallback((id: string) => {
    setSelectedId(id)
    setDeleteOpen(true)
  }, [])

  const handleCreate = useCallback(() => {
    if (!form.code.trim()) return
    createMutation.mutate(form)
  }, [form, createMutation])

  const handleUpdate = useCallback(() => {
    if (!selectedId || !form.code.trim()) return
    updateMutation.mutate({ id: selectedId, data: form })
  }, [selectedId, form, updateMutation])

  const handleDelete = useCallback(() => {
    if (!selectedId) return
    deleteMutation.mutate(selectedId)
  }, [selectedId, deleteMutation])

  const selectedCoupon = useMemo(
    () => coupons.find((c) => c.id === selectedId),
    [coupons, selectedId]
  )

  // ── Stats ──
  const stats = useMemo(() => {
    const active = coupons.filter((c) => c.isActive && !isExpired(c.endDate)).length
    const expired = coupons.filter((c) => isExpired(c.endDate)).length
    const totalUsed = coupons.reduce((sum, c) => sum + c.usedCount, 0)
    return { total: coupons.length, active, expired, totalUsed }
  }, [coupons])

  // ── Render ──
  return (
    <div dir={dir} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {t(locale, 'coupons', 'title')}
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            {isAr
              ? `إدارة كوبونات الخصم (${filtered.length})`
              : `Manage discount coupons (${filtered.length})`}
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          {t(locale, 'coupons', 'newCoupon')}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: t(locale, 'common', 'total'),
            value: stats.total,
            icon: Tag,
            color: 'text-primary',
          },
          {
            label: t(locale, 'common', 'active'),
            value: stats.active,
            icon: TrendingUp,
            color: 'text-emerald-600 dark:text-emerald-400',
          },
          {
            label: isAr ? 'منتهي الصلاحية' : 'Expired',
            value: stats.expired,
            icon: AlertTriangle,
            color: 'text-amber-600 dark:text-amber-400',
          },
          {
            label: t(locale, 'coupons', 'usedCount'),
            value: stats.totalUsed,
            icon: Hash,
            color: 'text-violet-600 dark:text-violet-400',
          },
        ].map((stat) => (
          <motion.div
            key={stat.label}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
          >
            <Card className="border-border/50">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="rounded-lg bg-primary/5 p-2">
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold tabular-nums">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isAr ? 'بحث بالرمز...' : 'Search by code...'}
            className="ps-9"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          {[
            { value: 'all', label: t(locale, 'common', 'all') },
            { value: 'active', label: t(locale, 'common', 'active') },
            { value: 'inactive', label: t(locale, 'common', 'inactive') },
          ].map((f) => (
            <Button
              key={f.value}
              variant={statusFilter === f.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(f.value)}
              className="text-xs"
            >
              {f.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Table / Empty */}
      {isLoading ? (
        <TableSkeleton />
      ) : filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          <div className="rounded-full bg-muted p-4 mb-4">
            <Inbox className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold">
            {t(locale, 'coupons', 'noCouponsFound')}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {isAr ? 'أنشئ أول كوبون خصم لك' : 'Create your first discount coupon'}
          </p>
        </motion.div>
      ) : (
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="rounded-xl border bg-card overflow-x-auto"
        >
          {/* Desktop Table */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="ps-5">
                    {t(locale, 'coupons', 'couponCode')}
                  </TableHead>
                  <TableHead>{t(locale, 'coupons', 'couponType')}</TableHead>
                  <TableHead>{t(locale, 'coupons', 'discountValue')}</TableHead>
                  <TableHead className="min-w-[160px]">
                    {isAr ? 'الاستخدام' : 'Usage'}
                  </TableHead>
                  <TableHead>{t(locale, 'coupons', 'validFrom')}</TableHead>
                  <TableHead>{t(locale, 'coupons', 'validUntil')}</TableHead>
                  <TableHead>{t(locale, 'common', 'status')}</TableHead>
                  <TableHead className="pe-5 text-end">
                    {t(locale, 'common', 'actions')}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence>
                  {filtered.map((coupon) => {
                    const expired = isExpired(coupon.endDate)
                    return (
                      <motion.tr
                        key={coupon.id}
                        variants={fadeUp}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        layout
                        className="border-b last:border-b-0 transition-colors hover:bg-muted/30"
                      >
                        <TableCell className="ps-5">
                          <CouponCodeBadge code={coupon.code} locale={locale} />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {coupon.type === 'percentage' ? (
                              <Percent className="h-4 w-4 text-emerald-500" />
                            ) : (
                              <DollarSign className="h-4 w-4 text-amber-500" />
                            )}
                            <span className="text-sm">
                              {coupon.type === 'percentage'
                                ? t(locale, 'coupons', 'percentage')
                                : t(locale, 'coupons', 'fixed')}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold">
                            {coupon.type === 'percentage'
                              ? `${coupon.value}%`
                              : formatCurrency(coupon.value, undefined, locale)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <UsageBar
                            used={coupon.usedCount}
                            max={coupon.maxUses}
                            locale={locale}
                          />
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(coupon.startDate, locale)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">
                              {formatDate(coupon.endDate, locale)}
                            </span>
                            {expired && (
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                {isAr ? 'منتهي' : 'Exp'}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={coupon.isActive && !expired}
                            onCheckedChange={(checked) =>
                              toggleMutation.mutate({
                                id: coupon.id,
                                isActive: checked,
                              })
                            }
                            disabled={expired || toggleMutation.isPending}
                          />
                        </TableCell>
                        <TableCell className="pe-5">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openEdit(coupon)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => openDelete(coupon.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </motion.tr>
                    )
                  })}
                </AnimatePresence>
              </TableBody>
            </Table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden p-4 space-y-3">
            <AnimatePresence>
              {filtered.map((coupon) => {
                const expired = isExpired(coupon.endDate)
                return (
                  <motion.div
                    key={coupon.id}
                    variants={fadeUp}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    layout
                  >
                    <Card className="border-border/50">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <CouponCodeBadge code={coupon.code} locale={locale} />
                          <div className="flex items-center gap-2">
                            {expired && (
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                {isAr ? 'منتهي' : 'Expired'}
                              </Badge>
                            )}
                            <Badge
                              variant={coupon.isActive && !expired ? 'default' : 'secondary'}
                              className={
                                coupon.isActive && !expired
                                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                                  : ''
                              }
                            >
                              {coupon.isActive && !expired
                                ? t(locale, 'coupons', 'isActive')
                                : t(locale, 'coupons', 'isInactive')}
                            </Badge>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1.5">
                            {coupon.type === 'percentage' ? (
                              <Percent className="h-4 w-4 text-emerald-500" />
                            ) : (
                              <DollarSign className="h-4 w-4 text-amber-500" />
                            )}
                            <span className="font-semibold">
                              {coupon.type === 'percentage'
                                ? `${coupon.value}%`
                                : formatCurrency(coupon.value, undefined, locale)}
                            </span>
                          </div>
                          <div className="text-muted-foreground">
                            <Calendar className="inline h-3.5 w-3.5 me-1" />
                            {formatDate(coupon.endDate, locale)}
                          </div>
                        </div>

                        <UsageBar
                          used={coupon.usedCount}
                          max={coupon.maxUses}
                          locale={locale}
                        />

                        <div className="flex items-center justify-between pt-1 border-t border-border/50">
                          <Switch
                            checked={coupon.isActive && !expired}
                            onCheckedChange={(checked) =>
                              toggleMutation.mutate({
                                id: coupon.id,
                                isActive: checked,
                              })
                            }
                            disabled={expired || toggleMutation.isPending}
                          />
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openEdit(coupon)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => openDelete(coupon.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        </motion.div>
      )}

      {/* ── Create / Edit Dialog (shared) ── */}
      <Dialog
        open={createOpen || editOpen}
        onOpenChange={(open) => {
          if (!open) {
            setCreateOpen(false)
            setEditOpen(false)
            setSelectedId(null)
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {createOpen
                ? t(locale, 'coupons', 'newCoupon')
                : t(locale, 'common', 'edit')}
            </DialogTitle>
            <DialogDescription>
              {isAr
                ? 'أدخل بيانات كوبون الخصم'
                : 'Enter the coupon details'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>{t(locale, 'coupons', 'couponCode')}</Label>
              <Input
                value={form.code}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    code: e.target.value.toUpperCase(),
                  }))
                }
                placeholder={isAr ? 'مثال: SAVE20' : 'e.g. SAVE20'}
                dir="ltr"
                className="text-start font-mono tracking-wider"
                disabled={!!editOpen}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>{t(locale, 'coupons', 'couponType')}</Label>
                <Select
                  value={form.type}
                  onValueChange={(val) =>
                    setForm((f) => ({
                      ...f,
                      type: val as 'percentage' | 'fixed',
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">
                      <div className="flex items-center gap-2">
                        <Percent className="h-3.5 w-3.5" />
                        {t(locale, 'coupons', 'percentage')}
                      </div>
                    </SelectItem>
                    <SelectItem value="fixed">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-3.5 w-3.5" />
                        {t(locale, 'coupons', 'fixed')}
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>{t(locale, 'coupons', 'discountValue')}</Label>
                <div className="relative">
                  <Input
                    type="number"
                    value={form.value}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        value: parseFloat(e.target.value) || 0,
                      }))
                    }
                    min={0}
                    max={form.type === 'percentage' ? 100 : undefined}
                    dir="ltr"
                    className="text-start pe-8"
                  />
                  <span className="absolute end-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    {form.type === 'percentage' ? '%' : 'ر.س'}
                  </span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>{t(locale, 'coupons', 'minPurchase')}</Label>
                <Input
                  type="number"
                  value={form.minPurchase}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      minPurchase: parseFloat(e.target.value) || 0,
                    }))
                  }
                  min={0}
                  dir="ltr"
                  className="text-start"
                />
              </div>
              <div className="grid gap-2">
                <Label>{t(locale, 'coupons', 'maxUses')}</Label>
                <Input
                  type="number"
                  value={form.maxUses}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      maxUses: parseInt(e.target.value) || 0,
                    }))
                  }
                  min={1}
                  dir="ltr"
                  className="text-start"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>{t(locale, 'coupons', 'validFrom')}</Label>
                <Input
                  type="date"
                  value={form.startDate}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, startDate: e.target.value }))
                  }
                  dir="ltr"
                  className="text-start"
                />
              </div>
              <div className="grid gap-2">
                <Label>{t(locale, 'coupons', 'validUntil')}</Label>
                <Input
                  type="date"
                  value={form.endDate}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, endDate: e.target.value }))
                  }
                  dir="ltr"
                  className="text-start"
                  min={form.startDate}
                />
              </div>
            </div>
            <div className="flex items-center gap-3 pt-1">
              <Switch
                id="coupon-active"
                checked={form.isActive}
                onCheckedChange={(checked) =>
                  setForm((f) => ({ ...f, isActive: checked }))
                }
              />
              <Label htmlFor="coupon-active">
                {t(locale, 'coupons', 'isActive')}
              </Label>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setCreateOpen(false)
                setEditOpen(false)
              }}
            >
              {t(locale, 'common', 'cancel')}
            </Button>
            <Button
              onClick={createOpen ? handleCreate : handleUpdate}
              disabled={
                (createOpen ? createMutation : updateMutation).isPending ||
                !form.code.trim()
              }
            >
              {(createOpen ? createMutation : updateMutation).isPending && (
                <Loader2 className="h-4 w-4 animate-spin me-2" />
              )}
              {t(locale, 'common', 'save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Dialog ── */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isAr
                ? `حذف كوبون "${selectedCoupon?.code ?? ''}"؟`
                : `Delete coupon "${selectedCoupon?.code ?? ''}"?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isAr
                ? 'هل أنت متأكد من حذف هذا الكوبون؟ لا يمكن التراجع عن هذا الإجراء.'
                : 'Are you sure you want to delete this coupon? This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel>{t(locale, 'common', 'cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin me-2" />
              )}
              {t(locale, 'common', 'delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}