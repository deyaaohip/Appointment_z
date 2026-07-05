import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cache, dashboardCache } from '@/lib/performance/cache'
import { withAuth, optionsHandler, ok, internalError } from '@/lib/api-auth'

export async function OPTIONS(request: NextRequest) {
  return optionsHandler(request)
}

export async function GET(request: NextRequest) {
  try {
    const auth = await withAuth(request, { resource: 'dashboard', action: 'view' })
    if (auth.error) return auth.error
    const { tenantId: tid } = auth.context

    const tenant = await db.tenant.findFirst({ where: { id: tid, isActive: true } })
    if (!tenant) {
      return internalError(request.headers.get('origin'))
    }

    const cacheKey = dashboardCache.key(tid)
    const origin = request.headers.get('origin')

    // Check cache first
    const cached = cache.get<unknown>(cacheKey)
    if (cached) {
      return ok(cached, origin, { 'X-Cache': 'HIT' })
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const nextWeek = new Date(today)
    nextWeek.setDate(nextWeek.getDate() + 7)

    // ─── Period boundaries for trend calculations ────────────────────────
    const periodStart = new Date(today)
    periodStart.setDate(periodStart.getDate() - 30)
    const prevPeriodStart = new Date(today)
    prevPeriodStart.setDate(prevPeriodStart.getDate() - 60)

    // ─── Parallel data fetching ─────────────────────────────────────────
    const [
      revenueAgg,
      totalBookings,
      totalCustomers,
      totalEmployees,
      completedBookings,
      noShowBookings,
      todayBookings,
      upcomingBookings,
      recentBookingsRaw,
      topServicesRaw,
      topEmployeesRaw,
      // Current period (last 30 days)
      currentRevenue,
      currentBookings,
      currentCompleted,
      currentNoShow,
      currentCustomers,
      // Previous period (30-60 days ago)
      prevRevenue,
      prevBookings,
      prevCompleted,
      prevNoShow,
      prevCustomers,
    ] = await Promise.all([
      // ── All-time stats ──
      db.payment.aggregate({
        _sum: { amount: true },
        where: { tenantId: tid, status: { in: ['completed', 'paid'] } },
      }),
      db.booking.count({ where: { tenantId: tid } }),
      db.customer.count({ where: { tenantId: tid, isActive: true } }),
      db.employee.count({ where: { tenantId: tid, isActive: true } }),
      db.booking.count({ where: { tenantId: tid, status: 'completed' } }),
      db.booking.count({ where: { tenantId: tid, status: 'no_show' } }),
      db.booking.count({ where: { tenantId: tid, startDate: { gte: today, lt: tomorrow } } }),
      db.booking.count({
        where: { tenantId: tid, startDate: { gte: today, lt: nextWeek }, status: { in: ['confirmed', 'pending'] } },
      }),
      // Recent bookings with relations
      db.booking.findMany({
        where: { tenantId: tid },
        include: {
          customer: { select: { firstName: true, lastName: true } },
          employee: { select: { id: true, name: true, avatar: true } },
          branch: { select: { id: true, name: true } },
          services: { include: { service: { select: { name: true } } } },
          payments: { select: { amount: true, status: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      // Top services by booking count
      db.bookingService.groupBy({
        by: ['serviceId'],
        where: { booking: { tenantId: tid } },
        _count: { id: true },
        _sum: { price: true },
        orderBy: { _count: { id: 'desc' } },
        take: 5,
      }),
      // Top employees by completed bookings
      db.booking.groupBy({
        by: ['employeeId'],
        where: { tenantId: tid, employeeId: { not: null }, status: 'completed' },
        _count: { id: true },
        _sum: { totalPrice: true },
        orderBy: { _count: { id: 'desc' } },
        take: 5,
      }),
      // ── Current period aggregates (last 30 days) ──
      db.payment.aggregate({
        _sum: { amount: true },
        where: { tenantId: tid, status: { in: ['completed', 'paid'] }, createdAt: { gte: periodStart } },
      }),
      db.booking.count({ where: { tenantId: tid, startDate: { gte: periodStart } } }),
      db.booking.count({ where: { tenantId: tid, startDate: { gte: periodStart }, status: 'completed' } }),
      db.booking.count({ where: { tenantId: tid, startDate: { gte: periodStart }, status: 'no_show' } }),
      db.customer.count({ where: { tenantId: tid, isActive: true, createdAt: { gte: periodStart } } }),
      // ── Previous period aggregates (30-60 days ago) ──
      db.payment.aggregate({
        _sum: { amount: true },
        where: { tenantId: tid, status: { in: ['completed', 'paid'] }, createdAt: { gte: prevPeriodStart, lt: periodStart } },
      }),
      db.booking.count({ where: { tenantId: tid, startDate: { gte: prevPeriodStart, lt: periodStart } } }),
      db.booking.count({ where: { tenantId: tid, startDate: { gte: prevPeriodStart, lt: periodStart }, status: 'completed' } }),
      db.booking.count({ where: { tenantId: tid, startDate: { gte: prevPeriodStart, lt: periodStart }, status: 'no_show' } }),
      db.customer.count({ where: { tenantId: tid, isActive: true, createdAt: { gte: prevPeriodStart, lt: periodStart } } }),
    ])

    // ─── KPI calculations ────────────────────────────────────────────────
    const totalRevenue = revenueAgg._sum?.amount ?? 0
    const occupancyRate = totalBookings > 0 ? Math.round((completedBookings / totalBookings) * 100) : 0
    const noShowRate = totalBookings > 0 ? Math.round((noShowBookings / totalBookings) * 100) : 0
    const conversionRate = totalBookings > 0
      ? Math.round(((completedBookings) / totalBookings) * 100)
      : 0

    // ─── Trend calculations (current 30d vs previous 30d) ────────────────
    function calcTrend(current: number, previous: number): number {
      if (previous === 0) return current > 0 ? 100 : 0
      return Math.round(((current - previous) / previous) * 100)
    }

    const curRev = currentRevenue._sum?.amount ?? 0
    const prevRev = prevRevenue._sum?.amount ?? 0
    const revenueTrend = calcTrend(curRev, prevRev)
    const bookingsTrend = calcTrend(currentBookings, prevBookings)
    const customersTrend = calcTrend(currentCustomers, prevCustomers)
    const employeesTrend = 0 // Stable metric, no meaningful trend
    const occupancyTrend = calcTrend(currentCompleted, prevCompleted)
    const noShowTrend = calcTrend(currentNoShow, prevNoShow)
    const conversionTrend = calcTrend(currentCompleted, prevCompleted)
    const todaysBookingsTrend = 0 // Today vs single day, not comparable

    // ─── Monthly Revenue (optimized: single query, group in JS) ─────────
    const twelveMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 11, 1)
    const allMonthlyPayments = await db.payment.findMany({
      where: {
        tenantId: tid,
        status: { in: ['completed', 'paid'] },
        createdAt: { gte: twelveMonthsAgo },
      },
      select: { amount: true, createdAt: true },
    })

    const monthlyRevenueMap = new Map<string, number>()
    for (const p of allMonthlyPayments) {
      const key = `${p.createdAt.getFullYear()}-${String(p.createdAt.getMonth() + 1).padStart(2, '0')}`
      monthlyRevenueMap.set(key, (monthlyRevenueMap.get(key) ?? 0) + p.amount)
    }

    const monthlyRevenue: { month: string; revenue: number }[] = []
    for (let i = 11; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      monthlyRevenue.push({
        month: d.toLocaleString('en-US', { month: 'short', year: 'numeric' }),
        revenue: monthlyRevenueMap.get(key) ?? 0,
      })
    }

    // ─── Weekly Bookings (optimized: single query, group in JS) ──────────
    const weekAgo = new Date(today)
    weekAgo.setDate(weekAgo.getDate() - 6)
    weekAgo.setHours(0, 0, 0, 0)

    const allWeeklyBookings = await db.booking.findMany({
      where: {
        tenantId: tid,
        startDate: { gte: weekAgo, lt: tomorrow },
      },
      select: { startDate: true },
    })

    const weeklyMap = new Map<string, number>()
    for (const b of allWeeklyBookings) {
      const key = b.startDate.toISOString().slice(0, 10)
      weeklyMap.set(key, (weeklyMap.get(key) ?? 0) + 1)
    }

    const weeklyBookings: { day: string; count: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      d.setHours(0, 0, 0, 0)
      const key = d.toISOString().slice(0, 10)
      weeklyBookings.push({
        day: d.toLocaleString('en-US', { weekday: 'short' }),
        count: weeklyMap.get(key) ?? 0,
      })
    }

    // ─── Top Services (batch enrich) ────────────────────────────────────
    const serviceIds = topServicesRaw.map((s) => s.serviceId)
    const serviceDetails = serviceIds.length > 0
      ? await db.service.findMany({ where: { id: { in: serviceIds } }, select: { id: true, name: true } })
      : []
    const serviceMap = new Map(serviceDetails.map((s) => [s.id, s.name]))

    const topServices = topServicesRaw.map((s) => ({
      id: s.serviceId,
      name: serviceMap.get(s.serviceId) ?? 'Unknown',
      bookingsCount: s._count.id,
      revenue: s._sum.price ?? 0,
    }))

    // ─── Top Employees (batch enrich) ───────────────────────────────────
    // Booking.employeeId references TenantUser, not Employee
    const employeeIds = topEmployeesRaw.map((e) => e.employeeId).filter(Boolean) as string[]
    const employeeDetails = employeeIds.length > 0
      ? await db.tenantUser.findMany({ where: { id: { in: employeeIds } }, select: { id: true, name: true } })
      : []
    const employeeMap = new Map(employeeDetails.map((e) => [e.id, e.name]))

    const topEmployees = topEmployeesRaw.map((e) => ({
      id: e.employeeId,
      name: employeeMap.get(e.employeeId ?? '') ?? 'Unassigned',
      completed: e._count.id,
      revenue: e._sum.totalPrice ?? 0,
      rating: 4.5, // Default until reviews are implemented
    }))

    // ─── Recent Bookings (transform to flat shape) ──────────────────────
    const recentBookings = recentBookingsRaw.map((b) => ({
      id: b.id,
      customerName: `${b.customer.firstName} ${b.customer.lastName}`.trim(),
      serviceName: b.services[0]?.service?.name ?? '—',
      date: b.startDate.toISOString().slice(0, 10),
      time: b.startTime ?? '',
      status: b.status,
      amount: b.totalPrice,
    }))

    // ─── Assemble result ────────────────────────────────────────────────
    const result = {
      kpis: {
        totalRevenue,
        totalBookings,
        totalCustomers,
        totalEmployees,
        occupancyRate,
        noShowRate,
        conversionRate,
        todaysBookings: todayBookings,
        revenueTrend,
        bookingsTrend,
        customersTrend,
        employeesTrend,
        occupancyTrend,
        noShowTrend,
        conversionTrend,
        todaysBookingsTrend,
      },
      monthlyRevenue,
      weeklyBookings,
      topServices,
      topEmployees,
      recentBookings,
    }

    // Cache the result
    cache.set(cacheKey, result, dashboardCache.ttl)

    return ok(result, origin, { 'X-Cache': 'MISS' })
  } catch (error) {
    console.error('Dashboard error:', error)
    return internalError(request.headers.get('origin'))
  }
}