// ============================================================
// Comprehensive Demo Data — Used when SQLite is unavailable
// (e.g., serverless/preview deployment)
// ============================================================

export const DEMO_TENANT = {
  id: 'demo-tenant-1',
  name: 'مركز النور الطبي',
  slug: 'al-noor',
  businessType: 'medical',
  domain: null,
  logo: null,
  primaryColor: '#0e7490',
  secondaryColor: '#0891b2',
  timezone: 'Asia/Riyadh',
  currency: 'SAR',
  language: 'ar',
  theme: 'light',
  isActive: true,
  createdAt: '2026-06-01T10:00:00.000Z',
  updatedAt: '2026-07-01T10:00:00.000Z',
}

export const DEMO_BRANCHES = [
  { id: 'demo-branch-1', tenantId: DEMO_TENANT.id, name: 'الفرع الرئيسي', address: 'شارع الملك فهد، الرياض', phone: '0112345678', isActive: true, createdAt: '2026-06-01T10:00:00.000Z' },
  { id: 'demo-branch-2', tenantId: DEMO_TENANT.id, name: 'فرع الملز', address: 'حي الملز، شارع الأمير سلطان', phone: '0113456789', isActive: true, createdAt: '2026-06-01T10:00:00.000Z' },
  { id: 'demo-branch-3', tenantId: DEMO_TENANT.id, name: 'فرع العليا', address: 'حي العليا، طريق أنس بن مالك', phone: '0114567890', isActive: true, createdAt: '2026-06-15T10:00:00.000Z' },
]

export const DEMO_SERVICE_CATEGORIES = [
  { id: 'demo-cat-1', tenantId: DEMO_TENANT.id, name: 'طب عام', description: 'الخدمات الطبية العامة', color: '#0e7490', icon: 'stethoscope', sortOrder: 1, isActive: true, createdAt: '2026-06-01T10:00:00.000Z' },
  { id: 'demo-cat-2', tenantId: DEMO_TENANT.id, name: 'أسنان', description: 'خدمات طب الأسنان', color: '#7c3aed', icon: 'smile', sortOrder: 2, isActive: true, createdAt: '2026-06-01T10:00:00.000Z' },
  { id: 'demo-cat-3', tenantId: DEMO_TENANT.id, name: 'جلدية', description: 'خدمات الجلدية والتجميل', color: '#ec4899', icon: 'sparkles', sortOrder: 3, isActive: true, createdAt: '2026-06-01T10:00:00.000Z' },
  { id: 'demo-cat-4', tenantId: DEMO_TENANT.id, name: 'عظام', description: 'خدمات طب العظام', color: '#f59e0b', icon: 'bone', sortOrder: 4, isActive: true, createdAt: '2026-06-01T10:00:00.000Z' },
]

export const DEMO_SERVICES = [
  { id: 'demo-svc-1', tenantId: DEMO_TENANT.id, categoryId: 'demo-cat-1', name: 'كشف عام', description: 'فحص طبي شامل مع التشخيص', duration: 30, bufferBefore: 0, bufferAfter: 5, price: 150, variablePrice: false, minPrice: null, maxPrice: null, isActive: true, requiresDeposit: false, depositAmount: 0, allowOnlineBooking: true, maxBookingsPerSlot: 1, createdAt: '2026-06-01T10:00:00.000Z' },
  { id: 'demo-svc-2', tenantId: DEMO_TENANT.id, categoryId: 'demo-cat-1', name: 'متابعة مرضية', description: 'متابعة الحالة المرضية ومراجعة النتائج', duration: 20, bufferBefore: 0, bufferAfter: 5, price: 100, variablePrice: false, minPrice: null, maxPrice: null, isActive: true, requiresDeposit: false, depositAmount: 0, allowOnlineBooking: true, maxBookingsPerSlot: 1, createdAt: '2026-06-01T10:00:00.000Z' },
  { id: 'demo-svc-3', tenantId: DEMO_TENANT.id, categoryId: 'demo-cat-2', name: 'تنظيف أسنان', description: 'تنظيف أسنان احترافي بالأشعة فوق البنفسجية', duration: 45, bufferBefore: 10, bufferAfter: 10, price: 300, variablePrice: false, minPrice: null, maxPrice: null, isActive: true, requiresDeposit: false, depositAmount: 0, allowOnlineBooking: true, maxBookingsPerSlot: 1, createdAt: '2026-06-01T10:00:00.000Z' },
  { id: 'demo-svc-4', tenantId: DEMO_TENANT.id, categoryId: 'demo-cat-2', name: 'تركيب تقويم', description: 'تركيب تقويم أسنان معدني أو شفاف', duration: 60, bufferBefore: 0, bufferAfter: 10, price: 2000, variablePrice: true, minPrice: 1500, maxPrice: 5000, isActive: true, requiresDeposit: true, depositAmount: 500, allowOnlineBooking: true, maxBookingsPerSlot: 1, createdAt: '2026-06-01T10:00:00.000Z' },
  { id: 'demo-svc-5', tenantId: DEMO_TENANT.id, categoryId: 'demo-cat-3', name: 'كشف جلدية', description: 'فحص الجلد وتشخيص الأمراض الجلدية', duration: 30, bufferBefore: 0, bufferAfter: 5, price: 200, variablePrice: false, minPrice: null, maxPrice: null, isActive: true, requiresDeposit: false, depositAmount: 0, allowOnlineBooking: true, maxBookingsPerSlot: 1, createdAt: '2026-06-01T10:00:00.000Z' },
  { id: 'demo-svc-6', tenantId: DEMO_TENANT.id, categoryId: 'demo-cat-3', name: 'session ليزر', description: 'جلسة ليزر لإزالة الشعر أو التجاعيد', duration: 30, bufferBefore: 10, bufferAfter: 10, price: 500, variablePrice: true, minPrice: 300, maxPrice: 800, isActive: true, requiresDeposit: true, depositAmount: 100, allowOnlineBooking: true, maxBookingsPerSlot: 1, createdAt: '2026-06-01T10:00:00.000Z' },
  { id: 'demo-svc-7', tenantId: DEMO_TENANT.id, categoryId: 'demo-cat-4', name: 'كشف عظام', description: 'فحص العظام والمفاصل', duration: 30, bufferBefore: 0, bufferAfter: 5, price: 200, variablePrice: false, minPrice: null, maxPrice: null, isActive: true, requiresDeposit: false, depositAmount: 0, allowOnlineBooking: true, maxBookingsPerSlot: 1, createdAt: '2026-06-01T10:00:00.000Z' },
  { id: 'demo-svc-8', tenantId: DEMO_TENANT.id, categoryId: 'demo-cat-4', name: 'فيزيو ثريبي', description: 'جلسة فيزيوترابي متكاملة', duration: 45, bufferBefore: 5, bufferAfter: 10, price: 250, variablePrice: false, minPrice: null, maxPrice: null, isActive: true, requiresDeposit: false, depositAmount: 0, allowOnlineBooking: true, maxBookingsPerSlot: 1, createdAt: '2026-06-01T10:00:00.000Z' },
]

export const DEMO_EMPLOYEES = [
  { id: 'demo-emp-1', tenantId: DEMO_TENANT.id, branchId: 'demo-branch-1', name: 'د. أحمد محمد العلي', email: 'dr.ahmed@alnoor.sa', phone: '0551234567', specialization: 'طب عام', bio: 'طبيب عام بخبرة 15 سنة', commissionRate: 30, isActive: true, color: '#0e7490', createdAt: '2026-06-01T10:00:00.000Z' },
  { id: 'demo-emp-2', tenantId: DEMO_TENANT.id, branchId: 'demo-branch-1', name: 'د. سارة خالد الأحمد', email: 'dr.sara@alnoor.sa', phone: '0552345678', specialization: 'طب أسنان', bio: 'أخصائية تقويم أسنان', commissionRate: 35, isActive: true, color: '#7c3aed', createdAt: '2026-06-01T10:00:00.000Z' },
  { id: 'demo-emp-3', tenantId: DEMO_TENANT.id, branchId: 'demo-branch-2', name: 'د. فهد عبدالله السعيد', email: 'dr.fahad@alnoor.sa', phone: '0553456789', specialization: 'جلدية', bio: 'استشاري جلدية وتجميل', commissionRate: 40, isActive: true, color: '#ec4899', createdAt: '2026-06-01T10:00:00.000Z' },
  { id: 'demo-emp-4', tenantId: DEMO_TENANT.id, branchId: 'demo-branch-2', name: 'د. نورة سعد القحطاني', email: 'dr.noura@alnoor.sa', phone: '0554567890', specialization: 'عظام', bio: 'أخصائية عظام وعمود فقري', commissionRate: 35, isActive: true, color: '#f59e0b', createdAt: '2026-06-01T10:00:00.000Z' },
  { id: 'demo-emp-5', tenantId: DEMO_TENANT.id, branchId: 'demo-branch-3', name: 'أ. محمد العتيبي', email: 'm.oteibi@alnoor.sa', phone: '0555678901', specialization: 'فيزيوترابي', bio: 'أخصائي فيزيوترابي', commissionRate: 25, isActive: true, color: '#10b981', createdAt: '2026-06-15T10:00:00.000Z' },
]

export const DEMO_CUSTOMERS = [
  { id: 'demo-cust-1', tenantId: DEMO_TENANT.id, name: 'عبدالرحمن الشمري', email: 'abdulrahman@email.com', phone: '0551112233', gender: 'male', dateOfBirth: '1990-05-15', notes: 'عميل منتظم', totalVisits: 8, totalSpent: 1200, lastVisit: '2026-07-01T10:00:00.000Z', isActive: true, createdAt: '2026-06-01T10:00:00.000Z' },
  { id: 'demo-cust-2', tenantId: DEMO_TENANT.id, name: 'فاطمة الزهراني', email: 'fatima@email.com', phone: '0552223344', gender: 'female', dateOfBirth: '1985-11-20', notes: 'حساسة من البنسلين', totalVisits: 12, totalSpent: 3400, lastVisit: '2026-07-03T14:00:00.000Z', isActive: true, createdAt: '2026-06-01T10:00:00.000Z' },
  { id: 'demo-cust-3', tenantId: DEMO_TENANT.id, name: 'خالد الدوسري', email: 'khaled@email.com', phone: '0553334455', gender: 'male', dateOfBirth: '1978-03-10', notes: '', totalVisits: 5, totalSpent: 800, lastVisit: '2026-06-28T09:00:00.000Z', isActive: true, createdAt: '2026-06-05T10:00:00.000Z' },
  { id: 'demo-cust-4', tenantId: DEMO_TENANT.id, name: 'نوف السبيعي', email: 'nouf@email.com', phone: '0554445566', gender: 'female', dateOfBirth: '1995-08-25', notes: 'تفضل مواعيد المساء', totalVisits: 3, totalSpent: 600, lastVisit: '2026-07-02T16:00:00.000Z', isActive: true, createdAt: '2026-06-10T10:00:00.000Z' },
  { id: 'demo-cust-5', tenantId: DEMO_TENANT.id, name: 'سلطان المطيري', email: 'sultan@email.com', phone: '0555556677', gender: 'male', dateOfBirth: '1982-12-01', notes: 'عميل VIP', totalVisits: 20, totalSpent: 8500, lastVisit: '2026-07-04T11:00:00.000Z', isActive: true, createdAt: '2026-06-01T10:00:00.000Z' },
  { id: 'demo-cust-6', tenantId: DEMO_TENANT.id, name: 'ريم العنزي', email: 'reem@email.com', phone: '0556667788', gender: 'female', dateOfBirth: '1993-04-18', notes: '', totalVisits: 6, totalSpent: 1500, lastVisit: '2026-07-01T13:00:00.000Z', isActive: true, createdAt: '2026-06-08T10:00:00.000Z' },
  { id: 'demo-cust-7', tenantId: DEMO_TENANT.id, name: 'يزيد الحربي', email: 'yazeed@email.com', phone: '0557778899', gender: 'male', dateOfBirth: '1988-07-30', notes: 'يعاني من حساسية صدرية', totalVisits: 4, totalSpent: 700, lastVisit: '2026-06-25T10:30:00.000Z', isActive: true, createdAt: '2026-06-12T10:00:00.000Z' },
  { id: 'demo-cust-8', tenantId: DEMO_TENANT.id, name: 'لمى القحطاني', email: 'lama@email.com', phone: '0558889900', gender: 'female', dateOfBirth: '1997-02-14', notes: '', totalVisits: 2, totalSpent: 350, lastVisit: '2026-06-30T15:00:00.000Z', isActive: true, createdAt: '2026-06-20T10:00:00.000Z' },
  { id: 'demo-cust-9', tenantId: DEMO_TENANT.id, name: 'عمر الغامدي', email: 'omar@email.com', phone: '0559990011', gender: 'male', dateOfBirth: '1975-09-05', notes: 'عميل منذ التأسيس', totalVisits: 25, totalSpent: 12000, lastVisit: '2026-07-05T09:30:00.000Z', isActive: true, createdAt: '2026-06-01T10:00:00.000Z' },
  { id: 'demo-cust-10', tenantId: DEMO_TENANT.id, name: 'هند الشهري', email: 'hind@email.com', phone: '0550001122', gender: 'female', dateOfBirth: '1991-06-22', notes: 'تحجز لطفلها أيضاً', totalVisits: 10, totalSpent: 2800, lastVisit: '2026-07-04T14:30:00.000Z', isActive: true, createdAt: '2026-06-03T10:00:00.000Z' },
]

const today = new Date()
const fmt = (d: Date) => d.toISOString()
const addDays = (d: Date, n: number) => { const r = new Date(d); r.setDate(r.getDate() + n); return r }
const addHours = (d: Date, n: number) => { const r = new Date(d); r.setHours(r.getHours() + n); return r }

export const DEMO_BOOKINGS = [
  // Today's bookings
  { id: 'demo-bk-1', tenantId: DEMO_TENANT.id, branchId: 'demo-branch-1', customerId: 'demo-cust-1', employeeId: 'demo-emp-1', serviceId: 'demo-svc-1', status: 'confirmed', type: 'single', startDate: fmt(addHours(today, 1)), endDate: fmt(addHours(today, 1.5)), startTime: '10:00', endTime: '10:30', notes: 'مريجععة دورية', totalPrice: 150, depositAmount: 0, paymentStatus: 'pending', source: 'walk_in', createdAt: fmt(addDays(today, -2)) },
  { id: 'demo-bk-2', tenantId: DEMO_TENANT.id, branchId: 'demo-branch-1', customerId: 'demo-cust-2', employeeId: 'demo-emp-2', serviceId: 'demo-svc-3', status: 'in_progress', type: 'single', startDate: fmt(addHours(today, 2)), endDate: fmt(addHours(today, 2.75)), startTime: '11:00', endTime: '11:45', notes: '', totalPrice: 300, depositAmount: 0, paymentStatus: 'pending', source: 'online', createdAt: fmt(addDays(today, -3)) },
  { id: 'demo-bk-3', tenantId: DEMO_TENANT.id, branchId: 'demo-branch-2', customerId: 'demo-cust-5', employeeId: 'demo-emp-3', serviceId: 'demo-svc-6', status: 'confirmed', type: 'single', startDate: fmt(addHours(today, 3)), endDate: fmt(addHours(today, 3.5)), startTime: '12:00', endTime: '12:30', notes: 'عميل VIP', totalPrice: 500, depositAmount: 100, paymentStatus: 'partial', source: 'whatsapp', createdAt: fmt(addDays(today, -1)) },
  { id: 'demo-bk-4', tenantId: DEMO_TENANT.id, branchId: 'demo-branch-3', customerId: 'demo-cust-6', employeeId: 'demo-emp-5', serviceId: 'demo-svc-8', status: 'confirmed', type: 'single', startDate: fmt(addHours(today, 5)), endDate: fmt(addHours(today, 5.75)), startTime: '14:00', endTime: '14:45', notes: '', totalPrice: 250, depositAmount: 0, paymentStatus: 'pending', source: 'online', createdAt: fmt(addDays(today, -1)) },

  // Past bookings (recent)
  { id: 'demo-bk-5', tenantId: DEMO_TENANT.id, branchId: 'demo-branch-1', customerId: 'demo-cust-3', employeeId: 'demo-emp-1', serviceId: 'demo-svc-2', status: 'completed', type: 'single', startDate: fmt(addDays(today, -1)), endDate: fmt(addHours(addDays(today, -1), 0.33)), startTime: '09:00', endTime: '09:20', notes: '', totalPrice: 100, depositAmount: 0, paymentStatus: 'paid', source: 'walk_in', createdAt: fmt(addDays(today, -4)) },
  { id: 'demo-bk-6', tenantId: DEMO_TENANT.id, branchId: 'demo-branch-1', customerId: 'demo-cust-4', employeeId: 'demo-emp-2', serviceId: 'demo-svc-4', status: 'completed', type: 'single', startDate: fmt(addDays(today, -1)), endDate: fmt(addHours(addDays(today, -1), 1)), startTime: '11:00', endTime: '12:00', notes: 'تركيب تقويم شفاف', totalPrice: 3500, depositAmount: 500, paymentStatus: 'paid', source: 'online', createdAt: fmt(addDays(today, -7)) },
  { id: 'demo-bk-7', tenantId: DEMO_TENANT.id, branchId: 'demo-branch-2', customerId: 'demo-cust-7', employeeId: 'demo-emp-3', serviceId: 'demo-svc-5', status: 'completed', type: 'single', startDate: fmt(addDays(today, -2)), endDate: fmt(addHours(addDays(today, -2), 0.5)), startTime: '10:30', endTime: '11:00', notes: 'حساسية صدرية', totalPrice: 200, depositAmount: 0, paymentStatus: 'paid', source: 'walk_in', createdAt: fmt(addDays(today, -5)) },
  { id: 'demo-bk-8', tenantId: DEMO_TENANT.id, branchId: 'demo-branch-1', customerId: 'demo-cust-8', employeeId: 'demo-emp-1', serviceId: 'demo-svc-1', status: 'no_show', type: 'single', startDate: fmt(addDays(today, -2)), endDate: fmt(addHours(addDays(today, -2), 0.5)), startTime: '14:00', endTime: '14:30', notes: '', totalPrice: 150, depositAmount: 0, paymentStatus: 'pending', source: 'online', createdAt: fmt(addDays(today, -4)) },
  { id: 'demo-bk-9', tenantId: DEMO_TENANT.id, branchId: 'demo-branch-3', customerId: 'demo-cust-9', employeeId: 'demo-emp-5', serviceId: 'demo-svc-8', status: 'completed', type: 'single', startDate: fmt(addDays(today, -3)), endDate: fmt(addHours(addDays(today, -3), 0.75)), startTime: '09:30', endTime: '10:15', notes: 'عميل VIP', totalPrice: 250, depositAmount: 0, paymentStatus: 'paid', source: 'whatsapp', createdAt: fmt(addDays(today, -6)) },
  { id: 'demo-bk-10', tenantId: DEMO_TENANT.id, branchId: 'demo-branch-1', customerId: 'demo-cust-10', employeeId: 'demo-emp-2', serviceId: 'demo-svc-3', status: 'completed', type: 'single', startDate: fmt(addDays(today, -3)), endDate: fmt(addHours(addDays(today, -3), 0.75)), startTime: '13:00', endTime: '13:45', notes: '', totalPrice: 300, depositAmount: 0, paymentStatus: 'paid', source: 'online', createdAt: fmt(addDays(today, -5)) },

  // More past bookings
  { id: 'demo-bk-11', tenantId: DEMO_TENANT.id, branchId: 'demo-branch-2', customerId: 'demo-cust-1', employeeId: 'demo-emp-3', serviceId: 'demo-svc-5', status: 'completed', type: 'single', startDate: fmt(addDays(today, -5)), endDate: fmt(addHours(addDays(today, -5), 0.5)), startTime: '11:00', endTime: '11:30', notes: '', totalPrice: 200, depositAmount: 0, paymentStatus: 'paid', source: 'walk_in', createdAt: fmt(addDays(today, -8)) },
  { id: 'demo-bk-12', tenantId: DEMO_TENANT.id, branchId: 'demo-branch-1', customerId: 'demo-cust-5', employeeId: 'demo-emp-1', serviceId: 'demo-svc-1', status: 'completed', type: 'single', startDate: fmt(addDays(today, -5)), endDate: fmt(addHours(addDays(today, -5), 0.5)), startTime: '15:00', endTime: '15:30', notes: '', totalPrice: 150, depositAmount: 0, paymentStatus: 'paid', source: 'online', createdAt: fmt(addDays(today, -7)) },
  { id: 'demo-bk-13', tenantId: DEMO_TENANT.id, branchId: 'demo-branch-2', customerId: 'demo-cust-2', employeeId: 'demo-emp-4', serviceId: 'demo-svc-7', status: 'cancelled', type: 'single', startDate: fmt(addDays(today, -6)), endDate: fmt(addHours(addDays(today, -6), 0.5)), startTime: '10:00', endTime: '10:30', notes: 'ألغت العميل', totalPrice: 200, depositAmount: 0, paymentStatus: 'refunded', source: 'online', createdAt: fmt(addDays(today, -9)) },
  { id: 'demo-bk-14', tenantId: DEMO_TENANT.id, branchId: 'demo-branch-1', customerId: 'demo-cust-3', employeeId: 'demo-emp-2', serviceId: 'demo-svc-3', status: 'completed', type: 'single', startDate: fmt(addDays(today, -7)), endDate: fmt(addHours(addDays(today, -7), 0.75)), startTime: '09:00', endTime: '09:45', notes: '', totalPrice: 300, depositAmount: 0, paymentStatus: 'paid', source: 'walk_in', createdAt: fmt(addDays(today, -10)) },
  { id: 'demo-bk-15', tenantId: DEMO_TENANT.id, branchId: 'demo-branch-3', customerId: 'demo-cust-9', employeeId: 'demo-emp-5', serviceId: 'demo-svc-8', status: 'completed', type: 'single', startDate: fmt(addDays(today, -4)), endDate: fmt(addHours(addDays(today, -4), 0.75)), startTime: '16:00', endTime: '16:45', notes: '', totalPrice: 250, depositAmount: 0, paymentStatus: 'paid', source: 'whatsapp', createdAt: fmt(addDays(today, -6)) },

  // Future bookings
  { id: 'demo-bk-16', tenantId: DEMO_TENANT.id, branchId: 'demo-branch-1', customerId: 'demo-cust-7', employeeId: 'demo-emp-1', serviceId: 'demo-svc-1', status: 'confirmed', type: 'single', startDate: fmt(addDays(today, 1)), endDate: fmt(addHours(addDays(today, 1), 0.5)), startTime: '10:00', endTime: '10:30', notes: '', totalPrice: 150, depositAmount: 0, paymentStatus: 'pending', source: 'online', createdAt: fmt(today) },
  { id: 'demo-bk-17', tenantId: DEMO_TENANT.id, branchId: 'demo-branch-2', customerId: 'demo-cust-4', employeeId: 'demo-emp-3', serviceId: 'demo-svc-6', status: 'confirmed', type: 'single', startDate: fmt(addDays(today, 2)), endDate: fmt(addHours(addDays(today, 2), 0.5)), startTime: '14:00', endTime: '14:30', notes: '', totalPrice: 500, depositAmount: 100, paymentStatus: 'partial', source: 'online', createdAt: fmt(today) },
  { id: 'demo-bk-18', tenantId: DEMO_TENANT.id, branchId: 'demo-branch-1', customerId: 'demo-cust-10', employeeId: 'demo-emp-2', serviceId: 'demo-svc-3', status: 'confirmed', type: 'single', startDate: fmt(addDays(today, 3)), endDate: fmt(addHours(addDays(today, 3), 0.75)), startTime: '11:00', endTime: '11:45', notes: '', totalPrice: 300, depositAmount: 0, paymentStatus: 'pending', source: 'whatsapp', createdAt: fmt(today) },
]

export const DEMO_COUPONS = [
  { id: 'demo-cp-1', tenantId: DEMO_TENANT.id, code: 'WELCOME20', description: 'خصم 20% للعملاء الجدد', discountType: 'percentage', discountValue: 20, minOrderAmount: 100, maxDiscountAmount: 200, usageLimit: 100, usedCount: 34, isActive: true, startsAt: fmt(addDays(today, -30)), endsAt: fmt(addDays(today, 30)), createdAt: fmt(addDays(today, -30)) },
  { id: 'demo-cp-2', tenantId: DEMO_TENANT.id, code: 'SUMMER50', description: 'خصم 50 ريال على جلسة ليزر', discountType: 'fixed', discountValue: 50, minOrderAmount: 300, maxDiscountAmount: 50, usageLimit: 50, usedCount: 12, isActive: true, startsAt: fmt(addDays(today, -15)), endsAt: fmt(addDays(today, 15)), createdAt: fmt(addDays(today, -15)) },
  { id: 'demo-cp-3', tenantId: DEMO_TENANT.id, code: 'VIP30', description: 'خصم 30% للعملاء المميزين', discountType: 'percentage', discountValue: 30, minOrderAmount: 200, maxDiscountAmount: 500, usageLimit: 20, usedCount: 8, isActive: true, startsAt: fmt(addDays(today, -10)), endsAt: fmt(addDays(today, 60)), createdAt: fmt(addDays(today, -10)) },
]

export const DEMO_ROLES = [
  { id: 'demo-role-1', tenantId: DEMO_TENANT.id, name: 'admin', description: 'مدير النظام - صلاحيات كاملة', isDefault: true, permissions: null, userCount: 1, isActive: true, createdAt: '2026-06-01T10:00:00.000Z' },
  { id: 'demo-role-2', tenantId: DEMO_TENANT.id, name: 'receptionist', description: 'موظف الاستقبال - صلاحيات محدودة', isDefault: false, permissions: null, userCount: 2, isActive: true, createdAt: '2026-06-01T10:00:00.000Z' },
  { id: 'demo-role-3', tenantId: DEMO_TENANT.id, name: 'doctor', description: 'طبيب - عرض وإدارة الحجوزات', isDefault: false, permissions: null, userCount: 5, isActive: true, createdAt: '2026-06-01T10:00:00.000Z' },
]

export const DEMO_PAYMENTS = DEMO_BOOKINGS
  .filter(b => b.status === 'completed')
  .map(b => ({
    id: `demo-pay-${b.id}`,
    tenantId: b.tenantId,
    bookingId: b.id,
    customerId: b.customerId,
    amount: b.totalPrice,
    method: 'cash',
    status: 'completed',
    reference: null,
    notes: '',
    createdAt: b.startDate,
  }))

// Helper: find entity by id from demo arrays
export function findDemo<T extends { id: string }>(arr: T[], id: string): T | undefined {
  return arr.find(item => item.id === id)
}

// Helper: enrich booking with employee/customer/service/branch names
export function enrichDemoBooking(booking: typeof DEMO_BOOKINGS[0]) {
  const emp = findDemo(DEMO_EMPLOYEES, booking.employeeId)
  const cust = findDemo(DEMO_CUSTOMERS, booking.customerId)
  const svc = findDemo(DEMO_SERVICES, booking.serviceId)
  const branch = findDemo(DEMO_BRANCHES, booking.branchId)
  return {
    ...booking,
    employee: emp ? { id: emp.id, name: emp.name, specialization: emp.specialization, color: emp.color } : null,
    customer: cust ? { id: cust.id, name: cust.name, phone: cust.phone, email: cust.email } : null,
    service: svc ? { id: svc.id, name: svc.name, duration: svc.duration, price: svc.price } : null,
    branch: branch ? { id: branch.id, name: branch.name } : null,
  }
}