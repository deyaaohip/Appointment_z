'use client'

import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import {
  X, Printer, Download, Mail, Copy, CheckCircle2, FileText,
  Clock, CreditCard, ArrowRightLeft, AlertTriangle, RotateCcw, Send,
} from 'lucide-react'
import { useSA, StatusBadge, useCurrency } from './sa-helpers'
import { type Invoice } from './sa-data'

// ─── Simple QR Code SVG Generator ──────────────────────────────
function SimpleQRCode({ data, size = 120 }: { data: string; size?: number }) {
  const hash = Array.from(data).reduce((acc, c) => ((acc << 5) - acc + c.charCodeAt(0)) | 0, 0)
  const cells = 21
  const matrix: boolean[][] = Array.from({ length: cells }, () => Array(cells).fill(false))
  const seed = Math.abs(hash)
  const rng = (i: number) => { let x = Math.sin(seed + i * 127.1) * 43758.5453; return x - Math.floor(x) }
  const drawFinder = (r: number, c: number) => {
    for (let i = 0; i < 7; i++) for (let j = 0; j < 7; j++) {
      const isBorder = i === 0 || i === 6 || j === 0 || j === 6
      const isInner = i >= 2 && i <= 4 && j >= 2 && j <= 4
      matrix[r + i][c + j] = isBorder || isInner
    }
  }
  drawFinder(0, 0); drawFinder(0, 14); drawFinder(14, 0)
  let idx = 0
  for (let r = 0; r < cells; r++) for (let c = 0; c < cells; c++) {
    if (matrix[r][c]) continue
    const inTL = r < 8 && c < 8; const inTR = r < 8 && c > 12; const inBL = r > 12 && c < 8
    if (inTL || inTR || inBL) continue
    if (rng(idx++) > 0.5) matrix[r][c] = true
  }
  const cellSize = size / cells
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="mx-auto">
      <rect width={size} height={size} fill="white" rx="4" />
      {matrix.map((row, r) => row.map((filled, c) => filled ? (
        <rect key={`${r}-${c}`} x={c * cellSize} y={r * cellSize} width={cellSize} height={cellSize} fill="#1a1a2e" rx={0.5} />
      ) : null))}
    </svg>
  )
}

// ─── Payment Method Label ──────────────────────────────────────
function payMethodLabel(method: string, lang: 'ar' | 'en'): string {
  if (!method) return lang === 'ar' ? '—' : '—'
  const map: Record<string, { ar: string; en: string }> = {
    cliq: { ar: 'CLIQ تحويل', en: 'CLIQ Transfer' },
    card: { ar: 'بطاقة ائتمان', en: 'Credit Card' },
    bank_transfer: { ar: 'تحويل بنكي', en: 'Bank Transfer' },
  }
  return map[method]?.[lang] || method
}

// ─── Invoice Preview Component ──────────────────────────────────
export function InvoicePreviewDialog({
  invoice,
  open,
  onClose,
  onStatusChange,
}: {
  invoice: Invoice
  open: boolean
  onClose: () => void
  onStatusChange?: (invoiceId: string, newStatus: string, method?: string) => void
}) {
  const { isRTL, lang } = useSA()
  const { sym } = useCurrency()
  const printRef = useRef<HTMLDivElement>(null)
  const [taxRate, setTaxRate] = useState(invoice.taxRate || 16)
  const [showTaxInput, setShowTaxInput] = useState(false)
  const [sending, setSending] = useState(false)
  const [copied, setCopied] = useState(false)
  const [payMethodDlg, setPayMethodDlg] = useState(false)
  const [selectedMethod, setSelectedMethod] = useState('cliq')

  if (!open || !invoice) return null

  const subtotal = invoice.amount
  const tax = Math.round(subtotal * taxRate / 100)
  const total = subtotal + tax
  const ar = lang === 'ar'

  const isPaid = invoice.status === 'paid'
  const isPending = invoice.status === 'pending'
  const isOverdue = invoice.status === 'overdue'
  const isFailed = invoice.status === 'failed'

  // Calculate days until due / days overdue
  const now = new Date()
  const due = new Date(invoice.dueDate)
  const diffMs = due.getTime() - now.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
  const isOverdueNow = diffDays < 0 && !isPaid

  const handleMarkPaid = () => {
    if (!onStatusChange) return
    onStatusChange(invoice.id, 'paid', selectedMethod)
    setPayMethodDlg(false)
  }

  const handleRefund = () => {
    if (!onStatusChange) return
    onStatusChange(invoice.id, 'refunded')
    toast.success(ar ? 'تم إرجاع الفاتورة' : 'Invoice refunded')
  }

  const handleSendReminder = () => {
    toast.success(ar ? `تم إرسال تذكير لفاتورة ${invoice.id}` : `Reminder sent for ${invoice.id}`)
  }

  const handlePrint = () => {
    const content = printRef.current
    if (!content) return
    const printWindow = window.open('', '_blank', 'width=800,height=600')
    if (!printWindow) { toast.error(ar ? 'فشل فتح نافذة الطباعة' : 'Failed to open print window'); return }
    printWindow.document.write(`
      <!DOCTYPE html><html dir="${isRTL ? 'rtl' : 'ltr'}"><head>
      <title>${ar ? 'فاتورة' : 'Invoice'} ${invoice.id}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, sans-serif; padding: 40px; color: #1a1a2e; }
        .invoice { max-width: 700px; margin: 0 auto; border: 2px solid #e5e7eb; border-radius: 12px; padding: 32px; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; padding-bottom: 20px; border-bottom: 2px solid #7c3aed; }
        .logo { font-size: 24px; font-weight: 800; color: #7c3aed; }
        .logo-sub { font-size: 12px; color: #666; }
        .inv-id { font-size: 14px; font-weight: 700; font-family: monospace; }
        .details { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px; }
        .detail-label { font-size: 11px; color: #888; margin-bottom: 4px; }
        .detail-value { font-size: 14px; font-weight: 600; }
        .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .table th { background: #f5f3ff; padding: 10px 12px; font-size: 11px; text-align: left; text-transform: uppercase; letter-spacing: 0.5px; color: #555; border-bottom: 2px solid #ddd6fe; }
        .table td { padding: 10px 12px; font-size: 13px; border-bottom: 1px solid #eee; }
        .amounts { margin-left: auto; width: 250px; }
        .amount-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; }
        .amount-row.total { border-top: 2px solid #7c3aed; padding-top: 10px; margin-top: 4px; font-size: 18px; font-weight: 800; color: #7c3aed; }
        .amount-label { color: #666; }
        .footer { margin-top: 24px; padding-top: 16px; border-top: 1px solid #eee; text-align: center; font-size: 11px; color: #999; }
        .history { margin-top: 20px; }
        .history-item { display: flex; gap: 12px; padding: 8px 0; border-bottom: 1px solid #f3f4f6; font-size: 12px; }
        .history-date { color: #888; white-space: nowrap; min-width: 120px; }
        .history-action { font-weight: 600; }
        @media print { body { padding: 20px; } }
      </style></head><body>
      <div class="invoice">
        <div class="header">
          <div><div class="logo">BookFlow</div><div class="logo-sub">${ar ? 'منصة الحجز الإلكتروني' : 'Electronic Booking Platform'}</div></div>
          <div style="text-align: right;"><div class="inv-id">${invoice.id}</div></div>
        </div>
        <div class="details">
          <div><div class="detail-label">${ar ? 'المستأجر' : 'Tenant'}</div><div class="detail-value">${isRTL ? invoice.tenant : (invoice.tenantEn || invoice.tenant)}</div></div>
          <div><div class="detail-label">${ar ? 'تاريخ الإنشاء' : 'Date'}</div><div class="detail-value">${invoice.date}</div></div>
          <div><div class="detail-label">${ar ? 'تاريخ الاستحقاق' : 'Due Date'}</div><div class="detail-value">${invoice.dueDate}</div></div>
          <div><div class="detail-label">${ar ? 'الباقة' : 'Plan'}</div><div class="detail-value">${invoice.plan}</div></div>
          ${invoice.paymentMethod ? `<div><div class="detail-label">${ar ? 'طريقة الدفع' : 'Payment Method'}</div><div class="detail-value">${payMethodLabel(invoice.paymentMethod, lang)}</div></div>` : ''}
          ${invoice.paidDate ? `<div><div class="detail-label">${ar ? 'تاريخ الدفع' : 'Paid Date'}</div><div class="detail-value">${invoice.paidDate}</div></div>` : ''}
        </div>
        <table class="table">
          <thead><tr><th>${ar ? 'الوصف' : 'Description'}</th><th style="text-align: right;">${ar ? 'المبلغ' : 'Amount'}</th></tr></thead>
          <tbody>
            <tr><td>${ar ? 'اشتراك الباقة' : 'Plan Subscription'} - ${invoice.plan} (${ar ? 'شهري' : 'Monthly'})</td><td style="text-align: right; font-weight: 600;">${subtotal.toLocaleString()} ${sym}</td></tr>
            <tr><td>${ar ? 'ضريبة المبيعات' : 'Sales Tax'} (${taxRate}%)</td><td style="text-align: right;">${tax.toLocaleString()} ${sym}</td></tr>
          </tbody>
        </table>
        <div class="amounts">
          <div class="amount-row"><span class="amount-label">${ar ? 'المجموع الفرعي' : 'Subtotal'}</span><span>${subtotal.toLocaleString()} ${sym}</span></div>
          <div class="amount-row"><span class="amount-label">${ar ? 'الضريبة' : 'Tax'} (${taxRate}%)</span><span>${tax.toLocaleString()} ${sym}</span></div>
          <div class="amount-row total"><span>${ar ? 'الإجمالي' : 'Total'}</span><span>${total.toLocaleString()} ${sym}</span></div>
        </div>
        ${invoice.history && invoice.history.length > 1 ? `
        <div class="history">
          <h4 style="font-size: 13px; font-weight: 700; margin-bottom: 8px;">${ar ? 'سجل الفاتورة' : 'Invoice History'}</h4>
          ${invoice.history.map(h => `<div class="history-item"><span class="history-date">${new Date(h.date).toLocaleString(lang === 'ar' ? 'ar-JO' : 'en-JO')}</span><span class="history-action">${lang === 'en' ? h.actionEn : h.action}</span><span style="color: #666;">${lang === 'en' ? h.detailsEn : h.details}</span></div>`).join('')}
        </div>` : ''}
        <div class="footer">${ar ? 'شكراً لاستخدامكم منصة BookFlow' : 'Thank you for using BookFlow Platform'}<br/>support@bookflow.com</div>
      </div>
      <script>window.onload = function() { window.print(); }</script>
      </body></html>`)
    printWindow.document.close()
  }

  const handleDownloadPDF = () => { handlePrint() }

  const handleSendEmail = async () => {
    setSending(true)
    await new Promise(resolve => setTimeout(resolve, 1500))
    setSending(false)
    toast.success(ar ? `تم إرسال الفاتورة ${invoice.id} بالبريد الإلكتروني` : `Invoice ${invoice.id} sent via email`)
  }

  const handleCopyLink = () => {
    const invUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/invoice/${invoice.id}`
    navigator.clipboard.writeText(invUrl).then(() => {
      setCopied(true); toast.success(ar ? 'تم نسخ الرابط' : 'Link copied')
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <>
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-background rounded-2xl shadow-2xl border w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden"
        dir={isRTL ? 'rtl' : 'ltr'}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-900/30">
              <FileText className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold">{ar ? 'فاتورة' : 'Invoice'}</h2>
              <p className="text-xs text-muted-foreground font-mono">{invoice.id}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={invoice.status} locale={lang} />
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={onClose}><X className="h-4 w-4" /></Button>
          </div>
        </div>

        {/* Invoice Content */}
        <div className="flex-1 overflow-y-auto p-5" ref={printRef}>
          <div className="border rounded-xl p-6 sm:p-8 space-y-6">
            {/* Invoice Header */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-2xl font-extrabold text-violet-600">BookFlow</h3>
                <p className="text-xs text-muted-foreground mt-1">{ar ? 'منصة الحجز الإلكتروني' : 'Electronic Booking Platform'}</p>
                <p className="text-xs text-muted-foreground" dir="ltr">support@bookflow.com</p>
              </div>
              <div className="text-end">
                <p className="text-xl font-bold font-mono">{invoice.id}</p>
                <div className="mt-2"><StatusBadge status={invoice.status} locale={lang} /></div>
              </div>
            </div>

            <Separator />

            {/* Invoice Details Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-[11px] text-muted-foreground mb-1">{ar ? 'المستأجر' : 'Tenant'}</p>
                <p className="font-semibold">{isRTL ? invoice.tenant : (invoice.tenantEn || invoice.tenant)}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground mb-1">{ar ? 'تاريخ الإنشاء' : 'Date'}</p>
                <p className="font-semibold">{invoice.date}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground mb-1">{ar ? 'تاريخ الاستحقاق' : 'Due Date'}</p>
                <p className={`font-semibold ${isOverdueNow ? 'text-red-500' : ''}`}>{invoice.dueDate}</p>
                {isOverdueNow && <p className="text-[10px] text-red-500 mt-0.5">{Math.abs(diffDays)} {ar ? 'يوم متأخر' : 'days overdue'}</p>}
                {!isOverdueNow && !isPaid && diffDays > 0 && diffDays <= 7 && <p className="text-[10px] text-amber-500 mt-0.5">{ar ? `مستحق خلال ${diffDays} يوم` : `due in ${diffDays} days`}</p>}
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground mb-1">{ar ? 'الباقة' : 'Plan'}</p>
                <p className="font-semibold">{invoice.plan}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground mb-1">{ar ? 'العملة' : 'Currency'}</p>
                <p className="font-semibold">{invoice.currency}</p>
              </div>
              {invoice.paymentMethod && (
                <div>
                  <p className="text-[11px] text-muted-foreground mb-1">{ar ? 'طريقة الدفع' : 'Payment Method'}</p>
                  <p className="font-semibold">{payMethodLabel(invoice.paymentMethod, lang)}</p>
                </div>
              )}
              {invoice.paidDate && (
                <div>
                  <p className="text-[11px] text-muted-foreground mb-1">{ar ? 'تاريخ الدفع' : 'Paid Date'}</p>
                  <p className="font-semibold text-emerald-600">{invoice.paidDate}</p>
                </div>
              )}
            </div>

            {/* Status Action Buttons */}
            {(isPending || isOverdue || isPaid || isFailed) && (
              <div className="flex flex-wrap gap-2">
                {isPending && (
                  <>
                    <Button size="sm" className="gap-1.5 h-8 bg-emerald-600 hover:bg-emerald-700 text-white text-xs" onClick={() => setPayMethodDlg(true)}>
                      <CheckCircle2 className="h-3.5 w-3.5" />{ar ? 'تحديد كمدفوع' : 'Mark Paid'}
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs" onClick={handleSendReminder}>
                      <Send className="h-3.5 w-3.5" />{ar ? 'إرسال تذكير' : 'Send Reminder'}
                    </Button>
                  </>
                )}
                {isOverdue && (
                  <>
                    <Button size="sm" className="gap-1.5 h-8 bg-emerald-600 hover:bg-emerald-700 text-white text-xs" onClick={() => setPayMethodDlg(true)}>
                      <CheckCircle2 className="h-3.5 w-3.5" />{ar ? 'تحديد كمدفوع' : 'Mark Paid'}
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs text-amber-600 border-amber-300" onClick={handleSendReminder}>
                      <AlertTriangle className="h-3.5 w-3.5" />{ar ? 'إرسال تذكير تأخير' : 'Overdue Reminder'}
                    </Button>
                  </>
                )}
                {isPaid && (
                  <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs text-red-500 border-red-300" onClick={handleRefund}>
                    <RotateCcw className="h-3.5 w-3.5" />{ar ? 'إرجاع' : 'Refund'}
                  </Button>
                )}
                {isFailed && (
                  <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs" onClick={handleSendReminder}>
                    <ArrowRightLeft className="h-3.5 w-3.5" />{ar ? 'إعادة المحاولة' : 'Retry'}
                  </Button>
                )}
              </div>
            )}

            {/* Line Items */}
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="px-4 py-3 text-start text-xs font-semibold uppercase tracking-wider">{ar ? 'الوصف' : 'Description'}</th>
                    <th className="px-4 py-3 text-end text-xs font-semibold uppercase tracking-wider w-32">{ar ? 'المبلغ' : 'Amount'}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t">
                    <td className="px-4 py-3">
                      <p className="font-medium">{ar ? `اشتراك الباقة ${invoice.plan}` : `${invoice.plan} Plan Subscription`}</p>
                      <p className="text-xs text-muted-foreground">{ar ? 'شهري' : 'Monthly'}</p>
                    </td>
                    <td className="px-4 py-3 text-end font-semibold tabular-nums">{subtotal.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">{sym}</span></td>
                  </tr>
                  <tr className="border-t">
                    <td className="px-4 py-3">
                      <p className="font-medium">{ar ? `ضريبة المبيعات (${taxRate}%)` : `Sales Tax (${taxRate}%)`}</p>
                    </td>
                    <td className="px-4 py-3 text-end tabular-nums text-muted-foreground">{tax.toLocaleString()} <span className="text-xs">{sym}</span></td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">{ar ? 'المجموع الفرعي' : 'Subtotal'}</span><span className="tabular-nums">{subtotal.toLocaleString()} {sym}</span></div>
                <div className="flex justify-between text-sm items-center gap-2">
                  <span className="text-muted-foreground">{ar ? 'الضريبة' : 'Tax'}</span>
                  <div className="flex items-center gap-1">
                    {showTaxInput ? (
                      <Input type="number" value={taxRate} onChange={e => setTaxRate(Number(e.target.value))} className="w-16 h-7 text-xs text-end" dir="ltr" min={0} max={50} />
                    ) : (
                      <span className="tabular-nums">{taxRate}%</span>
                    )}
                    <button onClick={() => setShowTaxInput(!showTaxInput)} className="text-[10px] text-violet-600 hover:underline">{ar ? 'تعديل' : 'edit'}</button>
                  </div>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-extrabold text-violet-700 dark:text-violet-400">
                  <span>{ar ? 'الإجمالي' : 'Total'}</span>
                  <span className="tabular-nums">{total.toLocaleString()} {sym}</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            {invoice.notes && (
              <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-3">
                <p className="text-[11px] text-amber-700 dark:text-amber-400 font-semibold mb-1">{ar ? 'ملاحظات' : 'Notes'}</p>
                <p className="text-xs text-amber-600 dark:text-amber-500">{invoice.notes}</p>
              </div>
            )}

            {/* QR Code */}
            <div className="flex items-center justify-center pt-2">
              <div className="border rounded-xl p-4 bg-white inline-block">
                <SimpleQRCode data={`BOOKFLOW-${invoice.id}-${invoice.amount}-${invoice.date}`} size={140} />
                <p className="text-[10px] text-center text-muted-foreground mt-2">{ar ? 'امسح للدفع' : 'Scan to pay'}</p>
              </div>
            </div>

            {/* Invoice History Timeline */}
            {invoice.history && invoice.history.length > 0 && (
              <div>
                <Separator className="mb-4" />
                <h4 className="text-sm font-bold mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  {ar ? 'سجل الفاتورة' : 'Invoice History'}
                </h4>
                <div className="relative space-y-0">
                  {invoice.history.map((h, i) => (
                    <div key={i} className="flex gap-3 pb-3 last:pb-0">
                      <div className="flex flex-col items-center">
                        <div className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 ${i === 0 ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-600' : 'bg-muted text-muted-foreground'}`}>
                          <div className="h-2 w-2 rounded-full bg-current" />
                        </div>
                        {i < invoice.history.length - 1 && <div className="w-px flex-1 bg-border mt-1" />}
                      </div>
                      <div className="min-w-0 flex-1 pb-2">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-xs font-semibold">{lang === 'en' ? h.actionEn : h.action}</p>
                          <span className="text-[10px] text-muted-foreground">{new Date(h.date).toLocaleString(lang === 'ar' ? 'ar-JO' : 'en-JO')}</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground">{lang === 'en' ? h.detailsEn : h.details}</p>
                        <p className="text-[10px] text-muted-foreground">{ar ? 'بواسطة' : 'By'}: {h.by}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="text-center text-xs text-muted-foreground pt-2 border-t">
              <p>{ar ? 'شكراً لاستخدامكم منصة BookFlow' : 'Thank you for using BookFlow Platform'}</p>
              <p className="mt-1">support@bookflow.com</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-5 border-t bg-muted/30 flex flex-wrap items-center justify-end gap-2">
          <Button variant="outline" className="gap-2 h-9" onClick={handleCopyLink}>
            {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? (ar ? 'تم النسخ' : 'Copied') : (ar ? 'نسخ الرابط' : 'Copy Link')}
          </Button>
          <Button variant="outline" className="gap-2 h-9" onClick={handleSendEmail} disabled={sending}>
            <Mail className="h-4 w-4" />
            {sending ? (ar ? 'جاري الإرسال...' : 'Sending...') : (ar ? 'إرسال بالبريد' : 'Send Email')}
          </Button>
          <Button variant="outline" className="gap-2 h-9" onClick={handleDownloadPDF}>
            <Download className="h-4 w-4" />{ar ? 'تحميل PDF' : 'Download PDF'}
          </Button>
          <Button className="gap-2 h-9 bg-violet-600 hover:bg-violet-700 text-white" onClick={handlePrint}>
            <Printer className="h-4 w-4" />{ar ? 'طباعة' : 'Print'}
          </Button>
        </div>
      </motion.div>
    </div>

    {/* Payment Method Selection Dialog */}
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50" onClick={() => setPayMethodDlg(false)}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-background rounded-xl shadow-2xl border w-full max-w-sm p-5"
        dir={isRTL ? 'rtl' : 'ltr'}
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-base font-bold mb-4">{ar ? 'اختر طريقة الدفع' : 'Select Payment Method'}</h3>
        <div className="space-y-2">
          {[
            { key: 'cliq', label: ar ? 'CLIQ تحويل' : 'CLIQ Transfer', icon: <CreditCard className="h-4 w-4" /> },
            { key: 'card', label: ar ? 'بطاقة ائتمان' : 'Credit Card', icon: <CreditCard className="h-4 w-4" /> },
            { key: 'bank_transfer', label: ar ? 'تحويل بنكي' : 'Bank Transfer', icon: <ArrowRightLeft className="h-4 w-4" /> },
          ].map(m => (
            <button
              key={m.key}
              className={`w-full flex items-center gap-3 p-3 rounded-lg border text-start transition-colors ${selectedMethod === m.key ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/30' : 'hover:bg-muted/50'}`}
              onClick={() => setSelectedMethod(m.key)}
            >
              {m.icon}
              <span className="text-sm font-medium">{m.label}</span>
              {selectedMethod === m.key && <CheckCircle2 className="h-4 w-4 text-violet-600 ms-auto" />}
            </button>
          ))}
        </div>
        <div className="flex gap-2 mt-5">
          <Button variant="outline" className="flex-1" onClick={() => setPayMethodDlg(false)}>{ar ? 'إلغاء' : 'Cancel'}</Button>
          <Button className="flex-1 bg-violet-600 hover:bg-violet-700 text-white" onClick={handleMarkPaid}>{ar ? 'تأكيد الدفع' : 'Confirm Payment'}</Button>
        </div>
      </motion.div>
    </div>
    </>
  )
}