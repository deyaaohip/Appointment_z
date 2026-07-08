// ============================================================
// Subscription Hooks — useFeature, useSubscription, useLimits
// ============================================================
'use client'

import { useCallback, useMemo } from 'react'
import { useAppStore } from '@/stores/app-store'
import {
  type PlanDefinition,
  type FeatureId,
  type ModuleId,
  type PlanLimits,
  type Bilingual,
  getPlan,
  getPlanLimits,
  getPlanPermissions,
  planHasFeature,
  planHasModule,
  planHasPermission,
  isUpgrade,
  getNextPlan,
  getOrderedPlans,
  FEATURE_LABELS,
  LIMIT_LABELS,
  PLANS,
} from './plans'

// ─── useSubscription ───────────────────────────────────────
/** Returns the current active plan definition and helpers. */
export function useSubscription() {
  const { subscription, setSubscription, userPermissions, locale } = useAppStore()
  const planSlug = subscription.planSlug
  const plan = getPlan(planSlug)
  const lang = locale === 'ar' ? 'ar' : 'en'

  const isActive = subscription.isActive
  const status = subscription.status

  /** Change the active plan (after payment). Refreshes everything instantly. */
  const changePlan = useCallback(
    (newSlug: string) => {
      const newPlan = getPlan(newSlug)
      if (!newPlan) return

      // Update subscription in store — this triggers nav regeneration
      setSubscription({
        planSlug: newSlug,
        isActive: true,
        status: 'active',
        permissions: newPlan.permissions,
        endDate: '', // would be calculated from billing
      })
    },
    [setSubscription]
  )

  /** Upgrade to a higher plan. */
  const upgrade = useCallback(
    (newSlug: string) => {
      if (isUpgrade(planSlug, newSlug)) {
        changePlan(newSlug)
      }
    },
    [planSlug, changePlan]
  )

  /** Downgrade to a lower plan. Data is preserved. */
  const downgrade = useCallback(
    (newSlug: string) => {
      if (!isUpgrade(planSlug, newSlug) && planSlug !== newSlug) {
        changePlan(newSlug)
      }
    },
    [planSlug, changePlan]
  )

  /** Check if the current plan has a specific feature. */
  const hasFeature = useCallback(
    (featureId: FeatureId): boolean => {
      return planHasFeature(planSlug, featureId)
    },
    [planSlug]
  )

  /** Check if the current plan has a specific module (page). */
  const hasModule = useCallback(
    (moduleId: ModuleId): boolean => {
      return planHasModule(planSlug, moduleId)
    },
    [planSlug]
  )

  /** Check if the current plan has a specific permission. */
  const hasPermission = useCallback(
    (resource: string, action: string): boolean => {
      // If no permissions are loaded (demo mode), use plan permissions
      if (!userPermissions || Object.keys(userPermissions).length === 0) {
        return planHasPermission(planSlug, resource, action)
      }
      return userPermissions[resource]?.[action] ?? false
    },
    [planSlug, userPermissions]
  )

  /** Get the next higher plan (or null). */
  const nextPlan = getNextPlan(planSlug)

  /** Get all plans ordered by tier. */
  const allPlans = getOrderedPlans()

  return {
    plan,
    planSlug,
    isActive,
    status,
    lang,
    changePlan,
    upgrade,
    downgrade,
    hasFeature,
    hasModule,
    hasPermission,
    nextPlan,
    allPlans,
  }
}

// ─── useFeature ───────────────────────────────────────────
/** Convenience hook to check a single feature. */
export function useFeature(featureId: FeatureId): {
  enabled: boolean
  label: Bilingual
  planName: string | undefined
  locked: boolean
} {
  const { plan, hasFeature, planSlug } = useSubscription()
  const enabled = hasFeature(featureId)
  return {
    enabled,
    label: FEATURE_LABELS[featureId] || { ar: featureId, en: featureId },
    planName: plan?.name[useAppStore.getState().locale === 'ar' ? 'ar' : 'en'],
    locked: !enabled,
  }
}

// ─── useLimits ────────────────────────────────────────────
/** Returns current plan limits and a check function. */
export function useLimits() {
  const { planSlug, plan, hasFeature } = useSubscription()
  const limits = getPlanLimits(planSlug)

  /** Check if a usage limit would be exceeded.
   *  @param limitKey - The limit to check (e.g. 'maxCustomers')
   *  @param currentCount - Current count of items
   *  @returns { exceeded: boolean, limit: number, remaining: number }
   */
  const checkLimit = useCallback(
    (limitKey: keyof PlanLimits, currentCount: number) => {
      const limit = limits[limitKey]
      // -1 means unlimited
      if (limit === -1) {
        return { exceeded: false, limit: -1, remaining: -1 }
      }
      const remaining = limit - currentCount
      return { exceeded: remaining <= 0, limit, remaining }
    },
    [limits]
  )

  /** Validate before creating a new record.
   *  Returns { allowed: false, limit, remaining } if limit exceeded.
   *  Returns { allowed: true } if OK.
   */
  const validateCreate = useCallback(
    (
      limitKey: keyof PlanLimits,
      currentCount: number,
      requiredFeature?: FeatureId
    ) => {
      // First check if the feature is available
      if (requiredFeature && !hasFeature(requiredFeature)) {
        return {
          allowed: false,
          reason: 'feature' as const,
          limitKey,
          label: FEATURE_LABELS[requiredFeature],
        }
      }

      // Then check the usage limit
      const { exceeded, limit, remaining } = checkLimit(limitKey, currentCount)
      if (exceeded) {
        return {
          allowed: false,
          reason: 'limit' as const,
          limitKey,
          limit,
          remaining,
          label: LIMIT_LABELS[limitKey],
        }
      }

      return { allowed: true }
    },
    [checkLimit, hasFeature]
  )

  return { limits, checkLimit, validateCreate, plan }
}

// ─── usePlanComparison ────────────────────────────────────
/** Compare two plans to show what changes on upgrade. */
export function usePlanComparison(fromSlug: string, toSlug: string) {
  const from = getPlan(fromSlug)
  const to = getPlan(toSlug)
  if (!from || !to) return null

  const newModules = to.modules.filter((m) => !from.modules.includes(m))
  const removedModules = from.modules.filter((m) => !to.modules.includes(m))

  const newFeatures: FeatureId[] = []
  const removedFeatures: FeatureId[] = []
  for (const [key, val] of Object.entries(to.features)) {
    const fKey = key as FeatureId
    if (val && !from.features[fKey]) newFeatures.push(fKey)
    if (!val && from.features[fKey]) removedFeatures.push(fKey)
  }

  return {
    from,
    to,
    newModules,
    removedModules,
    newFeatures,
    removedFeatures,
    limitChanges: Object.entries(to.limits)
      .map(([key, val]) => ({
        key: key as keyof PlanLimits,
        label: LIMIT_LABELS[key as keyof PlanLimits],
        from: from.limits[key as keyof PlanLimits],
        to: val,
        improved: val > from.limits[key as keyof PlanLimits] || (val === -1 && from.limits[key as keyof PlanLimits] !== -1),
      }))
      .filter((c) => c.from !== c.to),
  }
}