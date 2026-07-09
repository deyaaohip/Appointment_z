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
  Bell, UserCog, ChevronLeft, Wallet,
} from 'lucide-react'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useT } from './sa-i18n'

// ─── Nav items with bilingual labels ──────────────────────────
const NAV_ITEMS = [
  { id: 'sa_overview', ar: 'نظرة عامة', en: 'Overview', icon: LayoutDashboard, section: 'main' },
  { id: 'sa_tenants', ar: 'إدارة المستأجرين', en: 'Tenants', icon: Building2, section: 'main' },
  { id: 'sa_users', ar: 'إدارة المستخدمين', en: 'Users', icon: Users, section: 'main' },
  { id: 'sa_plans', ar: 'الباقات والاشتراكات', en: 'Plans', icon: CreditCard, section: 'main' },
  { id: 'sa_billing', ar: 'الفواتير والمدفوعات', en: 'Billing', icon: FileText, section: 'main' },
  { id: 'sa_cliq', ar: 'مدفوعات CLIQ', en: 'CLIQ Payments', icon: Wallet, section: 'main' },
  { id: 'sa_roles', ar: 'الأدوار والصلاحيات', en: 'Roles', icon: Shield, section: 'management' },
  { id: 'sa_audit', ar: 'سجل العمليات', en: 'Audit Logs', icon: FileText, section: 'management' },
  { id: 'sa_notifications', ar: 'الإشعارات', en: 'Notifications', icon: Bell, section: 'management' },
  { id: 'sa_reports', ar: 'التقارير', en: 'Reports', icon: BarChart3, section: 'management' },
  { id: 'sa_system', ar: 'صحة النظام', en: 'System Health', icon: Activity, section: 'system' },
  { id: 'sa_servers', ar: 'الخوادم', en: 'Servers', icon: Server, section: 'system' },
  { id: 'sa_database', ar: 'قاعدة البيانات', en: 'Database', icon: Database, section: 'system' },
  { id: 'sa_security', ar: 'الأمان', en: 'Security', icon: Lock, section: 'system' },
  { id: 'sa_settings', ar: 'إعدادات المنصة', en: 'Settings', icon: Settings, section: 'system' },
]

const SECTIONS = [
  { id: 'main', ar: 'الرئيسية', en: 'Main' },
  { id: 'management', ar: 'الإدارة', en: 'Management' },
  { id: 'system', ar: 'النظام', en: 'System' },
]

function SidebarContent({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const { locale, superAdminView, setSuperAdminView, currentUser, logout } = useAppStore()
  const isRTL = locale === 'ar'
  const t = useT()
  const lang = isRTL ? 'ar' : 'en'
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({ main: true, management: true, system: true })

  const toggleSection = (sectionId: string) => setExpandedSections(prev => ({ ...prev, [sectionId]: !prev[sectionId] }))
  const handleNav = (viewId: string) => { setSuperAdminView(viewId); if (onNavigate) onNavigate() }

  return (
    <div className={`flex flex-col h-full ${isRTL ? 'text-right' : 'text-left'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-600/20">
          <ShieldCheck className="h-4.5 w-4.5 text-white" />
        </div>
        {!collapsed && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="overflow-hidden">
            <h1 className="text-base font-bold tracking-tight">BookFlow</h1>
            <p className={`text-[10px] font-medium text-muted-foreground uppercase tracking-wider ${isRTL ? 'tracking-tight' : 'tracking-wider'}`}>{t.superAdmin}</p>
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
                    <div className="flex items-center justify-center py-1.5"><div className="h-px w-5 bg-border" /></div>
                  </TooltipTrigger>
                  <TooltipContent side={isRTL ? 'left' : 'right'}>{isRTL ? section.ar : section.en}</TooltipContent>
                </Tooltip>
              ) : (
                <button onClick={() => toggleSection(section.id)} className={`flex items-center gap-2 w-full px-2 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase ${isRTL ? 'tracking-tight' : 'tracking-wider'} hover:text-foreground transition-colors`}>
                  <span className={`flex-1 ${isRTL ? 'text-right' : 'text-left'}`}>{isRTL ? section.ar : section.en}</span>
                  {isRTL
                    ? <ChevronLeft className={`h-3 w-3 transition-transform ${expandedSections[section.id] ? 'rotate-90' : ''}`} />
                    : <ChevronRight className={`h-3 w-3 transition-transform ${expandedSections[section.id] ? 'rotate-90' : ''}`} />
                  }
                </button>
              )}

              <AnimatePresence initial={false}>
                {expandedSections[section.id] && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.15 }} className="overflow-hidden">
                    <div className="space-y-0.5 mt-0.5">
                      {NAV_ITEMS.filter(item => item.section === section.id).map(item => {
                        const isActive = superAdminView === item.id
                        const Icon = item.icon
                        const label = isRTL ? item.ar : item.en
                        const navButton = (
                          <button key={item.id} onClick={() => handleNav(item.id)} className={`flex items-center gap-2.5 w-full rounded-lg px-2.5 py-2 text-[13px] font-medium transition-all duration-150 group ${isActive ? 'bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400' : 'text-muted-foreground hover:bg-muted hover:text-foreground'} ${collapsed ? 'justify-center px-0' : ''}`}>
                            <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-violet-600 dark:text-violet-400' : ''}`} />
                            {!collapsed && <span className={`truncate flex-1 ${isRTL ? 'text-right' : 'text-left'}`}>{label}</span>}
                            {isActive && !collapsed && <div className="ms-auto h-1.5 w-1.5 rounded-full bg-violet-600 dark:bg-violet-400" />}
                          </button>
                        )
                        if (collapsed) {
                          return <Tooltip key={item.id}><TooltipTrigger asChild>{navButton}</TooltipTrigger><TooltipContent side={isRTL ? 'left' : 'right'}>{label}</TooltipContent></Tooltip>
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
      <div className="p-2" dir={isRTL ? 'rtl' : 'ltr'}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2.5 w-full rounded-lg p-2 hover:bg-muted transition-colors">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 text-white font-bold text-xs">{currentUser?.name?.charAt(0) || 'SA'}</div>
              {!collapsed && (
                <div className={`flex-1 min-w-0 ${isRTL ? 'text-right' : 'text-left'}`}>
                  <p className="text-sm font-semibold truncate">{currentUser?.name || (isRTL ? 'مدير النظام' : 'Super Admin')}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{currentUser?.email || 'admin@bookflow.com'}</p>
                </div>
              )}
              {!collapsed && (isRTL ? <ChevronLeft className="h-3.5 w-3.5 text-muted-foreground shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />)}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align={isRTL ? 'start' : 'end'} className="w-52">
            <DropdownMenuItem className="gap-2" onClick={() => {}}><UserCog className="h-4 w-4" />{t.profile}</DropdownMenuItem>
            <DropdownMenuItem className="gap-2" onClick={() => {}}><Wrench className="h-4 w-4" />{t.preferences}</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="gap-2 text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/30"><LogOut className="h-4 w-4" />{t.signOut}</DropdownMenuItem>
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
        <SheetContent side={isRTL ? 'right' : 'left'} className="w-72 p-0" dir={isRTL ? 'rtl' : 'ltr'}>
          <SheetTitle className="sr-only">{isRTL ? 'القائمة' : 'Menu'}</SheetTitle>
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
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* Collapse toggle */}
        <button
          onClick={toggleSidebar}
          className="absolute top-5 z-10 flex h-6 w-6 items-center justify-center rounded-full border bg-background shadow-sm hover:bg-muted transition-colors"
          style={{ [isRTL ? 'left' : 'right']: '-12px' }}
        >
          {isRTL
            ? <ChevronRight className={`h-3 w-3 transition-transform ${collapsed ? '' : 'rotate-180'}`} />
            : <ChevronLeft className={`h-3 w-3 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
          }
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
  const t = useT()

  const viewLabels: Record<string, string> = {
    sa_overview: t.overviewTitle,
    sa_tenants: t.tenantMgmt,
    sa_users: t.userMgmt,
    sa_plans: t.plansTitle,
    sa_billing: t.billingTitle,
    sa_cliq: t.cliqTitle,
    sa_roles: t.rolesTitle,
    sa_audit: t.auditTitle,
    sa_notifications: t.notificationsTitle,
    sa_reports: t.reportsTitle,
    sa_system: t.systemTitle,
    sa_servers: t.serversTitle,
    sa_database: t.dbTitle,
    sa_security: t.securityTitle,
    sa_settings: t.settingsTitle,
  }

  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-3 sm:px-5 h-14" dir={isRTL ? 'rtl' : 'ltr'}>
      {isMobile && (
        <Button variant="ghost" size="icon" className="shrink-0" onClick={() => setSidebarOpen(true)}>
          <Menu className="h-5 w-5" />
        </Button>
      )}
      <div className="flex-1 min-w-0">
        <h2 className="text-sm sm:text-base font-semibold truncate">{viewLabels[superAdminView] || ''}</h2>
        <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">{t.superAdminDashboard}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-full px-1.5 py-1 hover:bg-muted transition-colors">
              <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 text-white font-bold text-[10px] sm:text-xs">{currentUser?.name?.charAt(0) || 'SA'}</div>
              <div className="hidden sm:block text-start">
                <p className="text-xs sm:text-sm font-medium leading-tight">{currentUser?.name || (isRTL ? 'مدير النظام' : 'Super Admin')}</p>
                <p className="text-[9px] sm:text-[10px] text-violet-600 dark:text-violet-400 font-medium">{t.superAdmin}</p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align={isRTL ? 'start' : 'end'} className="w-48">
            <DropdownMenuItem onClick={logout} className="gap-2 text-red-600 focus:text-red-600"><LogOut className="h-4 w-4" />{t.signOut}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}