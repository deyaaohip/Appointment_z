// ═══════════════════════════════════════════════════════════════════
// Enhanced Localization
// Timezone · Currency · Multi-language Content · Dynamic Translations
// ═══════════════════════════════════════════════════════════════════

import type { Locale } from '@/lib/i18n'

// ─── Timezone Support ────────────────────────────────────────────

export const TIMEZONES = [
  { value: 'Asia/Riyadh', label: 'رياض (GMT+3)', labelEn: 'Riyadh (GMT+3)' },
  { value: 'Asia/Dubai', label: 'دبي (GMT+4)', labelEn: 'Dubai (GMT+4)' },
  { value: 'Asia/Kuwait', label: 'الكويت (GMT+3)', labelEn: 'Kuwait (GMT+3)' },
  { value: 'Asia/Qatar', label: 'قطر (GMT+3)', labelEn: 'Qatar (GMT+3)' },
  { value: 'Asia/Bahrain', label: 'البحرين (GMT+3)', labelEn: 'Bahrain (GMT+3)' },
  { value: 'Asia/Oman', label: 'عمان (GMT+4)', labelEn: 'Oman (GMT+4)' },
  { value: 'Africa/Cairo', label: 'القاهرة (GMT+2)', labelEn: 'Cairo (GMT+2)' },
  { value: 'Europe/London', label: 'لندن (GMT+0)', labelEn: 'London (GMT+0)' },
  { value: 'Europe/Paris', label: 'باريس (GMT+1)', labelEn: 'Paris (GMT+1)' },
  { value: 'America/New_York', label: 'نيويورك (GMT-5)', labelEn: 'New York (GMT-5)' },
  { value: 'America/Los_Angeles', label: 'لوس أنجلوس (GMT-8)', labelEn: 'Los Angeles (GMT-8)' },
  { value: 'Asia/Tokyo', label: 'طوكيو (GMT+9)', labelEn: 'Tokyo (GMT+9)' },
  { value: 'Asia/Kolkata', label: 'مومباي (GMT+5:30)', labelEn: 'Mumbai (GMT+5:30)' },
  { value: 'Australia/Sydney', label: 'سيدني (GMT+10)', labelEn: 'Sydney (GMT+10)' },
  { value: 'UTC', label: 'UTC', labelEn: 'UTC' },
] as const

export function formatInTimezone(
  date: Date | string,
  timezone: string,
  options?: Intl.DateTimeFormatOptions,
  locale: Locale = 'ar'
): string {
  const d = new Date(date)
  if (isNaN(d.getTime())) return '—'
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SA' : 'en-US', {
    timeZone: timezone,
    ...options,
  }).format(d)
}

export function getTimezoneOffset(timezone: string): number {
  const now = new Date()
  const utcDate = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }))
  const tzDate = new Date(now.toLocaleString('en-US', { timeZone: timezone }))
  return (tzDate.getTime() - utcDate.getTime()) / (1000 * 60)
}

// ─── Currency Support ────────────────────────────────────────────

export const CURRENCIES = [
  { code: 'SAR', symbol: 'ر.س', name: 'ريال سعودي', nameEn: 'Saudi Riyal', locale: 'ar-SA' },
  { code: 'AED', symbol: 'د.إ', name: 'درهم إماراتي', nameEn: 'UAE Dirham', locale: 'ar-AE' },
  { code: 'KWD', symbol: 'د.ك', name: 'دينار كويتي', nameEn: 'Kuwaiti Dinar', locale: 'ar-KW' },
  { code: 'QAR', symbol: 'ر.ق', name: 'ريال قطري', nameEn: 'Qatari Riyal', locale: 'ar-QA' },
  { code: 'BHD', symbol: 'د.ب', name: 'دينار بحريني', nameEn: 'Bahraini Dinar', locale: 'ar-BH' },
  { code: 'OMR', symbol: 'ر.ع', name: 'ريال عماني', nameEn: 'Omani Rial', locale: 'ar-OM' },
  { code: 'EGP', symbol: 'ج.م', name: 'جنيه مصري', nameEn: 'Egyptian Pound', locale: 'ar-EG' },
  { code: 'USD', symbol: '$', name: 'دولار أمريكي', nameEn: 'US Dollar', locale: 'en-US' },
  { code: 'EUR', symbol: '€', name: 'يورو', nameEn: 'Euro', locale: 'de-DE' },
  { code: 'GBP', symbol: '£', name: 'جنيه إسترليني', nameEn: 'British Pound', locale: 'en-GB' },
] as const

export function formatCurrencyWithSymbol(
  amount: number,
  currencyCode: string = 'SAR',
  locale: Locale = 'ar'
): string {
  const currency = CURRENCIES.find(c => c.code === currencyCode)
  if (!currency) return `${amount} ${currencyCode}`

  if (locale === 'ar') {
    return `${amount.toLocaleString('ar-SA', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ${currency.symbol}`
  }
  return `${currency.symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
}

// ─── Multi-language Content ──────────────────────────────────────

export interface LocalizedContent {
  ar: string
  en: string
}

export function getLocalizedValue(content: LocalizedContent | string, locale: Locale): string {
  if (typeof content === 'string') return content
  return content[locale] || content.ar || content.en || ''
}

export function createLocalizedContent(ar: string, en: string): LocalizedContent {
  return { ar, en }
}