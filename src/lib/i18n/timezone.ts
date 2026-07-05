import type { Locale } from './index'

export type Timezone = string

export const POPULAR_TIMEZONES: { value: string; label: { ar: string; en: string }; offset: string }[] = [
  { value: 'Asia/Riyadh', label: { ar: 'الرياض (السعودية)', en: 'Riyadh (Saudi Arabia)' }, offset: 'UTC+3' },
  { value: 'Asia/Dubai', label: { ar: 'دبي (الإمارات)', en: 'Dubai (UAE)' }, offset: 'UTC+4' },
  { value: 'Asia/Kuwait', label: { ar: 'الكويت', en: 'Kuwait' }, offset: 'UTC+3' },
  { value: 'Asia/Bahrain', label: { ar: 'البحرين', en: 'Bahrain' }, offset: 'UTC+3' },
  { value: 'Asia/Qatar', label: { ar: 'قطر', en: 'Qatar' }, offset: 'UTC+3' },
  { value: 'Asia/Oman', label: { ar: 'عُمان', en: 'Oman' }, offset: 'UTC+4' },
  { value: 'Asia/Jerusalem', label: { ar: 'القدس', en: 'Jerusalem' }, offset: 'UTC+2' },
  { value: 'Asia/Amman', label: { ar: 'عمّان', en: 'Amman' }, offset: 'UTC+3' },
  { value: 'Asia/Beirut', label: { ar: 'بيروت', en: 'Beirut' }, offset: 'UTC+2' },
  { value: 'Africa/Cairo', label: { ar: 'القاهرة (مصر)', en: 'Cairo (Egypt)' }, offset: 'UTC+2' },
  { value: 'Europe/London', label: { ar: 'لندن (بريطانيا)', en: 'London (UK)' }, offset: 'UTC+0' },
  { value: 'Europe/Paris', label: { ar: 'باريس (فرنسا)', en: 'Paris (France)' }, offset: 'UTC+1' },
  { value: 'Europe/Berlin', label: { ar: 'برلين (ألمانيا)', en: 'Berlin (Germany)' }, offset: 'UTC+1' },
  { value: 'America/New_York', label: { ar: 'نيويورك (أمريكا)', en: 'New York (USA)' }, offset: 'UTC-5' },
  { value: 'America/Chicago', label: { ar: 'شيكاغو (أمريكا)', en: 'Chicago (USA)' }, offset: 'UTC-6' },
  { value: 'America/Los_Angeles', label: { ar: 'لوس أنجلوس (أمريكا)', en: 'Los Angeles (USA)' }, offset: 'UTC-8' },
  { value: 'Asia/Tokyo', label: { ar: 'طوكيو (اليابان)', en: 'Tokyo (Japan)' }, offset: 'UTC+9' },
  { value: 'Asia/Kolkata', label: { ar: 'نيودلهي (الهند)', en: 'New Delhi (India)' }, offset: 'UTC+5:30' },
  { value: 'Asia/Karachi', label: { ar: 'كراتشي (باكستان)', en: 'Karachi (Pakistan)' }, offset: 'UTC+5' },
  { value: 'Asia/Jakarta', label: { ar: 'جاكرتا (إندونيسيا)', en: 'Jakarta (Indonesia)' }, offset: 'UTC+7' },
]

export function getTimezoneLabel(tz: string, locale: Locale): string {
  const found = POPULAR_TIMEZONES.find((t) => t.value === tz)
  return found ? found.label[locale] : tz
}

export function formatInTimezone(
  date: Date | string,
  timezone: string,
  locale: Locale = 'ar',
  options?: Intl.DateTimeFormatOptions
): string {
  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) return '—'
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: timezone,
    ...(options || {}),
  }

  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SA' : 'en-US', defaultOptions).format(d)
}

export function getTimezoneOffset(timezone: string): string {
  const found = POPULAR_TIMEZONES.find((t) => t.value === timezone)
  return found ? found.offset : 'UTC'
}

export function convertTimezone(
  date: Date | string,
  fromTz: string,
  toTz: string,
  locale: Locale = 'ar'
): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const str = d.toLocaleString('en-US', { timeZone: fromTz })
  const localDate = new Date(str)
  return formatInTimezone(localDate, toTz, locale)
}
