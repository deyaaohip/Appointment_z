'use client'

import { Search, Bell, LogOut, User, Settings } from 'lucide-react'
import { t, getDirection } from '@/lib/i18n'
import { useAppStore } from '@/stores/app-store'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import { SidebarMobileTrigger } from './sidebar'

// ─── Page title map ──────────────────────────────────────────────────
const viewTitleKeys: Record<string, string> = {
  dashboard: 'dashboard',
  calendar: 'calendar',
  bookings: 'bookings',
  customers: 'customers',
  employees: 'employees',
  services: 'services',
  resources: 'resources',
  invoices: 'invoices',
  payments: 'payments',
  subscriptions: 'subscriptions',
  reports: 'reports',
  notifications: 'notifications',
  audit_logs: 'audit_logs',
  branches: 'branches',
  coupons: 'coupons',
  roles: 'roles',
  whatsapp: 'whatsapp',
  settings: 'settings',
  admin_panel: 'admin_panel',
  white_label: 'white_label',
}

// ─── App Header ──────────────────────────────────────────────────────
export function AppHeader() {
  const {
    locale,
    currentView,
    currentUser,
    userRole,
    setAppMode,
    setCurrentUser,
    setUserRole,
    setUserPermissions,
    setCurrentTenantId,
    setCurrentBranchId,
  } = useAppStore()
  const dir = getDirection(locale)
  const isRTL = locale === 'ar'

  const titleKey = viewTitleKeys[currentView] || 'dashboard'
  const pageTitle = t(locale, 'nav', titleKey)
  const searchPlaceholder = t(locale, 'common', 'search')

  const userName = currentUser?.name || (isRTL ? 'أحمد محمد' : 'Ahmed Mohamed')
  const userInitials = userName
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
  const roleName = userRole?.name || (isRTL ? 'مالك النظام' : 'System Owner')

  const handleLogout = () => {
    setAppMode('landing')
    setCurrentUser(null)
    setUserRole(null)
    setUserPermissions({})
    setCurrentTenantId('')
    setCurrentBranchId('')
    toast.success(
      isRTL ? 'تم تسجيل الخروج بنجاح' : 'Logged out successfully'
    )
  }

  return (
    <header
      dir={dir}
      className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-border bg-background/95 px-3 backdrop-blur-md supports-[backdrop-filter]:bg-background/80 sm:px-5"
    >
      {/* ── Mobile Menu Button ─────────────────────────────────── */}
      <SidebarMobileTrigger />

      {/* ── Page Title ──────────────────────────────────────────── */}
      <h1 className="text-[15px] font-semibold text-foreground pe-2 truncate">
        {pageTitle}
      </h1>

      {/* ── Spacer ──────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0" />

      {/* ── Search ──────────────────────────────────────────────── */}
      <div className="hidden sm:flex items-center max-w-[220px] lg:max-w-[280px] w-full">
        <div className="relative w-full">
          <Search className="absolute start-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground/50 pointer-events-none" />
          <Input
            type="text"
            placeholder={searchPlaceholder}
            readOnly
            className={cn(
              'h-8 w-full bg-muted/40 border-muted-foreground/10 ps-8 pe-3',
              'text-[13px]',
              'placeholder:text-muted-foreground/50',
              'focus-visible:ring-1 focus-visible:ring-emerald-500/30 focus-visible:border-emerald-500/30',
              'cursor-default rounded-lg'
            )}
          />
        </div>
      </div>

      {/* ── Notification Bell ───────────────────────────────────── */}
      <Button
        variant="ghost"
        size="icon"
        className="relative h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent"
        aria-label={t(locale, 'nav', 'notifications')}
      >
        <Bell className="size-4" />
        <span className="absolute -top-0.5 -end-0.5 flex size-4 items-center justify-center rounded-full bg-emerald-600 text-[9px] font-bold text-white ring-2 ring-background">
          3
        </span>
      </Button>

      {/* ── Separator ───────────────────────────────────────────── */}
      <Separator orientation="vertical" className="mx-1 hidden h-6 sm:block" />

      {/* ── User Dropdown ───────────────────────────────────────── */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="relative flex items-center gap-2 h-8 ps-1 pe-2 rounded-lg hover:bg-accent"
          >
            <Avatar className="size-7 ring-1 ring-muted-foreground/10">
              {currentUser?.avatar ? (
                <img
                  src={currentUser.avatar}
                  alt={userName}
                  className="size-full rounded-full object-cover"
                />
              ) : (
                <AvatarFallback className="bg-emerald-600 text-white text-[9px] font-semibold">
                  {userInitials}
                </AvatarFallback>
              )}
            </Avatar>
            <span className="hidden text-[13px] font-medium sm:inline-block max-w-[100px] truncate">
              {userName}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuLabel className="px-3 py-2">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold">{userName}</p>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-medium">
                  {roleName}
                </Badge>
              </div>
              {currentUser?.email && (
                <p className="text-xs text-muted-foreground truncate" dir="ltr">
                  {currentUser.email}
                </p>
              )}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem className="gap-2 px-3 py-2 text-[13px]">
              <User className="size-4 text-muted-foreground" />
              {t(locale, 'nav', 'profile')}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="gap-2 px-3 py-2 text-[13px]"
              onClick={() => useAppStore.getState().setCurrentView('settings')}
            >
              <Settings className="size-4 text-muted-foreground" />
              {t(locale, 'nav', 'settings')}
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            className="gap-2 px-3 py-2 text-[13px]"
            onClick={handleLogout}
          >
            <LogOut className="size-4" />
            {t(locale, 'nav', 'logout')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}