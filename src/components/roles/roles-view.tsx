'use client'

import { authFetch } from '@/lib/auth-fetch'


import { useState, useMemo, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Loader2,
  Inbox,
  Search,
  Shield,
  ShieldCheck,
  Users,
  Star,
  Copy,
  Check,
} from 'lucide-react'

import { useAppStore } from '@/stores/app-store'
import { t, getDirection, type Locale } from '@/lib/i18n'
import type { PermissionMap, PermissionResource, PermissionAction } from '@/types'
import { toast } from '@/hooks/use-toast'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

// ─── Types ──────────────────────────────────────────────────────────────────

interface RoleRow {
  id: string
  name: string
  description: string | null
  isDefault: boolean
  permissions: string
  createdAt: string
  updatedAt: string
  _count?: { users: number }
}

interface RoleForm {
  name: string
  description: string
  isDefault: boolean
  permissions: PermissionMap
}

// ─── Constants ──────────────────────────────────────────────────────────────

const resources: { key: PermissionResource; icon: string }[] = [
  { key: 'dashboard', icon: '📊' },
  { key: 'bookings', icon: '📅' },
  { key: 'customers', icon: '👥' },
  { key: 'employees', icon: '🧑‍💼' },
  { key: 'services', icon: '✂️' },
  { key: 'branches', icon: '🏢' },
  { key: 'payments', icon: '💳' },
  { key: 'coupons', icon: '🏷️' },
  { key: 'reports', icon: '📈' },
  { key: 'notifications', icon: '🔔' },
  { key: 'roles', icon: '🛡️' },
  { key: 'settings', icon: '⚙️' },
  { key: 'audit_logs', icon: '📋' },
]

const actions: { key: PermissionAction; tKey: string }[] = [
  { key: 'view', tKey: 'permissionView' },
  { key: 'create', tKey: 'permissionCreate' },
  { key: 'edit', tKey: 'permissionEdit' },
  { key: 'delete', tKey: 'permissionDelete' },
  { key: 'export', tKey: 'permissionExport' },
  { key: 'manage', tKey: 'permissionManage' },
]

const resourceLabelsAr: Record<string, string> = {
  dashboard: 'لوحة التحكم',
  bookings: 'الحجوزات',
  customers: 'العملاء',
  employees: 'الموظفون',
  services: 'الخدمات',
  branches: 'الفروع',
  payments: 'المدفوعات',
  coupons: 'كوبونات الخصم',
  reports: 'التقارير',
  notifications: 'الإشعارات',
  roles: 'الأدوار',
  settings: 'الإعدادات',
  audit_logs: 'سجل العمليات',
}

const resourceLabelsEn: Record<string, string> = {
  dashboard: 'Dashboard',
  bookings: 'Bookings',
  customers: 'Customers',
  employees: 'Employees',
  services: 'Services',
  branches: 'Branches',
  payments: 'Payments',
  coupons: 'Coupons',
  reports: 'Reports',
  notifications: 'Notifications',
  roles: 'Roles',
  settings: 'Settings',
  audit_logs: 'Audit Logs',
}

const emptyPermissions: PermissionMap = {}
const emptyForm: RoleForm = {
  name: '',
  description: '',
  isDefault: false,
  permissions: { ...emptyPermissions },
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
}

const stagger = {
  visible: { transition: { staggerChildren: 0.06 } },
}

const roleColors = [
  'from-violet-500/10 to-purple-500/5 border-violet-500/20',
  'from-rose-500/10 to-pink-500/5 border-rose-500/20',
  'from-emerald-500/10 to-teal-500/5 border-emerald-500/20',
  'from-amber-500/10 to-orange-500/5 border-amber-500/20',
  'from-cyan-500/10 to-sky-500/5 border-cyan-500/20',
  'from-lime-500/10 to-green-500/5 border-lime-500/20',
]

// ─── Helpers ────────────────────────────────────────────────────────────────

function parsePermissions(json: string): PermissionMap {
  try {
    return JSON.parse(json) as PermissionMap
  } catch {
    return {}
  }
}

function permissionsCount(permissions: PermissionMap): number {
  let count = 0
  for (const resource of Object.values(permissions)) {
    for (const granted of Object.values(resource)) {
      if (granted) count++
    }
  }
  return count
}

function totalPermissionsCount(): number {
  return resources.length * actions.length
}

function initPermissions(): PermissionMap {
  const perms: PermissionMap = {}
  for (const r of resources) {
    perms[r.key] = {}
    for (const a of actions) {
      perms[r.key][a.key] = false
    }
  }
  return perms
}

// ─── Sub-Components ──────────────────────────────────────────────────────────

function CardsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-44 rounded-xl" />
      ))}
    </div>
  )
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function RolesView() {
  const { locale } = useAppStore()
  const queryClient = useQueryClient()
  const dir = getDirection(locale)
  const isAr = locale === 'ar'

  const resourceLabels = isAr ? resourceLabelsAr : resourceLabelsEn

  // ── State ──
  const [search, setSearch] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [form, setForm] = useState<RoleForm>(emptyForm)
  const [expandedRole, setExpandedRole] = useState<string | null>(null)

  // ── Queries ──
  const { data: rolesData, isLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const res = await authFetch('/api/roles')
      if (!res.ok) throw new Error('Failed to fetch roles')
      return res.json() as Promise<{ roles: RoleRow[] }>
    },
  })

  const roles = rolesData?.roles ?? []

  // ── Filtered ──
  const filtered = useMemo(() => {
    if (!search.trim()) return roles
    const q = search.toLowerCase()
    return roles.filter((r) => r.name.toLowerCase().includes(q))
  }, [roles, search])

  // ── Mutations ──
  const createMutation = useMutation({
    mutationFn: async (data: RoleForm) => {
      const res = await authFetch('/api/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          description: data.description || null,
          isDefault: data.isDefault,
          permissions: JSON.stringify(data.permissions),
        }),
      })
      if (!res.ok) throw new Error('Failed to create role')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      setCreateOpen(false)
      setForm(emptyForm)
      toast({ title: t(locale, 'roles', 'roleCreated') })
    },
    onError: () => {
      toast({ title: t(locale, 'common', 'error'), variant: 'destructive' })
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<RoleForm> }) => {
      const payload: Record<string, unknown> = {}
      if (data.name !== undefined) payload.name = data.name
      if (data.description !== undefined) payload.description = data.description || null
      if (data.isDefault !== undefined) payload.isDefault = data.isDefault
      if (data.permissions !== undefined) payload.permissions = JSON.stringify(data.permissions)

      const res = await authFetch(`/api/roles/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Failed to update role')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      setEditOpen(false)
      setSelectedId(null)
      setForm(emptyForm)
      toast({ title: t(locale, 'roles', 'roleUpdated') })
    },
    onError: () => {
      toast({ title: t(locale, 'common', 'error'), variant: 'destructive' })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await authFetch(`/api/roles/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete role')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      setDeleteOpen(false)
      setSelectedId(null)
      setExpandedRole(null)
      toast({ title: t(locale, 'roles', 'roleDeleted') })
    },
    onError: () => {
      toast({ title: t(locale, 'common', 'error'), variant: 'destructive' })
    },
  })

  // ── Handlers ──
  const openCreate = useCallback(() => {
    setForm({ ...emptyForm, permissions: initPermissions() })
    setCreateOpen(true)
  }, [])

  const openEdit = useCallback((role: RoleRow) => {
    setSelectedId(role.id)
    const parsed = parsePermissions(role.permissions)
    // Ensure all resources/actions exist
    const perms = initPermissions()
    for (const r of resources) {
      if (parsed[r.key]) {
        for (const a of actions) {
          perms[r.key][a.key] = !!parsed[r.key]?.[a.key]
        }
      }
    }
    setForm({
      name: role.name,
      description: role.description ?? '',
      isDefault: role.isDefault,
      permissions: perms,
    })
    setEditOpen(true)
  }, [])

  const openDelete = useCallback((id: string) => {
    setSelectedId(id)
    setDeleteOpen(true)
  }, [])

  const handleCreate = useCallback(() => {
    if (!form.name.trim()) return
    createMutation.mutate(form)
  }, [form, createMutation])

  const handleUpdate = useCallback(() => {
    if (!selectedId || !form.name.trim()) return
    updateMutation.mutate({ id: selectedId, data: form })
  }, [selectedId, form, updateMutation])

  const handleDelete = useCallback(() => {
    if (!selectedId) return
    deleteMutation.mutate(selectedId)
  }, [selectedId, deleteMutation])

  const togglePermission = useCallback(
    (resource: PermissionResource, action: PermissionAction) => {
      setForm((prev) => {
        const perms = { ...prev.permissions }
        perms[resource] = { ...perms[resource] }
        perms[resource][action] = !perms[resource]?.[action]
        return { ...prev, permissions: perms }
      })
    },
    []
  )

  const toggleResourceAll = useCallback(
    (resource: PermissionResource, granted: boolean) => {
      setForm((prev) => {
        const perms = { ...prev.permissions }
        perms[resource] = { ...perms[resource] }
        for (const a of actions) {
          perms[resource][a.key] = granted
        }
        return { ...prev, permissions: perms }
      })
    },
    []
  )

  const toggleAllPermissions = useCallback(
    (granted: boolean) => {
      setForm((prev) => {
        const perms = initPermissions()
        if (granted) {
          for (const r of resources) {
            for (const a of actions) {
              perms[r.key][a.key] = true
            }
          }
        }
        return { ...prev, permissions: perms }
      })
    },
    []
  )

  const cloneRole = useCallback(
    (role: RoleRow) => {
      const parsed = parsePermissions(role.permissions)
      const perms = initPermissions()
      for (const r of resources) {
        if (parsed[r.key]) {
          for (const a of actions) {
            perms[r.key][a.key] = !!parsed[r.key]?.[a.key]
          }
        }
      }
      setForm({
        name: `${role.name} (${isAr ? 'نسخة' : 'Copy'})`,
        description: role.description ?? '',
        isDefault: false,
        permissions: perms,
      })
      setCreateOpen(true)
    },
    [isAr]
  )

  const selectedRole = useMemo(
    () => roles.find((r) => r.id === selectedId),
    [roles, selectedId]
  )

  const isDialogOpen = createOpen || editOpen
  const isEditing = editOpen && !createOpen

  // ── Permission Matrix ──
  const PermissionMatrix = useMemo(() => {
    if (!isDialogOpen) return null

    return (
      <div className="space-y-1">
        {/* Select all row */}
        <div className="flex items-center gap-3 py-2 px-3 rounded-lg bg-muted/50">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Switch
              id="toggle-all-perms"
              checked={permissionsCount(form.permissions) === totalPermissionsCount()}
              onCheckedChange={toggleAllPermissions}
            />
            <Label htmlFor="toggle-all-perms" className="text-sm font-medium">
              {isAr ? 'تحديد الكل' : 'Select all'}
            </Label>
          </div>
          <div className="flex items-center gap-3 me-2">
            {actions.map((a) => (
              <span
                key={a.key}
                className="text-[11px] text-muted-foreground w-10 text-center hidden lg:block"
              >
                {t(locale, 'roles', a.tKey)}
              </span>
            ))}
          </div>
        </div>

        <ScrollArea className="max-h-72">
          <div className="space-y-0.5">
            {resources.map((resource) => {
              const resPerms = form.permissions[resource.key] ?? {}
              const allGranted = actions.every((a) => !!resPerms[a.key])
              const someGranted = actions.some((a) => !!resPerms[a.key])

              return (
                <div
                  key={resource.key}
                  className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-muted/30 transition-colors group"
                >
                  {/* Resource toggle */}
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Switch
                      id={`res-${resource.key}`}
                      checked={allGranted}
                      ref={(el) => {
                        if (el) {
                          (el as HTMLButtonElement).dataset.state = allGranted
                            ? 'checked'
                            : someGranted
                              ? 'indeterminate'
                              : 'unchecked'
                        }
                      }}
                      className={someGranted && !allGranted ? 'data-[state=indeterminate]:bg-primary/50' : ''}
                      onCheckedChange={(checked) =>
                        toggleResourceAll(resource.key, checked)
                      }
                    />
                    <Label
                      htmlFor={`res-${resource.key}`}
                      className="text-sm cursor-pointer flex items-center gap-2 min-w-0"
                    >
                      <span className="flex-shrink-0">{resource.icon}</span>
                      <span className="truncate">
                        {resourceLabels[resource.key] ?? resource.key}
                      </span>
                    </Label>
                  </div>

                  {/* Action toggles */}
                  <div className="flex items-center gap-1.5 me-1">
                    {actions.map((a) => (
                      <div
                        key={a.key}
                        className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-muted transition-colors"
                        title={`${resourceLabels[resource.key]} – ${t(locale, 'roles', a.tKey)}`}
                      >
                        <Switch
                          checked={!!resPerms[a.key]}
                          onCheckedChange={() =>
                            togglePermission(resource.key, a.key)
                          }
                          className="scale-75"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </ScrollArea>
      </div>
    )
  }, [isDialogOpen, form.permissions, locale, resourceLabels, togglePermission, toggleResourceAll, toggleAllPermissions])

  // ── Render ──
  return (
    <div dir={dir} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {t(locale, 'roles', 'title')}
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            {isAr
              ? `إدارة الأدوار وصلاحيات المستخدمين (${filtered.length})`
              : `Manage roles and user permissions (${filtered.length})`}
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          {t(locale, 'roles', 'newRole')}
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t(locale, 'common', 'search') + '...'}
          className="ps-9"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <CardsSkeleton />
      ) : filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          <div className="rounded-full bg-muted p-4 mb-4">
            <Inbox className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold">
            {t(locale, 'roles', 'noRolesFound')}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {isAr ? 'أنشئ أول دور للبدء' : 'Create your first role to get started'}
          </p>
        </motion.div>
      ) : (
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          <AnimatePresence mode="popLayout">
            {filtered.map((role, idx) => {
              const perms = parsePermissions(role.permissions)
              const pCount = permissionsCount(perms)
              const total = totalPermissionsCount()
              const isExpanded = expandedRole === role.id

              return (
                <motion.div
                  key={role.id}
                  variants={fadeUp}
                  layout
                  exit="exit"
                  transition={{ duration: 0.2 }}
                >
                  <Card
                    className={`group relative overflow-hidden border bg-gradient-to-br ${
                      roleColors[idx % roleColors.length]
                    } transition-shadow hover:shadow-md ${isExpanded ? 'ring-2 ring-primary/30' : ''}`}
                  >
                    <CardContent className="p-5 space-y-4">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex-shrink-0 rounded-lg bg-primary/10 p-2.5">
                            {role.isDefault ? (
                              <ShieldCheck className="h-5 w-5 text-primary" />
                            ) : (
                              <Shield className="h-5 w-5 text-primary/70" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-base truncate">
                                {role.name}
                              </h3>
                              {role.isDefault && (
                                <Badge
                                  variant="secondary"
                                  className="bg-amber-500/15 text-amber-700 dark:text-amber-400 text-[10px] px-1.5 py-0 flex-shrink-0"
                                >
                                  <Star className="h-2.5 w-2.5 me-0.5" />
                                  {t(locale, 'roles', 'isDefault')}
                                </Badge>
                              )}
                            </div>
                            {role.description && (
                              <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                                {role.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5" />
                          <span>
                            {role._count?.users ?? 0} {isAr ? 'مستخدم' : 'users'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Shield className="h-3.5 w-3.5" />
                          <span>
                            {pCount}/{total} {isAr ? 'صلاحية' : 'perms'}
                          </span>
                        </div>
                      </div>

                      {/* Permission summary bar */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{t(locale, 'roles', 'permissions')}</span>
                          <span className="tabular-nums">{pCount}/{total}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <motion.div
                            className="h-full rounded-full bg-primary/70"
                            initial={{ width: 0 }}
                            animate={{ width: `${total > 0 ? (pCount / total) * 100 : 0}%` }}
                            transition={{ duration: 0.6, ease: 'easeOut' }}
                          />
                        </div>
                      </div>

                      {/* Expanded: mini permission overview */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25 }}
                            className="overflow-hidden"
                          >
                            <Separator className="my-3" />
                            <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto">
                              {resources.map((res) => {
                                const rp = perms[res.key] ?? {}
                                const grantedCount = actions.filter((a) => !!rp[a.key]).length
                                const allGranted = grantedCount === actions.length
                                return (
                                  <div
                                    key={res.key}
                                    className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs ${
                                      allGranted
                                        ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                                        : grantedCount > 0
                                          ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
                                          : 'bg-muted text-muted-foreground'
                                    }`}
                                  >
                                    <span>{res.icon}</span>
                                    <span className="truncate">
                                      {resourceLabels[res.key]}
                                    </span>
                                    {allGranted && (
                                      <Check className="h-3 w-3 ms-auto flex-shrink-0" />
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Actions */}
                      <div className="flex items-center justify-between pt-2 border-t border-border/50">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs gap-1.5 h-8"
                          onClick={() =>
                            setExpandedRole(isExpanded ? null : role.id)
                          }
                        >
                          {isExpanded ? (
                            <>
                              <X className="h-3.5 w-3.5" />
                              {t(locale, 'common', 'close')}
                            </>
                          ) : (
                            <>
                              <Shield className="h-3.5 w-3.5" />
                              {t(locale, 'roles', 'permissions')}
                            </>
                          )}
                        </Button>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => cloneRole(role)}
                            title={t(locale, 'roles', 'cloneRole')}
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEdit(role)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => openDelete(role.id)}
                            disabled={role.isDefault}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </motion.div>
      )}

      {/* ── Create / Edit Dialog ── */}
      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setCreateOpen(false)
            setEditOpen(false)
            setSelectedId(null)
          }
        }}
      >
        <DialogContent className="sm:max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? t(locale, 'common', 'edit') : t(locale, 'roles', 'newRole')}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? t(locale, 'roles', 'permissions')
                : isAr
                  ? 'أدخل بيانات الدور والصلاحيات'
                  : 'Enter role details and permissions'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-5 py-2">
            {/* Name + Description */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>{t(locale, 'roles', 'roleName')}</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder={t(locale, 'roles', 'roleName')}
                />
              </div>
              <div className="grid gap-2">
                <Label>{t(locale, 'roles', 'roleDescription')}</Label>
                <Input
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                  placeholder={t(locale, 'roles', 'roleDescription')}
                />
              </div>
            </div>

            {/* Default toggle */}
            <div className="flex items-center gap-3">
              <Switch
                id="role-default"
                checked={form.isDefault}
                onCheckedChange={(checked) =>
                  setForm((f) => ({ ...f, isDefault: checked }))
                }
              />
              <Label htmlFor="role-default" className="flex items-center gap-1.5">
                <Star className="h-3.5 w-3.5 text-amber-500" />
                {t(locale, 'roles', 'setAsDefault')}
              </Label>
            </div>

            <Separator />

            {/* Permission Matrix */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">
                  {t(locale, 'roles', 'permissions')}
                </Label>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {permissionsCount(form.permissions)}/{totalPermissionsCount()}
                </span>
              </div>

              {/* Column headers (desktop) */}
              <div className="hidden lg:flex items-center gap-3 py-1.5 px-3">
                <div className="flex-1" />
                <div className="flex items-center gap-3 me-1">
                  {actions.map((a) => (
                    <span
                      key={a.key}
                      className="text-[11px] font-medium text-muted-foreground w-10 text-center uppercase"
                    >
                      {t(locale, 'roles', a.tKey)}
                    </span>
                  ))}
                </div>
              </div>

              {PermissionMatrix}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setCreateOpen(false)
                setEditOpen(false)
                setSelectedId(null)
              }}
            >
              {t(locale, 'common', 'cancel')}
            </Button>
            <Button
              onClick={isEditing ? handleUpdate : handleCreate}
              disabled={
                (isEditing ? updateMutation : createMutation).isPending ||
                !form.name.trim()
              }
            >
              {(isEditing ? updateMutation : createMutation).isPending && (
                <Loader2 className="h-4 w-4 animate-spin me-2" />
              )}
              {t(locale, 'common', 'save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Dialog ── */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isAr
                ? `حذف دور "${selectedRole?.name ?? ''}"؟`
                : `Delete role "${selectedRole?.name ?? ''}"?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedRole?.isDefault
                ? isAr
                  ? 'لا يمكن حذف الدور الافتراضي.'
                  : 'Cannot delete the default role.'
                : isAr
                  ? `هذا الدور مُعيّن لـ ${selectedRole?._count?.users ?? 0} مستخدم. هل أنت متأكد؟`
                  : `This role is assigned to ${selectedRole?._count?.users ?? 0} user(s). Are you sure?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel>{t(locale, 'common', 'cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending || !!selectedRole?.isDefault}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin me-2" />
              )}
              {t(locale, 'common', 'delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}