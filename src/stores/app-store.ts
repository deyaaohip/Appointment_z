import { create } from 'zustand'
import type { Locale } from '@/lib/i18n'
import type { PermissionMap } from '@/types'
import { getPermissionsForPlan, getCanViewResources, generateNavItems, generateNavSections, SUPERADMIN_NAV, type NavItemDef } from '@/lib/permissions'

export type AppMode = 'landing' | 'app' | 'super_admin'

interface UserSession {
  id: string
  email: string
  name: string
  avatar: string | null
  phone: string | null
  lastLoginAt: string | null
}

interface UserRole {
  id: string
  name: string
  description: string | null
}

interface SubscriptionState {
  planSlug: string
  isActive: boolean
  status: string
  endDate: string
  permissions: PermissionMap
}

interface AppState {
  // Auth & User
  locale: Locale
  setLocale: (locale: Locale) => void
  appMode: AppMode
  setAppMode: (mode: AppMode) => void
  currentUser: UserSession | null
  setCurrentUser: (user: UserSession | null) => void
  userRole: UserRole | null
  setUserRole: (role: UserRole | null) => void
  userPermissions: PermissionMap
  setUserPermissions: (permissions: PermissionMap) => void
  authToken: string
  setAuthToken: (token: string) => void
  isAuthenticated: boolean
  setIsAuthenticated: (auth: boolean) => void

  // Tenant
  currentTenantId: string | null
  setCurrentTenantId: (id: string) => void
  currentBranchId: string | null
  setCurrentBranchId: (id: string) => void

  // UI
  sidebarOpen: boolean
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  currentView: string
  setCurrentView: (view: string) => void

  // Payment
  selectedPlan: string | null
  setSelectedPlan: (plan: string | null) => void
  showPaymentModal: boolean
  setShowPaymentModal: (show: boolean) => void

  // Subscription & Authorization
  subscription: SubscriptionState
  setSubscription: (sub: Partial<SubscriptionState>) => void
  navItems: NavItemDef[]
  setNavItems: (items: NavItemDef[]) => void
  isSuperAdmin: boolean
  setIsSuperAdmin: (admin: boolean) => void

  // Super Admin
  superAdminView: string
  setSuperAdminView: (view: string) => void

  // White Label / Brand
  brandSettings: Record<string, unknown>
  setBrandSettings: (settings: Record<string, unknown>) => void
  customCurrency: string
  setCustomCurrency: (currency: string) => void
  customTimezone: string
  setCustomTimezone: (tz: string) => void
  themeMode: string
  setThemeMode: (mode: string) => void

  // Logout helper
  logout: () => void
}

export const useAppStore = create<AppState>((set, get) => ({
  // Auth & User
  locale: 'ar',
  setLocale: (locale) => set({ locale }),
  appMode: 'landing',
  setAppMode: (appMode) => set({ appMode }),
  currentUser: null,
  setCurrentUser: (user) => set({ currentUser: user }),
  userRole: null,
  setUserRole: (role) => set({ userRole: role }),
  userPermissions: {},
  setUserPermissions: (permissions) => set({ userPermissions: permissions }),
  authToken: '',
  setAuthToken: (token) => set({ authToken: token }),
  isAuthenticated: false,
  setIsAuthenticated: (auth) => set({ isAuthenticated: auth }),

  // Tenant
  currentTenantId: null,
  setCurrentTenantId: (id) => set({ currentTenantId: id }),
  currentBranchId: null,
  setCurrentBranchId: (id) => set({ currentBranchId: id }),

  // UI
  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  currentView: 'dashboard',
  setCurrentView: (view) => set({ currentView: view }),

  // Payment
  selectedPlan: null,
  setSelectedPlan: (plan) => set({ selectedPlan: plan }),
  showPaymentModal: false,
  setShowPaymentModal: (show) => set({ showPaymentModal: show }),

  // Subscription & Authorization
  navItems: [],
  setNavItems: (items) => set({ navItems: items }),
  isSuperAdmin: false,
  setIsSuperAdmin: (admin) => set({ isSuperAdmin: admin }),
  subscription: {
    planSlug: 'free',
    isActive: true,
    status: 'active',
    endDate: '',
    permissions: {},
  },
  setSubscription: (sub) => {
    const updated = { ...get().subscription, ...sub }
    set({ subscription: updated })
    // Generate nav items from new permissions
    const perms = sub.permissions || {}
    const planPerms = getPermissionsForPlan(sub.planSlug)
    const finalPerms = Object.keys(planPerms).length > 0 ? planPerms : perms
    set({ userPermissions: finalPerms })
    const navItems = generateNavItems(finalPerms, get().isSuperAdmin)
    set({ navItems })
  },

  // White Label / Brand
  brandSettings: {},
  setBrandSettings: (settings) => set({ brandSettings: settings }),
  customCurrency: 'SAR',
  setCustomCurrency: (currency) => set({ customCurrency: currency }),
  customTimezone: 'Asia/Riyadh',
  setCustomTimezone: (tz) => set({ customTimezone: tz }),
  themeMode: 'light',
  setThemeMode: (mode) => set({ themeMode: mode }),

  // Super Admin
  superAdminView: 'sa_overview',
  setSuperAdminView: (view) => set({ superAdminView: view }),

  // Logout: reset all auth state
  logout: () => {
    localStorage.removeItem('bf_token')
    localStorage.removeItem('bf_sa_token')
    set({
      appMode: 'landing',
      currentUser: null,
      userRole: null,
      userPermissions: {},
      authToken: '',
      isAuthenticated: false,
      isSuperAdmin: false,
      currentTenantId: null,
      currentBranchId: null,
      currentView: 'dashboard',
      superAdminView: 'sa_overview',
      sidebarOpen: true,
      showPaymentModal: false,
      selectedPlan: null,
      navItems: [],
    })
  },
}))