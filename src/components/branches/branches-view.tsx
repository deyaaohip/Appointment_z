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
  MapPin,
  Phone,
  Building2,
  Users,
  CalendarCheck,
  Mail,
  Globe,
} from 'lucide-react'

import { useAppStore } from '@/stores/app-store'
import { t, formatDate, getDirection, type Locale } from '@/lib/i18n'
import { toast } from '@/hooks/use-toast'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
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

// ─── Types ──────────────────────────────────────────────────────────────────

interface BranchRow {
  id: string
  name: string
  address: string | null
  city: string | null
  country: string | null
  phone: string | null
  email: string | null
  timezone: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  _count?: { employees: number; bookings: number }
}

interface BranchForm {
  name: string
  address: string
  city: string
  country: string
  phone: string
  email: string
  timezone: string
  isActive: boolean
}

// ─── Constants ──────────────────────────────────────────────────────────────

const emptyForm: BranchForm = {
  name: '',
  address: '',
  city: '',
  country: '',
  phone: '',
  email: '',
  timezone: 'Asia/Riyadh',
  isActive: true,
}

const timezones = [
  { value: 'Asia/Riyadh', labelAr: 'رياض (GMT+3)', labelEn: 'Riyadh (GMT+3)' },
  { value: 'Asia/Dubai', labelAr: 'دبي (GMT+4)', labelEn: 'Dubai (GMT+4)' },
  { value: 'Asia/Kuwait', labelAr: 'الكويت (GMT+3)', labelEn: 'Kuwait (GMT+3)' },
  { value: 'Asia/Qatar', labelAr: 'قطر (GMT+3)', labelEn: 'Qatar (GMT+3)' },
  { value: 'Asia/Bahrain', labelAr: 'البحرين (GMT+3)', labelEn: 'Bahrain (GMT+3)' },
  { value: 'Asia/Oman', labelAr: 'عمان (GMT+4)', labelEn: 'Oman (GMT+4)' },
  { value: 'Africa/Cairo', labelAr: 'القاهرة (GMT+2)', labelEn: 'Cairo (GMT+2)' },
  { value: 'Europe/London', labelAr: 'لندن (GMT+0)', labelEn: 'London (GMT+0)' },
  { value: 'Europe/Paris', labelAr: 'باريس (GMT+1)', labelEn: 'Paris (GMT+1)' },
  { value: 'America/New_York', labelAr: 'نيويورك (GMT-5)', labelEn: 'New York (GMT-5)' },
  { value: 'UTC', labelAr: 'UTC', labelEn: 'UTC' },
]

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
}

const stagger = {
  visible: { transition: { staggerChildren: 0.06 } },
}

const branchColors = [
  'from-emerald-500/10 to-teal-500/5 border-emerald-500/20',
  'from-amber-500/10 to-orange-500/5 border-amber-500/20',
  'from-rose-500/10 to-pink-500/5 border-rose-500/20',
  'from-cyan-500/10 to-sky-500/5 border-cyan-500/20',
  'from-violet-500/10 to-purple-500/5 border-violet-500/20',
  'from-lime-500/10 to-green-500/5 border-lime-500/20',
]

// ─── Sub-Components ──────────────────────────────────────────────────────────

function CardsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-64 rounded-xl" />
      ))}
    </div>
  )
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function BranchesView() {
  const { locale } = useAppStore()
  const queryClient = useQueryClient()
  const dir = getDirection(locale)
  const isAr = locale === 'ar'

  // ── State ──
  const [search, setSearch] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [form, setForm] = useState<BranchForm>(emptyForm)

  // ── Queries ──
  const { data: branchesData, isLoading } = useQuery({
    queryKey: ['branches'],
    queryFn: async () => {
      const res = await authFetch('/api/branches')
      if (!res.ok) throw new Error('Failed to fetch branches')
      return res.json() as Promise<{ branches: BranchRow[] }>
    },
  })

  const branches = branchesData?.branches ?? []

  // ── Filtered ──
  const filtered = useMemo(() => {
    if (!search.trim()) return branches
    const q = search.toLowerCase()
    return branches.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.city?.toLowerCase().includes(q) ||
        b.address?.toLowerCase().includes(q) ||
        b.phone?.includes(q)
    )
  }, [branches, search])

  // ── Mutations ──
  const createMutation = useMutation({
    mutationFn: async (data: BranchForm) => {
      const res = await authFetch('/api/branches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to create branch')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] })
      setCreateOpen(false)
      setForm(emptyForm)
      toast({ title: t(locale, 'branches', 'branchCreated') })
    },
    onError: () => {
      toast({ title: t(locale, 'common', 'error'), variant: 'destructive' })
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<BranchForm> }) => {
      const res = await authFetch(`/api/branches/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to update branch')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] })
      setEditOpen(false)
      setSelectedId(null)
      setForm(emptyForm)
      toast({ title: t(locale, 'branches', 'branchUpdated') })
    },
    onError: () => {
      toast({ title: t(locale, 'common', 'error'), variant: 'destructive' })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await authFetch(`/api/branches/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete branch')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] })
      setDeleteOpen(false)
      setSelectedId(null)
      toast({ title: t(locale, 'branches', 'branchDeleted') })
    },
    onError: () => {
      toast({ title: t(locale, 'common', 'error'), variant: 'destructive' })
    },
  })

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const res = await authFetch(`/api/branches/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive }),
      })
      if (!res.ok) throw new Error('Failed to toggle branch')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] })
    },
  })

  // ── Handlers ──
  const openCreate = useCallback(() => {
    setForm(emptyForm)
    setCreateOpen(true)
  }, [])

  const openEdit = useCallback((branch: BranchRow) => {
    setSelectedId(branch.id)
    setForm({
      name: branch.name,
      address: branch.address ?? '',
      city: branch.city ?? '',
      country: branch.country ?? '',
      phone: branch.phone ?? '',
      email: branch.email ?? '',
      timezone: branch.timezone,
      isActive: branch.isActive,
    })
    setEditOpen(true)
  }, [])

  const openDelete = useCallback((id: string) => {
    setSelectedId(id)
    setDeleteOpen(true)
  }, [])

  const handleCreate = useCallback(() => {
    if (!form.name.trim()) return
    createMutation.mutate(form)
  }, [form, createMutation])

  const handleUpdate = useCallback(() => {
    if (!selectedId || !form.name.trim()) return
    updateMutation.mutate({ id: selectedId, data: form })
  }, [selectedId, form, updateMutation])

  const handleDelete = useCallback(() => {
    if (!selectedId) return
    deleteMutation.mutate(selectedId)
  }, [selectedId, deleteMutation])

  const selectedBranch = useMemo(
    () => branches.find((b) => b.id === selectedId),
    [branches, selectedId]
  )

  // ── Render ──
  return (
    <div dir={dir} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {t(locale, 'branches', 'title')}
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            {isAr
              ? `إدارة فروع عملك (${filtered.length})`
              : `Manage your branches (${filtered.length})`}
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          {t(locale, 'branches', 'newBranch')}
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t(locale, 'common', 'search') + '...'}
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

      {/* Content */}
      {isLoading ? (
        <CardsSkeleton />
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
            {t(locale, 'branches', 'noBranchesFound')}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {isAr ? 'أضف فرعك الأول للبدء' : 'Add your first branch to get started'}
          </p>
        </motion.div>
      ) : (
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          <AnimatePresence mode="popLayout">
            {filtered.map((branch, idx) => (
              <motion.div
                key={branch.id}
                variants={fadeUp}
                layout
                exit="exit"
                transition={{ duration: 0.2 }}
              >
                <Card
                  className={`group relative overflow-hidden border bg-gradient-to-br ${
                    branchColors[idx % branchColors.length]
                  } transition-shadow hover:shadow-md ${
                    !branch.isActive ? 'opacity-60' : ''
                  }`}
                >
                  <CardContent className="p-5 space-y-4">
                    {/* Top row: name + status */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex-shrink-0 rounded-lg bg-primary/10 p-2.5">
                          <Building2 className="h-5 w-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-base truncate">
                            {branch.name}
                          </h3>
                          {branch.city && (
                            <p className="text-sm text-muted-foreground truncate">
                              {branch.city}
                              {branch.country ? `, ${branch.country}` : ''}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge
                          variant={branch.isActive ? 'default' : 'secondary'}
                          className={
                            branch.isActive
                              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20'
                              : ''
                          }
                        >
                          {branch.isActive
                            ? t(locale, 'branches', 'isActive')
                            : t(locale, 'common', 'inactive')}
                        </Badge>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="space-y-2.5 text-sm">
                      {branch.address && (
                        <div className="flex items-start gap-2.5 text-muted-foreground">
                          <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span className="line-clamp-2">{branch.address}</span>
                        </div>
                      )}
                      {branch.phone && (
                        <div className="flex items-center gap-2.5 text-muted-foreground">
                          <Phone className="h-4 w-4 flex-shrink-0" />
                          <span dir="ltr" className="text-start">{branch.phone}</span>
                        </div>
                      )}
                      {branch.email && (
                        <div className="flex items-center gap-2.5 text-muted-foreground">
                          <Mail className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate">{branch.email}</span>
                        </div>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4 pt-1">
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Users className="h-3.5 w-3.5" />
                        <span>
                          {branch._count?.employees ?? 0}{' '}
                          {isAr ? 'موظف' : 'employees'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <CalendarCheck className="h-3.5 w-3.5" />
                        <span>
                          {branch._count?.bookings ?? 0}{' '}
                          {isAr ? 'حجز' : 'bookings'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Globe className="h-3.5 w-3.5" />
                        <span>{branch.timezone.split('/')[1]?.replace('_', ' ') ?? branch.timezone}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-2 border-t border-border/50">
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`switch-${branch.id}`} className="text-xs text-muted-foreground">
                          {branch.isActive
                            ? t(locale, 'branches', 'isActive')
                            : t(locale, 'common', 'inactive')}
                        </Label>
                        <Switch
                          id={`switch-${branch.id}`}
                          checked={branch.isActive}
                          onCheckedChange={(checked) =>
                            toggleMutation.mutate({ id: branch.id, isActive: checked })
                          }
                          disabled={toggleMutation.isPending}
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEdit(branch)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => openDelete(branch.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* ── Create Dialog ── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t(locale, 'branches', 'newBranch')}</DialogTitle>
            <DialogDescription>
              {isAr ? 'أدخل بيانات الفرع الجديد' : 'Enter the new branch details'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>{t(locale, 'branches', 'branchName')}</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder={t(locale, 'branches', 'branchName')}
              />
            </div>
            <div className="grid gap-2">
              <Label>{t(locale, 'branches', 'branchAddress')}</Label>
              <Input
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                placeholder={t(locale, 'branches', 'branchAddress')}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>{t(locale, 'branches', 'branchCity')}</Label>
                <Input
                  value={form.city}
                  onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                  placeholder={t(locale, 'branches', 'branchCity')}
                />
              </div>
              <div className="grid gap-2">
                <Label>{t(locale, 'branches', 'branchCountry')}</Label>
                <Input
                  value={form.country}
                  onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
                  placeholder={t(locale, 'branches', 'branchCountry')}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>{t(locale, 'branches', 'branchPhone')}</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder={t(locale, 'branches', 'branchPhone')}
                  dir="ltr"
                />
              </div>
              <div className="grid gap-2">
                <Label>{t(locale, 'branches', 'branchEmail')}</Label>
                <Input
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder={t(locale, 'branches', 'branchEmail')}
                  type="email"
                  dir="ltr"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>{t(locale, 'branches', 'branchTimezone')}</Label>
              <Select
                value={form.timezone}
                onValueChange={(val) => setForm((f) => ({ ...f, timezone: val }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timezones.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {isAr ? tz.labelAr : tz.labelEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3 pt-1">
              <Switch
                id="create-active"
                checked={form.isActive}
                onCheckedChange={(checked) =>
                  setForm((f) => ({ ...f, isActive: checked }))
                }
              />
              <Label htmlFor="create-active">
                {t(locale, 'branches', 'isActive')}
              </Label>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              {t(locale, 'common', 'cancel')}
            </Button>
            <Button
              onClick={handleCreate}
              disabled={createMutation.isPending || !form.name.trim()}
            >
              {createMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin me-2" />
              )}
              {t(locale, 'common', 'save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit Dialog ── */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t(locale, 'common', 'edit')}</DialogTitle>
            <DialogDescription>
              {t(locale, 'branches', 'manageBranch')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>{t(locale, 'branches', 'branchName')}</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder={t(locale, 'branches', 'branchName')}
              />
            </div>
            <div className="grid gap-2">
              <Label>{t(locale, 'branches', 'branchAddress')}</Label>
              <Input
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                placeholder={t(locale, 'branches', 'branchAddress')}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>{t(locale, 'branches', 'branchCity')}</Label>
                <Input
                  value={form.city}
                  onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                  placeholder={t(locale, 'branches', 'branchCity')}
                />
              </div>
              <div className="grid gap-2">
                <Label>{t(locale, 'branches', 'branchCountry')}</Label>
                <Input
                  value={form.country}
                  onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
                  placeholder={t(locale, 'branches', 'branchCountry')}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>{t(locale, 'branches', 'branchPhone')}</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder={t(locale, 'branches', 'branchPhone')}
                  dir="ltr"
                />
              </div>
              <div className="grid gap-2">
                <Label>{t(locale, 'branches', 'branchEmail')}</Label>
                <Input
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder={t(locale, 'branches', 'branchEmail')}
                  type="email"
                  dir="ltr"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>{t(locale, 'branches', 'branchTimezone')}</Label>
              <Select
                value={form.timezone}
                onValueChange={(val) => setForm((f) => ({ ...f, timezone: val }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timezones.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {isAr ? tz.labelAr : tz.labelEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3 pt-1">
              <Switch
                id="edit-active"
                checked={form.isActive}
                onCheckedChange={(checked) =>
                  setForm((f) => ({ ...f, isActive: checked }))
                }
              />
              <Label htmlFor="edit-active">
                {t(locale, 'branches', 'isActive')}
              </Label>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              {t(locale, 'common', 'cancel')}
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={updateMutation.isPending || !form.name.trim()}
            >
              {updateMutation.isPending && (
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
              {isAr ? `حذف "${selectedBranch?.name ?? ''}"؟` : `Delete "${selectedBranch?.name ?? ''}"?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isAr
                ? 'هل أنت متأكد من حذف هذا الفرع؟ لا يمكن التراجع عن هذا الإجراء.'
                : 'Are you sure you want to delete this branch? This action cannot be undone.'}
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