'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import {
  Building2, User, CreditCard, CheckCircle2, ChevronLeft, ChevronRight,
  AlertCircle, Info, Eye, EyeOff, Loader2, Shield, Globe,
} from 'lucide-react'
import { useSA, useCurrency } from './sa-helpers'
import { useT, type Lang } from './sa-i18n'
import { PLANS } from './sa-data'

// ─── Types ───────────────────────────────────────────────────────
export interface TenantFormData {
  // Company
  nameAr: string
  nameEn: string
  email: string
  phone: string
  website: string
  country: string
  city: string
  industry: string
  // Owner
  ownerName: string
  ownerEmail: string
  ownerPhone: string
  password: string
  // Subscription
  plan: string
  billingCycle: 'monthly' | 'quarterly' | 'yearly'
  startDate: string
}

interface ValidationErrors {
  [key: string]: string
}

// ─── Constants ───────────────────────────────────────────────────
const DRAFT_KEY = 'bf_tenant_wizard_draft'

const COUNTRIES = [
  { ar: 'الأردن', en: 'Jordan', code: 'JO' },
  { ar: 'السعودية', en: 'Saudi Arabia', code: 'SA' },
  { ar: 'الإمارات', en: 'UAE', code: 'AE' },
  { ar: 'مصر', en: 'Egypt', code: 'EG' },
  { ar: 'الكويت', en: 'Kuwait', code: 'KW' },
  { ar: 'البحرين', en: 'Bahrain', code: 'BH' },
  { ar: 'قطر', en: 'Qatar', code: 'QA' },
  { ar: 'عمان', en: 'Oman', code: 'OM' },
  { ar: 'العراق', en: 'Iraq', code: 'IQ' },
  { ar: 'لبنان', en: 'Lebanon', code: 'LB' },
  { ar: 'المغرب', en: 'Morocco', code: 'MA' },
  { ar: 'تونس', en: 'Tunisia', code: 'TN' },
  { ar: 'الأردن', en: 'Palestine', code: 'PS' },
]

const INDUSTRIES_AR = ['طبي', 'تجميل وصالون', 'تعليم', 'لياقة بدنية', 'استشارات', 'تقنية', 'أخرى']
const INDUSTRIES_EN = ['Medical', 'Beauty & Salon', 'Education', 'Fitness', 'Consulting', 'Technology', 'Other']

const BILLING_CYCLES = [
  { value: 'monthly', ar: 'شهري', en: 'Monthly', multiplier: 1 },
  { value: 'quarterly', ar: 'ربع سنوي', en: 'Quarterly', multiplier: 3 },
  { value: 'yearly', ar: 'سنوي', en: 'Yearly', multiplier: 12 },
] as const

const EMPTY_FORM: TenantFormData = {
  nameAr: '', nameEn: '', email: '', phone: '', website: '', country: '', city: '', industry: '',
  ownerName: '', ownerEmail: '', ownerPhone: '', password: '',
  plan: 'Starter', billingCycle: 'monthly', startDate: new Date().toISOString().split('T')[0],
}

// ─── Password Strength ───────────────────────────────────────────
function getPasswordStrength(pw: string): { score: number; label: string; color: string; labelEn: string } {
  if (!pw) return { score: 0, label: '', color: '', labelEn: '' }
  let score = 0
  if (pw.length >= 6) score++
  if (pw.length >= 10) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  if (score <= 1) return { score: 1, label: 'ضعيف', color: 'bg-red-500', labelEn: 'Weak' }
  if (score <= 2) return { score: 2, label: 'متوسط', color: 'bg-amber-500', labelEn: 'Fair' }
  if (score <= 3) return { score: 3, label: 'جيد', color: 'bg-sky-500', labelEn: 'Good' }
  if (score <= 4) return { score: 4, label: 'قوي', color: 'bg-emerald-500', labelEn: 'Strong' }
  return { score: 5, label: 'قوي جداً', color: 'bg-emerald-600', labelEn: 'Very Strong' }
}

// ─── Searchable Select ───────────────────────────────────────────
function SearchableSelect({
  options, value, onChange, placeholder, isRTL,
}: {
  options: { ar: string; en: string; code: string }[]
  value: string
  onChange: (v: string) => void
  placeholder: string
  isRTL: boolean
}) {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const filtered = useMemo(() => {
    if (!search) return options
    const q = search.toLowerCase()
    return options.filter(o => o.ar.includes(q) || o.en.toLowerCase().includes(q) || o.code.toLowerCase().includes(q))
  }, [search, options])

  const selected = options.find(o => o.code === value)

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(!open)} className="flex items-center justify-between w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
        <span className={selected ? '' : 'text-muted-foreground'}>
          {selected ? (isRTL ? selected.ar : selected.en) : placeholder}
        </span>
        <ChevronLeft className={`h-4 w-4 text-muted-foreground shrink-0 ${isRTL ? '' : 'rotate-180'}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.15 }} className="absolute z-50 mt-1 w-full rounded-md border bg-popover p-1 shadow-md max-h-56 overflow-hidden flex flex-col">
            <div className="p-1 border-b mb-1">
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder={isRTL ? 'بحث...' : 'Search...'} className="h-8 text-xs" dir={isRTL ? 'rtl' : 'ltr'} />
            </div>
            <div className="overflow-y-auto flex-1">
              {filtered.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">{isRTL ? 'لا توجد نتائج' : 'No results'}</p>
              ) : filtered.map(o => (
                <button key={o.code} type="button" onClick={() => { onChange(o.code); setOpen(false); setSearch('') }}
                  className={`w-full text-start px-2 py-1.5 text-sm rounded-sm hover:bg-accent transition-colors ${value === o.code ? 'bg-accent font-medium' : ''}`}>
                  <span>{isRTL ? o.ar : o.en}</span>
                  <span className="text-xs text-muted-foreground ms-2">({o.code})</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Step Indicator ──────────────────────────────────────────────
function StepIndicator({ current, total, isRTL, labels }: { current: number; total: number; isRTL: boolean; labels: string[] }) {
  return (
    <div className="flex items-center justify-between mb-6 px-2">
      {labels.map((label, i) => (
        <div key={i} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center gap-1.5">
            <div className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition-all duration-300 shrink-0 ${
              i < current ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/25' :
              i === current ? 'bg-violet-600 text-white shadow-sm shadow-violet-600/25' :
              'bg-muted text-muted-foreground'
            }`}>
              {i < current ? <CheckCircle2 className="h-4.5 w-4.5" /> : <span>{i + 1}</span>}
            </div>
            <span className={`text-[10px] font-medium text-center leading-tight max-w-[70px] hidden sm:block ${
              i <= current ? 'text-foreground' : 'text-muted-foreground'
            }`}>{label}</span>
          </div>
          {i < total - 1 && (
            <div className={`flex-1 h-0.5 mx-2 sm:mx-3 rounded-full transition-colors duration-300 ${
              i < current ? 'bg-emerald-500' : 'bg-muted'
            }`} />
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Field Error ─────────────────────────────────────────────────
function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null
  return (
    <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-[11px] text-red-500 mt-1 flex items-center gap-1">
      <AlertCircle className="h-3 w-3 shrink-0" />{msg}
    </motion.p>
  )
}

// ─── Tooltip ─────────────────────────────────────────────────────
function FieldTooltip({ text }: { text: string }) {
  const [show, setShow] = useState(false)
  return (
    <span className="relative inline-flex" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
      <AnimatePresence>
        {show && (
          <motion.span initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            className="absolute bottom-full mb-1.5 start-1/2 -translate-x-1/2 w-48 rounded-lg bg-foreground text-background text-[11px] leading-relaxed p-2.5 shadow-lg z-50 text-center">
            {text}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  )
}

// ─── Validation Logic ────────────────────────────────────────────
function validateStep(step: number, form: TenantFormData, t: ReturnType<typeof useT>, lang: Lang, existingEmails: string[], existingNames: string[]): ValidationErrors {
  const errors: ValidationErrors = {}
  const isRTL = lang === 'ar'
  const req = (field: string) => isRTL ? `حقل "${field}" مطلوب` : `"${field}" is required`
  const validEmail = isRTL ? 'بريد إلكتروني غير صالح' : 'Invalid email address'
  const validPhone = isRTL ? 'رقم هاتف غير صالح' : 'Invalid phone number'
  const dup = (field: string) => isRTL ? `${field} مستخدم بالفعل` : `${field} already exists`
  const minPw = isRTL ? 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' : 'Password must be at least 8 characters'

  if (step === 0) {
    if (!form.nameAr.trim()) errors.nameAr = req(isRTL ? 'الاسم بالعربي' : 'Arabic Name')
    if (!form.nameEn.trim()) errors.nameEn = req(isRTL ? 'الاسم بالإنجليزي' : 'English Name')
    if (!form.email.trim()) errors.email = req(isRTL ? 'البريد الإلكتروني' : 'Email')
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = validEmail
    else if (existingEmails.includes(form.email.toLowerCase().trim())) errors.email = dup(isRTL ? 'البريد الإلكتروني' : 'Email')
    if (form.phone && !/^[\+]?[\d\s\-\(\)]{7,15}$/.test(form.phone)) errors.phone = validPhone
    if (form.website && !/^https?:\/\/.+/.test(form.website) && !/^[a-zA-Z0-9].*\..+/.test(form.website)) errors.website = isRTL ? 'رابط غير صالح' : 'Invalid URL'
  }

  if (step === 1) {
    if (!form.ownerName.trim()) errors.ownerName = req(isRTL ? 'اسم المالك' : 'Owner Name')
    if (!form.ownerEmail.trim()) errors.ownerEmail = req(isRTL ? 'بريد المالك' : 'Owner Email')
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.ownerEmail)) errors.ownerEmail = validEmail
    if (form.ownerPhone && !/^[\+]?[\d\s\-\(\)]{7,15}$/.test(form.ownerPhone)) errors.ownerPhone = validPhone
    if (form.password && form.password.length < 8) errors.password = minPw
  }

  if (step === 2) {
    if (!form.plan) errors.plan = req(isRTL ? 'الباقة' : 'Plan')
  }

  return errors
}

// ════════════════════════════════════════════════════════════════
// MAIN WIZARD COMPONENT
// ════════════════════════════════════════════════════════════════
export function TenantWizard({
  open,
  onClose,
  onSave,
  existingTenants,
}: {
  open: boolean
  onClose: () => void
  onSave: (data: TenantFormData) => void
  existingTenants: { email: string; name: string; nameEn: string }[]
}) {
  const { t, isRTL, lang } = useSA()
  const { sym } = useCurrency()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<TenantFormData>(EMPTY_FORM)
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [hasDraft, setHasDraft] = useState(false)
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout>>()

  const existingEmails = useMemo(() => existingTenants.map(t => t.email.toLowerCase()), [existingTenants])
  const existingNames = useMemo(() => [...existingTenants.map(t => t.name), ...existingTenants.map(t => t.nameEn)], [existingTenants])

  // Step labels
  const stepLabels = useMemo(() => [
    isRTL ? 'الشركة' : 'Company',
    isRTL ? 'المالك' : 'Owner',
    isRTL ? 'الاشتراك' : 'Subscription',
    isRTL ? 'مراجعة' : 'Review',
  ], [isRTL])

  // Load draft
  useEffect(() => {
    if (open) {
      try {
        const draft = localStorage.getItem(DRAFT_KEY)
        if (draft) { setForm(JSON.parse(draft)); setHasDraft(true) }
        else { setForm(EMPTY_FORM) }
      } catch { setForm(EMPTY_FORM) }
      setStep(0); setErrors({}); setTouched({})
    }
  }, [open])

  // Auto-save draft
  const saveDraft = useCallback((data: TenantFormData) => {
    clearTimeout(autoSaveTimer.current)
    autoSaveTimer.current = setTimeout(() => {
      try { localStorage.setItem(DRAFT_KEY, JSON.stringify(data)); setHasDraft(true) } catch {}
    }, 500)
  }, [])

  // Update field with validation
  const updateField = useCallback((field: keyof TenantFormData, value: string) => {
    setForm(prev => {
      const updated = { ...prev, [field]: value }
      saveDraft(updated)
      return updated
    })
    setTouched(prev => ({ ...prev, [field]: true }))
    // Clear error on change
    setErrors(prev => { const n = { ...prev }; delete n[field]; return n })
  }, [saveDraft])

  // Validate current step
  const validateCurrentStep = useCallback((): boolean => {
    const errs = validateStep(step, form, t, lang, existingEmails, existingNames)
    // Mark all fields in current step as touched
    const stepFields: string[][] = [
      ['nameAr', 'nameEn', 'email', 'phone', 'website', 'country', 'city', 'industry'],
      ['ownerName', 'ownerEmail', 'ownerPhone', 'password'],
      ['plan', 'billingCycle', 'startDate'],
      [],
    ]
    const newTouched = { ...touched }
    stepFields[step]?.forEach(f => { newTouched[f] = true })
    setTouched(newTouched)
    setErrors(errs)
    return Object.keys(errs).length === 0
  }, [step, form, t, lang, existingEmails, existingNames, touched])

  const goNext = () => { if (validateCurrentStep()) setStep(s => Math.min(s + 1, 3)) }
  const goPrev = () => { setErrors({}); setStep(s => Math.max(s - 1, 0)) }

  const handleSubmit = async () => {
    setLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1200))
    onSave(form)
    setLoading(false)
    // Clear draft
    try { localStorage.removeItem(DRAFT_KEY) } catch {}
    setHasDraft(false)
    toast.success(lang === 'ar' ? `تم إنشاء المستأجر "${form.nameAr}" بنجاح` : `Tenant "${form.nameEn}" created successfully`)
    onClose()
  }

  // Duplicate name check
  const nameError = useMemo(() => {
    if (touched.nameAr && form.nameAr.trim() && existingNames.includes(form.nameAr.trim())) {
      return lang === 'ar' ? 'هذا الاسم مستخدم بالفعل' : 'This name already exists'
    }
    if (touched.nameEn && form.nameEn.trim() && existingNames.includes(form.nameEn.trim())) {
      return lang === 'ar' ? 'هذا الاسم مستخدم بالفعل' : 'This name already exists'
    }
    return undefined
  }, [touched.nameAr, touched.nameEn, form.nameAr, form.nameEn, existingNames, lang])

  const pwStrength = getPasswordStrength(form.password)
  const selectedPlan = PLANS.find(p => p.name === form.plan)
  const cycleInfo = BILLING_CYCLES.find(c => c.value === form.billingCycle)
  const totalAmount = selectedPlan ? selectedPlan.price * (cycleInfo?.multiplier || 1) : 0
  const currencySym = sym

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2 }}
        className="bg-background rounded-2xl shadow-2xl border w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
        dir={isRTL ? 'rtl' : 'ltr'}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-900/30">
                <Building2 className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold">{isRTL ? 'إنشاء مستأجر جديد' : 'Create New Tenant'}</h2>
                <p className="text-xs text-muted-foreground">{isRTL ? 'أكمل الخطوات لإنشاء المستأجر' : 'Complete the steps to create a tenant'}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose} disabled={loading}>
              {isRTL ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </div>
          <Progress value={((step + 1) / 4) * 100} className="h-1.5 mt-4" />
          <StepIndicator current={step} total={4} isRTL={isRTL} labels={stepLabels} />
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, x: isRTL ? -20 : 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: isRTL ? 20 : -20 }} transition={{ duration: 0.2 }}>
              {/* STEP 1: Company Information */}
              {step === 0 && (
                <div className="space-y-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 className="h-5 w-5 text-violet-600" />
                    <h3 className="font-semibold">{isRTL ? 'معلومات الشركة' : 'Company Information'}</h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium flex items-center gap-1.5">
                        {isRTL ? 'اسم الشركة (عربي)' : 'Company Name (Arabic)'}
                        <span className="text-red-500">*</span>
                      </Label>
                      <Input value={form.nameAr} onChange={e => updateField('nameAr', e.target.value)} placeholder={isRTL ? 'مثال: مركز النور الطبي' : 'e.g. Al Noor Medical'} />
                      <FieldError msg={errors.nameAr || nameError} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium flex items-center gap-1.5">
                        {isRTL ? 'اسم الشركة (إنجليزي)' : 'Company Name (English)'}
                        <span className="text-red-500">*</span>
                      </Label>
                      <Input value={form.nameEn} onChange={e => updateField('nameEn', e.target.value)} placeholder="e.g. Al Noor Medical" dir="ltr" />
                      <FieldError msg={errors.nameEn || (touched.nameEn && nameError ? nameError : undefined)} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium flex items-center gap-1.5">
                        {isRTL ? 'البريد الإلكتروني' : 'Email'}
                        <span className="text-red-500">*</span>
                        <FieldTooltip text={isRTL ? 'سيكون البريد الرئيسي للمستأجر' : 'Primary email for the tenant'} />
                      </Label>
                      <Input type="email" value={form.email} onChange={e => updateField('email', e.target.value)} placeholder="info@example.com" dir="ltr" />
                      <FieldError msg={errors.email} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium">{isRTL ? 'رقم الهاتف' : 'Phone'}</Label>
                      <Input value={form.phone} onChange={e => updateField('phone', e.target.value)} placeholder="+962XXXXXXXXX" dir="ltr" />
                      <FieldError msg={errors.phone} />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">{isRTL ? 'الموقع الإلكتروني' : 'Website'}</Label>
                    <Input value={form.website} onChange={e => updateField('website', e.target.value)} placeholder="https://example.com" dir="ltr" />
                    <FieldError msg={errors.website} />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium flex items-center gap-1.5">
                        {isRTL ? 'البلد' : 'Country'}
                        <FieldTooltip text={isRTL ? 'بلد الشركة الرئيسي' : 'Primary country of operation'} />
                      </Label>
                      <SearchableSelect options={COUNTRIES} value={form.country} onChange={v => updateField('country', v)} placeholder={isRTL ? 'اختر البلد' : 'Select country'} isRTL={isRTL} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium">{isRTL ? 'المدينة' : 'City'}</Label>
                      <Input value={form.city} onChange={e => updateField('city', e.target.value)} placeholder={isRTL ? 'مثال: عمّان' : 'e.g. Amman'} />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">{isRTL ? 'القطاع' : 'Industry'}</Label>
                    <Select value={form.industry} onValueChange={v => updateField('industry', v)}>
                      <SelectTrigger><SelectValue placeholder={isRTL ? 'اختر القطاع' : 'Select industry'} /></SelectTrigger>
                      <SelectContent>
                        {(lang === 'ar' ? INDUSTRIES_AR : INDUSTRIES_EN).map((ind, i) => (
                          <SelectItem key={i} value={INDUSTRIES_EN[i]}>{lang === 'ar' ? INDUSTRIES_AR[i] : INDUSTRIES_EN[i]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* STEP 2: Owner Information */}
              {step === 1 && (
                <div className="space-y-5">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="h-5 w-5 text-violet-600" />
                    <h3 className="font-semibold">{isRTL ? 'معلومات المالك' : 'Owner Information'}</h3>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium flex items-center gap-1.5">
                      {isRTL ? 'اسم المالك' : 'Owner Name'}
                      <span className="text-red-500">*</span>
                    </Label>
                    <Input value={form.ownerName} onChange={e => updateField('ownerName', e.target.value)} placeholder={isRTL ? 'مثال: أحمد المنصور' : 'e.g. Ahmed Mansour'} />
                    <FieldError msg={errors.ownerName} />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium flex items-center gap-1.5">
                        {isRTL ? 'بريد المالك' : 'Owner Email'}
                        <span className="text-red-500">*</span>
                        <FieldTooltip text={isRTL ? 'بريد المالك للحساب' : 'Owner account email'} />
                      </Label>
                      <Input type="email" value={form.ownerEmail} onChange={e => updateField('ownerEmail', e.target.value)} placeholder="owner@example.com" dir="ltr" />
                      <FieldError msg={errors.ownerEmail} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium">{isRTL ? 'هاتف المالك' : 'Owner Phone'}</Label>
                      <Input value={form.ownerPhone} onChange={e => updateField('ownerPhone', e.target.value)} placeholder="+962XXXXXXXXX" dir="ltr" />
                      <FieldError msg={errors.ownerPhone} />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium flex items-center gap-1.5">
                      {isRTL ? 'كلمة المرور' : 'Password'}
                      <FieldTooltip text={isRTL ? 'كلمة مرور المالك — 8 أحرف على الأقل' : 'Owner password — minimum 8 characters'} />
                    </Label>
                    <div className="relative">
                      <Input type={showPassword ? 'text' : 'password'} value={form.password} onChange={e => updateField('password', e.target.value)} placeholder={isRTL ? 'أدخل كلمة المرور (اختياري)' : 'Enter password (optional)'} dir="ltr" className="pe-10" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute top-1/2 -translate-y-1/2 end-3 text-muted-foreground hover:text-foreground transition-colors">
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {form.password && (
                      <div className="space-y-1.5 mt-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-muted-foreground">
                            {isRTL ? 'قوة كلمة المرور:' : 'Password strength:'} {lang === 'ar' ? pwStrength.label : pwStrength.labelEn}
                          </span>
                          <span className="text-[10px] text-muted-foreground">{form.password.length}/8+</span>
                        </div>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${i <= pwStrength.score ? pwStrength.color : 'bg-muted'}`} />
                          ))}
                        </div>
                      </div>
                    )}
                    <FieldError msg={errors.password} />
                  </div>

                  <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-3 flex gap-2">
                    <Shield className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                      {isRTL
                        ? 'سيتم إنشاء حساب المالك تلقائياً وربطه بالمستأجر. يمكنك ترك كلمة المرور فارغة وسيتم إرسال رابط تعيين كلمة المرور.'
                        : 'Owner account will be created automatically and linked to the tenant. You can leave the password empty and a setup link will be sent.'}
                    </p>
                  </div>
                </div>
              )}

              {/* STEP 3: Subscription */}
              {step === 2 && (
                <div className="space-y-5">
                  <div className="flex items-center gap-2 mb-2">
                    <CreditCard className="h-5 w-5 text-violet-600" />
                    <h3 className="font-semibold">{isRTL ? 'الاشتراك والباقة' : 'Subscription & Plan'}</h3>
                  </div>

                  {/* Plan Selection */}
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium flex items-center gap-1.5">
                      {isRTL ? 'اختر الباقة' : 'Select Plan'}
                      <span className="text-red-500">*</span>
                    </Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {PLANS.filter(p => p.price > 0).map(p => {
                        const isSelected = form.plan === p.name
                        return (
                          <button key={p.id} type="button" onClick={() => updateField('plan', p.name)}
                            className={`relative rounded-xl border-2 p-4 text-start transition-all duration-200 hover:shadow-md ${
                              isSelected ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/20 shadow-md' : 'border-transparent bg-muted/50 hover:bg-muted'
                            }`}>
                            {isSelected && <div className="absolute top-2 end-2"><CheckCircle2 className="h-4 w-4 text-violet-600" /></div>}
                            <div className={`h-8 w-8 rounded-lg ${p.color} flex items-center justify-center mb-2`}><CreditCard className="h-4 w-4 text-white" /></div>
                            <p className="font-bold text-sm">{p.name}</p>
                            <p className="text-lg font-extrabold mt-1">{p.price > 0 ? `${p.price}` : isRTL ? 'مجاني' : 'Free'} <span className="text-xs font-normal text-muted-foreground">{currencySym}/{isRTL ? 'شهر' : 'mo'}</span></p>
                            <ul className="mt-2 space-y-1">
                              {p.features.slice(0, 2).map((f, j) => (
                                <li key={j} className="text-[11px] text-muted-foreground flex items-center gap-1">
                                  <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />{lang === 'en' ? f.en : f.ar}
                                </li>
                              ))}
                              {p.features.length > 2 && <li className="text-[10px] text-muted-foreground">+{p.features.length - 2} {isRTL ? 'أخرى' : 'more'}</li>}
                            </ul>
                          </button>
                        )
                      })}
                    </div>
                    <FieldError msg={errors.plan} />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium">{isRTL ? 'دورة الفوترة' : 'Billing Cycle'}</Label>
                      <Select value={form.billingCycle} onValueChange={v => updateField('billingCycle', v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {BILLING_CYCLES.map(c => (
                            <SelectItem key={c.value} value={c.value}>{lang === 'ar' ? c.ar : c.en}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium">{isRTL ? 'تاريخ البدء' : 'Start Date'}</Label>
                      <Input type="date" value={form.startDate} onChange={e => updateField('startDate', e.target.value)} dir="ltr" />
                    </div>
                  </div>

                  {/* Total */}
                  {selectedPlan && (
                    <div className="rounded-xl bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-950/20 dark:to-indigo-950/20 border border-violet-200 dark:border-violet-800 p-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">{isRTL ? 'الإجمالي المقدر' : 'Estimated Total'}</p>
                          <p className="text-2xl font-extrabold text-violet-700 dark:text-violet-400">
                            {totalAmount.toLocaleString()} <span className="text-sm font-normal">{currencySym}</span>
                          </p>
                          <p className="text-[11px] text-muted-foreground mt-1">
                            {selectedPlan.price} {currencySym} × {cycleInfo?.multiplier || 1} {lang === 'ar' ? 'أشهر' : 'months'} ({lang === 'ar' ? cycleInfo?.ar : cycleInfo?.en})
                          </p>
                        </div>
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-600 text-white shadow-lg shadow-violet-600/20">
                          <CreditCard className="h-6 w-6" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 4: Review */}
              {step === 3 && (
                <div className="space-y-5">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    <h3 className="font-semibold">{isRTL ? 'مراجعة وتأكيد' : 'Review & Confirm'}</h3>
                  </div>

                  {/* Company Summary */}
                  <div className="rounded-xl border p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-violet-600" />
                      <h4 className="text-sm font-bold">{isRTL ? 'معلومات الشركة' : 'Company Information'}</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                      <div><p className="text-xs text-muted-foreground">{isRTL ? 'الاسم (عربي)' : 'Name (AR)'}</p><p className="font-medium">{form.nameAr || '—'}</p></div>
                      <div><p className="text-xs text-muted-foreground">{isRTL ? 'الاسم (إنجليزي)' : 'Name (EN)'}</p><p className="font-medium" dir="ltr">{form.nameEn || '—'}</p></div>
                      <div><p className="text-xs text-muted-foreground">{isRTL ? 'البريد' : 'Email'}</p><p className="font-medium" dir="ltr">{form.email || '—'}</p></div>
                      <div><p className="text-xs text-muted-foreground">{isRTL ? 'الهاتف' : 'Phone'}</p><p className="font-medium" dir="ltr">{form.phone || '—'}</p></div>
                      <div><p className="text-xs text-muted-foreground">{isRTL ? 'البلد' : 'Country'}</p><p className="font-medium">{form.country ? COUNTRIES.find(c => c.code === form.country)?.[lang === 'ar' ? 'ar' : 'en'] || form.country : '—'}</p></div>
                      <div><p className="text-xs text-muted-foreground">{isRTL ? 'المدينة' : 'City'}</p><p className="font-medium">{form.city || '—'}</p></div>
                    </div>
                  </div>

                  {/* Owner Summary */}
                  <div className="rounded-xl border p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-violet-600" />
                      <h4 className="text-sm font-bold">{isRTL ? 'معلومات المالك' : 'Owner Information'}</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                      <div><p className="text-xs text-muted-foreground">{isRTL ? 'الاسم' : 'Name'}</p><p className="font-medium">{form.ownerName || '—'}</p></div>
                      <div><p className="text-xs text-muted-foreground">{isRTL ? 'البريد' : 'Email'}</p><p className="font-medium" dir="ltr">{form.ownerEmail || '—'}</p></div>
                      <div><p className="text-xs text-muted-foreground">{isRTL ? 'الهاتف' : 'Phone'}</p><p className="font-medium" dir="ltr">{form.ownerPhone || '—'}</p></div>
                      <div><p className="text-xs text-muted-foreground">{isRTL ? 'كلمة المرور' : 'Password'}</p><p className="font-medium">{form.password ? '●'.repeat(8) : (isRTL ? 'سيتم إرسال رابط' : 'Setup link will be sent')}</p></div>
                    </div>
                  </div>

                  {/* Subscription Summary */}
                  <div className="rounded-xl border p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-violet-600" />
                      <h4 className="text-sm font-bold">{isRTL ? 'الاشتراك' : 'Subscription'}</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                      <div><p className="text-xs text-muted-foreground">{isRTL ? 'الباقة' : 'Plan'}</p><p className="font-medium">{form.plan}</p></div>
                      <div><p className="text-xs text-muted-foreground">{isRTL ? 'دورة الفوترة' : 'Billing Cycle'}</p><p className="font-medium">{lang === 'ar' ? cycleInfo?.ar : cycleInfo?.en}</p></div>
                      <div><p className="text-xs text-muted-foreground">{isRTL ? 'تاريخ البدء' : 'Start Date'}</p><p className="font-medium">{form.startDate}</p></div>
                      <div><p className="text-xs text-muted-foreground">{isRTL ? 'الإجمالي' : 'Total'}</p><p className="font-bold text-violet-600">{totalAmount.toLocaleString()} {currencySym}</p></div>
                    </div>
                  </div>

                  <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 p-3 flex gap-2">
                    <Globe className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-emerald-700 dark:text-emerald-400 leading-relaxed">
                      {isRTL
                        ? 'سيتم إنشاء المستأجر مع جميع الإعدادات أعلاه. يمكنك تعديل الاشتراك لاحقاً من صفحة المستأجر.'
                        : 'The tenant will be created with all settings above. You can modify the subscription later from the tenant page.'}
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-5 sm:p-6 border-t bg-muted/30 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {hasDraft && step === 0 && (
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Globe className="h-3 w-3" />{isRTL ? 'مسودة محفوظة' : 'Draft saved'}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onClose} disabled={loading}>{t.cancel}</Button>
            {step > 0 && (
              <Button variant="outline" onClick={goPrev} disabled={loading}>
                {isRTL ? <ChevronRight className="h-4 w-4 me-1" /> : <ChevronLeft className="h-4 w-4 me-1" />}
                {isRTL ? 'السابق' : 'Previous'}
              </Button>
            )}
            {step < 3 ? (
              <Button className="bg-violet-600 hover:bg-violet-700 text-white gap-1" onClick={goNext}>
                {isRTL ? 'التالي' : 'Next'}
                {isRTL ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
            ) : (
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 min-w-[140px]" onClick={handleSubmit} disabled={loading}>
                {loading ? <><Loader2 className="h-4 w-4 animate-spin" />{isRTL ? 'جاري الإنشاء...' : 'Creating...'}</> : <><CheckCircle2 className="h-4 w-4" />{isRTL ? 'إنشاء المستأجر' : 'Create Tenant'}</>}
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}