'use client'

import { useState, useEffect, lazy, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, CalendarDays, ShieldCheck, Zap, Globe, ArrowRight, ArrowLeft, LogIn, UserPlus, Play, Shield, ArrowLeftRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAppStore } from '@/stores/app-store'
import { t, getDirection, getOppositeLocale } from '@/lib/i18n'
import { Sidebar, AppHeader } from '@/components/layout'
import { LandingPage } from '@/components/landing/landing-page'
import { PaymentModal } from '@/components/payment/payment-modal'
import { DashboardView } from '@/components/dashboard/dashboard-view'
import { BookingsView } from '@/components/bookings/bookings-view'
import CustomersView from '@/components/customers/customers-view'
import EmployeesView from '@/components/employees/employees-view'
import ServicesView from '@/components/services/services-view'
import SubscriptionsView from '@/components/subscriptions/subscriptions-view'
import NotificationsView from '@/components/bookings/notifications-view'
import { SettingsView } from '@/components/bookings/settings-view'
import { AdminPanelView } from '@/components/admin/admin-panel-view'
import { SuperAdminDashboard } from '@/components/admin/super-admin-dashboard'
import { AuditLogsView } from '@/components/admin/audit-logs-view'
import { CalendarView } from '@/components/calendar/calendar-view'
import { InvoicesView } from '@/components/invoices/invoices-view'
import { ResourcesView } from '@/components/resources/resources-view'
import { ReportsView } from '@/components/reports/reports-view'
import { WhitelabelView } from '@/components/whitelabel/whitelabel-view'
import BranchesView from '@/components/branches/branches-view'
import CouponsView from '@/components/coupons/coupons-view'
import RolesView from '@/components/roles/roles-view'
import { WhatsAppView } from '@/components/whatsapp/whatsapp-view'
import { SuperAdminSidebar, SuperAdminHeader } from '@/components/super-admin/super-admin-sidebar'

// ─── Placeholder component for new views ────────────────────────────
function PlaceholderView({ viewKey }: { viewKey: string }) {
  const { locale } = useAppStore()
  const isAr = locale === 'ar'
  const dir = getDirection(locale)
  const title = t(locale, 'nav', viewKey)

  return (
    <div dir={dir} className="flex flex-col items-center justify-center py-20 text-center p-6">
      <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 p-6 mb-6">
        <CalendarDays className="h-12 w-12 text-emerald-500" />
      </div>
      <h2 className="text-2xl font-bold mb-2">{title}</h2>
      <p className="text-muted-foreground max-w-md">
        {isAr
          ? `صفحة ${title} قيد التطوير وستكون متاحة قريبًا`
          : `The ${title} page is under development and will be available soon`}
      </p>
      <Badge variant="secondary" className="mt-4">
        {isAr ? 'قادم قريبًا' : 'Coming Soon'}
      </Badge>
    </div>
  )
}

export default function Home() {
  const {
    locale, setLocale, appMode, setAppMode,
    currentView, setCurrentView,
    currentTenantId, setCurrentTenantId,
    currentBranchId, setCurrentBranchId,
    currentUser, setCurrentUser,
    userPermissions, setUserPermissions,
    userRole, setUserRole,
    setAuthToken,
    superAdminView, setSuperAdminView,
    setIsSuperAdmin, logout,
  } = useAppStore()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [authTab, setAuthTab] = useState<'login' | 'register' | 'demo'>('login')
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const [regForm, setRegForm] = useState({ name: '', email: '', password: '', confirmPassword: '', businessName: '', phone: '' })
  const [regError, setRegError] = useState('')

  // Super Admin login state
  const [showSALogin, setShowSALogin] = useState(false)
  const [saEmail, setSaEmail] = useState('')
  const [saPassword, setSaPassword] = useState('')
  const [saError, setSaError] = useState('')
  const [saLoading, setSaLoading] = useState(false)

  // Apply RTL/LTR and lang to html element
  useEffect(() => {
    const html = document.documentElement
    html.dir = getDirection(locale)
    html.lang = locale
  }, [locale])

  // Quick auto-login when entering app mode
  useEffect(() => {
    if (appMode !== 'app') return
    const quickLogin = async () => {
      setIsLoading(true)
      try {
        const res = await fetch('/api/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: loginEmail }),
        })
        if (res.ok) {
          const data = await res.json()
          if (data.token) {
            localStorage.setItem('bf_token', data.token)
            setAuthToken(data.token)
          }
          setCurrentTenantId(data.tenant?.id)
          setCurrentUser(data.user)
          setUserRole(data.role)
          setUserPermissions(data.permissions)
          if (data.tenant?.branches?.[0]?.id) {
            setCurrentBranchId(data.tenant.branches[0].id)
          }
          setIsAuthenticated(true)
        } else {
          setIsAuthenticated(false)
        }
      } catch {
        setIsAuthenticated(false)
      } finally {
        setIsLoading(false)
      }
    }
    quickLogin()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appMode])

  const handleQuickLogin = () => {
    setLoginLoading(true)
    setTimeout(() => {
      setAppMode('app')
      setIsAuthenticated(true)
      setLoginLoading(false)
    }, 300)
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginLoading(true)
    setLoginError('')
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword, name: loginEmail.split('@')[0] }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.token) {
          localStorage.setItem('bf_token', data.token)
          setAuthToken(data.token)
        }
        setCurrentTenantId(data.tenant?.id)
        setCurrentUser(data.user)
        setUserRole(data.role)
        setUserPermissions(data.permissions)
        if (data.tenant?.branches?.[0]?.id) {
          setCurrentBranchId(data.tenant.branches[0].id)
        }
        setAppMode('app')
        setIsAuthenticated(true)
      } else {
        setLoginError(locale === 'ar' ? 'بيانات الدخول غير صحيحة' : 'Invalid credentials')
        setIsAuthenticated(false)
      }
    } catch {
      setLoginError(locale === 'ar' ? 'خطأ في الاتصال بالسيرفر' : 'Server connection error')
      setIsAuthenticated(false)
    } finally {
      setLoginLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setRegError('')
    if (!regForm.name || !regForm.email || !regForm.password) {
      setRegError(locale === 'ar' ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill all required fields')
      return
    }
    if (regForm.password !== regForm.confirmPassword) {
      setRegError(locale === 'ar' ? 'كلمة المرور غير متطابقة' : 'Passwords do not match')
      return
    }
    if (regForm.password.length < 6) {
      setRegError(locale === 'ar' ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' : 'Password must be at least 6 characters')
      return
    }
    setLoginLoading(true)
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: regForm.email,
          password: regForm.password,
          name: regForm.name,
          phone: regForm.phone || null,
          businessName: regForm.businessName || null,
          isRegister: true,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.token) {
          localStorage.setItem('bf_token', data.token)
          setAuthToken(data.token)
        }
        setCurrentTenantId(data.tenant?.id)
        setCurrentUser(data.user)
        setUserRole(data.role)
        setUserPermissions(data.permissions)
        if (data.tenant?.branches?.[0]?.id) {
          setCurrentBranchId(data.tenant.branches[0].id)
        }
        setAppMode('app')
        setIsAuthenticated(true)
      } else {
        const err = await res.json().catch(() => ({}))
        setRegError(err.error || (locale === 'ar' ? 'فشل إنشاء الحساب' : 'Registration failed'))
      }
    } catch {
      setRegError(locale === 'ar' ? 'خطأ في الاتصال بالسيرفر' : 'Server connection error')
    } finally {
      setLoginLoading(false)
    }
  }

  const handleDemoLogin = async () => {
    setLoginLoading(true)
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'demo@bookflow.com', password: 'demo123', name: 'Demo User', isDemo: true }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.token) {
          localStorage.setItem('bf_token', data.token)
          setAuthToken(data.token)
        }
        setCurrentTenantId(data.tenant?.id)
        setCurrentUser(data.user)
        setUserRole(data.role)
        setUserPermissions(data.permissions)
        if (data.tenant?.branches?.[0]?.id) {
          setCurrentBranchId(data.tenant.branches[0].id)
        }
        setAppMode('app')
        setIsAuthenticated(true)
      }
    } catch {
      // Fallback: enter with demo permissions
      setAppMode('app')
      setIsAuthenticated(true)
    } finally {
      setLoginLoading(false)
    }
  }

  // Super Admin Login Handler
  const handleSALogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaLoading(true)
    setSaError('')
    try {
      const res = await fetch('/api/super-admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: saEmail, password: saPassword }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.token) {
          localStorage.setItem('bf_sa_token', data.token)
          setAuthToken(data.token)
        }
        setCurrentUser(data.user)
        setUserRole(data.role)
        setUserPermissions(data.permissions)
        setIsSuperAdmin(true)
        setIsAuthenticated(true)
        setAppMode('super_admin')
      } else {
        const err = await res.json().catch(() => ({}))
        setSaError(err.error || (locale === 'ar' ? 'بيانات الدخول غير صحيحة' : 'Invalid credentials'))
      }
    } catch {
      setSaError(locale === 'ar' ? 'خطأ في الاتصال بالسيرفر' : 'Server connection error')
    } finally {
      setSaLoading(false)
    }
  }

  const renderView = () => {
    switch (currentView) {
      case 'dashboard': return <DashboardView />
      case 'calendar': return <CalendarView />
      case 'bookings': return <BookingsView />
      case 'customers': return <CustomersView />
      case 'employees': return <EmployeesView />
      case 'services': return <ServicesView />
      case 'resources': return <ResourcesView />
      case 'invoices': return <InvoicesView />
      case 'payments': return <PlaceholderView viewKey="payments" />
      case 'subscriptions': return <SubscriptionsView />
      case 'reports': return <ReportsView />
      case 'notifications': return <NotificationsView />
      case 'audit_logs': return <AuditLogsView />
      case 'branches': return <BranchesView />
      case 'coupons': return <CouponsView />
      case 'roles': return <RolesView />
      case 'whatsapp': return <WhatsAppView />
      case 'settings': return <SettingsView />
      case 'admin_panel': return <AdminPanelView />
      case 'super_admin': return <SuperAdminDashboard />
      case 'white_label': return <WhitelabelView />
      default: return <DashboardView />
    }
  }

  // ── Super Admin App Mode ────────────────────────────────────
  if (appMode === 'super_admin' && isAuthenticated) {
    const dir = getDirection(locale)
    return (
      <div dir={dir} className="min-h-screen flex overflow-hidden bg-muted/30">
        <SuperAdminSidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <SuperAdminHeader />
          <main dir={dir} className="flex-1 overflow-auto p-4 sm:p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={superAdminView}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <SuperAdminDashboard />
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    )
  }

  // ── Landing Page Mode ──────────────────────────────────────────
  if (appMode === 'landing') {
    return (
      <>
        <LandingPage />
        <PaymentModal />
      </>
    )
  }

  // ── App Loading ────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-4"
        >
          <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
            <CalendarDays className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">BookFlow</h1>
          <Loader2 className="h-6 w-6 text-emerald-600 animate-spin mx-auto" />
        </motion.div>
      </div>
    )
  }

  // ── Super Admin Login Screen ────────────────────────────────
  if (showSALogin) {
    const isRTL = locale === 'ar'
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-950/30 dark:to-indigo-950/30 p-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Language Toggle + Back */}
          <div className="flex justify-between mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSALogin(false)}
              className="text-sm gap-1"
            >
              <ArrowRight className="h-4 w-4" />
              {isRTL ? 'رجوع' : 'Back'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocale(getOppositeLocale(locale))}
              className="text-sm gap-1"
            >
              <Globe className="h-4 w-4" />
              {locale === 'ar' ? 'English' : 'عربي'}
            </Button>
          </div>

          {/* Logo */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-violet-600/30">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold">BookFlow</h1>
            <p className="text-violet-600 dark:text-violet-400 font-semibold mt-1">
              {isRTL ? 'مدير النظام' : 'Super Admin'}
            </p>
            <p className="text-muted-foreground mt-1 text-sm">
              {isRTL ? 'لوحة التحكم الرئيسية للمنصة' : 'Platform Main Control Panel'}
            </p>
          </div>

          {/* Login Card */}
          <Card className="shadow-xl border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">
                {isRTL ? 'دخول مدير النظام' : 'Super Admin Sign In'}
              </CardTitle>
              <CardDescription>
                {isRTL ? 'هذه الصفحة مخصصة لمديري النظام فقط' : 'This page is exclusively for system administrators'}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <form onSubmit={handleSALogin} className="space-y-4">
                <div className="space-y-2">
                  <Label>{isRTL ? 'البريد الإلكتروني' : 'Email'}</Label>
                  <Input
                    type="email"
                    value={saEmail}
                    onChange={(e) => setSaEmail(e.target.value)}
                    placeholder="admin@bookflow.com"
                    dir="ltr"
                    className="text-left"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>{isRTL ? 'كلمة المرور' : 'Password'}</Label>
                  <Input
                    type="password"
                    value={saPassword}
                    onChange={(e) => setSaPassword(e.target.value)}
                    placeholder="••••••••"
                    dir="ltr"
                    className="text-left"
                    required
                  />
                </div>
                {saError && <p className="text-sm text-red-500">{saError}</p>}
                <Button
                  type="submit"
                  className="w-full h-12 text-base font-semibold gap-2 bg-violet-600 hover:bg-violet-700"
                  disabled={saLoading}
                >
                  {saLoading
                    ? <Loader2 className="h-5 w-5 animate-spin" />
                    : <><Shield className="h-5 w-5" />{isRTL ? 'دخول كمدير نظام' : 'Sign In as Super Admin'}</>
                  }
                </Button>
              </form>

              {/* Security Notice */}
              <div className="mt-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 p-3 text-xs text-amber-700 dark:text-amber-400">
                <p className="font-semibold mb-1">
                  {isRTL ? '⚠️ تحذير أمني' : '⚠️ Security Warning'}
                </p>
                <p>
                  {isRTL
                    ? 'هذه الصفحة مخصصة حصريًا لمديري النظام. جميع العمليات مسجلة في سجل المراجعة.'
                    : 'This page is exclusively for system admins. All actions are logged in the audit trail.'}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  // ── Login / Register / Demo Screen ───────────────────────────
  if (!isAuthenticated) {
    const isRTL = locale === 'ar'
    const ArrowIcon = isRTL ? ArrowLeft : ArrowRight

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 p-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Language Toggle */}
          <div className="flex justify-end mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocale(getOppositeLocale(locale))}
              className="text-sm gap-1"
            >
              <Globe className="h-4 w-4" />
              {locale === 'ar' ? 'English' : 'عربي'}
            </Button>
          </div>

          {/* Logo */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-600/30">
              <CalendarDays className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold">BookFlow</h1>
            <p className="text-muted-foreground mt-2">
              {isRTL ? 'منصة إدارة الحجوزات الذكية' : 'Smart Booking Management Platform'}
            </p>
          </div>

          {/* Auth Tabs */}
          <Tabs value={authTab} onValueChange={(v) => { setAuthTab(v as any); setLoginError(''); setRegError('') }}>
            <TabsList className="w-full grid grid-cols-3 mb-4">
              <TabsTrigger value="login" className="gap-1.5 text-xs sm:text-sm">
                <LogIn className="h-4 w-4" />
                {isRTL ? 'دخول' : 'Login'}
              </TabsTrigger>
              <TabsTrigger value="register" className="gap-1.5 text-xs sm:text-sm">
                <UserPlus className="h-4 w-4" />
                {isRTL ? 'حساب جديد' : 'Sign Up'}
              </TabsTrigger>
              <TabsTrigger value="demo" className="gap-1.5 text-xs sm:text-sm">
                <Play className="h-4 w-4" />
                {isRTL ? 'تجريبي' : 'Demo'}
              </TabsTrigger>
            </TabsList>

            {/* Login Tab */}
            {authTab === 'login' && (
              <Card className="shadow-xl border-0">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl">{isRTL ? 'تسجيل الدخول' : 'Sign In'}</CardTitle>
                  <CardDescription>
                    {isRTL ? 'أدخل بيانات حسابك للوصول للوحة التحكم' : 'Enter your credentials to access the dashboard'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label>{isRTL ? 'البريد الإلكتروني' : 'Email'}</Label>
                      <Input
                        type="email"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="name@example.com"
                        dir="ltr"
                        className="text-left"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{isRTL ? 'كلمة المرور' : 'Password'}</Label>
                      <Input
                        type="password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="••••••••"
                        dir="ltr"
                        className="text-left"
                        required
                      />
                    </div>
                    {loginError && <p className="text-sm text-red-500">{loginError}</p>}
                    <Button
                      type="submit"
                      className="w-full h-12 text-base font-semibold gap-2 bg-emerald-600 hover:bg-emerald-700"
                      disabled={loginLoading}
                    >
                      {loginLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>{t(locale, 'common', 'signIn')} <ArrowIcon className="h-4 w-4" /></>}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Register Tab */}
            {authTab === 'register' && (
              <Card className="shadow-xl border-0">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl">{isRTL ? 'إنشاء حساب جديد' : 'Create Account'}</CardTitle>
                  <CardDescription>
                    {isRTL ? 'أنشئ حسابك وابدأ إدارة حجوزاتك' : 'Create your account and start managing bookings'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <form onSubmit={handleRegister} className="space-y-3">
                    <div className="space-y-2">
                      <Label>{isRTL ? 'الاسم الكامل' : 'Full Name'} *</Label>
                      <Input
                        value={regForm.name}
                        onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                        placeholder={isRTL ? 'أحمد محمد' : 'Ahmed Mohamed'}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{isRTL ? 'البريد الإلكتروني' : 'Email'} *</Label>
                      <Input
                        type="email"
                        value={regForm.email}
                        onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                        placeholder="name@business.com"
                        dir="ltr"
                        className="text-left"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{isRTL ? 'اسم المنشأة' : 'Business Name'}</Label>
                      <Input
                        value={regForm.businessName}
                        onChange={(e) => setRegForm({ ...regForm, businessName: e.target.value })}
                        placeholder={isRTL ? 'مركز التجميل الذهبي' : 'Golden Beauty Center'}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{isRTL ? 'رقم الهاتف' : 'Phone'}</Label>
                      <Input
                        type="tel"
                        value={regForm.phone}
                        onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
                        placeholder="+966 5x xxx xxxx"
                        dir="ltr"
                        className="text-left"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>{isRTL ? 'كلمة المرور' : 'Password'} *</Label>
                        <Input
                          type="password"
                          value={regForm.password}
                          onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                          placeholder="••••••••"
                          dir="ltr"
                          className="text-left"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{isRTL ? 'تأكيد المرور' : 'Confirm'} *</Label>
                        <Input
                          type="password"
                          value={regForm.confirmPassword}
                          onChange={(e) => setRegForm({ ...regForm, confirmPassword: e.target.value })}
                          placeholder="••••••••"
                          dir="ltr"
                          className="text-left"
                          required
                        />
                      </div>
                    </div>
                    {regError && <p className="text-sm text-red-500">{regError}</p>}
                    <Button
                      type="submit"
                      className="w-full h-12 text-base font-semibold gap-2 bg-emerald-600 hover:bg-emerald-700"
                      disabled={loginLoading}
                    >
                      {loginLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><UserPlus className="h-5 w-5" />{isRTL ? 'إنشاء الحساب' : 'Create Account'}</>}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Demo Tab */}
            {authTab === 'demo' && (
              <Card className="shadow-xl border-0">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl">{isRTL ? 'حساب تجريبي' : 'Demo Account'}</CardTitle>
                  <CardDescription>
                    {isRTL ? 'جرب النظام ببيانات تجريبية كاملة' : 'Try the system with full demo data'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-sm">DM</div>
                      <div>
                        <p className="font-semibold text-sm">{isRTL ? 'مستخدم تجريبي' : 'Demo User'}</p>
                        <p className="text-xs text-muted-foreground" dir="ltr">demo@bookflow.com</p>
                      </div>
                      <Badge variant="secondary" className="ms-auto">{isRTL ? 'مشرف' : 'Admin'}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>✅ {isRTL ? 'كل الصلاحيات مفعّلة' : 'All permissions enabled'}</p>
                      <p>✅ {isRTL ? 'بيانات تجريبية جاهزة' : 'Pre-loaded demo data'}</p>
                      <p>✅ {isRTL ? 'بدون الحاجة لكلمة مرور' : 'No password required'}</p>
                    </div>
                  </div>
                  <Button
                    onClick={handleDemoLogin}
                    className="w-full h-12 text-base font-semibold gap-2 bg-emerald-600 hover:bg-emerald-700"
                    disabled={loginLoading}
                  >
                    {loginLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Play className="h-5 w-5" />{isRTL ? 'دخول كحساب تجريبي' : 'Enter as Demo User'}</>}
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    {isRTL ? 'كلمة المرور: demo123' : 'Password: demo123'}
                  </p>
                </CardContent>
              </Card>
            )}
          </Tabs>

          {/* Feature badges */}
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {[
              { icon: ShieldCheck, label: isRTL ? 'مؤمّن' : 'Secured' },
              { icon: Zap, label: isRTL ? 'سريع' : 'Fast' },
              { icon: Globe, label: isRTL ? 'متعدد اللغات' : 'Multilingual' },
            ].map((f) => (
              <Badge key={f.label} variant="secondary" className="gap-1.5 px-3 py-1.5 text-xs">
                <f.icon className="h-3.5 w-3.5" />
                {f.label}
              </Badge>
            ))}
          </div>

          {/* Enterprise features */}
          <div className="mt-6 grid grid-cols-2 gap-3 text-xs text-muted-foreground">
            {[
              isRTL ? 'JWT + RBAC' : 'JWT + RBAC',
              isRTL ? 'عزل المستأجرين' : 'Tenant Isolation',
              isRTL ? 'تشفير AES-256' : 'AES-256 Encryption',
              isRTL ? 'سجل المراجعة' : 'Audit Logs',
            ].map((f) => (
              <div key={f} className="flex items-center gap-1.5 bg-muted/50 rounded-md px-2.5 py-1.5">
                <ShieldCheck className="h-3 w-3 text-emerald-600" />
                {f}
              </div>
            ))}
          </div>

          {/* Super Admin Access */}
          <button
            onClick={() => setShowSALogin(true)}
            className="mt-6 mx-auto flex items-center gap-1.5 text-xs text-muted-foreground/50 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
          >
            <Shield className="h-3 w-3" />
            {isRTL ? 'مدير النظام' : 'System Admin'}
          </button>
        </motion.div>
      </div>
    )
  }

  // ── Main Application ───────────────────────────────────────────
  const dir = getDirection(locale)

  return (
    <div dir={dir} className="min-h-screen flex overflow-hidden bg-muted/30">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <AppHeader />
        <main dir={dir} className="flex-1 overflow-auto p-4 sm:p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {renderView()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}