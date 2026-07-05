'use client'

import { authFetch } from '@/lib/auth-fetch'


import { useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  DollarSign,
  CalendarDays,
  Users,
  UserCog,
  XCircle,
  Wrench,
  FileDown,
  FileSpreadsheet,
  Printer,
  TrendingUp,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'
import { useAppStore } from '@/stores/app-store'
import { t, formatCurrency, formatDate, getDirection } from '@/lib/i18n'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { cn } from '@/lib/utils'

// ─── Types ──────────────────────────────────────────────────────────────────

interface DashboardKpis {
  totalRevenue: number
  totalBookings: number
  totalCustomers: number
  totalEmployees: number
  occupancyRate: number
  noShowRate: number
  conversionRate: number
  todaysBookings: number
  revenueTrend: number
  bookingsTrend: number
  customersTrend: number
  employeesTrend: number
  occupancyTrend: number
  noShowTrend: number
  conversionTrend: number
  todaysBookingsTrend: number
}

interface MonthlyRevenuePoint {
  month: string
  revenue: number
}

interface WeeklyBookingPoint {
  day: string
  count: number
}

interface TopService {
  name: string
  bookingsCount: number
  revenue: number
}

interface TopEmployee {
  name: string
  completed: number
  revenue: number
  rating: number
}

interface RecentBooking {
  id: string
  customerName: string
  serviceName: string
  date: string
  time: string
  status: string
  amount: number
}

interface DashboardData {
  kpis: DashboardKpis
  monthlyRevenue: MonthlyRevenuePoint[]
  weeklyBookings: WeeklyBookingPoint[]
  topServices: TopService[]
  topEmployees: TopEmployee[]
  recentBookings: RecentBooking[]
}

// ─── Chart Configs ──────────────────────────────────────────────────────────

const revenueChartConfig = {
  revenue: {
    label: 'Revenue',
    color: 'hsl(160, 84%, 39%)',
  },
} as const

const bookingsChartConfig = {
  count: {
    label: 'Bookings',
    color: 'hsl(160, 84%, 39%)',
  },
} as const

// ─── Report Types ───────────────────────────────────────────────────────────

interface ReportType {
  key: string
  icon: React.ReactNode
  titleKey: string
  descKey: string
  color: string
}

const REPORT_TYPES: ReportType[] = [
  { key: 'revenue', icon: <DollarSign className="h-6 w-6" />, titleKey: 'revenueReport', descKey: 'totalRevenue', color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30' },
  { key: 'bookings', icon: <CalendarDays className="h-6 w-6" />, titleKey: 'bookingsReport', descKey: 'averagePerBooking', color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30' },
  { key: 'customers', icon: <Users className="h-6 w-6" />, titleKey: 'customersReport', descKey: 'customerRetention', color: 'text-violet-600 bg-violet-100 dark:bg-violet-900/30' },
  { key: 'employees', icon: <UserCog className="h-6 w-6" />, titleKey: 'employeesReport', descKey: 'common.name', color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30' },
  { key: 'cancellations', icon: <XCircle className="h-6 w-6" />, titleKey: 'noShowsReport', descKey: 'totalRefunds', color: 'text-red-600 bg-red-100 dark:bg-red-900/30' },
  { key: 'services', icon: <Wrench className="h-6 w-6" />, titleKey: 'servicesReport', descKey: 'common.description', color: 'text-teal-600 bg-teal-100 dark:bg-teal-900/30' },
]

// ─── Skeleton Sub-components ────────────────────────────────────────────────

function KpiCardSkeleton() {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-4">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-3.5 w-16" />
        </div>
        <Skeleton className="h-5 w-14 rounded-md" />
      </CardContent>
    </Card>
  )
}

function ChartCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-40" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[260px] w-full rounded-lg" />
      </CardContent>
    </Card>
  )
}

// ─── CSV Export Helpers ─────────────────────────────────────────────────────

function escapeCsvCell(value: string | number): string {
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function downloadCsv(filename: string, csvContent: string) {
  const BOM = '\uFEFF'
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function ReportsView() {
  const { locale } = useAppStore()
  const dir = getDirection(locale)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [activeReport, setActiveReport] = useState<string | null>(null)

  const numberFmt = locale === 'ar' ? 'ar-SA' : 'en-US'

  // ── Fetch real dashboard data ─────────────────────────────────────────
  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ['dashboard', 'reports', dateFrom, dateTo],
    queryFn: () => {
      const params = new URLSearchParams()
      if (dateFrom) params.set('from', dateFrom)
      if (dateTo) params.set('to', dateTo)
      const qs = params.toString()
      return authFetch(`/api/dashboard${qs ? '?' + qs : ''}`).then((r) => r.json())
    },
  })

  const kpis = data?.kpis

  // ── Build KPI list from real data ─────────────────────────────────────
  const kpiList = kpis
    ? [
        {
          label: t(locale, 'reports', 'totalRevenue'),
          value: formatCurrency(kpis.totalRevenue, 'SAR', locale),
          icon: <DollarSign className="h-5 w-5 text-emerald-600" />,
          trend: kpis.revenueTrend,
        },
        {
          label: t(locale, 'reports', 'averagePerBooking'),
          value: kpis.totalBookings > 0
            ? formatCurrency(Math.round(kpis.totalRevenue / kpis.totalBookings), 'SAR', locale)
            : formatCurrency(0, 'SAR', locale),
          icon: <BarChart3 className="h-5 w-5 text-blue-600" />,
          trend: kpis.bookingsTrend,
        },
        {
          label: t(locale, 'reports', 'noShowsReport'),
          value: `${kpis.noShowRate}%`,
          icon: <XCircle className="h-5 w-5 text-red-600" />,
          trend: kpis.noShowTrend,
        },
        {
          label: t(locale, 'dashboard', 'occupancy'),
          value: `${kpis.occupancyRate}%`,
          icon: <TrendingUp className="h-5 w-5 text-amber-600" />,
          trend: kpis.occupancyTrend,
        },
      ]
    : []

  // ── Export handlers ───────────────────────────────────────────────────
  const handleExportCsv = useCallback(() => {
    if (!data) {
      toast.error(locale === 'ar' ? 'لا توجد بيانات للتصدير' : 'No data to export')
      return
    }

    const lines: string[] = []

    // KPI summary
    lines.push(t(locale, 'reports', 'title'))
    lines.push('')

    lines.push([
      escapeCsvCell(t(locale, 'reports', 'totalRevenue')),
      escapeCsvCell(kpis!.totalRevenue),
      escapeCsvCell(`${kpis!.revenueTrend}%`),
    ].join(','))

    lines.push([
      escapeCsvCell(t(locale, 'dashboard', 'totalBookings')),
      escapeCsvCell(kpis!.totalBookings),
      escapeCsvCell(`${kpis!.bookingsTrend}%`),
    ].join(','))

    lines.push([
      escapeCsvCell(t(locale, 'dashboard', 'totalCustomers')),
      escapeCsvCell(kpis!.totalCustomers),
      escapeCsvCell(`${kpis!.customersTrend}%`),
    ].join(','))

    lines.push([
      escapeCsvCell(t(locale, 'dashboard', 'totalEmployees')),
      escapeCsvCell(kpis!.totalEmployees),
      escapeCsvCell(`${kpis!.employeesTrend}%`),
    ].join(','))

    lines.push([
      escapeCsvCell(t(locale, 'dashboard', 'occupancy')),
      escapeCsvCell(`${kpis!.occupancyRate}%`),
      escapeCsvCell(`${kpis!.occupancyTrend}%`),
    ].join(','))

    lines.push([
      escapeCsvCell(t(locale, 'reports', 'noShowsReport')),
      escapeCsvCell(`${kpis!.noShowRate}%`),
      escapeCsvCell(`${kpis!.noShowTrend}%`),
    ].join(','))

    lines.push([
      escapeCsvCell(t(locale, 'dashboard', 'conversion')),
      escapeCsvCell(`${kpis!.conversionRate}%`),
      escapeCsvCell(`${kpis!.conversionTrend}%`),
    ].join(','))

    // Monthly revenue
    lines.push('')
    lines.push(t(locale, 'dashboard', 'monthlyRevenue'))
    lines.push([escapeCsvCell('Month'), escapeCsvCell('Revenue')].join(','))
    data.monthlyRevenue.forEach((m) => {
      lines.push([escapeCsvCell(m.month), escapeCsvCell(m.revenue)].join(','))
    })

    // Weekly bookings
    lines.push('')
    lines.push(t(locale, 'dashboard', 'weeklyStats'))
    lines.push([escapeCsvCell('Day'), escapeCsvCell('Count')].join(','))
    data.weeklyBookings.forEach((w) => {
      lines.push([escapeCsvCell(w.day), escapeCsvCell(w.count)].join(','))
    })

    // Top services
    lines.push('')
    lines.push(t(locale, 'dashboard', 'topServices'))
    lines.push([
      escapeCsvCell(t(locale, 'common', 'name')),
      escapeCsvCell(t(locale, 'dashboard', 'totalBookings')),
      escapeCsvCell(t(locale, 'dashboard', 'revenue')),
    ].join(','))
    data.topServices.forEach((s) => {
      lines.push([
        escapeCsvCell(s.name),
        escapeCsvCell(s.bookingsCount),
        escapeCsvCell(s.revenue),
      ].join(','))
    })

    // Top employees
    lines.push('')
    lines.push(t(locale, 'dashboard', 'topEmployees'))
    lines.push([
      escapeCsvCell(t(locale, 'common', 'name')),
      escapeCsvCell(t(locale, 'bookings', 'completed')),
      escapeCsvCell(t(locale, 'dashboard', 'revenue')),
      escapeCsvCell('Rating'),
    ].join(','))
    data.topEmployees.forEach((e) => {
      lines.push([
        escapeCsvCell(e.name),
        escapeCsvCell(e.completed),
        escapeCsvCell(e.revenue),
        escapeCsvCell(e.rating?.toFixed(1) ?? '—'),
      ].join(','))
    })

    // Recent bookings
    lines.push('')
    lines.push(t(locale, 'dashboard', 'recentBookings'))
    lines.push([
      escapeCsvCell('ID'),
      escapeCsvCell(t(locale, 'common', 'customers')),
      escapeCsvCell(t(locale, 'common', 'services')),
      escapeCsvCell(t(locale, 'common', 'date')),
      escapeCsvCell(t(locale, 'common', 'time')),
      escapeCsvCell(t(locale, 'common', 'status')),
      escapeCsvCell(t(locale, 'common', 'amount')),
    ].join(','))
    data.recentBookings.forEach((b) => {
      lines.push([
        escapeCsvCell(b.id),
        escapeCsvCell(b.customerName),
        escapeCsvCell(b.serviceName),
        escapeCsvCell(b.date),
        escapeCsvCell(b.time),
        escapeCsvCell(b.status),
        escapeCsvCell(b.amount),
      ].join(','))
    })

    const timestamp = new Date().toISOString().slice(0, 10)
    downloadCsv(`bookflow-report-${timestamp}.csv`, lines.join('\n'))

    toast.success(
      locale === 'ar' ? 'تم تصدير التقرير بنجاح' : 'Report exported successfully'
    )
  }, [data, kpis, locale])

  const handleGenerate = useCallback(
    (reportKey: string) => {
      setActiveReport(reportKey === activeReport ? null : reportKey)
      toast.success(
        locale === 'ar'
          ? `تم عرض تقرير ${reportKey}`
          : `Showing ${reportKey} report`
      )
    },
    [locale, activeReport]
  )

  const handleExport = useCallback(
    (format: string) => {
      if (format === 'Excel') {
        handleExportCsv()
      } else if (format === 'Print' || format === 'PDF') {
        window.print()
      } else {
        handleExportCsv()
      }
    },
    [locale, handleExportCsv]
  )

  return (
    <div
      dir={dir}
      className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-1 duration-300"
    >
      {/* Header */}
      <div className="animate-in fade-in-0 duration-300">
        <h1 className="text-2xl font-bold">{t(locale, 'reports', 'title')}</h1>
        <p className="text-sm text-muted-foreground">
          {locale === 'ar'
            ? 'تحليلات شاملة لأداء أعمالك'
            : 'Comprehensive analytics for your business performance'}
        </p>
      </div>

      {/* Date Range Selector */}
      <div className="animate-in fade-in-0 slide-in-from-bottom-2 duration-300" style={{ animationDelay: '50ms', animationFillMode: 'backwards' }}>
        <Card>
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Label className="mb-1.5 block text-xs text-muted-foreground">
                {t(locale, 'common', 'from')}
              </Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
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
                onChange={(e) => setDateTo(e.target.value)}
                dir="ltr"
              />
            </div>
            <div className="flex gap-2">
              {[
                { label: t(locale, 'reports', 'thisMonth') },
                { label: t(locale, 'reports', 'thisWeek') },
                { label: t(locale, 'reports', 'today') },
              ].map((preset) => (
                <Button
                  key={preset.label}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const now = new Date()
                    if (preset.label === t(locale, 'reports', 'today')) {
                      const d = now.toISOString().slice(0, 10)
                      setDateFrom(d)
                      setDateTo(d)
                    } else if (preset.label === t(locale, 'reports', 'thisWeek')) {
                      const start = new Date(now)
                      start.setDate(now.getDate() - now.getDay() + 1)
                      setDateFrom(start.toISOString().slice(0, 10))
                      setDateTo(now.toISOString().slice(0, 10))
                    } else {
                      const start = new Date(now.getFullYear(), now.getMonth(), 1)
                      setDateFrom(start.toISOString().slice(0, 10))
                      setDateTo(now.toISOString().slice(0, 10))
                    }
                  }}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <KpiCardSkeleton key={i} />
            ))
          : kpiList.map((kpi) => {
              const isPositive = kpi.trend >= 0
              return (
                <div
                  key={kpi.label}
                  className="animate-in fade-in-0 slide-in-from-bottom-3 duration-300"
                  style={{
                    animationDelay: `${kpiList.indexOf(kpi) * 70}ms`,
                    animationFillMode: 'backwards',
                  }}
                >
                  <Card className="transition-shadow hover:shadow-md">
                    <CardContent className="flex items-center gap-4 p-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
                        {kpi.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-lg font-bold">{kpi.value}</p>
                        <p className="truncate text-sm text-muted-foreground">
                          {kpi.label}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-xs',
                          isPositive
                            ? 'text-emerald-600 border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20'
                            : 'text-red-500 border-red-200 bg-red-50 dark:bg-red-900/20'
                        )}
                      >
                        {isPositive ? (
                          <ArrowUpRight className="ms-0.5 inline h-3 w-3" />
                        ) : (
                          <ArrowDownRight className="ms-0.5 inline h-3 w-3" />
                        )}
                        {Math.abs(kpi.trend)}%
                      </Badge>
                    </CardContent>
                  </Card>
                </div>
              )
            })}
      </div>

      {/* Report Type Cards Grid */}
      <div className="animate-in fade-in-0 slide-in-from-bottom-3 duration-300" style={{ animationDelay: '200ms', animationFillMode: 'backwards' }}>
        <h2 className="mb-4 text-lg font-semibold">
          {locale === 'ar' ? 'أنواع التقارير' : 'Report Types'}
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {REPORT_TYPES.map((report, idx) => (
            <div
              key={report.key}
              className="animate-in fade-in-0 slide-in-from-bottom-3 duration-300"
              style={{ animationDelay: `${200 + idx * 70}ms`, animationFillMode: 'backwards' }}
            >
              <Card className="h-full transition-all hover:shadow-md hover:border-emerald-200 dark:hover:border-emerald-800">
                <CardContent className="flex flex-col gap-4 p-5">
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${report.color}`}
                    >
                      {report.icon}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold">
                        {t(locale, 'reports', report.titleKey)}
                      </p>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {locale === 'ar'
                          ? 'تقرير مفصل يعرض ' +
                            t(locale, 'reports', report.descKey).toLowerCase()
                          : `Detailed report showing ${t(locale, 'reports', report.descKey).toLowerCase()}`}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-fit gap-2 self-start border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-900/20"
                    onClick={() => handleGenerate(report.key)}
                  >
                    {t(locale, 'reports', 'generate')}
                  </Button>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>

      {/* ── Charts Section ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Revenue Area Chart */}
        {isLoading ? (
          <ChartCardSkeleton />
        ) : (
          <Card className="animate-in fade-in-0 slide-in-from-bottom-3 duration-300" style={{ animationDelay: '300ms', animationFillMode: 'backwards' }}>
            <CardHeader>
              <CardTitle>
                {t(locale, 'dashboard', 'monthlyRevenue')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={revenueChartConfig}
                className="h-[260px] w-full"
              >
                <AreaChart data={data?.monthlyRevenue ?? []}>
                  <defs>
                    <linearGradient id="reportsEmeraldGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} fontSize={11} />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    fontSize={11}
                    tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value: number) =>
                          formatCurrency(Number(value), 'SAR', locale)
                        }
                      />
                    }
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="hsl(160, 84%, 39%)"
                    strokeWidth={2}
                    fill="url(#reportsEmeraldGradient)"
                  />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>
        )}

        {/* Weekly Bookings Bar Chart */}
        {isLoading ? (
          <ChartCardSkeleton />
        ) : (
          <Card className="animate-in fade-in-0 slide-in-from-bottom-3 duration-300" style={{ animationDelay: '370ms', animationFillMode: 'backwards' }}>
            <CardHeader>
              <CardTitle>
                {t(locale, 'dashboard', 'weeklyStats')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={bookingsChartConfig}
                className="h-[260px] w-full"
              >
                <BarChart data={data?.weeklyBookings ?? []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} fontSize={11} />
                  <YAxis tickLine={false} axisLine={false} tickMargin={8} fontSize={11} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar
                    dataKey="count"
                    fill="hsl(160, 84%, 39%)"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={40}
                  />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* ── Top Services & Employees Tables ─────────────────────────────── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Top Services */}
        {isLoading ? (
          <ChartCardSkeleton />
        ) : (
          <Card className="animate-in fade-in-0 slide-in-from-bottom-3 duration-300" style={{ animationDelay: '440ms', animationFillMode: 'backwards' }}>
            <CardHeader>
              <CardTitle>{t(locale, 'dashboard', 'topServices')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(data?.topServices ?? []).map((service, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 rounded-lg border p-3 animate-in fade-in-0"
                    style={{ animationDelay: `${440 + idx * 40}ms`, animationFillMode: 'backwards' }}
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                      {idx + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{service.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {service.bookingsCount} {locale === 'ar' ? 'حجوزات' : 'bookings'}
                      </p>
                    </div>
                    <span className="text-sm font-semibold tabular-nums">
                      {formatCurrency(service.revenue, 'SAR', locale)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Top Employees */}
        {isLoading ? (
          <ChartCardSkeleton />
        ) : (
          <Card className="animate-in fade-in-0 slide-in-from-bottom-3 duration-300" style={{ animationDelay: '480ms', animationFillMode: 'backwards' }}>
            <CardHeader>
              <CardTitle>{t(locale, 'dashboard', 'topEmployees')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(data?.topEmployees ?? []).map((emp, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 rounded-lg border p-3 animate-in fade-in-0"
                    style={{ animationDelay: `${480 + idx * 40}ms`, animationFillMode: 'backwards' }}
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                      {idx + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{emp.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {emp.completed} {locale === 'ar' ? 'مكتمل' : 'completed'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold tabular-nums">
                        {formatCurrency(emp.revenue, 'SAR', locale)}
                      </span>
                      <span className="text-xs text-amber-600 tabular-nums">
                        ★ {emp.rating?.toFixed(1) ?? '—'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Export Buttons Row */}
      <div className="animate-in fade-in-0 slide-in-from-bottom-3 duration-300" style={{ animationDelay: '500ms', animationFillMode: 'backwards' }}>
        <Card>
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-medium text-muted-foreground">
              {locale === 'ar' ? 'تصدير التقارير' : 'Export Reports'}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => handleExport('PDF')}
              >
                <FileDown className="h-4 w-4" />
                PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => handleExport('Excel')}
              >
                <FileSpreadsheet className="h-4 w-4" />
                Excel
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => handleExport('Print')}
              >
                <Printer className="h-4 w-4" />
                {t(locale, 'common', 'print')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}