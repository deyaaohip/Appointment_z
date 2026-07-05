'use client'

import { authFetch } from '@/lib/auth-fetch'


import { useState, useMemo, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { z } from 'zod'
import {
  Plus,
  Clock,
  Pencil,
  Trash2,
  X,
  Loader2,
  Inbox,
  Search,
  ChevronDown,
  Users,
  Scissors,
  ArrowUpDown,
  Timer,
} from 'lucide-react'

import { useAppStore } from '@/stores/app-store'
import { t, formatCurrency, type Locale } from '@/lib/i18n'
import { toast } from '@/hooks/use-toast'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'

// ─── Types ──────────────────────────────────────────────────────────────────

interface ServiceCategory {
  id: string
  name: string
  color: string | null
  icon: string | null
  isActive: boolean
}

interface ServiceRow {
  id: string
  name: string
  description: string | null
  duration: number
  bufferBefore: number
  bufferAfter: number
  price: number
  variablePrice: boolean
  minPrice: number | null
  maxPrice: number | null
  isActive: boolean
  maxCapacity: number
  taxRate: number
  categoryId: string
  category: ServiceCategory | null
  _count?: { employees: number; bookings: number }
}

// ─── Schema ─────────────────────────────────────────────────────────────────

const serviceFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional().default(''),
  categoryId: z.string().min(1, 'Category is required'),
  duration: z.coerce.number().int().min(5, 'Min 5 minutes'),
  bufferBefore: z.coerce.number().int().min(0).default(0),
  bufferAfter: z.coerce.number().int().min(0).default(0),
  price: z.coerce.number().min(0).default(0),
  variablePrice: z.boolean().default(false),
  maxCapacity: z.coerce.number().int().min(1).default(1),
  taxRate: z.coerce.number().min(0).max(100).default(15),
  isActive: z.boolean().default(true),
})

type ServiceFormValues = z.infer<typeof serviceFormSchema>

const emptyForm: ServiceFormValues = {
  name: '',
  description: '',
  categoryId: '',
  duration: 30,
  bufferBefore: 0,
  bufferAfter: 0,
  price: 0,
  variablePrice: false,
  maxCapacity: 1,
  taxRate: 15,
  isActive: true,
}

// ─── Animation ──────────────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
}

const stagger = {
  visible: { transition: { staggerChildren: 0.04 } },
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function ServicesView() {
  const { locale } = useAppStore()
  const queryClient = useQueryClient()
  const isAr = locale === 'ar'

  // ── State ──
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [form, setForm] = useState<ServiceFormValues>(emptyForm)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set())

  // ── Queries ──
  const { data: servicesData, isLoading: servicesLoading } = useQuery({
    queryKey: ['services', categoryFilter, search],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (categoryFilter && categoryFilter !== 'all') params.set('categoryId', categoryFilter)
      if (search) params.set('search', search)
      const res = await authFetch(`/api/services?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch services')
      return res.json() as Promise<{ services: ServiceRow[] }>
    },
  })

  const services = servicesData?.services ?? []

  // ── Group by category ──
  const categories = useMemo(() => {
    const map = new Map<string, { category: ServiceCategory | null; services: ServiceRow[] }>()
    for (const s of services) {
      const key = s.categoryId || 'uncategorized'
      if (!map.has(key)) {
        map.set(key, { category: s.category, services: [] })
      }
      map.get(key)!.services.push(s)
    }
    return Array.from(map.entries())
  }, [services])

  const allCategories = useMemo(() => {
    const seen = new Set<string>()
    const result: ServiceCategory[] = []
    for (const s of services) {
      if (s.category && !seen.has(s.category.id)) {
        seen.add(s.category.id)
        result.push(s.category)
      }
    }
    return result
  }, [services])

  const toggleCollapse = useCallback((catId: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(catId)) next.delete(catId)
      else next.add(catId)
      return next
    })
  }, [])

  // ── Mutations ──
  const createMutation = useMutation({
    mutationFn: async (values: ServiceFormValues) => {
      const res = await authFetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Create failed')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] })
      setCreateOpen(false)
      setForm(emptyForm)
      setFormErrors({})
      toast({ title: isAr ? 'تم إنشاء الخدمة بنجاح' : 'Service created successfully', variant: 'default' })
    },
    onError: (err) => {
      toast({ title: err.message, variant: 'destructive' })
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: ServiceFormValues }) => {
      const res = await authFetch(`/api/services/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Update failed')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] })
      setEditOpen(false)
      setSelectedId(null)
      setForm(emptyForm)
      setFormErrors({})
      toast({ title: isAr ? 'تم تحديث الخدمة بنجاح' : 'Service updated successfully', variant: 'default' })
    },
    onError: (err) => {
      toast({ title: err.message, variant: 'destructive' })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await authFetch(`/api/services/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Delete failed')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] })
      setDeleteOpen(false)
      setSelectedId(null)
      toast({ title: isAr ? 'تم حذف الخدمة' : 'Service has been deleted', variant: 'default' })
    },
    onError: (err) => {
      toast({ title: err.message, variant: 'destructive' })
    },
  })

  // ── Handlers ──
  const openCreate = useCallback(() => {
    setForm(emptyForm)
    setFormErrors({})
    setCreateOpen(true)
  }, [])

  const openEdit = useCallback((s: ServiceRow) => {
    setForm({
      name: s.name,
      description: s.description || '',
      categoryId: s.categoryId,
      duration: s.duration,
      bufferBefore: s.bufferBefore,
      bufferAfter: s.bufferAfter,
      price: s.price,
      variablePrice: s.variablePrice,
      maxCapacity: s.maxCapacity,
      taxRate: s.taxRate,
      isActive: s.isActive,
    })
    setFormErrors({})
    setSelectedId(s.id)
    setEditOpen(true)
  }, [])

  const openDelete = useCallback((id: string) => {
    setSelectedId(id)
    setDeleteOpen(true)
  }, [])

  const validateForm = useCallback((): boolean => {
    const result = serviceFormSchema.safeParse(form)
    if (!result.success) {
      const errors: Record<string, string> = {}
      for (const issue of result.error.issues) {
        const key = issue.path[0] as string
        if (!errors[key]) errors[key] = issue.message
      }
      setFormErrors(errors)
      return false
    }
    setFormErrors({})
    return true
  }, [form])

  const handleCreate = useCallback(() => {
    if (validateForm()) createMutation.mutate(form)
  }, [validateForm, createMutation, form])

  const handleUpdate = useCallback(() => {
    if (selectedId && validateForm()) updateMutation.mutate({ id: selectedId, values: form })
  }, [selectedId, validateForm, updateMutation, form])

  const updateField = useCallback(
    <K extends keyof ServiceFormValues>(key: K, value: ServiceFormValues[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }))
      setFormErrors((prev) => {
        const next = { ...prev }
        delete next[key]
        return next
      })
    },
    []
  )

  // ── Skeleton ──
  if (servicesLoading) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-10 w-full md:w-64" />
          <Skeleton className="h-10 w-full md:w-48" />
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-10 w-56" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2].map((j) => (
                <Skeleton key={j} className="h-44 rounded-xl" />
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t(locale, 'services', 'title')}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {services.length} {t(locale, 'services', 'title')}
          </p>
        </div>
        <Button onClick={openCreate} className="bg-emerald-600 hover:bg-emerald-700 text-white">
          <Plus className="h-4 w-4 me-2" />
          {t(locale, 'services', 'newService')}
        </Button>
      </motion.div>

      {/* ── Filters ── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="flex flex-col gap-3 sm:flex-row sm:items-center"
      >
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute top-1/2 start-3 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t(locale, 'services', 'searchServices')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ps-9"
          />
        </div>
        <Select value={categoryFilter || 'all'} onValueChange={(v) => setCategoryFilter(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-full sm:w-52">
            <SelectValue placeholder={t(locale, 'services', 'categories')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t(locale, 'common', 'all')}</SelectItem>
            {allCategories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </motion.div>

      {/* ── Services by Category ── */}
      {categories.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          <div className="rounded-full bg-emerald-50 dark:bg-emerald-950/30 p-4 mb-4">
            <Inbox className="h-10 w-10 text-emerald-500" />
          </div>
          <h3 className="text-lg font-semibold">{t(locale, 'services', 'noServicesFound')}</h3>
          <p className="text-muted-foreground text-sm mt-1 mb-4">
            {isAr ? 'ابدأ بإضافة خدماتك الأولى' : 'Start by adding your first services'}
          </p>
          <Button onClick={openCreate} variant="outline" className="border-emerald-600 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30">
            <Plus className="h-4 w-4 me-2" />
            {t(locale, 'services', 'newService')}
          </Button>
        </motion.div>
      ) : (
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          {categories.map(([catId, group]) => {
            const isCollapsed = collapsedCategories.has(catId)
            return (
              <Collapsible
                key={catId}
                open={!isCollapsed}
                onOpenChange={(open) => {
                  if (!open) toggleCollapse(catId)
                  else toggleCollapse(catId)
                }}
              >
                <CollapsibleTrigger asChild>
                  <button className="flex items-center gap-3 w-full group mb-3 hover:opacity-80 transition-opacity">
                    <div
                      className="h-3 w-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: group.category?.color || '#10b981' }}
                    />
                    <h2 className="text-lg font-semibold flex-1 text-start">
                      {group.category?.name || (isAr ? 'غير مصنف' : 'Uncategorized')}
                    </h2>
                    <Badge variant="secondary" className="text-xs">
                      {group.services.length}
                    </Badge>
                    <ChevronDown
                      className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isCollapsed ? '' : 'rotate-180'}`}
                    />
                  </button>
                </CollapsibleTrigger>
                <AnimatePresence>
                  {!isCollapsed && (
                    <CollapsibleContent forceMount>
                      <motion.div
                        variants={stagger}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                      >
                        {group.services.map((service) => (
                          <motion.div key={service.id} variants={fadeUp} layout>
                            <Card className="group/card hover:shadow-md transition-all duration-200 border-border/60 hover:border-emerald-200 dark:hover:border-emerald-800">
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between gap-2 mb-3">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <h3 className="font-semibold truncate">{service.name}</h3>
                                      <Badge
                                        variant={service.isActive ? 'default' : 'secondary'}
                                        className={
                                          service.isActive
                                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 text-[10px] px-1.5 py-0'
                                            : 'text-[10px] px-1.5 py-0'
                                        }
                                      >
                                        {service.isActive
                                          ? t(locale, 'services', 'active')
                                          : t(locale, 'services', 'inactive')}
                                      </Badge>
                                    </div>
                                    {service.description && (
                                      <p className="text-muted-foreground text-xs mt-1 line-clamp-2">
                                        {service.description}
                                      </p>
                                    )}
                                  </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground mb-3">
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3.5 w-3.5 text-emerald-500" />
                                    {service.duration} {t(locale, 'services', 'minutes')}
                                  </span>
                                  {service.bufferBefore > 0 && (
                                    <span className="flex items-center gap-1">
                                      <Timer className="h-3.5 w-3.5" />
                                      +{service.bufferBefore}{isAr ? '' : 'm'} {t(locale, 'services', 'bufferBefore').split(' ').slice(-1)[0]}
                                    </span>
                                  )}
                                  {service.bufferAfter > 0 && (
                                    <span className="flex items-center gap-1">
                                      <Timer className="h-3.5 w-3.5" />
                                      +{service.bufferAfter}{isAr ? '' : 'm'} {t(locale, 'services', 'bufferAfter').split(' ').slice(-1)[0]}
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center justify-between">
                                  <div>
                                    <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                                      {formatCurrency(service.price, 'SAR', locale)}
                                    </span>
                                    {service.variablePrice && (
                                      <span className="text-[10px] text-muted-foreground ms-1">
                                        ({isAr ? 'متغير' : 'variable'})
                                      </span>
                                    )}
                                  </div>
                                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Users className="h-3.5 w-3.5" />
                                    {service._count?.employees || 0}
                                  </span>
                                </div>

                                <Separator className="my-3" />

                                <div className="flex items-center justify-end gap-1.5">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-muted-foreground hover:text-emerald-600"
                                    onClick={() => openEdit(service)}
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-muted-foreground hover:text-red-500"
                                    onClick={() => openDelete(service.id)}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        ))}
                      </motion.div>
                    </CollapsibleContent>
                  )}
                </AnimatePresence>
              </Collapsible>
            )
          })}
        </motion.div>
      )}

      {/* ── Create / Edit Dialog ── */}
      <Dialog open={createOpen || editOpen} onOpenChange={(open) => {
        if (!open) {
          setCreateOpen(false)
          setEditOpen(false)
          setForm(emptyForm)
          setFormErrors({})
          setSelectedId(null)
        }
      }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {createOpen ? t(locale, 'services', 'newService') : isAr ? 'تعديل الخدمة' : 'Edit Service'}
            </DialogTitle>
            <DialogDescription>
              {createOpen
                ? (isAr ? 'أدخل بيانات الخدمة الجديدة' : 'Enter the new service details')
                : (isAr ? 'قم بتعديل بيانات الخدمة' : 'Update the service details')}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-5 py-2">
            {/* Name */}
            <div className="grid gap-2">
              <Label>{t(locale, 'services', 'serviceName')}</Label>
              <Input
                value={form.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder={isAr ? 'اسم الخدمة' : 'Service name'}
              />
              {formErrors.name && <p className="text-red-500 text-xs">{formErrors.name}</p>}
            </div>

            {/* Description */}
            <div className="grid gap-2">
              <Label>{t(locale, 'services', 'serviceDescription')}</Label>
              <Textarea
                value={form.description}
                onChange={(e) => updateField('description', e.target.value)}
                placeholder={isAr ? 'وصف الخدمة (اختياري)' : 'Service description (optional)'}
                rows={3}
              />
            </div>

            {/* Category + Duration */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>{t(locale, 'services', 'category')}</Label>
                <Select value={form.categoryId} onValueChange={(v) => updateField('categoryId', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder={isAr ? 'اختر التصنيف' : 'Select category'} />
                  </SelectTrigger>
                  <SelectContent>
                    {allCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.categoryId && <p className="text-red-500 text-xs">{formErrors.categoryId}</p>}
              </div>
              <div className="grid gap-2">
                <Label>{t(locale, 'services', 'duration')} ({t(locale, 'services', 'minutes')})</Label>
                <Input
                  type="number"
                  min={5}
                  value={form.duration}
                  onChange={(e) => updateField('duration', Number(e.target.value))}
                />
                {formErrors.duration && <p className="text-red-500 text-xs">{formErrors.duration}</p>}
              </div>
            </div>

            {/* Buffer Before / After */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>{t(locale, 'services', 'bufferBefore')} ({t(locale, 'services', 'minutes')})</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.bufferBefore}
                  onChange={(e) => updateField('bufferBefore', Number(e.target.value))}
                />
              </div>
              <div className="grid gap-2">
                <Label>{t(locale, 'services', 'bufferAfter')} ({t(locale, 'services', 'minutes')})</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.bufferAfter}
                  onChange={(e) => updateField('bufferAfter', Number(e.target.value))}
                />
              </div>
            </div>

            {/* Price + Variable + Tax Rate */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label>{t(locale, 'services', 'basePrice')} (SAR)</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={form.price}
                  onChange={(e) => updateField('price', Number(e.target.value))}
                />
              </div>
              <div className="grid gap-2">
                <Label>{t(locale, 'services', 'maxCapacity')}</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.maxCapacity}
                  onChange={(e) => updateField('maxCapacity', Number(e.target.value))}
                />
                {formErrors.maxCapacity && <p className="text-red-500 text-xs">{formErrors.maxCapacity}</p>}
              </div>
              <div className="grid gap-2">
                <Label>{t(locale, 'services', 'taxRate')} (%)</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  value={form.taxRate}
                  onChange={(e) => updateField('taxRate', Number(e.target.value))}
                />
              </div>
            </div>

            {/* Variable Price Toggle + Active Toggle */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8">
              <div className="flex items-center gap-3">
                <Switch
                  checked={form.variablePrice}
                  onCheckedChange={(checked) => updateField('variablePrice', checked)}
                  className="data-[state=checked]:bg-emerald-600"
                />
                <Label className="cursor-pointer">{t(locale, 'services', 'variablePrice')}</Label>
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  checked={form.isActive}
                  onCheckedChange={(checked) => updateField('isActive', checked)}
                  className="data-[state=checked]:bg-emerald-600"
                />
                <Label className="cursor-pointer">{t(locale, 'services', 'active')}</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCreateOpen(false)
                setEditOpen(false)
                setForm(emptyForm)
                setFormErrors({})
              }}
            >
              {t(locale, 'common', 'cancel')}
            </Button>
            <Button
              onClick={createOpen ? handleCreate : handleUpdate}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {(createMutation.isPending || updateMutation.isPending) && (
                <Loader2 className="h-4 w-4 me-2 animate-spin" />
              )}
              {t(locale, 'common', 'save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation ── */}
      <AlertDialog open={deleteOpen} onOpenChange={(open) => {
        if (!open) {
          setDeleteOpen(false)
          setSelectedId(null)
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isAr ? 'حذف الخدمة' : 'Delete Service'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isAr
                ? 'هل أنت متأكد من حذف هذه الخدمة؟ سيتم تعطيلها ولن تظهر للعملاء.'
                : 'Are you sure you want to delete this service? It will be deactivated and hidden from customers.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t(locale, 'common', 'cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedId && deleteMutation.mutate(selectedId)}
              disabled={deleteMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
              {t(locale, 'common', 'delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}