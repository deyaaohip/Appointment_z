// ============================================================
// FeatureGate — Hides/shows UI based on subscription plan
// ============================================================
'use client'

import { type ReactNode } from 'react'
import { Lock, Crown } from 'lucide-react'
import { useFeature, useSubscription } from '@/lib/subscription/hooks'
import type { FeatureId, ModuleId, Bilingual } from '@/lib/subscription/plans'
import { useAppStore } from '@/stores/app-store'
import { FEATURE_LABELS } from '@/lib/subscription/plans'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import { getOrderedPlans } from '@/lib/subscription/plans'

// ─── FeatureGate ────────────────────────────────────────
/**
 * Conditionally renders children based on subscription feature.
 * If the feature is not available, renders a locked overlay or nothing.
 *
 * @example
 * <FeatureGate feature="whatsapp_reminders">
 *   <WhatsAppSettings />
 * </FeatureGate>
 *
 * <FeatureGate feature="export_reports" fallback={<UpgradeButton />}>
 *   <ExportButton />
 * </FeatureGate>
 */
export function FeatureGate({
  feature,
  children,
  fallback,
  showLock = true,
  className,
}: {
  feature: FeatureId
  children: ReactNode
  /** Custom element shown when feature is locked. Default: lock icon with tooltip. */
  fallback?: ReactNode
  /** Show a small lock badge on the children when locked. */
  showLock?: boolean
  className?: string
}) {
  const { enabled } = useFeature(feature)

  if (enabled) {
    return <div className={className}>{children}</div>
  }

  if (fallback) {
    return <div className={className}>{fallback}</div>
  }

  // Default: wrap children in a disabled container with a lock badge
  return (
    <div className={cn('relative', className)} onClick={(e) => e.preventDefault()}>
      <div className="pointer-events-none opacity-40 select-none">{children}</div>
      {showLock && (
        <div className="absolute inset-0 flex items-center justify-center">
          <button
            onClick={(e) => {
              e.stopPropagation()
              // Open upgrade dialog
              window.dispatchEvent(new CustomEvent('open-upgrade-dialog', { detail: { feature } }))
            }}
            className="flex items-center gap-1.5 rounded-lg bg-background/90 backdrop-blur-sm border px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors shadow-sm"
          >
            <Lock className="h-3.5 w-3.5" />
            <span>{FEATURE_LABELS[feature]?.[useAppStore.getState().locale === 'ar' ? 'ar' : 'en'] || feature}</span>
          </button>
        </div>
      )}
    </div>
  )
}

// ─── ModuleGate ──────────────────────────────────────────
/**
 * Conditionally renders children based on subscription module (page).
 * Used to block access to entire pages.
 */
export function ModuleGate({
  module,
  children,
}: {
  module: ModuleId
  children: ReactNode
}) {
  const { hasModule, planSlug, nextPlan } = useSubscription()
  const [showUpgrade, setShowUpgrade] = useState(false)
  const locale = useAppStore((s) => s.locale)
  const isRTL = locale === 'ar'

  if (hasModule(module)) {
    return <>{children}</>
  }

  // Module not available — show upgrade prompt
  return (
    <>
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-100 dark:bg-violet-900/30">
          <Crown className="h-8 w-8 text-violet-600 dark:text-violet-400" />
        </div>
        <h2 className="text-xl font-bold">
          {isRTL ? 'هذه الصفحة غير متاحة في خطتك الحالية' : 'This page is not available on your current plan'}
        </h2>
        <p className="text-sm text-muted-foreground max-w-md">
          {isRTL
            ? `هذه الميزة متاحة بدءاً من باقة "${nextPlan?.name.ar || ''}". قم بترقية اشتراكك للوصول إليها.`
            : `This feature is available starting from the "${nextPlan?.name.en || ''}" plan. Upgrade your subscription to access it.`}
        </p>
        <Button
          className="gap-2 bg-violet-600 hover:bg-violet-700 text-white"
          onClick={() => setShowUpgrade(true)}
        >
          <Crown className="h-4 w-4" />
          {isRTL ? 'ترقية الاشتراك' : 'Upgrade Subscription'}
        </Button>
      </div>
      <UpgradeDialog open={showUpgrade} onOpenChange={setShowUpgrade} currentPlan={planSlug} />
    </>
  )
}

// ─── UpgradePrompt ───────────────────────────────────────
/**
 * Inline component shown when a usage limit is reached.
 * Shows the limit info and an upgrade button.
 */
export function UpgradePrompt({
  limitLabel,
  currentCount,
  limit,
  featureId,
}: {
  limitLabel: Bilingual
  currentCount: number
  limit: number
  featureId?: FeatureId
}) {
  const [showUpgrade, setShowUpgrade] = useState(false)
  const { planSlug } = useSubscription()
  const locale = useAppStore((s) => s.locale)
  const isRTL = locale === 'ar'
  const label = isRTL ? limitLabel.ar : limitLabel.en

  return (
    <>
      <div className="flex items-center justify-between gap-3 rounded-xl border-2 border-dashed border-amber-300 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 p-4">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
            {isRTL ? 'تم بلوغ الحد الأقصى' : 'Limit Reached'}
          </p>
          <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
            {label}: {currentCount} / {limit === -1 ? (isRTL ? 'غير محدود' : 'Unlimited') : limit}
          </p>
        </div>
        <Button
          size="sm"
          className="gap-1.5 bg-violet-600 hover:bg-violet-700 text-white shrink-0"
          onClick={() => setShowUpgrade(true)}
        >
          <Crown className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{isRTL ? 'ترقية' : 'Upgrade'}</span>
        </Button>
      </div>
      <UpgradeDialog open={showUpgrade} onOpenChange={setShowUpgrade} currentPlan={planSlug} />
    </>
  )
}

// ─── UpgradeDialog ───────────────────────────────────────
/**
 * Modal dialog showing available plans for upgrade/downgrade.
 */
export function UpgradeDialog({
  open,
  onOpenChange,
  currentPlan,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  currentPlan: string
}) {
  const { upgrade, downgrade, changePlan, hasModule, hasFeature, planSlug } = useSubscription()
  const locale = useAppStore((s) => s.locale)
  const isRTL = locale === 'ar'
  const plans = getOrderedPlans()

  const handleSelect = (slug: string) => {
    changePlan(slug)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-violet-600" />
            {isRTL ? 'تغيير الاشتراك' : 'Change Subscription'}
          </DialogTitle>
          <DialogDescription>
            {isRTL
              ? 'اختر الباقة المناسبة لاحتياجاتك. الترقية تؤثر فوراً.'
              : 'Choose the plan that fits your needs. Upgrades take effect immediately.'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {plans.map((p) => {
            const isCurrent = p.slug === planSlug
            return (
              <button
                key={p.slug}
                onClick={() => !isCurrent && handleSelect(p.slug)}
                disabled={isCurrent}
                className={cn(
                  'relative flex flex-col rounded-xl border-2 p-4 text-start transition-all',
                  isCurrent
                    ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/20'
                    : 'border-border hover:border-violet-300 hover:bg-muted/50',
                  p.popular && 'ring-2 ring-violet-500 ring-offset-2'
                )}
              >
                {p.popular && (
                  <Badge className="absolute -top-2.5 start-3 bg-violet-600 text-white text-[10px]">
                    {isRTL ? 'الأكثر شعبية' : 'Most Popular'}
                  </Badge>
                )}
                {isCurrent && (
                  <Badge className="absolute -top-2.5 start-3 bg-emerald-600 text-white text-[10px]">
                    {isRTL ? 'الخطة الحالية' : 'Current Plan'}
                  </Badge>
                )}
                <p className="font-bold text-sm">{p.name[isRTL ? 'ar' : 'en']}</p>
                <p className="text-2xl font-extrabold mt-1">
                  {p.price === 0 ? (isRTL ? 'مجاني' : 'Free') : `${p.price}`}
                  {p.price > 0 && <span className="text-xs font-normal text-muted-foreground ms-1">{isRTL ? 'ر.س/شهر' : 'SAR/mo'}</span>}
                </p>
                <div className="mt-3 space-y-1">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase">
                    {isRTL ? 'الميزات:' : 'Features:'}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {p.modules.slice(0, 5).map((m) => (
                      <Badge key={m} variant="secondary" className="text-[9px] px-1.5 py-0">
                        {m}
                      </Badge>
                    ))}
                    {p.modules.length > 5 && (
                      <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
                        +{p.modules.length - 5}
                      </Badge>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        <DialogFooter className="pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {isRTL ? 'إلغاء' : 'Cancel'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── FeatureBadge ───────────────────────────────────────
/** Small badge showing a feature's status (available/locked). */
export function FeatureBadge({ feature }: { feature: FeatureId }) {
  const { enabled, label } = useFeature(feature)
  const locale = useAppStore((s) => s.locale)

  if (enabled) {
    return (
      <Badge variant="secondary" className="text-[10px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200">
        {locale === 'ar' ? 'متاح' : 'Available'}
      </Badge>
    )
  }

  return (
    <Badge variant="secondary" className="text-[10px] gap-1 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 cursor-pointer" onClick={() => window.dispatchEvent(new CustomEvent('open-upgrade-dialog', { detail: { feature } }))}>
      <Lock className="h-2.5 w-2.5" />
      {label[locale === 'ar' ? 'ar' : 'en']}
    </Badge>
  )
}

// ─── Listen for upgrade dialog events ────────────────────
// Components can dispatch: window.dispatchEvent(new CustomEvent('open-upgrade-dialog'))
// We provide a hook to listen for this:
export function useUpgradeDialogListener() {
  const { planSlug } = useSubscription()
  const [open, setOpen] = useState(false)

  if (typeof window !== 'undefined') {
    window.addEventListener('open-upgrade-dialog', () => setOpen(true))
  }

  return { open, setOpen, currentPlan: planSlug }
}