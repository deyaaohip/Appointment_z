'use client'

import { authFetch } from '@/lib/auth-fetch'


import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  FolderOpen,
  CalendarDays,
  Users,
  Monitor,
} from 'lucide-react'
import { useAppStore } from '@/stores/app-store'
import { t, getDirection } from '@/lib/i18n'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

// ─── Types ──────────────────────────────────────────────────────────────────

interface ServiceCategoryData {
  id: string
  name: string
  color: string | null
  icon: string | null
  isActive: boolean
}

interface ServiceRow {
  id: string
  name: string
  isActive: boolean
  categoryId: string
  category: ServiceCategoryData | null
  _count?: { employees: number; bookings: number }
}

interface CategoryResource {
  id: string
  name: string
  color: string | null
  icon: string | null
  isActive: boolean
  serviceCount: number
  totalBookings: number
  totalEmployees: number
  activeServiceCount: number
}

type CategoryStatus = 'active' | 'inactive'

const STATUS_STYLES: Record<CategoryStatus, { dot: string; badge: string }> = {
  active: { dot: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-400' },
  inactive: { dot: 'bg-gray-400', badge: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-900/40 dark:text-gray-400' },
}

const STATUS_LABELS: Record<CategoryStatus, string> = {
  active: 'resources.available',
  inactive: 'resources.unavailable',
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function ResourcesView() {
  const { locale } = useAppStore()
  const dir = getDirection(locale)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // ── Fetch services & extract categories ──
  const { data: servicesData, isLoading, isError } = useQuery({
    queryKey: ['services', 'resources'],
    queryFn: async () => {
      const res = await authFetch('/api/services')
      if (!res.ok) throw new Error('Failed to fetch services')
      return res.json() as Promise<{ services: ServiceRow[] }>
    },
  })

  const services = servicesData?.services ?? []

  const categories = useMemo<CategoryResource[]>(() => {
    const map = new Map<string, CategoryResource>()
    for (const s of services) {
      if (!s.category) continue
      const cat = s.category
      if (map.has(cat.id)) {
        const existing = map.get(cat.id)!
        existing.serviceCount++
        existing.totalBookings += s._count?.bookings ?? 0
        existing.totalEmployees += s._count?.employees ?? 0
        if (s.isActive) existing.activeServiceCount++
      } else {
        map.set(cat.id, {
          id: cat.id,
          name: cat.name,
          color: cat.color,
          icon: cat.icon,
          isActive: cat.isActive,
          serviceCount: 1,
          totalBookings: s._count?.bookings ?? 0,
          totalEmployees: s._count?.employees ?? 0,
          activeServiceCount: s.isActive ? 1 : 0,
        })
      }
    }
    return Array.from(map.values())
  }, [services])

  const filteredResources = useMemo(() => {
    return categories.filter((r) => {
      const matchesSearch =
        !searchQuery ||
        r.name.toLowerCase().includes(searchQuery.toLowerCase())
      const statusKey: CategoryStatus = r.isActive ? 'active' : 'inactive'
      const matchesStatus = statusFilter === 'all' || statusFilter === statusKey
      return matchesSearch && matchesStatus
    })
  }, [categories, searchQuery, statusFilter])

  const statusOptions: { key: string; labelKey: string }[] = [
    { key: 'all', labelKey: 'common.all' },
    { key: 'active', labelKey: 'resources.available' },
    { key: 'inactive', labelKey: 'resources.unavailable' },
  ]

  const { setCurrentView } = useAppStore()

  const handleManageAction = (action: 'add' | 'edit' | 'delete') => {
    if (action === 'add' || action === 'edit') {
      setCurrentView('services')
      toast.success(locale === 'ar' ? 'تم التحويل لصفحة الخدمات' : 'Redirected to Services page')
    } else if (action === 'delete') {
      toast.success(locale === 'ar' ? 'يتم إدارة الموارد من خلال تصنيفات الخدمات' : 'Resource management is handled through service categories')
    }
  }

  return (
    <div
      dir={dir}
      className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-1 duration-300"
    >
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t(locale, 'resources', 'title')}</h1>
          <p className="text-sm text-muted-foreground">
            {!isLoading && (
              <>
                {filteredResources.length} {t(locale, 'common', 'results')}
              </>
            )}
          </p>
        </div>
        <Button
          className="gap-2 bg-emerald-600 hover:bg-emerald-700"
          onClick={() => handleManageAction('add')}
        >
          <Plus className="h-4 w-4" />
          {t(locale, 'resources', 'addResource')}
        </Button>
      </div>

      {/* Filters */}
      <div dir={dir} className="animate-in fade-in-0 slide-in-from-bottom-2 duration-300" style={{ animationDelay: '50ms', animationFillMode: 'backwards' }}>
        <Card>
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t(locale, 'common', 'search') + '...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="ps-9"
              />
            </div>

            <ToggleGroup type="single" value={statusFilter} onValueChange={(v) => { if (v) setStatusFilter(v) }}>
              {statusOptions.map((opt) => {
                const parts = opt.labelKey.split('.')
                const label = t(locale, parts[0], parts[1])
                return (
                  <ToggleGroupItem key={opt.key} value={opt.key} className="text-xs px-3">
                    {label}
                  </ToggleGroupItem>
                )
              })}
            </ToggleGroup>
          </CardContent>
        </Card>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="h-full">
              <CardContent className="flex flex-col gap-3 p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-9 w-9 rounded-lg" />
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                  <Skeleton className="h-2.5 w-2.5 rounded-full" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-20 rounded-full" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <div className="flex items-center justify-between pt-2 border-t">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-1.5 w-full rounded-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Error State */}
      {isError && (
        <Card className="col-span-full">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 rounded-xl bg-destructive/10 p-4">
              <Monitor className="h-8 w-8 text-destructive" />
            </div>
            <p className="text-muted-foreground">
              {locale === 'ar' ? 'حدث خطأ أثناء تحميل البيانات' : 'Failed to load resources'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {locale === 'ar' ? 'يرجى المحاولة مرة أخرى' : 'Please try again'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Resource Cards Grid */}
      {!isLoading && !isError && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredResources.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-4 rounded-xl bg-muted p-4">
                  <Monitor className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">{t(locale, 'resources', 'noResourcesFound')}</p>
              </CardContent>
            </Card>
          ) : (
            filteredResources.map((resource, idx) => {
              const statusKey: CategoryStatus = resource.isActive ? 'active' : 'inactive'
              const statusStyle = STATUS_STYLES[statusKey]
              const parts = STATUS_LABELS[statusKey].split('.')
              const statusLabel = t(locale, parts[0], parts[1])

              return (
                <div
                  key={resource.id}
                  className="animate-in fade-in-0 slide-in-from-bottom-3 duration-300"
                  style={{ animationDelay: `${idx * 50}ms`, animationFillMode: 'backwards' }}
                >
                  <Card className="h-full transition-all hover:shadow-md hover:border-emerald-200 dark:hover:border-emerald-800">
                    <CardContent className="flex flex-col gap-3 p-4">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white"
                            style={{ backgroundColor: resource.color || '#10b981' }}
                          >
                            <FolderOpen className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold truncate">{resource.name}</p>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                              <Users className="h-3 w-3" />
                              {resource.totalEmployees} {locale === 'ar' ? 'موظف' : 'employees'}
                            </div>
                          </div>
                        </div>
                        <span className={cn('h-2.5 w-2.5 rounded-full shrink-0 mt-1.5', statusStyle.dot)} />
                      </div>

                      {/* Badges */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="gap-1 text-xs">
                          <FolderOpen className="h-3 w-3" />
                          {locale === 'ar' ? 'تصنيف خدمة' : 'Service Category'}
                        </Badge>
                        <Badge variant="outline" className={cn('text-xs', statusStyle.badge)}>
                          {statusLabel}
                        </Badge>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center justify-between pt-2 border-t text-sm">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <FolderOpen className="h-4 w-4" />
                          <span>{resource.serviceCount} {locale === 'ar' ? 'خدمة' : 'services'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <CalendarDays className="h-4 w-4" />
                          <span>{resource.totalBookings} {locale === 'ar' ? 'حجز' : 'bookings'}</span>
                        </div>
                      </div>

                      {/* Active services bar */}
                      <div className="space-y-1">
                        <div className="h-1.5 w-full rounded-full bg-muted">
                          <div
                            className={cn(
                              'h-full rounded-full transition-all',
                              resource.activeServiceCount / resource.serviceCount >= 0.7
                                ? 'bg-emerald-500'
                                : 'bg-amber-500'
                            )}
                            style={{
                              width: `${Math.round((resource.activeServiceCount / Math.max(1, resource.serviceCount)) * 100)}%`,
                            }}
                          />
                        </div>
                        <p className="text-[10px] text-muted-foreground text-end">
                          {resource.activeServiceCount}/{resource.serviceCount} {locale === 'ar' ? 'نشطة' : 'active'}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1.5 pt-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 gap-1 text-xs text-muted-foreground hover:text-foreground"
                          onClick={() => handleManageAction('edit')}
                        >
                          <Pencil className="h-3 w-3" />
                          {t(locale, 'resources', 'editResource')}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 gap-1 text-xs text-destructive hover:text-destructive"
                          onClick={() => handleManageAction('delete')}
                        >
                          <Trash2 className="h-3 w-3" />
                          {t(locale, 'resources', 'deleteResource')}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}