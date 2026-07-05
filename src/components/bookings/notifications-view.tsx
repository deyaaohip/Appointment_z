'use client'

import { authFetch } from '@/lib/auth-fetch'


import { useMemo, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell,
  BellOff,
  CheckCircle,
  Info,
  AlertTriangle,
  XCircle,
  Loader2,
  Inbox,
  CheckCheck,
} from 'lucide-react'

import { useAppStore } from '@/stores/app-store'
import { t, type Locale } from '@/lib/i18n'
import { toast } from '@/hooks/use-toast'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'

// ─── Types ──────────────────────────────────────────────────────────────────

interface NotificationRow {
  id: string
  title: string
  message: string
  type: 'info' | 'warning' | 'error' | 'success'
  channel: string
  isRead: boolean
  createdAt: string
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function getRelativeTime(dateStr: string, locale: Locale): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (minutes < 1) return locale === 'ar' ? 'الآن' : 'Just now'
  if (minutes < 60) return locale === 'ar' ? `منذ ${minutes} دقيقة` : `${minutes}m ago`
  if (hours < 24) return locale === 'ar' ? `منذ ${hours} ساعة` : `${hours}h ago`
  return locale === 'ar' ? `منذ ${days} يوم` : `${days}d ago`
}

function isToday(dateStr: string): boolean {
  const d = new Date(dateStr)
  const now = new Date()
  return d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()
}

function isYesterday(dateStr: string): boolean {
  const d = new Date(dateStr)
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  return d.getDate() === yesterday.getDate() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getFullYear() === yesterday.getFullYear()
}

function getTypeIcon(type: string) {
  switch (type) {
    case 'info': return Info
    case 'warning': return AlertTriangle
    case 'error': return XCircle
    case 'success': return CheckCircle
    default: return Bell
  }
}

function getTypeColor(type: string) {
  switch (type) {
    case 'info': return 'text-sky-500 bg-sky-50 dark:bg-sky-950/30'
    case 'warning': return 'text-amber-500 bg-amber-50 dark:bg-amber-950/30'
    case 'error': return 'text-red-500 bg-red-50 dark:bg-red-950/30'
    case 'success': return 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30'
    default: return 'text-gray-500 bg-gray-50 dark:bg-gray-950/30'
  }
}

function getTypeBg(type: string, isRead: boolean) {
  if (isRead) return 'bg-transparent hover:bg-muted/50'
  switch (type) {
    case 'info': return 'bg-sky-50/50 dark:bg-sky-950/10 hover:bg-sky-50 dark:hover:bg-sky-950/20'
    case 'warning': return 'bg-amber-50/50 dark:bg-amber-950/10 hover:bg-amber-50 dark:hover:bg-amber-950/20'
    case 'error': return 'bg-red-50/50 dark:bg-red-950/10 hover:bg-red-50 dark:hover:bg-red-950/20'
    case 'success': return 'bg-emerald-50/50 dark:bg-emerald-950/10 hover:bg-emerald-50 dark:hover:bg-emerald-950/20'
    default: return 'bg-muted/30 hover:bg-muted/50'
  }
}

// ─── Animation ──────────────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, x: 20 },
}

const stagger = {
  visible: { transition: { staggerChildren: 0.04 } },
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function NotificationsView() {
  const { locale } = useAppStore()
  const isAr = locale === 'ar'
  const queryClient = useQueryClient()

  // ── Queries ──
  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await authFetch('/api/notifications')
      if (!res.ok) throw new Error('Failed to fetch notifications')
      return res.json() as Promise<{ notifications: NotificationRow[]; unreadCount: number }>
    },
    refetchInterval: 30_000,
  })

  const notifications = data?.notifications ?? []
  const unreadCount = data?.unreadCount ?? 0

  // ── Mutations ──
  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await authFetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (!res.ok) throw new Error('Failed to mark as read')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
    onError: (err) => {
      toast({ title: err.message, variant: 'destructive' })
    },
  })

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const unread = notifications.filter((n) => !n.isRead)
      await Promise.all(
        unread.map((n) =>
          authFetch('/api/notifications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: n.id }),
          })
        )
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      toast({
        title: isAr ? 'تم تحديد الكل كمقروء' : 'All notifications marked as read',
        variant: 'default',
      })
    },
    onError: (err) => {
      toast({ title: err.message, variant: 'destructive' })
    },
  })

  const handleMarkRead = useCallback(
    (id: string) => {
      const n = notifications.find((x) => x.id === id)
      if (n && !n.isRead) markReadMutation.mutate(id)
    },
    [notifications, markReadMutation]
  )

  // ── Group notifications ──
  const groups = useMemo(() => {
    const todayItems: NotificationRow[] = []
    const yesterdayItems: NotificationRow[] = []
    const olderItems: NotificationRow[] = []

    for (const n of notifications) {
      if (isToday(n.createdAt)) todayItems.push(n)
      else if (isYesterday(n.createdAt)) yesterdayItems.push(n)
      else olderItems.push(n)
    }

    const result: { label: string; items: NotificationRow[] }[] = []
    if (todayItems.length > 0)
      result.push({ label: isAr ? 'اليوم' : 'Today', items: todayItems })
    if (yesterdayItems.length > 0)
      result.push({ label: isAr ? 'أمس' : 'Yesterday', items: yesterdayItems })
    if (olderItems.length > 0)
      result.push({ label: isAr ? 'سابقاً' : 'Older', items: olderItems })

    return result
  }, [notifications, isAr])

  // ── Skeleton ──
  if (isLoading) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">
            {t(locale, 'notifications', 'title')}
          </h1>
          {unreadCount > 0 && (
            <Badge className="bg-emerald-600 text-white hover:bg-emerald-700 text-xs px-2">
              {unreadCount}
            </Badge>
          )}
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
            className="border-emerald-600 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
          >
            {markAllReadMutation.isPending ? (
              <Loader2 className="h-4 w-4 me-2 animate-spin" />
            ) : (
              <CheckCheck className="h-4 w-4 me-2" />
            )}
            {t(locale, 'notifications', 'markAllRead')}
          </Button>
        )}
      </motion.div>

      {/* ── Empty State ── */}
      {notifications.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          <div className="rounded-full bg-emerald-50 dark:bg-emerald-950/30 p-4 mb-4">
            <BellOff className="h-10 w-10 text-emerald-500" />
          </div>
          <h3 className="text-lg font-semibold">{t(locale, 'notifications', 'noNotifications')}</h3>
          <p className="text-muted-foreground text-sm mt-1">
            {isAr ? 'ليس لديك أي إشعارات حالياً' : "You don't have any notifications right now"}
          </p>
        </motion.div>
      ) : (
        <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6">
          {groups.map((group) => (
            <div key={group.label} className="space-y-2">
              <motion.h3
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm font-semibold text-muted-foreground px-1"
              >
                {group.label} ({group.items.length})
              </motion.h3>

              <div className="space-y-1.5">
                <AnimatePresence mode="popLayout">
                  {group.items.map((notification) => {
                    const Icon = getTypeIcon(notification.type)
                    const iconColorClass = getTypeColor(notification.type)
                    const bgClass = getTypeBg(notification.type, notification.isRead)

                    return (
                      <motion.div
                        key={notification.id}
                        variants={fadeUp}
                        layout
                        exit="exit"
                        className={`flex items-start gap-3 p-4 rounded-xl cursor-pointer transition-colors duration-150 ${bgClass}`}
                        onClick={() => handleMarkRead(notification.id)}
                        whileHover={{ scale: 1.005 }}
                        whileTap={{ scale: 0.995 }}
                      >
                        {/* Icon */}
                        <div className={`rounded-lg p-2 flex-shrink-0 mt-0.5 ${iconColorClass}`}>
                          <Icon className="h-4 w-4" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4
                              className={`text-sm font-semibold leading-snug ${
                                notification.isRead ? 'text-muted-foreground' : ''
                              }`}
                            >
                              {notification.title}
                            </h4>
                            {!notification.isRead && (
                              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 flex-shrink-0 mt-1.5 animate-pulse" />
                            )}
                          </div>
                          <p
                            className={`text-sm mt-0.5 leading-relaxed ${
                              notification.isRead
                                ? 'text-muted-foreground/70'
                                : 'text-muted-foreground'
                            }`}
                          >
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground/60 mt-1.5">
                            {getRelativeTime(notification.createdAt, locale)}
                          </p>
                        </div>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </div>

              {group !== groups[groups.length - 1] && <Separator className="mt-4" />}
            </div>
          ))}
        </motion.div>
      )}
    </div>
  )
}