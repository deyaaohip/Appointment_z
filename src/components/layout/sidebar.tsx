'use client'

import { useCallback } from 'react'
import { useTheme } from 'next-themes'
import type { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard,
  CalendarDays,
  CalendarCheck,
  Users,
  UserCog,
  Package,
  Box,
  FileText,
  CreditCard,
  Crown,
  Bell,
  ScrollText,
  Building2,
  Tag,
  Shield,
  MessageCircle,
  Settings,
  Monitor,
  Palette,
  Sun,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Languages,
} from 'lucide-react'
import { t, getDirection, getOppositeLocale } from '@/lib/i18n'
import { useAppStore } from '@/stores/app-store'
import { hasPermission } from '@/lib/security/rbac'
import type { PermissionResource } from '@/types'
import { useIsMobile } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'

import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from '@/components/ui/sheet'

// ─── Navigation Item Definition ──────────────────────────────────────
interface NavItemDef {
  key: string
  icon: LucideIcon
  permission?: PermissionResource
}

interface NavSection {
  labelKey: string
  items: NavItemDef[]
}

const navSections: NavSection[] = [
  {
    labelKey: 'sectionMain',
    items: [
      { key: 'dashboard', icon: LayoutDashboard, permission: 'dashboard' },
      { key: 'calendar', icon: CalendarDays },
      { key: 'bookings', icon: CalendarCheck, permission: 'bookings' },
      { key: 'customers', icon: Users, permission: 'customers' },
      { key: 'employees', icon: UserCog, permission: 'employees' },
      { key: 'services', icon: Package, permission: 'services' },
      { key: 'resources', icon: Box },
      { key: 'invoices', icon: FileText },
      { key: 'payments', icon: CreditCard, permission: 'payments' },
      { key: 'subscriptions', icon: Crown, permission: 'subscriptions' as PermissionResource },
      { key: 'reports', icon: Monitor, permission: 'reports' },
    ],
  },
  {
    labelKey: 'sectionManagement',
    items: [
      { key: 'notifications', icon: Bell, permission: 'notifications' },
      { key: 'audit_logs', icon: ScrollText, permission: 'audit_logs' },
      { key: 'branches', icon: Building2, permission: 'branches' },
      { key: 'coupons', icon: Tag, permission: 'coupons' },
      { key: 'roles', icon: Shield, permission: 'roles' },
      { key: 'whatsapp', icon: MessageCircle, permission: 'whatsapp' as PermissionResource },
    ],
  },
  {
    labelKey: 'sectionSettings',
    items: [
      { key: 'settings', icon: Settings, permission: 'settings' },
      { key: 'admin_panel', icon: Monitor },
      { key: 'super_admin', icon: Shield },
      { key: 'white_label', icon: Palette },
    ],
  },
]

// ─── Sidebar Content (shared between desktop & mobile) ───────────────
function SidebarContent({ collapsed }: { collapsed: boolean }) {
  const {
    locale,
    setLocale,
    currentView,
    setCurrentView,
    userPermissions,
    currentUser,
    brandSettings,
  } = useAppStore()
  const { theme, setTheme } = useTheme()
  const dir = getDirection(locale)
  const isRTL = locale === 'ar'
  const tooltipSide = isRTL ? 'left' : 'right'

  const handleLocaleToggle = useCallback(() => {
    setLocale(getOppositeLocale(locale))
  }, [locale, setLocale])

  const handleThemeToggle = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }, [theme, setTheme])

  const canView = (resource?: PermissionResource): boolean => {
    if (!resource) return true
    const perms = userPermissions as Record<string, Record<string, boolean>> | null
    // If no permissions loaded, show all items (demo/offline mode)
    if (!perms || typeof perms !== 'object' || Object.keys(perms).length === 0) return true
    if (perms[resource] === undefined) return true
    return hasPermission(perms, resource, 'view')
  }

  const userName = currentUser?.name || (isRTL ? 'أحمد محمد' : 'Ahmed Mohamed')
  const userInitials = userName
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
  const brandName = brandSettings?.appName || 'BookFlow'

  return (
    <div
      dir={dir}
      className="flex h-full flex-col bg-card"
    >
      {/* ── Brand / Logo Area ──────────────────────────────────── */}
      <div className="flex h-14 items-center gap-2.5 px-3">
        {brandSettings?.logo ? (
          <img
            src={brandSettings.logo}
            alt={brandName}
            className="size-8 shrink-0 rounded-lg object-contain"
          />
        ) : (
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 text-white font-bold text-xs shadow-sm shadow-emerald-500/25">
            BF
          </div>
        )}
        {!collapsed && (
          <div className="overflow-hidden">
            <h2 className="text-sm font-bold leading-tight truncate">{brandName}</h2>
            <p className="text-[10px] text-muted-foreground truncate leading-tight">
              {isRTL ? 'نظام الحجز الذكي' : 'Smart Booking'}
            </p>
          </div>
        )}
      </div>

      <Separator className="mx-3 w-auto" />

      {/* ── Navigation Items ────────────────────────────────────── */}
      <ScrollArea className="flex-1 px-2.5 py-2" dir={dir}>
        <nav dir={dir} className="flex flex-col gap-0.5">
          {navSections.map((section, sIdx) => {
            const visibleItems = section.items.filter((item) =>
              canView(item.permission)
            )
            if (visibleItems.length === 0) return null

            return (
              <div key={section.labelKey} className={cn(sIdx > 0 && 'mt-4')}>
                {!collapsed && (
                  <p className="mb-1.5 px-2.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50 select-none">
                    {t(locale, 'nav', section.labelKey)}
                  </p>
                )}

                {visibleItems.map(({ key, icon: Icon }) => {
                  const isActive = currentView === key
                  const label = t(locale, 'nav', key)

                  const button = (
                    <button
                      key={key}
                      dir={dir}
                      onClick={() => setCurrentView(key)}
                      className={cn(
                        'group relative flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-all duration-150',
                        'outline-none',
                        isActive
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                          : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                      )}
                    >
                      {/* Active bar indicator */}
                      {isActive && (
                        <span className="absolute inset-y-1 start-0 w-[3px] rounded-full bg-emerald-600 dark:bg-emerald-400" />
                      )}
                      <Icon
                        className={cn(
                          'size-[18px] shrink-0 transition-colors duration-150',
                          isActive
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-muted-foreground/70 group-hover:text-foreground'
                        )}
                      />
                      {!collapsed && (
                        <span className="truncate leading-tight">{label}</span>
                      )}
                    </button>
                  )

                  if (collapsed) {
                    return (
                      <Tooltip key={key}>
                        <TooltipTrigger asChild>{button}</TooltipTrigger>
                        <TooltipContent side={tooltipSide} sideOffset={8}>
                          {label}
                        </TooltipContent>
                      </Tooltip>
                    )
                  }

                  return button
                })}
              </div>
            )
          })}
        </nav>
      </ScrollArea>

      {/* ── Bottom Section ──────────────────────────────────────── */}
      <div className="mt-auto border-t border-border">
        {/* Action Buttons: Language & Theme */}
        <div dir={dir} className="flex items-center gap-1 px-2.5 py-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size={collapsed ? 'icon' : 'sm'}
                onClick={handleLocaleToggle}
                dir={dir}
                className={cn(
                  'h-8 gap-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent',
                  !collapsed && 'flex-1 justify-start'
                )}
              >
                <Languages className="size-4 shrink-0" />
                {!collapsed && (
                  <span className="text-xs font-medium">{locale === 'ar' ? 'English' : 'عربي'}</span>
                )}
              </Button>
            </TooltipTrigger>
            {collapsed && (
              <TooltipContent side={tooltipSide} sideOffset={8}>
                {locale === 'ar' ? 'English' : 'العربية'}
              </TooltipContent>
            )}
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleThemeToggle}
                className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent"
              >
                {theme === 'dark' ? (
                  <Sun className="size-4" />
                ) : (
                  <Moon className="size-4" />
                )}
              </Button>
            </TooltipTrigger>
            {collapsed && (
              <TooltipContent side={tooltipSide} sideOffset={8}>
                {theme === 'dark'
                  ? t(locale, 'common', 'lightMode')
                  : t(locale, 'common', 'darkMode')}
              </TooltipContent>
            )}
          </Tooltip>
        </div>

        {/* User Info */}
        <div dir={dir} className="flex items-center gap-2.5 px-3 py-2.5">
          <Avatar className="size-8 shrink-0 ring-2 ring-emerald-500/20">
            {currentUser?.avatar ? (
              <img
                src={currentUser.avatar}
                alt={userName}
                className="size-full rounded-full object-cover"
              />
            ) : (
              <AvatarFallback className="bg-emerald-600 text-white text-[10px] font-semibold">
                {userInitials}
              </AvatarFallback>
            )}
          </Avatar>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold leading-tight">
                {userName}
              </p>
              <p className="truncate text-[11px] text-muted-foreground leading-tight">
                {useAppStore.getState().userRole?.name ||
                  (isRTL ? 'مالك النظام' : 'System Owner')}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Desktop Sidebar ─────────────────────────────────────────────────
function DesktopSidebar() {
  const { sidebarOpen, toggleSidebar, locale } = useAppStore()
  const collapsed = !sidebarOpen
  const dir = getDirection(locale)
  const isRTL = locale === 'ar'

  return (
    <aside
      dir={dir}
      className={cn(
        'hidden md:flex h-screen sticky top-0 z-30 shrink-0 flex-col',
        'border-e border-border bg-card',
        'transition-[width] duration-200 ease-in-out',
        collapsed ? 'w-[68px]' : 'w-[260px]'
      )}
    >
      {/* Collapse toggle — positioned at top-end of sidebar */}
      <div className={cn('flex items-center justify-end px-2 py-1', collapsed && 'justify-center')}>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className={cn(
            'h-7 w-7 rounded-md text-muted-foreground/60 hover:text-foreground hover:bg-accent',
            'transition-colors duration-150'
          )}
          aria-label={sidebarOpen ? (isRTL ? 'طي القائمة' : 'Collapse sidebar') : (isRTL ? 'توسيع القائمة' : 'Expand sidebar')}
        >
          {sidebarOpen ? (
            isRTL ? <PanelLeftClose className="size-4" /> : <PanelLeftClose className="size-4" />
          ) : (
            isRTL ? <PanelLeftOpen className="size-4" /> : <PanelLeftOpen className="size-4" />
          )}
        </Button>
      </div>

      <SidebarContent collapsed={collapsed} />
    </aside>
  )
}

// ─── Mobile Sidebar (Sheet/Drawer) ───────────────────────────────────
function MobileSidebar() {
  const { locale, sidebarOpen, setSidebarOpen } = useAppStore()
  const isRTL = locale === 'ar'
  const sheetSide = isRTL ? 'right' : 'left'

  return (
    <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
      <SheetContent side={sheetSide} className="w-[280px] p-0">
        <SheetTitle className="sr-only">
          {t(locale, 'nav', 'dashboard')}
        </SheetTitle>
        <SidebarContent collapsed={false} />
      </SheetContent>
    </Sheet>
  )
}

// ─── Main Sidebar Export ─────────────────────────────────────────────
export function Sidebar() {
  const isMobile = useIsMobile()

  if (isMobile) {
    return <MobileSidebar />
  }

  return <DesktopSidebar />
}

// ─── Mobile Menu Trigger (used by AppHeader) ─────────────────────────
export function SidebarMobileTrigger() {
  const { setSidebarOpen } = useAppStore()

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setSidebarOpen(true)}
      className="md:hidden h-9 w-9"
      aria-label="Open menu"
    >
      <svg
        className="size-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 6h16M4 12h16M4 18h16"
        />
      </svg>
    </Button>
  )
}