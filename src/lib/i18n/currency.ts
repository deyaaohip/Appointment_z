import type { Locale, AppCurrency } from '@/types'

export const CURRENCIES: Record<AppCurrency, { symbol: string; name: { ar: string; en: string }; locale: string }> = {
  SAR: { symbol: 'ر.س', name: { ar: 'ريال سعودي', en: 'Saudi Riyal' }, locale: 'ar-SA' },
  AED: { symbol: 'د.إ', name: { ar: 'درهم إماراتي', en: 'UAE Dirham' }, locale: 'ar-AE' },
  KWD: { symbol: 'د.ك', name: { ar: 'دينار كويتي', en: 'Kuwaiti Dinar' }, locale: 'ar-KW' },
  BHD: { symbol: 'د.ب', name: { ar: 'دينار بحريني', en: 'Bahraini Dinar' }, locale: 'ar-BH' },
  QAR: { symbol: 'ر.ق', name: { ar: 'ريال قطري', en: 'Qatari Riyal' }, locale: 'ar-QA' },
  OMR: { symbol: 'ر.ع', name: { ar: 'ريال عُماني', en: 'Omani Rial' }, locale: 'ar-OM' },
  EGP: { symbol: 'ج.م', name: { ar: 'جنيه مصري', en: 'Egyptian Pound' }, locale: 'ar-EG' },
  USD: { symbol: '$', name: { ar: 'دولار أمريكي', en: 'US Dollar' }, locale: 'en-US' },
  EUR: { symbol: '€', name: { ar: 'يورو', en: 'Euro' }, locale: 'de-DE' },
  GBP: { symbol: '£', name: { ar: 'جنيه إسترليني', en: 'British Pound' }, locale: 'en-GB' },
}

export function formatCurrency(
  amount: number,
  currency: AppCurrency = 'SAR',
  locale: Locale = 'ar',
  options?: { minimumFractionDigits?: number; maximumFractionDigits?: number }
): string {
  const config = CURRENCIES[currency] || CURRENCIES.SAR
  const fmtLocale = locale === 'ar' ? config.locale : 'en-US'

  return new Intl.NumberFormat(fmtLocale, {
    style: 'currency',
    currency,
    minimumFractionDigits: options?.minimumFractionDigits ?? 0,
    maximumFractionDigits: options?.maximumFractionDigits ?? 2,
  }).format(amount)
}

export function getCurrencySymbol(currency: AppCurrency): string {
  return CURRENCIES[currency]?.symbol || currency
}

export function getCurrencyName(currency: AppCurrency, locale: Locale = 'ar'): string {
  return CURRENCIES[currency]?.name[locale] || currency
}

export function getCurrencyList(locale: Locale): { value: AppCurrency; label: string }[] {
  return Object.entries(CURRENCIES).map(([code, config]) => ({
    value: code as AppCurrency,
    label: `${config.name[locale]} (${config.symbol})`,
  }))
}
