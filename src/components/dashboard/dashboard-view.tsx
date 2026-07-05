'use client'

import { authFetch } from '@/lib/auth-fetch'


import { useQuery } from '@tanstack/react-query'
import {
  DollarSign,
  CalendarDays,
  Users,
  UserCog,
  TrendingUp,
  AlertTriangle,
  Target,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Star,
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
import { t, formatCurrency, formatDate } from '@/lib/i18n'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'

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
  status: 'confirmed' | 'pending' | 'completed' | 'cancelled' | 'no_show'
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

// ─── Constants ──────────────────────────────────────────────────────────────

const statusStyles: Record<string, string> = {
  confirmed:
    'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  pending:
    'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  completed:
    'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  cancelled:
    'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-400',
  no_show:
    'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
}

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

// ─── Sub-components ─────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const { locale } = useAppStore()
  return (
    <Badge variant="outline" className={statusStyles[status] ?? ''}>
      {t(locale, 'bookings', status === 'no_show' ? 'noShow' : status)}
    </Badge>
  )
}

interface KpiCardProps {
  icon: React.ReactNode
  iconBg: string
  value: string
  label: string
  trend: number
}

function KpiCard({ icon, iconBg, value, label, trend }: KpiCardProps) {
  const isPositive = trend >= 0

  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconBg}`}
        >
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-lg font-bold leading-tight tracking-tight truncate">
            {value}
          </p>
          <p className="text-xs text-muted-foreground truncate mt-0.5">{label}</p>
        </div>
        <div
          className={`flex shrink-0 items-center gap-0.5 text-xs font-semibold rounded-md px-1.5 py-0.5 ${
            isPositive
              ? 'text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/30'
              : 'text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-900/30'
          }`}
        >
          {isPositive ? (
            <ArrowUpRight className="h-3 w-3" />
          ) : (
            <ArrowDownRight className="h-3 w-3" />
          )}
          {Math.abs(trend)}%
        </div>
      </CardContent>
    </Card>
  )
}

function KpiCardSkeleton() {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <Skeleton className="h-10 w-10 rounded-xl" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="h-5 w-12 rounded-md" />
      </CardContent>
    </Card>
  )
}

function ChartSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <Skeleton className="h-4 w-36" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[260px] w-full rounded-lg" />
      </CardContent>
    </Card>
  )
}

function TableSkeleton({
  rows = 5,
  cols = 4,
}: {
  rows?: number
  cols?: number
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <Skeleton className="h-4 w-36" />
      </CardHeader>
      <CardContent className="p-0">
        <div className="px-4 py-3 space-y-2">
          <div className="flex gap-3">
            {Array.from({ length: cols }).map((_, i) => (
              <Skeleton key={`h-${i}`} className="h-3.5 flex-1" />
            ))}
          </div>
          {Array.from({ length: rows }).map((_, r) => (
            <div key={`r-${r}`} className="flex gap-3 py-1.5">
              {Array.from({ length: cols }).map((_, c) => (
                <Skeleton key={`c-${c}`} className="h-7 flex-1" />
              ))}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────

function DashboardView() {
  const { locale } = useAppStore()

  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ['dashboard'],
    queryFn: () => authFetch('/api/dashboard').then((r) => r.json()),
  })

  const kpis = data?.kpis

  const numberFmt = locale === 'ar' ? 'ar-SA' : 'en-US'

  const kpiDefs = kpis
    ? [
        {
          key: 'revenue',
          icon: <DollarSign className="h-5 w-5 text-white" />,
          iconBg: 'bg-emerald-500',
          value: formatCurrency(kpis.totalRevenue, 'SAR', locale),
          trend: kpis.revenueTrend,
        },
        {
          key: 'totalBookings',
          icon: <CalendarDays className="h-5 w-5 text-white" />,
          iconBg: 'bg-blue-500',
          value: kpis.totalBookings.toLocaleString(numberFmt),
          trend: kpis.bookingsTrend,
        },
        {
          key: 'totalCustomers',
          icon: <Users className="h-5 w-5 text-white" />,
          iconBg: 'bg-violet-500',
          value: kpis.totalCustomers.toLocaleString(numberFmt),
          trend: kpis.customersTrend,
        },
        {
          key: 'totalEmployees',
          icon: <UserCog className="h-5 w-5 text-white" />,
          iconBg: 'bg-amber-500',
          value: kpis.totalEmployees.toLocaleString(numberFmt),
          trend: kpis.employeesTrend,
        },
        {
          key: 'occupancy',
          icon: <TrendingUp className="h-5 w-5 text-white" />,
          iconBg: 'bg-rose-500',
          value: `${kpis.occupancyRate}%`,
          trend: kpis.occupancyTrend,
        },
        {
          key: 'noShows',
          icon: <AlertTriangle className="h-5 w-5 text-white" />,
          iconBg: 'bg-red-500',
          value: `${kpis.noShowRate}%`,
          trend: kpis.noShowTrend,
        },
        {
          key: 'conversion',
          icon: <Target className="h-5 w-5 text-white" />,
          iconBg: 'bg-teal-500',
          value: `${kpis.conversionRate}%`,
          trend: kpis.conversionTrend,
        },
        {
          key: 'todayBookings',
          icon: <Clock className="h-5 w-5 text-white" />,
          iconBg: 'bg-orange-500',
          value: kpis.todaysBookings.toLocaleString(numberFmt),
          trend: kpis.todaysBookingsTrend,
        },
      ]
    : []

  return (
    <div className="space-y-5 animate-in fade-in-0 slide-in-from-bottom-1 duration-300">
      {/* ── KPI Cards ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => <KpiCardSkeleton key={i} />)
          : kpiDefs.map((kpi) => (
              <KpiCard
                key={kpi.key}
                icon={kpi.icon}
                iconBg={kpi.iconBg}
                value={kpi.value}
                label={t(locale, 'dashboard', kpi.key)}
                trend={kpi.trend}
              />
            ))}
      </div>

      {/* ── Charts ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Revenue Area Chart */}
        {isLoading ? (
          <ChartSkeleton />
        ) : (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">
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
                    <linearGradient id="emeraldGradient" x1="0" y1="0" x2="0" y2="1">
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
                    fill="url(#emeraldGradient)"
                  />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>
        )}

        {/* Weekly Bookings Bar Chart */}
        {isLoading ? (
          <ChartSkeleton />
        ) : (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">
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

      {/* ── Top Services + Top Employees ───────────────────────────────── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Top Services Table */}
        {isLoading ? (
          <TableSkeleton rows={5} cols={4} />
        ) : (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">{t(locale, 'dashboard', 'topServices')}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10 ps-4 pe-2 text-center">#</TableHead>
                      <TableHead>{t(locale, 'common', 'name')}</TableHead>
                      <TableHead className="text-center">{t(locale, 'dashboard', 'totalBookings')}</TableHead>
                      <TableHead className="text-end pe-4">{t(locale, 'dashboard', 'revenue')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(data?.topServices ?? []).map((service, idx) => (
                      <TableRow key={idx} className="animate-in fade-in-0" style={{ animationDelay: `${idx * 30}ms`, animationFillMode: 'backwards' }}>
                        <TableCell className="ps-4 pe-2 text-center font-medium text-muted-foreground">{idx + 1}</TableCell>
                        <TableCell className="font-medium">{service.name}</TableCell>
                        <TableCell className="text-center tabular-nums">{service.bookingsCount}</TableCell>
                        <TableCell className="text-end pe-4 tabular-nums">{formatCurrency(service.revenue, 'SAR', locale)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Top Employees Table */}
        {isLoading ? (
          <TableSkeleton rows={5} cols={5} />
        ) : (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">{t(locale, 'dashboard', 'topEmployees')}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10 ps-4 pe-2 text-center">#</TableHead>
                      <TableHead>{t(locale, 'common', 'name')}</TableHead>
                      <TableHead className="text-center">{t(locale, 'bookings', 'completed')}</TableHead>
                      <TableHead className="text-end">{t(locale, 'dashboard', 'revenue')}</TableHead>
                      <TableHead className="w-14 text-center pe-4">
                        <Star className="inline h-3 w-3" />
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(data?.topEmployees ?? []).map((emp, idx) => (
                      <TableRow key={idx} className="animate-in fade-in-0" style={{ animationDelay: `${idx * 30}ms`, animationFillMode: 'backwards' }}>
                        <TableCell className="ps-4 pe-2 text-center font-medium text-muted-foreground">{idx + 1}</TableCell>
                        <TableCell className="font-medium">{emp.name}</TableCell>
                        <TableCell className="text-center tabular-nums">{emp.completed}</TableCell>
                        <TableCell className="text-end tabular-nums">{formatCurrency(emp.revenue, 'SAR', locale)}</TableCell>
                        <TableCell className="text-center pe-4">
                          <span className="inline-flex items-center gap-1 text-xs tabular-nums">
                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                            {(emp.rating ?? 4.5).toFixed(1)}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* ── Recent Bookings ────────────────────────────────────────────── */}
      {isLoading ? (
        <TableSkeleton rows={8} cols={7} />
      ) : (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">{t(locale, 'dashboard', 'recentBookings')}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="ps-4">ID</TableHead>
                    <TableHead>{t(locale, 'common', 'customers')}</TableHead>
                    <TableHead>{t(locale, 'common', 'services')}</TableHead>
                    <TableHead>{t(locale, 'common', 'date')}</TableHead>
                    <TableHead>{t(locale, 'common', 'time')}</TableHead>
                    <TableHead>{t(locale, 'common', 'status')}</TableHead>
                    <TableHead className="text-end pe-4">{t(locale, 'common', 'amount')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(data?.recentBookings ?? []).map((booking) => (
                    <TableRow key={booking.id} className="animate-in fade-in-0">
                      <TableCell className="ps-4 font-mono text-xs text-muted-foreground">
                        {booking.id.length > 8
                          ? `...${booking.id.slice(-6)}`
                          : booking.id}
                      </TableCell>
                      <TableCell className="font-medium">{booking.customerName}</TableCell>
                      <TableCell>{booking.serviceName}</TableCell>
                      <TableCell className="whitespace-nowrap">{formatDate(booking.date, locale)}</TableCell>
                      <TableCell className="tabular-nums">{booking.time}</TableCell>
                      <TableCell><StatusBadge status={booking.status} /></TableCell>
                      <TableCell className="text-end pe-4 font-medium tabular-nums">{formatCurrency(booking.amount, 'SAR', locale)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export { DashboardView }