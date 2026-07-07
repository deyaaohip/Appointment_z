'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { useAppStore } from '@/stores/app-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import {
  Building2, Users, DollarSign, CalendarDays, Activity, CreditCard,
  Settings, Shield, Eye, Edit, Trash2, Plus, BarChart3, Server,
  Database, Lock, Bell, FileText, UserCog, CheckCircle2, AlertTriangle,
  RefreshCw, Globe, UserPlus, Clock, Monitor, HardDrive, Mail, Download,
  Power, PowerOff, Save, ChevronLeft, Search,
} from 'lucide-react'

// ─── Imports from shared modules ───────────────────────────────
import { useT } from './sa-i18n'
import { type Lang } from './sa-i18n'
import {
  type Tenant, type PlatformUser, type SysLog, type Invoice,
  type Role, type Plan, type Server as ServerType, type Backup,
  type SecurityAttempt, type NotificationTemplate, type Report,
  type SortState,
  INIT_TENANTS, INIT_USERS, INIT_LOGS, PLANS, INIT_ROLES, SERVERS,
  INVOICES, BACKUPS, SECURITY_ATTEMPTS, NOTIF_TEMPLATES, REPORTS, bField,
} from './sa-data'
import {
  fade, useSA, StatusBadge, LogDot, getLogLabel, PageTitle, FormField,
  Toggle, ConfirmDialog, KpiCard, StatCard, ActionBtn, PrimaryBtn,
  EmptyRow, SearchInput, SortableTH, Pagination, TableFooter, DlgFooter,
  gaugeColor, genericSort, paginate,
} from './sa-helpers'

const PER_PAGE = 5

// ─── Bilingual field helper for logs ───────────────────────────
function logMsg(l: SysLog, lang: Lang) { return lang === 'en' ? l.messageEn : l.message }
function logSrc(l: SysLog, lang: Lang) { return lang === 'en' ? l.sourceEn : l.source }
function serverRegion(s: ServerType, lang: Lang) { return lang === 'en' ? s.regionEn : s.region }
function secCountry(a: SecurityAttempt, lang: Lang) { return lang === 'en' ? a.countryEn : a.country }
function invTenant(inv: Invoice, lang: Lang) { return lang === 'en' ? (inv.tenantEn || inv.tenant) : inv.tenant }
function userTenant(u: PlatformUser, lang: Lang) { return lang === 'en' ? (u.tenantEn || u.tenant) : u.tenant }

// ════════════════════════════════════════════════════════════════
// PAGE 1: OVERVIEW
// ════════════════════════════════════════════════════════════════
function OverviewPage() {
  const { t, isRTL, lang } = useSA()
  const [tenants] = useState<Tenant[]>(INIT_TENANTS)
  const [logs] = useState<SysLog[]>(INIT_LOGS)

  const totalRevenue = tenants.reduce((s, tn) => s + tn.revenue, 0)
  const totalBookings = tenants.reduce((s, tn) => s + tn.bookings, 0)
  const activeCount = tenants.filter(tn => tn.status === 'active').length
  const activeTenants = tenants.filter(tn => tn.status === 'active').slice(0, 6)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard icon={Building2} bg="bg-violet-600" label={t.totalTenants} value={tenants.length} sub={`${activeCount} ${t.active.toLowerCase()}`} trend={12} delay={0} />
        <KpiCard icon={Users} bg="bg-sky-600" label={t.totalUsers} value={INIT_USERS.length} sub={null} trend={8} delay={0.04} />
        <KpiCard icon={DollarSign} bg="bg-amber-500" label={t.revenue} value={`${(totalRevenue / 1000).toFixed(0)}K`} sub={t.thisMonth} trend={18} delay={0.08} />
        <KpiCard icon={CalendarDays} bg="bg-emerald-600" label={t.totalBookings} value={totalBookings.toLocaleString()} sub={t.last30Days} trend={5} delay={0.12} />
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
                      <span className="text-muted-foreground tabular-nums text-xs sm:text-sm">{rev.toLocaleString()} {lang === 'ar' ? 'ر.س' : 'SAR'}</span>
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
  const [tenants, setTenants] = useState<Tenant[]>(INIT_TENANTS)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState<SortState>({ key: 'name', dir: 'asc' })
  const [dlg, setDlg] = useState<{ type: string; tenant?: Tenant } | null>(null)
  const [form, setForm] = useState({ name: '', nameEn: '', email: '', country: '', plan: 'Starter' })

  const filtered = useMemo(() => {
    let list = [...tenants]
    if (filter !== 'all') list = list.filter(tn => tn.status === filter)
    if (search) { const q = search.toLowerCase(); list = list.filter(tn => tn.name.includes(q) || tn.nameEn.toLowerCase().includes(q) || tn.email.toLowerCase().includes(q)) }
    return genericSort(list, sort.key, sort.dir, lang)
  }, [tenants, search, filter, sort, lang])

  const { items, totalPages } = paginate(filtered, page, PER_PAGE)

  const handleSort = (key: string) => setSort(p => p.key === key ? { key, dir: p.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' })

  const openAdd = () => { setForm({ name: '', nameEn: '', email: '', country: '', plan: 'Starter' }); setDlg({ type: 'add' }) }
  const openEdit = (tn: Tenant) => { setForm({ name: tn.name, nameEn: tn.nameEn, email: tn.email, country: tn.country, plan: tn.plan }); setDlg({ type: 'edit', tenant: tn }) }

  const handleSave = useCallback(() => {
    if (!form.name.trim()) { toast.error(t.enterTenantName); return }
    if (form.email && !form.email.includes('@')) { toast.error(t.enterValidEmail); return }
    if (dlg?.type === 'add') {
      const n: Tenant = { id: Date.now().toString(), ...form, bookings: 0, revenue: 0, users: 1, status: 'trial', createdAt: new Date().toISOString().split('T')[0] }
      setTenants(p => [n, ...p]); toast.success(t.added.replace('{name}', form.name))
    } else if (dlg?.tenant) {
      setTenants(p => p.map(tn => tn.id === dlg.tenant!.id ? { ...tn, ...form } : tn)); toast.success(t.updated)
    }
    setDlg(null); setPage(1)
  }, [form, dlg, t])

  const handleDelete = (tn: Tenant) => { setTenants(p => p.filter(x => x.id !== tn.id)); toast.success(t.deleted); setPage(1) }
  const handleToggleStatus = (tn: Tenant) => {
    const newStatus = tn.status === 'suspended' ? 'active' : 'suspended'
    setTenants(p => p.map(x => x.id === tn.id ? { ...x, status: newStatus } : x))
    toast.success(newStatus === 'suspended' ? t.tenantSuspended : t.tenantActivated)
    setPage(1)
  }

  const tnName = (tn: Tenant) => bField(tn, 'name', lang)

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

      {/* Desktop Table */}
      <Card className="border-0 shadow-sm overflow-hidden hidden md:block">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader><TableRow className="bg-muted/50 hover:bg-muted/50">
              <SortableTH label={t.tenant} sortKey="name" currentSort={sort} onSort={handleSort} className="ps-5" />
              <SortableTH label={t.plan} sortKey="plan" currentSort={sort} onSort={handleSort} />
              <SortableTH label={t.bookings} sortKey="bookings" currentSort={sort} onSort={handleSort} align="end" />
              <SortableTH label={t.tenantRevenue} sortKey="revenue" currentSort={sort} onSort={handleSort} align="end" />
              <SortableTH label={t.status} sortKey="status" currentSort={sort} onSort={handleSort} />
              <TableHead className="pe-5 font-semibold text-xs uppercase tracking-wider text-end">{t.actions}</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {items.length === 0 ? <EmptyRow colSpan={6} /> : items.map(tn => (
                <TableRow key={tn.id} className="group hover:bg-muted/20 transition-colors">
                  <TableCell className="ps-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/30 text-violet-600 font-bold text-xs">{tnName(tn).charAt(0)}</div>
                      <div className="min-w-0"><p className="font-medium text-sm truncate max-w-[200px]">{tnName(tn)}</p><p className="text-xs text-muted-foreground truncate max-w-[200px]" dir="ltr">{tn.email}</p></div>
                    </div>
                  </TableCell>
                  <TableCell className="px-3"><Badge variant="secondary" className="font-medium text-xs">{tn.plan}</Badge></TableCell>
                  <TableCell className="px-3 text-end tabular-nums text-sm">{tn.bookings.toLocaleString()}</TableCell>
                  <TableCell className="px-3 text-end font-semibold tabular-nums text-sm">{tn.revenue.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">{lang === 'ar' ? 'ر.س' : 'SAR'}</span></TableCell>
                  <TableCell className="px-3"><StatusBadge status={tn.status} locale={lang} /></TableCell>
                  <TableCell className="pe-5">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ActionBtn icon={Eye} label={t.view} onClick={() => toast.info(t.details.replace('{name}', tnName(tn)))} />
                      <ActionBtn icon={Edit} label={t.edit} onClick={() => openEdit(tn)} />
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

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {items.length === 0 ? <Card className="border-0 shadow-sm"><CardContent className="py-16 text-center text-muted-foreground text-sm">{t.noResults}</CardContent></Card> : items.map(tn => (
          <Card key={tn.id} className="border-0 shadow-sm">
            <CardContent className="p-4">
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
                <div className="rounded-lg bg-muted/50 p-2"><p className="text-[10px] text-muted-foreground">{t.tenantRevenue}</p><p className="text-xs font-semibold mt-0.5 tabular-nums">{tn.revenue.toLocaleString()}</p></div>
              </div>
              <div className="flex items-center justify-end gap-1 pt-2 border-t">
                <ActionBtn icon={Edit} label={t.edit} onClick={() => openEdit(tn)} />
                <ActionBtn icon={tn.status === 'suspended' ? Power : PowerOff} label={tn.status === 'suspended' ? t.active : t.suspended} onClick={() => handleToggleStatus(tn)} />
                <ActionBtn icon={Trash2} onClick={() => setDlg({ type: 'delete', tenant: tn })} danger />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dlg?.type === 'add' || dlg?.type === 'edit'} onOpenChange={() => setDlg(null)}>
        <DialogContent className="max-w-md"><DialogHeader><DialogTitle>{dlg?.type === 'add' ? t.addTenantDlg : t.editTenantDlg}</DialogTitle></DialogHeader>
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
    </div>
  )
}

// ════════════════════════════════════════════════════════════════
// PAGE 3: USERS (full CRUD + sort + pagination)
// ════════════════════════════════════════════════════════════════
function UsersPage() {
  const { t, lang } = useSA()
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
      setUsers(p => [{ id: Date.now().toString(), ...form, status: 'active', lastLogin: new Date().toISOString() }, ...p])
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

      {/* Mobile Cards */}
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
        <DialogContent className="max-w-md"><DialogHeader><DialogTitle>{dlg?.type === 'add' ? t.addUserDlg : t.editUserDlg}</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <FormField label={t.name}><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></FormField>
            <FormField label={t.email}><Input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} dir="ltr" /></FormField>
            <FormField label={t.tenant}><Input value={form.tenant} onChange={e => setForm(p => ({ ...p, tenant: e.target.value }))} /></FormField>
            <FormField label={t.role}><Select value={form.role} onValueChange={v => setForm(p => ({ ...p, role: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
              <SelectItem value="owner">{t.owner}</SelectItem><SelectItem value="manager">{t.manager}</SelectItem>
              <SelectItem value="receptionist">{t.receptionist}</SelectItem><SelectItem value="accountant">{t.accountant}</SelectItem>
            </SelectContent></Select></FormField>
          </div>
          <DlgFooter onCancel={() => setDlg(null)} onConfirm={handleSave} />
        </DialogContent>
      </Dialog>
      <ConfirmDialog open={dlg?.type === 'delete'} onOpenChange={() => setDlg(null)} title={t.deleteUserDlg} desc={t.confirmDeleteUser.replace('{name}', dlg?.user?.name || '')} onConfirm={() => { if (dlg?.user) handleDelete(dlg.user) }} danger />
    </div>
  )
}

// ════════════════════════════════════════════════════════════════
// PAGE 4: PLANS
// ════════════════════════════════════════════════════════════════
function PlansPage() {
  const { t, lang } = useSA()
  const [detailPlan, setDetailPlan] = useState<Plan | null>(null)
  return (
    <div className="space-y-6">
      <PageTitle title={t.plansTitle} action={<PrimaryBtn icon={Plus} label={t.createPlan} onClick={() => toast.info(t.willOpenCreatePlan)} />} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-5">
        {PLANS.map((p, i) => (
          <motion.div key={p.id} variants={fade} initial="hidden" animate="visible" transition={{ delay: i * 0.04 }}>
            <Card className={`h-full flex flex-col transition-all hover:shadow-lg cursor-pointer border-0 shadow-sm ${p.popular ? 'ring-2 ring-violet-500 shadow-violet-500/10' : ''}`} onClick={() => setDetailPlan(p)}>
              <CardContent className="flex-1 flex flex-col items-center p-5 sm:p-6 pt-7">
                {p.popular && <Badge className="bg-violet-600 text-white mb-3 -mt-1 text-[10px]">{t.mostPopular}</Badge>}
                <div className={`h-12 w-12 rounded-2xl ${p.color} flex items-center justify-center mb-4 shadow-lg`}><CreditCard className="h-6 w-6 text-white" /></div>
                <h3 className="font-bold text-base">{p.name}</h3>
                <p className="text-3xl font-extrabold mt-3 mb-1">{p.price > 0 ? `${p.price}` : t.free}</p>
                <p className="text-xs text-muted-foreground mb-5">{p.price > 0 ? t.perMonth : ''} · {p.tenants} {t.tenants}</p>
                <Separator className="w-full mb-5" />
                <ul className="space-y-2.5 w-full text-start flex-1">{p.features.map((f, j) => (
                  <li key={j} className="flex items-start gap-2 text-xs sm:text-sm"><CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" /><span>{lang === 'en' ? f.en : f.ar}</span></li>
                ))}</ul>
                <Button className={`w-full mt-6 ${p.popular ? 'bg-violet-600 hover:bg-violet-700 text-white' : ''}`} variant={p.popular ? 'default' : 'outline'}>{t.managePlan}</Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
      <Dialog open={!!detailPlan} onOpenChange={() => setDetailPlan(null)}>
        <DialogContent className="max-w-sm"><DialogHeader><DialogTitle>{t.planDetails}</DialogTitle></DialogHeader>
          {detailPlan && <div className="space-y-4 pt-2">
            <div className="text-center"><p className="text-3xl font-extrabold">{detailPlan.price > 0 ? `${detailPlan.price} ${lang === 'ar' ? 'ر.س' : 'SAR'}` : t.free}</p><p className="text-sm text-muted-foreground mt-1">{t.monthly} · {detailPlan.tenants} {t.tenants}</p></div>
            <Separator />
            <ul className="space-y-2">{detailPlan.features.map((f, i) => (<li key={i} className="flex items-center gap-2 text-sm"><CheckCircle2 className="h-4 w-4 text-emerald-500" />{lang === 'en' ? f.en : f.ar}</li>))}</ul>
          </div>}
          <DlgFooter onCancel={() => setDetailPlan(null)} onConfirm={() => { toast.info(t.willOpenPlanEditor); setDetailPlan(null) }} confirmLabel={t.edit} />
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════
// PAGE 5: BILLING
// ════════════════════════════════════════════════════════════════
function BillingPage() {
  const { t, lang } = useSA()
  const [invoices, setInvoices] = useState<Invoice[]>(INVOICES)
  const [filter, setFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState<SortState>({ key: 'date', dir: 'desc' })
  const filtered = useMemo(() => {
    let list = filter === 'all' ? [...invoices] : invoices.filter(i => i.status === filter)
    return genericSort(list, sort.key, sort.dir, lang)
  }, [invoices, filter, sort, lang])
  const { items, totalPages } = paginate(filtered, page, PER_PAGE)
  const handleSort = (key: string) => setSort(p => p.key === key ? { key, dir: p.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' })
  const totalPaid = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.amount, 0)
  const totalPending = invoices.filter(i => i.status === 'pending' || i.status === 'overdue').reduce((s, i) => s + i.amount, 0)

  const handleMarkPaid = (inv: Invoice) => {
    setInvoices(p => p.map(i => i.id === inv.id ? { ...i, status: 'paid' } : i))
    toast.success(t.paid)
  }

  return (
    <div className="space-y-5">
      <PageTitle title={t.billingTitle} action={<PrimaryBtn icon={Plus} label={t.createInvoice} onClick={() => toast.info(t.willCreateInvoice)} />} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard icon={CheckCircle2} label={t.payments} value={`${totalPaid.toLocaleString()} ${lang === 'ar' ? 'ر.س' : 'SAR'}`} color="text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30" />
        <StatCard icon={Clock} label={t.pending} value={`${totalPending.toLocaleString()} ${lang === 'ar' ? 'ر.س' : 'SAR'}`} color="text-amber-600 bg-amber-50 dark:bg-amber-950/30" />
        <StatCard icon={DollarSign} label={t.paid} value={`${invoices.filter(i => i.status === 'paid').length}`} color="text-sky-600 bg-sky-50 dark:bg-sky-950/30" />
        <StatCard icon={AlertTriangle} label={t.overdue} value={`${invoices.filter(i => i.status === 'overdue').length}`} color="text-red-600 bg-red-50 dark:bg-red-950/30" />
      </div>
      <div className="flex gap-3">
        <Select value={filter} onValueChange={v => { setFilter(v); setPage(1) }}>
          <SelectTrigger className="w-44 h-10"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">{t.all}</SelectItem><SelectItem value="paid">{t.paid}</SelectItem><SelectItem value="pending">{t.pending}</SelectItem><SelectItem value="overdue">{t.overdue}</SelectItem><SelectItem value="failed">{t.failed}</SelectItem></SelectContent>
        </Select>
      </div>

      {/* Desktop Table */}
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
              <TableCell className="px-3 text-end font-semibold tabular-nums text-sm">{inv.amount.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">{lang === 'ar' ? 'ر.س' : 'SAR'}</span></TableCell>
              <TableCell className="px-3"><StatusBadge status={inv.status} locale={lang} /></TableCell>
              <TableCell className="pe-5">
                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ActionBtn icon={Eye} label={t.view} onClick={() => toast.info(t.viewingInvoice.replace('{id}', inv.id))} />
                  {inv.status !== 'paid' && <ActionBtn icon={CheckCircle2} label={t.paid} onClick={() => handleMarkPaid(inv)} />}
                  <ActionBtn icon={Download} onClick={() => toast.success(t.downloadingInvoice.replace('{id}', inv.id))} />
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
        {items.length === 0 ? <Card className="border-0 shadow-sm"><CardContent className="py-16 text-center text-muted-foreground text-sm">{t.noResults}</CardContent></Card> : items.map(inv => (
          <Card key={inv.id} className="border-0 shadow-sm"><CardContent className="p-4">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="min-w-0"><p className="font-mono text-sm font-bold">{inv.id}</p><p className="text-xs text-muted-foreground mt-0.5">{invTenant(inv, lang)}</p></div>
              <StatusBadge status={inv.status} locale={lang} />
            </div>
            <div className="flex items-center justify-between pt-2 border-t">
              <span className="font-bold text-sm">{inv.amount.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">{lang === 'ar' ? 'ر.س' : 'SAR'}</span></span>
              <div className="flex gap-1">
                <ActionBtn icon={Eye} onClick={() => toast.info(t.viewingInvoice.replace('{id}', inv.id))} />
                {inv.status !== 'paid' && <ActionBtn icon={CheckCircle2} onClick={() => handleMarkPaid(inv)} />}
                <ActionBtn icon={Download} onClick={() => toast.success(t.downloadingInvoice.replace('{id}', inv.id))} />
              </div>
            </div>
          </CardContent></Card>
        ))}
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════
// PAGE 6: ROLES (full CRUD)
// ════════════════════════════════════════════════════════════════
function RolesPage() {
  const { t, lang } = useSA()
  const [roles, setRoles] = useState<Role[]>(INIT_ROLES)
  const [addOpen, setAddOpen] = useState(false)
  const [editRole, setEditRole] = useState<Role | null>(null)
  const [form, setForm] = useState({ name: '', nameEn: '', desc: '', descEn: '' })

  const openAdd = () => { setForm({ name: '', nameEn: '', desc: '', descEn: '' }); setAddOpen(true) }
  const openEdit = (r: Role) => { setForm({ name: r.name, nameEn: r.nameEn, desc: r.description, descEn: r.descriptionEn }); setEditRole(r) }

  const rName = (r: Role) => lang === 'en' ? r.nameEn : r.name
  const rDesc = (r: Role) => lang === 'en' ? r.descriptionEn : r.description

  const handleCreate = () => {
    if (!form.name.trim()) return
    const r: Role = { id: Date.now().toString(), name: form.name, nameEn: form.nameEn, users: 0, permissions: 0, description: form.desc, descriptionEn: form.descEn }
    setRoles(p => [r, ...p]); toast.success(t.roleCreated); setAddOpen(false)
  }

  const handleUpdate = () => {
    if (!editRole || !form.name.trim()) return
    setRoles(p => p.map(r => r.id === editRole.id ? { ...r, name: form.name, nameEn: form.nameEn, description: form.desc, descriptionEn: form.descEn } : r))
    toast.success(t.roleUpdated); setEditRole(null)
  }

  const handleDelete = (r: Role) => { setRoles(p => p.filter(x => x.id !== r.id)); toast.success(t.roleDeleted) }

  return (
    <div className="space-y-6">
      <PageTitle title={t.rolesTitle} action={<PrimaryBtn icon={Plus} label={t.addRole} onClick={openAdd} />} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {roles.map((r, i) => (
          <motion.div key={r.id} variants={fade} initial="hidden" animate="visible" transition={{ delay: i * 0.04 }}>
            <Card className="group transition-all hover:shadow-lg border-0 shadow-sm h-full">
              <CardContent className="p-5 sm:p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-900/30"><Shield className="h-5 w-5 text-violet-600" /></div>
                  <Badge variant="secondary" className="text-xs">{r.permissions} {t.permissions}</Badge>
                </div>
                <h3 className="font-bold text-base">{rName(r)}</h3>
                <p className="text-xs text-muted-foreground mb-2">{lang === 'ar' ? r.nameEn : r.name}</p>
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{rDesc(r)}</p>
                <div className="flex items-center justify-between pt-3 border-t">
                  <span className="text-xs text-muted-foreground">{r.users} {t.users}</span>
                  <div className="flex gap-1">
                    <ActionBtn icon={Edit} label={t.edit} onClick={() => openEdit(r)} />
                    <ActionBtn icon={Trash2} onClick={() => handleDelete(r)} danger />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Add Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md"><DialogHeader><DialogTitle>{t.addRoleDlg}</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <FormField label={t.roleName}><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></FormField>
            <FormField label={t.roleNameEn}><Input value={form.nameEn} onChange={e => setForm(p => ({ ...p, nameEn: e.target.value }))} dir="ltr" /></FormField>
            <FormField label={t.description}><Input value={form.desc} onChange={e => setForm(p => ({ ...p, desc: e.target.value }))} /></FormField>
          </div>
          <DlgFooter onCancel={() => setAddOpen(false)} onConfirm={handleCreate} confirmLabel={t.create} />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editRole} onOpenChange={() => setEditRole(null)}>
        <DialogContent className="max-w-md"><DialogHeader><DialogTitle>{t.editRoleDlg}</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <FormField label={t.roleName}><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></FormField>
            <FormField label={t.roleNameEn}><Input value={form.nameEn} onChange={e => setForm(p => ({ ...p, nameEn: e.target.value }))} dir="ltr" /></FormField>
            <FormField label={t.description}><Input value={form.desc} onChange={e => setForm(p => ({ ...p, desc: e.target.value }))} /></FormField>
          </div>
          <DlgFooter onCancel={() => setEditRole(null)} onConfirm={handleUpdate} />
        </DialogContent>
      </Dialog>
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
              <TableCell className="pe-5 text-xs text-muted-foreground whitespace-nowrap text-end">{new Date(l.timestamp).toLocaleString(lang === 'ar' ? 'ar-SA' : 'en-US')}</TableCell>
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
                <p className="text-[10px] text-muted-foreground mt-1">{new Date(l.timestamp).toLocaleString(lang === 'ar' ? 'ar-SA' : 'en-US')}</p>
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
  const { t, lang } = useSA()
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
        <DialogContent className="max-w-md"><DialogHeader><DialogTitle>{t.sendNotifDlg}</DialogTitle></DialogHeader>
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
// PAGE 10: SYSTEM HEALTH (bilingual gauges)
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
                <p className="text-[11px] text-muted-foreground mt-0.5">{logSrc(l, lang)} — {new Date(l.timestamp).toLocaleString(lang === 'ar' ? 'ar-SA' : 'en-US')}</p>
              </div>
            </div>
          ))}</div>
        </CardContent>
      </Card>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════
// PAGE 11: SERVERS (bilingual regions, full CRUD)
// ════════════════════════════════════════════════════════════════
function ServersPage() {
  const { t, lang } = useSA()
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
        <DialogContent className="max-w-sm"><DialogHeader><DialogTitle>{t.addServerDlg}</DialogTitle></DialogHeader>
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
// PAGE 12: DATABASE (bilingual labels)
// ════════════════════════════════════════════════════════════════
function DatabasePage() {
  const { t, lang } = useSA()
  const [backups, setBackups] = useState<Backup[]>(BACKUPS)

  const handleBackup = () => {
    const b: Backup = { id: Date.now().toString(), date: new Date().toLocaleString(lang === 'ar' ? 'ar-SA' : 'en-US'), size: '2.4 GB', type: 'manual', status: 'active' }
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
// PAGE 13: SECURITY (bilingual countries)
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
// PAGE 14: SETTINGS
// ════════════════════════════════════════════════════════════════
function SettingsPage() {
  const { t, lang } = useSA()
  const [form, setForm] = useState({ platformName: 'BookFlow', supportEmail: 'support@bookflow.com', currency: 'SAR', timezone: 'Asia/Riyadh', maintenance: false, registration: true, maxTenants: '500', backupFreq: 'daily' })
  return (
    <div className="space-y-6">
      <PageTitle title={t.settingsTitle} action={<PrimaryBtn icon={Save} label={t.saveSettings} onClick={() => toast.success(t.settingsSaved)} />} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card className="border-0 shadow-sm"><CardHeader className="pb-3"><CardTitle className="text-sm sm:text-base font-semibold">{t.generalSettings}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <FormField label={t.platformName}><Input value={form.platformName} onChange={e => setForm(p => ({ ...p, platformName: e.target.value }))} /></FormField>
            <FormField label={t.supportEmail}><Input type="email" value={form.supportEmail} onChange={e => setForm(p => ({ ...p, supportEmail: e.target.value }))} dir="ltr" /></FormField>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <FormField label={t.currency}><Select value={form.currency} onValueChange={v => setForm(p => ({ ...p, currency: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="SAR">{lang === 'ar' ? 'ر.س' : 'SAR'}</SelectItem><SelectItem value="AED">{lang === 'ar' ? 'د.إ' : 'AED'}</SelectItem><SelectItem value="USD">{'$'}</SelectItem><SelectItem value="EGP">{lang === 'ar' ? 'ج.م' : 'EGP'}</SelectItem></SelectContent></Select></FormField>
              <FormField label={t.timezone}><Select value={form.timezone} onValueChange={v => setForm(p => ({ ...p, timezone: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Asia/Riyadh">{lang === 'ar' ? 'الرياض' : 'Riyadh'}</SelectItem><SelectItem value="Asia/Dubai">{lang === 'ar' ? 'دبي' : 'Dubai'}</SelectItem><SelectItem value="Africa/Cairo">{lang === 'ar' ? 'القاهرة' : 'Cairo'}</SelectItem></SelectContent></Select></FormField>
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
  sa_roles: RolesPage,
  sa_audit: AuditPage,
  sa_notifications: NotificationsPage,
  sa_reports: ReportsPage,
  sa_system: SystemPage,
  sa_servers: ServersPage,
  sa_database: DatabasePage,
  sa_security: SecurityPage,
  sa_settings: SettingsPage,
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