// ─── Email Validation (RFC 5322 compliant) ──────────────────────
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/

// Common disposable email domains
const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com', 'guerrillamail.com', 'tempmail.com', 'throwaway.email',
  'yopmail.com', 'sharklasers.com', 'guerrillamailblock.com', 'grr.la',
  'dispostable.com', 'harakirimail.com', 'jetable.org', 'kasmail.com',
  'maildrop.cc', 'mailnesia.com', 'tempail.com', 'tmpmail.net',
  'trashmail.com', 'wegwerfmail.com', '10minutemail.com', 'tempinbox.com',
  'mohmal.com', 'filzmail.com', 'incognitomail.org', 'nada.email',
  'mailsac.com', 'crazymailing.com', 'fakeinbox.com', 'tempmailaddress.com',
  'tempr.email', 'disposableemailaddresses.emailmiser.com', 'mailcatch.com',
  'mailexpire.com', 'meltmail.com', 'mytemp.email', 'nospam.ze.tc',
  'objectmail.com', 'proxymail.eu', 'rcpt.at', 'recode.me',
  'rmqkr.net', 'royal.net', 'safetymail.info', 'safetypost.de',
  's0ny.net', 'saynotospams.com', 'scbox.one', 'screeningmachine.com',
  'sms4free.net', 'snkmail.com', 'spamavert.com', 'spamgourmet.com',
  'spamherelots.com', 'tempmailo.com', 'uggsrock.com', 'mailforspam.com',
  'disposableaddress.com', 'emailigo.de', 'fakemailgenerator.com',
  'gettempmail.com', 'inboxkitten.com', 'mailtemp.info', 'mt2015.com',
  'neverbox.com', 'nomail.xl.cx', 'spamfree24.org', 'trashymail.com',
  'wegwerfmail.de', 'yopmail.fr', 'jetable.org', 'mailcatch.com',
])

export interface EmailValidation {
  valid: boolean
  error?: string
  errorAr?: string
  isDisposable?: boolean
  domain?: string
}

export function validateEmail(email: string, existingEmails: string[] = [], lang: 'ar' | 'en' = 'ar'): EmailValidation {
  const result: EmailValidation = { valid: true }

  if (!email || !email.trim()) {
    return { valid: false, error: 'Email is required', errorAr: 'البريد الإلكتروني مطلوب' }
  }

  const trimmed = email.trim().toLowerCase()

  // Basic format check
  if (!EMAIL_REGEX.test(trimmed)) {
    return { valid: false, error: 'Invalid email format', errorAr: 'صيغة البريد الإلكتروني غير صالحة' }
  }

  // Extract domain
  const domain = trimmed.split('@')[1]
  result.domain = domain

  // Domain format validation
  if (domain && !/^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/.test(domain)) {
    return { valid: false, error: 'Invalid domain', errorAr: 'النطاق غير صالح', domain }
  }

  // Disposable email detection
  if (domain && DISPOSABLE_DOMAINS.has(domain)) {
    result.isDisposable = true
    return { valid: false, error: 'Disposable emails are not allowed', errorAr: 'البريد المؤقت غير مسموح', domain, isDisposable: true }
  }

  // Duplicate check
  if (existingEmails.includes(trimmed)) {
    return { valid: false, error: 'Email already exists', errorAr: 'البريد الإلكتروني مستخدم بالفعل', domain }
  }

  return result
}

// ─── Password Validation ────────────────────────────────────────
export interface PasswordRequirement {
  id: string
  label: string
  labelAr: string
  met: boolean
  icon: string // 'check' | 'x'
}

export interface PasswordValidation {
  score: number // 0-6
  label: string
  labelAr: string
  color: string // tailwind bg color
  requirements: PasswordRequirement[]
  valid: boolean
}

export function validatePassword(password: string, confirmPassword?: string, lang: 'ar' | 'en' = 'ar'): PasswordValidation {
  const requirements: PasswordRequirement[] = [
    {
      id: 'length', label: 'At least 12 characters', labelAr: '12 حرف على الأقل',
      met: password.length >= 12, icon: password.length >= 12 ? 'check' : 'x',
    },
    {
      id: 'uppercase', label: 'One uppercase letter (A-Z)', labelAr: 'حرف كبير (A-Z)',
      met: /[A-Z]/.test(password), icon: /[A-Z]/.test(password) ? 'check' : 'x',
    },
    {
      id: 'lowercase', label: 'One lowercase letter (a-z)', labelAr: 'حرف صغير (a-z)',
      met: /[a-z]/.test(password), icon: /[a-z]/.test(password) ? 'check' : 'x',
    },
    {
      id: 'number', label: 'One number (0-9)', labelAr: 'رقم واحد (0-9)',
      met: /[0-9]/.test(password), icon: /[0-9]/.test(password) ? 'check' : 'x',
    },
    {
      id: 'special', label: 'One special character (!@#$...)', labelAr: 'حرف خاص (!@#$...)',
      met: /[^A-Za-z0-9]/.test(password), icon: /[^A-Za-z0-9]/.test(password) ? 'check' : 'x',
    },
    {
      id: 'confirm', label: 'Passwords match', labelAr: 'كلمتا المرور متطابقتان',
      met: !confirmPassword || password === confirmPassword, icon: !confirmPassword || password === confirmPassword ? 'check' : 'x',
    },
  ]

  const score = requirements.filter(r => r.met).length

  let label: string, labelAr: string, color: string
  if (score <= 1) { label = 'Very Weak'; labelAr = 'ضعيف جداً'; color = 'bg-red-500' }
  else if (score <= 2) { label = 'Weak'; labelAr = 'ضعيف'; color = 'bg-red-400' }
  else if (score <= 3) { label = 'Fair'; labelAr = 'متوسط'; color = 'bg-amber-500' }
  else if (score <= 4) { label = 'Good'; labelAr = 'جيد'; color = 'bg-sky-500' }
  else if (score === 5) { label = 'Strong'; labelAr = 'قوي'; color = 'bg-emerald-500' }
  else { label = 'Very Strong'; labelAr = 'قوي جداً'; color = 'bg-emerald-600' }

  const valid = requirements.slice(0, 5).every(r => r.met) // First 5 must be met (confirm is separate)

  return { score, label, labelAr, color, requirements, valid }
}

// ─── Phone Validation ───────────────────────────────────────────
export function validatePhone(phone: string, lang: 'ar' | 'en' = 'ar'): { valid: boolean; error?: string; errorAr?: string } {
  if (!phone || !phone.trim()) return { valid: true } // Optional field
  const trimmed = phone.trim()
  if (!/^[\+]?[\d\s\-\(\)]{7,15}$/.test(trimmed)) {
    return { valid: false, error: 'Invalid phone number', errorAr: 'رقم الهاتف غير صالح' }
  }
  return { valid: true }
}