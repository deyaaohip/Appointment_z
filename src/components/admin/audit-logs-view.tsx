'use client'

import { authFetch } from '@/lib/auth-fetch'


import { useState, useEffect, useRef, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Download,
  ChevronLeft,
  ChevronRight,
  Search,
  Clock,
  Shield,
  CreditCard,
  Trash2,
  LogIn,
  LogOut,
  RefreshCw,
  ClipboardList,
  Plus,
  Globe,
} from 'lucide-react'
import { useAppStore } from '@/stores/app-store'
import { t, formatDateTime, getDirection, type Locale } from '@/lib/i18n'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// ─── Types ──────────────────────────────────────────────────────────────────

interface AuditLogUser {
  id: string
  name: string
  email: string
}

interface AuditLogEntry {
  id: string
  action: string
  entity: string
  entityId: string
  userId: string
  user?: AuditLogUser
  details: string
  ipAddress: string
  userAgent?: string
  createdAt: string
}

interface AuditLogsResponse {
  logs: AuditLogEntry[]
  total: number
  page: number
  totalPages: number
}

// ─── Constants ──────────────────────────────────────────────────────────────

const ACTION_ICONS: Record<string, React.ReactNode> = {
  create: <Plus className="h-3.5 w-3.5" />,
  update: <RefreshCw className="h-3.5 w-3.5" />,
  delete: <Trash2 className="h-3.5 w-3.5" />,
  login: <LogIn className="h-3.5 w-3.5" />,
  logout: <LogOut className="h-3.5 w-3.5" />,
  statusChange: <ClipboardList className="h-3.5 w-3.5" />,
  paymentProcessed: <CreditCard className="h-3.5 w-3.5" />,
}

const ACTION_STYLES: Record<string, string> = {
  create: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-400',
  update: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-400',
  delete: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-400',
  login: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-400',
  logout: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-900/40 dark:text-gray-400',
  statusChange: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-400',
  paymentProcessed: 'bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-900/40 dark:text-teal-400',
}

const ENTITY_ICONS: Record<string, React.ReactNode> = {
  auth: <Shield className="h-3.5 w-3.5 text-muted-foreground" />,
  payment: <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />,
}

const ENTITIES = ['all', 'booking', 'customer', 'employee', 'service', 'payment', 'auth', 'settings', 'subscription', 'coupon']
const ACTIONS_LIST = ['all', 'create', 'update', 'delete', 'login', 'logout', 'statusChange', 'paymentProcessed']

const PAGE_LIMIT = 20

const SEARCH_DEBOUNCE_MS = 400

// ─── Skeleton loader ────────────────────────────────────────────────────────

function TableSkeleton() {
  return (
    <div className="space-y-0">
      {/* Header skeleton */}
      <div className="flex items-center gap-4 px-4 py-3 bg-muted/50">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {/* Row skeletons */}
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-4 border-b">
          <Skeleton className="h-4 w-8" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-28" />
        </div>
      ))}
    </div>
  )
}

// ─── CSV Export ──────────────────────────────────────────────────────────────

function exportLogsToCsv(logs: AuditLogEntry[], locale: Locale) {
  const headers = [
    t(locale, 'common', 'date'),
    t(locale, 'auditLog', 'user'),
    t(locale, 'auditLog', 'action'),
    t(locale, 'auditLog', 'entity'),
    t(locale, 'auditLog', 'details'),
    t(locale, 'auditLog', 'ipAddress'),
  ]

  const rows = logs.map((log) => [
    formatDateTime(log.createdAt, locale),
    log.user?.name ?? log.userId,
    log.action,
    `${log.entity}:${log.entityId}`,
    log.details,
    log.ipAddress,
  ])

  const escapeCsv = (value: string) => {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`
    }
    return value
  }

  const csv = [headers.map(escapeCsv).join(','), ...rows.map((r) => r.map(escapeCsv).join(','))].join('\n')

  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function AuditLogsView() {
  const { locale } = useAppStore()
  const dir = getDirection(locale)

  // ── Filter & pagination state ──
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterEntity, setFilterEntity] = useState('all')
  const [filterAction, setFilterAction] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)

  // ── Debounced search ──
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value)
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => {
      setSearchQuery(value)
      setPage(1)
    }, SEARCH_DEBOUNCE_MS)
  }, [])

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
    }
  }, [])

  // ── API Query ──
  const { data, isLoading, isError } = useQuery<AuditLogsResponse>({
    queryKey: ['audit-logs', page, searchQuery, filterAction, filterEntity, dateFrom, dateTo],
    queryFn: async () => {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('limit', String(PAGE_LIMIT))
      if (searchQuery.trim()) params.set('search', searchQuery.trim())
      if (filterAction !== 'all') params.set('action', filterAction)
      if (filterEntity !== 'all') params.set('entity', filterEntity)
      if (dateFrom) params.set('dateFrom', dateFrom)
      if (dateTo) params.set('dateTo', dateTo)

      const res = await authFetch(`/api/audit-logs?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch audit logs')
      return res.json()
    },
  })

  const logs = data?.logs ?? []
  const totalPages = data?.totalPages ?? 1
  const total = data?.total ?? 0

  const resetFilters = () => {
    setSearchInput('')
    setSearchQuery('')
    setFilterEntity('all')
    setFilterAction('all')
    setDateFrom('')
    setDateTo('')
    setPage(1)
  }

  const handleExport = () => {
    if (logs.length === 0) {
      toast.info(locale === 'ar' ? 'لا توجد سجلات للتصدير' : 'No logs to export')
      return
    }
    exportLogsToCsv(logs, locale)
    toast.success(locale === 'ar' ? 'تم تصدير السجلات بنجاح' : 'Audit logs exported successfully')
  }

  return (
    <div dir={dir} className="space-y-6 animate-in fade-in-0">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t(locale, 'auditLog', 'title')}</h1>
          <p className="text-sm text-muted-foreground">
            {total} {t(locale, 'common', 'results')}
          </p>
        </div>
        <Button
          variant="outline"
          className="gap-2"
          onClick={handleExport}
          disabled={isLoading || logs.length === 0}
        >
          <Download className="h-4 w-4" />
          {t(locale, 'auditLog', 'exportLogs')}
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="space-y-3 p-4">
          {/* Row 1: Date range + Search */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Label className="mb-1.5 block text-xs text-muted-foreground">
                {t(locale, 'common', 'from')}
              </Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => { setDateFrom(e.target.value); setPage(1) }}
                dir="ltr"
              />
            </div>
            <div className="flex-1">
              <Label className="mb-1.5 block text-xs text-muted-foreground">
                {t(locale, 'common', 'to')}
              </Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => { setDateTo(e.target.value); setPage(1) }}
                dir="ltr"
              />
            </div>
            <div className="flex-[2]">
              <div className="relative">
                <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={t(locale, 'auditLog', 'filterByUser')}
                  value={searchInput}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="ps-9"
                />
              </div>
            </div>
          </div>

          {/* Row 2: Entity + Action selects */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Select value={filterEntity} onValueChange={(v) => { setFilterEntity(v); setPage(1) }}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder={t(locale, 'auditLog', 'filterByEntity')} />
              </SelectTrigger>
              <SelectContent>
                {ENTITIES.map((e) => (
                  <SelectItem key={e} value={e}>
                    {e === 'all' ? t(locale, 'common', 'all') : e.charAt(0).toUpperCase() + e.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterAction} onValueChange={(v) => { setFilterAction(v); setPage(1) }}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder={t(locale, 'auditLog', 'filterByAction')} />
              </SelectTrigger>
              <SelectContent>
                {ACTIONS_LIST.map((a) => (
                  <SelectItem key={a} value={a}>
                    {a === 'all' ? t(locale, 'common', 'all') : t(locale, 'auditLog', a)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="ghost" size="sm" onClick={resetFilters} className="shrink-0">
              {locale === 'ar' ? 'مسح الفلاتر' : 'Clear Filters'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <TableSkeleton />
          ) : isError ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="rounded-full bg-destructive/10 p-4 mb-4">
                <Shield className="h-8 w-8 text-destructive" />
              </div>
              <h3 className="text-lg font-semibold text-muted-foreground">
                {locale === 'ar' ? 'خطأ في تحميل السجلات' : 'Failed to load audit logs'}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {locale === 'ar' ? 'يرجى المحاولة مرة أخرى لاحقاً' : 'Please try again later'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-10">#</TableHead>
                  <TableHead>{t(locale, 'common', 'date')}</TableHead>
                  <TableHead>{t(locale, 'auditLog', 'user')}</TableHead>
                  <TableHead>{t(locale, 'auditLog', 'action')}</TableHead>
                  <TableHead>{t(locale, 'auditLog', 'entity')}</TableHead>
                  <TableHead>{t(locale, 'auditLog', 'details')}</TableHead>
                  <TableHead>{t(locale, 'auditLog', 'ipAddress')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                      {t(locale, 'auditLog', 'noLogsFound')}
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log, i) => (
                    <TableRow key={log.id} className="border-b hover:bg-muted/30 transition-colors animate-in fade-in-0 slide-in-from-bottom-2" style={{ animationDelay: `${0.05 + i * 0.03}s`, animationFillMode: 'backwards' }}>
                      <TableCell className="text-center text-xs text-muted-foreground font-mono">
                        {(page - 1) * PAGE_LIMIT + i + 1}
                      </TableCell>
                      <TableCell className="text-sm whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                          {formatDateTime(log.createdAt, locale)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold">
                            {(log.user?.name ?? log.userId)[0]}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium leading-tight">{log.user?.name ?? '—'}</span>
                            {log.user?.email && (
                              <span className="text-xs text-muted-foreground">{log.user.email}</span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`gap-1 text-xs ${ACTION_STYLES[log.action] ?? ''}`}>
                          {ACTION_ICONS[log.action]}
                          {t(locale, 'auditLog', log.action)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm">
                          {ENTITY_ICONS[log.entity] ?? <Globe className="h-3.5 w-3.5 text-muted-foreground" />}
                          <span className="capitalize">{log.entity}</span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-60">
                        <p className="truncate text-sm text-muted-foreground">{log.details}</p>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                        {log.ipAddress}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            </div>
          )}

          {/* Pagination */}
          {!isLoading && totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/30">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                {locale === 'ar' ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              </Button>
              <span className="text-sm text-muted-foreground">
                {page} / {totalPages}
              </span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                {locale === 'ar' ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
