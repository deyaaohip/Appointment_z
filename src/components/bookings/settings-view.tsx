'use client'

import { authFetch } from '@/lib/auth-fetch'


import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { useTheme } from 'next-themes'
import {
  Building2, Palette, Bell, Globe, Shield, Save, Upload, Copy, Eye, EyeOff, Check,
  Mail, MessageSquare, Smartphone, Webhook, CalendarCheck, Clock, XCircle, CreditCard,
  Star, Gift, Megaphone, ArrowRightLeft, Lock, SmartphoneNfc, Key
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { useAppStore } from '@/stores/app-store'
import { t, getDirection, type Locale } from '@/lib/i18n'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'

const colorSwatches = [
  { name: 'emerald', value: '#10b981' },
  { name: 'teal', value: '#14b8a6' },
  { name: 'cyan', value: '#06b6d4' },
  { name: 'blue', value: '#3b82f6' },
  { name: 'violet', value: '#8b5cf6' },
  { name: 'rose', value: '#f43f5e' },
  { name: 'amber', value: '#f59e0b' },
  { name: 'orange', value: '#f97316' },
]

const businessTypeKeys: Record<string, string> = {
  medical: 'typeMedical', dental: 'typeDental', salon: 'typeSalon',
  gym: 'typeGym', education: 'typeEducation', consulting: 'typeConsulting',
  maintenance: 'typeMaintenance', rental: 'typeRental', event: 'typeEvent', general: 'typeGeneral',
}

const timezones = [
  { value: 'Asia/Riyadh', label: 'Asia/Riyadh (UTC+3)' },
  { value: 'Asia/Dubai', label: 'Asia/Dubai (UTC+4)' },
  { value: 'Asia/Kuwait', label: 'Asia/Kuwait (UTC+3)' },
  { value: 'Africa/Cairo', label: 'Africa/Cairo (UTC+2)' },
  { value: 'Europe/London', label: 'Europe/London (UTC+0)' },
  { value: 'America/New_York', label: 'America/New_York (UTC-5)' },
]

const currencies = [
  { value: 'SAR', label: 'ريال سعودي (SAR)' },
  { value: 'AED', label: 'درهم إماراتي (AED)' },
  { value: 'KWD', label: 'دينار كويتي (KWD)' },
  { value: 'EGP', label: 'جنيه مصري (EGP)' },
  { value: 'USD', label: 'دولار أمريكي (USD)' },
  { value: 'EUR', label: 'يورو (EUR)' },
  { value: 'GBP', label: 'جنيه إسترليني (GBP)' },
]

export function SettingsView() {
  const { locale, setLocale } = useAppStore()
  const { theme, setTheme } = useTheme()

  const [generalForm, setGeneralForm] = useState({
    businessName: 'مركز النور الطبي',
    businessType: 'medical',
    timezone: 'Asia/Riyadh',
    currency: 'SAR',
  })

  const [primaryColor, setPrimaryColor] = useState('#10b981')
  const [secondaryColor, setSecondaryColor] = useState('#14b8a6')

  const [notifChannels, setNotifChannels] = useState({
    email: true, sms: false, whatsapp: false, push: true, inApp: true,
  })

  const [notifTypes, setNotifTypes] = useState({
    confirmation: true, reminder: true, cancellation: true,
    payment: true, review: false, birthday: false, marketing: false,
  })

  const [reminderHours, setReminderHours] = useState('2')

  const [showPassword, setShowPassword] = useState({ current: false, new: false, confirm: false })
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' })
  const [showApiKey, setShowApiKey] = useState(false)
  const [apiKey, setApiKey] = useState('bkf_live_a1b2c3d4e5f6g7h8i9j0')
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)

  // ── Fetch tenant settings ──
  const { data: settingsData, isLoading } = useQuery({
    queryKey: ['tenant-settings'],
    queryFn: async () => {
      const res = await authFetch('/api/tenant-settings')
      if (!res.ok) throw new Error('Failed to fetch settings')
      return res.json() as Promise<{ settings: Record<string, unknown> }>
    },
  })

  // Initialize form state from API data
  useEffect(() => {
    if (settingsData?.settings) {
      const s = settingsData.settings
      setGeneralForm({
        businessName: (s.name as string) || 'مركز النور الطبي',
        businessType: (s.businessType as string) || 'medical',
        timezone: (s.timezone as string) || 'Asia/Riyadh',
        currency: (s.currency as string) || 'SAR',
      })
      setPrimaryColor((s.primaryColor as string) || '#10b981')
      setSecondaryColor((s.secondaryColor as string) || '#14b8a6')
    }
  }, [settingsData])

  const handleSave = async () => {
    try {
      const res = await authFetch('/api/tenant-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: generalForm.businessName,
          businessType: generalForm.businessType,
          timezone: generalForm.timezone,
          currency: generalForm.currency,
          primaryColor,
          secondaryColor,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to save settings')
      }
      toast.success(t(locale, 'settings', 'settingsSaved'))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save settings')
    }
  }

  // ── Loading Skeleton ──
  if (isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-10 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 md:p-6 space-y-6"
    >
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t(locale, 'settings', 'title')}</h1>
      </div>

      <Tabs dir={getDirection(locale)} defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 gap-1">
          <TabsTrigger value="general" className="gap-2 text-xs md:text-sm">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">{t(locale, 'settings', 'general')}</span>
          </TabsTrigger>
          <TabsTrigger value="branding" className="gap-2 text-xs md:text-sm">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">{t(locale, 'settings', 'branding')}</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2 text-xs md:text-sm">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">{t(locale, 'settings', 'notifications')}</span>
          </TabsTrigger>
          <TabsTrigger value="language" className="gap-2 text-xs md:text-sm">
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline">{t(locale, 'settings', 'language')}</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2 text-xs md:text-sm">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">{t(locale, 'settings', 'security')}</span>
          </TabsTrigger>
        </TabsList>

        {/* General Tab */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>{t(locale, 'settings', 'generalSettings')}</CardTitle>
              <CardDescription>
                {t(locale, 'settings', 'generalSettingsDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>{t(locale, 'settings', 'businessName')}</Label>
                  <Input
                    value={generalForm.businessName}
                    onChange={(e) => setGeneralForm({ ...generalForm, businessName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t(locale, 'settings', 'businessType')}</Label>
                  <Select
                    value={generalForm.businessType}
                    onValueChange={(v) => setGeneralForm({ ...generalForm, businessType: v })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(businessTypeKeys).map(([value, key]) => (
                        <SelectItem key={value} value={value}>
                          {t(locale, 'settings', key)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t(locale, 'settings', 'timezone')}</Label>
                  <Select
                    value={generalForm.timezone}
                    onValueChange={(v) => setGeneralForm({ ...generalForm, timezone: v })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {timezones.map((tz) => (
                        <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t(locale, 'settings', 'currency')}</Label>
                  <Select
                    value={generalForm.currency}
                    onValueChange={(v) => setGeneralForm({ ...generalForm, currency: v })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {currencies.map((c) => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleSave} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                  <Save className="h-4 w-4" />
                  {t(locale, 'common', 'save')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Branding Tab */}
        <TabsContent value="branding" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t(locale, 'settings', 'brandColors')}</CardTitle>
              <CardDescription>
                {t(locale, 'settings', 'brandColorsDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="space-y-3">
                <Label>{t(locale, 'settings', 'primaryColor')}</Label>
                <div className="flex flex-wrap gap-3">
                  {colorSwatches.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => setPrimaryColor(c.value)}
                      className={`w-10 h-10 rounded-lg border-2 transition-all hover:scale-110 ${
                        primaryColor === c.value ? 'border-foreground scale-110' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c.value }}
                    />
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <Label>{t(locale, 'settings', 'secondaryColor')}</Label>
                <div className="flex flex-wrap gap-3">
                  {colorSwatches.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => setSecondaryColor(c.value)}
                      className={`w-10 h-10 rounded-lg border-2 transition-all hover:scale-110 ${
                        secondaryColor === c.value ? 'border-foreground scale-110' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c.value }}
                    />
                  ))}
                </div>
              </div>
              {/* Preview */}
              <div className="space-y-3">
                <Label>{t(locale, 'settings', 'preview')}</Label>
                <div
                  className="rounded-xl p-6 text-white space-y-3"
                  style={{
                    background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                  }}
                >
                  <h3 className="text-xl font-bold">{generalForm.businessName}</h3>
                  <p className="text-sm opacity-90">
                    {t(locale, 'settings', 'brandPreview')}
                  </p>
                  <Button size="sm" variant="secondary">
                    {t(locale, 'settings', 'bookAppointment')}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t(locale, 'settings', 'logo')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="border-2 border-dashed rounded-xl p-8 text-center hover:border-emerald-500 transition-colors cursor-pointer"
                onClick={() => {
                  const input = document.createElement('input')
                  input.type = 'file'
                  input.accept = 'image/*'
                  input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0]
                    if (file) {
                      const reader = new FileReader()
                      reader.onload = () => {
                        toast.success(locale === 'ar' ? 'تم تحميل الشعار' : 'Logo uploaded')
                      }
                      reader.readAsDataURL(file)
                    }
                  }
                  input.click()
                }}
              >
                <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {t(locale, 'settings', 'logoDropzone')}
                </p>
                <p className="text-xs text-muted-foreground mt-1">PNG, JPG, SVG (max 2MB)</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t(locale, 'settings', 'theme')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                {[
                  { value: 'light', icon: '☀️', labelKey: 'light' },
                  { value: 'dark', icon: '🌙', labelKey: 'dark' },
                  { value: 'system', icon: '💻', labelKey: 'system' },
                ].map((th) => (
                  <button
                    key={th.value}
                    onClick={() => setTheme(th.value)}
                    className={`flex-1 p-4 rounded-xl border-2 text-center transition-all hover:scale-[1.02] ${
                      theme === th.value
                        ? 'border-emerald-500 bg-emerald-500/10'
                        : 'border-border hover:border-emerald-300'
                    }`}
                  >
                    <div className="text-2xl mb-1">{th.icon}</div>
                    <div className="text-sm font-medium">{t(locale, 'settings', th.labelKey)}</div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t(locale, 'settings', 'notificationChannels')}</CardTitle>
              <CardDescription>
                {t(locale, 'settings', 'notifChannelsDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { key: 'email' as const, icon: Mail, labelKey: 'emailNotifications' },
                { key: 'sms' as const, icon: MessageSquare, labelKey: 'smsNotifications' },
                { key: 'whatsapp' as const, icon: Smartphone, labelKey: 'whatsappNotifications' },
                { key: 'push' as const, icon: Webhook, labelKey: 'pushNotifications' },
                { key: 'inApp' as const, icon: Bell, labelKey: 'inAppNotifications' },
              ].map((ch) => (
                <div key={ch.key} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <ch.icon className="h-5 w-5 text-muted-foreground" />
                    <span>{t(locale, 'settings', ch.labelKey)}</span>
                  </div>
                  <Switch
                    checked={notifChannels[ch.key]}
                    onCheckedChange={(v) => setNotifChannels({ ...notifChannels, [ch.key]: v })}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t(locale, 'settings', 'notificationTypes')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { key: 'confirmation' as const, icon: CalendarCheck, labelKey: 'bookingConfirmation' },
                { key: 'reminder' as const, icon: Clock, labelKey: 'bookingReminder' },
                { key: 'cancellation' as const, icon: XCircle, labelKey: 'cancellationAlerts' },
                { key: 'payment' as const, icon: CreditCard, labelKey: 'paymentReminders' },
                { key: 'review' as const, icon: Star, labelKey: 'reviewRequests' },
                { key: 'birthday' as const, icon: Gift, labelKey: 'birthdayMessages' },
                { key: 'marketing' as const, icon: Megaphone, labelKey: 'marketingCampaigns' },
              ].map((nt) => (
                <div key={nt.key} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <nt.icon className="h-5 w-5 text-muted-foreground" />
                    <span>{t(locale, 'settings', nt.labelKey)}</span>
                    {nt.key === 'reminder' && notifTypes.reminder && (
                      <Select value={reminderHours} onValueChange={setReminderHours}>
                        <SelectTrigger className="w-32 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">{t(locale, 'settings', 'reminder1h')}</SelectItem>
                          <SelectItem value="2">{t(locale, 'settings', 'reminder2h')}</SelectItem>
                          <SelectItem value="4">{t(locale, 'settings', 'reminder4h')}</SelectItem>
                          <SelectItem value="12">{t(locale, 'settings', 'reminder12h')}</SelectItem>
                          <SelectItem value="24">{t(locale, 'settings', 'reminder1d')}</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                  <Switch
                    checked={notifTypes[nt.key]}
                    onCheckedChange={(v) => setNotifTypes({ ...notifTypes, [nt.key]: v })}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSave} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
              <Save className="h-4 w-4" />
              {t(locale, 'common', 'save')}
            </Button>
          </div>
        </TabsContent>

        {/* Language Tab */}
        <TabsContent value="language">
          <Card>
            <CardHeader>
              <CardTitle>{t(locale, 'settings', 'languageSettings')}</CardTitle>
              <CardDescription>
                {t(locale, 'settings', 'languageSettingsDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => setLocale('ar')}
                  className={`p-6 rounded-xl border-2 text-center transition-all hover:scale-[1.02] ${
                    locale === 'ar'
                      ? 'border-emerald-500 bg-emerald-500/10'
                      : 'border-border hover:border-emerald-300'
                  }`}
                >
                  <div className="text-4xl mb-2">🇸🇦</div>
                  <div className="text-lg font-bold">العربية</div>
                  <div className="text-xs text-muted-foreground">Arabic (RTL)</div>
                </button>
                <button
                  onClick={() => setLocale('en')}
                  className={`p-6 rounded-xl border-2 text-center transition-all hover:scale-[1.02] ${
                    locale === 'en'
                      ? 'border-emerald-500 bg-emerald-500/10'
                      : 'border-border hover:border-emerald-300'
                  }`}
                >
                  <div className="text-4xl mb-2">🇺🇸</div>
                  <div className="text-lg font-bold">English</div>
                  <div className="text-xs text-muted-foreground">English (LTR)</div>
                </button>
              </div>

              <Separator />

              <div className="flex items-center gap-3">
                <ArrowRightLeft className="h-5 w-5 text-emerald-600" />
                <div>
                  <p className="font-medium">
                    {t(locale, 'settings', 'textDirection')}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {getDirection(locale) === 'rtl'
                      ? t(locale, 'settings', 'rtl')
                      : t(locale, 'settings', 'ltr')}
                  </p>
                </div>
                <Badge variant={getDirection(locale) === 'rtl' ? 'default' : 'secondary'}>
                  {getDirection(locale).toUpperCase()}
                </Badge>
              </div>

              <Separator />

              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">
                  {t(locale, 'settings', 'textPreview')}
                </p>
                <p className="text-lg">
                  {t(locale, 'settings', 'textPreviewValue')}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t(locale, 'settings', 'changePassword')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{t(locale, 'settings', 'currentPassword')}</Label>
                <div className="relative">
                  <Input
                    type={showPassword.current ? 'text' : 'password'}
                    value={passwords.current}
                    onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                  />
                  <button
                    onClick={() => setShowPassword({ ...showPassword, current: !showPassword.current })}
                    className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t(locale, 'settings', 'newPassword')}</Label>
                <div className="relative">
                  <Input
                    type={showPassword.new ? 'text' : 'password'}
                    value={passwords.new}
                    onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                  />
                  <button
                    onClick={() => setShowPassword({ ...showPassword, new: !showPassword.new })}
                    className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t(locale, 'settings', 'confirmPassword')}</Label>
                <div className="relative">
                  <Input
                    type={showPassword.confirm ? 'text' : 'password'}
                    value={passwords.confirm}
                    onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                  />
                  <button
                    onClick={() => setShowPassword({ ...showPassword, confirm: !showPassword.confirm })}
                    className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button onClick={handleSave} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                <Lock className="h-4 w-4" />
                {t(locale, 'settings', 'updatePassword')}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t(locale, 'settings', 'twoFactorAuth')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <SmartphoneNfc className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{t(locale, 'settings', 'enable2FA')}</p>
                    <p className="text-sm text-muted-foreground">
                      {t(locale, 'settings', 'twoFactorDesc')}
                    </p>
                  </div>
                </div>
                <Switch checked={twoFactorEnabled} onCheckedChange={(checked) => { setTwoFactorEnabled(checked); toast.success(checked ? (locale === 'ar' ? 'تم تفعيل المصادقة الثنائية' : '2FA enabled') : (locale === 'ar' ? 'تم تعطيل المصادقة الثنائية' : '2FA disabled')) }} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t(locale, 'settings', 'apiKeyTitle')}</CardTitle>
              <CardDescription>
                {t(locale, 'settings', 'apiKeyAccessDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Input
                  readOnly
                  value={showApiKey ? 'bkf_live_a1b2c3d4e5f6g7h8i9j0' : '••••••••••••••••••••'}
                  className="font-mono"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    navigator.clipboard.writeText('bkf_live_a1b2c3d4e5f6g7h8i9j0')
                    toast.success(t(locale, 'settings', 'copiedToClipboard'))
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
                    const newKey = 'bkf_live_' + Array.from({ length: 20 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
                    setApiKey(newKey)
                    navigator.clipboard.writeText(newKey)
                    toast.success(t(locale, 'settings', 'apiKeyRegenerated'))
                  }}
                >
                  <Key className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}