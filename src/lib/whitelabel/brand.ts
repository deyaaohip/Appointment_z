import type { AppCurrency, ThemeMode } from '@/types'

export interface BrandSettings {
  appName: string
  logo: string | null
  favicon: string | null
  primaryColor: string
  secondaryColor: string
  accentColor: string
  fontFamily: string
  theme: ThemeMode
  customDomain: string | null
  customEmail: string | null
  currency: AppCurrency
  timezone: string
  language: string
  dateFormat: string
  timeFormat: '12h' | '24h'
  weekStartDay: 0 | 1 | 6 // 0=Sunday, 1=Monday, 6=Saturday
  showPoweredBy: boolean
  customCss: string | null
  emailTemplateHeader: string | null
  emailTemplateFooter: string | null
  emailTemplateColors: {
    headerBg: string
    headerText: string
    bodyBg: string
    bodyText: string
    buttonBg: string
    buttonText: string
    footerBg: string
    footerText: string
  }
  metaTitle: string | null
  metaDescription: string | null
  ogImage: string | null
}

export const DEFAULT_BRAND: BrandSettings = {
  appName: 'BookFlow',
  logo: null,
  favicon: null,
  primaryColor: '#059669',
  secondaryColor: '#0d9488',
  accentColor: '#f59e0b',
  fontFamily: 'Cairo',
  theme: 'light',
  customDomain: null,
  customEmail: null,
  currency: 'SAR',
  timezone: 'Asia/Riyadh',
  language: 'ar',
  dateFormat: 'dd/MM/yyyy',
  timeFormat: '12h',
  weekStartDay: 6, // Saturday for Arabic
  showPoweredBy: true,
  customCss: null,
  emailTemplateHeader: null,
  emailTemplateFooter: null,
  emailTemplateColors: {
    headerBg: '#059669',
    headerText: '#ffffff',
    bodyBg: '#f9fafb',
    bodyText: '#1f2937',
    buttonBg: '#059669',
    buttonText: '#ffffff',
    footerBg: '#1f2937',
    footerText: '#9ca3af',
  },
  metaTitle: null,
  metaDescription: null,
  ogImage: null,
}

const BRAND_OVERRIDES: Record<string, Partial<BrandSettings>> = {}

export function getBrandSettings(tenantId?: string): BrandSettings {
  const base = { ...DEFAULT_BRAND }
  if (tenantId && BRAND_OVERRIDES[tenantId]) {
    return { ...base, ...BRAND_OVERRIDES[tenantId] }
  }
  return base
}

export function updateBrandSettings(tenantId: string, settings: Partial<BrandSettings>): BrandSettings {
  const current = getBrandSettings(tenantId)
  const updated = { ...current, ...settings }
  BRAND_OVERRIDES[tenantId] = settings
  return updated
}

export function generateEmailTemplate(
  brand: BrandSettings,
  content: string,
  options: { subject: string; preheader?: string }
): string {
  const { emailTemplateColors: colors } = brand
  return `<!DOCTYPE html>
<html dir="${brand.language === 'ar' ? 'rtl' : 'ltr'}" lang="${brand.language}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${options.subject}</title>
</head>
<body style="margin:0;padding:0;background:${colors.bodyBg};font-family:${brand.fontFamily},sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;">
    <tr>
      <td style="background:${colors.headerBg};padding:24px;text-align:center;">
        ${brand.logo ? `<img src="${brand.logo}" alt="${brand.appName}" style="max-height:48px;">` : `<h1 style="color:${colors.headerText};margin:0;font-size:24px;">${brand.appName}</h1>`}
      </td>
    </tr>
    ${brand.emailTemplateHeader ? `<tr><td style="padding:16px 24px 0;">${brand.emailTemplateHeader}</td></tr>` : ''}
    <tr>
      <td style="padding:32px 24px;color:${colors.bodyText};font-size:16px;line-height:1.6;">
        ${content}
      </td>
    </tr>
    ${brand.emailTemplateFooter ? `<tr><td style="padding:0 24px 16px;">${brand.emailTemplateFooter}</td></tr>` : ''}
    <tr>
      <td style="background:${colors.footerBg};padding:16px 24px;text-align:center;">
        <p style="color:${colors.footerText};margin:0;font-size:12px;">
          ${brand.showPoweredBy ? `Powered by ${brand.appName} &mdash; ` : ''}&copy; ${new Date().getFullYear()} ${brand.appName}. All rights reserved.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`
}
