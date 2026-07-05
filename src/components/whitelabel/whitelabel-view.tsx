'use client'

import { authFetch } from '@/lib/auth-fetch'


import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  Upload,
  Save,
  Eye,
  Sun,
  Moon,
} from 'lucide-react'
import { useAppStore } from '@/stores/app-store'
import { t, getDirection } from '@/lib/i18n'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'

// ─── Animation Variants ─────────────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function WhitelabelView() {
  const { locale, brandSettings, setBrandSettings, customCurrency, setCustomCurrency, customTimezone, setCustomTimezone, themeMode, setThemeMode } = useAppStore()
  const dir = getDirection(locale)

  const [appName, setAppName] = useState(brandSettings.appName || 'BookFlow')
  const [customDomain, setCustomDomain] = useState('')
  const [primaryColor, setPrimaryColor] = useState('#059669')
  const [secondaryColor, setSecondaryColor] = useState('#0f172a')
  const [accentColor, setAccentColor] = useState('#f59e0b')
  const [dateFormat, setDateFormat] = useState('DD/MM/YYYY')
  const [timeFormat, setTimeFormat] = useState<'12h' | '24h'>('24h')
  const [weekStart, setWeekStart] = useState('sunday')
  const [showPoweredBy, setShowPoweredBy] = useState(true)

  // ── Fetch brand settings ──
  const { data: brandData, isLoading } = useQuery({
    queryKey: ['brand-settings'],
    queryFn: async () => {
      const res = await authFetch('/api/brand-settings')
      if (!res.ok) throw new Error('Failed to fetch brand settings')
      return res.json() as Promise<{ settings: { appName: string; logo?: string; primaryColor: string; secondaryColor: string } }>
    },
  })

  // Initialize state from API data
  useEffect(() => {
    if (brandData?.settings) {
      const s = brandData.settings
      setAppName(s.appName || 'BookFlow')
      setPrimaryColor(s.primaryColor || '#059669')
      setSecondaryColor(s.secondaryColor || '#0f172a')
    }
  }, [brandData])

  const handleSave = async () => {
    try {
      // Persist to API
      const res = await authFetch('/api/brand-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appName,
          primaryColor,
          secondaryColor,
          customDomain,
          dateFormat,
          timeFormat,
          weekStart,
          showPoweredBy,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to save brand settings')
      }

      // Also update zustand for immediate UI response
      setBrandSettings({ appName, primaryColor, secondaryColor, accentColor })
      setCustomCurrency(customCurrency as 'SAR')
      setCustomTimezone(customTimezone)
      setThemeMode(themeMode === 'light' ? 'light' : 'dark')
      toast.success(t(locale, 'whitelabel', 'saved'))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save brand settings')
    }
  }

  // ── Loading Skeleton ──
  if (isLoading) {
    return (
      <div dir={dir} className="space-y-6">
        <Skeleton className="h-8 w-56" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Skeleton className="h-48 rounded-xl" />
            <Skeleton className="h-48 rounded-xl" />
            <Skeleton className="h-48 rounded-xl" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      dir={dir}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="space-y-6"
    >
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">{t(locale, 'whitelabel', 'title')}</h1>
        <p className="text-sm text-muted-foreground">
          {locale === 'ar' ? 'تخصيص مظهر النظام وهويته التجارية' : 'Customize the system appearance and brand identity'}
        </p>
      </div>

      <div dir={dir} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* ── Left Column (2/3) ─────────────────────────────────────── */}
        <motion.div
          dir={dir}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6 lg:col-span-2"
        >
          {/* Logo Upload */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <CardTitle>{t(locale, 'whitelabel', 'logoUpload')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/25 bg-muted/20 p-8 transition-colors hover:border-emerald-400 hover:bg-emerald-50/50 dark:hover:border-emerald-700 dark:hover:bg-emerald-900/10 cursor-pointer"
                  onClick={() => {
                    const input = document.createElement('input')
                    input.type = 'file'
                    input.accept = 'image/*'
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0]
                      if (file) {
                        const reader = new FileReader()
                        reader.onload = () => {
                          setBrandSettings({ ...brandSettings, logo: reader.result as string })
                          toast.success(locale === 'ar' ? 'تم تحميل الشعار' : 'Logo uploaded')
                        }
                        reader.readAsDataURL(file)
                      }
                    }
                    input.click()
                  }}
                >
                  <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-900/30">
                    <Upload className="h-7 w-7 text-emerald-600" />
                  </div>
                  <p className="text-sm font-medium">{t(locale, 'whitelabel', 'logoDropzone')}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{t(locale, 'whitelabel', 'logoHint')}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* App Name */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <CardTitle>{t(locale, 'whitelabel', 'appName')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Input
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  placeholder="BookFlow"
                  dir="ltr"
                />
                <p className="text-xs text-muted-foreground">{t(locale, 'whitelabel', 'appNameHint')}</p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Color Pickers */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <CardTitle>{locale === 'ar' ? 'الألوان' : 'Colors'}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label>{t(locale, 'whitelabel', 'primaryColor')}</Label>
                    <div className="flex items-center gap-3">
                      <Input
                        type="color"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="h-10 w-12 cursor-pointer p-1"
                      />
                      <Input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} dir="ltr" className="font-mono text-sm" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>{t(locale, 'whitelabel', 'secondaryColor')}</Label>
                    <div className="flex items-center gap-3">
                      <Input
                        type="color"
                        value={secondaryColor}
                        onChange={(e) => setSecondaryColor(e.target.value)}
                        className="h-10 w-12 cursor-pointer p-1"
                      />
                      <Input value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} dir="ltr" className="font-mono text-sm" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>{t(locale, 'whitelabel', 'accentColor')}</Label>
                    <div className="flex items-center gap-3">
                      <Input
                        type="color"
                        value={accentColor}
                        onChange={(e) => setAccentColor(e.target.value)}
                        className="h-10 w-12 cursor-pointer p-1"
                      />
                      <Input value={accentColor} onChange={(e) => setAccentColor(e.target.value)} dir="ltr" className="font-mono text-sm" />
                    </div>
                  </div>
                </div>

                {/* Color Preview */}
                <div className="mt-4 space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">{t(locale, 'whitelabel', 'themePreview')}</p>
                  <div className="flex items-center gap-2 rounded-lg border p-3" dir="ltr">
                    <div className="h-8 w-8 rounded-lg" style={{ backgroundColor: primaryColor }} />
                    <div className="h-8 w-8 rounded-lg" style={{ backgroundColor: secondaryColor }} />
                    <div className="h-8 w-8 rounded-lg" style={{ backgroundColor: accentColor }} />
                    <div className="ms-2 flex items-center gap-2">
                      <span className="rounded-md px-3 py-1 text-xs font-medium text-white" style={{ backgroundColor: primaryColor }}>
                        Button
                      </span>
                      <span className="rounded-md border px-3 py-1 text-xs font-medium" style={{ borderColor: secondaryColor, color: secondaryColor }}>
                        Outline
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Custom Domain */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <CardTitle>{t(locale, 'whitelabel', 'customDomain')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Input
                  value={customDomain}
                  onChange={(e) => setCustomDomain(e.target.value)}
                  placeholder={t(locale, 'whitelabel', 'customDomainHint')}
                  dir="ltr"
                />
              </CardContent>
            </Card>
          </motion.div>

          {/* Date/Time/Week Settings */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <CardTitle>
                  {locale === 'ar' ? 'إعدادات التاريخ والوقت' : 'Date & Time Settings'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Date Format */}
                <div className="space-y-2">
                  <Label>{locale === 'ar' ? 'صيغة التاريخ' : 'Date Format'}</Label>
                  <Select value={dateFormat} onValueChange={setDateFormat}>
                    <SelectTrigger dir="ltr">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                      <SelectItem value="DD-MM-YYYY">DD-MM-YYYY</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Time Format Toggle */}
                <div className="space-y-2">
                  <Label>{locale === 'ar' ? 'صيغة الوقت' : 'Time Format'}</Label>
                  <div className="flex rounded-lg border p-1 w-fit">
                    {(['12h', '24h'] as const).map((fmt) => (
                      <button
                        key={fmt}
                        onClick={() => setTimeFormat(fmt)}
                        className={`rounded-md px-4 py-1.5 text-sm font-medium transition-all ${
                          timeFormat === fmt
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {fmt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Week Start Day */}
                <div className="space-y-2">
                  <Label>{locale === 'ar' ? 'بداية الأسبوع' : 'Week Start Day'}</Label>
                  <Select value={weekStart} onValueChange={setWeekStart}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sunday">{locale === 'ar' ? 'الأحد' : 'Sunday'}</SelectItem>
                      <SelectItem value="monday">{locale === 'ar' ? 'الاثنين' : 'Monday'}</SelectItem>
                      <SelectItem value="saturday">{locale === 'ar' ? 'السبت' : 'Saturday'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* ── Right Column (1/3) ─────────────────────────────────────── */}
        <motion.div
          dir={dir}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          {/* Currency */}
          <Card>
            <CardHeader>
              <CardTitle>{t(locale, 'whitelabel', 'currency')}</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={customCurrency} onValueChange={(v) => setCustomCurrency(v as 'SAR')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SAR">SAR — {locale === 'ar' ? 'ريال سعودي' : 'Saudi Riyal'}</SelectItem>
                  <SelectItem value="AED">AED — {locale === 'ar' ? 'درهم إماراتي' : 'UAE Dirham'}</SelectItem>
                  <SelectItem value="KWD">KWD — {locale === 'ar' ? 'دينار كويتي' : 'Kuwaiti Dinar'}</SelectItem>
                  <SelectItem value="USD">USD — {locale === 'ar' ? 'دولار أمريكي' : 'US Dollar'}</SelectItem>
                  <SelectItem value="EUR">EUR — {locale === 'ar' ? 'يورو' : 'Euro'}</SelectItem>
                  <SelectItem value="GBP">GBP — {locale === 'ar' ? 'جنيه إسترليني' : 'British Pound'}</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Timezone */}
          <Card>
            <CardHeader>
              <CardTitle>{t(locale, 'whitelabel', 'timezone')}</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={customTimezone} onValueChange={setCustomTimezone}>
                <SelectTrigger dir="ltr">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Asia/Riyadh">Asia/Riyadh (GMT+3)</SelectItem>
                  <SelectItem value="Asia/Dubai">Asia/Dubai (GMT+4)</SelectItem>
                  <SelectItem value="Africa/Cairo">Africa/Cairo (GMT+2)</SelectItem>
                  <SelectItem value="Europe/London">Europe/London (GMT+0)</SelectItem>
                  <SelectItem value="America/New_York">America/New_York (GMT-5)</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Toggles */}
          <Card>
            <CardHeader>
              <CardTitle>{t(locale, 'whitelabel', 'themeSettings')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Theme Mode Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sun className="h-4 w-4 text-amber-500" />
                  <span className="text-sm font-medium">{t(locale, 'whitelabel', 'lightMode')}</span>
                </div>
                <Switch
                  checked={themeMode === 'dark'}
                  onCheckedChange={(checked) => setThemeMode(checked ? 'dark' : 'light')}
                />
                <div className="flex items-center gap-2">
                  <Moon className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">{t(locale, 'whitelabel', 'darkMode')}</span>
                </div>
              </div>

              <Separator />

              {/* Show Powered By */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{t(locale, 'whitelabel', 'showPoweredBy')}</p>
                  <p className="text-xs text-muted-foreground">
                    {locale === 'ar' ? 'عرض شعار BookFlow في التذييل' : 'Show BookFlow branding in footer'}
                  </p>
                </div>
                <Switch
                  checked={showPoweredBy}
                  onCheckedChange={setShowPoweredBy}
                />
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                {t(locale, 'whitelabel', 'themePreview')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="rounded-xl border p-4 space-y-3"
                style={{ backgroundColor: secondaryColor }}
                dir="ltr"
              >
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg" style={{ backgroundColor: primaryColor }} />
                  <span className="text-sm font-bold" style={{ color: '#ffffff' }}>{appName}</span>
                </div>
                <div className="space-y-2">
                  <div className="h-3 w-full rounded bg-white/20" />
                  <div className="h-3 w-3/4 rounded bg-white/15" />
                  <div className="h-3 w-1/2 rounded bg-white/10" />
                </div>
                <button
                  className="rounded-lg px-4 py-2 text-xs font-semibold text-white"
                  style={{ backgroundColor: primaryColor }}
                >
                  {t(locale, 'whitelabel', 'previewAction')}
                </button>
                {showPoweredBy && (
                  <p className="text-[10px] text-white/40 pt-1">
                    {t(locale, 'whitelabel', 'poweredBy')} BookFlow
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <Button
            className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700"
            size="lg"
            onClick={handleSave}
          >
            <Save className="h-4 w-4" />
            {t(locale, 'whitelabel', 'save')}
          </Button>
        </motion.div>
      </div>
    </motion.div>
  )
}