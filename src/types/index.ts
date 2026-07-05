// ============================================================
// Multi-Tenant SaaS Booking Platform – TypeScript Type Definitions
// ============================================================

// ==================== PRIMITIVES & ENUMS ====================

export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show'

export type BookingType = 'single' | 'recurring' | 'group'

export type PaymentStatus =
  | 'pending'
  | 'paid'
  | 'failed'
  | 'refunded'
  | 'partially_refunded'

export type PaymentMethod =
  | 'cash'
  | 'card'
  | 'online'
  | 'wallet'
  | 'bank_transfer'
  | 'apple_pay'
  | 'mada'
  | 'stc_pay'

export type CouponType = 'percentage' | 'fixed'

export type NotificationType = 'info' | 'warning' | 'error' | 'success'

export type NotificationChannel = 'in_app' | 'email' | 'sms' | 'whatsapp'

export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled'

export type SubscriptionStatus = 'active' | 'expired' | 'cancelled' | 'trialing'

export type BillingInterval = 'monthly' | 'yearly' | 'lifetime'

export type MembershipTier = 'regular' | 'silver' | 'gold' | 'platinum' | 'diamond'

export type CustomerSource =
  | 'direct'
  | 'referral'
  | 'social_media'
  | 'website'
  | 'google'
  | 'instagram'
  | 'walk_in'

export type BookingSource = 'online' | 'walk_in' | 'phone' | 'admin' | 'whatsapp'

export type Gender = 'male' | 'female' | 'other'

export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6

export type ThemeMode = 'light' | 'dark' | 'system'

export type AppCurrency = 'SAR' | 'AED' | 'KWD' | 'BHD' | 'QAR' | 'OMR' | 'USD' | 'EUR' | 'GBP' | 'EGP'

// ==================== TENANT & SUBSCRIPTION ====================

export interface Tenant {
  id: string
  name: string
  slug: string
  businessType: string
  domain: string | null
  logo: string | null
  primaryColor: string
  secondaryColor: string
  timezone: string
  currency: string
  language: string
  theme: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface SubscriptionPlan {
  id: string
  name: string
  slug: string
  price: number
  interval: BillingInterval
  maxUsers: number
  maxEmployees: number
  maxBranches: number
  maxBookings: number
  maxServices: number
  maxStorage: number
  hasSms: boolean
  hasWhatsapp: boolean
  hasCalendarSync: boolean
  hasReports: boolean
  hasApiAccess: boolean
  hasIntegrations: boolean
  hasWhiteLabel: boolean
  hasCustomDomain: boolean
  features: string // JSON string
  isActive: boolean
  createdAt: Date
}

export interface TenantSubscription {
  id: string
  tenantId: string
  planId: string
  status: SubscriptionStatus
  startDate: Date
  endDate: Date
  trialEndsAt: Date | null
  lastBilledAt: Date | null
  createdAt: Date
  updatedAt: Date
  tenant?: Tenant
  plan?: SubscriptionPlan
}

// ==================== RBAC ====================

export interface PermissionMap {
  [resource: string]: {
    [action: string]: boolean
  }
}

export type PermissionResource =
  | 'dashboard'
  | 'bookings'
  | 'customers'
  | 'employees'
  | 'services'
  | 'branches'
  | 'payments'
  | 'reports'
  | 'settings'
  | 'roles'
  | 'coupons'
  | 'notifications'
  | 'audit_logs'
  | 'whatsapp'
  | 'subscriptions'

export type PermissionAction =
  | 'view'
  | 'create'
  | 'edit'
  | 'delete'
  | 'export'
  | 'manage'

export interface Role {
  id: string
  tenantId: string
  name: string
  description: string | null
  isDefault: boolean
  permissions: string // JSON string – parse as PermissionMap
  createdAt: Date
  updatedAt: Date
  tenant?: Tenant
}

export interface TenantUser {
  id: string
  tenantId: string
  roleId: string
  email: string
  name: string
  avatar: string | null
  phone: string | null
  isActive: boolean
  lastLoginAt: Date | null
  createdAt: Date
  updatedAt: Date
  tenant?: Tenant
  role?: Role
}

// ==================== BRANCHES ====================

export interface Branch {
  id: string
  tenantId: string
  name: string
  address: string | null
  city: string | null
  country: string | null
  phone: string | null
  email: string | null
  timezone: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  tenant?: Tenant
}

// ==================== EMPLOYEES ====================

export interface Employee {
  id: string
  tenantId: string
  branchId: string
  name: string
  email: string | null
  phone: string | null
  avatar: string | null
  bio: string | null
  specialization: string | null
  commissionRate: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  tenant?: Tenant
  branch?: Branch
}

export interface EmployeeSchedule {
  id: string
  tenantId: string
  employeeId: string
  branchId: string
  dayOfWeek: Weekday
  startTime: string
  endTime: string
  breakStart: string | null
  breakEnd: string | null
  isWorking: boolean
  createdAt: Date
  updatedAt: Date
  tenant?: Tenant
  employee?: Employee
  branch?: Branch
}

export interface EmployeeLeave {
  id: string
  tenantId: string
  employeeId: string
  startDate: Date
  endDate: Date
  reason: string | null
  status: LeaveStatus
  createdAt: Date
  tenant?: Tenant
  employee?: Employee
}

export interface EmployeeService {
  id: string
  tenantId: string
  employeeId: string
  serviceId: string
  canPerform: boolean
  createdAt: Date
  tenant?: Tenant
  employee?: Employee
  service?: Service
}

// ==================== CUSTOMERS ====================

export interface Customer {
  id: string
  tenantId: string
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  avatar: string | null
  dateOfBirth: Date | null
  gender: Gender | null
  address: string | null
  city: string | null
  country: string | null
  notes: string | null
  tags: string // JSON string
  loyaltyPoints: number
  membershipTier: MembershipTier
  isBlacklisted: boolean
  portalAccess: boolean
  source: CustomerSource
  customFields: string // JSON string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  tenant?: Tenant
}

export interface CustomerNote {
  id: string
  tenantId: string
  customerId: string
  content: string
  createdBy: string
  createdAt: Date
  tenant?: Tenant
  customer?: Customer
}

// ==================== SERVICES ====================

export interface ServiceCategory {
  id: string
  tenantId: string
  name: string
  description: string | null
  icon: string | null
  color: string | null
  sortOrder: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  tenant?: Tenant
}

export interface Service {
  id: string
  tenantId: string
  categoryId: string
  name: string
  description: string | null
  duration: number
  bufferBefore: number
  bufferAfter: number
  price: number
  variablePrice: boolean
  minPrice: number | null
  maxPrice: number | null
  image: string | null
  isActive: boolean
  maxCapacity: number
  isGroupBooking: boolean
  requireDeposit: boolean
  depositAmount: number | null
  customFields: string // JSON string
  taxRate: number
  sortOrder: number
  createdAt: Date
  updatedAt: Date
  tenant?: Tenant
  category?: ServiceCategory
}

// ==================== BOOKINGS ====================

export interface Booking {
  id: string
  tenantId: string
  branchId: string
  customerId: string
  employeeId: string | null
  status: BookingStatus
  type: BookingType
  startDate: Date
  endDate: Date
  startTime: string
  endTime: string
  notes: string | null
  internalNotes: string | null
  source: BookingSource
  totalPrice: number
  depositAmount: number
  paidAmount: number
  discountAmount: number
  taxAmount: number
  tipAmount: number
  isRecurring: boolean
  recurringPattern: string | null
  parentBookingId: string | null
  noShowCount: number
  reminderSent: boolean
  confirmationSent: boolean
  customFieldValues: string // JSON string
  createdAt: Date
  updatedAt: Date
  tenant?: Tenant
  branch?: Branch
  customer?: Customer
  employee?: TenantUser | null
  parent?: Booking | null
  children?: Booking[]
  services?: BookingService[]
  payments?: Payment[]
  waitlistEntry?: WaitlistEntry | null
}

export interface BookingService {
  id: string
  bookingId: string
  serviceId: string
  price: number
  duration: number
  quantity: number
  employeeId: string | null
  booking?: Booking
  service?: Service
}

export interface WaitlistEntry {
  id: string
  tenantId: string
  customerId: string
  serviceId: string
  branchId: string
  preferredDate: string | null
  preferredTime: string | null
  status: 'waiting' | 'notified' | 'booked' | 'cancelled' | 'expired'
  bookingId: string | null
  createdAt: Date
  updatedAt: Date
  tenant?: Tenant
  customer?: Customer
  booking?: Booking | null
}

// ==================== PAYMENTS ====================

export interface Payment {
  id: string
  tenantId: string
  bookingId: string
  customerId: string | null
  amount: number
  method: PaymentMethod
  status: PaymentStatus
  currency: string
  transactionId: string | null
  couponId: string | null
  giftCardCode: string | null
  walletUsed: boolean
  walletAmount: number
  refundedAmount: number
  notes: string | null
  createdAt: Date
  updatedAt: Date
  tenant?: Tenant
  booking?: Booking
  customer?: Customer | null
  coupon?: Coupon | null
}

export interface Coupon {
  id: string
  tenantId: string
  code: string
  type: CouponType
  value: number
  minPurchase: number | null
  maxUses: number | null
  usedCount: number
  startDate: Date
  endDate: Date
  isActive: boolean
  createdAt: Date
  tenant?: Tenant
  payments?: Payment[]
}

// ==================== NOTIFICATIONS ====================

export interface Notification {
  id: string
  tenantId: string
  userId: string | null
  customerId: string | null
  title: string
  message: string
  type: NotificationType
  channel: NotificationChannel
  isRead: boolean
  relatedId: string | null
  relatedType: string | null
  createdAt: Date
  tenant?: Tenant
}

// ==================== AUDIT LOG ====================

export interface AuditLog {
  id: string
  tenantId: string
  userId: string
  action: string
  entity: string
  entityId: string | null
  details: string | null
  ipAddress: string | null
  userAgent: string | null
  createdAt: Date
  tenant?: Tenant
  user?: TenantUser
}

// ==================== DASHBOARD & CHARTS ====================

export interface DashboardStats {
  totalRevenue: number
  revenueChange: number // percentage change from previous period
  totalBookings: number
  bookingsChange: number
  totalCustomers: number
  customersChange: number
  totalEmployees: number
  employeesChange: number
  occupancyRate: number
  noShowRate: number
  conversionRate: number
  averageBookingValue: number
  topServices: TopService[]
  topEmployees: TopEmployee[]
  recentBookings: RecentBooking[]
  monthlyRevenue: ChartDataPoint[]
  weeklyStats: ChartDataPoint[]
}

export interface TopService {
  serviceId: string
  serviceName: string
  bookingCount: number
  revenue: number
}

export interface TopEmployee {
  employeeId: string
  employeeName: string
  bookingCount: number
  revenue: number
  rating: number
}

export interface RecentBooking {
  id: string
  customerName: string
  serviceName: string
  employeeName: string | null
  startTime: string
  status: BookingStatus
  branchName: string
}

export interface ChartDataPoint {
  label: string
  value: number
  secondaryValue?: number
  date?: string
}

export interface KPI {
  id: string
  title: string
  value: number
  previousValue: number
  change: number // percentage
  trend: 'up' | 'down' | 'neutral'
  format: 'currency' | 'number' | 'percentage'
  icon?: string
  color?: string
}

// ==================== FORM DATA ====================

export interface BookingFormData {
  customerId: string
  branchId: string
  employeeId: string | null
  services: {
    serviceId: string
    employeeId: string | null
    quantity: number
  }[]
  startDate: string
  startTime: string
  type: BookingType
  notes: string
  internalNotes: string
  source: BookingSource
  couponCode: string
}

export interface CustomerFormData {
  firstName: string
  lastName: string
  email: string
  phone: string
  dateOfBirth: string
  gender: Gender | ''
  address: string
  city: string
  country: string
  tags: string[]
  source: CustomerSource
  notes: string
}

export interface EmployeeFormData {
  name: string
  email: string
  phone: string
  branchId: string
  specialization: string
  commissionRate: number
  bio: string
  serviceIds: string[]
}

export interface ServiceFormData {
  name: string
  description: string
  categoryId: string
  duration: number
  bufferBefore: number
  bufferAfter: number
  price: number
  variablePrice: boolean
  minPrice: number | null
  maxPrice: number | null
  maxCapacity: number
  isGroupBooking: boolean
  requireDeposit: boolean
  depositAmount: number | null
  taxRate: number
  employeeIds: string[]
  isActive: boolean
}

export interface BranchFormData {
  name: string
  address: string
  city: string
  country: string
  phone: string
  email: string
  timezone: string
  isActive: boolean
}

// ==================== NAVIGATION ====================

export interface NavItem {
  key: string
  label: string
  icon: string
  href: string
  badge?: number
  children?: NavItem[]
  permission?: {
    resource: PermissionResource
    action: PermissionAction
  }
}

export interface NavGroup {
  label: string
  items: NavItem[]
}

export interface AppNavigation {
  main: NavGroup[]
  settings: NavGroup[]
  mobile: NavItem[]
}

// ==================== PAGINATION & FILTERING ====================

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export interface PaginationParams {
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface FilterParams {
  search?: string
  status?: string
  branchId?: string
  employeeId?: string
  categoryId?: string
  dateFrom?: string
  dateTo?: string
  [key: string]: string | number | boolean | undefined
}

// ==================== API ====================

export interface ApiResponse<T> {
  data: T
  message?: string
  success: boolean
}

export interface ApiError {
  message: string
  code: string
  details?: Record<string, string[]>
  statusCode: number
}

// ==================== TIME SLOTS ====================

export interface TimeSlot {
  time: string
  label: string
  available: boolean
  employeeId?: string
}

export interface AvailableSlot {
  date: string
  slots: TimeSlot[]
}

// ==================== EMPLOYEE PERFORMANCE ====================

export interface EmployeePerformance {
  employeeId: string
  employeeName: string
  totalBookings: number
  completedBookings: number
  cancelledBookings: number
  noShows: number
  totalRevenue: number
  commission: number
  averageRating: number
  completionRate: number
}

// ==================== UTILITY TYPES ====================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> =
  T & Required<Pick<T, Keys>>

export type Enumerate<N extends number, Acc extends number[] = []> =
  Acc['length'] extends N
    ? Acc[number]
    : Enumerate<N, [...Acc, Acc['length']]>

export type IntRange<Start extends number, End extends number> =
  Exclude<Enumerate<End>, Enumerate<Start>>