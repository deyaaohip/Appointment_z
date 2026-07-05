'use client'

import { useEffect, useCallback, useMemo } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAppStore } from '@/stores/app-store'
import { getCanViewResources } from '@/lib/permissions'

/**
 * Central authorization hook.
 *
 * - On mount: if not authenticated or not in app mode, redirect to landing.
 * - If authenticated but no permissions: show unauthorized page.
 * - Returns the list of currently accessible view keys.
 */
export function useAuthorization() {
  const router = useRouter()
  const pathname = usePathname()
  const {
    isAuthenticated,
    appMode,
    subscription,
    navItems,
    isSuperAdmin,
    setAppMode,
    setCurrentView,
  } = useAppStore()

  // Redirect to landing if not in app mode
  useEffect(() => {
    if (appMode !== 'app') {
      setAppMode('landing')
      router.replace('/')
    }
  }, [appMode, setAppMode, router])

  // Redirect to unauthorized if authenticated but has no accessible views
  const accessibleViews = useMemo(() => getCanViewResources(subscription.permissions), [subscription.permissions])

  useEffect(() => {
    if (appMode !== 'app') return
    if (!isAuthenticated) return

    // If no views are accessible, show unauthorized
    if (accessibleViews.length === 0) {
      setCurrentView('unauthorized')
      return
    }

    // If current view is not accessible, redirect to first accessible
    if (currentView !== 'unauthorized' && !accessibleViews.includes(currentView)) {
      setCurrentView(accessibleViews[0])
    }
  }, [appMode, isAuthenticated, currentView, accessibleViews, setCurrentView])

  const isAuthorized = isAuthenticated && accessibleViews.length > 0

  const goTo = useCallback((view: string) => {
    setCurrentView(view)
  }, [setCurrentView])

  return { isAuthorized, accessibleViews, goTo, isSuperAdmin }
}