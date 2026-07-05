'use client'

import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CreditCard,
  Building2,
  Upload,
  Copy,
  Check,
  Loader2,
  ImageIcon,
  FileText,
  X,
  ShieldCheck,
  ArrowLeft,
} from 'lucide-react'
import { useAppStore } from '@/stores/app-store'
import { t, getDirection, formatCurrency } from '@/lib/i18n'
import type { Locale } from '@/lib/i18n'
import { cn } from '@/lib/utils'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'

const planPrices: Record<string, number> = {
  free: 0,
  starter: 99,
  pro: 249,
  enterprise: 599,
}

const planNameKeys: Record<string, string> = {
  free: 'planFree',
  starter: 'planStarter',
  pro: 'planPro',
  enterprise: 'planEnterprise',
}

type PaymentMethod = 'paytab' | 'paypal' | 'bank'
type Step = 'select' | 'process' | 'bank' | 'success'

function generateRef() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let ref = 'BF-'
  for (let i = 0; i < 8; i++) ref += chars[Math.floor(Math.random() * chars.length)]
  return ref
}

export function PaymentModal() {
  const {
    locale,
    selectedPlan,
    showPaymentModal,
    setShowPaymentModal,
    setSelectedPlan,
    setAppMode,
  } = useAppStore()
  const dir = getDirection(locale)

  const [step, setStep] = useState<Step>('select')
  const [method, setMethod] = useState<PaymentMethod | null>(null)
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  const [refNumber] = useState(generateRef)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const planKey = selectedPlan || 'free'
  const price = planPrices[planKey] || 0
  const planName = t(locale, 'landing', planNameKeys[planKey])

  const handleClose = useCallback((open: boolean) => {
    if (!open) {
      setShowPaymentModal(false)
      setSelectedPlan(null)
      setStep('select')
      setMethod(null)
      setReceiptFile(null)
      setReceiptPreview(null)
      setProcessing(false)
    }
  }, [setShowPaymentModal, setSelectedPlan])

  const handleMethodSelect = (m: PaymentMethod) => {
    setMethod(m)
    if (m === 'paytab' || m === 'paypal') {
      setStep('process')
      setProcessing(true)
      setTimeout(() => {
        setProcessing(false)
        setStep('success')
      }, 2000)
    } else {
      setStep('bank')
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error('حجم الملف يتجاوز 5MB')
      return
    }
    setReceiptFile(file)
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (ev) => setReceiptPreview(ev.target?.result as string)
      reader.readAsDataURL(file)
    } else {
      setReceiptPreview(null)
    }
  }

  const handleRemoveReceipt = () => {
    setReceiptFile(null)
    setReceiptPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSubmitBank = () => {
    if (!receiptFile) {
      toast.error(t(locale, 'payment', 'receiptRequired'))
      return
    }
    setProcessing(true)
    setTimeout(() => {
      setProcessing(false)
      setStep('success')
      toast.success(t(locale, 'payment', 'receiptUploaded'))
    }, 1500)
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success(t(locale, 'common', 'copied'))
  }

  const handleGoToDashboard = () => {
    handleClose(false)
    setAppMode('app')
  }

  return (
    <Dialog open={showPaymentModal} onOpenChange={handleClose}>
      <DialogContent
        dir={dir}
        className="sm:max-w-lg p-0 overflow-hidden"
      >
        <DialogHeader className="sr-only">
          <DialogTitle>{t(locale, 'payment', 'title')}</DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {/* ── Step 1: Select Payment Method ──────────────────── */}
          {step === 'select' && (
            <motion.div
              key="select"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-6 space-y-6"
            >
              <div className="text-center space-y-2">
                <h2 className="text-xl font-bold">{t(locale, 'payment', 'title')}</h2>
                <div className="flex items-center justify-center gap-3">
                  <Badge variant="outline" className="text-base px-3 py-1">
                    {planName}
                  </Badge>
                  <span className="text-2xl font-bold text-emerald-600">
                    {formatCurrency(price, 'SAR', locale)}
                  </span>
                  <span className="text-muted-foreground text-sm">
                    / {t(locale, 'payment', 'month')}
                  </span>
                </div>
              </div>

              <Separator />

              <p className="text-sm font-medium text-muted-foreground text-center">
                {t(locale, 'payment', 'selectPlan')}
              </p>

              <div className="space-y-3">
                {/* PayTab */}
                <button
                  dir={dir}
                  onClick={() => handleMethodSelect('paytab')}
                  className={cn(
                    'w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-start',
                    method === 'paytab'
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20'
                      : 'border-border hover:border-emerald-300 hover:bg-muted/50'
                  )}
                >
                  <div className={cn(
                    'flex size-12 shrink-0 items-center justify-center rounded-xl',
                    method === 'paytab' ? 'bg-emerald-100 dark:bg-emerald-900/40' : 'bg-muted'
                  )}>
                    <CreditCard className={cn(
                      'size-6',
                      method === 'paytab' ? 'text-emerald-600' : 'text-muted-foreground'
                    )} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold">{t(locale, 'payment', 'paytab')}</p>
                    <p className="text-sm text-muted-foreground">{t(locale, 'payment', 'paytabDesc')}</p>
                  </div>
                  {method === 'paytab' && <Check className="size-5 text-emerald-600 shrink-0" />}
                </button>

                {/* PayPal */}
                <button
                  dir={dir}
                  onClick={() => handleMethodSelect('paypal')}
                  className={cn(
                    'w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-start',
                    method === 'paypal'
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20'
                      : 'border-border hover:border-emerald-300 hover:bg-muted/50'
                  )}
                >
                  <div className={cn(
                    'flex size-12 shrink-0 items-center justify-center rounded-xl',
                    method === 'paypal' ? 'bg-emerald-100 dark:bg-emerald-900/40' : 'bg-muted'
                  )}>
                    <ShieldCheck className={cn(
                      'size-6',
                      method === 'paypal' ? 'text-emerald-600' : 'text-muted-foreground'
                    )} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold">{t(locale, 'payment', 'paypal')}</p>
                    <p className="text-sm text-muted-foreground">{t(locale, 'payment', 'paypalDesc')}</p>
                  </div>
                  {method === 'paypal' && <Check className="size-5 text-emerald-600 shrink-0" />}
                </button>

                {/* Bank Transfer */}
                <button
                  dir={dir}
                  onClick={() => handleMethodSelect('bank')}
                  className={cn(
                    'w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-start',
                    method === 'bank'
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20'
                      : 'border-border hover:border-emerald-300 hover:bg-muted/50'
                  )}
                >
                  <div className={cn(
                    'flex size-12 shrink-0 items-center justify-center rounded-xl',
                    method === 'bank' ? 'bg-emerald-100 dark:bg-emerald-900/40' : 'bg-muted'
                  )}>
                    <Building2 className={cn(
                      'size-6',
                      method === 'bank' ? 'text-emerald-600' : 'text-muted-foreground'
                    )} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold">{t(locale, 'payment', 'bankTransfer')}</p>
                    <p className="text-sm text-muted-foreground">{t(locale, 'payment', 'bankTransferDesc')}</p>
                  </div>
                  {method === 'bank' && <Check className="size-5 text-emerald-600 shrink-0" />}
                </button>
              </div>
            </motion.div>
          )}

          {/* ── Step 2a: Processing (PayTab/PayPal) ───────────── */}
          {step === 'process' && (
            <motion.div
              key="process"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-6 flex flex-col items-center justify-center space-y-6 min-h-[320px]"
            >
              <Loader2 className="size-12 text-emerald-600 animate-spin" />
              <div className="text-center space-y-2">
                <p className="text-lg font-semibold">{t(locale, 'payment', 'paymentProcessing')}</p>
                <p className="text-sm text-muted-foreground">
                  {method === 'paytab'
                    ? t(locale, 'payment', 'paytabRedirect')
                    : t(locale, 'payment', 'paypalRedirect')}
                </p>
              </div>
            </motion.div>
          )}

          {/* ── Step 2b: Bank Transfer Form ───────────────────── */}
          {step === 'bank' && (
            <motion.div
              key="bank"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              dir={dir}
              className="p-6 space-y-5 max-h-[80vh] overflow-y-auto"
            >
              {/* Back button */}
              <button
                onClick={() => setStep('select')}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="size-4 rtl-flip" />
                {t(locale, 'common', 'back')}
              </button>

              {/* Bank Details */}
              <div className="rounded-xl bg-muted/50 p-4 space-y-3">
                <h3 className="font-semibold text-sm">{t(locale, 'payment', 'bankDetails')}</h3>
                <div className="space-y-2.5 text-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-muted-foreground">{t(locale, 'payment', 'bankName')}</p>
                      <p className="font-medium">{t(locale, 'payment', 'bankNameValue')}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{t(locale, 'payment', 'accountName')}</p>
                    <p className="font-medium">{t(locale, 'payment', 'accountNameValue')}</p>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-muted-foreground">{t(locale, 'payment', 'accountNumber')}</p>
                      <p className="font-mono text-xs font-medium">{t(locale, 'payment', 'accountNumberValue')}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 shrink-0"
                      onClick={() => handleCopy(t(locale, 'payment', 'accountNumberValue'))}
                    >
                      <Copy className="size-3.5" />
                    </Button>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-muted-foreground">{t(locale, 'payment', 'referenceNumber')}</p>
                      <p className="font-mono text-sm font-bold text-emerald-600">{refNumber}</p>
                      <p className="text-xs text-muted-foreground">{t(locale, 'payment', 'referenceNumberDesc')}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 shrink-0"
                      onClick={() => handleCopy(refNumber)}
                    >
                      <Copy className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Upload Receipt */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm">{t(locale, 'payment', 'uploadReceipt')}</h3>
                <p className="text-xs text-muted-foreground">{t(locale, 'payment', 'uploadReceiptDesc')}</p>

                {receiptFile && receiptPreview ? (
                  <div className="relative rounded-xl overflow-hidden border-2 border-emerald-200 dark:border-emerald-800">
                    <img
                      src={receiptPreview}
                      alt={t(locale, 'payment', 'receiptPreview')}
                      className="w-full max-h-48 object-contain bg-muted/30 p-2"
                    />
                    <button
                      onClick={handleRemoveReceipt}
                      className="absolute top-2 end-2 size-7 flex items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                    >
                      <X className="size-4" />
                    </button>
                    <div className="p-2 bg-muted/50">
                      <p className="text-xs text-muted-foreground truncate flex items-center gap-1.5">
                        <ImageIcon className="size-3.5 shrink-0" />
                        {receiptFile.name}
                      </p>
                    </div>
                  </div>
                ) : receiptFile ? (
                  <div className="flex items-center gap-3 p-3 rounded-xl border-2 border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/20">
                    <FileText className="size-8 text-emerald-600 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{receiptFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(receiptFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <button
                      onClick={handleRemoveReceipt}
                      className="size-7 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full border-2 border-dashed rounded-xl p-8 text-center hover:border-emerald-400 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/10 transition-all cursor-pointer group"
                  >
                    <Upload className="size-10 mx-auto mb-3 text-muted-foreground group-hover:text-emerald-500 transition-colors" />
                    <p className="text-sm font-medium">{t(locale, 'payment', 'selectFile')}</p>
                    <p className="text-xs text-muted-foreground mt-1">{t(locale, 'payment', 'dragDrop')}</p>
                    <p className="text-xs text-muted-foreground mt-2">{t(locale, 'payment', 'uploadReceiptHint')}</p>
                  </button>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              {/* Submit */}
              <Button
                onClick={handleSubmitBank}
                disabled={processing || !receiptFile}
                className="w-full bg-emerald-600 hover:bg-emerald-700 h-11 gap-2"
              >
                {processing ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Upload className="size-4" />
                )}
                {t(locale, 'common', 'submit')}
              </Button>
            </motion.div>
          )}

          {/* ── Step 3: Success ────────────────────────────────── */}
          {step === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              dir={dir}
              className="p-6 flex flex-col items-center text-center space-y-5 min-h-[320px] justify-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
                className="flex size-20 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30"
              >
                <Check className="size-10 text-emerald-600" />
              </motion.div>
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-emerald-600">
                  {t(locale, 'payment', 'paymentSuccess')}
                </h2>
                <p className="text-sm text-muted-foreground max-w-xs">
                  {t(locale, 'payment', 'paymentSuccessDesc')}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full pt-2">
                <Button
                  variant="outline"
                  onClick={() => handleClose(false)}
                  className="flex-1"
                >
                  {t(locale, 'payment', 'backToPlans')}
                </Button>
                <Button
                  onClick={handleGoToDashboard}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                >
                  {t(locale, 'payment', 'goToDashboard')}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  )
}