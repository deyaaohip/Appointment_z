// ═══════════════════════════════════════════════════════════════════
// White Label / Brand Settings
// ═══════════════════════════════════════════════════════════════════

export interface BrandSettings {
  // Identity
  appName: string
  appNameEn: string
  logo: string | null
  favicon: string | null

  // Domain
  customDomain: string | null

  // Colors
  primaryColor: string
  secondaryColor: string
  accentColor: string

  // Theme
  theme: 'light' | 'dark' | 'system'
  borderRadius: 'none' | 'sm' | 'md' | 'lg' | 'xl'

  // Email
  emailFromName: string
  emailFromAddress: string
  emailFooter: string

  // Misc
  currency: string
  timezone: string
  language: string
  dateFormat: string
  timeFormat: '12h' | '24h'
  weekStartsOn: 0 | 1 | 6  // 0=Sun, 1=Mon, 6=Sat
}

export const DEFAULT_BRAND: BrandSettings = {
  appName: 'BookFlow',
  appNameEn: 'BookFlow',
  logo: null,
  favicon: null,
  customDomain: null,
  primaryColor: '#059669',    // emerald-600
  secondaryColor: '#0d9488',  // teal-600
  accentColor: '#f59e0b',     // amber-500
  theme: 'system',
  borderRadius: 'lg',
  emailFromName: 'BookFlow',
  emailFromAddress: 'noreply@bookflow.sa',
  emailFooter: 'BookFlow SaaS Platform',
  currency: 'SAR',
  timezone: 'Asia/Riyadh',
  language: 'ar',
  dateFormat: 'DD/MM/YYYY',
  timeFormat: '12h',
  weekStartsOn: 0,
}

// Email template builder
export interface EmailTemplate {
  subject: { ar: string; en: string }
  body: { ar: string; en: string }
  type: 'transactional' | 'marketing' | 'notification'
}

export const EMAIL_TEMPLATES: Record<string, EmailTemplate> = {
  booking_confirmation: {
    subject: {
      ar: 'تأكيد الحجز - {{bookingId}}',
      en: 'Booking Confirmation - {{bookingId}}',
    },
    body: {
      ar: 'عزيزي {{customerName}}،\n\nتم تأكيد حجزك بنجاح.\n\nالخدمة: {{serviceName}}\nالتاريخ: {{date}}\nالوقت: {{time}}\n\nشكراً لاستخدامك {{appName}}.',
      en: 'Dear {{customerName}},\n\nYour booking has been confirmed.\n\nService: {{serviceName}}\nDate: {{date}}\nTime: {{time}}\n\nThank you for using {{appName}}.',
    },
    type: 'transactional',
  },
  booking_reminder: {
    subject: {
      ar: 'تذكير بحجزك - {{serviceName}}',
      en: 'Booking Reminder - {{serviceName}}',
    },
    body: {
      ar: 'عزيزي {{customerName}}،\n\nتذكير بحجزك القادم:\n\nالخدمة: {{serviceName}}\nالتاريخ: {{date}}\nالوقت: {{time}}\n\nللتعديل أو الإلغاء، يرجى التواصل معنا.',
      en: 'Dear {{customerName}},\n\nReminder for your upcoming booking:\n\nService: {{serviceName}}\nDate: {{date}}\nTime: {{time}}\n\nTo modify or cancel, please contact us.',
    },
    type: 'notification',
  },
  booking_cancelled: {
    subject: {
      ar: 'تم إلغاء الحجز - {{bookingId}}',
      en: 'Booking Cancelled - {{bookingId}}',
    },
    body: {
      ar: 'عزيزي {{customerName}}،\n\nتم إلغاء حجزك بنجاح.\n\nإذا كان هذا خطأ، يرجى التواصل معنا.',
      en: 'Dear {{customerName}},\n\nYour booking has been cancelled.\n\nIf this was a mistake, please contact us.',
    },
    type: 'transactional',
  },
  welcome: {
    subject: {
      ar: 'مرحباً بك في {{appName}}',
      en: 'Welcome to {{appName}}',
    },
    body: {
      ar: 'عزيزي {{name}}،\n\nمرحباً بك في {{appName}}!\n\nحسابك جاهز للاستخدام. يمكنك البدء بإضافة خدماتك وإنشاء حجوزاتك الأولى.',
      en: 'Dear {{name}},\n\nWelcome to {{appName}}!\n\nYour account is ready. You can start by adding your services and creating your first bookings.',
    },
    type: 'transactional',
  },
  password_reset: {
    subject: {
      ar: 'إعادة تعيين كلمة المرور',
      en: 'Password Reset',
    },
    body: {
      ar: 'عزيزي {{name}}،\n\nلإعادة تعيين كلمة المرور، اضغط على الرابط التالي:\n\n{{resetUrl}}\n\nينتهي هذا الرابط خلال ساعة.',
      en: 'Dear {{name}},\n\nTo reset your password, click the following link:\n\n{{resetUrl}}\n\nThis link expires in 1 hour.',
    },
    type: 'transactional',
  },
  payment_receipt: {
    subject: {
      ar: 'إيصال الدفع - {{transactionId}}',
      en: 'Payment Receipt - {{transactionId}}',
    },
    body: {
      ar: 'عزيزي {{customerName}}،\n\nتم استلام دفعتك بنجاح.\n\nالمبلغ: {{amount}}\nطريقة الدفع: {{method}}\nرقم العملية: {{transactionId}}',
      en: 'Dear {{customerName}},\n\nYour payment has been received.\n\nAmount: {{amount}}\nMethod: {{method}}\nTransaction ID: {{transactionId}}',
    },
    type: 'transactional',
  },
}

// Custom email template renderer
export function renderEmailTemplate(
  template: EmailTemplate,
  locale: Locale,
  variables: Record<string, string>
): { subject: string; body: string } {
  const lang = locale === 'ar' ? 'ar' : 'en'
  let subject = template.subject[lang]
  let body = template.body[lang]

  for (const [key, value] of Object.entries(variables)) {
    subject = subject.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value)
    body = body.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value)
  }

  return { subject, body }
}

import type { Locale } from '@/lib/i18n'