'use client'

import { authFetch } from '@/lib/auth-fetch'


import { useState, useMemo, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Check,
  X,
  Loader2,
  Crown,
  Users,
  UserCog,
  Building2,
  CalendarCheck,
  Package,
  HardDrive,
  Zap,
  Star,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  AlertTriangle,
} from 'lucide-react'
import { toast } from 'sonner'

import { useAppStore } from '@/stores/app-store'
import { t, formatCurrency, formatDate, getDirection } from '@/lib/i18n'

import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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

interface PlanInfo {
  id: string
  name: string
  slug: string
  price: number
  interval: string
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
  features: string[]
}

interface SubscriptionInfo {
  id: string
  status: string
  startDate: string
  endDate: string
  trialEndsAt: string | null
  lastBilledAt: string | null
  daysRemaining: number
}

interface UsageItem {
  current: number
  max: number
}

interface PlanCompareInfo {
  id: string
  name: string
  slug: string
  price: number
  interval: string
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
  features: string[]
}

interface BillingEntry {
  id: string
  date: string
  amount: number
  status: string
  method: string
}

interface SubscriptionResponse {
  plan: PlanInfo
  subscription: SubscriptionInfo
  usage: Record<string, UsageItem>
  plans: PlanCompareInfo[]
  billingHistory: BillingEntry[]
}

// ─── Animation Variants ──────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
}

const stagger = {
  visible: { transition: { staggerChildren: 0.06 } },
}

// ─── Feature comparison keys ─────────────────────────────────────────────────

const featureKeys = [
  { key: 'featureSms', field: 'hasSms' as const },
  { key: 'featureWhatsapp', field: 'hasWhatsapp' as const },
  { key: 'featureCalendarSync', field: 'hasCalendarSync' as const },
  { key: 'featureReports', field: 'hasReports' as const },
  { key: 'featureApiAccess', field: 'hasApiAccess' as const },
  { key: 'featureIntegrations', field: 'hasIntegrations' as const },
  { key: 'featureWhiteLabel', field: 'hasWhiteLabel' as const },
  { key: 'featureCustomDomain', field: 'hasCustomDomain' as const },
] as const

// ─── Plan display names ──────────────────────────────────────────────────────

const planNameMap: Record<string, { ar: string; en: string }> = {
  free: { ar: 'مجاني', en: 'Free' },
  starter: { ar: 'الأساسية', en: 'Starter' },
  professional: { ar: 'الاحترافية', en: 'Professional' },
  business: { ar: 'الأعمال', en: 'Business' },
  enterprise: { ar: 'المؤسسية', en: 'Enterprise' },
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getProgressColor(pct: number): string {
  if (pct >= 90) return '[&>div]:bg-red-500'
  if (pct >= 70) return '[&>div]:bg-amber-500'
  return '[&>div]:bg-emerald-500'
}

function getUsageIcon(key: string) {
  switch (key) {
    case 'users': return Users
    case 'employees': return UserCog
    case 'branches': return Building2
    case 'bookings': return CalendarCheck
    case 'services': return Package
    case 'storage': return HardDrive
    default: return Zap
  }
}

function getUsageLabelKey(key: string): string {
  switch (key) {
    case 'users': return 'maxUsers'
    case 'employees': return 'maxEmployees'
    case 'branches': return 'maxBranches'
    case 'bookings': return 'maxBookings'
    case 'services': return 'maxServices'
    case 'storage': return 'storage'
    default: return key
  }
}

function getPlanName(slug: string, locale: 'ar' | 'en'): string {
  return planNameMap[slug]?.[locale] || slug
}

const UNLIMITED = 999999

// ─── Component ──────────────────────────────────────────────────────────────

export default function SubscriptionsView() {
  const { locale } = useAppStore()
  const isAr = locale === 'ar'
  const dir = getDirection(locale)
  const queryClient = useQueryClient()

  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [downgradeDialogOpen, setDowngradeDialogOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState<{ slug: string; isDowngrade: boolean } | null>(null)

  // ── Query ──
  const { data, isLoading, isError } = useQuery({
    queryKey: ['subscriptions'],
    queryFn: async () => {
      const res = await authFetch('/api/subscriptions')
      if (!res.ok) throw new Error('Failed to fetch subscription')
      return res.json() as Promise<SubscriptionResponse>
    },
    retry: 1,
  })

  // ── Upgrade/Downgrade Mutation ──
  const planMutation = useMutation({
    mutationFn: async ({ planSlug }: { planSlug: string }) => {
      const res = await authFetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'upgrade', planSlug }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to change plan')
      }
      return res.json()
    },
    onSuccess: (_data, variables) => {
      const isDowngrade = pendingAction?.isDowngrade
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] })
      toast.success(
        isDowngrade
          ? t(locale, 'subscriptions', 'downgradeSuccess')
          : t(locale, 'subscriptions', 'upgradeSuccess')
      )
      setPendingAction(null)
    },
    onError: (error) => {
      const isDowngrade = pendingAction?.isDowngrade
      toast.error(
        isDowngrade
          ? t(locale, 'subscriptions', 'downgradeError')
          : t(locale, 'subscriptions', 'upgradeError')
      )
      setPendingAction(null)
    },
  })

  // ── Cancel Mutation ──
  const cancelMutation = useMutation({
    mutationFn: async () => {
      const res = await authFetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel' }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to cancel')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] })
      toast.success(t(locale, 'subscriptions', 'cancelSuccess'))
      setCancelDialogOpen(false)
    },
    onError: () => {
      toast.error(t(locale, 'subscriptions', 'cancelError'))
      setCancelDialogOpen(false)
    },
  })

  const plan = data?.plan
  const sub = data?.subscription
  const usage = data?.usage
  const allPlans = data?.plans || []
  const billingHistory = data?.billingHistory || []

  const currentSlug = plan?.slug || 'free'
  const currentPlanIndex = allPlans.findIndex((p) => p.slug === currentSlug)

  // ── Status helpers ──
  const statusColor = useMemo(() => {
    if (!sub) return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
    switch (sub.status) {
      case 'active':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
      case 'trialing':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
      case 'expired':
        return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
      case 'cancelled':
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
    }
  }, [sub])

  const statusLabel = useMemo(() => {
    if (!sub) return ''
    switch (sub.status) {
      case 'active': return isAr ? 'نشط' : 'Active'
      case 'trialing': return isAr ? 'تجريبي' : 'Trial'
      case 'expired': return isAr ? 'منتهي' : 'Expired'
      case 'cancelled': return isAr ? 'ملغي' : 'Cancelled'
      default: return sub.status
    }
  }, [sub, isAr])

  // ── Handlers ──
  const handlePlanClick = useCallback(
    (targetSlug: string) => {
      const targetIndex = allPlans.findIndex((p) => p.slug === targetSlug)
      if (targetIndex < 0) return

      const isDowngrade = targetIndex < currentPlanIndex
      const isCurrent = targetSlug === currentSlug

      if (isCurrent) return

      if (isDowngrade) {
        setPendingAction({ slug: targetSlug, isDowngrade: true })
        setDowngradeDialogOpen(true)
      } else {
        setPendingAction({ slug: targetSlug, isDowngrade: false })
        planMutation.mutate({ planSlug: targetSlug })
      }
    },
    [allPlans, currentSlug, currentPlanIndex, planMutation]
  )

  const handleConfirmDowngrade = useCallback(() => {
    if (pendingAction) {
      planMutation.mutate({ planSlug: pendingAction.slug })
      setDowngradeDialogOpen(false)
    }
  }, [pendingAction, planMutation])

  const handleCancelSubscription = useCallback(() => {
    cancelMutation.mutate()
  }, [cancelMutation])

  // ── Skeleton ──
  if (isLoading) {
    return (
      <div dir={dir} className="space-y-6 p-4 md:p-6">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-6 w-40" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-6 w-40" />
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-80 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-60 w-full rounded-xl" />
      </div>
    )
  }

  if (isError || !data || !plan || !sub) {
    return (
      <div dir={dir} className="flex flex-col items-center justify-center py-20 text-center">
        <div className="rounded-full bg-emerald-50 dark:bg-emerald-950/30 p-4 mb-4">
          <Crown className="h-10 w-10 text-emerald-500" />
        </div>
        <h3 className="text-lg font-semibold">
          {isAr ? 'لا توجد بيانات اشتراك' : 'No subscription data'}
        </h3>
      </div>
    )
  }

  return (
    <div dir={dir} className="space-y-8 p-4 md:p-6">
      {/* ── Header ── */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold tracking-tight">
          {t(locale, 'subscriptions', 'title')}
        </h1>
      </motion.div>

      {/* ── Current Plan Card ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <Card className="border-emerald-200 dark:border-emerald-800 bg-gradient-to-br from-emerald-50/50 via-white to-white dark:from-emerald-950/20 dark:via-background dark:to-background overflow-hidden relative">
          <div className="absolute top-0 start-0 w-1 h-full bg-emerald-500" />
          <CardContent className="p-6 ps-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="rounded-xl bg-emerald-100 dark:bg-emerald-900/40 p-3 mt-0.5">
                  <Crown className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-xl font-bold">{plan.name}</h2>
                    <Badge className={statusColor}>{statusLabel}</Badge>
                  </div>
                  <p className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-2">
                    {plan.price === 0
                      ? (isAr ? 'مجاني' : 'Free')
                      : `${formatCurrency(plan.price, 'SAR', locale)}`}
                    {plan.price > 0 && (
                      <span className="text-sm font-normal text-muted-foreground ms-1">
                        /{plan.interval === 'monthly' ? t(locale, 'subscriptions', 'monthly') : t(locale, 'subscriptions', 'yearly')}
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 lg:gap-6">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    {t(locale, 'subscriptions', 'startDate')}
                  </p>
                  <p className="text-sm font-medium">
                    {formatDate(sub.startDate, locale)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    {t(locale, 'subscriptions', 'endDate')}
                  </p>
                  <p className="text-sm font-medium">
                    {formatDate(sub.endDate, locale)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    {t(locale, 'subscriptions', 'daysRemaining')}
                  </p>
                  <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    {sub.daysRemaining}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Usage Section ── */}
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.1 }}
      >
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Zap className="h-5 w-5 text-emerald-500" />
          {t(locale, 'subscriptions', 'currentUsage')}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {usage &&
            (Object.entries(usage) as [string, UsageItem][]).map(([key, item]) => {
              const isUnlimited = item.max >= UNLIMITED
              const pct = isUnlimited ? 0 : item.max > 0 ? Math.round((item.current / item.max) * 100) : 0
              const Icon = getUsageIcon(key)
              return (
                <motion.div key={key} variants={fadeUp}>
                  <Card className="h-full">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/30 p-1.5">
                            <Icon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                          </div>
                          <span className="text-sm font-medium">
                            {t(locale, 'subscriptions', getUsageLabelKey(key))}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-baseline gap-1 mb-2">
                        <span className="text-2xl font-bold">{item.current}</span>
                        <span className="text-sm text-muted-foreground">
                          / {isUnlimited
                            ? t(locale, 'subscriptions', 'unlimited')
                            : item.max.toLocaleString(locale === 'ar' ? 'ar-SA' : 'en-US')}
                        </span>
                      </div>
                      {!isUnlimited && (
                        <>
                          <Progress
                            value={Math.min(pct, 100)}
                            className={`h-2 ${getProgressColor(pct)}`}
                          />
                          <p className="text-xs text-muted-foreground mt-1.5 text-end">
                            {pct}%
                          </p>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
        </div>
      </motion.div>

      {/* ── Plan Comparison Cards ── */}
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.15 }}
        className="space-y-6"
      >
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Star className="h-5 w-5 text-emerald-500" />
          {t(locale, 'subscriptions', 'comparePlans')}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 lg:gap-4">
          {allPlans.map((p) => {
            const isCurrent = p.slug === currentSlug
            const planIdx = allPlans.findIndex((x) => x.slug === p.slug)
            const isHigher = planIdx > currentPlanIndex
            const isLower = planIdx < currentPlanIndex && !isCurrent

            return (
              <motion.div key={p.slug} variants={fadeUp}>
                <Card
                  className={`h-full relative overflow-hidden transition-all duration-200 ${
                    isCurrent
                      ? 'border-2 border-emerald-500 shadow-lg shadow-emerald-500/10'
                      : p.slug === 'professional'
                        ? 'border-2 border-emerald-300 dark:border-emerald-700 shadow-md shadow-emerald-500/5'
                        : 'border-border/60 hover:border-emerald-200 dark:hover:border-emerald-800 hover:shadow-md'
                  }`}
                >
                  {isCurrent && (
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-400 to-emerald-600" />
                  )}
                  {!isCurrent && p.slug === 'professional' && (
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-400 to-emerald-400" />
                  )}

                  <CardHeader className="pb-2 pt-5 px-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">
                        {getPlanName(p.slug, locale)}
                      </CardTitle>
                      {isCurrent && (
                        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 text-[10px]">
                          {t(locale, 'subscriptions', 'current')}
                        </Badge>
                      )}
                      {p.slug === 'professional' && !isCurrent && (
                        <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 text-[10px]">
                          {t(locale, 'subscriptions', 'mostPopular')}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 px-4 pb-4 space-y-3">
                    <div>
                      <span className="text-2xl font-extrabold">
                        {p.price === 0
                          ? (isAr ? 'مجاني' : 'Free')
                          : `${formatCurrency(p.price, 'SAR', locale)}`}
                      </span>
                      {p.price > 0 && (
                        <span className="text-xs text-muted-foreground ms-1">
                          /{t(locale, 'subscriptions', 'monthly')}
                        </span>
                      )}
                    </div>

                    {/* Limits summary */}
                    <div className="space-y-1.5 text-xs text-muted-foreground">
                      <div className="flex justify-between">
                        <span>{t(locale, 'subscriptions', 'maxUsers')}</span>
                        <span className="font-medium text-foreground">
                          {p.maxUsers >= UNLIMITED ? t(locale, 'subscriptions', 'unlimited') : p.maxUsers}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>{t(locale, 'subscriptions', 'maxEmployees')}</span>
                        <span className="font-medium text-foreground">
                          {p.maxEmployees >= UNLIMITED ? t(locale, 'subscriptions', 'unlimited') : p.maxEmployees}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>{t(locale, 'subscriptions', 'maxBranches')}</span>
                        <span className="font-medium text-foreground">
                          {p.maxBranches >= UNLIMITED ? t(locale, 'subscriptions', 'unlimited') : p.maxBranches}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>{t(locale, 'subscriptions', 'maxServices')}</span>
                        <span className="font-medium text-foreground">
                          {p.maxServices >= UNLIMITED ? t(locale, 'subscriptions', 'unlimited') : p.maxServices}
                        </span>
                      </div>
                    </div>

                    <Separator />

                    <ul className="space-y-2">
                      {featureKeys.map((f) => {
                        const included = p[f.field]
                        return (
                          <li key={f.key} className="flex items-start gap-2 text-xs">
                            {included ? (
                              <Check className="h-3.5 w-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                            ) : (
                              <X className="h-3.5 w-3.5 text-muted-foreground/40 mt-0.5 flex-shrink-0" />
                            )}
                            <span className={included ? '' : 'text-muted-foreground/60'}>
                              {t(locale, 'subscriptions', f.key)}
                            </span>
                          </li>
                        )
                      })}
                    </ul>

                    {/* Action button */}
                    {isCurrent ? (
                      <Button
                        variant="outline"
                        className="w-full mt-2"
                        disabled
                      >
                        {t(locale, 'subscriptions', 'current')}
                      </Button>
                    ) : isHigher ? (
                      <Button
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white mt-2"
                        onClick={() => handlePlanClick(p.slug)}
                        disabled={planMutation.isPending}
                      >
                        {planMutation.isPending && pendingAction?.slug === p.slug ? (
                          <Loader2 className="h-4 w-4 me-2 animate-spin" />
                        ) : (
                          <ArrowUpRight className="h-4 w-4 me-2" />
                        )}
                        {t(locale, 'subscriptions', 'upgrade')}
                      </Button>
                    ) : isLower ? (
                      <Button
                        variant="outline"
                        className="w-full mt-2 border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-950/30"
                        onClick={() => handlePlanClick(p.slug)}
                        disabled={planMutation.isPending}
                      >
                        {planMutation.isPending && pendingAction?.slug === p.slug ? (
                          <Loader2 className="h-4 w-4 me-2 animate-spin" />
                        ) : (
                          <ArrowDownRight className="h-4 w-4 me-2" />
                        )}
                        {t(locale, 'subscriptions', 'downgrade')}
                      </Button>
                    ) : null}
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </motion.div>

      {/* ── Feature Comparison Table ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {isAr ? 'مقارنة تفصيلية بالمميزات' : 'Detailed Feature Comparison'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">
                      {t(locale, 'subscriptions', 'features')}
                    </TableHead>
                    {allPlans.map((p) => (
                      <TableHead key={p.slug} className="text-center min-w-[100px]">
                        <span className={p.slug === currentSlug ? 'text-emerald-600 dark:text-emerald-400 font-bold' : ''}>
                          {getPlanName(p.slug, locale)}
                        </span>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Feature rows */}
                  {featureKeys.map((f) => (
                    <TableRow key={f.key}>
                      <TableCell className="font-medium text-sm">
                        {t(locale, 'subscriptions', f.key)}
                      </TableCell>
                      {allPlans.map((p) => {
                        const isCurrentCol = p.slug === currentSlug
                        const included = p[f.field]
                        return (
                          <TableCell
                            key={p.slug}
                            className={`text-center ${isCurrentCol ? 'bg-emerald-50/50 dark:bg-emerald-950/20' : ''}`}
                          >
                            {included ? (
                              <Check className="h-4 w-4 text-emerald-500 mx-auto" />
                            ) : (
                              <X className="h-4 w-4 text-muted-foreground/40 mx-auto" />
                            )}
                          </TableCell>
                        )
                      })}
                    </TableRow>
                  ))}
                  {/* Limits rows */}
                  {[
                    { label: t(locale, 'subscriptions', 'maxUsers'), getValue: (p: PlanCompareInfo) => p.maxUsers },
                    { label: t(locale, 'subscriptions', 'maxEmployees'), getValue: (p: PlanCompareInfo) => p.maxEmployees },
                    { label: t(locale, 'subscriptions', 'maxBranches'), getValue: (p: PlanCompareInfo) => p.maxBranches },
                    { label: t(locale, 'subscriptions', 'maxBookings'), getValue: (p: PlanCompareInfo) => p.maxBookings },
                    { label: t(locale, 'subscriptions', 'maxServices'), getValue: (p: PlanCompareInfo) => p.maxServices },
                    { label: t(locale, 'subscriptions', 'maxStorage'), getValue: (p: PlanCompareInfo) => p.maxStorage },
                  ].map((row) => (
                    <TableRow key={row.label}>
                      <TableCell className="font-medium text-sm">{row.label}</TableCell>
                      {allPlans.map((p) => {
                        const val = row.getValue(p)
                        const isCurrentCol = p.slug === currentSlug
                        const isUnlimited = val >= UNLIMITED
                        return (
                          <TableCell
                            key={p.slug}
                            className={`text-center text-sm ${isCurrentCol ? 'bg-emerald-50/50 dark:bg-emerald-950/20' : ''}`}
                          >
                            {isUnlimited
                              ? t(locale, 'subscriptions', 'unlimited')
                              : val.toLocaleString(locale === 'ar' ? 'ar-SA' : 'en-US')}
                          </TableCell>
                        )
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Billing History ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Receipt className="h-5 w-5 text-emerald-500" />
              {t(locale, 'subscriptions', 'billingHistory')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {billingHistory.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Receipt className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">
                  {t(locale, 'subscriptions', 'noBillingHistory')}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t(locale, 'subscriptions', 'invoiceDate')}</TableHead>
                      <TableHead>{t(locale, 'subscriptions', 'invoiceAmount')}</TableHead>
                      <TableHead>{t(locale, 'subscriptions', 'invoiceStatus')}</TableHead>
                      <TableHead className="text-end">
                        {isAr ? 'طريقة الدفع' : 'Method'}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {billingHistory.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="text-sm">
                          {formatDate(item.date, locale)}
                        </TableCell>
                        <TableCell className="text-sm font-medium">
                          {formatCurrency(item.amount, 'SAR', locale)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={item.status === 'paid' ? 'default' : 'secondary'}
                            className={
                              item.status === 'paid'
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                                : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
                            }
                          >
                            {item.status === 'paid'
                              ? t(locale, 'subscriptions', 'invoicePaid')
                              : t(locale, 'subscriptions', 'invoicePending')}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-end text-sm text-muted-foreground">
                          {item.method}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Cancel Subscription Button ── */}
      {sub.status === 'active' && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex justify-end"
        >
          <Button
            variant="destructive"
            className="gap-2"
            onClick={() => setCancelDialogOpen(true)}
            disabled={cancelMutation.isPending}
          >
            {cancelMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <AlertTriangle className="h-4 w-4" />
            )}
            {t(locale, 'subscriptions', 'cancelSubscription')}
          </Button>
        </motion.div>
      )}

      {/* ── Cancel Confirmation Dialog ── */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t(locale, 'subscriptions', 'cancelConfirmTitle')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t(locale, 'subscriptions', 'cancelConfirmMessage')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelMutation.isPending}>
              {t(locale, 'common', 'cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelSubscription}
              disabled={cancelMutation.isPending}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {cancelMutation.isPending ? (
                <Loader2 className="h-4 w-4 me-2 animate-spin" />
              ) : null}
              {t(locale, 'subscriptions', 'confirmCancel')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Downgrade Confirmation Dialog ── */}
      <Dialog open={downgradeDialogOpen} onOpenChange={setDowngradeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isAr ? 'تأكيد تخفيض الخطة' : 'Confirm Plan Downgrade'}
            </DialogTitle>
            <DialogDescription>
              {isAr
                ? `هل أنت متأكد من تخفيض الخطة إلى ${pendingAction ? getPlanName(pendingAction.slug, locale) : ''}؟ قد تفقد الوصول إلى بعض المميزات الحالية.`
                : `Are you sure you want to downgrade to ${pendingAction ? getPlanName(pendingAction.slug, locale) : ''}? You may lose access to some current features.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDowngradeDialogOpen(false)}
              disabled={planMutation.isPending}
            >
              {t(locale, 'common', 'cancel')}
            </Button>
            <Button
              onClick={handleConfirmDowngrade}
              disabled={planMutation.isPending}
            >
              {planMutation.isPending && (
                <Loader2 className="h-4 w-4 me-2 animate-spin" />
              )}
              {t(locale, 'subscriptions', 'downgrade')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}