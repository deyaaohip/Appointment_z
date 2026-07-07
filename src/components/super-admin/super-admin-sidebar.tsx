'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/stores/app-store'
import { useIsMobile } from '@/hooks/use-mobile'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import {
  Tooltip, TooltipContent, TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  LayoutDashboard, Building2, Users, Shield, Settings, Activity,
  CreditCard, Database, Server, BarChart3, FileText,
  LogOut, ChevronRight, Menu, ShieldCheck, Lock, Globe, Wrench,
  Bell, UserCog,
} from 'lucide-react'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface SANavItem {
  id: string
  label: string
  labelEn: string
  icon: React.ElementType
  section: string
}

const SA_NAV_ITEMS: SANavItem[] = [
  { id: 'sa_overview', label: 'نظرة عامة', labelEn: 'Overview', icon: LayoutDashboard, section: 'main' },
  { id: 'sa_tenants', label: 'إدارة المستأجرين', labelEn: 'Tenants', icon: Building2, section: 'main' },
  { id: 'sa_users', label: 'إدارة المستخدمين', labelEn: 'Users', icon: Users, section: 'main' },
  { id: 'sa_plans', label: 'الباقات والاشتراكات', labelEn: 'Plans', icon: CreditCard, section: 'main' },
  { id: 'sa_billing', label: 'الفواتير والمدفوعات', labelEn: 'Billing', icon: FileText, section: 'main' },
  { id: 'sa_roles', label: 'الأدوار والصلاحيات', labelEn: 'Roles', icon: Shield, section: 'management' },
  { id: 'sa_audit', label: 'سجل العمليات', labelEn: 'Audit Logs', icon: FileText, section: 'management' },
  { id: 'sa_notifications', label: 'الإشعارات', labelEn: 'Notifications', icon: Bell, section: 'management' },
  { id: 'sa_reports', label: 'التقارير', labelEn: 'Reports', icon: BarChart3, section: 'management' },
  { id: 'sa_system', label: 'صحة النظام', labelEn: 'System Health', icon: Activity, section: 'system' },
  { id: 'sa_servers', label: 'الخوادم', labelEn: 'Servers', icon: Server, section: 'system' },
  { id: 'sa_database', label: 'قاعدة البيانات', labelEn: 'Database', icon: Database, section: 'system' },
  { id: 'sa_security', label: 'الأمان', labelEn: 'Security', icon: Lock, section: 'system' },
  { id: 'sa_settings', label: 'إعدادات المنصة', labelEn: 'Settings', icon: Settings, section: 'system' },
]

const SECTIONS = [
  { id: 'main', label: 'الرئيسية', labelEn: 'Main' },
  { id: 'management', label: 'الإدارة', labelEn: 'Management' },
  { id: 'system', label: 'النظام', labelEn: 'System' },
]

function SidebarContent({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const { locale, superAdminView, setSuperAdminView, currentUser, logout } = useAppStore()
  const isRTL = locale === 'ar'
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    main: true,
    management: true,
    system: true,
  })

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({ ...prev, [sectionId]: !prev[sectionId] }))
  }

  const handleNav = (viewId: string) => {
    setSuperAdminView(viewId)
    if (onNavigate) onNavigate()
  }

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-600/20">
          <ShieldCheck className="h-4.5 w-4.5 text-white" />
        </div>
        {!collapsed && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="overflow-hidden">
            <h1 className="text-base font-bold tracking-tight">BookFlow</h1>
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              {isRTL ? 'مدير النظام' : 'Super Admin'}
            </p>
          </motion.div>
        )}
      </div>

      <Separator />

      {/* Navigation */}
      <ScrollArea className="flex-1 px-2 py-2">
        <div className="space-y-0.5">
          {SECTIONS.map(section => (
            <div key={section.id} className="mb-1">
              {collapsed ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center justify-center py-1.5">
                      <div className="h-px w-5 bg-border" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    {isRTL ? section.label : section.labelEn}
                  </TooltipContent>
                </Tooltip>
              ) : (
                <button
                  onClick={() => toggleSection(section.id)}
                  className="flex items-center gap-2 w-full px-2 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
                >
                  <span className="flex-1 text-start">
                    {isRTL ? section.label : section.labelEn}
                  </span>
                  <ChevronRight className={`h-3 w-3 transition-transform ${expandedSections[section.id] ? 'rotate-90' : ''}`} />
                </button>
              )}

              <AnimatePresence initial={false}>
                {expandedSections[section.id] && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-0.5 mt-0.5">
                      {SA_NAV_ITEMS
                        .filter(item => item.section === section.id)
                        .map(item => {
                          const isActive = superAdminView === item.id
                          const Icon = item.icon

                          const navButton = (
                            <button
                              key={item.id}
                              onClick={() => handleNav(item.id)}
                              className={`
                                flex items-center gap-2.5 w-full rounded-lg px-2.5 py-2 text-[13px] font-medium
                                transition-all duration-150 group
                                ${isActive
                                  ? 'bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400'
                                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                }
                                ${collapsed ? 'justify-center px-0' : ''}
                              `}
                            >
                              <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-violet-600 dark:text-violet-400' : ''}`} />
                              {!collapsed && (
                                <span className="truncate">{isRTL ? item.label : item.labelEn}</span>
                              )}
                              {isActive && !collapsed && (
                                <div className="ms-auto h-1.5 w-1.5 rounded-full bg-violet-600 dark:bg-violet-400" />
                              )}
                            </button>
                          )

                          if (collapsed) {
                            return (
                              <Tooltip key={item.id}>
                                <TooltipTrigger asChild>{navButton}</TooltipTrigger>
                                <TooltipContent side="right">
                                  {isRTL ? item.label : item.labelEn}
                                </TooltipContent>
                              </Tooltip>
                            )
                          }

                          return navButton
                        })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </ScrollArea>

      <Separator />

      {/* User Section */}
      <div className="p-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2.5 w-full rounded-lg p-2 hover:bg-muted transition-colors">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 text-white font-bold text-xs">
                {currentUser?.name?.charAt(0) || 'SA'}
              </div>
              {!collapsed && (
                <div className="flex-1 min-w-0 text-start">
                  <p className="text-sm font-semibold truncate">{currentUser?.name || 'مدير النظام'}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{currentUser?.email || 'admin@bookflow.com'}</p>
                </div>
              )}
              {!collapsed && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align={isRTL ? 'start' : 'end'} className="w-52">
            <DropdownMenuItem className="gap-2" onClick={() => {}}>
              <UserCog className="h-4 w-4" />
              {isRTL ? 'الملف الشخصي' : 'Profile'}
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2" onClick={() => {}}>
              <Wrench className="h-4 w-4" />
              {isRTL ? 'التفضيلات' : 'Preferences'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={logout}
              className="gap-2 text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/30"
            >
              <LogOut className="h-4 w-4" />
              {isRTL ? 'تسجيل الخروج' : 'Sign Out'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

export function SuperAdminSidebar() {
  const { sidebarOpen, toggleSidebar, setSidebarOpen, locale } = useAppStore()
  const isMobile = useIsMobile()
  const collapsed = !sidebarOpen
  const isRTL = locale === 'ar'

  if (isMobile) {
    return (
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side={isRTL ? 'right' : 'left'} className="w-72 p-0">
          <SheetTitle className="sr-only">القائمة</SheetTitle>
          <SidebarContent collapsed={false} onNavigate={() => setSidebarOpen(false)} />
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <div className="relative hidden md:block shrink-0">
      <motion.aside
        animate={{ width: collapsed ? 64 : 256 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className="flex flex-col border-e bg-background h-screen sticky top-0 overflow-hidden"
      >
        {/* Collapse toggle */}
        <button
          onClick={toggleSidebar}
          className="absolute top-5 z-10 flex h-6 w-6 items-center justify-center rounded-full border bg-background shadow-sm hover:bg-muted transition-colors"
          style={{
            [isRTL ? 'left' : 'right']: collapsed ? '-12px' : '-12px'
          }}
        >
          <ChevronRight className={`h-3 w-3 transition-transform ${isRTL ? (collapsed ? '' : 'rotate-180') : (collapsed ? 'rotate-180' : '')}`} />
        </button>

        <SidebarContent collapsed={collapsed} />
      </motion.aside>
    </div>
  )
}



export function SuperAdminHeader() {
  const { locale, superAdminView, logout, currentUser, setSidebarOpen } = useAppStore()
  const isRTL = locale === 'ar'
  const isMobile = useIsMobile()

  const viewLabels: Record<string, string> = {
    sa_overview: isRTL ? 'نظرة عامة على المنصة' : 'Platform Overview',
    sa_tenants: isRTL ? 'إدارة المستأجرين' : 'Tenant Management',
    sa_users: isRTL ? 'إدارة المستخدمين' : 'User Management',
    sa_plans: isRTL ? 'الباقات والاشتراكات' : 'Plans & Subscriptions',
    sa_billing: isRTL ? 'الفواتير والمدفوعات' : 'Billing & Payments',
    sa_roles: isRTL ? 'الأدوار والصلاحيات' : 'Roles & Permissions',
    sa_audit: isRTL ? 'سجل العمليات' : 'Audit Logs',
    sa_notifications: isRTL ? 'الإشعارات' : 'Notifications',
    sa_reports: isRTL ? 'التقارير' : 'Reports',
    sa_system: isRTL ? 'صحة النظام' : 'System Health',
    sa_servers: isRTL ? 'الخوادم' : 'Servers',
    sa_database: isRTL ? 'قاعدة البيانات' : 'Database',
    sa_security: isRTL ? 'الأمان' : 'Security',
    sa_settings: isRTL ? 'إعدادات المنصة' : 'Platform Settings',
  }

  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-3 sm:px-5 h-14">
      {/* Mobile menu button */}
      {isMobile && (
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>
      )}

      {/* Page title */}
      <div className="flex-1 min-w-0">
        <h2 className="text-sm sm:text-base font-semibold truncate">{viewLabels[superAdminView] || ''}</h2>
        <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">
          {isRTL ? 'لوحة تحكم مدير النظام' : 'Super Admin Dashboard'}
        </p>
      </div>

      {/* User dropdown */}
      <div className="flex items-center gap-2 shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-full px-1.5 py-1 hover:bg-muted transition-colors">
              <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 text-white font-bold text-[10px] sm:text-xs">
                {currentUser?.name?.charAt(0) || 'SA'}
              </div>
              <div className="hidden sm:block text-start">
                <p className="text-xs sm:text-sm font-medium leading-tight">{currentUser?.name || 'مدير النظام'}</p>
                <p className="text-[9px] sm:text-[10px] text-violet-600 dark:text-violet-400 font-medium">
                  {isRTL ? 'مدير النظام' : 'Super Admin'}
                </p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align={isRTL ? 'start' : 'end'} className="w-48">
            <DropdownMenuItem onClick={logout} className="gap-2 text-red-600 focus:text-red-600">
              <LogOut className="h-4 w-4" />
              {isRTL ? 'تسجيل الخروج' : 'Sign Out'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}