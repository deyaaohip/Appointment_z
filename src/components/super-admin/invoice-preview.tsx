'use client'

import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import {
  Download, Printer, Mail, QrCode, CheckCircle2, Clock, AlertTriangle,
  XCircle, RefreshCw, ChevronRight, FileText, Copy, CreditCard, Building2,
  Hash, Calendar, Receipt, Send, ArrowUpRight
} from 'lucide-react'
import { useSA, StatusBadge } from './sa-helpers'
import { type Invoice, CURRENCY_SYMBOLS, DEFAULT_CURRENCY } from './sa-data'
import { useT, type Lang } from './sa-i18n'

// ─── Props ────────────────────────────────────────────────────
interface InvoicePreviewDialogProps {
  invoice: Invoice
  open: boolean
  onClose: () => void
  onStatusChange: (invoiceId: string, newStatus: string, method?: string) => void
}

// ─── Mock decorative QR code SVG ─────────────────────────────
function MockQRCode({ size = 128 }: { size?: number }) {
  const cells = 21
  const matrix: boolean[][] = Array.from({ length: cells }, () =>
    Array.from({ length: cells }, () => false)
  )
  const rng = (i: number) => {
    const x = Math.sin(i * 127.1 + 311.7) * 43758.5453
    return x - Math.floor(x)
  }
  const drawFinder = (sr: number, sc: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const isBorder = r === 0 || r === 6 || c === 0 || c === 6
        const isInner = r >= 2 && r <= 4 && c >= 2 && c <= 4
        matrix[sr + r][sc + c] = isBorder || isInner
      }
    }
  }
  drawFinder(0, 0)
  drawFinder(0, 14)
  drawFinder(14, 0)
  // Timing patterns
  for (let i = 8; i < 13; i++) {
    matrix[6][i] = i % 2 === 0
    matrix[i][6] = i % 2 === 0
  }
  // Alignment pattern at center
  const cx = 16, cy = 16
  for (let r = -2; r <= 2; r++) {
    for (let c = -2; c <= 2; c++) {
      const isOuter = Math.abs(r) === 2 || Math.abs(c) === 2
      const isCenter = r === 0 && c === 0
      if (isOuter || isCenter) matrix[cy + r][cx + c] = true
    }
  }
  // Fill remaining data cells
  let idx = 0
  for (let r = 0; r < cells; r++) {
    for (let c = 0; c < cells; c++) {
      if (matrix[r][c]) continue
      const inTL = r < 8 && c < 8
      const inTR = r < 8 && c > 12
      const inBL = r > 12 && c < 8
      if (inTL || inTR || inBL) continue
      if (r === 6 || c === 6) continue
      if (rng(idx++) > 0.45) matrix[r][c] = true
    }
  }
  const cellSize = size / cells
  const rects: JSX.Element[] = []
  for (let r = 0; r < cells; r++) {
    for (let c = 0; c < cells; c++) {
      if (matrix[r][c]) {
        rects.push(
          <rect
            key={`${r}-${c}`}
            x={c * cellSize}
            y={r * cellSize}
            width={cellSize}
            height={cellSize}
            fill="#1e1b4b"
            rx={0.5}
          />
        )
      }
    }
  }
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="mx-auto">
      <rect width={size} height={size} fill="white" rx="6" />
      {rects}
    </svg>
  )
}

// ─── Payment method icon + label ─────────────────────────────
function PaymentMethodInfo({ method, lang, paidDate, refNum }: {
  method: string; lang: Lang; paidDate: string | null; refNum?: string
}) {
  if (!method) return null
  const ar = lang === 'ar'
  const methodMap: Record<string, { ar: string; en: string; icon: React.ElementType; color: string }> = {
    cliq:          { ar: 'CLIQ تحويل',     en: 'CLIQ Transfer',   icon: QrCode,      color: 'text-violet-600 bg-violet-100 dark:bg-violet-900/30' },
    card:          { ar: 'بطاقة ائتمان',   en: 'Credit Card',     icon: CreditCard,  color: 'text-sky-600 bg-sky-100 dark:bg-sky-900/30' },
    bank_transfer: { ar: 'تحويل بنكي',     en: 'Bank Transfer',   icon: Building2,   color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30' },
  }
  const m = methodMap[method]
  if (!m) return null
  const Icon = m.icon
  return (
    <div className={`rounded-xl border p-4 ${m.color.split(' ')[1]}`}>
      <div className="flex items-center gap-3">
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${m.color.split(' ')[1]}`}>
          <Icon className={`h-4.5 w-4.5 ${m.color.split(' ')[0]}`} />
        </div>
        <div className="min-w-0 flex-1">
          <p className={`text-sm font-semibold ${m.color.split(' ')[0]}`}>
            {ar ? m.ar : m.en}
          </p>
          {refNum && (
            <p className="text-[11px] text-muted-foreground font-mono" dir="ltr">{refNum}</p>
          )}
        </div>
        {paidDate && (
          <div className="text-end shrink-0">
            <p className="text-[10px] text-muted-foreground">{ar ? 'تاريخ الدفع' : 'Paid on'}</p>
            <p className="text-xs font-semibold text-emerald-600">{paidDate}</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── History timeline color logic ────────────────────────────
function historyDotColor(actionEn: string): string {
  const lower = actionEn.toLowerCase()
  if (lower.includes('fail') || lower.includes('overdue') || lower.includes('reject'))
    return 'bg-red-500'
  if (lower.includes('sent') || lower.includes('created') || lower.includes('reminder'))
    return 'bg-sky-500'
  if (lower.includes('refund'))
    return 'bg-amber-500'
  if (lower.includes('received') || lower.includes('payment') || lower.includes('approved'))
    return 'bg-emerald-500'
  return 'bg-violet-500'
}

// ─── Extract reference number from history ───────────────────
function extractRef(history: Invoice['history']): string {
  for (let i = history.length - 1; i >= 0; i--) {
    const d = history[i].detailsEn.toLowerCase()
    if (d.includes('txn-')) {
      const match = history[i].detailsEn.match(/TXN-[\w-]+/)
      return match ? match[0] : ''
    }
  }
  return ''
}

// ─── Main Component ──────────────────────────────────────────
export function InvoicePreviewDialog({
  invoice,
  open,
  onClose,
  onStatusChange,
}: InvoicePreviewDialogProps) {
  const { isRTL, lang, locale } = useSA()
  const printRef = useRef<HTMLDivElement>(null)

  const [sending, setSending] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showPayMethod, setShowPayMethod] = useState(false)
  const [selectedMethod, setSelectedMethod] = useState('cliq')
  const [showRefundConfirm, setShowRefundConfirm] = useState(false)

  const ar = lang === 'ar'
  const curSymbol = (CURRENCY_SYMBOLS[invoice.currency || DEFAULT_CURRENCY] || CURRENCY_SYMBOLS[DEFAULT_CURRENCY])[lang]
  const fmtAmount = (n: number) =>
    `${n.toLocaleString(lang === 'ar' ? 'ar-JO' : 'en-JO')} ${curSymbol}`

  const subtotal = invoice.amount
  const taxAmount = Math.round(subtotal * invoice.taxRate) / 100
  const total = subtotal + taxAmount

  const isPaid     = invoice.status === 'paid'
  const isPending  = invoice.status === 'pending'
  const isOverdue  = invoice.status === 'overdue'
  const isFailed   = invoice.status === 'failed'
  const isRefunded = invoice.status === 'refunded'

  // Due date logic
  const now = new Date()
  const dueDate = new Date(invoice.dueDate)
  const diffMs = dueDate.getTime() - now.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
  const isPastDue = diffDays < 0 && !isPaid

  const refNumber = invoice.paymentMethod ? extractRef(invoice.history) : ''

  // ── Handlers ────────────────────────────────────────────────
  const handlePrint = () => {
    const content = printRef.current
    if (!content) return
    const printWin = window.open('', '_blank', 'width=800,height=600')
    if (!printWin) {
      toast.error(ar ? 'فشل فتح نافذة الطباعة' : 'Failed to open print window')
      return
    }
    const tenantName = isRTL ? invoice.tenant : (invoice.tenantEn || invoice.tenant)
    const payLabel = invoice.paymentMethod
      ? (invoice.paymentMethod === 'cliq'
        ? (ar ? 'CLIQ تحويل' : 'CLIQ Transfer')
        : invoice.paymentMethod === 'card'
          ? (ar ? 'بطاقة ائتمان' : 'Credit Card')
          : (ar ? 'تحويل بنكي' : 'Bank Transfer'))
      : ''
    printWin.document.write(`<!DOCTYPE html>
<html dir="${isRTL ? 'rtl' : 'ltr'}"><head>
<title>${ar ? 'فاتورة' : 'Invoice'} ${invoice.id}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Inter',Segoe UI,Tahoma,sans-serif; padding:40px; color:#1a1a2e; background:#fff; }
  .inv { max-width:720px; margin:0 auto; border:1px solid #e5e7eb; border-radius:16px; padding:36px; }
  .hdr { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:28px; padding-bottom:20px; border-bottom:2px solid #7c3aed; }
  .logo-area h1 { font-size:28px; font-weight:800; background:linear-gradient(135deg,#7c3aed,#a78bfa);-webkit-background-clip:text;-webkit-text-fill-color:transparent; }
  .logo-area p { font-size:11px; color:#888; margin-top:2px; }
  .inv-meta { text-align:right; }
  .inv-meta .id { font-size:16px; font-weight:800; font-family:monospace; color:#7c3aed; }
  .inv-meta .date { font-size:12px; color:#888; margin-top:4px; }
  .two-col { display:grid; grid-template-columns:1fr 1fr; gap:28px; margin-bottom:24px; }
  .col-title { font-size:10px; text-transform:uppercase; letter-spacing:0.8px; color:#888; margin-bottom:8px; font-weight:600; }
  .col-line { font-size:13px; margin-bottom:4px; }
  .col-line strong { font-weight:600; }
  .col-line .muted { color:#888; font-size:12px; }
  table.items { width:100%; border-collapse:collapse; margin:20px 0; }
  table.items th { background:#f5f3ff; padding:10px 14px; font-size:11px; text-transform:uppercase; letter-spacing:0.5px; color:#555; border-bottom:2px solid #ddd6fe; text-align:${isRTL ? 'right' : 'left'}; }
  table.items th.r, table.items td.r { text-align:right; }
  table.items td { padding:12px 14px; font-size:13px; border-bottom:1px solid #f3f4f6; }
  .totals { margin-left:auto; width:260px; }
  .tot-row { display:flex; justify-content:space-between; padding:5px 0; font-size:13px; }
  .tot-row .lbl { color:#888; }
  .tot-row.grand { border-top:2px solid #7c3aed; padding-top:10px; margin-top:4px; font-size:18px; font-weight:800; color:#7c3aed; }
  .pay-box { margin:20px 0; padding:14px; background:#f5f3ff; border-radius:10px; border:1px solid #ddd6fe; }
  .pay-box .title { font-size:12px; font-weight:700; color:#7c3aed; margin-bottom:4px; }
  .pay-box .val { font-size:13px; }
  .qr-section { display:flex; align-items:center; gap:20px; margin:20px 0; padding:16px; background:#fafafa; border-radius:12px; border:1px solid #f0f0f0; }
  .qr-section .info { font-size:11px; color:#888; line-height:1.6; }
  .notes { margin:16px 0; padding:12px 14px; background:#fffbeb; border:1px solid #fde68a; border-radius:8px; font-size:12px; color:#92400e; }
  .notes .title { font-weight:700; margin-bottom:4px; }
  .ftr { margin-top:24px; padding-top:16px; border-top:1px solid #e5e7eb; text-align:center; font-size:11px; color:#aaa; line-height:1.8; }
  .timeline { margin-top:20px; }
  .timeline .title { font-size:12px; font-weight:700; margin-bottom:10px; }
  .tl-item { display:flex; gap:10px; padding:6px 0; border-bottom:1px solid #f5f5f5; font-size:11px; }
  .tl-item .dot { width:8px; height:8px; border-radius:50%; margin-top:3px; flex-shrink:0; }
  .tl-item .date { color:#aaa; white-space:nowrap; min-width:130px; }
  .tl-item .act { font-weight:600; }
  .tl-item .det { color:#888; }
  @media print { body { padding:20px; } .inv { border:none; box-shadow:none; } }
</style></head><body>
<div class="inv">
  <div class="hdr">
    <div class="logo-area">
      <h1>BookFlow</h1>
      <p>${ar ? 'منصة الحجز الإلكتروني' : 'Electronic Booking Platform'}</p>
      <p style="margin-top:6px;font-size:12px;color:#666;">
        ${ar ? 'عمان، الأردن | support@bookflow.com | +962 7 9999 0000' : 'Amman, Jordan | support@bookflow.com | +962 7 9999 0000'}
      </p>
      <p style="font-size:12px;color:#666;">CLIQ: BOOKFLOWJO</p>
    </div>
    <div class="inv-meta">
      <div class="id">${invoice.id}</div>
      <div class="date">${ar ? 'تاريخ الإنشاء' : 'Date'}: ${invoice.date}</div>
      <div class="date">${ar ? 'تاريخ الاستحقاق' : 'Due'}: ${invoice.dueDate}</div>
      <div style="margin-top:6px;display:inline-block;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600;
        background:${isPaid ? '#d1fae5;color:#065f46' : isPending ? '#fef3c7;color:#92400e' : isOverdue ? '#fee2e2;color:#991b1b' : isFailed ? '#fee2e2;color:#991b1b' : isRefunded ? '#fff7ed;color:#9a3412' : '#f3f4f6;color:#555'}">
        ${ar ? (invoice.status === 'paid' ? 'مدفوع' : invoice.status === 'pending' ? 'معلق' : invoice.status === 'overdue' ? 'متأخر' : invoice.status === 'failed' ? 'فاشل' : invoice.status === 'refunded' ? 'مرتجع' : 'ملغي') :
          invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
      </div>
    </div>
  </div>
  <div class="two-col">
    <div>
      <div class="col-title">${ar ? 'تفاصيل الفاتورة' : 'Invoice Details'}</div>
      <div class="col-line"><span class="muted">${ar ? 'الرقم:' : 'No:'}</span> <strong>${invoice.id}</strong></div>
      <div class="col-line"><span class="muted">${ar ? 'التاريخ:' : 'Date:'}</span> <strong>${invoice.date}</strong></div>
      <div class="col-line"><span class="muted">${ar ? 'الاستحقاق:' : 'Due:'}</span> <strong>${invoice.dueDate}</strong></div>
      ${invoice.paidDate ? `<div class="col-line"><span class="muted">${ar ? 'المدفوع:' : 'Paid:'}</span> <strong>${invoice.paidDate}</strong></div>` : ''}
    </div>
    <div>
      <div class="col-title">${ar ? 'بيانات المستأجر' : 'Tenant Info'}</div>
      <div class="col-line"><strong>${tenantName}</strong></div>
      <div class="col-line"><span class="muted">${ar ? 'الباقة:' : 'Plan:'}</span> <strong>${invoice.plan}</strong></div>
      <div class="col-line"><span class="muted">${ar ? 'العملة:' : 'Currency:'}</span> <strong>${invoice.currency}</strong></div>
    </div>
  </div>
  <table class="items">
    <thead><tr>
      <th>${ar ? 'البند' : 'Item'}</th>
      <th>${ar ? 'الكمية' : 'Qty'}</th>
      <th class="r">${ar ? 'سعر الوحدة' : 'Unit Price'}</th>
      <th class="r">${ar ? 'الإجمالي' : 'Total'}</th>
    </tr></thead>
    <tbody>
      <tr>
        <td><strong>${ar ? `اشتراك ${invoice.plan}` : `${invoice.plan} Subscription`}</strong><br/><span style="font-size:11px;color:#888">${ar ? 'شهري' : 'Monthly'}</span></td>
        <td>1</td>
        <td class="r">${fmtAmount(subtotal)}</td>
        <td class="r" style="font-weight:600">${fmtAmount(subtotal)}</td>
      </tr>
    </tbody>
  </table>
  <div class="totals">
    <div class="tot-row"><span class="lbl">${ar ? 'المجموع الفرعي' : 'Subtotal'}</span><span>${fmtAmount(subtotal)}</span></div>
    <div class="tot-row"><span class="lbl">${ar ? `الضريبة (${invoice.taxRate}%)` : `Tax (${invoice.taxRate}%)`}</span><span>${fmtAmount(taxAmount)}</span></div>
    <div class="tot-row grand"><span>${ar ? 'الإجمالي شامل الضريبة' : 'Total incl. Tax'}</span><span>${fmtAmount(total)}</span></div>
  </div>
  ${payLabel ? `<div class="pay-box"><div class="title">${ar ? 'طريقة الدفع' : 'Payment Method'}</div><div class="val">${payLabel}${refNumber ? ` — ${refNumber}` : ''}${invoice.paidDate ? ` | ${ar ? 'تاريخ الدفع' : 'Paid'}: ${invoice.paidDate}` : ''}</div></div>` : ''}
  ${invoice.notes ? `<div class="notes"><div class="title">${ar ? 'ملاحظات' : 'Notes'}</div>${invoice.notes}</div>` : ''}
  <div class="ftr">
    ${ar ? 'شكراً لاستخدامكم منصة BookFlow' : 'Thank you for using BookFlow Platform'}<br/>
    bookflow.com | support@bookflow.com
  </div>
</div>
<script>window.onload=function(){window.print();}</script>
</body></html>`)
    printWin.document.close()
  }

  const handleDownloadPDF = () => handlePrint()

  const handleSendEmail = async () => {
    setSending(true)
    await new Promise(resolve => setTimeout(resolve, 1200))
    setSending(false)
    toast.success(
      ar
        ? `تم إرسال الفاتورة ${invoice.id} بالبريد الإلكتروني`
        : `Invoice ${invoice.id} sent via email`
    )
  }

  const handleCopyLink = () => {
    const url = `${typeof window !== 'undefined' ? window.location.origin : 'https://bookflow.com'}/invoice/${invoice.id}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      toast.success(ar ? 'تم نسخ رابط الفاتورة' : 'Invoice link copied')
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const handleMarkPaid = () => {
    onStatusChange(invoice.id, 'paid', selectedMethod)
    setShowPayMethod(false)
    toast.success(ar ? 'تم تحديد الفاتورة كمدفوعة' : 'Invoice marked as paid')
  }

  const handleRefund = () => {
    onStatusChange(invoice.id, 'refunded')
    setShowRefundConfirm(false)
    toast.success(ar ? 'تم إرجاع المبلغ بنجاح' : 'Refund processed successfully')
  }

  const handleSendReminder = () => {
    toast.success(
      ar
        ? `تم إرسال تذكير لفاتورة ${invoice.id}`
        : `Reminder sent for invoice ${invoice.id}`
    )
  }

  const handleRetryPayment = () => {
    toast.success(
      ar
        ? `تمت إعادة محاولة الدفع لفاتورة ${invoice.id}`
        : `Payment retry initiated for ${invoice.id}`
    )
  }

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString(lang === 'ar' ? 'ar-JO' : 'en-JO', {
      year: 'numeric', month: 'short', day: 'numeric'
    })

  const fmtDateTime = (d: string) =>
    new Date(d).toLocaleString(lang === 'ar' ? 'ar-JO' : 'en-JO', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })

  // ── Render ──────────────────────────────────────────────────
  return (
    <>
      <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
        <DialogContent
          dir={isRTL ? 'rtl' : 'ltr'}
          className="max-w-4xl max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden sm:rounded-2xl"
        >
          <DialogDescription className="sr-only">
            {ar
              ? `معاينة فاتورة ${invoice.id} للمستأجر ${invoice.tenant}`
              : `Preview of invoice ${invoice.id} for tenant ${invoice.tenantEn}`}
          </DialogDescription>

          {/* ── Top Action Bar ─────────────────────────────── */}
          <div className="flex items-center justify-between border-b px-5 py-3 bg-muted/30 shrink-0">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 h-8 text-xs"
                onClick={handleDownloadPDF}
              >
                <Download className="h-3.5 w-3.5" />
                {ar ? 'تحميل PDF' : 'Download PDF'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 h-8 text-xs"
                onClick={handlePrint}
              >
                <Printer className="h-3.5 w-3.5" />
                {ar ? 'طباعة' : 'Print'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 h-8 text-xs"
                onClick={handleSendEmail}
                disabled={sending}
              >
                <Mail className="h-3.5 w-3.5" />
                {sending
                  ? (ar ? 'جاري الإرسال...' : 'Sending...')
                  : (ar ? 'إرسال بالبريد' : 'Send Email')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 h-8 text-xs"
                onClick={handleCopyLink}
              >
                {copied
                  ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  : <Copy className="h-3.5 w-3.5" />}
                {copied
                  ? (ar ? 'تم النسخ!' : 'Copied!')
                  : (ar ? 'نسخ الرابط' : 'Copy Link')}
              </Button>
            </div>
            <StatusBadge status={invoice.status} locale={lang} />
          </div>

          {/* ── Dialog Header ──────────────────────────────── */}
          <DialogHeader className="px-5 pt-4 pb-0 shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-md">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold">
                  {ar ? 'فاتورة' : 'Invoice'}{' '}
                  <span className="font-mono text-violet-600">{invoice.id}</span>
                </DialogTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isRTL ? invoice.tenant : (invoice.tenantEn || invoice.tenant)}
                  {' · '}
                  {invoice.plan}
                  {' · '}
                  {fmtDate(invoice.date)}
                </p>
              </div>
            </div>
          </DialogHeader>

          {/* ── Scrollable Invoice Body ────────────────────── */}
          <div className="flex-1 overflow-y-auto px-5 py-4" ref={printRef}>
            <div className="border rounded-2xl bg-white dark:bg-white/[0.03] shadow-sm overflow-hidden">
              {/* Inner padding wrapper */}
              <div className="p-5 sm:p-8 space-y-6">

                {/* ── Invoice Header: Logo + Meta ─────────── */}
                <div className="flex items-start justify-between gap-4">
                  {/* Left: BookFlow Brand */}
                  <div>
                    <h3 className="text-2xl font-extrabold bg-gradient-to-r from-violet-600 to-purple-500 bg-clip-text text-transparent">
                      BookFlow
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {ar ? 'منصة الحجز الإلكتروني' : 'Electronic Booking Platform'}
                    </p>
                    <div className="mt-3 space-y-0.5 text-[11px] text-muted-foreground">
                      <p>{ar ? 'عمان، الأردن' : 'Amman, Jordan'}</p>
                      <p dir="ltr" className="text-start">support@bookflow.com</p>
                      <p dir="ltr" className="text-start">+962 7 9999 0000</p>
                      <p>CLIQ: <span className="font-semibold">BOOKFLOWJO</span></p>
                    </div>
                  </div>
                  {/* Right: Invoice Meta */}
                  <div className="text-end shrink-0 space-y-2">
                    <div className="flex items-center gap-2 justify-end">
                      <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-lg font-extrabold font-mono text-violet-600">
                        {invoice.id}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 justify-end text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>{fmtDate(invoice.date)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 justify-end text-xs text-muted-foreground">
                      <Receipt className="h-3 w-3" />
                      <span>
                        {ar ? 'الاستحقاق:' : 'Due:'} {fmtDate(invoice.dueDate)}
                      </span>
                    </div>
                    <div className="mt-1">
                      <StatusBadge status={invoice.status} locale={lang} />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* ── Company & Tenant Info (Two-Column) ──── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Company Details */}
                  <div className="space-y-2">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                      {ar ? 'من الشركة' : 'From'}
                    </p>
                    <div className="rounded-xl border bg-muted/30 p-4 space-y-1.5">
                      <p className="font-bold text-sm">BookFlow</p>
                      <p className="text-xs text-muted-foreground">
                        {ar ? 'شركة تقنية للحجوزات الإلكترونية' : 'Electronic Booking Tech Co.'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {ar ? 'عمان، الأردن — شارع المدينة المنورة' : 'Amman, Jordan — Al Madinah Al Munawwarah St.'}
                      </p>
                      <p className="text-xs text-muted-foreground" dir="ltr">support@bookflow.com</p>
                      <p className="text-xs text-muted-foreground" dir="ltr">+962 7 9999 0000</p>
                      <p className="text-xs text-muted-foreground">
                        {ar ? 'الاسم المستعار CLIQ:' : 'CLIQ Alias:'}{' '}
                        <span className="font-semibold font-mono">BOOKFLOWJO</span>
                      </p>
                    </div>
                  </div>
                  {/* Tenant Details */}
                  <div className="space-y-2">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                      {ar ? 'إلى المستأجر' : 'Bill To'}
                    </p>
                    <div className="rounded-xl border bg-muted/30 p-4 space-y-1.5">
                      <p className="font-bold text-sm">
                        {isRTL ? invoice.tenant : (invoice.tenantEn || invoice.tenant)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {ar ? 'الباقة:' : 'Plan:'} <span className="font-semibold">{invoice.plan}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {ar ? 'تاريخ الفاتورة:' : 'Invoice Date:'} {fmtDate(invoice.date)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {ar ? 'تاريخ الاستحقاق:' : 'Due Date:'}{' '}
                        <span className={isPastDue ? 'text-red-500 font-semibold' : ''}>
                          {fmtDate(invoice.dueDate)}
                        </span>
                        {isPastDue && (
                          <span className="text-red-500 text-[10px] ms-1">
                            ({Math.abs(diffDays)} {ar ? 'يوم متأخر' : 'days overdue'})
                          </span>
                        )}
                      </p>
                      {invoice.paidDate && (
                        <p className="text-xs text-emerald-600 font-medium">
                          {ar ? 'تاريخ الدفع:' : 'Paid:'} {fmtDate(invoice.paidDate)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* ── Invoice Items Table ─────────────────── */}
                <div className="border rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30">
                        <th className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider text-violet-700 dark:text-violet-400 ${isRTL ? 'text-right' : 'text-left'}`}>
                          {ar ? 'البند' : 'Item'}
                        </th>
                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-violet-700 dark:text-violet-400 text-center w-16">
                          {ar ? 'الكمية' : 'Qty'}
                        </th>
                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-violet-700 dark:text-violet-400 text-end w-32">
                          {ar ? 'سعر الوحدة' : 'Unit Price'}
                        </th>
                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-violet-700 dark:text-violet-400 text-end w-32">
                          {ar ? 'الإجمالي' : 'Total'}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-t border-muted/50">
                        <td className="px-4 py-4">
                          <p className="font-semibold">
                            {ar ? `اشتراك الباقة ${invoice.plan}` : `${invoice.plan} Plan Subscription`}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {ar ? 'اشتراك شهري' : 'Monthly subscription'}
                          </p>
                        </td>
                        <td className="px-4 py-4 text-center tabular-nums font-medium">1</td>
                        <td className="px-4 py-4 text-end tabular-nums">
                          {fmtAmount(subtotal)}
                        </td>
                        <td className="px-4 py-4 text-end tabular-nums font-semibold">
                          {fmtAmount(subtotal)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* ── Tax Calculation ─────────────────────── */}
                <div className="flex justify-end">
                  <div className="w-72 space-y-2.5">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {ar ? 'المجموع الفرعي' : 'Subtotal'}
                      </span>
                      <span className="tabular-nums font-medium">{fmtAmount(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {ar ? `الضريبة (${invoice.taxRate}%)` : `Tax (${invoice.taxRate}%)`}
                      </span>
                      <span className="tabular-nums text-muted-foreground">
                        {fmtAmount(taxAmount)}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="text-base font-bold text-violet-700 dark:text-violet-400">
                        {ar ? 'الإجمالي شامل الضريبة' : 'Total incl. Tax'}
                      </span>
                      <span className="text-xl font-extrabold text-violet-700 dark:text-violet-400 tabular-nums">
                        {fmtAmount(total)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* ── Payment Info Box ────────────────────── */}
                {invoice.paymentMethod && (
                  <PaymentMethodInfo
                    method={invoice.paymentMethod}
                    lang={lang}
                    paidDate={invoice.paidDate}
                    refNum={refNumber || undefined}
                  />
                )}

                {/* ── QR Code Section ─────────────────────── */}
                <div className="flex items-center justify-center">
                  <div className="border rounded-2xl p-5 bg-white inline-flex flex-col items-center gap-3">
                    <MockQRCode size={128} />
                    <div className="text-center">
                      <p className="text-[10px] text-muted-foreground font-medium">
                        bookflow.com/invoice/{invoice.id}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {ar ? 'امسح للتحقق من الفاتورة' : 'Scan to verify invoice'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* ── Notes ───────────────────────────────── */}
                {invoice.notes && (
                  <div className="rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-4">
                    <p className="text-xs font-bold text-amber-700 dark:text-amber-400 mb-1">
                      {ar ? 'ملاحظات' : 'Notes'}
                    </p>
                    <p className="text-xs text-amber-600 dark:text-amber-500 leading-relaxed">
                      {invoice.notes}
                    </p>
                  </div>
                )}

                <Separator />

                {/* ── Status-Based Actions ────────────────── */}
                {(isPending || isOverdue || isPaid || isFailed) && (
                  <div className="flex flex-wrap gap-2">
                    {(isPending || isOverdue) && (
                      <>
                        <Button
                          size="sm"
                          className="gap-1.5 h-8 bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                          onClick={() => { setSelectedMethod('cliq'); setShowPayMethod(true) }}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          {ar ? 'تحديد كمدفوع' : 'Mark as Paid'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className={`gap-1.5 h-8 text-xs ${isOverdue ? 'text-amber-600 border-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/20' : ''}`}
                          onClick={handleSendReminder}
                        >
                          <Send className="h-3.5 w-3.5" />
                          {isOverdue
                            ? (ar ? 'إرسال تذكير تأخير' : 'Send Overdue Reminder')
                            : (ar ? 'إرسال تذكير' : 'Send Reminder')}
                        </Button>
                      </>
                    )}
                    {isPaid && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 h-8 text-xs text-red-500 border-red-300 hover:bg-red-50 dark:hover:bg-red-950/20"
                        onClick={() => setShowRefundConfirm(true)}
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        {ar ? 'إرجاع المبلغ' : 'Refund'}
                      </Button>
                    )}
                    {isFailed && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 h-8 text-xs"
                        onClick={handleRetryPayment}
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        {ar ? 'إعادة محاولة الدفع' : 'Retry Payment'}
                      </Button>
                    )}
                  </div>
                )}
                {isRefunded && (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-orange-600 border-orange-300 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-800 text-xs">
                      <RefreshCw className="h-3 w-3 me-1.5" />
                      {ar ? 'تم الإرجاع' : 'Refunded'}
                    </Badge>
                  </div>
                )}

                <Separator />

                {/* ── Invoice History Timeline ────────────── */}
                {invoice.history && invoice.history.length > 0 && (
                  <div>
                    <h4 className="text-sm font-bold mb-4 flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      {ar ? 'سجل الفاتورة' : 'Invoice History'}
                    </h4>
                    <div className="relative">
                      {/* Vertical line */}
                      <div className={`absolute top-2 bottom-2 w-px bg-border ${isRTL ? 'right-[11px]' : 'left-[11px]'}`} />

                      <div className="space-y-0">
                        {invoice.history.map((h, i) => {
                          const dotColor = historyDotColor(h.actionEn)
                          const isLast = i === invoice.history.length - 1
                          return (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, x: isRTL ? 12 : -12 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.08, duration: 0.25 }}
                              className={`flex gap-4 ${isLast ? 'pb-0' : 'pb-4'}`}
                            >
                              {/* Dot */}
                              <div className="relative z-10 shrink-0">
                                <div
                                  className={`mt-1.5 h-5 w-5 rounded-full flex items-center justify-center ring-4 ring-background ${dotColor}`}
                                >
                                  <div className="h-1.5 w-1.5 rounded-full bg-white" />
                                </div>
                              </div>

                              {/* Content */}
                              <div className="min-w-0 flex-1 -mt-0.5">
                                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mb-0.5">
                                  <p className="text-xs font-bold">
                                    {lang === 'en' ? h.actionEn : h.action}
                                  </p>
                                  <span className="text-[10px] text-muted-foreground">
                                    {fmtDateTime(h.date)}
                                  </span>
                                </div>
                                <p className="text-[11px] text-muted-foreground leading-relaxed">
                                  {lang === 'en' ? h.detailsEn : h.details}
                                </p>
                                <p className="text-[10px] text-muted-foreground/70 mt-0.5 flex items-center gap-1">
                                  {ar ? 'بواسطة' : 'By'}:{' '}
                                  <span className="font-medium">{h.by}</span>
                                </p>
                              </div>
                            </motion.div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Footer ──────────────────────────────── */}
                <div className="text-center pt-2 border-t">
                  <p className="text-xs font-medium text-muted-foreground">
                    {ar ? 'شكراً لاستخدامكم منصة BookFlow' : 'Thank you for using BookFlow Platform'}
                  </p>
                  <div className="flex items-center justify-center gap-3 mt-1.5 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1 hover:text-violet-600 cursor-pointer transition-colors">
                      <ArrowUpRight className="h-3 w-3" />
                      bookflow.com
                    </span>
                    <span>|</span>
                    <span>support@bookflow.com</span>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Payment Method Selection Dialog ──────────────────── */}
      <Dialog open={showPayMethod} onOpenChange={setShowPayMethod}>
        <DialogContent
          dir={isRTL ? 'rtl' : 'ltr'}
          className="max-w-sm p-0"
        >
          <DialogDescription className="sr-only">
            {ar ? 'اختر طريقة الدفع لتحديد الفاتورة كمدفوعة' : 'Select payment method to mark invoice as paid'}
          </DialogDescription>
          <div className="p-5">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-base font-bold">
                {ar ? 'اختر طريقة الدفع' : 'Select Payment Method'}
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-1">
                {ar
                  ? `تحديد الفاتورة ${invoice.id} كمدفوعة (${fmtAmount(total)})`
                  : `Mark invoice ${invoice.id} as paid (${fmtAmount(total)})`}
              </p>
            </DialogHeader>
            <div className="space-y-2">
              {([
                { key: 'cliq', label: ar ? 'CLIQ تحويل' : 'CLIQ Transfer', icon: QrCode, color: 'text-violet-600' },
                { key: 'card', label: ar ? 'بطاقة ائتمان' : 'Credit Card', icon: CreditCard, color: 'text-sky-600' },
                { key: 'bank_transfer', label: ar ? 'تحويل بنكي' : 'Bank Transfer', icon: Building2, color: 'text-emerald-600' },
              ] as const).map(m => (
                <button
                  key={m.key}
                  className={`w-full flex items-center gap-3 p-3.5 rounded-xl border text-start transition-all ${
                    selectedMethod === m.key
                      ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/30 shadow-sm'
                      : 'hover:bg-muted/50 border-transparent'
                  }`}
                  onClick={() => setSelectedMethod(m.key)}
                >
                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg bg-muted ${m.color}`}>
                    <m.icon className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-medium flex-1">{m.label}</span>
                  {selectedMethod === m.key && (
                    <CheckCircle2 className="h-4.5 w-4.5 text-violet-600" />
                  )}
                </button>
              ))}
            </div>
            <div className="flex gap-2 mt-5">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowPayMethod(false)}
              >
                {ar ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button
                className="flex-1 bg-violet-600 hover:bg-violet-700 text-white"
                onClick={handleMarkPaid}
              >
                <CheckCircle2 className="h-4 w-4 me-1.5" />
                {ar ? 'تأكيد الدفع' : 'Confirm Payment'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Refund Confirmation Dialog ──────────────────────── */}
      <Dialog open={showRefundConfirm} onOpenChange={setShowRefundConfirm}>
        <DialogContent
          dir={isRTL ? 'rtl' : 'ltr'}
          className="max-w-sm p-0"
        >
          <DialogDescription className="sr-only">
            {ar ? 'تأكيد إرجاع المبلغ' : 'Confirm refund'}
          </DialogDescription>
          <div className="p-5">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-base font-bold flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                {ar ? 'تأكيد إرجاع المبلغ' : 'Confirm Refund'}
              </DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground leading-relaxed mb-5">
              {ar
                ? `هل أنت متأكد من إرجاع مبلغ ${fmtAmount(total)} للفاتورة ${invoice.id}؟ لا يمكن التراجع عن هذا الإجراء.`
                : `Are you sure you want to refund ${fmtAmount(total)} for invoice ${invoice.id}? This action cannot be undone.`}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowRefundConfirm(false)}
              >
                {ar ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                onClick={handleRefund}
              >
                <RefreshCw className="h-4 w-4 me-1.5" />
                {ar ? 'تأكيد الإرجاع' : 'Confirm Refund'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}