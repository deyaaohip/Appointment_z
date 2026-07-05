'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAppStore } from '@/stores/app-store'
import { t, getDirection, formatCurrency, getOppositeLocale } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  CalendarDays,
  Building2,
  CreditCard,
  Bell,
  BarChart3,
  Palette,
  Check,
  X,
  Star,
  ChevronLeft,
  Globe,
  ArrowLeft,
  Play,
  Quote,
  Shield,
  Zap,
  Users,
  Menu,
  XIcon,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

/* ------------------------------------------------------------------ */
/*  Animation helpers                                                  */
/* ------------------------------------------------------------------ */
const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true } as const,
  transition: { duration: 0.5, ease: 'easeOut' },
}

const stagger = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true } as const,
}

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */
const NAV_LINKS = [
  { key: 'navFeatures', href: '#features' },
  { key: 'navPricing', href: '#pricing' },
  { key: 'navHowWorks', href: '#how-it-works' },
  { key: 'navTestimonials', href: '#testimonials' },
  { key: 'navFaq', href: '#faq' },
] as const

const FEATURES = [
  { icon: CalendarDays, titleKey: 'featureBooking', descKey: 'featureBookingDesc' },
  { icon: Building2, titleKey: 'featureMultiBranch', descKey: 'featureMultiBranchDesc' },
  { icon: CreditCard, titleKey: 'featurePayment', descKey: 'featurePaymentDesc' },
  { icon: Bell, titleKey: 'featureNotifications', descKey: 'featureNotificationsDesc' },
  { icon: BarChart3, titleKey: 'featureReports', descKey: 'featureReportsDesc' },
  { icon: Palette, titleKey: 'featureWhiteLabel', descKey: 'featureWhiteLabelDesc' },
] as const

const STEPS = [
  { num: 1, titleKey: 'step1Title', descKey: 'step1Desc' },
  { num: 2, titleKey: 'step2Title', descKey: 'step2Desc' },
  { num: 3, titleKey: 'step3Title', descKey: 'step3Desc' },
  { num: 4, titleKey: 'step4Title', descKey: 'step4Desc' },
] as const

interface PlanFeature {
  label: string
  free: string | boolean
  starter: string | boolean
  pro: string | boolean
  enterprise: string | boolean
}

const PLAN_FEATURES: PlanFeature[] = [
  { label: 'featureBookings', free: '50', starter: '500', pro: '2,000', enterprise: true },
  { label: 'featureBranches', free: '1', starter: '3', pro: '10', enterprise: true },
  { label: 'featureEmployees', free: '2', starter: '10', pro: '50', enterprise: true },
  { label: 'featureServices', free: '5', starter: '25', pro: true, enterprise: true },
  { label: 'featureCustomers', free: '100', starter: '1,000', pro: true, enterprise: true },
  { label: 'featurePrioritySupport', free: false, starter: false, pro: true, enterprise: true },
  { label: 'featureCustomDomain', free: false, starter: false, pro: true, enterprise: true },
  { label: 'featureWhiteLabel', free: false, starter: false, pro: false, enterprise: true },
  { label: 'featureApiAccess', free: false, starter: false, pro: false, enterprise: true },
  { label: 'featureAdvancedReports', free: false, starter: false, pro: false, enterprise: true },
  { label: 'featureMultiLanguage', free: false, starter: false, pro: false, enterprise: true },
  { label: 'featureWebhooks', free: false, starter: false, pro: false, enterprise: true },
  { label: 'featureBulkImport', free: false, starter: false, pro: false, enterprise: true },
  { label: 'featureSLA', free: false, starter: false, pro: false, enterprise: true },
  { label: 'featureDedicatedManager', free: false, starter: false, pro: false, enterprise: true },
  { label: 'featureCustomIntegrations', free: false, starter: false, pro: false, enterprise: true },
]

const PLANS = [
  { key: 'free', nameKey: 'planFree', priceKey: 'planFreePrice', descKey: 'planFreeDesc', popular: false },
  { key: 'starter', nameKey: 'planStarter', priceKey: 'planStarterPrice', descKey: 'planStarterDesc', popular: false },
  { key: 'pro', nameKey: 'planPro', priceKey: 'planProPrice', descKey: 'planProDesc', popular: true },
  { key: 'enterprise', nameKey: 'planEnterprise', priceKey: 'planEnterprisePrice', descKey: 'planEnterpriseDesc', popular: false },
] as const

const TESTIMONIALS = [
  { nameKey: 'testimonial1Name', roleKey: 'testimonial1Role', textKey: 'testimonial1Text' },
  { nameKey: 'testimonial2Name', roleKey: 'testimonial2Role', textKey: 'testimonial2Text' },
  { nameKey: 'testimonial3Name', roleKey: 'testimonial3Role', textKey: 'testimonial3Text' },
] as const

const FAQ_ITEMS = [
  { qKey: 'faq1Q', aKey: 'faq1A', value: 'faq-1' },
  { qKey: 'faq2Q', aKey: 'faq2A', value: 'faq-2' },
  { qKey: 'faq3Q', aKey: 'faq3A', value: 'faq-3' },
  { qKey: 'faq4Q', aKey: 'faq4A', value: 'faq-4' },
  { qKey: 'faq5Q', aKey: 'faq5A', value: 'faq-5' },
  { qKey: 'faq6Q', aKey: 'faq6A', value: 'faq-6' },
] as const

/* ------------------------------------------------------------------ */
/*  Feature value renderer                                             */
/* ------------------------------------------------------------------ */
function renderFeatureValue(value: string | boolean, locale: ReturnType<typeof useAppStore.getState>['locale']) {
  if (value === true) {
    return (
      <span className="flex items-center justify-center gap-1 text-emerald-600 font-medium">
        <Check className="size-4" />
        <span className="text-xs">{t(locale, 'landing', 'featureUnlimited')}</span>
      </span>
    )
  }
  if (value === false) {
    return (
      <span className="flex items-center justify-center">
        <X className="size-4 text-muted-foreground/40" />
      </span>
    )
  }
  return <span className="text-sm text-foreground">{value}</span>
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export function LandingPage() {
  const { locale, setLocale, setAppMode, setSelectedPlan, setShowPaymentModal } = useAppStore()
  const dir = getDirection(locale)
  const [isYearly, setIsYearly] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const scrollTo = useCallback((href: string) => {
    setMobileMenuOpen(false)
    const el = document.querySelector(href)
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }, [])

  const toggleLocale = () => setLocale(getOppositeLocale(locale))

  const getPrice = (priceKey: string) => {
    const raw = t(locale, 'landing', priceKey)
    const num = parseInt(raw, 10)
    if (isNaN(num) || num === 0) return formatCurrency(0, 'SAR', locale)
    const finalPrice = isYearly ? Math.round(num * 0.8) : num
    return formatCurrency(finalPrice, 'SAR', locale)
  }

  const handlePlanAction = (planKey: string) => {
    if (planKey === 'free') {
      setAppMode('app')
    } else if (planKey === 'enterprise') {
      scrollTo('#faq')
    } else {
      setSelectedPlan(planKey)
      setShowPaymentModal(true)
    }
  }

  const handleLogin = () => {
    setAppMode('app')
  }

  return (
    <div dir={dir} className="min-h-screen flex flex-col font-sans bg-white text-foreground">
      {/* ============================================================ */}
      {/*  1. STICKY NAVBAR                                            */}
      {/* ============================================================ */}
      <header
        className={cn(
          'fixed top-0 inset-x-0 z-50 transition-all duration-300',
          scrolled
            ? 'bg-white/90 backdrop-blur-md shadow-sm border-b border-border/50'
            : 'bg-transparent',
        )}
      >
        <nav className="mx-auto max-w-7xl flex items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
          {/* Logo */}
          <button onClick={() => scrollTo('#hero')} className="flex items-center gap-2">
            <div className="flex items-center justify-center size-9 rounded-lg bg-emerald-600 text-white">
              <CalendarDays className="size-5" />
            </div>
            <span className="text-xl font-bold text-emerald-700">BookFlow</span>
          </button>

          {/* Desktop Nav Links */}
          <ul className="hidden lg:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <li key={link.key}>
                <button
                  onClick={() => scrollTo(link.href)}
                  className="text-sm font-medium text-muted-foreground hover:text-emerald-600 transition-colors"
                >
                  {t(locale, 'landing', link.key)}
                </button>
              </li>
            ))}
          </ul>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {/* Language Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleLocale}
              className="gap-1.5 text-muted-foreground hover:text-foreground"
            >
              <Globe className="size-4" />
              <span className="text-xs font-semibold">{locale === 'ar' ? 'EN' : 'AR'}</span>
            </Button>

            {/* Login */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogin}
              className="hidden sm:inline-flex"
            >
              {t(locale, 'landing', 'navLogin')}
            </Button>

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <XIcon className="size-5" /> : <Menu className="size-5" />}
            </Button>
          </div>
        </nav>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:hidden bg-white border-b border-border/50 shadow-lg"
          >
            <div className="px-4 py-4 space-y-1">
              {NAV_LINKS.map((link) => (
                <button
                  key={link.key}
                  onClick={() => scrollTo(link.href)}
                  className="block w-full text-start px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                >
                  {t(locale, 'landing', link.key)}
                </button>
              ))}
              <div className="pt-2 border-t border-border/50">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setMobileMenuOpen(false)
                    handleLogin()
                  }}
                >
                  {t(locale, 'landing', 'navLogin')}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </header>

      <main className="flex-1">
        {/* ============================================================ */}
        {/*  2. HERO SECTION                                             */}
        {/* ============================================================ */}
        <section
          id="hero"
          className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-teal-50 to-white pt-28 pb-20 sm:pt-36 sm:pb-28"
        >
          {/* Decorative blobs */}
          <div className="pointer-events-none absolute -top-32 -right-32 size-96 rounded-full bg-emerald-200/30 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-40 -left-40 size-[500px] rounded-full bg-teal-200/25 blur-3xl" />

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
            <motion.div {...fadeUp}>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight text-gray-900">
                {t(locale, 'landing', 'heroTitle')}{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-l from-emerald-600 to-teal-500">
                  {t(locale, 'landing', 'heroTitleHighlight')}
                </span>
              </h1>
            </motion.div>

            <motion.p
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: 0.1 }}
              className="mx-auto mt-6 max-w-2xl text-lg sm:text-xl text-gray-600 leading-relaxed"
            >
              {t(locale, 'landing', 'heroSubtitle')}
            </motion.p>

            <motion.div
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: 0.2 }}
              className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Button
                size="lg"
                onClick={() => setAppMode('app')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 text-base h-12 rounded-xl shadow-lg shadow-emerald-600/25"
              >
                {t(locale, 'landing', 'heroCta')}
                <ArrowLeft className={cn('size-4 rtl:rotate-0 ltr:rotate-180', dir === 'ltr' ? 'rotate-180' : '')} />
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => scrollTo('#how-it-works')}
                className="px-8 text-base h-12 rounded-xl border-gray-300"
              >
                <Play className="size-4" />
                {t(locale, 'landing', 'heroSecondaryCta')}
              </Button>
            </motion.div>

            {/* Trust badge */}
            <motion.div
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: 0.35 }}
              className="mt-12 inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-emerald-200/60 rounded-full px-5 py-2.5 shadow-sm"
            >
              <div className="flex -space-x-2 rtl:space-x-reverse">
                {[
                  'bg-emerald-500',
                  'bg-teal-500',
                  'bg-cyan-500',
                  'bg-emerald-600',
                ].map((bg, i) => (
                  <div
                    key={i}
                    className={cn(
                      'size-8 rounded-full border-2 border-white flex items-center justify-center text-white text-[10px] font-bold',
                      bg,
                    )}
                  >
                    {['أ', 'م', 'س', 'ع'][i]}
                  </div>
                ))}
              </div>
              <span className="text-sm text-gray-600">
                {t(locale, 'landing', 'trustedBy')}{' '}
                <strong className="text-gray-900">{t(locale, 'landing', 'businessesCount')}</strong>
              </span>
            </motion.div>
          </div>
        </section>

        {/* ============================================================ */}
        {/*  3. FEATURES SECTION                                         */}
        {/* ============================================================ */}
        <section id="features" className="py-20 sm:py-28 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <motion.div {...fadeUp} className="text-center max-w-2xl mx-auto mb-16">
              <Badge variant="secondary" className="mb-4 bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                <Zap className="size-3 me-1.5" />
                {t(locale, 'landing', 'navFeatures')}
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
                {t(locale, 'landing', 'navFeatures')}
              </h2>
              <p className="mt-4 text-gray-500 text-lg">
                {t(locale, 'landing', 'heroSubtitle').slice(0, 80)}…
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {FEATURES.map((feat, i) => {
                const Icon = feat.icon
                return (
                  <motion.div
                    key={feat.titleKey}
                    {...stagger}
                    transition={{ ...stagger.transition, delay: i * 0.08 }}
                  >
                    <Card className="group h-full border border-border/60 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-100/50 transition-all duration-300">
                      <CardContent className="p-6">
                        <div className="mb-4 inline-flex items-center justify-center size-12 rounded-xl bg-emerald-100 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300">
                          <Icon className="size-6" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {t(locale, 'landing', feat.titleKey)}
                        </h3>
                        <p className="text-sm text-gray-500 leading-relaxed">
                          {t(locale, 'landing', feat.descKey)}
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/*  4. HOW IT WORKS SECTION                                     */}
        {/* ============================================================ */}
        <section id="how-it-works" className="py-20 sm:py-28 bg-gray-50/80">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <motion.div {...fadeUp} className="text-center max-w-2xl mx-auto mb-16">
              <Badge variant="secondary" className="mb-4 bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                <ArrowLeft className="size-3 me-1.5" />
                {t(locale, 'landing', 'navHowWorks')}
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
                {t(locale, 'landing', 'navHowWorks')}
              </h2>
            </motion.div>

            {/* Desktop horizontal layout */}
            <div className="hidden md:grid grid-cols-4 gap-6 relative">
              {/* Connecting dashed line */}
              <div className="absolute top-10 right-[12.5%] left-[12.5%] border-t-2 border-dashed border-emerald-300" />

              {STEPS.map((step, i) => (
                <motion.div
                  key={step.num}
                  {...stagger}
                  transition={{ ...stagger.transition, delay: i * 0.12 }}
                  className="relative flex flex-col items-center text-center"
                >
                  <div className="relative z-10 flex items-center justify-center size-20 rounded-full bg-emerald-600 text-white text-2xl font-bold shadow-lg shadow-emerald-600/30">
                    {step.num}
                  </div>
                  <h3 className="mt-6 text-lg font-semibold text-gray-900">
                    {t(locale, 'landing', step.titleKey)}
                  </h3>
                  <p className="mt-2 text-sm text-gray-500 leading-relaxed max-w-[220px]">
                    {t(locale, 'landing', step.descKey)}
                  </p>
                </motion.div>
              ))}
            </div>

            {/* Mobile vertical layout */}
            <div className="md:hidden space-y-8">
              {STEPS.map((step, i) => (
                <motion.div
                  key={step.num}
                  {...stagger}
                  transition={{ ...stagger.transition, delay: i * 0.1 }}
                  className="relative flex gap-5"
                >
                  {/* Vertical line */}
                  {i < STEPS.length - 1 && (
                    <div className="absolute top-10 end-5 bottom-0 w-0.5 border-s border-dashed border-emerald-300" />
                  )}
                  <div className="relative z-10 flex-shrink-0 flex items-center justify-center size-14 rounded-full bg-emerald-600 text-white text-xl font-bold shadow-md">
                    {step.num}
                  </div>
                  <div className="pb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {t(locale, 'landing', step.titleKey)}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 leading-relaxed">
                      {t(locale, 'landing', step.descKey)}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/*  5. PRICING SECTION                                          */}
        {/* ============================================================ */}
        <section id="pricing" className="py-20 sm:py-28 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <motion.div {...fadeUp} className="text-center max-w-2xl mx-auto mb-12">
              <Badge variant="secondary" className="mb-4 bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                <CreditCard className="size-3 me-1.5" />
                {t(locale, 'landing', 'navPricing')}
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
                {t(locale, 'landing', 'pricingTitle')}
              </h2>
              <p className="mt-4 text-gray-500 text-lg">
                {t(locale, 'landing', 'pricingSubtitle')}
              </p>
            </motion.div>

            {/* Monthly / Yearly Toggle */}
            <motion.div {...fadeUp} className="flex items-center justify-center gap-4 mb-12">
              <span className={cn('text-sm font-medium', !isYearly ? 'text-gray-900' : 'text-gray-400')}>
                {t(locale, 'landing', 'pricingMonthly')}
              </span>
              <button
                onClick={() => setIsYearly(!isYearly)}
                className={cn(
                  'relative inline-flex h-7 w-12 items-center rounded-full transition-colors',
                  isYearly ? 'bg-emerald-600' : 'bg-gray-200',
                )}
              >
                <span
                  className={cn(
                    'inline-block size-5 rounded-full bg-white shadow-sm transition-transform',
                    isYearly ? (dir === 'rtl' ? '-translate-x-6' : 'translate-x-6') : (dir === 'rtl' ? '-translate-x-1' : 'translate-x-1'),
                  )}
                />
              </button>
              <span className={cn('text-sm font-medium', isYearly ? 'text-gray-900' : 'text-gray-400')}>
                {t(locale, 'landing', 'pricingYearly')}
              </span>
              <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200 text-[11px]">
                {t(locale, 'landing', 'pricingYearlySave')}
              </Badge>
            </motion.div>

            {/* Plan Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {PLANS.map((plan, i) => (
                <motion.div
                  key={plan.key}
                  {...stagger}
                  transition={{ ...stagger.transition, delay: i * 0.08 }}
                >
                  <Card
                    className={cn(
                      'relative flex flex-col h-full transition-all duration-300',
                      plan.popular
                        ? 'border-2 border-emerald-600 shadow-xl shadow-emerald-100/60 scale-[1.02] lg:scale-105'
                        : 'border border-border/60 hover:border-emerald-200 hover:shadow-md',
                    )}
                  >
                    {plan.popular && (
                      <div className="absolute -top-3 inset-x-0 flex justify-center">
                        <Badge className="bg-emerald-600 text-white hover:bg-emerald-600 px-3 py-0.5 text-xs">
                          {t(locale, 'landing', 'pricingPopular')}
                        </Badge>
                      </div>
                    )}

                    <CardContent className="flex flex-col flex-1 p-6 pt-8">
                      <h3 className="text-lg font-bold text-gray-900">
                        {t(locale, 'landing', plan.nameKey)}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {t(locale, 'landing', plan.descKey)}
                      </p>

                      {/* Price */}
                      <div className="mt-6 mb-6">
                        <span className="text-3xl sm:text-4xl font-extrabold text-gray-900">
                          {getPrice(plan.priceKey)}
                        </span>
                        {plan.key !== 'free' && (
                          <span className="text-sm text-gray-400 ms-1">
                            /{isYearly ? t(locale, 'landing', 'pricingYearly') : t(locale, 'landing', 'pricingMonthly')}
                          </span>
                        )}
                      </div>

                      {/* Feature List */}
                      <ul className="space-y-3 flex-1">
                        {PLAN_FEATURES.map((feat) => {
                          const planValue = feat[plan.key as keyof PlanFeature]
                          return (
                            <li key={feat.label} className="flex items-center justify-between gap-2">
                              <span className="text-sm text-gray-600 truncate">
                                {t(locale, 'landing', feat.label)}
                              </span>
                              {renderFeatureValue(planValue, locale)}
                            </li>
                          )
                        })}
                      </ul>

                      {/* CTA Button */}
                      <div className="mt-8">
                        {plan.key === 'free' && (
                          <Button
                            onClick={() => handlePlanAction('free')}
                            variant="outline"
                            className="w-full h-11 rounded-xl border-emerald-600 text-emerald-600 hover:bg-emerald-50"
                          >
                            {t(locale, 'landing', 'startFree')}
                          </Button>
                        )}
                        {plan.key === 'enterprise' && (
                          <Button
                            onClick={() => handlePlanAction('enterprise')}
                            className="w-full h-11 rounded-xl bg-gray-900 hover:bg-gray-800 text-white"
                          >
                            {t(locale, 'landing', 'contactSales')}
                          </Button>
                        )}
                        {(plan.key === 'starter' || plan.key === 'pro') && (
                          <Button
                            onClick={() => handlePlanAction(plan.key)}
                            className={cn(
                              'w-full h-11 rounded-xl',
                              plan.popular
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/25'
                                : 'bg-emerald-600 hover:bg-emerald-700 text-white',
                            )}
                          >
                            {t(locale, 'landing', 'buyNow')}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/*  6. TESTIMONIALS SECTION                                     */}
        {/* ============================================================ */}
        <section id="testimonials" className="py-20 sm:py-28 bg-gray-50/80">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <motion.div {...fadeUp} className="text-center max-w-2xl mx-auto mb-16">
              <Badge variant="secondary" className="mb-4 bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                <Users className="size-3 me-1.5" />
                {t(locale, 'landing', 'navTestimonials')}
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
                {t(locale, 'landing', 'navTestimonials')}
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
              {TESTIMONIALS.map((item, i) => (
                <motion.div
                  key={item.nameKey}
                  {...stagger}
                  transition={{ ...stagger.transition, delay: i * 0.1 }}
                >
                  <Card className="h-full border border-border/60 hover:shadow-lg transition-shadow duration-300">
                    <CardContent className="p-6">
                      {/* Quote icon */}
                      <Quote className="size-8 text-emerald-200 mb-4" />

                      {/* Stars */}
                      <div className="flex gap-0.5 mb-4">
                        {Array.from({ length: 5 }).map((_, s) => (
                          <Star
                            key={s}
                            className="size-4 fill-amber-400 text-amber-400"
                          />
                        ))}
                      </div>

                      {/* Quote text */}
                      <p className="text-gray-600 leading-relaxed mb-6">
                        &ldquo;{t(locale, 'landing', item.textKey)}&rdquo;
                      </p>

                      {/* Author */}
                      <div className="flex items-center gap-3 pt-4 border-t border-border/50">
                        <div className="flex items-center justify-center size-10 rounded-full bg-emerald-100 text-emerald-700 text-sm font-bold">
                          {t(locale, 'landing', item.nameKey).charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {t(locale, 'landing', item.nameKey)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {t(locale, 'landing', item.roleKey)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/*  7. FAQ SECTION                                              */}
        {/* ============================================================ */}
        <section id="faq" className="py-20 sm:py-28 bg-white">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <motion.div {...fadeUp} className="text-center mb-12">
              <Badge variant="secondary" className="mb-4 bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                <Shield className="size-3 me-1.5" />
                {t(locale, 'landing', 'navFaq')}
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
                {t(locale, 'landing', 'navFaq')}
              </h2>
            </motion.div>

            <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.1 }}>
              <Accordion type="single" collapsible className="w-full">
                {FAQ_ITEMS.map((faq) => (
                  <AccordionItem key={faq.value} value={faq.value}>
                    <AccordionTrigger className="text-start text-base font-semibold text-gray-900 hover:text-emerald-600 hover:no-underline">
                      {t(locale, 'landing', faq.qKey)}
                    </AccordionTrigger>
                    <AccordionContent className="text-gray-500 leading-relaxed text-sm">
                      {t(locale, 'landing', faq.aKey)}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </motion.div>
          </div>
        </section>

        {/* ============================================================ */}
        {/*  8. CTA SECTION                                              */}
        {/* ============================================================ */}
        <section className="py-20 sm:py-28 bg-gradient-to-l from-emerald-600 to-teal-600 relative overflow-hidden">
          {/* Decorative */}
          <div className="pointer-events-none absolute -top-20 -left-20 size-72 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -right-20 size-80 rounded-full bg-white/10 blur-3xl" />

          <motion.div
            {...fadeUp}
            className="relative mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center"
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight">
              {t(locale, 'landing', 'ctaTitle')}
            </h2>
            <p className="mt-4 text-emerald-100 text-lg sm:text-xl max-w-xl mx-auto">
              {t(locale, 'landing', 'ctaSubtitle')}
            </p>
            <Button
              size="lg"
              onClick={() => setAppMode('app')}
              className="mt-10 bg-white text-emerald-700 hover:bg-emerald-50 px-8 text-base h-12 rounded-xl shadow-lg shadow-black/10 font-semibold"
            >
              {t(locale, 'landing', 'ctaCta')}
              <ChevronLeft className="size-4" />
            </Button>
          </motion.div>
        </section>
      </main>

      {/* ============================================================ */}
      {/*  9. FOOTER                                                    */}
      {/* ============================================================ */}
      <footer className="bg-gray-900 text-gray-300">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
            {/* Column 1: Logo + Description */}
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center justify-center size-9 rounded-lg bg-emerald-600 text-white">
                  <CalendarDays className="size-5" />
                </div>
                <span className="text-xl font-bold text-white">BookFlow</span>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed max-w-xs">
                {t(locale, 'landing', 'footerDescription')}
              </p>
            </div>

            {/* Column 2: Product */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">
                {t(locale, 'landing', 'footerProduct')}
              </h4>
              <ul className="space-y-2.5">
                <li>
                  <button onClick={() => scrollTo('#features')} className="text-sm text-gray-400 hover:text-emerald-400 transition-colors">
                    {t(locale, 'landing', 'navFeatures')}
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollTo('#pricing')} className="text-sm text-gray-400 hover:text-emerald-400 transition-colors">
                    {t(locale, 'landing', 'navPricing')}
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollTo('#how-it-works')} className="text-sm text-gray-400 hover:text-emerald-400 transition-colors">
                    {t(locale, 'landing', 'navHowWorks')}
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 3: Company */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">
                {t(locale, 'landing', 'footerCompany')}
              </h4>
              <ul className="space-y-2.5">
                <li>
                  <span className="text-sm text-gray-400 hover:text-emerald-400 transition-colors cursor-pointer">
                    {t(locale, 'landing', 'footerAboutUs')}
                  </span>
                </li>
                <li>
                  <span className="text-sm text-gray-400 hover:text-emerald-400 transition-colors cursor-pointer">
                    {t(locale, 'landing', 'footerBlog')}
                  </span>
                </li>
                <li>
                  <span className="text-sm text-gray-400 hover:text-emerald-400 transition-colors cursor-pointer">
                    {t(locale, 'landing', 'footerCareers')}
                  </span>
                </li>
              </ul>
            </div>

            {/* Column 4: Support + Legal */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">
                {t(locale, 'landing', 'footerSupport')}
              </h4>
              <ul className="space-y-2.5">
                <li>
                  <span className="text-sm text-gray-400 hover:text-emerald-400 transition-colors cursor-pointer">
                    {t(locale, 'landing', 'footerHelpCenter')}
                  </span>
                </li>
                <li>
                  <span className="text-sm text-gray-400 hover:text-emerald-400 transition-colors cursor-pointer">
                    {t(locale, 'landing', 'footerContactUs')}
                  </span>
                </li>
                <li>
                  <span className="text-sm text-gray-400 hover:text-emerald-400 transition-colors cursor-pointer">
                    {t(locale, 'landing', 'footerPrivacy')}
                  </span>
                </li>
                <li>
                  <span className="text-sm text-gray-400 hover:text-emerald-400 transition-colors cursor-pointer">
                    {t(locale, 'landing', 'footerTerms')}
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-sm text-gray-500">
              © 2025 BookFlow. {t(locale, 'landing', 'footerRights')}.
            </p>
            <p className="text-xs text-gray-600">
              {t(locale, 'common', 'secure')} · {t(locale, 'common', 'fast')} · {t(locale, 'common', 'multilingual')}
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}