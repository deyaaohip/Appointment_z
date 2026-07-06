// ============================================================
// Demo Response Builder — Returns demo data matching the
// exact shape of each API route's normal response.
// Used when SQLite is unavailable (serverless/preview).
// ============================================================

import {
  DEMO_TENANT, DEMO_BRANCHES, DEMO_SERVICES, DEMO_SERVICE_CATEGORIES,
  DEMO_EMPLOYEES, DEMO_CUSTOMERS, DEMO_BOOKINGS, DEMO_COUPONS,
  DEMO_ROLES, DEMO_PAYMENTS, enrichDemoBooking, findDemo,
} from './demo-data'

const today = new Date()
const todayStr = today.toISOString().slice(0, 10)

// ─── Dashboard ─────────────────────────────────────────────────
export function demoDashboard() {
  const totalBookings = DEMO_BOOKINGS.length
  const completedBookings = DEMO_BOOKINGS.filter(b => b.status === 'completed').length
  const noShowBookings = DEMO_BOOKINGS.filter(b => b.status === 'no_show').length
  const totalRevenue = DEMO_PAYMENTS.reduce((s, p) => s + p.amount, 0)
  const todaysBookings = DEMO_BOOKINGS.filter(b => b.startDate.slice(0, 10) === todayStr).length

  const weeklyBookings = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today)
    d.setDate(d.getDate() - (6 - i))
    const dayStr = d.toISOString().slice(0, 10)
    return {
      day: d.toLocaleString('en-US', { weekday: 'short' }),
      count: DEMO_BOOKINGS.filter(b => b.startDate.slice(0, 10) === dayStr).length,
    }
  })

  const monthlyRevenue = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(today.getFullYear(), today.getMonth() - (11 - i), 1)
    const rev = [6500, 7200, 8100, 7800, 9200, 8800, 10350, 11000, 9500, 10200, 10800, 11500]
    return { month: d.toLocaleString('en-US', { month: 'short', year: 'numeric' }), revenue: rev[i] }
  })

  const topServices = [
    { id: 'demo-svc-1', name: 'كشف عام', bookingsCount: 5, revenue: 750 },
    { id: 'demo-svc-3', name: 'تنظيف أسنان', bookingsCount: 3, revenue: 900 },
    { id: 'demo-svc-8', name: 'فيزيو ثريبي', bookingsCount: 3, revenue: 750 },
    { id: 'demo-svc-4', name: 'تركيب تقويم', bookingsCount: 2, revenue: 4000 },
    { id: 'demo-svc-6', name: 'session ليزر', bookingsCount: 2, revenue: 1000 },
  ]

  const topEmployees = [
    { id: 'demo-emp-1', name: 'د. أحمد محمد العلي', completed: 4, revenue: 600, rating: 4.8 },
    { id: 'demo-emp-2', name: 'د. سارة خالد الأحمد', completed: 3, revenue: 4100, rating: 4.9 },
    { id: 'demo-emp-5', name: 'أ. محمد العتيبي', completed: 3, revenue: 750, rating: 4.6 },
    { id: 'demo-emp-3', name: 'د. فهد عبدالله السعيد', completed: 2, revenue: 400, rating: 4.7 },
    { id: 'demo-emp-4', name: 'د. نورة سعد القحطاني', completed: 1, revenue: 200, rating: 4.5 },
  ]

  const recentBookings = DEMO_BOOKINGS.slice(0, 10).map(b => {
    const enriched = enrichDemoBooking(b)
    return {
      id: b.id,
      customerName: enriched.customer?.name || '—',
      employeeName: enriched.employee?.name || '—',
      serviceName: enriched.service?.name || '—',
      date: b.startDate.slice(0, 10),
      time: b.startTime,
      status: b.status,
      amount: b.totalPrice,
    }
  })

  return {
    kpis: {
      totalRevenue,
      totalBookings,
      totalCustomers: DEMO_CUSTOMERS.length,
      totalEmployees: DEMO_EMPLOYEES.length,
      occupancyRate: totalBookings > 0 ? Math.round((completedBookings / totalBookings) * 100) : 0,
      noShowRate: totalBookings > 0 ? Math.round((noShowBookings / totalBookings) * 100) : 0,
      conversionRate: totalBookings > 0 ? Math.round((completedBookings / totalBookings) * 100) : 0,
      todaysBookings,
      revenueTrend: 12, bookingsTrend: 8, customersTrend: 15, employeesTrend: 0,
      occupancyTrend: 5, noShowTrend: -10, conversionTrend: 5, todaysBookingsTrend: 0,
    },
    monthlyRevenue,
    weeklyBookings,
    topServices,
    topEmployees,
    recentBookings,
  }
}

// ─── Bookings ──────────────────────────────────────────────────
export function demoBookingsList(page: number, limit: number, status?: string, search?: string) {
  let filtered = [...DEMO_BOOKINGS]
  if (status && status !== 'all') filtered = filtered.filter(b => b.status === status)
  if (search) {
    const q = search.toLowerCase()
    filtered = filtered.filter(b => {
      const cust = findDemo(DEMO_CUSTOMERS, b.customerId)
      const emp = findDemo(DEMO_EMPLOYEES, b.employeeId)
      return (cust?.name || '').toLowerCase().includes(q) || (emp?.name || '').toLowerCase().includes(q)
    })
  }
  const total = filtered.length
  const start = (page - 1) * limit
  const items = filtered.slice(start, start + limit).map(enrichDemoBooking)
  return {
    bookings: items,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  }
}

export function demoBookingById(id: string) {
  const booking = findDemo(DEMO_BOOKINGS, id)
  if (!booking) return null
  return enrichDemoBooking(booking)
}

// ─── Customers ─────────────────────────────────────────────────
export function demoCustomersList(page: number, limit: number, search?: string) {
  let filtered = [...DEMO_CUSTOMERS]
  if (search) {
    const q = search.toLowerCase()
    filtered = filtered.filter(c => c.name.toLowerCase().includes(q) || c.phone.includes(q) || c.email.toLowerCase().includes(q))
  }
  const total = filtered.length
  const start = (page - 1) * limit
  const items = filtered.slice(start, start + limit)
  return {
    customers: items,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  }
}

// ─── Employees ─────────────────────────────────────────────────
export function demoEmployeesList(page: number, limit: number, search?: string) {
  let filtered = [...DEMO_EMPLOYEES]
  if (search) {
    const q = search.toLowerCase()
    filtered = filtered.filter(e => e.name.toLowerCase().includes(q) || e.specialization.toLowerCase().includes(q))
  }
  const total = filtered.length
  const start = (page - 1) * limit
  const items = filtered.slice(start, start + limit)
  return {
    employees: items,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  }
}

// ─── Services ──────────────────────────────────────────────────
export function demoServicesList(page: number, limit: number, search?: string) {
  let filtered = [...DEMO_SERVICES]
  if (search) {
    const q = search.toLowerCase()
    filtered = filtered.filter(s => s.name.toLowerCase().includes(q))
  }
  const total = filtered.length
  const start = (page - 1) * limit
  const items = filtered.slice(start, start + limit).map(s => {
    const cat = findDemo(DEMO_SERVICE_CATEGORIES, s.categoryId)
    return { ...s, category: cat ? { id: cat.id, name: cat.name } : null }
  })
  return {
    services: items,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  }
}

// ─── Branches ──────────────────────────────────────────────────
export function demoBranchesList() {
  return {
    branches: DEMO_BRANCHES,
    pagination: { page: 1, limit: 100, total: DEMO_BRANCHES.length, totalPages: 1 },
  }
}

// ─── Coupons ───────────────────────────────────────────────────
export function demoCouponsList(page: number, limit: number) {
  const total = DEMO_COUPONS.length
  const start = (page - 1) * limit
  return {
    coupons: DEMO_COUPONS.slice(start, start + limit),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  }
}

// ─── Roles ─────────────────────────────────────────────────────
export function demoRolesList() {
  return DEMO_ROLES
}

// ─── Payments ──────────────────────────────────────────────────
export function demoPaymentsList(page: number, limit: number) {
  const total = DEMO_PAYMENTS.length
  const start = (page - 1) * limit
  return {
    payments: DEMO_PAYMENTS.slice(start, start + limit).map(p => {
      const cust = findDemo(DEMO_CUSTOMERS, p.customerId)
      return { ...p, customer: cust ? { id: cust.id, name: cust.name } : null }
    }),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  }
}

// ─── Notifications ─────────────────────────────────────────────
export function demoNotifications() {
  return {
    notifications: [
      { id: 'demo-notif-1', type: 'booking', title: 'حجز جديد', message: 'حجز جديد من عبدالرحمن الشمري', isRead: false, createdAt: new Date().toISOString() },
      { id: 'demo-notif-2', type: 'cancellation', title: 'إلغاء حجز', message: 'تم إلغاء حجز خالد الدوسري', isRead: false, createdAt: new Date(Date.now() - 3600000).toISOString() },
      { id: 'demo-notif-3', type: 'system', title: 'تذكير', message: 'لديك 4 حجوزات اليوم', isRead: true, createdAt: new Date(Date.now() - 7200000).toISOString() },
    ],
    unreadCount: 2,
  }
}

// ─── Audit Logs ────────────────────────────────────────────────
export function demoAuditLogs(page: number, limit: number) {
  const logs = [
    { id: 'demo-log-1', userId: 'demo-admin', userName: 'مدير النظام', action: 'login', entity: 'session', details: '{}', ipAddress: '1.2.3.4', createdAt: new Date().toISOString() },
    { id: 'demo-log-2', userId: 'demo-admin', userName: 'مدير النظام', action: 'create', entity: 'booking', details: '{}', ipAddress: '1.2.3.4', createdAt: new Date(Date.now() - 1800000).toISOString() },
    { id: 'demo-log-3', userId: 'demo-admin', userName: 'مدير النظام', action: 'edit', entity: 'customer', details: '{}', ipAddress: '1.2.3.4', createdAt: new Date(Date.now() - 3600000).toISOString() },
  ]
  return {
    logs,
    pagination: { page, limit, total: logs.length, totalPages: 1 },
  }
}

// ─── Tenant Settings ───────────────────────────────────────────
export function demoTenantSettings() {
  return {
    data: {
      ...DEMO_TENANT,
      workingHours: { start: '08:00', end: '22:00', fridayStart: '16:00', fridayEnd: '22:00' },
      bookingSettings: { allowOnlineBooking: true, minAdvanceHours: 1, maxAdvanceDays: 30, slotInterval: 15 },
      notificationSettings: { smsEnabled: true, emailEnabled: true, whatsappEnabled: true, reminderHours: [24, 2] },
    },
  }
}

// ─── Brand Settings ────────────────────────────────────────────
export function demoBrandSettings() {
  return {
    data: {
      primaryColor: DEMO_TENANT.primaryColor,
      secondaryColor: DEMO_TENANT.secondaryColor,
      logo: DEMO_TENANT.logo,
      theme: DEMO_TENANT.theme,
      language: DEMO_TENANT.language,
    },
  }
}

// ─── Availability ──────────────────────────────────────────────
export function demoAvailability() {
  const slots: { time: string; available: boolean; employee: string }[] = []
  for (let h = 8; h <= 21; h++) {
    for (let m = 0; m < 60; m += 30) {
      const time = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
      slots.push({ time, available: Math.random() > 0.3, employee: DEMO_EMPLOYEES[0].name })
    }
  }
  return { slots, date: todayStr }
}

// ─── Subscriptions ─────────────────────────────────────────────
export function demoSubscriptions() {
  return {
    currentPlan: { name: 'الخطة الاحترافية', price: 299, currency: 'SAR', interval: 'month', features: ['حجوزات غير محدودة', 'موظفين حتى 10', 'فروع حتى 5', 'تقارير متقدمة', 'دعم فني 24/7'] },
    usage: { bookings: { used: DEMO_BOOKINGS.length, limit: -1 }, customers: { used: DEMO_CUSTOMERS.length, limit: -1 }, employees: { used: DEMO_EMPLOYEES.length, limit: 10 }, branches: { used: DEMO_BRANCHES.length, limit: 5 } },
  }
}

// ─── Admin Tenants ─────────────────────────────────────────────
export function demoAdminTenants() {
  return {
    tenants: [{ ...DEMO_TENANT, branchCount: DEMO_BRANCHES.length, userCount: 1, bookingCount: DEMO_BOOKINGS.length }],
  }
}