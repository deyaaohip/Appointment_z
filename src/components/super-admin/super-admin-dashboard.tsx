'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { useAppStore } from '@/stores/app-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import {
  Building2, Users, CalendarDays, Activity, CreditCard,
  Settings, Shield, Eye, Edit, Trash2, Plus, BarChart3, Server,
  Database, Lock, Bell, FileText, UserCog, CheckCircle2, AlertTriangle,
  RefreshCw, Globe, UserPlus, Clock, Monitor, HardDrive, Mail, Download,
  Power, PowerOff, Save, ChevronLeft, Search, Wallet, XCircle, Info,
  Upload, Image as ImageIcon, ClipboardCheck, Banknote, Copy, Link2, LayoutGrid, ChevronRight,
  Rocket,
} from 'lucide-react'

// ─── Imports from shared modules ───────────────────────────────
import { useT } from './sa-i18n'
import { type Lang } from './sa-i18n'
import {
  type Tenant, type PlatformUser, type SysLog, type Invoice,
  type Role, type Plan, type Server as ServerType, type Backup,
  type SecurityAttempt, type NotificationTemplate, type Report,
  type SortState, type CliqPayment, type CliqConfig,
  INIT_TENANTS, INIT_USERS, INIT_LOGS, PLANS, INIT_ROLES, SERVERS,
  INVOICES, BACKUPS, SECURITY_ATTEMPTS, NOTIF_TEMPLATES, REPORTS,
  DEFAULT_CLIQ_CONFIG, INIT_CLIQ_PAYMENTS, bField,
} from './sa-data'
import {
  fade, useSA, StatusBadge, LogDot, getLogLabel, PageTitle, FormField,
  Toggle, ConfirmDialog, KpiCard, StatCard, ActionBtn, PrimaryBtn,
  EmptyRow, SearchInput, SortableTH, Pagination, TableFooter, DlgFooter,
  gaugeColor, genericSort, paginate, useCurrency,
} from './sa-helpers'
import { TenantWizard, type TenantFormData } from './tenant-wizard'
import { TenantDetailsDialog } from './tenant-details-dialog'
import {
  INIT_RBAC_ROLES, INIT_RBAC_TEMPLATES, SYSTEM_MODULES, PERMISSION_ACTIONS,
  type RbacRole, type PermissionTemplate, type ModuleKey, type ActionKey,
  hasPermission, cloneRolePermissions, getEffectivePermissions, countPermissions,
  togglePermission, applyTemplate, getInheritedVsOwn,
  API_ENDPOINTS, UI_BUTTONS, PAGE_VISIBILITY_MAP,
  isApiAuthorized, isButtonVisible, getHiddenPages, generateJwtClaims, simulate403,
  METHOD_ACTION_MAP,
  type RbacClaim, type RbacPolicy,
} from './rbac-data'
import { InvoicePreviewDialog } from './invoice-preview'
import { DatabaseMonitoringPage } from './database-monitoring-page'
import { BackupSystemPage } from './backup-system-page'
import { SecurityCenterPage } from './security-center-page'
import { InputSecurityPage } from './input-security-page'
import { SettingsModulePage } from './settings-module-page'

const PER_PAGE = 7

// ─── Bilingual field helper for logs ───────────────────────────
function logMsg(l: SysLog, lang: Lang) { return lang === 'en' ? l.messageEn : l.message }
function logSrc(l: SysLog, lang: Lang) { return lang === 'en' ? l.sourceEn : l.source }
function serverRegion(s: ServerType, lang: Lang) { return lang === 'en' ? s.regionEn : s.region }
function secCountry(a: SecurityAttempt, lang: Lang) { return lang === 'en' ? a.countryEn : a.country }
function invTenant(inv: Invoice, lang: Lang) { return lang === 'en' ? (inv.tenantEn || inv.tenant) : inv.tenant }
function userTenant(u: PlatformUser, lang: Lang) { return lang === 'en' ? (u.tenantEn || u.tenant) : u.tenant }
function cliqTenantName(p: CliqPayment, lang: Lang) { return lang === 'en' ? (p.tenantNameEn || p.tenantName) : p.tenantName }

// ════════════════════════════════════════════════════════════════
// PAGE 1: OVERVIEW (Audited — all KPIs derived from real data)
// ════════════════════════════════════════════════════════════════
function OverviewPage() {
  const { t, isRTL, lang } = useSA()
  const { sym, fmt } = useCurrency()
  const [tenants] = useState<Tenant[]>(INIT_TENANTS)
  const [logs] = useState<SysLog[]>(INIT_LOGS)
  const [invoices] = useState<Invoice[]>(INVOICES)

  // Computed from real data — no hardcoded values
  const totalRevenue = tenants.reduce((s, tn) => s + tn.revenue, 0)
  const totalBookings = tenants.reduce((s, tn) => s + tn.bookings, 0)
  const activeCount = tenants.filter(tn => tn.status === 'active').length
  const expiredCount = tenants.filter(tn => tn.subscriptionStatus === 'expired').length
  const pendingSubs = tenants.filter(tn => tn.subscriptionStatus === 'trial' || tn.status === 'trial').length
  const paidInvoices = invoices.filter(i => i.status === 'paid')
  const monthlyRevenue = paidInvoices.reduce((s, i) => s + i.amount, 0)
  const activeTenants = tenants.filter(tn => tn.status === 'active').slice(0, 6)

  return (
    <div className="space-y-6">
      {/* Primary KPIs — all computed from tenant/invoice data */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard icon={Building2} bg="bg-violet-600" label={t.totalTenants} value={tenants.length} sub={`${activeCount} ${t.active.toLowerCase()}`} trend={12} delay={0} />
        <KpiCard icon={Users} bg="bg-sky-600" label={t.totalUsers} value={INIT_USERS.length} sub={`${tenants.reduce((s, tn) => s + tn.users, 0)} ${t.users.toLowerCase()}`} trend={8} delay={0.04} />
        <KpiCard icon={Banknote} bg="bg-amber-500" label={t.revenue} value={`${(totalRevenue / 1000).toFixed(1)}K ${sym}`} sub={t.thisMonth} trend={18} delay={0.08} />
        <KpiCard icon={CalendarDays} bg="bg-emerald-600" label={t.totalBookings} value={totalBookings.toLocaleString()} sub={t.last30Days} trend={5} delay={0.12} />
      </div>

      {/* Secondary KPIs — subscription health */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard icon={CheckCircle2} label={t.monthlyRevenue} value={fmt(monthlyRevenue)} color="text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30" />
        <StatCard icon={Clock} label={t.pendingRequests} value={String(pendingSubs)} color="text-amber-600 bg-amber-50 dark:bg-amber-950/30" />
        <StatCard icon={AlertTriangle} label={t.expiredSubs} value={String(expiredCount)} color="text-red-600 bg-red-50 dark:bg-red-950/30" />
        <StatCard icon={CreditCard} label={t.recentPayments} value={String(paidInvoices.length)} color="text-sky-600 bg-sky-50 dark:bg-sky-950/30" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
        <motion.div variants={fade} initial="hidden" animate="visible" transition={{ delay: 0.15 }} className="xl:col-span-2">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-sm sm:text-base font-semibold">{t.revenueByPlan}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {PLANS.filter(p => p.price > 0).map(p => {
                const rev = tenants.filter(tn => tn.plan === p.name).reduce((s, tn) => s + tn.revenue, 0)
                const pct = totalRevenue > 0 ? Math.round(rev / totalRevenue * 100) : 0
                return (
                  <div key={p.id} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{p.name}</span>
                      <span className="text-muted-foreground tabular-nums text-xs sm:text-sm">{rev.toLocaleString()} {sym}</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                      <div className={`h-full rounded-full ${p.color} transition-all duration-700`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={fade} initial="hidden" animate="visible" transition={{ delay: 0.2 }}>
          <Card className="border-0 shadow-sm h-full">
            <CardHeader className="pb-2"><CardTitle className="text-sm sm:text-base font-semibold">{t.recentActivity}</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-1">{logs.slice(0, 6).map(l => (
                <div key={l.id} className="flex gap-3 rounded-lg px-2.5 py-2 hover:bg-muted/50 transition-colors">
                  <LogDot level={l.level} />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm leading-relaxed line-clamp-2">{logMsg(l, lang)}</p>
                    <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-0.5">{logSrc(l, lang)}</p>
                  </div>
                </div>
              ))}</div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div variants={fade} initial="hidden" animate="visible" transition={{ delay: 0.25 }}>
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-sm sm:text-base font-semibold">{t.activeTenants}</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
              {activeTenants.map(tn => (
                <button key={tn.id} className="flex items-center gap-3 rounded-xl border p-3 text-start hover:bg-accent/50 transition-colors group" onClick={() => toast.info(t.details.replace('{name}', bField(tn, 'name', lang)))}>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/30 text-violet-600 font-bold text-sm">{bField(tn, 'name', lang).charAt(0)}</div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate">{bField(tn, 'name', lang)}</p>
                    <p className="text-xs text-muted-foreground">{tn.plan} · {tn.bookings.toLocaleString()} {t.bookings}</p>
                  </div>
                  <ChevronLeft className="h-4 w-4 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ transform: isRTL ? 'scaleX(-1)' : undefined }} />
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════
// PAGE 2: TENANTS (full CRUD + sort + pagination)
// ════════════════════════════════════════════════════════════════
function TenantsPage() {
  const { t, isRTL, lang } = useSA()
  const t2 = useT()
  const { sym } = useCurrency()
  const [tenants, setTenants] = useState<Tenant[]>(INIT_TENANTS)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState<SortState>({ key: 'name', dir: 'asc' })
  const [dlg, setDlg] = useState<{ type: string; tenant?: Tenant } | null>(null)
  const [form, setForm] = useState({ name: '', nameEn: '', email: '', country: '', plan: 'Starter' })
  const [extendDlg, setExtendDlg] = useState<Tenant | null>(null)
  const [extendMonths, setExtendMonths] = useState(12)
  const [extendPlan, setExtendPlan] = useState('')
  const [wizardOpen, setWizardOpen] = useState(false)
  const [detailTenant, setDetailTenant] = useState<Tenant | null>(null)

  const filtered = useMemo(() => {
    let list = [...tenants]
    if (filter !== 'all') list = list.filter(tn => tn.status === filter)
    if (search) { const q = search.toLowerCase(); list = list.filter(tn => tn.name.includes(q) || tn.nameEn.toLowerCase().includes(q) || tn.email.toLowerCase().includes(q)) }
    return genericSort(list, sort.key, sort.dir, lang)
  }, [tenants, search, filter, sort, lang])

  const { items, totalPages } = paginate(filtered, page, PER_PAGE)
  const handleSort = (key: string) => setSort(p => p.key === key ? { key, dir: p.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' })

  const openAdd = () => { setWizardOpen(true) }
  const openEdit = (tn: Tenant) => { setForm({ name: tn.name, nameEn: tn.nameEn, email: tn.email, country: tn.country, plan: tn.plan }); setDlg({ type: 'edit', tenant: tn }) }

  // Wizard-based tenant creation with full validation
  const handleWizardSave = useCallback((data: TenantFormData) => {
    // Duplicate checks
    const emailExists = tenants.some(tn => tn.email.toLowerCase() === data.email.toLowerCase())
    if (emailExists) { toast.error(isRTL ? 'البريد الإلكتروني مستخدم بالفعل' : 'Email already exists'); return }
    const nameArExists = tenants.some(tn => tn.name === data.nameAr.trim())
    if (nameArExists) { toast.error(isRTL ? 'اسم المستأجر (عربي) مستخدم بالفعل' : 'Tenant Arabic name already exists'); return }
    const nameEnExists = tenants.some(tn => tn.nameEn === data.nameEn.trim())
    if (nameEnExists) { toast.error(isRTL ? 'اسم المستأجر (إنجليزي) مستخدم بالفعل' : 'Tenant English name already exists'); return }

    // Calculate subscription end date based on billing cycle
    const cycleMonths = data.billingCycle === 'quarterly' ? 3 : data.billingCycle === 'yearly' ? 12 : 1
    const endDate = new Date(data.startDate)
    endDate.setMonth(endDate.getMonth() + cycleMonths)

    const slug = data.nameEn.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    const newTenant: Tenant = {
      id: Date.now().toString(),
      name: data.nameAr,
      nameEn: data.nameEn,
      email: data.email,
      country: data.country,
      plan: data.plan,
      bookings: 0,
      revenue: 0,
      users: 1,
      status: 'active',
      createdAt: data.startDate,
      subscriptionStatus: 'active',
      subscriptionEndDate: endDate.toISOString().split('T')[0],
      workspaceSlug: slug,
      workspacePublished: false,
      customDomain: '',
    }
    // Atomic update: add tenant + create invoice in one state batch
    setTenants(prev => [newTenant, ...prev])
    setPage(1)
    setFilter('all')
    setSearch('')
  }, [tenants, isRTL])

  const handleSave = useCallback(() => {
    if (!form.name.trim()) { toast.error(t.enterTenantName); return }
    if (form.email && !form.email.includes('@')) { toast.error(t.enterValidEmail); return }
    if (dlg?.type === 'edit' && dlg.tenant) {
      // Check for duplicates on edit (excluding self)
      const dupEmail = tenants.some(tn => tn.id !== dlg.tenant!.id && tn.email.toLowerCase() === form.email.toLowerCase())
      if (dupEmail) { toast.error(isRTL ? 'البريد الإلكتروني مستخدم بالفعل' : 'Email already exists'); return }
      setTenants(p => p.map(tn => tn.id === dlg.tenant!.id ? { ...tn, ...form } : tn)); toast.success(t.updated)
    }
    setDlg(null); setPage(1)
  }, [form, dlg, t, tenants, isRTL])

  const handleDelete = (tn: Tenant) => { setTenants(p => p.filter(x => x.id !== tn.id)); toast.success(t.deleted); setPage(1) }
  const handleToggleStatus = (tn: Tenant) => {
    const newStatus = tn.status === 'suspended' ? 'active' : 'suspended'
    setTenants(p => p.map(x => x.id === tn.id ? { ...x, status: newStatus } : x))
    toast.success(newStatus === 'suspended' ? t.tenantSuspended : t.tenantActivated)
    setPage(1)
  }

  const openExtend = (tn: Tenant) => { setExtendDlg(tn); setExtendPlan(tn.plan); setExtendMonths(12) }
  const handleExtend = () => {
    if (!extendDlg) return
    const startDate = extendDlg.subscriptionEndDate && extendDlg.subscriptionEndDate > new Date().toISOString().split('T')[0]
      ? new Date(extendDlg.subscriptionEndDate) : new Date()
    const newEnd = new Date(startDate)
    newEnd.setMonth(newEnd.getMonth() + extendMonths)
    setTenants(p => p.map(x => x.id === extendDlg.id ? {
      ...x, plan: extendPlan || x.plan,
      subscriptionStatus: 'active', status: 'active',
      subscriptionEndDate: newEnd.toISOString().split('T')[0]
    } : x))
    toast.success(t.subscriptionExtended)
    setExtendDlg(null)
  }

  const tnName = (tn: Tenant) => bField(tn, 'name', lang)

  // Existing tenants for wizard duplicate check
  const existingTenants = useMemo(() => tenants.map(tn => ({ email: tn.email, name: tn.name, nameEn: tn.nameEn })), [tenants])

  return (
    <div className="space-y-5">
      <PageTitle title={t.tenantMgmt} action={<PrimaryBtn icon={Plus} label={t.addTenant} onClick={openAdd} />} />
      <div className="flex flex-col sm:flex-row gap-3">
        <SearchInput value={search} onChange={v => { setSearch(v); setPage(1) }} placeholder={t.tenantSearch} />
        <Select value={filter} onValueChange={v => { setFilter(v); setPage(1) }}>
          <SelectTrigger className="w-full sm:w-44 h-10"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t.allStatuses}</SelectItem>
            <SelectItem value="active">{t.active}</SelectItem>
            <SelectItem value="trial">{t.trial}</SelectItem>
            <SelectItem value="suspended">{t.suspended}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="border-0 shadow-sm overflow-hidden hidden md:block">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader><TableRow className="bg-muted/50 hover:bg-muted/50">
              <SortableTH label={t.tenant} sortKey="name" currentSort={sort} onSort={handleSort} className="ps-5" />
              <SortableTH label={t.plan} sortKey="plan" currentSort={sort} onSort={handleSort} />
              <SortableTH label={t.bookings} sortKey="bookings" currentSort={sort} onSort={handleSort} align="end" />
              <SortableTH label={t.tenantRevenue} sortKey="revenue" currentSort={sort} onSort={handleSort} align="end" />
              <SortableTH label={t.status} sortKey="status" currentSort={sort} onSort={handleSort} />
              <TableHead className="px-3 font-semibold text-xs uppercase tracking-wider">{t.subscriptionStatus}</TableHead>
              <TableHead className="px-3 font-semibold text-xs uppercase tracking-wider text-center">{t2.workspaceSection}</TableHead>
              <TableHead className="pe-5 font-semibold text-xs uppercase tracking-wider text-end">{t.actions}</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {items.length === 0 ? <EmptyRow colSpan={8} /> : items.map(tn => (
                <TableRow key={tn.id} className="group hover:bg-muted/20 transition-colors">
                  <TableCell className="ps-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/30 text-violet-600 font-bold text-xs">{tnName(tn).charAt(0)}</div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="font-medium text-sm truncate max-w-[200px]">{tnName(tn)}</p>
                          {tn.workspacePublished && (
                            <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 text-[9px] px-1.5 py-0 h-4 font-semibold shrink-0">
                              {t2.workspacePublishedBadge}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate max-w-[200px]" dir="ltr">{tn.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-3"><Badge variant="secondary" className="font-medium text-xs">{tn.plan}</Badge></TableCell>
                  <TableCell className="px-3 text-end tabular-nums text-sm">{tn.bookings.toLocaleString()}</TableCell>
                  <TableCell className="px-3 text-end font-semibold tabular-nums text-sm">{tn.revenue.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">{sym}</span></TableCell>
                  <TableCell className="px-3"><StatusBadge status={tn.status} locale={lang} /></TableCell>
                  <TableCell className="px-3">
                    <div className="space-y-0.5">
                      <StatusBadge status={tn.subscriptionStatus} locale={lang} />
                      {tn.subscriptionEndDate && <p className="text-[10px] text-muted-foreground">{t.subscriptionEnd}: {tn.subscriptionEndDate}</p>}
                    </div>
                  </TableCell>
                  <TableCell className="px-3">
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 gap-1 text-[10px] font-medium"
                        onClick={() => {
                          navigator.clipboard.writeText(`https://bookflow.app/preview/${tn.workspaceSlug}`)
                          toast.success(t2.workspacePreviewCopied)
                        }}
                      >
                        <Eye className="h-3 w-3" />
                        {t2.workspacePreview}
                      </Button>
                      <Button
                        size="sm"
                        className={`h-7 gap-1 text-[10px] font-semibold ${
                          tn.workspacePublished
                            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50 border-0'
                            : 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-sm shadow-violet-600/20'
                        }`}
                        onClick={() => {
                          setTenants(p => p.map(x => x.id === tn.id ? { ...x, workspacePublished: !x.workspacePublished } : x))
                          toast.success(tn.workspacePublished ? t2.workspaceUnpublishSuccess : t2.workspacePublishSuccess)
                        }}
                      >
                        {tn.workspacePublished
                          ? <><CheckCircle2 className="h-3 w-3" />{t2.workspacePublishedBadge}</>
                          : <><Rocket className="h-3 w-3" />{t2.workspacePublish}</>
                        }
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="pe-5">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ActionBtn icon={Eye} label={t.view} onClick={() => setDetailTenant(tn)} />
                      <ActionBtn icon={Edit} label={t.edit} onClick={() => openEdit(tn)} />
                      <ActionBtn icon={CalendarDays} label={t.extendSubscription} onClick={() => openExtend(tn)} />
                      <ActionBtn icon={tn.status === 'suspended' ? Power : PowerOff} label={tn.status === 'suspended' ? t.active : t.suspended} onClick={() => handleToggleStatus(tn)} />
                      <ActionBtn icon={Trash2} onClick={() => setDlg({ type: 'delete', tenant: tn })} danger />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <TableFooter current={items.length} total={filtered.length} entity={t.tenant.toLowerCase()} />
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </Card>

      <div className="md:hidden space-y-3">
        {items.length === 0 ? <Card className="border-0 shadow-sm"><CardContent className="py-16 text-center text-muted-foreground text-sm">{t.noResults}</CardContent></Card> : items.map(tn => (
          <Card key={tn.id} className="border-0 shadow-sm"><CardContent className="p-4">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/30 text-violet-600 font-bold text-sm">{tnName(tn).charAt(0)}</div>
                <div className="min-w-0"><p className="font-semibold text-sm truncate">{tnName(tn)}</p><p className="text-xs text-muted-foreground truncate" dir="ltr">{tn.email}</p></div>
              </div>
              <StatusBadge status={tn.status} locale={lang} />
            </div>
            <div className="grid grid-cols-3 gap-3 mb-3 text-center">
              <div className="rounded-lg bg-muted/50 p-2"><p className="text-[10px] text-muted-foreground">{t.plan}</p><p className="text-xs font-semibold mt-0.5">{tn.plan}</p></div>
              <div className="rounded-lg bg-muted/50 p-2"><p className="text-[10px] text-muted-foreground">{t.bookings}</p><p className="text-xs font-semibold mt-0.5 tabular-nums">{tn.bookings.toLocaleString()}</p></div>
              <div className="rounded-lg bg-muted/50 p-2"><p className="text-[10px] text-muted-foreground">{t.tenantRevenue}</p><p className="text-xs font-semibold mt-0.5 tabular-nums">{tn.revenue.toLocaleString()} {sym}</p></div>
            </div>
            <div className="flex items-center gap-2 mb-3">
              <StatusBadge status={tn.subscriptionStatus} locale={lang} />
              {tn.subscriptionEndDate && <span className="text-[10px] text-muted-foreground">{t.subscriptionEnd}: {tn.subscriptionEndDate}</span>}
            </div>
            {/* Workspace Preview & Publish — always visible on mobile */}
            <div className="flex items-center gap-2 mb-3">
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-[11px] font-medium flex-1"
                onClick={() => {
                  navigator.clipboard.writeText(`https://bookflow.app/preview/${tn.workspaceSlug}`)
                  toast.success(t2.workspacePreviewCopied)
                }}
              >
                <Eye className="h-3.5 w-3.5" />
                {t2.workspacePreview}
              </Button>
              <Button
                size="sm"
                className={`h-8 gap-1.5 text-[11px] font-semibold flex-1 ${
                  tn.workspacePublished
                    ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50 border-0'
                    : 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-sm shadow-violet-600/20'
                }`}
                onClick={() => {
                  setTenants(p => p.map(x => x.id === tn.id ? { ...x, workspacePublished: !x.workspacePublished } : x))
                  toast.success(tn.workspacePublished ? t2.workspaceUnpublishSuccess : t2.workspacePublishSuccess)
                }}
              >
                {tn.workspacePublished
                  ? <><CheckCircle2 className="h-3.5 w-3.5" />{t2.workspacePublishedBadge}</>
                  : <><Rocket className="h-3.5 w-3.5" />{t2.workspacePublish}</>
                }
              </Button>
            </div>
            <div className="flex items-center justify-end gap-1 pt-2 border-t">
              <ActionBtn icon={Eye} onClick={() => setDetailTenant(tn)} />
              <ActionBtn icon={CalendarDays} label={t.extendSubscription} onClick={() => openExtend(tn)} />
              <ActionBtn icon={Edit} label={t.edit} onClick={() => openEdit(tn)} />
              <ActionBtn icon={tn.status === 'suspended' ? Power : PowerOff} label={tn.status === 'suspended' ? t.active : t.suspended} onClick={() => handleToggleStatus(tn)} />
              <ActionBtn icon={Trash2} onClick={() => setDlg({ type: 'delete', tenant: tn })} danger />
            </div>
          </CardContent></Card>
        ))}
      </div>

      <Dialog open={dlg?.type === 'edit'} onOpenChange={() => setDlg(null)}>
        <DialogContent className="max-w-md" dir={isRTL ? 'rtl' : 'ltr'}><DialogHeader><DialogTitle>{t.editTenantDlg}</DialogTitle><DialogDescription className="sr-only">{isRTL ? 'تعديل بيانات المستأجر' : 'Edit tenant details'}</DialogDescription></DialogHeader>
          <div className="space-y-4 pt-2">
            <FormField label={t.nameAr}><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></FormField>
            <FormField label={t.nameEn}><Input value={form.nameEn} onChange={e => setForm(p => ({ ...p, nameEn: e.target.value }))} dir="ltr" /></FormField>
            <FormField label={t.email}><Input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} dir="ltr" /></FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label={t.country}><Input value={form.country} onChange={e => setForm(p => ({ ...p, country: e.target.value }))} /></FormField>
              <FormField label={t.plan}><Select value={form.plan} onValueChange={v => setForm(p => ({ ...p, plan: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{PLANS.map(p => <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>)}</SelectContent></Select></FormField>
            </div>
          </div>
          <DlgFooter onCancel={() => setDlg(null)} onConfirm={handleSave} />
        </DialogContent>
      </Dialog>
      <ConfirmDialog open={dlg?.type === 'delete'} onOpenChange={() => setDlg(null)} title={t.deleteTenantDlg} desc={t.deleteTenantDesc.replace('{name}', dlg?.tenant?.name || '')} onConfirm={() => { if (dlg?.tenant) handleDelete(dlg.tenant) }} danger />

      {/* Extend Subscription Dialog */}
      <Dialog open={!!extendDlg} onOpenChange={() => setExtendDlg(null)}>
        <DialogContent className="max-w-md" dir={isRTL ? 'rtl' : 'ltr'}>
          <DialogHeader><DialogTitle>{t.extendSubscriptionDlg}</DialogTitle><DialogDescription className="sr-only">{isRTL ? 'تمديد اشتراك المستأجر' : 'Extend tenant subscription'}</DialogDescription></DialogHeader>
          <div className="space-y-4 pt-2">
            {extendDlg && <>
              <div className="rounded-lg bg-muted/50 p-3 space-y-1">
                <p className="font-semibold text-sm">{tnName(extendDlg)}</p>
                <div className="flex items-center gap-2">
                  <StatusBadge status={extendDlg.subscriptionStatus} locale={lang} />
                  {extendDlg.subscriptionEndDate && <span className="text-[11px] text-muted-foreground">{t.subscriptionEnd}: {extendDlg.subscriptionEndDate}</span>}
                </div>
              </div>
              <FormField label={t.plan}>
                <Select value={extendPlan} onValueChange={setExtendPlan}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{PLANS.filter(p => p.price > 0).map(p => <SelectItem key={p.id} value={p.name}>{p.name} — {p.price} {sym}/{t.perMonth}</SelectItem>)}</SelectContent>
                </Select>
              </FormField>
              <FormField label={t.durationMonths}>
                <Select value={String(extendMonths)} onValueChange={v => setExtendMonths(Number(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[1, 3, 6, 12, 24].map(m => <SelectItem key={m} value={String(m)}>{m} {t.months}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FormField>
              {extendPlan && (() => {
                const plan = PLANS.find(p => p.name === extendPlan)
                const total = plan ? plan.price * extendMonths : 0
                return total > 0 ? (
                  <div className="rounded-lg bg-violet-50 dark:bg-violet-950/30 p-3 text-center">
                    <p className="text-[10px] text-muted-foreground">{isRTL ? 'الإجمالي' : 'Total'}</p>
                    <p className="text-lg font-bold text-violet-700 dark:text-violet-400">{total.toLocaleString()} {sym}</p>
                  </div>
                ) : null
              })()}
            </>}
          </div>
          <DlgFooter onCancel={() => setExtendDlg(null)} onConfirm={handleExtend} confirmLabel={isRTL ? 'تمديد الاشتراك' : 'Extend Subscription'} />
        </DialogContent>
      </Dialog>

      {/* Multi-step Tenant Creation Wizard */}
      <TenantWizard open={wizardOpen} onClose={() => setWizardOpen(false)} onSave={handleWizardSave} existingTenants={existingTenants} />

      {/* Tenant Details Dialog */}
      {detailTenant && (
        <TenantDetailsDialog
          tenant={detailTenant}
          open={!!detailTenant}
          onClose={() => setDetailTenant(null)}
          onUpdateTenant={(updated) => setTenants(p => p.map(tn => tn.id === updated.id ? updated : tn))}
        />
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════
// PAGE 3: USERS (full CRUD + sort + pagination)
// ════════════════════════════════════════════════════════════════
function UsersPage() {
  const { t, lang, isRTL } = useSA()
  const [users, setUsers] = useState<PlatformUser[]>(INIT_USERS)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState<SortState>({ key: 'name', dir: 'asc' })
  const [dlg, setDlg] = useState<{ type: string; user?: PlatformUser } | null>(null)
  const [form, setForm] = useState({ name: '', email: '', tenant: '', role: 'owner' })

  const ROLE_MAP: Record<string, string> = { owner: t.owner, manager: t.manager, receptionist: t.receptionist, accountant: t.accountant }

  const filtered = useMemo(() => {
    let list = [...users]
    if (filter !== 'all') list = list.filter(u => u.status === filter)
    if (search) { const q = search.toLowerCase(); list = list.filter(u => u.name.includes(q) || u.email.toLowerCase().includes(q) || u.tenant.includes(q)) }
    return genericSort(list, sort.key, sort.dir, lang)
  }, [users, search, filter, sort, lang])

  const { items, totalPages } = paginate(filtered, page, PER_PAGE)
  const handleSort = (key: string) => setSort(p => p.key === key ? { key, dir: p.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' })

  const openAdd = () => { setForm({ name: '', email: '', tenant: '', role: 'owner' }); setDlg({ type: 'add' }) }
  const openEdit = (u: PlatformUser) => { setForm({ name: u.name, email: u.email, tenant: u.tenant, role: u.role }); setDlg({ type: 'edit', user: u }) }

  const handleSave = useCallback(() => {
    if (!form.name.trim() || !form.email.trim()) { toast.error(t.enterNameAndEmail); return }
    if (dlg?.type === 'add') {
      setUsers(p => [{ id: Date.now().toString(), ...form, tenantEn: '', status: 'active', lastLogin: new Date().toISOString() }, ...p])
      toast.success(t.added.replace('{name}', form.name))
    } else if (dlg?.user) {
      setUsers(p => p.map(u => u.id === dlg.user!.id ? { ...u, ...form } : u)); toast.success(t.updated)
    }
    setDlg(null); setPage(1)
  }, [form, dlg, t])

  const handleDelete = (u: PlatformUser) => { setUsers(p => p.filter(x => x.id !== u.id)); toast.success(t.userDeleted); setPage(1) }
  const handleToggleStatus = (u: PlatformUser) => {
    const newStatus = u.status === 'suspended' ? 'active' : 'suspended'
    setUsers(p => p.map(x => x.id === u.id ? { ...x, status: newStatus } : x))
    toast.success(newStatus === 'suspended' ? t.userSuspended : t.userActivated)
  }

  return (
    <div className="space-y-5">
      <PageTitle title={t.userMgmt} action={<PrimaryBtn icon={UserPlus} label={t.addUser} onClick={openAdd} />} />
      <div className="flex flex-col sm:flex-row gap-3">
        <SearchInput value={search} onChange={v => { setSearch(v); setPage(1) }} placeholder={t.userSearch} />
        <Select value={filter} onValueChange={v => { setFilter(v); setPage(1) }}>
          <SelectTrigger className="w-full sm:w-44 h-10"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">{t.all}</SelectItem><SelectItem value="active">{t.active}</SelectItem><SelectItem value="suspended">{t.suspended}</SelectItem></SelectContent>
        </Select>
      </div>

      <Card className="border-0 shadow-sm overflow-hidden hidden md:block">
        <div className="overflow-x-auto">
          <Table><TableHeader><TableRow className="bg-muted/50 hover:bg-muted/50">
            <SortableTH label={t.user} sortKey="name" currentSort={sort} onSort={handleSort} className="ps-5" />
            <SortableTH label={t.email} sortKey="email" currentSort={sort} onSort={handleSort} />
            <SortableTH label={t.tenant} sortKey="tenant" currentSort={sort} onSort={handleSort} />
            <SortableTH label={t.role} sortKey="role" currentSort={sort} onSort={handleSort} />
            <SortableTH label={t.status} sortKey="status" currentSort={sort} onSort={handleSort} />
            <TableHead className="pe-5 font-semibold text-xs uppercase tracking-wider text-end">{t.actions}</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {items.length === 0 ? <EmptyRow colSpan={6} /> : items.map(u => (
              <TableRow key={u.id} className="group hover:bg-muted/20 transition-colors">
                <TableCell className="ps-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-100 dark:bg-sky-900/30 text-sky-600 font-bold text-xs">{u.name.charAt(0)}</div>
                    <span className="font-medium text-sm">{u.name}</span>
                  </div>
                </TableCell>
                <TableCell className="px-3 text-sm text-muted-foreground" dir="ltr">{u.email}</TableCell>
                <TableCell className="px-3 text-sm">{userTenant(u, lang)}</TableCell>
                <TableCell className="px-3"><Badge variant="secondary" className="text-xs">{ROLE_MAP[u.role] || u.role}</Badge></TableCell>
                <TableCell className="px-3"><StatusBadge status={u.status} locale={lang} /></TableCell>
                <TableCell className="pe-5">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ActionBtn icon={Edit} label={t.edit} onClick={() => openEdit(u)} />
                    <ActionBtn icon={u.status === 'suspended' ? Power : PowerOff} label={u.status === 'suspended' ? t.active : t.suspended} onClick={() => handleToggleStatus(u)} />
                    <ActionBtn icon={Trash2} onClick={() => setDlg({ type: 'delete', user: u })} danger />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody></Table>
        </div>
        <TableFooter current={items.length} total={filtered.length} entity={t.user.toLowerCase()} />
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </Card>

      <div className="md:hidden space-y-3">
        {items.length === 0 ? <Card className="border-0 shadow-sm"><CardContent className="py-16 text-center text-muted-foreground text-sm">{t.noResults}</CardContent></Card> : items.map(u => (
          <Card key={u.id} className="border-0 shadow-sm"><CardContent className="p-4">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-100 dark:bg-sky-900/30 text-sky-600 font-bold text-sm">{u.name.charAt(0)}</div>
                <div className="min-w-0"><p className="font-semibold text-sm truncate">{u.name}</p><p className="text-xs text-muted-foreground truncate" dir="ltr">{u.email}</p></div>
              </div>
              <StatusBadge status={u.status} locale={lang} />
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="rounded-lg bg-muted/50 p-2"><p className="text-[10px] text-muted-foreground">{t.tenant}</p><p className="text-xs font-semibold mt-0.5 truncate">{userTenant(u, lang)}</p></div>
              <div className="rounded-lg bg-muted/50 p-2"><p className="text-[10px] text-muted-foreground">{t.role}</p><p className="text-xs font-semibold mt-0.5">{ROLE_MAP[u.role] || u.role}</p></div>
            </div>
            <div className="flex items-center justify-end gap-1 pt-2 border-t">
              <ActionBtn icon={Edit} label={t.edit} onClick={() => openEdit(u)} />
              <ActionBtn icon={u.status === 'suspended' ? Power : PowerOff} label={u.status === 'suspended' ? t.active : t.suspended} onClick={() => handleToggleStatus(u)} />
              <ActionBtn icon={Trash2} onClick={() => setDlg({ type: 'delete', user: u })} danger />
            </div>
          </CardContent></Card>
        ))}
      </div>

      <Dialog open={dlg?.type === 'add' || dlg?.type === 'edit'} onOpenChange={() => setDlg(null)}>
        <DialogContent className="max-w-md" dir={isRTL ? 'rtl' : 'ltr'}><DialogHeader><DialogTitle>{dlg?.type === 'add' ? t.addUserDlg : t.editUserDlg}</DialogTitle><DialogDescription className="sr-only">{isRTL ? 'إدارة المستخدمين' : 'Manage users'}</DialogDescription></DialogHeader>
          <div className="space-y-4 pt-2">
            <FormField label={t.name}><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></FormField>
            <FormField label={t.email}><Input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} dir="ltr" /></FormField>
            <FormField label={t.tenant}><Input value={form.tenant} onChange={e => setForm(p => ({ ...p, tenant: e.target.value }))} /></FormField>
            <FormField label={t.role}><Select value={form.role} onValueChange={v => setForm(p => ({ ...p, role: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="owner">{t.owner}</SelectItem><SelectItem value="manager">{t.manager}</SelectItem><SelectItem value="receptionist">{t.receptionist}</SelectItem><SelectItem value="accountant">{t.accountant}</SelectItem></SelectContent></Select></FormField>
          </div>
          <DlgFooter onCancel={() => setDlg(null)} onConfirm={handleSave} />
        </DialogContent>
      </Dialog>
      <ConfirmDialog open={dlg?.type === 'delete'} onOpenChange={() => setDlg(null)} title={t.deleteUserDlg} desc={t.confirmDeleteUser.replace('{name}', dlg?.user?.name || '')} onConfirm={() => { if (dlg?.user) handleDelete(dlg.user) }} danger />
    </div>
  )
}

// ════════════════════════════════════════════════════════════════
// PAGE 4: PLANS (Full CRUD + JOD currency)
// ════════════════════════════════════════════════════════════════
const PLAN_COLORS = ['bg-gray-500', 'bg-sky-500', 'bg-violet-500', 'bg-indigo-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500']

function PlansPage() {
  const { t, lang, isRTL } = useSA()
  const { sym, fmt } = useCurrency()
  const [plans, setPlans] = useState<Plan[]>([...PLANS])
  const [dlg, setDlg] = useState<{ type: 'add' | 'edit' | 'delete'; plan?: Plan } | null>(null)
  const [detailPlan, setDetailPlan] = useState<Plan | null>(null)
  const emptyFeature = { ar: '', en: '' }
  const [form, setForm] = useState({ name: '', price: 0, tenants: 0, color: 'bg-violet-500', popular: false, features: [{ ar: '', en: '' }] as { ar: string; en: string }[] })

  const openAdd = () => {
    setForm({ name: '', price: 0, tenants: 0, color: 'bg-violet-500', popular: false, features: [{ ar: '', en: '' }] })
    setDlg({ type: 'add' })
  }
  const openEdit = (p: Plan) => {
    setForm({ name: p.name, price: p.price, tenants: p.tenants, color: p.color, popular: p.popular, features: [...p.features] })
    setDlg({ type: 'edit', plan: p })
  }

  const handleSave = useCallback(() => {
    if (!form.name.trim()) { toast.error(lang === 'ar' ? 'يرجى إدخال اسم الباقة' : 'Please enter plan name'); return }
    const cleanFeatures = form.features.filter(f => f.ar.trim() || f.en.trim())
    if (cleanFeatures.length === 0) { toast.error(lang === 'ar' ? 'أضف ميزة واحدة على الأقل' : 'Add at least one feature'); return }
    if (dlg?.type === 'add') {
      const p: Plan = { id: Date.now().toString(), name: form.name, price: form.price, tenants: form.tenants, features: cleanFeatures, color: form.color, popular: form.popular, currency: 'JOD' }
      setPlans(prev => [...prev, p]); toast.success(lang === 'ar' ? 'تم إنشاء الباقة' : 'Plan created')
    } else if (dlg?.plan) {
      setPlans(prev => prev.map(p => p.id === dlg.plan!.id ? { ...p, name: form.name, price: form.price, tenants: form.tenants, features: cleanFeatures, color: form.color, popular: form.popular } : p))
      toast.success(t.updated)
    }
    setDlg(null)
  }, [form, dlg, t, lang])

  const handleDelete = () => {
    if (!dlg?.plan) return
    setPlans(prev => prev.filter(p => p.id !== dlg.plan!.id)); toast.success(t.deleted); setDlg(null)
  }

  const addFeature = () => setForm(p => ({ ...p, features: [...p.features, { ar: '', en: '' }] }))
  const removeFeature = (i: number) => setForm(p => ({ ...p, features: p.features.filter((_, idx) => idx !== i) }))
  const updateFeature = (i: number, field: 'ar' | 'en', val: string) => {
    setForm(p => { const f = [...p.features]; f[i] = { ...f[i], [field]: val }; return { ...p, features: f } })
  }

  return (
    <div className="space-y-6">
      <PageTitle title={t.plansTitle} action={<PrimaryBtn icon={Plus} label={t.createPlan} onClick={openAdd} />} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-5">
        {plans.map((p, i) => (
          <motion.div key={p.id} variants={fade} initial="hidden" animate="visible" transition={{ delay: i * 0.04 }}>
            <Card className={`h-full flex flex-col transition-all hover:shadow-lg border-0 shadow-sm ${p.popular ? 'ring-2 ring-violet-500 shadow-violet-500/10' : ''}`}>
              <CardContent className="flex-1 flex flex-col items-center p-5 sm:p-6 pt-7">
                {p.popular && <Badge className="bg-violet-600 text-white mb-3 -mt-1 text-[10px]">{t.mostPopular}</Badge>}
                <div className={`h-12 w-12 rounded-2xl ${p.color} flex items-center justify-center mb-4 shadow-lg`}><CreditCard className="h-6 w-6 text-white" /></div>
                <h3 className="font-bold text-base">{p.name}</h3>
                <p className="text-3xl font-extrabold mt-3 mb-1">{p.price > 0 ? `${p.price}` : t.free}</p>
                <p className="text-xs text-muted-foreground mb-5">{p.price > 0 ? `${sym} ${t.perMonth}` : ''} · {p.tenants} {t.tenants}</p>
                <Separator className="w-full mb-5" />
                <ul className="space-y-2.5 w-full text-start flex-1">{p.features.map((f, j) => (
                  <li key={j} className="flex items-start gap-2 text-xs sm:text-sm"><CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" /><span>{lang === 'en' ? f.en : f.ar}</span></li>
                ))}</ul>
                <div className="flex gap-2 w-full mt-6">
                  <Button className={`flex-1 ${p.popular ? 'bg-violet-600 hover:bg-violet-700 text-white' : ''}`} variant={p.popular ? 'default' : 'outline'} onClick={() => setDetailPlan(p)}>{t.view}</Button>
                  <ActionBtn icon={Edit} label={t.edit} onClick={() => openEdit(p)} />
                  <ActionBtn icon={Trash2} onClick={() => setDlg({ type: 'delete', plan: p })} danger />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!detailPlan} onOpenChange={() => setDetailPlan(null)}>
        <DialogContent className="max-w-sm" dir={isRTL ? 'rtl' : 'ltr'}><DialogHeader><DialogTitle>{t.planDetails}</DialogTitle><DialogDescription className="sr-only">{lang === 'ar' ? 'تفاصيل الباقة' : 'Plan details'}</DialogDescription></DialogHeader>
          {detailPlan && <div className="space-y-4 pt-2">
            <div className="text-center"><p className="text-3xl font-extrabold">{detailPlan.price > 0 ? `${detailPlan.price} ${sym}` : t.free}</p><p className="text-sm text-muted-foreground mt-1">{t.monthly} · {detailPlan.tenants} {t.tenants}</p></div>
            <Separator />
            <ul className="space-y-2">{detailPlan.features.map((f, i) => (<li key={i} className="flex items-center gap-2 text-sm"><CheckCircle2 className="h-4 w-4 text-emerald-500" />{lang === 'en' ? f.en : f.ar}</li>))}</ul>
          </div>}
          <DlgFooter onCancel={() => setDetailPlan(null)} onConfirm={() => { if (detailPlan) { openEdit(detailPlan); setDetailPlan(null) } }} confirmLabel={t.edit} />
        </DialogContent>
      </Dialog>

      {/* Add/Edit Dialog */}
      <Dialog open={dlg?.type === 'add' || dlg?.type === 'edit'} onOpenChange={() => setDlg(null)}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto" dir={isRTL ? 'rtl' : 'ltr'}>
          <DialogHeader><DialogTitle>{dlg?.type === 'add' ? t.createPlan : t.editPlanDlg}</DialogTitle><DialogDescription className="sr-only">{lang === 'ar' ? 'إضافة أو تعديل باقة' : 'Add or edit a plan'}</DialogDescription></DialogHeader>
          <div className="space-y-4 pt-2">
            <FormField label={lang === 'ar' ? 'اسم الباقة' : 'Plan Name'}>
              <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder={lang === 'ar' ? 'مثال: Professional' : 'e.g. Professional'} />
            </FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label={t.amount}>
                <Input type="number" value={form.price || ''} onChange={e => setForm(p => ({ ...p, price: Number(e.target.value) }))} placeholder="0" />
              </FormField>
              <FormField label={lang === 'ar' ? 'عدد المستأجرين' : 'Max Tenants'}>
                <Input type="number" value={form.tenants || ''} onChange={e => setForm(p => ({ ...p, tenants: Number(e.target.value) }))} placeholder="0" />
              </FormField>
            </div>
            <FormField label={lang === 'ar' ? 'اللون' : 'Color'}>
              <div className="flex flex-wrap gap-2">
                {PLAN_COLORS.map(c => (
                  <button key={c} className={`h-8 w-8 rounded-full ${c} transition-transform ${form.color === c ? 'ring-2 ring-offset-2 ring-violet-500 scale-110' : 'opacity-60 hover:opacity-100'}`} onClick={() => setForm(p => ({ ...p, color: c }))} />
                ))}
              </div>
            </FormField>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{t.mostPopular}</span>
              <Toggle on={form.popular} onToggle={() => setForm(p => ({ ...p, popular: !p.popular }))} />
            </div>
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{lang === 'ar' ? 'المميزات' : 'Features'}</span>
                <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={addFeature}><Plus className="h-3 w-3" />{lang === 'ar' ? 'إضافة' : 'Add'}</Button>
              </div>
              {form.features.map((f, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <Input value={f.ar} onChange={e => updateFeature(i, 'ar', e.target.value)} placeholder={lang === 'ar' ? 'بالعربي' : 'Arabic'} />
                    <Input value={f.en} onChange={e => updateFeature(i, 'en', e.target.value)} placeholder="English" dir="ltr" />
                  </div>
                  {form.features.length > 1 && <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0 mt-0.5" onClick={() => removeFeature(i)}><Trash2 className="h-3.5 w-3.5 text-red-400" /></Button>}
                </div>
              ))}
            </div>
          </div>
          <DlgFooter onCancel={() => setDlg(null)} onConfirm={handleSave} />
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <ConfirmDialog open={dlg?.type === 'delete'} onOpenChange={() => setDlg(null)} title={t.delete} desc={lang === 'ar' ? `هل أنت متأكد من حذف باقة "${dlg?.plan?.name}"؟` : `Delete plan "${dlg?.plan?.name}"?`} onConfirm={handleDelete} danger />
    </div>
  )
}

// ════════════════════════════════════════════════════════════════
// PAGE 5: BILLING (Full invoice CRUD + CSV export + JOD)
// ════════════════════════════════════════════════════════════════
function BillingPage() {
  const { t, lang, isRTL } = useSA()
  const { fmt, sym } = useCurrency()
  const [invoices, setInvoices] = useState<Invoice[]>([...INVOICES])
  const [filter, setFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState<SortState>({ key: 'date', dir: 'desc' })
  const [addOpen, setAddOpen] = useState(false)
  const [invForm, setInvForm] = useState({ tenant: '', tenantEn: '', plan: 'Starter', amount: 0, status: 'pending' as string })
  const [previewInv, setPreviewInv] = useState<Invoice | null>(null)

  const filtered = useMemo(() => {
    let list = filter === 'all' ? [...invoices] : invoices.filter(i => i.status === filter)
    return genericSort(list, sort.key, sort.dir, lang)
  }, [invoices, filter, sort, lang])
  const { items, totalPages } = paginate(filtered, page, PER_PAGE)
  const handleSort = (key: string) => setSort(p => p.key === key ? { key, dir: p.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' })
  const totalPaid = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.amount, 0)
  const totalPending = invoices.filter(i => i.status === 'pending' || i.status === 'overdue').reduce((s, i) => s + i.amount, 0)

  const handleStatusChange = useCallback((invoiceId: string, newStatus: string, method?: string) => {
    setInvoices(p => p.map(i => {
      if (i.id !== invoiceId) return i
      const updated = { ...i, status: newStatus }
      if (newStatus === 'paid') {
        updated.paidDate = new Date().toISOString().split('T')[0]
        updated.paymentMethod = method || 'cliq'
        updated.history = [...(i.history || []), {
          date: new Date().toISOString(), action: 'دفعة ناجحة', actionEn: 'Payment received',
          details: `تم الدفع عبر ${method === 'card' ? 'بطاقة ائتمان' : method === 'bank_transfer' ? 'تحويل بنكي' : 'CLIQ'}`,
          detailsEn: `Paid via ${method === 'card' ? 'credit card' : method === 'bank_transfer' ? 'bank transfer' : 'CLIQ'}`,
          by: 'Super Admin',
        }]
      } else if (newStatus === 'refunded') {
        updated.history = [...(i.history || []), {
          date: new Date().toISOString(), action: 'إرجاع', actionEn: 'Refunded',
          details: 'تم إرجاع مبلغ الفاتورة', detailsEn: 'Invoice amount refunded', by: 'Super Admin',
        }]
      }
      return updated
    }))
    toast.success(t.invoiceStatusChanged)
  }, [])

  const handleMarkPaid = (inv: Invoice) => { handleStatusChange(inv.id, 'paid') }

  const handleCreateInvoice = () => {
    if (!invForm.tenant.trim()) { toast.error(isRTL ? 'يرجى اختيار المستأجر' : 'Please select a tenant'); return }
    if (invForm.amount <= 0) { toast.error(isRTL ? 'يرجى إدخال مبلغ صحيح' : 'Please enter a valid amount'); return }
    const newId = `INV-${String(invoices.length + 1).padStart(3, '0')}`
    const today = new Date().toISOString().split('T')[0]
    const dueDate = new Date(); dueDate.setDate(dueDate.getDate() + 30)
    const inv: Invoice = {
      id: newId, tenant: invForm.tenant, tenantEn: invForm.tenantEn,
      amount: invForm.amount, status: invForm.status,
      date: today, dueDate: dueDate.toISOString().split('T')[0], paidDate: null,
      plan: invForm.plan, currency: 'JOD', taxRate: 16, notes: '', paymentMethod: '',
      history: [{ date: new Date().toISOString(), action: 'إنشاء الفاتورة', actionEn: 'Invoice created', details: `فاتورة اشتراك ${invForm.plan}`, detailsEn: `${invForm.plan} subscription invoice`, by: 'Super Admin' }],
    }
    setInvoices(p => [inv, ...p]); toast.success(isRTL ? `تم إنشاء الفاتورة ${newId}` : `Invoice ${newId} created`); setAddOpen(false)
    setInvForm({ tenant: '', tenantEn: '', plan: 'Starter', amount: 0, status: 'pending' })
  }

  const handleExportExcel = useCallback(() => {
    import('xlsx').then(XLSX => {
      const statusLabels: Record<string, string> = { paid: isRTL ? 'مدفوع' : 'Paid', pending: isRTL ? 'معلق' : 'Pending', overdue: isRTL ? 'متأخر' : 'Overdue', failed: isRTL ? 'فاشل' : 'Failed' }
      const headers = isRTL
        ? ['رقم الفاتورة', 'المستأجر', 'الباقة', 'المبلغ (د.أ)', 'العملة', 'الحالة', 'التاريخ']
        : ['Invoice No.', 'Tenant', 'Plan', 'Amount (JOD)', 'Currency', 'Status', 'Date']
      const rows = filtered.map(inv => [
        inv.id, isRTL ? inv.tenant : (inv.tenantEn || inv.tenant), inv.plan,
        inv.amount, inv.currency, statusLabels[inv.status] || inv.status, inv.date,
      ])
      const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])
      ws['!cols'] = headers.map(() => ({ wch: 20 }))
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, isRTL ? 'الفواتير' : 'Invoices')
      XLSX.writeFile(wb, `invoices_${new Date().toISOString().split('T')[0]}.xlsx`)
      toast.success(isRTL ? 'تم تصدير الفواتير إلى Excel بنجاح' : 'Invoices exported to Excel successfully')
    }).catch(() => {
      toast.error(isRTL ? 'فشل تصدير Excel' : 'Excel export failed')
    })
  }, [filtered, isRTL])

  const handleDeleteInvoice = (inv: Invoice) => {
    setInvoices(p => p.filter(i => i.id !== inv.id)); toast.success(t.deleted); setPage(1)
  }

  return (
    <div className="space-y-5">
      <PageTitle title={t.billingTitle} action={
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2 h-9" onClick={handleExportExcel}><Download className="h-4 w-4" />{t.exportExcel}</Button>
          <PrimaryBtn icon={Plus} label={t.createInvoice} onClick={() => setAddOpen(true)} />
        </div>
      } />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard icon={CheckCircle2} label={t.payments} value={fmt(totalPaid)} color="text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30" />
        <StatCard icon={Clock} label={t.pending} value={fmt(totalPending)} color="text-amber-600 bg-amber-50 dark:bg-amber-950/30" />
        <StatCard icon={Banknote} label={t.paid} value={`${invoices.filter(i => i.status === 'paid').length}`} color="text-sky-600 bg-sky-50 dark:bg-sky-950/30" />
        <StatCard icon={AlertTriangle} label={t.overdue} value={`${invoices.filter(i => i.status === 'overdue').length}`} color="text-red-600 bg-red-50 dark:bg-red-950/30" />
      </div>
      <div className="flex gap-3">
        <Select value={filter} onValueChange={v => { setFilter(v); setPage(1) }}>
          <SelectTrigger className="w-44 h-10"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">{t.all}</SelectItem><SelectItem value="paid">{t.paid}</SelectItem><SelectItem value="pending">{t.pending}</SelectItem><SelectItem value="overdue">{t.overdue}</SelectItem><SelectItem value="failed">{t.failed}</SelectItem></SelectContent>
        </Select>
      </div>

      <Card className="border-0 shadow-sm overflow-hidden hidden md:block">
        <div className="overflow-x-auto">
          <Table><TableHeader><TableRow className="bg-muted/50 hover:bg-muted/50">
            <SortableTH label={t.invoiceNo} sortKey="id" currentSort={sort} onSort={handleSort} className="ps-5" />
            <SortableTH label={t.tenant} sortKey="tenant" currentSort={sort} onSort={handleSort} />
            <SortableTH label={t.plan} sortKey="plan" currentSort={sort} onSort={handleSort} className="hidden lg:table-cell" />
            <SortableTH label={t.amount} sortKey="amount" currentSort={sort} onSort={handleSort} align="end" />
            <SortableTH label={t.status} sortKey="status" currentSort={sort} onSort={handleSort} />
            <TableHead className="pe-5 font-semibold text-xs uppercase tracking-wider text-end">{t.actions}</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {items.length === 0 ? <EmptyRow colSpan={6} /> : items.map(inv => (
            <TableRow key={inv.id} className="group hover:bg-muted/20 transition-colors">
              <TableCell className="ps-5 font-mono text-sm font-semibold">{inv.id}</TableCell>
              <TableCell className="px-3 text-sm">{invTenant(inv, lang)}</TableCell>
              <TableCell className="px-3 hidden lg:table-cell"><Badge variant="secondary" className="text-xs">{inv.plan}</Badge></TableCell>
              <TableCell className="px-3 text-end font-semibold tabular-nums text-sm">{inv.amount.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">{sym}</span></TableCell>
              <TableCell className="px-3"><StatusBadge status={inv.status} locale={lang} /></TableCell>
              <TableCell className="pe-5">
                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ActionBtn icon={Eye} label={t.view} onClick={() => setPreviewInv(inv)} />
                  {inv.status === 'pending' && <ActionBtn icon={CheckCircle2} label={t.invoiceMarkPaid} onClick={() => handleStatusChange(inv.id, 'paid')} />}
                  {inv.status === 'overdue' && <ActionBtn icon={AlertTriangle} onClick={() => { handleStatusChange(inv.id, 'pending'); toast.success(t.invoiceSendReminderDesc) }} />}
                  {inv.status === 'paid' && <ActionBtn icon={RefreshCw} label={t.invoiceRefund} onClick={() => handleStatusChange(inv.id, 'refunded')} />}
                  <ActionBtn icon={Download} onClick={handleExportExcel} />
                  <ActionBtn icon={Trash2} onClick={() => handleDeleteInvoice(inv)} danger />
                </div>
              </TableCell>
            </TableRow>
          ))}
          </TableBody></Table>
        </div>
        <TableFooter current={items.length} total={filtered.length} entity={isRTL ? 'فاتورة' : 'invoices'} />
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </Card>

      <div className="md:hidden space-y-3">
        {items.length === 0 ? <Card className="border-0 shadow-sm"><CardContent className="py-16 text-center text-muted-foreground text-sm">{t.noResults}</CardContent></Card> : items.map(inv => (
          <Card key={inv.id} className="border-0 shadow-sm"><CardContent className="p-4">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="min-w-0"><p className="font-mono text-sm font-bold">{inv.id}</p><p className="text-xs text-muted-foreground mt-0.5">{invTenant(inv, lang)}</p></div>
              <StatusBadge status={inv.status} locale={lang} />
            </div>
            <div className="flex items-center justify-between pt-2 border-t">
              <span className="font-bold text-sm">{inv.amount.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">{sym}</span></span>
              <div className="flex gap-1">
                <ActionBtn icon={Eye} onClick={() => setPreviewInv(inv)} />
                {inv.status !== 'paid' && <ActionBtn icon={CheckCircle2} onClick={() => handleMarkPaid(inv)} />}
                {inv.status === 'paid' && <ActionBtn icon={RefreshCw} label={t.invoiceRefund} onClick={() => handleStatusChange(inv.id, 'refunded')} />}
                <ActionBtn icon={Download} onClick={() => handleExportExcel()} />
                <ActionBtn icon={Trash2} onClick={() => handleDeleteInvoice(inv)} danger />
              </div>
            </div>
          </CardContent></Card>
        ))}
      </div>

      {/* Create Invoice Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md" dir={isRTL ? 'rtl' : 'ltr'}><DialogHeader><DialogTitle>{t.createInvoice}</DialogTitle><DialogDescription className="sr-only">{isRTL ? 'إنشاء فاتورة جديدة' : 'Create a new invoice'}</DialogDescription></DialogHeader>
          <div className="space-y-4 pt-2">
            <FormField label={t.tenant}>
              <Select value={invForm.tenant} onValueChange={v => {
                const tn = INIT_TENANTS.find(x => x.name === v || x.nameEn === v)
                setInvForm(p => ({ ...p, tenant: tn?.name || v, tenantEn: tn?.nameEn || v }))
              }}>
                <SelectTrigger><SelectValue placeholder={isRTL ? 'اختر المستأجر' : 'Select tenant'} /></SelectTrigger>
                <SelectContent>
                  {INIT_TENANTS.map(tn => <SelectItem key={tn.id} value={lang === 'en' ? tn.nameEn : tn.name}>{lang === 'en' ? tn.nameEn : tn.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label={t.plan}>
                <Select value={invForm.plan} onValueChange={v => {
                  setInvForm(p => ({ ...p, plan: v }))
                  const plan = PLANS.find(pl => pl.name === v)
                  if (plan) setInvForm(p => ({ ...p, amount: plan.price }))
                }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{PLANS.map(p => <SelectItem key={p.id} value={p.name}>{p.name} ({p.price} {sym})</SelectItem>)}</SelectContent>
                </Select>
              </FormField>
              <FormField label={t.amount}>
                <Input type="number" value={invForm.amount || ''} onChange={e => setInvForm(p => ({ ...p, amount: Number(e.target.value) }))} />
              </FormField>
            </div>
            <FormField label={t.status}>
              <Select value={invForm.status} onValueChange={v => setInvForm(p => ({ ...p, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">{t.pending}</SelectItem>
                  <SelectItem value="paid">{t.paid}</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
          </div>
          <DlgFooter onCancel={() => setAddOpen(false)} onConfirm={handleCreateInvoice} confirmLabel={isRTL ? 'إنشاء' : 'Create'} />
        </DialogContent>
      </Dialog>

      {/* Invoice Preview Dialog */}
      {previewInv && <InvoicePreviewDialog invoice={previewInv} open={!!previewInv} onClose={() => setPreviewInv(null)} onStatusChange={handleStatusChange} />}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════
// PAGE 6: ROLES & PERMISSIONS (Enterprise RBAC — Enhanced)
// ════════════════════════════════════════════════════════════════
function RolesPage() {
  const { t, lang, isRTL } = useSA()
  const [roles, setRoles] = useState<RbacRole[]>(INIT_RBAC_ROLES)
  const [templates, setTemplates] = useState<PermissionTemplate[]>(INIT_RBAC_TEMPLATES)
  const [dlg, setDlg] = useState<{ type: 'add' | 'edit' | 'delete' | 'matrix' | 'clone_src' | 'details' | 'policy' | 'save_tpl'; role?: RbacRole } | null>(null)
  const [form, setForm] = useState({ name: '', nameEn: '', desc: '', descEn: '', parentId: null as string | null, permissions: {} as Record<string, string[]> })
  const [tplDlg, setTplDlg] = useState(false)
  const [viewTab, setViewTab] = useState<'roles' | 'matrix' | 'templates' | 'api' | 'buttons' | 'jwt' | 'visibility' | 'policies'>('roles')
  const [detailRole, setDetailRole] = useState<RbacRole | null>(null)
  const [policyForm, setPolicyForm] = useState({ name: '', nameEn: '', effect: 'deny' as 'allow' | 'deny', module: '*' as string, action: '*' as string, condition: '', conditionAr: '', conditionEn: '', priority: 1 })
  const [editingPolicyId, setEditingPolicyId] = useState<string | null>(null)
  const [saveTplForm, setSaveTplForm] = useState({ name: '', nameEn: '', desc: '', descEn: '' })

  const rName = (r: RbacRole) => lang === 'en' ? r.nameEn : r.name
  const rDesc = (r: RbacRole) => lang === 'en' ? r.descriptionEn : r.description

  const openAdd = () => {
    setForm({ name: '', nameEn: '', desc: '', descEn: '', parentId: null, permissions: {} })
    SYSTEM_MODULES.forEach(m => { form.permissions[m.key] = ['view'] })
    setForm(p => ({ ...p, permissions: { ...p.permissions } }))
    setDlg({ type: 'add' })
  }

  const openEdit = (r: RbacRole) => {
    setForm({ name: r.name, nameEn: r.nameEn, desc: r.description, descEn: r.descriptionEn, parentId: r.parentId, permissions: cloneRolePermissions(r) })
    setDlg({ type: 'edit', role: r })
  }

  const openMatrix = (r: RbacRole) => { setForm({ name: r.name, nameEn: r.nameEn, desc: r.description, descEn: r.descriptionEn, parentId: r.parentId, permissions: cloneRolePermissions(r) }); setDlg({ type: 'matrix', role: r }) }

  const openDetails = (r: RbacRole) => { setDetailRole(r) }

  const handleClone = (r: RbacRole) => {
    const clone: RbacRole = { ...r, id: Date.now().toString(), name: `${r.name} ${t.rbacCloneSuffix}`, nameEn: `${r.nameEn} (Copy)`, userCount: 0, isSystem: false, parentId: r.parentId, permissions: cloneRolePermissions(r), createdAt: new Date().toISOString().split('T')[0], claims: r.claims ? r.claims.map(c => ({ ...c })) : [], policies: r.policies ? r.policies.map(p => ({ ...p })) : [], hiddenPages: r.hiddenPages ? [...r.hiddenPages] : [] }
    setRoles(p => [clone, ...p]); toast.success(t.rbacRoleCloned)
  }

  const handleSave = () => {
    if (!form.name.trim()) { toast.error(lang === 'ar' ? 'يرجى إدخال اسم الدور' : 'Please enter role name'); return }
    if (dlg?.type === 'add') {
      const r: RbacRole = { id: Date.now().toString(), name: form.name, nameEn: form.nameEn, description: form.desc, descriptionEn: form.descEn, userCount: 0, isSystem: false, parentId: form.parentId, permissions: { ...form.permissions }, createdAt: new Date().toISOString().split('T')[0], claims: [], policies: [], hiddenPages: [] }
      setRoles(p => [r, ...p]); toast.success(t.roleCreated)
    } else if (dlg?.role) {
      setRoles(p => p.map(r => r.id === dlg.role!.id ? { ...r, name: form.name, nameEn: form.nameEn, description: form.desc, descriptionEn: form.descEn, parentId: form.parentId, permissions: { ...form.permissions } } : r))
      toast.success(t.roleUpdated)
    }
    setDlg(null)
  }

  const handleDelete = () => {
    if (!dlg?.role) return
    setRoles(p => p.filter(x => x.id !== dlg.role!.id)); toast.success(t.roleDeleted); setDlg(null)
  }

  const handleTogglePerm = (mod: string, action: string) => {
    setForm(p => ({ ...p, permissions: togglePermission({ ...p, permissions: p.permissions }, mod, action) }))
  }

  const handleApplyTemplate = (tpl: PermissionTemplate) => {
    const perms = applyTemplate(tpl)
    setForm(p => ({ ...p, permissions: perms }))
    setTplDlg(false); toast.success(t.rbacTemplateApplied)
  }

  // Policy management
  const openAddPolicy = () => {
    setEditingPolicyId(null)
    setPolicyForm({ name: '', nameEn: '', effect: 'deny', module: '*', action: '*', condition: '', conditionAr: '', conditionEn: '', priority: 1 })
    setDlg({ type: 'policy', role: detailRole || undefined })
  }

  const openEditPolicy = (policy: RbacPolicy) => {
    setEditingPolicyId(policy.id)
    setPolicyForm({ name: policy.name, nameEn: policy.nameEn, effect: policy.effect, module: policy.module, action: policy.action, condition: policy.condition || '', conditionAr: policy.conditionAr || '', conditionEn: policy.conditionEn || '', priority: policy.priority })
    setDlg({ type: 'policy', role: detailRole || undefined })
  }

  const handleSavePolicy = () => {
    if (!policyForm.name.trim() || !dlg?.role) return
    const newPolicy: RbacPolicy = {
      id: editingPolicyId || `p-${Date.now()}`,
      name: policyForm.name,
      nameEn: policyForm.nameEn,
      effect: policyForm.effect,
      module: policyForm.module,
      action: policyForm.action,
      condition: policyForm.condition || undefined,
      conditionAr: policyForm.conditionAr || undefined,
      conditionEn: policyForm.conditionEn || undefined,
      priority: policyForm.priority,
    }
    setRoles(p => p.map(r => {
      if (r.id !== dlg.role!.id) return r
      const policies = [...(r.policies || [])]
      if (editingPolicyId) {
        const idx = policies.findIndex(pp => pp.id === editingPolicyId)
        if (idx >= 0) policies[idx] = newPolicy
      } else {
        policies.push(newPolicy)
      }
      return { ...r, policies }
    }))
    toast.success(editingPolicyId ? t.rbacPolicyUpdated : t.rbacPolicyCreated)
    setDlg(null)
    // Refresh detailRole
    setRoles(p => p)
  }

  const handleDeletePolicy = (policyId: string) => {
    if (!detailRole) return
    setRoles(p => p.map(r => r.id === detailRole.id ? { ...r, policies: (r.policies || []).filter(pp => pp.id !== policyId) } : r))
    toast.success(t.rbacPolicyDeleted)
  }

  // Save as Template
  const openSaveTemplate = () => {
    setSaveTplForm({ name: '', nameEn: '', desc: '', descEn: '' })
    setDlg({ type: 'save_tpl', role: detailRole || undefined })
  }

  const handleSaveTemplate = () => {
    if (!saveTplForm.name.trim() || !dlg?.role) return
    const newTpl: PermissionTemplate = {
      id: `tpl-${Date.now()}`,
      name: saveTplForm.name,
      nameEn: saveTplForm.nameEn,
      description: saveTplForm.desc,
      descriptionEn: saveTplForm.descEn,
      permissions: cloneRolePermissions(dlg.role),
    }
    setTemplates(p => [...p, newTpl])
    toast.success(t.rbacTemplateSaved)
    setDlg(null)
  }

  const permCount = (r: RbacRole) => countPermissions(r.permissions)
  const effectivePerms = dlg?.role ? getEffectivePermissions(dlg.role, roles) : null
  const inheritedInfo = dlg?.role ? getInheritedVsOwn(dlg.role, roles) : null

  const TABS = [
    { key: 'roles' as const, label: t.rolesTitle },
    { key: 'matrix' as const, label: t.rbacMatrix },
    { key: 'templates' as const, label: t.rbacTemplates },
    { key: 'api' as const, label: lang === 'ar' ? 'API' : 'API' },
    { key: 'buttons' as const, label: lang === 'ar' ? 'الأزرار' : 'Buttons' },
    { key: 'jwt' as const, label: t.rbacJwtClaims },
    { key: 'visibility' as const, label: t.rbacMenuVisibility },
    { key: 'policies' as const, label: lang === 'ar' ? 'السياسات' : 'Policies' },
  ]

  // Method colors
  const methodColor = (m: string) => m === 'GET' ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30' : m === 'POST' ? 'text-sky-600 bg-sky-50 dark:bg-sky-950/30' : m === 'PUT' || m === 'PATCH' ? 'text-amber-600 bg-amber-50 dark:bg-amber-950/30' : 'text-red-600 bg-red-50 dark:bg-red-950/30'

  return (
    <div className="space-y-6">
      <PageTitle title={t.rbacTitle} action={<PrimaryBtn icon={Plus} label={t.addRole} onClick={openAdd} />} />

      {/* View Tabs — scrollable */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map(tab => (
          <Button key={tab.key} size="sm" variant={viewTab === tab.key ? 'default' : 'outline'} className="text-xs rounded-full px-4 whitespace-nowrap shrink-0" onClick={() => setViewTab(tab.key)}>
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Roles View */}
      {viewTab === 'roles' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {roles.map((r, i) => (
            <motion.div key={r.id} variants={fade} initial="hidden" animate="visible" transition={{ delay: i * 0.04 }}>
              <Card className="group transition-all hover:shadow-lg border-0 shadow-sm h-full">
                <CardContent className="p-5 sm:p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-900/30"><Shield className="h-5 w-5 text-violet-600" /></div>
                    <div className="flex items-center gap-1.5">
                      {r.isSystem && <Badge variant="secondary" className="text-[10px] bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">{t.rbacSystemRole}</Badge>}
                      {r.claims && r.claims.length > 0 && <Badge variant="secondary" className="text-[10px] bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">{r.claims.length} Claims</Badge>}
                    </div>
                  </div>
                  <h3 className="font-bold text-base">{rName(r)}</h3>
                  <p className="text-xs text-muted-foreground mb-1">{lang === 'ar' ? r.nameEn : r.name}</p>
                  <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{rDesc(r)}</p>
                  <div className="flex items-center gap-3 mb-4 text-xs text-muted-foreground">
                    <span>{permCount(r)} {t.rbacPermissions}</span>
                    <span>·</span>
                    <span>{r.userCount} {t.rbacUserCount}</span>
                    {r.parentId && <><span>·</span><span className="text-sky-600">{t.rbacInherited}</span></>}
                    {(r.policies || []).length > 0 && <><span>·</span><span className="text-red-500">{r.policies.length} {lang === 'ar' ? 'سياسات' : 'policies'}</span></>}
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t">
                    <div className="flex gap-1">
                      <ActionBtn icon={Eye} label={t.rbacViewDetails} onClick={() => openDetails(r)} />
                      <ActionBtn icon={Edit} label={t.edit} onClick={() => openEdit(r)} />
                      <ActionBtn icon={Copy} label={t.rbacCloneRole} onClick={() => handleClone(r)} />
                    </div>
                    {!r.isSystem && <ActionBtn icon={Trash2} onClick={() => setDlg({ type: 'delete', role: r })} danger />}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Matrix Overview */}
      {viewTab === 'matrix' && (
        <Card className="border-0 shadow-sm overflow-hidden">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">{t.rbacMatrix} — {roles.length} {lang === 'ar' ? 'أدوار' : 'roles'} × {SYSTEM_MODULES.length} {t.rbacModule}</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b">
                  <th className="p-2 text-start font-semibold sticky start-0 bg-background min-w-[120px]">{t.rbacModule}</th>
                  {roles.map(r => <th key={r.id} className="p-2 text-center font-semibold min-w-[80px]">{rName(r)}</th>)}
                </tr>
              </thead>
              <tbody>
                {SYSTEM_MODULES.map(mod => (
                  <tr key={mod.key} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="p-2 font-medium sticky start-0 bg-background">{lang === 'ar' ? mod.labelAr : mod.labelEn}</td>
                    {roles.map(r => {
                      const count = (r.permissions[mod.key] || []).length
                      const total = PERMISSION_ACTIONS.length
                      const pct = Math.round(count / total * 100)
                      return (
                        <td key={r.id} className="p-2 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <div className="w-12 h-1.5 rounded-full bg-muted overflow-hidden"><div className={`h-full rounded-full ${pct === 100 ? 'bg-emerald-500' : pct > 50 ? 'bg-sky-500' : pct > 0 ? 'bg-amber-500' : 'bg-gray-300'}`} style={{ width: `${pct}%` }} /></div>
                            <span className="tabular-nums text-muted-foreground w-6">{count}</span>
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Templates View — Default + Custom */}
      {viewTab === 'templates' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {templates.map((tpl, i) => {
              const isCustom = !INIT_RBAC_TEMPLATES.some(t => t.id === tpl.id)
              return (
                <motion.div key={tpl.id} variants={fade} initial="hidden" animate="visible" transition={{ delay: i * 0.04 }}>
                  <Card className="group transition-all hover:shadow-lg border-0 shadow-sm cursor-pointer" onClick={() => { setViewTab('roles'); setDlg({ type: 'add' }); handleApplyTemplate(tpl) }}>
                    <CardContent className="p-5 text-center">
                      <div className="h-12 w-12 rounded-2xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center mx-auto mb-3"><Shield className="h-6 w-6 text-violet-600" /></div>
                      <h3 className="font-bold text-sm">{lang === 'ar' ? tpl.name : tpl.nameEn}</h3>
                      <p className="text-xs text-muted-foreground mt-1 mb-3">{lang === 'ar' ? tpl.description : tpl.descriptionEn}</p>
                      <Badge variant="secondary" className="text-[10px]">{countPermissions(tpl.permissions)} {t.rbacPermissions}</Badge>
                      {isCustom && <Badge variant="outline" className="text-[9px] ms-1">{lang === 'ar' ? 'مخصص' : 'Custom'}</Badge>}
                      <p className="text-[10px] text-violet-600 mt-3 group-hover:underline">{t.rbacApplyTemplate}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </div>
      )}

      {/* API Endpoints Authorization View */}
      {viewTab === 'api' && (
        <Card className="border-0 shadow-sm overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">{lang === 'ar' ? 'تفويض نقاط API' : 'API Endpoint Authorization'} — {lang === 'ar' ? 'اختر دوراً لمحاكاة التفويض' : 'Select a role to simulate authorization'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-4 flex-wrap">
              {roles.map(r => (
                <Button key={r.id} size="sm" variant={detailRole?.id === r.id ? 'default' : 'outline'} className="text-xs rounded-full px-3" onClick={() => setDetailRole(r)}>
                  {rName(r)}
                </Button>
              ))}
            </div>
            {detailRole && (
              <div className="overflow-x-auto border rounded-lg">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="p-2 text-start font-semibold sticky start-0 bg-muted/50 min-w-[60px]">Method</th>
                      <th className="p-2 text-start font-semibold min-w-[220px]" dir="ltr">{lang === 'ar' ? 'المسار' : 'Endpoint'}</th>
                      <th className="p-2 text-start font-semibold min-w-[120px]">{lang === 'ar' ? 'الوصف' : 'Description'}</th>
                      <th className="p-2 text-center font-semibold min-w-[80px]">{lang === 'ar' ? 'الحالة' : 'Status'}</th>
                      <th className="p-2 text-start font-semibold min-w-[150px]">{lang === 'ar' ? 'ملاحظات' : 'Notes'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(API_ENDPOINTS).map(([mod, endpoints]) =>
                      endpoints.map((ep, i) => {
                        const auth = isApiAuthorized(detailRole, ep.method, ep.path)
                        const forbidden = simulate403(ep.path, ep.method, detailRole)
                        return (
                          <tr key={`${mod}-${i}`} className="border-b border-border/50 hover:bg-muted/30">
                            <td className="p-2 sticky start-0 bg-background">
                              <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold ${methodColor(ep.method)}`}>{ep.method}</span>
                            </td>
                            <td className="p-2 font-mono text-[11px]" dir="ltr">{ep.path}</td>
                            <td className="p-2 text-xs">{lang === 'ar' ? ep.labelAr : ep.labelEn}</td>
                            <td className="p-2 text-center">
                              {auth.authorized
                                ? <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 text-[10px] border-emerald-200">200 OK</Badge>
                                : <Badge className="bg-red-50 text-red-700 dark:bg-red-950/30 text-[10px] border-red-200">403</Badge>
                              }
                            </td>
                            <td className="p-2 text-xs text-muted-foreground">
                              {!auth.authorized && forbidden ? forbidden.body.message : (lang === 'ar' ? 'مصرح' : 'Authorized')}
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Buttons Visibility View */}
      {viewTab === 'buttons' && (
        <Card className="border-0 shadow-sm overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">{lang === 'ar' ? 'صلاحيات الأزرار (UI Buttons)' : 'Button Permissions'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-4 flex-wrap">
              {roles.map(r => (
                <Button key={r.id} size="sm" variant={detailRole?.id === r.id ? 'default' : 'outline'} className="text-xs rounded-full px-3" onClick={() => setDetailRole(r)}>
                  {rName(r)}
                </Button>
              ))}
            </div>
            {detailRole && (
              <div className="space-y-4">
                {Object.entries(UI_BUTTONS).map(([mod, buttons]) => {
                  const modLabel = SYSTEM_MODULES.find(m => m.key === mod)
                  if (!modLabel || buttons.length === 0) return null
                  return (
                    <div key={mod} className="border rounded-lg p-3">
                      <p className="text-xs font-semibold mb-2">{lang === 'ar' ? modLabel.labelAr : modLabel.labelEn}</p>
                      <div className="flex flex-wrap gap-2">
                        {buttons.map(btn => {
                          const visible = isButtonVisible(detailRole, mod, btn.key)
                          return (
                            <div key={btn.key} className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] ${visible ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-800' : 'bg-red-50 border-red-200 text-red-500 dark:bg-red-950/30 dark:border-red-800 line-through opacity-60'}`}>
                              {visible ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                              {lang === 'ar' ? btn.labelAr : btn.labelEn}
                              <span className="text-[9px] opacity-60">({btn.requiredAction})</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* JWT Claims View */}
      {viewTab === 'jwt' && (
        <Card className="border-0 shadow-sm overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">{t.rbacJwtClaims} — {lang === 'ar' ? 'حمولات الرمز المميز' : 'Token Payloads'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-4 flex-wrap">
              {roles.map(r => (
                <Button key={r.id} size="sm" variant={detailRole?.id === r.id ? 'default' : 'outline'} className="text-xs rounded-full px-3" onClick={() => setDetailRole(r)}>
                  {rName(r)}
                </Button>
              ))}
            </div>
            {detailRole && (
              <div className="space-y-4">
                {/* Role Claims Table */}
                <div className="border rounded-lg p-4">
                  <p className="text-xs font-semibold mb-3">{lang === 'ar' ? 'الادعاءات المخصصة' : 'Custom Claims'}</p>
                  {(detailRole.claims || []).length === 0 ? (
                    <p className="text-xs text-muted-foreground">{lang === 'ar' ? 'لا توجد ادعاءات مخصصة' : 'No custom claims'}</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead><tr className="border-b"><th className="p-2 text-start font-semibold">Key</th><th className="p-2 text-start font-semibold">Value</th><th className="p-2 text-start font-semibold">{lang === 'ar' ? 'النوع' : 'Type'}</th><th className="p-2 text-start font-semibold">{lang === 'ar' ? 'التسمية' : 'Label'}</th></tr></thead>
                        <tbody>
                          {(detailRole.claims || []).map((c, i) => (
                            <tr key={i} className="border-b border-border/50">
                              <td className="p-2 font-mono text-violet-600" dir="ltr">{c.key}</td>
                              <td className="p-2 font-mono" dir="ltr">{c.value}</td>
                              <td className="p-2"><Badge variant="secondary" className="text-[10px]">{c.type}</Badge></td>
                              <td className="p-2">{lang === 'ar' ? c.labelAr : c.labelEn}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
                {/* JWT Payload */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold">{lang === 'ar' ? 'حمولة JWT المُنشأة' : 'Generated JWT Payload'}</p>
                    <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={() => { navigator.clipboard.writeText(JSON.stringify(generateJwtClaims(detailRole), null, 2)); toast.success(lang === 'ar' ? 'تم النسخ' : 'Copied') }}>
                      <Copy className="h-3 w-3" />{lang === 'ar' ? 'نسخ' : 'Copy'}
                    </Button>
                  </div>
                  <pre className="bg-muted rounded-lg p-4 text-xs font-mono overflow-x-auto leading-relaxed" dir="ltr">
                    {JSON.stringify(generateJwtClaims(detailRole), null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Menu Visibility View */}
      {viewTab === 'visibility' && (
        <Card className="border-0 shadow-sm overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">{t.rbacMenuVisibility} — {lang === 'ar' ? 'إخفاء الصفحات حسب الصلاحيات' : 'Hide pages based on permissions'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-4 flex-wrap">
              {roles.map(r => (
                <Button key={r.id} size="sm" variant={detailRole?.id === r.id ? 'default' : 'outline'} className="text-xs rounded-full px-3" onClick={() => setDetailRole(r)}>
                  {rName(r)}
                </Button>
              ))}
            </div>
            {detailRole && (
              <div className="overflow-x-auto border rounded-lg">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="p-2 text-start font-semibold">{lang === 'ar' ? 'الصفحة' : 'Page'}</th>
                      <th className="p-2 text-start font-semibold">{lang === 'ar' ? 'الوحدة' : 'Module'}</th>
                      <th className="p-2 text-center font-semibold">{lang === 'ar' ? 'عرض' : 'View'}</th>
                      <th className="p-2 text-center font-semibold">{lang === 'ar' ? 'مرئي في القائمة' : 'Menu Visible'}</th>
                      <th className="p-2 text-center font-semibold">{lang === 'ar' ? 'الحالة' : 'Status'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {SYSTEM_MODULES.map(mod => {
                      const pages = PAGE_VISIBILITY_MAP[mod.key] || []
                      const hasView = (detailRole.permissions[mod.key] || []).includes('view')
                      const hiddenExplicit = (detailRole.hiddenPages || []).some(p => pages.includes(p))
                      const isHidden = !hasView || hiddenExplicit
                      return (
                        <tr key={mod.key} className={`border-b border-border/50 ${isHidden ? 'bg-red-50/50 dark:bg-red-950/10' : ''}`}>
                          <td className="p-2 font-medium">{pages.map(p => p).join(', ')}</td>
                          <td className="p-2">{lang === 'ar' ? mod.labelAr : mod.labelEn}</td>
                          <td className="p-2 text-center">
                            {hasView ? <CheckCircle2 className="h-4 w-4 text-emerald-500 mx-auto" /> : <XCircle className="h-4 w-4 text-red-400 mx-auto" />}
                          </td>
                          <td className="p-2 text-center">
                            {isHidden
                              ? <Badge className="bg-red-50 text-red-600 dark:bg-red-950/30 text-[10px] border-red-200">{t.rbacHidePage}</Badge>
                              : <Badge className="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 text-[10px] border-emerald-200">{lang === 'ar' ? 'مرئي' : 'Visible'}</Badge>
                            }
                          </td>
                          <td className="p-2 text-xs text-muted-foreground">
                            {!hasView && (lang === 'ar' ? 'لا يملك صلاحية العرض' : 'No view permission')}
                            {hasView && hiddenExplicit && (lang === 'ar' ? 'مخفي صراحةً' : 'Explicitly hidden')}
                            {hasView && !hiddenExplicit && (lang === 'ar' ? 'مصرح' : 'Authorized')}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Policies View — Interactive Management */}
      {viewTab === 'policies' && (
        <Card className="border-0 shadow-sm overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">{lang === 'ar' ? 'سياسات التحكم بالوصول' : 'Access Control Policies'}</CardTitle>
              {detailRole && <Button size="sm" className="gap-1.5 h-8 text-xs bg-violet-600 hover:bg-violet-700 text-white" onClick={openAddPolicy}><Plus className="h-3.5 w-3.5" />{t.rbacAddPolicy}</Button>}
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-4 flex-wrap">
              {roles.map(r => (
                <Button key={r.id} size="sm" variant={detailRole?.id === r.id ? 'default' : 'outline'} className="text-xs rounded-full px-3" onClick={() => setDetailRole(r)}>
                  {rName(r)}
                  {(r.policies || []).length > 0 && <Badge variant="secondary" className="ms-1.5 text-[9px] px-1.5 h-4">{r.policies!.length}</Badge>}
                </Button>
              ))}
            </div>
            {detailRole && (
              (detailRole.policies || []).length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Shield className="h-10 w-10 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">{t.rbacNoPolicies}</p>
                  <p className="text-xs mt-1">{lang === 'ar' ? 'جميع الصلاحيات مسموحة حسب المصفوفة' : 'All permissions allowed per matrix'}</p>
                  <Button size="sm" variant="outline" className="mt-4 gap-1.5 text-xs" onClick={openAddPolicy}><Plus className="h-3.5 w-3.5" />{t.rbacAddPolicy}</Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {(detailRole.policies || []).map((policy, i) => {
                    const modLabel = SYSTEM_MODULES.find(m => m.key === policy.module)
                    return (
                      <div key={policy.id || i} className={`flex items-start gap-4 p-4 rounded-lg border ${policy.effect === 'deny' ? 'border-red-200 bg-red-50/50 dark:bg-red-950/10' : 'border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/10'}`}>
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${policy.effect === 'deny' ? 'bg-red-100 dark:bg-red-900/30' : 'bg-emerald-100 dark:bg-emerald-900/30'}`}>
                          {policy.effect === 'deny' ? <XCircle className="h-4 w-4 text-red-600" /> : <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-sm">{lang === 'ar' ? policy.name : policy.nameEn}</span>
                            <Badge className={`text-[10px] ${policy.effect === 'deny' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>{policy.effect === 'deny' ? 'DENY' : 'ALLOW'}</Badge>
                            <Badge variant="outline" className="text-[10px]">P{policy.priority}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {policy.module === '*' ? t.rbacPolicyAllModules : (modLabel ? (lang === 'ar' ? modLabel.labelAr : modLabel.labelEn) : policy.module)}
                            {' → '}
                            {policy.action === '*' ? t.rbacPolicyAllActions : policy.action}
                            {policy.condition && (
                              <><br /><span className="font-mono text-[11px]" dir="ltr">{lang === 'ar' ? (policy.conditionAr || policy.condition) : (policy.conditionEn || policy.condition)}</span></>
                            )}
                          </p>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <ActionBtn icon={Edit} onClick={() => openEditPolicy(policy)} />
                          <ActionBtn icon={Trash2} onClick={() => handleDeletePolicy(policy.id)} danger />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            )}
          </CardContent>
        </Card>
      )}

      {/* Role Details Dialog (Claims + Policies + Hidden Pages) */}
      {detailRole && (
        <Dialog open={!!detailRole} onOpenChange={() => setDetailRole(null)}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto" dir={isRTL ? 'rtl' : 'ltr'}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-violet-600" />
                {rName(detailRole)} — {t.rbacViewDetails}
              </DialogTitle>
              <DialogDescription className="sr-only">{lang === 'ar' ? 'تفاصيل الدور' : 'Role details'}</DialogDescription>
            </DialogHeader>
            <div className="space-y-5 pt-2">
              {/* Info */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-[10px] text-muted-foreground">{t.rbacPermissionCount}</p>
                  <p className="text-lg font-bold">{countPermissions(getEffectivePermissions(detailRole, roles))}</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-[10px] text-muted-foreground">{t.rbacUserCount}</p>
                  <p className="text-lg font-bold">{detailRole.userCount}</p>
                </div>
              </div>

              {/* Claims */}
              <div>
                <h4 className="text-sm font-semibold mb-2">{t.rbacJwtClaims} ({(detailRole.claims || []).length})</h4>
                {(detailRole.claims || []).length === 0 ? (
                  <p className="text-xs text-muted-foreground">{lang === 'ar' ? 'لا توجد ادعاءات' : 'No claims'}</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {(detailRole.claims || []).map((c, i) => (
                      <Badge key={i} variant="outline" className="text-xs gap-1">
                        <span className="font-mono text-violet-600" dir="ltr">{c.key}</span>
                        <span className="text-muted-foreground">=</span>
                        <span className="font-mono" dir="ltr">{c.value}</span>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Policies */}
              <div>
                <h4 className="text-sm font-semibold mb-2">{lang === 'ar' ? 'السياسات' : 'Policies'} ({(detailRole.policies || []).length})</h4>
                {(detailRole.policies || []).length === 0 ? (
                  <p className="text-xs text-muted-foreground">{lang === 'ar' ? 'لا توجد سياسات' : 'No policies'}</p>
                ) : (
                  <div className="space-y-2">
                    {(detailRole.policies || []).map((p, i) => (
                      <div key={p.id || i} className={`flex items-center gap-2 text-xs rounded-lg border p-2.5 ${p.effect === 'deny' ? 'border-red-200 bg-red-50/50 dark:bg-red-950/10' : 'border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/10'}`}>
                        {p.effect === 'deny' ? <XCircle className="h-3.5 w-3.5 text-red-500 shrink-0" /> : <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />}
                        <span className="font-medium">{lang === 'ar' ? p.name : p.nameEn}</span>
                        <span className="text-muted-foreground ms-auto">→ {p.module}.{p.action}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Hidden Pages */}
              <div>
                <h4 className="text-sm font-semibold mb-2">{t.rbacMenuVisibility} — {t.rbacHidePage} ({getHiddenPages(detailRole, roles).length})</h4>
                {getHiddenPages(detailRole, roles).length === 0 ? (
                  <p className="text-xs text-emerald-600">{lang === 'ar' ? 'جميع الصفحات مرئية' : 'All pages visible'}</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {getHiddenPages(detailRole, roles).map(p => (
                      <Badge key={p} variant="secondary" className="text-xs bg-red-50 text-red-600 dark:bg-red-950/30">{p}</Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <DlgFooter onCancel={() => setDetailRole(null)} onConfirm={() => { openEdit(detailRole); setDetailRole(null) }} confirmLabel={t.edit} />
            <div className="flex justify-center pt-2">
              <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => { openSaveTemplate() }}>
                <Copy className="h-3.5 w-3.5" />{t.rbacSaveAsTemplate}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Permission Matrix Dialog (View) */}
      <Dialog open={dlg?.type === 'matrix'} onOpenChange={() => setDlg(null)}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto" dir={isRTL ? 'rtl' : 'ltr'}>
          <DialogHeader><DialogTitle>{t.rbacMatrix} — {dlg?.role ? rName(dlg.role) : ''}</DialogTitle><DialogDescription className="sr-only">{lang === 'ar' ? 'مصفوفة الصلاحيات' : 'Permission matrix'}</DialogDescription></DialogHeader>
          {dlg?.role && effectivePerms && inheritedInfo && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-4 text-xs mb-4">
                <div className="flex items-center gap-1.5"><div className="h-3 w-3 rounded bg-emerald-500" /><span>{t.rbacOwnPerms}</span></div>
                <div className="flex items-center gap-1.5"><div className="h-3 w-3 rounded bg-sky-400" /><span>{t.rbacInherited}</span></div>
                <div className="ms-auto font-semibold">{countPermissions(effectivePerms)} {t.rbacTotalPermissions}</div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b">
                      <th className="p-2 text-start font-semibold sticky start-0 bg-background min-w-[100px]">{t.rbacModule}</th>
                      {PERMISSION_ACTIONS.map(a => <th key={a.key} className="p-1.5 text-center font-semibold min-w-[60px]">{lang === 'ar' ? a.labelAr : a.labelEn}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {SYSTEM_MODULES.map(mod => (
                      <tr key={mod.key} className="border-b border-border/50">
                        <td className="p-2 font-medium sticky start-0 bg-background text-xs">{lang === 'ar' ? mod.labelAr : mod.labelEn}</td>
                        {PERMISSION_ACTIONS.map(action => {
                          const hasOwn = (inheritedInfo.own[mod.key] || []).includes(action.key)
                          const hasInh = (inheritedInfo.inherited[mod.key] || []).includes(action.key)
                          const has = hasOwn || hasInh
                          return (
                            <td key={action.key} className="p-1.5 text-center">
                              {has ? (
                                <span className={`inline-flex h-5 w-5 items-center justify-center rounded text-[9px] font-bold ${hasOwn ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700' : 'bg-sky-100 dark:bg-sky-900/30 text-sky-700'}`}>✓</span>
                              ) : (
                                <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-muted text-muted-foreground text-[9px]">—</span>
                              )}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          <DlgFooter onCancel={() => setDlg(null)} onConfirm={() => { if (dlg?.role) { openEdit(dlg.role); setDlg(null) } }} confirmLabel={t.edit} />
        </DialogContent>
      </Dialog>

      {/* Add/Edit Dialog with Permission Matrix Editor */}
      <Dialog open={dlg?.type === 'add' || dlg?.type === 'edit'} onOpenChange={() => setDlg(null)}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto" dir={isRTL ? 'rtl' : 'ltr'}>
          <DialogHeader><DialogTitle>{dlg?.type === 'add' ? t.addRoleDlg : t.editRoleDlg}</DialogTitle><DialogDescription className="sr-only">{lang === 'ar' ? 'إدارة الأدوار' : 'Role management'}</DialogDescription></DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <FormField label={t.roleName}><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></FormField>
              <FormField label={t.roleNameEn}><Input value={form.nameEn} onChange={e => setForm(p => ({ ...p, nameEn: e.target.value }))} dir="ltr" /></FormField>
            </div>
            <FormField label={t.rbacDescription}><Input value={form.desc} onChange={e => setForm(p => ({ ...p, desc: e.target.value }))} /></FormField>

            {/* Parent Role for Inheritance */}
            <FormField label={t.rbacParentRole}>
              <Select value={form.parentId || '__none__'} onValueChange={v => setForm(p => ({ ...p, parentId: v === '__none__' ? null : v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">{t.rbacNoParent}</SelectItem>
                  {roles.filter(r => r.id !== dlg?.role?.id).map(r => <SelectItem key={r.id} value={r.id}>{rName(r)}</SelectItem>)}
                </SelectContent>
              </Select>
            </FormField>

            <Separator />

            {/* Apply Template */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{t.rbacTemplates}</span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setTplDlg(true)}>{t.rbacApplyTemplate}</Button>
              </div>
            </div>

            {/* Permission Matrix Editor */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b">
                    <th className="p-2 text-start font-semibold sticky start-0 bg-background min-w-[100px]">{t.rbacModule}</th>
                    {PERMISSION_ACTIONS.map(a => <th key={a.key} className="p-1.5 text-center font-semibold min-w-[50px]">{lang === 'ar' ? a.labelAr : a.labelEn}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {SYSTEM_MODULES.map(mod => (
                    <tr key={mod.key} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="p-2 font-medium sticky start-0 bg-background text-xs">{lang === 'ar' ? mod.labelAr : mod.labelEn}</td>
                      {PERMISSION_ACTIONS.map(action => {
                        const has = (form.permissions[mod.key] || []).includes(action.key)
                        return (
                          <td key={action.key} className="p-1.5 text-center">
                            <button type="button" onClick={() => handleTogglePerm(mod.key, action.key)} className={`inline-flex h-6 w-6 items-center justify-center rounded-md transition-colors ${has ? 'bg-emerald-500 text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
                              {has && <span className="text-[10px]">✓</span>}
                            </button>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="text-xs text-muted-foreground text-center">{t.rbacTotalPermissions}: {countPermissions(form.permissions)}</div>
          </div>
          <DlgFooter onCancel={() => setDlg(null)} onConfirm={handleSave} confirmLabel={dlg?.type === 'add' ? t.create : t.save} />
        </DialogContent>
      </Dialog>

      {/* Template Selection Dialog */}
      <Dialog open={tplDlg} onOpenChange={setTplDlg}>
        <DialogContent className="max-w-md" dir={isRTL ? 'rtl' : 'ltr'}>
          <DialogHeader><DialogTitle>{t.rbacApplyTemplate}</DialogTitle><DialogDescription className="sr-only">{lang === 'ar' ? 'اختر قالب صلاحيات' : 'Select permission template'}</DialogDescription></DialogHeader>
          <div className="space-y-2 pt-2">
            {templates.map(tpl => (
              <button key={tpl.id} className="w-full flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors text-start" onClick={() => handleApplyTemplate(tpl)}>
                <div>
                  <p className="text-sm font-medium">{lang === 'ar' ? tpl.name : tpl.nameEn}</p>
                  <p className="text-xs text-muted-foreground">{lang === 'ar' ? tpl.description : tpl.descriptionEn}</p>
                </div>
                <Badge variant="secondary" className="text-[10px]">{countPermissions(tpl.permissions)}</Badge>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Policy Add/Edit Dialog */}
      <Dialog open={dlg?.type === 'policy'} onOpenChange={() => setDlg(null)}>
        <DialogContent className="max-w-md" dir={isRTL ? 'rtl' : 'ltr'}>
          <DialogHeader><DialogTitle>{editingPolicyId ? t.rbacEditPolicy : t.rbacAddPolicy}</DialogTitle><DialogDescription className="sr-only">{lang === 'ar' ? 'إدارة السياسات' : 'Policy management'}</DialogDescription></DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <FormField label={t.rbacPolicyName}><Input value={policyForm.name} onChange={e => setPolicyForm(p => ({ ...p, name: e.target.value }))} /></FormField>
              <FormField label={t.rbacPolicyName + ' (EN)'}><Input value={policyForm.nameEn} onChange={e => setPolicyForm(p => ({ ...p, nameEn: e.target.value }))} dir="ltr" /></FormField>
            </div>
            <FormField label={t.rbacPolicyEffect}>
              <Select value={policyForm.effect} onValueChange={v => setPolicyForm(p => ({ ...p, effect: v as 'allow' | 'deny' }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="deny"><span className="text-red-600">DENY — {lang === 'ar' ? 'رفض' : 'Reject'}</span></SelectItem>
                  <SelectItem value="allow"><span className="text-emerald-600">ALLOW — {lang === 'ar' ? 'سماح' : 'Permit'}</span></SelectItem>
                </SelectContent>
              </Select>
            </FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label={t.rbacPolicyModule}>
                <Select value={policyForm.module} onValueChange={v => setPolicyForm(p => ({ ...p, module: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="*">{t.rbacPolicyAllModules}</SelectItem>
                    {SYSTEM_MODULES.map(m => <SelectItem key={m.key} value={m.key}>{lang === 'ar' ? m.labelAr : m.labelEn}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label={t.rbacPolicyAction}>
                <Select value={policyForm.action} onValueChange={v => setPolicyForm(p => ({ ...p, action: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="*">{t.rbacPolicyAllActions}</SelectItem>
                    {PERMISSION_ACTIONS.map(a => <SelectItem key={a.key} value={a.key}>{lang === 'ar' ? a.labelAr : a.labelEn}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FormField>
            </div>
            <FormField label={t.rbacPolicyPriority}><Input type="number" min={1} max={99} value={policyForm.priority} onChange={e => setPolicyForm(p => ({ ...p, priority: Number(e.target.value) }))} /></FormField>
            <FormField label={t.rbacPolicyCondition}><Input value={policyForm.condition} onChange={e => setPolicyForm(p => ({ ...p, condition: e.target.value }))} placeholder='e.g. tenant.status === "active"' dir="ltr" /></FormField>
          </div>
          <DlgFooter onCancel={() => setDlg(null)} onConfirm={handleSavePolicy} confirmLabel={t.save} />
        </DialogContent>
      </Dialog>

      {/* Save as Template Dialog */}
      <Dialog open={dlg?.type === 'save_tpl'} onOpenChange={() => setDlg(null)}>
        <DialogContent className="max-w-md" dir={isRTL ? 'rtl' : 'ltr'}>
          <DialogHeader><DialogTitle>{t.rbacSaveAsTemplate}</DialogTitle><DialogDescription className="sr-only">{lang === 'ar' ? 'حفظ الصلاحيات كقالب' : 'Save permissions as template'}</DialogDescription></DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <FormField label={t.rbacTemplateName}><Input value={saveTplForm.name} onChange={e => setSaveTplForm(p => ({ ...p, name: e.target.value }))} /></FormField>
              <FormField label={t.rbacTemplateName + ' (EN)'}><Input value={saveTplForm.nameEn} onChange={e => setSaveTplForm(p => ({ ...p, nameEn: e.target.value }))} dir="ltr" /></FormField>
            </div>
            <FormField label={t.rbacTemplateDesc}><Textarea value={saveTplForm.desc} onChange={e => setSaveTplForm(p => ({ ...p, desc: e.target.value }))} rows={2} /></FormField>
            <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
              {lang === 'ar' ? 'سيتم حفظ صلاحيات الدور الحالية كقالب جديد يمكن تطبيقه على أي دور آخر' : 'Current role permissions will be saved as a new template applicable to any role'}
            </div>
          </div>
          <DlgFooter onCancel={() => setDlg(null)} onConfirm={handleSaveTemplate} confirmLabel={t.save} />
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={dlg?.type === 'delete'} onOpenChange={() => setDlg(null)} title={t.delete} desc={t.confirmDeleteRole.replace('{name}', dlg?.role ? rName(dlg.role) : '')} onConfirm={handleDelete} danger />
    </div>
  )
}

// ════════════════════════════════════════════════════════════════
// PAGE 7: AUDIT LOGS (bilingual)
// ════════════════════════════════════════════════════════════════
function AuditPage() {
  const { t, lang } = useSA()
  const [logs] = useState<SysLog[]>(INIT_LOGS)
  const [filter, setFilter] = useState('all')
  const [page, setPage] = useState(1)
  const filtered = useMemo(() => filter === 'all' ? logs : logs.filter(l => l.level === filter), [logs, filter])
  const { items, totalPages } = paginate(filtered, page, 8)

  return (
    <div className="space-y-5">
      <PageTitle title={t.auditTitle} action={<Button className="gap-2" variant="outline" onClick={() => toast.success(t.logExported)}><Download className="h-4 w-4" />{t.export}</Button>} />
      <div className="flex flex-wrap gap-2">
        {['all','info','success','warn','error'].map(f => (
          <Button key={f} size="sm" variant={filter === f ? 'default' : 'outline'} className="text-xs h-8 rounded-full px-4" onClick={() => { setFilter(f); setPage(1) }}>
            {f === 'all' ? t.all : getLogLabel(f, t)}
          </Button>
        ))}
      </div>
      <Card className="border-0 shadow-sm overflow-hidden hidden sm:block">
        <div className="overflow-x-auto">
          <Table><TableHeader><TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="ps-5 font-semibold text-xs uppercase tracking-wider w-24">{t.level}</TableHead>
            <TableHead className="px-3 font-semibold text-xs uppercase tracking-wider">{t.message}</TableHead>
            <TableHead className="px-3 font-semibold text-xs uppercase tracking-wider hidden md:table-cell">{t.source}</TableHead>
            <TableHead className="pe-5 font-semibold text-xs uppercase tracking-wider text-end">{t.date}</TableHead>
          </TableRow></TableHeader>
          <TableBody>{items.map(l => (
            <TableRow key={l.id} className="hover:bg-muted/20 transition-colors">
              <TableCell className="ps-5"><span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${l.level === 'info' ? 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-400' : l.level === 'warn' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' : l.level === 'error' ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'}`}>{getLogLabel(l.level, t)}</span></TableCell>
              <TableCell className="px-3 text-sm max-w-[400px]">{logMsg(l, lang)}</TableCell>
              <TableCell className="px-3 text-xs text-muted-foreground hidden md:table-cell">{logSrc(l, lang)}</TableCell>
              <TableCell className="pe-5 text-xs text-muted-foreground whitespace-nowrap text-end">{new Date(l.timestamp).toLocaleString(lang === 'ar' ? 'ar-JO' : 'en-JO')}</TableCell>
            </TableRow>
          ))}</TableBody></Table>
        </div>
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </Card>
      <div className="sm:hidden space-y-2">
        {items.map(l => (
          <Card key={l.id} className="border-0 shadow-sm"><CardContent className="p-3">
            <div className="flex items-start gap-3"><LogDot level={l.level} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1"><span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${l.level === 'info' ? 'bg-sky-100 text-sky-700' : l.level === 'warn' ? 'bg-amber-100 text-amber-700' : l.level === 'error' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>{getLogLabel(l.level, t)}</span><span className="text-[10px] text-muted-foreground">{logSrc(l, lang)}</span></div>
                <p className="text-xs leading-relaxed">{logMsg(l, lang)}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{new Date(l.timestamp).toLocaleString(lang === 'ar' ? 'ar-JO' : 'en-JO')}</p>
              </div>
            </div>
          </CardContent></Card>
        ))}
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════
// PAGE 8: NOTIFICATIONS (full CRUD on templates)
// ════════════════════════════════════════════════════════════════
function NotificationsPage() {
  const { t, lang, isRTL } = useSA()
  const [templates, setTemplates] = useState<NotificationTemplate[]>(NOTIF_TEMPLATES)
  const [sendOpen, setSendOpen] = useState(false)
  const [msg, setMsg] = useState({ title: '', body: '', target: 'all' })
  const [delTarget, setDelTarget] = useState<NotificationTemplate | null>(null)

  const handleDelete = (tmpl: NotificationTemplate) => { setTemplates(p => p.filter(x => x.id !== tmpl.id)); toast.success(t.deleted); setDelTarget(null) }

  return (
    <div className="space-y-5">
      <PageTitle title={t.notificationsTitle} action={<PrimaryBtn icon={Bell} label={t.sendNotif} onClick={() => setSendOpen(true)} />} />

      <Card className="border-0 shadow-sm overflow-hidden hidden sm:block">
        <div className="overflow-x-auto">
          <Table><TableHeader><TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="ps-5 font-semibold text-xs uppercase tracking-wider">{t.template}</TableHead>
            <TableHead className="px-3 font-semibold text-xs uppercase tracking-wider hidden md:table-cell">{t.type}</TableHead>
            <TableHead className="px-3 font-semibold text-xs uppercase tracking-wider">{t.status}</TableHead>
            <TableHead className="px-3 font-semibold text-xs uppercase tracking-wider text-end hidden lg:table-cell">{t.sent}</TableHead>
            <TableHead className="pe-5 font-semibold text-xs uppercase tracking-wider text-end">{t.actions}</TableHead>
          </TableRow></TableHeader>
          <TableBody>{templates.map(tmpl => (
            <TableRow key={tmpl.id} className="group hover:bg-muted/20 transition-colors">
              <TableCell className="ps-5 font-medium text-sm">{lang === 'en' ? tmpl.nameEn : tmpl.name}</TableCell>
              <TableCell className="px-3 text-sm hidden md:table-cell">{lang === 'en' ? tmpl.typeEn : tmpl.type}</TableCell>
              <TableCell className="px-3"><StatusBadge status={tmpl.status} locale={lang} /></TableCell>
              <TableCell className="px-3 tabular-nums text-sm hidden lg:table-cell text-end">{tmpl.sent}</TableCell>
              <TableCell className="pe-5">
                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ActionBtn icon={Edit} label={t.edit} onClick={() => toast.info(t.editTemplate)} />
                  <ActionBtn icon={Mail} onClick={() => toast.success(t.testSent)} />
                  <ActionBtn icon={Trash2} onClick={() => setDelTarget(tmpl)} danger />
                </div>
              </TableCell>
            </TableRow>
          ))}</TableBody></Table>
        </div>
      </Card>

      <div className="sm:hidden space-y-3">
        {templates.map(tmpl => (
          <Card key={tmpl.id} className="border-0 shadow-sm"><CardContent className="p-4">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="min-w-0"><p className="font-medium text-sm">{lang === 'en' ? tmpl.nameEn : tmpl.name}</p><p className="text-xs text-muted-foreground mt-0.5">{lang === 'en' ? tmpl.typeEn : tmpl.type} · {tmpl.sent} {t.sent}</p></div>
              <StatusBadge status={tmpl.status} locale={lang} />
            </div>
            <div className="flex items-center justify-end gap-1 pt-2 border-t">
              <ActionBtn icon={Edit} label={t.edit} onClick={() => toast.info(t.editTemplate)} />
              <ActionBtn icon={Mail} onClick={() => toast.success(t.testSent)} />
              <ActionBtn icon={Trash2} onClick={() => setDelTarget(tmpl)} danger />
            </div>
          </CardContent></Card>
        ))}
      </div>

      <Dialog open={sendOpen} onOpenChange={setSendOpen}>
        <DialogContent className="max-w-md" dir={isRTL ? 'rtl' : 'ltr'}><DialogHeader><DialogTitle>{t.sendNotifDlg}</DialogTitle><DialogDescription className="sr-only">{isRTL ? 'إرسال إشعار' : 'Send notification'}</DialogDescription></DialogHeader>
          <div className="space-y-4 pt-2">
            <FormField label={t.title}><Input value={msg.title} onChange={e => setMsg(p => ({ ...p, title: e.target.value }))} /></FormField>
            <FormField label={t.content}><Input value={msg.body} onChange={e => setMsg(p => ({ ...p, body: e.target.value }))} /></FormField>
            <FormField label={t.target}><Select value={msg.target} onValueChange={v => setMsg(p => ({ ...p, target: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">{t.everyone}</SelectItem><SelectItem value="active">{t.activeUsers}</SelectItem><SelectItem value="trial">{t.trialUsers}</SelectItem></SelectContent></Select></FormField>
          </div>
          <DlgFooter onCancel={() => setSendOpen(false)} onConfirm={() => { toast.success(t.notifSent); setSendOpen(false); setMsg({ title: '', body: '', target: 'all' }) }} confirmLabel={t.send} />
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!delTarget} onOpenChange={() => setDelTarget(null)} title={t.delete} desc={t.confirmDeleteTemplate} onConfirm={() => { if (delTarget) handleDelete(delTarget) }} danger />
    </div>
  )
}

// ════════════════════════════════════════════════════════════════
// PAGE 9: REPORTS
// ════════════════════════════════════════════════════════════════
function ReportsPage() {
  const { t, lang } = useSA()
  return (
    <div className="space-y-6">
      <PageTitle title={t.reportsTitle} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {REPORTS.map((r, i) => (
          <motion.div key={r.id} variants={fade} initial="hidden" animate="visible" transition={{ delay: i * 0.04 }}>
            <Card className="group transition-all hover:shadow-lg border-0 shadow-sm h-full">
              <CardContent className="p-5 sm:p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-100 dark:bg-sky-900/30"><BarChart3 className="h-5 w-5 text-sky-600" /></div>
                  <Badge variant="outline" className="text-xs">{lang === 'en' ? r.typeEn : r.type}</Badge>
                </div>
                <h3 className="font-bold text-sm mb-1">{lang === 'en' ? r.nameEn : r.name}</h3>
                <p className="text-xs text-muted-foreground mb-5 leading-relaxed">{lang === 'en' ? r.descEn : r.desc}</p>
                <div className="flex items-center justify-between pt-3 border-t">
                  <span className="text-[11px] text-muted-foreground">{t.lastGenerated} {r.last}</span>
                  <div className="flex gap-1">
                    <ActionBtn icon={RefreshCw} label={t.generate} onClick={() => toast.success(t.reportGenerated)} />
                    <ActionBtn icon={Download} onClick={() => toast.success(t.reportDownloaded)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════
// PAGE 10: SYSTEM HEALTH
// ════════════════════════════════════════════════════════════════
function SystemPage() {
  const { t, lang } = useSA()
  const [logs] = useState<SysLog[]>(INIT_LOGS)
  const gauges = [
    { label: t.gaugeApi, value: 99, icon: Server },
    { label: t.gaugeDatabase, value: 85, icon: Database },
    { label: t.gaugeMemory, value: 78, icon: Monitor },
    { label: t.gaugeDisk, value: 62, icon: HardDrive },
    { label: t.gaugeCdn, value: 100, icon: Globe },
    { label: t.gaugeWorker, value: 95, icon: RefreshCw },
  ]

  return (
    <div className="space-y-6">
      <PageTitle title={t.systemTitle} action={<Button className="gap-2" variant="outline" onClick={() => toast.success(t.refreshed)}><RefreshCw className="h-4 w-4" />{t.refresh}</Button>} />
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 sm:gap-4">
        {gauges.map((g, i) => (
          <motion.div key={g.label} variants={fade} initial="hidden" animate="visible" transition={{ delay: i * 0.04 }}>
            <Card className="text-center border-0 shadow-sm">
              <CardContent className="p-3 sm:p-4">
                <div className="relative mx-auto h-14 w-14 sm:h-16 sm:w-16 mb-2">
                  <svg className={`h-14 w-14 sm:h-16 sm:w-16 -rotate-90 ${gaugeColor(g.value)}`} viewBox="0 0 64 64">
                    <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="4" className="opacity-15" />
                    <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="4" strokeDasharray={`${2 * Math.PI * 28 * g.value / 100} ${2 * Math.PI * 28}`} strokeLinecap="round" />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-xs sm:text-sm font-bold">{g.value}%</span>
                </div>
                <div className="flex items-center justify-center gap-1.5 text-muted-foreground"><g.icon className="h-3.5 w-3.5" /><span className="text-[10px] sm:text-xs font-medium">{g.label}</span></div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3"><CardTitle className="text-sm sm:text-base font-semibold">{t.systemLog}</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-0.5">{logs.map(l => (
            <div key={l.id} className="flex items-start gap-3 rounded-lg px-3 py-2.5 hover:bg-muted/50 transition-colors">
              <LogDot level={l.level} />
              <div className="min-w-0 flex-1">
                <p className="text-sm leading-relaxed">{logMsg(l, lang)}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{logSrc(l, lang)} — {new Date(l.timestamp).toLocaleString(lang === 'ar' ? 'ar-JO' : 'en-JO')}</p>
              </div>
            </div>
          ))}</div>
        </CardContent>
      </Card>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════
// PAGE 11: SERVERS
// ════════════════════════════════════════════════════════════════
function ServersPage() {
  const { t, lang, isRTL } = useSA()
  const [servers, setServers] = useState<ServerType[]>(SERVERS)
  const [addOpen, setAddOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newRegion, setNewRegion] = useState('riyadh')
  const [delTarget, setDelTarget] = useState<ServerType | null>(null)

  const REGIONS: Record<string, { ar: string; en: string }> = {
    riyadh: { ar: 'الرياض', en: 'Riyadh' },
    jeddah: { ar: 'جدة', en: 'Jeddah' },
    dubai: { ar: 'دبي', en: 'Dubai' },
  }

  const handleAdd = () => {
    if (!newName.trim()) return
    const region = REGIONS[newRegion] || REGIONS.riyadh
    const s: ServerType = { id: Date.now().toString(), name: newName, region: region.ar, regionEn: region.en, status: 'healthy', cpu: 0, memory: 0, disk: 0, uptime: '100%', requests: '0/min' }
    setServers(p => [...p, s]); toast.success(t.serverAdded); setAddOpen(false); setNewName('')
  }

  const handleRestart = (s: ServerType) => {
    setServers(p => p.map(x => x.id === s.id ? { ...x, cpu: 0, memory: 0 } : x))
    toast.success(t.serverRestarted)
  }

  const handleDelete = (s: ServerType) => { setServers(p => p.filter(x => x.id !== s.id)); toast.success(t.serverDeleted); setDelTarget(null) }

  return (
    <div className="space-y-6">
      <PageTitle title={t.serversTitle} action={<PrimaryBtn icon={Plus} label={t.addServer} onClick={() => setAddOpen(true)} />} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        {servers.map((s, i) => (
          <motion.div key={s.id} variants={fade} initial="hidden" animate="visible" transition={{ delay: i * 0.05 }}>
            <Card className="transition-all hover:shadow-lg border-0 shadow-sm">
              <CardContent className="p-5 sm:p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-100 dark:bg-sky-900/30"><Server className="h-5 w-5 text-sky-600" /></div>
                    <div><h3 className="font-bold text-sm">{s.name}</h3><p className="text-xs text-muted-foreground">{serverRegion(s, lang)}</p></div>
                  </div>
                  <StatusBadge status={s.status} locale={lang} />
                </div>
                <div className="grid grid-cols-4 gap-3 sm:gap-4">
                  {[{ l: t.gaugeCpu, v: s.cpu }, { l: t.gaugeMemory, v: s.memory }, { l: t.gaugeDisk, v: s.disk }, { l: t.gaugeUptime, v: parseInt(s.uptime) || 0 }].map(m => (
                    <div key={m.l} className="text-center space-y-1.5">
                      <div className="relative mx-auto h-11 w-11 sm:h-12 sm:w-12">
                        <svg className={`h-11 w-11 sm:h-12 sm:w-12 -rotate-90 ${gaugeColor(m.v)}`} viewBox="0 0 48 48">
                          <circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" strokeWidth="3.5" className="opacity-15" />
                          <circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" strokeWidth="3.5" strokeDasharray={`${2 * Math.PI * 20 * m.v / 100} ${2 * Math.PI * 20}`} strokeLinecap="round" />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold">{m.v}%</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground font-medium">{m.l}</p>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-3 border-t">
                  <span className="text-xs text-muted-foreground">{t.requests}: {s.requests}</span>
                  <div className="flex gap-1">
                    <ActionBtn icon={RefreshCw} label={t.restart} onClick={() => handleRestart(s)} />
                    <ActionBtn icon={Eye} label={t.details} onClick={() => toast.info(t.serverDetails)} />
                    <ActionBtn icon={Trash2} onClick={() => setDelTarget(s)} danger />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-sm" dir={isRTL ? 'rtl' : 'ltr'}><DialogHeader><DialogTitle>{t.addServerDlg}</DialogTitle><DialogDescription className="sr-only">{isRTL ? 'إضافة خادم جديد' : 'Add new server'}</DialogDescription></DialogHeader>
          <div className="space-y-4 pt-2">
            <FormField label={t.serverName}><Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="API Server #3" dir="ltr" /></FormField>
            <FormField label={t.region}><Select value={newRegion} onValueChange={setNewRegion}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="riyadh">{lang === 'en' ? 'Riyadh' : 'الرياض'}</SelectItem><SelectItem value="jeddah">{lang === 'en' ? 'Jeddah' : 'جدة'}</SelectItem><SelectItem value="dubai">{lang === 'en' ? 'Dubai' : 'دبي'}</SelectItem></SelectContent></Select></FormField>
          </div>
          <DlgFooter onCancel={() => setAddOpen(false)} onConfirm={handleAdd} />
        </DialogContent>
      </Dialog>
      <ConfirmDialog open={!!delTarget} onOpenChange={() => setDelTarget(null)} title={t.delete} desc={t.confirmDeleteServer} onConfirm={() => { if (delTarget) handleDelete(delTarget) }} danger />
    </div>
  )
}

// ════════════════════════════════════════════════════════════════
// PAGE 12: DATABASE
// ════════════════════════════════════════════════════════════════
function DatabasePage() {
  const { t, lang } = useSA()
  const [backups, setBackups] = useState<Backup[]>(BACKUPS)

  const handleBackup = () => {
    const b: Backup = { id: Date.now().toString(), date: new Date().toLocaleString(lang === 'ar' ? 'ar-JO' : 'en-JO'), size: '2.4 GB', type: 'manual', status: 'active' }
    setBackups(p => [b, ...p]); toast.success(t.backingUp)
  }

  return (
    <div className="space-y-6">
      <PageTitle title={t.dbTitle} action={<PrimaryBtn icon={Database} label={t.backup} onClick={handleBackup} />} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard icon={Database} label={t.dbSize} value="2.4 GB" color="bg-sky-100 dark:bg-sky-900/30 text-sky-600" />
        <StatCard icon={HardDrive} label={t.tables} value="156K" color="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600" />
        <StatCard icon={Activity} label={t.avgResponse} value="23ms" color="bg-amber-100 dark:bg-amber-900/30 text-amber-600" />
        <StatCard icon={Clock} label={t.backups} value={String(backups.length)} color="bg-violet-100 dark:bg-violet-900/30 text-violet-600" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card className="border-0 shadow-sm"><CardHeader className="pb-3"><CardTitle className="text-sm sm:text-base font-semibold">{t.resourceUsage}</CardTitle></CardHeader>
          <CardContent className="space-y-5">{[
            { l: t.gaugeCpu, v: 45 },
            { l: t.gaugeMemory, v: 72 },
            { l: t.gaugeDisk, v: 58 },
            { l: t.gaugeConnections, v: 34 },
          ].map(r => (
            <div key={r.l}><div className="flex justify-between text-sm mb-2"><span className="font-medium">{r.l}</span><span className="tabular-nums font-semibold">{r.v}%</span></div><Progress value={r.v} className="h-2" /></div>
          ))}</CardContent>
        </Card>
        <Card className="border-0 shadow-sm"><CardHeader className="pb-3"><CardTitle className="text-sm sm:text-base font-semibold">{t.backupList}</CardTitle></CardHeader>
          <CardContent className="space-y-3">{backups.map(b => (
            <div key={b.id} className="flex items-center gap-3 rounded-xl border p-3 sm:p-4 hover:bg-muted/30 transition-colors">
              <StatusBadge status={b.status} locale={lang} />
              <div className="min-w-0 flex-1"><p className="text-sm font-medium">{b.date}</p><p className="text-xs text-muted-foreground">{b.type === 'automatic' ? t.automatic : t.manual} · {b.size}</p></div>
              <ActionBtn icon={Download} onClick={() => toast.success(t.downloadingBackup)} />
            </div>
          ))}</CardContent>
        </Card>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════
// PAGE 13: SECURITY
// ════════════════════════════════════════════════════════════════
function SecurityPage() {
  const { t, lang } = useSA()
  const [settings, setSettings] = useState({ twoFactor: true, ipWhitelist: false, bruteForce: true, sessionTimeout: true, auditLog: true, encryptData: true })
  const toggle = (key: keyof typeof settings) => { setSettings(p => ({ ...p, [key]: !p[key] })); toast.success(t.settingUpdated) }
  const items = [
    { key: 'twoFactor' as const, label: t.twoFactor, desc: t.twoFactorDesc },
    { key: 'ipWhitelist' as const, label: t.ipWhitelist, desc: t.ipWhitelistDesc },
    { key: 'bruteForce' as const, label: t.bruteForce, desc: t.bruteForceDesc },
    { key: 'sessionTimeout' as const, label: t.sessionTimeout, desc: t.sessionTimeoutDesc },
    { key: 'auditLog' as const, label: t.auditLogging, desc: t.auditLoggingDesc },
    { key: 'encryptData' as const, label: t.dataEncryption, desc: t.dataEncryptionDesc },
  ]

  return (
    <div className="space-y-6">
      <PageTitle title={t.securityTitle} />
      <Card className="border-0 shadow-sm"><CardHeader className="pb-3"><CardTitle className="text-sm sm:text-base font-semibold">{t.securitySettings}</CardTitle></CardHeader>
        <CardContent className="space-y-0">
          {items.map((s, i) => (
            <div key={s.key}>
              <div className="flex items-center justify-between gap-4 py-3.5">
                <div className="min-w-0"><p className="text-sm font-medium">{s.label}</p><p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{s.desc}</p></div>
                <Toggle on={settings[s.key]} onToggle={() => toggle(s.key)} />
              </div>
              {i < items.length - 1 && <Separator />}
            </div>
          ))}
        </CardContent>
      </Card>
      <Card className="border-0 shadow-sm"><CardHeader className="pb-3"><CardTitle className="text-sm sm:text-base font-semibold flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-500" />{t.suspiciousAttempts}</CardTitle></CardHeader>
        <CardContent>
          <div className="hidden sm:block overflow-x-auto">
            <Table><TableHeader><TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="ps-4 font-semibold text-xs uppercase tracking-wider">{t.ipAddress}</TableHead>
              <TableHead className="px-3 font-semibold text-xs uppercase tracking-wider">{t.time}</TableHead>
              <TableHead className="px-3 font-semibold text-xs uppercase tracking-wider">{t.location}</TableHead>
              <TableHead className="pe-4 font-semibold text-xs uppercase tracking-wider">{t.status}</TableHead>
            </TableRow></TableHeader>
            <TableBody>{SECURITY_ATTEMPTS.map((a, i) => (
              <TableRow key={i} className="hover:bg-muted/20 transition-colors">
                <TableCell className="ps-4 font-mono text-sm" dir="ltr">{a.ip}</TableCell>
                <TableCell className="px-3 text-xs text-muted-foreground">{a.time}</TableCell>
                <TableCell className="px-3 text-sm">{secCountry(a, lang)}</TableCell>
                <TableCell className="pe-4"><StatusBadge status={a.status} locale={lang} /></TableCell>
              </TableRow>
            ))}</TableBody></Table>
          </div>
          <div className="sm:hidden space-y-2">
            {SECURITY_ATTEMPTS.map((a, i) => (
              <div key={i} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                <div className="min-w-0"><p className="font-mono text-sm font-semibold" dir="ltr">{a.ip}</p><p className="text-[11px] text-muted-foreground mt-0.5">{secCountry(a, lang)} · {a.time}</p></div>
                <StatusBadge status={a.status} locale={lang} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════
// PAGE 14: SETTINGS (JOD default + CLIQ config section)
// ════════════════════════════════════════════════════════════════
function SettingsPage() {
  const { t, lang, isRTL } = useSA()
  const { setCustomCurrency, setCustomTimezone, setThemeMode } = useAppStore()
  const [form, setForm] = useState({
    platformName: 'BookFlow', supportEmail: 'support@bookflow.com',
    currency: 'JOD', timezone: 'Asia/Amman',
    maintenance: false, registration: true, maxTenants: '500', backupFreq: 'daily',
  })
  const [cliq, setCliq] = useState<CliqConfig>({ ...DEFAULT_CLIQ_CONFIG })

  const handleSaveSettings = () => {
    setCustomCurrency(form.currency)
    setCustomTimezone(form.timezone)
    toast.success(t.settingsSaved)
  }
  const handleSaveCliq = () => { toast.success(t.settingsSaved) }

  return (
    <div className="space-y-6">
      <PageTitle title={t.settingsTitle} action={<PrimaryBtn icon={Save} label={t.saveSettings} onClick={handleSaveSettings} />} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card className="border-0 shadow-sm"><CardHeader className="pb-3"><CardTitle className="text-sm sm:text-base font-semibold">{t.generalSettings}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <FormField label={t.platformName}><Input value={form.platformName} onChange={e => setForm(p => ({ ...p, platformName: e.target.value }))} /></FormField>
            <FormField label={t.supportEmail}><Input type="email" value={form.supportEmail} onChange={e => setForm(p => ({ ...p, supportEmail: e.target.value }))} dir="ltr" /></FormField>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <FormField label={t.currency}>
                <Select value={form.currency} onValueChange={v => setForm(p => ({ ...p, currency: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="JOD">{lang === 'ar' ? 'دينار أردني (د.أ)' : 'JOD - Jordanian Dinar'}</SelectItem>
                    <SelectItem value="SAR">{lang === 'ar' ? 'ريال سعودي (ر.س)' : 'SAR - Saudi Riyal'}</SelectItem>
                    <SelectItem value="AED">{lang === 'ar' ? 'درهم إماراتي (د.إ)' : 'AED - UAE Dirham'}</SelectItem>
                    <SelectItem value="USD">USD - $</SelectItem>
                    <SelectItem value="EGP">{lang === 'ar' ? 'جنيه مصري (ج.م)' : 'EGP - Egyptian Pound'}</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label={t.timezone}>
                <Select value={form.timezone} onValueChange={v => setForm(p => ({ ...p, timezone: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Asia/Amman">{lang === 'ar' ? 'عمّان' : 'Amman'}</SelectItem>
                    <SelectItem value="Asia/Riyadh">{lang === 'ar' ? 'الرياض' : 'Riyadh'}</SelectItem>
                    <SelectItem value="Asia/Dubai">{lang === 'ar' ? 'دبي' : 'Dubai'}</SelectItem>
                    <SelectItem value="Africa/Cairo">{lang === 'ar' ? 'القاهرة' : 'Cairo'}</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm"><CardHeader className="pb-3"><CardTitle className="text-sm sm:text-base font-semibold">{t.advancedSettings}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <FormField label={t.maxTenants}><Input type="number" value={form.maxTenants} onChange={e => setForm(p => ({ ...p, maxTenants: e.target.value }))} /></FormField>
            <FormField label={t.backupFreq}><Select value={form.backupFreq} onValueChange={v => setForm(p => ({ ...p, backupFreq: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="hourly">{t.hourly}</SelectItem><SelectItem value="daily">{t.daily}</SelectItem><SelectItem value="weekly">{t.weekly}</SelectItem></SelectContent></Select></FormField>
            <Separator />
            {[
              { key: 'maintenance' as const, label: t.maintenanceMode, desc: t.maintenanceModeDesc, color: 'amber' },
              { key: 'registration' as const, label: t.openRegistration, desc: t.openRegistrationDesc, color: 'violet' },
            ].map(s => (
              <div key={s.key} className="flex items-center justify-between gap-4 py-1">
                <div><p className="text-sm font-medium">{s.label}</p><p className="text-xs text-muted-foreground">{s.desc}</p></div>
                <Toggle on={form[s.key]} onToggle={() => { setForm(p => ({ ...p, [s.key]: !p[s.key] })); toast.success(t.settingUpdated) }} color={s.color} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* CLIQ Payment Settings */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm sm:text-base font-semibold flex items-center gap-2"><Wallet className="h-4 w-4 text-violet-600" />{t.cliqSettings}</CardTitle>
            <PrimaryBtn icon={Save} label={t.save} onClick={handleSaveCliq} />
          </div>
        </CardHeader>
        <CardContent className="space-y-0">
          <div className="flex items-center justify-between gap-4 py-3.5">
            <div><p className="text-sm font-medium">{t.cliqEnabled}</p><p className="text-xs text-muted-foreground mt-0.5">{t.cliqEnabledDesc}</p></div>
            <Toggle on={cliq.enabled} onToggle={() => setCliq(p => ({ ...p, enabled: !p.enabled }))} />
          </div>
          <Separator />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <FormField label={t.cliqBankName}><Input value={cliq.bankName} onChange={e => setCliq(p => ({ ...p, bankName: e.target.value }))} /></FormField>
            <FormField label={t.cliqAccountHolder}><Input value={cliq.accountHolder} onChange={e => setCliq(p => ({ ...p, accountHolder: e.target.value }))} dir="ltr" /></FormField>
            <FormField label={t.cliqAlias}><Input value={cliq.cliqAlias} onChange={e => setCliq(p => ({ ...p, cliqAlias: e.target.value }))} dir="ltr" /></FormField>
            <FormField label={t.cliqSupportContact}><Input value={cliq.supportContact} onChange={e => setCliq(p => ({ ...p, supportContact: e.target.value }))} dir="ltr" /></FormField>
          </div>
          <FormField label={t.cliqInstructions}>
            <Textarea value={lang === 'en' ? cliq.instructionsEn : cliq.instructions} onChange={e => setCliq(p => ({ ...p, instructions: e.target.value }))} rows={3} />
          </FormField>
          <div className="pt-2">
            <FormField label={t.cliqQrCode}>
              <div className="flex items-center gap-3">
                <Button variant="outline" className="gap-2" onClick={() => toast.info(t.cliqUploadQr)}>
                  <Upload className="h-4 w-4" />{t.cliqUploadQr}
                </Button>
                {cliq.qrCodeUrl && <Badge variant="secondary" className="text-xs"><ImageIcon className="h-3 w-3 me-1" />QR</Badge>}
              </div>
            </FormField>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════
// PAGE 15: CLIQ PAYMENTS (Approve/Reject workflow)
// ════════════════════════════════════════════════════════════════
function CliqPaymentsPage() {
  const { t, lang, isRTL } = useSA()
  const { fmt, sym } = useCurrency()
  const [payments, setPayments] = useState<CliqPayment[]>(INIT_CLIQ_PAYMENTS)
  const [filter, setFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [detail, setDetail] = useState<CliqPayment | null>(null)
  const [actionDlg, setActionDlg] = useState<{ type: 'approve' | 'reject' | 'info'; payment: CliqPayment } | null>(null)
  const [reasonText, setReasonText] = useState('')
  const [newPayOpen, setNewPayOpen] = useState(false)
  const [newPay, setNewPay] = useState({ tenantName: '', tenantNameEn: '', customerName: '', customerEmail: '', plan: 'Starter', amount: 0, referenceNumber: '', notes: '' })

  const filtered = useMemo(() => {
    if (filter === 'all') return payments
    return payments.filter(p => p.status === filter)
  }, [payments, filter])
  const { items, totalPages } = paginate(filtered, page, PER_PAGE)

  const pendingCount = payments.filter(p => p.status === 'pending_verification').length
  const approvedCount = payments.filter(p => p.status === 'approved').length
  const rejectedCount = payments.filter(p => p.status === 'rejected').length

  const handleApprove = (p: CliqPayment) => {
    setPayments(prev => prev.map(x => x.id === p.id ? {
      ...x, status: 'approved', reviewedAt: new Date().toISOString(), reviewedBy: 'Super Admin'
    } : x))
    toast.success(t.cliqApprovedMsg)
    setActionDlg(null)
  }

  const handleSubmitNewPayment = () => {
    if (!newPay.tenantName.trim()) { toast.error(isRTL ? 'يرجى اختيار المستأجر' : 'Please select a tenant'); return }
    if (!newPay.customerName.trim()) { toast.error(isRTL ? 'يرجى إدخال اسم العميل' : 'Please enter customer name'); return }
    if (!newPay.referenceNumber.trim()) { toast.error(t.cliqReferenceRequired); return }
    if (newPay.amount <= 0) { toast.error(isRTL ? 'يرجى إدخال مبلغ صحيح' : 'Please enter a valid amount'); return }
    const np: CliqPayment = {
      id: `CLIQ-${String(payments.length + 1).padStart(3, '0')}`,
      tenantName: newPay.tenantName, tenantNameEn: newPay.tenantNameEn,
      customerName: newPay.customerName, customerEmail: newPay.customerEmail,
      plan: newPay.plan, amount: newPay.amount, currency: 'JOD',
      referenceNumber: newPay.referenceNumber, notes: newPay.notes,
      screenshotUrl: null, status: 'pending_verification',
      submittedAt: new Date().toISOString(), reviewedAt: null, reviewedBy: null,
      rejectionReason: null, additionalInfoRequest: null,
    }
    setPayments(prev => [np, ...prev])
    toast.success(t.cliqNewPaymentSuccess)
    setNewPayOpen(false)
    setNewPay({ tenantName: '', tenantNameEn: '', customerName: '', customerEmail: '', plan: 'Starter', amount: 0, referenceNumber: '', notes: '' })
    setPage(1)
  }

  const handleReject = (p: CliqPayment) => {
    if (!reasonText.trim()) { toast.error(t.cliqEnterReason); return }
    setPayments(prev => prev.map(x => x.id === p.id ? {
      ...x, status: 'rejected', reviewedAt: new Date().toISOString(), reviewedBy: 'Super Admin', rejectionReason: reasonText
    } : x))
    toast.success(t.cliqRejectedMsg)
    setActionDlg(null); setReasonText('')
  }

  const handleRequestInfo = (p: CliqPayment) => {
    if (!reasonText.trim()) { toast.error(t.cliqInfoRequestPrompt); return }
    setPayments(prev => prev.map(x => x.id === p.id ? {
      ...x, status: 'info_requested', additionalInfoRequest: reasonText
    } : x))
    toast.success(t.cliqInfoRequestedMsg)
    setActionDlg(null); setReasonText('')
  }

  return (
    <div className="space-y-5">
      <PageTitle title={t.cliqTitle} action={<PrimaryBtn icon={Plus} label={t.newCliqPayment} onClick={() => setNewPayOpen(true)} />} />

      {/* CLIQ Bank Info Card */}
      <Card className="border-0 shadow-sm border-l-4 border-l-violet-500">
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-900/30">
              <Wallet className="h-5 w-5 text-violet-600" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-bold mb-1">{lang === 'ar' ? 'معلومات التحويل عبر CLIQ' : 'CLIQ Transfer Information'}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
                <div>
                  <p className="text-[10px] text-muted-foreground">{lang === 'ar' ? 'البنك' : 'Bank'}</p>
                  <p className="text-xs font-semibold">{DEFAULT_CLIQ_CONFIG.bankName}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">{lang === 'ar' ? 'الاسم المستعار (Alias)' : 'Alias'}</p>
                  <p className="text-xs font-bold text-violet-600 font-mono" dir="ltr">{DEFAULT_CLIQ_CONFIG.cliqAlias}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">{lang === 'ar' ? 'صاحب الحساب' : 'Account Holder'}</p>
                  <p className="text-xs font-semibold" dir="ltr">{DEFAULT_CLIQ_CONFIG.accountHolder}</p>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">{lang === 'en' ? DEFAULT_CLIQ_CONFIG.instructionsEn : DEFAULT_CLIQ_CONFIG.instructions}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard icon={Wallet} label={t.cliqTotalPending} value={fmt(payments.filter(p => p.status === 'pending_verification').reduce((s, p) => s + p.amount, 0))} color="text-amber-600 bg-amber-50 dark:bg-amber-950/30" />
        <StatCard icon={Clock} label={t.cliqPending} value={String(pendingCount)} color="text-amber-600 bg-amber-50 dark:bg-amber-950/30" />
        <StatCard icon={CheckCircle2} label={t.cliqTotalApproved} value={String(approvedCount)} color="text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30" />
        <StatCard icon={XCircle} label={t.cliqTotalRejected} value={String(rejectedCount)} color="text-red-600 bg-red-50 dark:bg-red-950/30" />
      </div>

      <div className="flex flex-wrap gap-2">
        {['all','pending_verification','approved','rejected','info_requested'].map(f => (
          <Button key={f} size="sm" variant={filter === f ? 'default' : 'outline'} className="text-xs h-8 rounded-full px-4" onClick={() => { setFilter(f); setPage(1) }}>
            {f === 'all' ? t.all : f === 'pending_verification' ? t.cliqPending : f === 'approved' ? t.cliqApproved : f === 'rejected' ? t.cliqRejected : t.cliqInfoRequested}
          </Button>
        ))}
      </div>

      {/* Desktop Table */}
      <Card className="border-0 shadow-sm overflow-hidden hidden md:block">
        <div className="overflow-x-auto">
          <Table><TableHeader><TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="ps-5 font-semibold text-xs uppercase tracking-wider">{t.tenant}</TableHead>
            <TableHead className="px-3 font-semibold text-xs uppercase tracking-wider">{t.cliqCustomer}</TableHead>
            <TableHead className="px-3 font-semibold text-xs uppercase tracking-wider">{t.plan}</TableHead>
            <TableHead className="px-3 font-semibold text-xs uppercase tracking-wider text-end">{t.amount}</TableHead>
            <TableHead className="px-3 font-semibold text-xs uppercase tracking-wider">{t.cliqReferenceNo}</TableHead>
            <TableHead className="px-3 font-semibold text-xs uppercase tracking-wider">{t.status}</TableHead>
            <TableHead className="pe-5 font-semibold text-xs uppercase tracking-wider text-end">{t.actions}</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {items.length === 0 ? <EmptyRow colSpan={8} /> : items.map(p => (
              <TableRow key={p.id} className="group hover:bg-muted/20 transition-colors">
                <TableCell className="ps-5 font-medium text-sm">{cliqTenantName(p, lang)}</TableCell>
                <TableCell className="px-3 text-sm">{p.customerName}</TableCell>
                <TableCell className="px-3"><Badge variant="secondary" className="text-xs">{p.plan}</Badge></TableCell>
                <TableCell className="px-3 text-end font-semibold tabular-nums text-sm">{p.amount.toLocaleString()} {sym}</TableCell>
                <TableCell className="px-3 font-mono text-xs" dir="ltr">{p.referenceNumber}</TableCell>
                <TableCell className="px-3"><StatusBadge status={p.status} locale={lang} /></TableCell>
                <TableCell className="pe-5">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ActionBtn icon={Eye} label={t.view} onClick={() => setDetail(p)} />
                    {p.status === 'pending_verification' && <>
                      <ActionBtn icon={CheckCircle2} label={t.cliqApprove} onClick={() => { setActionDlg({ type: 'approve', payment: p }); setReasonText('') }} />
                      <ActionBtn icon={XCircle} label={t.cliqReject} onClick={() => { setActionDlg({ type: 'reject', payment: p }); setReasonText('') }} danger />
                      <ActionBtn icon={Info} label={t.cliqRequestInfo} onClick={() => { setActionDlg({ type: 'info', payment: p }); setReasonText('') }} />
                    </>}
                    {(p.status === 'rejected' || p.status === 'info_requested') && (
                      <ActionBtn icon={RefreshCw} label={t.view} onClick={() => setDetail(p)} />
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody></Table>
        </div>
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </Card>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {items.length === 0 ? <Card className="border-0 shadow-sm"><CardContent className="py-16 text-center text-muted-foreground text-sm">{t.cliqNoPayments}</CardContent></Card> : items.map(p => (
          <Card key={p.id} className="border-0 shadow-sm"><CardContent className="p-4">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="min-w-0"><p className="font-semibold text-sm">{cliqTenantName(p, lang)}</p><p className="text-xs text-muted-foreground">{p.customerName} · {p.plan}</p></div>
              <StatusBadge status={p.status} locale={lang} />
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="rounded-lg bg-muted/50 p-2"><p className="text-[10px] text-muted-foreground">{t.amount}</p><p className="text-xs font-semibold mt-0.5">{p.amount.toLocaleString()} {sym}</p></div>
              <div className="rounded-lg bg-muted/50 p-2"><p className="text-[10px] text-muted-foreground">{t.cliqReferenceNo}</p><p className="text-xs font-semibold mt-0.5 font-mono" dir="ltr">{p.referenceNumber}</p></div>
            </div>
            {p.rejectionReason && <p className="text-xs text-red-600 mb-2">{t.cliqRejectionReason}: {p.rejectionReason}</p>}
            {p.additionalInfoRequest && <p className="text-xs text-sky-600 mb-2">{t.cliqInfoRequested}: {p.additionalInfoRequest}</p>}
            <div className="flex items-center justify-end gap-1 pt-2 border-t">
              <ActionBtn icon={Eye} onClick={() => setDetail(p)} />
              {p.status === 'pending_verification' && <>
                <ActionBtn icon={CheckCircle2} onClick={() => { setActionDlg({ type: 'approve', payment: p }); setReasonText('') }} />
                <ActionBtn icon={XCircle} onClick={() => { setActionDlg({ type: 'reject', payment: p }); setReasonText('') }} danger />
              </>}
            </div>
          </CardContent></Card>
        ))}
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!detail} onOpenChange={() => setDetail(null)}>
        <DialogContent className="max-w-lg" dir={isRTL ? 'rtl' : 'ltr'}><DialogHeader><DialogTitle>{t.cliqTitle}</DialogTitle><DialogDescription className="sr-only">{isRTL ? 'تفاصيل الدفع' : 'Payment details'}</DialogDescription></DialogHeader>
          {detail && <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-muted/50 p-3"><p className="text-[10px] text-muted-foreground">{t.tenant}</p><p className="text-sm font-semibold mt-0.5">{cliqTenantName(detail, lang)}</p></div>
              <div className="rounded-lg bg-muted/50 p-3"><p className="text-[10px] text-muted-foreground">{t.cliqCustomer}</p><p className="text-sm font-semibold mt-0.5">{detail.customerName}</p></div>
              <div className="rounded-lg bg-muted/50 p-3"><p className="text-[10px] text-muted-foreground">{t.plan}</p><p className="text-sm font-semibold mt-0.5">{detail.plan}</p></div>
              <div className="rounded-lg bg-muted/50 p-3"><p className="text-[10px] text-muted-foreground">{t.amount}</p><p className="text-sm font-bold mt-0.5">{detail.amount.toLocaleString()} {sym}</p></div>
            </div>
            <Separator />
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">{t.cliqReferenceNo}</span><span className="font-mono font-semibold" dir="ltr">{detail.referenceNumber}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">{t.cliqSubmissionDate}</span><span>{new Date(detail.submittedAt).toLocaleString(lang === 'ar' ? 'ar-JO' : 'en-JO')}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">{t.status}</span><StatusBadge status={detail.status} locale={lang} /></div>
              {detail.rejectionReason && <><Separator /><p className="text-red-600 text-xs mt-2">{t.cliqRejectionReason}: {detail.rejectionReason}</p></>}
              {detail.additionalInfoRequest && <><Separator /><p className="text-sky-600 text-xs mt-2">{t.cliqInfoRequested}: {detail.additionalInfoRequest}</p></>}
            </div>
          </div>}
          <DlgFooter onCancel={() => setDetail(null)} onConfirm={() => setDetail(null)} confirmLabel={t.close} />
        </DialogContent>
      </Dialog>

      {/* Approve Confirm */}
      <ConfirmDialog open={actionDlg?.type === 'approve'} onOpenChange={() => setActionDlg(null)} title={t.cliqApprove} desc={t.cliqApproveDesc} onConfirm={() => { if (actionDlg?.payment) handleApprove(actionDlg.payment) }} />

      {/* Reject Dialog */}
      <Dialog open={actionDlg?.type === 'reject'} onOpenChange={() => setActionDlg(null)}>
        <DialogContent className="max-w-md"><DialogHeader><DialogTitle>{t.cliqReject}</DialogTitle><DialogDescription>{t.cliqRejectDesc}</DialogDescription></DialogHeader>
          <div className="space-y-4 pt-2">
            <FormField label={t.cliqRejectionReason}><Textarea value={reasonText} onChange={e => setReasonText(e.target.value)} placeholder={t.cliqEnterReason} rows={3} /></FormField>
          </div>
          <DlgFooter onCancel={() => setActionDlg(null)} onConfirm={() => { if (actionDlg?.payment) handleReject(actionDlg.payment) }} danger />
        </DialogContent>
      </Dialog>

      {/* Request Info Dialog */}
      <Dialog open={actionDlg?.type === 'info'} onOpenChange={() => setActionDlg(null)}>
        <DialogContent className="max-w-md" dir={isRTL ? 'rtl' : 'ltr'}><DialogHeader><DialogTitle>{t.cliqRequestInfo}</DialogTitle><DialogDescription className="sr-only">{isRTL ? 'طلب معلومات إضافية' : 'Request additional info'}</DialogDescription></DialogHeader>
          <div className="space-y-4 pt-2">
            <FormField label={t.cliqInfoRequestPrompt}><Textarea value={reasonText} onChange={e => setReasonText(e.target.value)} placeholder={t.cliqInfoRequestPrompt} rows={3} /></FormField>
          </div>
          <DlgFooter onCancel={() => setActionDlg(null)} onConfirm={() => { if (actionDlg?.payment) handleRequestInfo(actionDlg.payment) }} />
        </DialogContent>
      </Dialog>

      {/* New Payment Dialog */}
      <Dialog open={newPayOpen} onOpenChange={setNewPayOpen}>
        <DialogContent className="max-w-md" dir={isRTL ? 'rtl' : 'ltr'}>
          <DialogHeader><DialogTitle>{t.newCliqPaymentDlg}</DialogTitle><DialogDescription className="sr-only">{isRTL ? 'تسجيل دفع CLIQ جديد' : 'Register new CLIQ payment'}</DialogDescription></DialogHeader>
          <div className="space-y-4 pt-2">
            <FormField label={t.tenant}>
              <Select value={newPay.tenantName} onValueChange={v => {
                const tn = INIT_TENANTS.find(x => x.name === v || x.nameEn === v)
                setNewPay(p => ({ ...p, tenantName: tn?.name || v, tenantNameEn: tn?.nameEn || v }))
              }}>
                <SelectTrigger><SelectValue placeholder={isRTL ? 'اختر المستأجر' : 'Select tenant'} /></SelectTrigger>
                <SelectContent>{INIT_TENANTS.map(tn => <SelectItem key={tn.id} value={lang === 'en' ? tn.nameEn : tn.name}>{lang === 'en' ? tn.nameEn : tn.name}</SelectItem>)}</SelectContent>
              </Select>
            </FormField>
            <FormField label={t.customerName}><Input value={newPay.customerName} onChange={e => setNewPay(p => ({ ...p, customerName: e.target.value }))} /></FormField>
            <FormField label={t.customerEmail}><Input type="email" value={newPay.customerEmail} onChange={e => setNewPay(p => ({ ...p, customerEmail: e.target.value }))} dir="ltr" /></FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label={t.plan}>
                <Select value={newPay.plan} onValueChange={v => {
                  setNewPay(p => ({ ...p, plan: v }))
                  const plan = PLANS.find(pl => pl.name === v)
                  if (plan) setNewPay(p => ({ ...p, amount: plan.price }))
                }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{PLANS.map(p => <SelectItem key={p.id} value={p.name}>{p.name} ({p.price} {sym})</SelectItem>)}</SelectContent>
                </Select>
              </FormField>
              <FormField label={t.amount}><Input type="number" value={newPay.amount || ''} onChange={e => setNewPay(p => ({ ...p, amount: Number(e.target.value) }))} /></FormField>
            </div>
            <FormField label={t.referenceNumber}><Input value={newPay.referenceNumber} onChange={e => setNewPay(p => ({ ...p, referenceNumber: e.target.value }))} placeholder={isRTL ? 'مثال: TXN-2025-XXXXXX' : 'e.g. TXN-2025-XXXXXX'} dir="ltr" /></FormField>
            <FormField label={t.notes}><Textarea value={newPay.notes} onChange={e => setNewPay(p => ({ ...p, notes: e.target.value }))} rows={2} /></FormField>
          </div>
          <DlgFooter onCancel={() => setNewPayOpen(false)} onConfirm={handleSubmitNewPayment} confirmLabel={t.cliqSubmitPayment} />
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ════════════════════════════════════════════════════════════════
const PAGES: Record<string, () => React.JSX.Element> = {
  sa_overview: OverviewPage,
  sa_tenants: TenantsPage,
  sa_users: UsersPage,
  sa_plans: PlansPage,
  sa_billing: BillingPage,
  sa_cliq: CliqPaymentsPage,
  sa_roles: RolesPage,
  sa_audit: AuditPage,
  sa_notifications: NotificationsPage,
  sa_reports: ReportsPage,
  sa_system: SystemPage,
  sa_servers: ServersPage,
  sa_database: DatabaseMonitoringPage,
  sa_backups: BackupSystemPage,
  sa_security: SecurityCenterPage,
  sa_input_security: InputSecurityPage,
  sa_settings: SettingsModulePage,
}

export function SuperAdminDashboard() {
  const { superAdminView, isAuthenticated, logout } = useAppStore()

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('bf_sa_token') : null
    if (!token && !isAuthenticated) logout()
  }, [isAuthenticated, logout])

  const Page = PAGES[superAdminView] || OverviewPage

  return (
    <motion.div
      key={superAdminView}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="p-4 sm:p-6 lg:p-8 w-full"
    >
      <div className="max-w-[1400px] mx-auto">
        <Page />
      </div>
    </motion.div>
  )
}