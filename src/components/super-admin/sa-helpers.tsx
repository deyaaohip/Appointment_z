'use client'

import { type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Search, ArrowUp, ArrowDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { useT, type Lang } from './sa-i18n'
import { useAppStore } from '@/stores/app-store'

// ─── Animation variants ─────────────────────────────────────────
export const fade = { hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0, transition: { duration: 0.25 } } }

// ─── useSA: locale + isRTL + translations ──────────────────────
export function useSA() {
  const { locale } = useAppStore()
  const t = useT()
  const isRTL = locale === 'ar'
  const lang = (locale === 'ar' ? 'ar' : 'en') as Lang
  return { t, isRTL, locale, lang }
}

// ─── Status Badge ──────────────────────────────────────────────
const STATUS_MAP: Record<string, { cls: string; ar: string; en: string }> = {
  active:    { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800', ar: 'نشط', en: 'Active' },
  suspended: { cls: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800', ar: 'معلق', en: 'Suspended' },
  trial:     { cls: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800', ar: 'تجريبي', en: 'Trial' },
  inactive:  { cls: 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800/40 dark:text-gray-400', ar: 'غير نشط', en: 'Inactive' },
  paid:      { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400', ar: 'مدفوع', en: 'Paid' },
  pending:   { cls: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400', ar: 'معلق', en: 'Pending' },
  overdue:   { cls: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400', ar: 'متأخر', en: 'Overdue' },
  failed:    { cls: 'bg-red-50 text-red-600 border-red-200 dark:bg-red-950/40 dark:text-red-500', ar: 'فاشل', en: 'Failed' },
  healthy:   { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400', ar: 'سليم', en: 'Healthy' },
  warning:   { cls: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400', ar: 'تحذير', en: 'Warning' },
  critical:  { cls: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400', ar: 'حرج', en: 'Critical' },
}

export function StatusBadge({ status, locale }: { status: string; locale?: string }) {
  const s = STATUS_MAP[status]
  if (!s) return null
  const lang = (locale === 'en' ? 'en' : 'ar') as 'ar' | 'en'
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold leading-none ${s.cls}`}>{s[lang]}</span>
}

// ─── Log level dot + label ─────────────────────────────────────
const LOG_COLORS: Record<string, string> = {
  info: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-400',
  warn: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
  error: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
  success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
}

export function LogDot({ level }: { level: string }) {
  return <span className={`inline-flex h-2 w-2 rounded-full shrink-0 mt-1.5 ${LOG_COLORS[level] || ''}`} />
}

export function getLogLabel(level: string, t: ReturnType<typeof useT>): string {
  switch (level) {
    case 'info': return t.info
    case 'success': return t.success
    case 'warn': return t.warning
    case 'error': return t.error
    default: return level.toUpperCase()
  }
}

// ─── Page Title ────────────────────────────────────────────────
export function PageTitle({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
      <h2 className="text-xl sm:text-2xl font-bold tracking-tight">{title}</h2>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

// ─── Form Field ────────────────────────────────────────────────
export function FormField({ label, children }: { label: string; children: ReactNode }) {
  return <div className="space-y-2"><label className="text-sm font-medium text-foreground">{label}</label>{children}</div>
}

// ─── Toggle ────────────────────────────────────────────────────
export function Toggle({ on, onToggle, color }: { on: boolean; onToggle: () => void; color?: string }) {
  const { isRTL } = useSA()
  const bg = color === 'amber' ? (on ? 'bg-amber-500' : 'bg-muted') : (on ? 'bg-violet-600' : 'bg-muted')
  // In RTL, the toggle knob moves from right to left (opposite of LTR)
  const knobPos = isRTL
    ? (on ? '-translate-x-5' : '-translate-x-0.5')
    : (on ? 'translate-x-5' : 'translate-x-0.5')
  return (
    <div onClick={onToggle} role="switch" aria-checked={on} tabIndex={0} onKeyDown={e => e.key === 'Enter' && onToggle()} className={'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors cursor-pointer ' + bg}>
      <span className={'inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ' + knobPos} />
    </div>
  )
}

// ─── Confirm Dialog ────────────────────────────────────────────
export function ConfirmDialog({ open, onOpenChange, title, desc, onConfirm, danger }: {
  open: boolean; onOpenChange: (v: boolean) => void; title: string; desc: string; onConfirm: () => void; danger?: boolean
}) {
  const { t } = useSA()
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="text-base">{title}</DialogTitle>
          <DialogDescription className="text-sm leading-relaxed">{desc}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-3 sm:gap-0 pt-2">
          <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>{t.cancel}</Button>
          <Button className={`flex-1 ${danger ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-violet-600 hover:bg-violet-700 text-white'}`} onClick={() => { onConfirm(); onOpenChange(false) }}>{t.confirm}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── KPI Card ──────────────────────────────────────────────────
export function KpiCard({ icon: Icon, bg, label, value, sub, trend, delay = 0 }: {
  icon: React.ElementType; bg: string; label: string; value: string | number; sub?: string | null; trend?: number; delay?: number
}) {
  const { t, isRTL } = useSA()
  return (
    <motion.div variants={fade} initial="hidden" animate="visible" transition={{ delay }}>
      <Card className="overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1.5 min-w-0">
              <p className="text-xs text-muted-foreground font-medium">{label}</p>
              <p className="text-2xl font-bold tracking-tight">{value}</p>
              {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
            </div>
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${bg}`}>
              <Icon className="h-5 w-5 text-white" />
            </div>
          </div>
          {trend !== undefined && (
            <div className="flex items-center gap-1 mt-3 pt-3 border-t text-xs font-medium">
              {trend >= 0
                ? <><ArrowUp className="h-3.5 w-3.5 text-emerald-600" style={{ transform: isRTL ? 'scaleX(-1)' : undefined }} /><span className="text-emerald-600">+{trend}%</span></>
                : <><ArrowDown className="h-3.5 w-3.5 text-red-500" style={{ transform: isRTL ? 'scaleX(-1)' : undefined }} /><span className="text-red-500">{trend}%</span></>
              }
              <span className="text-muted-foreground ms-1">{t.comparedToLastMonth}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ─── Stat Card ─────────────────────────────────────────────────
export function StatCard({ icon: Icon, label, value, color }: {
  icon: React.ElementType; label: string; value: string; color: string
}) {
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${color}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] sm:text-xs text-muted-foreground font-medium">{label}</p>
            <p className="text-base sm:text-lg font-bold truncate">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Action Button ─────────────────────────────────────────────
export function ActionBtn({ icon: Icon, label, onClick, variant = 'ghost', danger }: {
  icon: React.ElementType; label?: string; onClick: () => void; variant?: 'ghost' | 'outline'; danger?: boolean
}) {
  return (
    <Button
      size={label ? 'sm' : 'icon'}
      variant={variant}
      className={`h-8 gap-1.5 text-xs ${danger ? 'text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30' : ''} ${!label ? 'w-8' : ''}`}
      onClick={onClick}
    >
      <Icon className="h-3.5 w-3.5" />
      {label && <span className="hidden sm:inline">{label}</span>}
    </Button>
  )
}

// ─── Primary Action Button (violet) ────────────────────────────
export function PrimaryBtn({ icon: Icon, label, onClick }: {
  icon: React.ElementType; label: string; onClick: () => void
}) {
  return (
    <Button className="gap-2 bg-violet-600 hover:bg-violet-700 text-white" onClick={onClick}>
      <Icon className="h-4 w-4" />{label}
    </Button>
  )
}

// ─── Empty State (table) ───────────────────────────────────────
export function EmptyRow({ colSpan }: { colSpan: number }) {
  const { t } = useSA()
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="h-40">
        <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
          <Search className="h-8 w-8 opacity-30" />
          <p className="text-sm font-medium">{t.noResults}</p>
        </div>
      </TableCell>
    </TableRow>
  )
}

// ─── Search Input ──────────────────────────────────────────────
export function SearchInput({ value, onChange, placeholder }: {
  value: string; onChange: (v: string) => void; placeholder: string
}) {
  const { isRTL } = useSA()
  return (
    <div className="relative flex-1 max-w-md">
      <Search className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground ${isRTL ? 'right-3' : 'left-3'}`} />
      <Input placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} className={isRTL ? 'pr-10 h-10' : 'pl-10 h-10'} />
    </div>
  )
}

// ─── Sortable Table Header ─────────────────────────────────────
export function SortableTH({ label, sortKey, currentSort, onSort, className = '', align }: {
  label: string; sortKey: string; currentSort?: { key: string; dir: 'asc' | 'desc' }; onSort: (key: string) => void; className?: string; align?: 'start' | 'end' | 'center'
}) {
  const isActive = currentSort?.key === sortKey
  const dir = isActive ? currentSort.dir : null
  return (
    <TableHead className={`ps-4 font-semibold text-xs uppercase tracking-wider cursor-pointer select-none hover:bg-muted/80 transition-colors ${align === 'end' ? 'text-end' : align === 'center' ? 'text-center' : ''} ${className}`} onClick={() => onSort(sortKey)}>
      <span className="inline-flex items-center gap-1">
        {label}
        {isActive && (
          dir === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
        )}
      </span>
    </TableHead>
  )
}

// ─── Pagination ────────────────────────────────────────────────
export function Pagination({ page, totalPages, onPageChange }: {
  page: number; totalPages: number; onPageChange: (p: number) => void
}) {
  const { t, isRTL } = useSA()
  if (totalPages <= 1) return null
  const Chevron = isRTL ? ChevronRight : ChevronLeft
  const ChevronReverse = isRTL ? ChevronLeft : ChevronRight
  return (
    <div className="flex items-center justify-between px-5 py-3 border-t bg-muted/20 text-xs text-muted-foreground">
      <span>{t.page} {page} / {totalPages}</span>
      <div className="flex items-center gap-1">
        <Button size="icon" variant="ghost" className="h-7 w-7" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          <Chevron className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="ghost" className="h-7 w-7" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
          <ChevronReverse className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

// ─── Table Footer ──────────────────────────────────────────────
export function TableFooter({ current, total, entity }: { current: number; total: number; entity: string }) {
  const { t } = useSA()
  return (
    <div className="border-t px-5 py-3 text-xs text-muted-foreground bg-muted/20">
      {t.showingOf.replace('{current}', String(current)).replace('{total}', String(total)).replace('{entity}', entity)}
    </div>
  )
}

// ─── Dialog Footer Buttons ─────────────────────────────────────
export function DlgFooter({ onCancel, onConfirm, confirmLabel, danger }: {
  onCancel: () => void; onConfirm: () => void; confirmLabel?: string; danger?: boolean
}) {
  const { t } = useSA()
  return (
    <DialogFooter className="pt-4 gap-3">
      <Button variant="outline" onClick={onCancel}>{t.cancel}</Button>
      <Button className={`${danger ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-violet-600 hover:bg-violet-700 text-white'}`} onClick={onConfirm}>
        {confirmLabel || t.save}
      </Button>
    </DialogFooter>
  )
}

// ─── Gauge color helper ────────────────────────────────────────
export function gaugeColor(v: number) {
  return v > 80 ? 'text-red-500' : v > 60 ? 'text-amber-500' : 'text-emerald-500'
}

// ─── Generic sort helper ───────────────────────────────────────
export function genericSort<T>(data: T[], key: string, dir: 'asc' | 'desc', locale: string): T[] {
  const sorted = [...data].sort((a, b) => {
    const av = a[key as keyof T]
    const bv = b[key as keyof T]
    if (typeof av === 'number' && typeof bv === 'number') return dir === 'asc' ? av - bv : bv - av
    const as = String(av ?? '')
    const bs = String(bv ?? '')
    return dir === 'asc' ? as.localeCompare(bs, locale === 'ar' ? 'ar' : 'en') : bs.localeCompare(as, locale === 'ar' ? 'ar' : 'en')
  })
  return sorted
}

// ─── Paginate helper ───────────────────────────────────────────
export function paginate<T>(data: T[], page: number, perPage: number): { items: T[]; totalPages: number } {
  const totalPages = Math.max(1, Math.ceil(data.length / perPage))
  const start = (page - 1) * perPage
  return { items: data.slice(start, start + perPage), totalPages }
}