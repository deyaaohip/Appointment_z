import { messages as ar } from './ar'
import { messages as en } from './en'

export type Locale = 'ar' | 'en'
export type Direction = 'rtl' | 'ltr'

const translations: Record<Locale, Record<string, Record<string, string>>> = { ar, en }

export function t(locale: Locale, namespace: string, key: string): string {
  return translations[locale]?.[namespace]?.[key] || `${namespace}.${key}`
}

export function getDirection(locale: Locale): Direction {
  return locale === 'ar' ? 'rtl' : 'ltr'
}

export function getOppositeLocale(locale: Locale): Locale {
  return locale === 'ar' ? 'en' : 'ar'
}

export function formatCurrency(amount: number, currency: string = 'SAR', locale: Locale = 'ar'): string {
  return new Intl.NumberFormat(locale === 'ar' ? 'ar-SA' : 'en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatDate(date: Date | string, locale: Locale = 'ar'): string {
  const d = new Date(date)
  if (isNaN(d.getTime())) return '—'
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SA' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(d)
}

export function formatDateTime(date: Date | string, locale: Locale = 'ar'): string {
  const d = new Date(date)
  if (isNaN(d.getTime())) return '—'
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SA' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

// Re-export timezone and currency modules
export { formatInTimezone, getTimezoneLabel, getTimezoneOffset, convertTimezone, POPULAR_TIMEZONES } from './timezone'
export type { Timezone } from './timezone'

export { formatCurrency as formatCurrencyAdvanced, getCurrencySymbol, getCurrencyName, getCurrencyList, CURRENCIES } from './currency'
export type { AppCurrency } from '@/types'