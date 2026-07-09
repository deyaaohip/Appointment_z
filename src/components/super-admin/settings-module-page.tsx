'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Save, Upload, TestTube, Plus, Trash2, Key, Eye, EyeOff, Shield, Bell, Globe, Palette, HardDrive, Wrench, Info, Monitor, RefreshCw, Copy, CheckCircle2 } from 'lucide-react'
import { useSA, PageTitle, FormField, Toggle, PrimaryBtn, ActionBtn, fade } from './sa-helpers'

const TABS = [
  { key: 'general' as const, ar: 'عام', en: 'General' },
  { key: 'company' as const, ar: 'الشركة', en: 'Company' },
  { key: 'localization' as const, ar: 'التوطين', en: 'Localization' },
  { key: 'appearance' as const, ar: 'المظهر', en: 'Appearance' },
  { key: 'smtp' as const, ar: 'البريد', en: 'SMTP' },
  { key: 'sms' as const, ar: 'الرسائل', en: 'SMS' },
  { key: 'notifications' as const, ar: 'الإشعارات', en: 'Notifications' },
  { key: 'storage' as const, ar: 'التخزين', en: 'Storage' },
  { key: 'security' as const, ar: 'الأمان', en: 'Security' },
  { key: 'integrations' as const, ar: 'التكاملات', en: 'Integrations' },
  { key: 'maintenance' as const, ar: 'الصيانة', en: 'Maintenance' },
  { key: 'system' as const, ar: 'النظام', en: 'System' },
]

type TabKey = (typeof TABS)[number]['key']

const MOCK_KEYS = [
  { name: 'Production', key: 'bf_live_****...a3f2', created: '2025-01-15', lastUsed: '2 min ago' },
  { name: 'Staging', key: 'bf_test_****...b7c1', created: '2025-03-20', lastUsed: '1 day ago' },
]

const T = (ar: string, en: string, lang: 'ar' | 'en') => lang === 'ar' ? ar : en

const TAB_ICONS: Record<TabKey, React.ElementType> = {
  general: Monitor, company: Globe, localization: Globe, appearance: Palette,
  smtp: Bell, sms: Bell, notifications: Bell, storage: HardDrive,
  security: Shield, integrations: Wrench, maintenance: Wrench, system: Info,
}

export function SettingsModulePage() {
  const { isRTL, lang } = useSA()
  const [activeTab, setActiveTab] = useState<TabKey>('general')
  const [showPw, setShowPw] = useState(false)
  const [genKeyOpen, setGenKeyOpen] = useState(false)
  const [maintenance, setMaintenance] = useState(false)
  const [s, setS] = useState({
    twoFA: true, reqUpper: true, reqNum: true, reqSpec: true,
    compression: true, autoCleanup: false, compact: false,
    emailCh: true, smsCh: true, waCh: false, pushCh: true, inApp: true,
    booking: true, payment: true, marketing: false, alerts: true,
    paypal: false, stripe: true, tap: true,
  })
  const tog = (k: string) => setS(p => ({ ...p, [k]: !p[k as keyof typeof p] }))
  const save = () => toast.success(T('تم حفظ الإعدادات', 'Settings saved', lang))

  const SaveFooter = <div className="pt-4"><Separator className="mb-4" /><div className="flex justify-end"><PrimaryBtn icon={Save} label={T('حفظ', 'Save', lang)} onClick={save} /></div></div>

  const w = (children: React.ReactNode) => (
    <motion.div key={activeTab} variants={fade} initial="hidden" animate="visible" className="space-y-5" dir={isRTL ? 'rtl' : 'ltr'}>
      {children}{SaveFooter}
    </motion.div>
  )

  const tabs: Record<TabKey, React.ReactNode> = {
    general: w(<>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <FormField label={T('اسم المنصة', 'Platform Name', lang)}><Input defaultValue="BookFlow" /></FormField>
        <FormField label={T('البريد الدعم', 'Support Email', lang)}><Input type="email" defaultValue="support@bookflow.com" /></FormField>
        <FormField label={T('العملة الافتراضية', 'Default Currency', lang)}>
          <Select defaultValue="JOD"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
            {['JOD','SAR','AED','USD','EGP'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent></Select>
        </FormField>
        <FormField label={T('المنطقة الزمنية', 'Timezone', lang)}>
          <Select defaultValue="Asia/Amman"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
            {[['Asia/Amman','عمان'],['Asia/Riyadh','الرياض'],['Asia/Dubai','دبي'],['Africa/Cairo','القاهرة']].map(([v,l]) =>
              <SelectItem key={v} value={v}>{T(l, v, lang)}</SelectItem>)}
          </SelectContent></Select>
        </FormField>
        <FormField label={T('اللغة', 'Language', lang)}>
          <Select defaultValue="ar"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
            <SelectItem value="ar">{T('العربية','Arabic',lang)}</SelectItem>
            <SelectItem value="en">{T('الإنجليزية','English',lang)}</SelectItem>
          </SelectContent></Select>
        </FormField>
        <FormField label={T('رابط المنصة', 'Platform URL', lang)}><Input defaultValue="https://app.bookflow.com" /></FormField>
      </div>
    </>),
    company: w(<>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <FormField label={T('اسم الشركة (عربي)', 'Company Name (AR)', lang)}><Input defaultValue="بوك فلو" /></FormField>
        <FormField label={T('اسم الشركة (إنجليزي)', 'Company Name (EN)', lang)}><Input defaultValue="BookFlow" /></FormField>
        <FormField label={T('العنوان', 'Address', lang)} className="md:col-span-2"><Textarea defaultValue="عمان، الأردن" rows={2} /></FormField>
        <FormField label={T('الهاتف', 'Phone', lang)}><Input defaultValue="+962 7 9000 0000" /></FormField>
        <FormField label={T('رقم السجل التجاري', 'CR Number', lang)}><Input defaultValue="CR-2024-12345" /></FormField>
        <FormField label={T('الرقم الضريبي', 'Tax Number', lang)}><Input defaultValue="TAX-987654321" /></FormField>
      </div>
      <FormField label={T('شعار الشركة', 'Company Logo', lang)}>
        <div className="border-2 border-dashed border-muted-foreground/25 rounded-xl p-8 flex flex-col items-center gap-2 text-muted-foreground cursor-pointer hover:border-violet-400 hover:text-violet-500 transition-colors">
          <Upload className="h-8 w-8" /><span className="text-sm">{T('اسحب الشعار هنا أو انقر للرفع','Drag logo here or click to upload',lang)}</span>
          <span className="text-xs">{T('PNG, JPG حتى 2MB','PNG, JPG up to 2MB',lang)}</span>
        </div>
      </FormField>
    </>),
    localization: w(<>
      <Card><CardHeader className="pb-3"><CardTitle className="text-sm">{T('اللغات المتاحة','Available Languages',lang)}</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-3">
          {[{l:'العربية',e:'Arabic',on:true},{l:'الإنجليزية',e:'English',on:true},{l:'الفرنسية',e:'French',on:false},{l:'التركية',e:'Turkish',on:false}].map(x => (
            <div key={x.e} className="flex items-center justify-between"><span className="text-sm">{T(x.l,x.e,lang)}</span><Toggle on={x.on} onToggle={()=>{}} /></div>
          ))}
        </CardContent></Card>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <FormField label={T('الاتجاه','Direction',lang)}>
          <Select defaultValue={isRTL?'rtl':'ltr'}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
            <SelectItem value="rtl">RTL</SelectItem><SelectItem value="ltr">LTR</SelectItem>
          </SelectContent></Select>
        </FormField>
        <FormField label={T('تنسيق التاريخ','Date Format',lang)}>
          <Select defaultValue="dd/mm/yyyy"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
            {['dd/mm/yyyy','mm/dd/yyyy','yyyy-mm-dd'].map(f=><SelectItem key={f} value={f}>{f}</SelectItem>)}
          </SelectContent></Select>
        </FormField>
        <FormField label={T('تنسيق الوقت','Time Format',lang)}>
          <Select defaultValue="12h"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
            <SelectItem value="12h">{T('12 ساعة','12 Hour',lang)}</SelectItem>
            <SelectItem value="24h">{T('24 ساعة','24 Hour',lang)}</SelectItem>
          </SelectContent></Select>
        </FormField>
        <FormField label={T('تنسيق الأرقام','Number Format',lang)}>
          <Select defaultValue="1,234.56"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
            {['1,234.56','1.234,56','1234.56'].map(f=><SelectItem key={f} value={f}>{f}</SelectItem>)}
          </SelectContent></Select>
        </FormField>
        <FormField label={T('أول يوم في الأسبوع','First Day of Week',lang)}>
          <Select defaultValue="saturday"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
            <SelectItem value="saturday">{T('السبت','Saturday',lang)}</SelectItem>
            <SelectItem value="sunday">{T('الأحد','Sunday',lang)}</SelectItem>
            <SelectItem value="monday">{T('الاثنين','Monday',lang)}</SelectItem>
          </SelectContent></Select>
        </FormField>
      </div>
    </>),
    appearance: w(<>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <FormField label={T('السمة','Theme',lang)}>
          <Select defaultValue="light"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
            {[['light',T('فاتح','Light',lang)],['dark',T('داكن','Dark',lang)],['system',T('النظام','System',lang)]].map(([v,l])=>
              <SelectItem key={v} value={v}>{l}</SelectItem>)}
          </SelectContent></Select>
        </FormField>
        <FormField label={T('نوع الشريط الجانبي','Sidebar Style',lang)}>
          <Select defaultValue="standard"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
            {['standard','compact','icon-only'].map(x=><SelectItem key={x} value={x}>{x}</SelectItem>)}
          </SelectContent></Select>
        </FormField>
        <FormField label={T('حجم الخط','Font Size',lang)}>
          <Select defaultValue="medium"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
            {[['small',T('صغير','Small',lang)],['medium',T('متوسط','Medium',lang)],['large',T('كبير','Large',lang)]].map(([v,l])=>
              <SelectItem key={v} value={v}>{l}</SelectItem>)}
          </SelectContent></Select>
        </FormField>
      </div>
      <FormField label={T('اللون الرئيسي','Primary Color',lang)}>
        <div className="flex gap-3 pt-1">
          {[['bg-violet-500',true],['bg-blue-500',false],['bg-emerald-500',false],['bg-rose-500',false],['bg-amber-500',false]].map(([c,sel])=>(
            <button key={c} className={`h-8 w-8 rounded-full ${c} ${sel?'ring-2 ring-offset-2 ring-violet-500':'opacity-60'}`} />
          ))}
        </div>
      </FormField>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{T('الوضع المضغوط','Compact Mode',lang)}</span>
        <Toggle on={s.compact} onToggle={()=>tog('compact')} />
      </div>
    </>),
    smtp: w(<>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <FormField label={T('المضيف','Host',lang)}><Input defaultValue="smtp.gmail.com" /></FormField>
        <FormField label={T('المنفذ','Port',lang)}><Input type="number" defaultValue="587" /></FormField>
        <FormField label={T('اسم المستخدم','Username',lang)}><Input defaultValue="admin@bookflow.com" /></FormField>
        <FormField label={T('كلمة المرور','Password',lang)}>
          <div className="relative"><Input type={showPw?'text':'password'} defaultValue="password123" className="pe-10" />
            <button className="absolute top-1/2 -translate-y-1/2 end-3 text-muted-foreground hover:text-foreground" onClick={()=>setShowPw(!showPw)}>
              {showPw?<EyeOff className="h-4 w-4"/>:<Eye className="h-4 w-4"/>}
            </button>
          </div>
        </FormField>
        <FormField label={T('البريد المرسل','From Email',lang)}><Input defaultValue="noreply@bookflow.com" /></FormField>
        <FormField label={T('اسم المرسل','From Name',lang)}><Input defaultValue="BookFlow" /></FormField>
        <FormField label={T('التشفير','Encryption',lang)}>
          <Select defaultValue="tls"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
            {[['tls','TLS'],['ssl','SSL'],['none',T('بدون','None',lang)]].map(([v,l])=><SelectItem key={v} value={v}>{l}</SelectItem>)}
          </SelectContent></Select>
        </FormField>
      </div>
      <ActionBtn icon={TestTube} label={T('اختبار الاتصال','Test Connection',lang)} onClick={()=>toast.success(T('تم إرسال بريد اختباري','Test email sent',lang))} variant="outline" />
    </>),
    sms: w(<>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <FormField label={T('المزود','Provider',lang)}>
          <Select defaultValue="twilio"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
            {['Twilio','Vonage',T('معطل','Disabled',lang)].map(p=><SelectItem key={p} value={p.toLowerCase()}>{p}</SelectItem>)}
          </SelectContent></Select>
        </FormField>
        <FormField label="API Key"><Input type="password" defaultValue="sk_twilio_xxxxx" /></FormField>
        <FormField label="Sender ID"><Input defaultValue="BookFlow" /></FormField>
      </div>
      <ActionBtn icon={TestTube} label={T('إرسال رسالة اختبارية','Send Test SMS',lang)} onClick={()=>toast.success(T('تم إرسال الرسالة','Test SMS sent',lang))} variant="outline" />
    </>),
    notifications: w(<>
      <Card><CardHeader className="pb-3"><CardTitle className="text-sm">{T('قنوات الإشعارات','Notification Channels',lang)}</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[['emailCh','البريد الإلكتروني','Email'],['smsCh','الرسائل النصية','SMS'],['waCh','واتساب','WhatsApp'],['pushCh','الإشعارات الفورية','Push'],['inApp','داخل التطبيق','In-App']].map(([k,ar,en])=>(
            <div key={k} className="flex items-center justify-between"><span className="text-sm">{T(ar,en,lang)}</span><Toggle on={s[k as keyof typeof s] as boolean} onToggle={()=>tog(k)} /></div>
          ))}
        </CardContent></Card>
      <Card><CardHeader className="pb-3"><CardTitle className="text-sm">{T('أنواع الإشعارات','Notification Types',lang)}</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[['booking','تأكيد الحجز','Booking Confirmation'],['payment','تذكيرات الدفع','Payment Reminders'],['marketing','التسويق','Marketing'],['alerts','تنبيهات النظام','System Alerts']].map(([k,ar,en])=>(
            <div key={k} className="flex items-center justify-between"><span className="text-sm">{T(ar,en,lang)}</span><Toggle on={s[k as keyof typeof s] as boolean} onToggle={()=>tog(k)} /></div>
          ))}
        </CardContent></Card>
    </>),
    storage: w(<>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <FormField label={T('مزود التخزين','Storage Provider',lang)}>
          <Select defaultValue="local"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
            {['Local','S3','Azure','GCS'].map(p=><SelectItem key={p} value={p.toLowerCase()}>{p}</SelectItem>)}
          </SelectContent></Select>
        </FormField>
        <FormField label={T('أقصى حجم للملف (MB)','Max File Size (MB)',lang)}><Input type="number" defaultValue="50" /></FormField>
        <FormField label={T('أنواع الملفات المسموحة','Allowed Types',lang)}><Input defaultValue="jpg, png, pdf, docx, xlsx" /></FormField>
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between"><span className="text-sm font-medium">{T('ضغط الملفات','Compression',lang)}</span><Toggle on={s.compression} onToggle={()=>tog('compression')} /></div>
        <div className="flex items-center justify-between"><span className="text-sm font-medium">{T('تنظيف تلقائي','Auto Cleanup',lang)}</span><Toggle on={s.autoCleanup} onToggle={()=>tog('autoCleanup')} /></div>
      </div>
      <Card><CardContent className="p-4 space-y-2">
        <div className="flex justify-between text-sm"><span>{T('الاستخدام','Usage',lang)}</span><span className="font-semibold">12.4 / 50 GB</span></div>
        <Progress value={24.8} className="h-2" />
      </CardContent></Card>
    </>),
    security: w(<>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2"><Shield className="h-4 w-4 text-violet-500" /><span className="text-sm font-medium">{T('المصادقة الثنائية','Two-Factor Auth (2FA)',lang)}</span></div>
        <Toggle on={s.twoFA} onToggle={()=>tog('twoFA')} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <FormField label={T('الحد الأدنى لكلمة المرور','Password Min Length',lang)}><Input type="number" defaultValue="8" /></FormField>
        <FormField label={T('انتهاء كلمة المرور (أيام)','Password Expiry (days)',lang)}><Input type="number" defaultValue="90" /></FormField>
        <FormField label={T('أقصى محاولات تسجيل دخول','Max Login Attempts',lang)}><Input type="number" defaultValue="5" /></FormField>
        <FormField label={T('انتهاء الجلسة (دقائق)','Session Timeout (min)',lang)}><Input type="number" defaultValue="30" /></FormField>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[['reqUpper','أحرف كبيرة','Uppercase'],['reqNum','أرقام','Numbers'],['reqSpec','رموز خاصة','Special Chars']].map(([k,ar,en])=>(
          <div key={k} className="flex items-center justify-between"><span className="text-sm">{T(ar,en,lang)}</span><Toggle on={s[k as keyof typeof s] as boolean} onToggle={()=>tog(k)} /></div>
        ))}
      </div>
      <FormField label={T('قائمة IPs المسموحة','IP Whitelist',lang)}><Textarea placeholder={T('IP واحد في كل سطر','One IP per line',lang)} rows={3} defaultValue="192.168.1.0/24&#10;10.0.0.1" /></FormField>
    </>),
    integrations: w(<>
      <Card><CardHeader className="pb-3"><div className="flex items-center justify-between"><CardTitle className="text-sm">{T('مفاتيح API','API Keys',lang)}</CardTitle>
        <PrimaryBtn icon={Plus} label={T('إنشاء مفتاح','Generate Key',lang)} onClick={()=>setGenKeyOpen(true)} /></div></CardHeader>
        <CardContent><div className="overflow-x-auto">
          <table className="w-full text-sm"><thead><tr className="border-b text-left text-xs text-muted-foreground">
            <th className="pb-2 font-medium">{T('الاسم','Name',lang)}</th><th className="pb-2 font-medium">{T('المفتاح','Key',lang)}</th>
            <th className="pb-2 font-medium hidden sm:table-cell">{T('تاريخ الإنشاء','Created',lang)}</th><th className="pb-2 font-medium">{T('آخر استخدام','Last Used',lang)}</th><th className="pb-2 font-medium"></th>
          </tr></thead><tbody>
            {MOCK_KEYS.map(k=><tr key={k.name} className="border-b last:border-0">
              <td className="py-2.5 font-medium">{k.name}</td><td className="py-2.5 font-mono text-xs text-muted-foreground">{k.key}</td>
              <td className="py-2.5 hidden sm:table-cell text-muted-foreground">{k.created}</td><td className="py-2.5 text-muted-foreground">{k.lastUsed}</td>
              <td className="py-2.5 text-end"><ActionBtn icon={Trash2} onClick={()=>toast.success(T('تم حذف المفتاح','Key revoked',lang))} danger /></td>
            </tr>)}
          </tbody></table>
        </div></CardContent></Card>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <FormField label={T('رابط Webhook','Webhook URL',lang)}><Input defaultValue="https://api.bookflow.com/webhooks" /></FormField>
        <div className="space-y-2 pt-7"><p className="text-sm font-medium">{T('أحداث Webhook','Webhook Events',lang)}</p>
          <div className="flex flex-wrap gap-2">{['booking.created','payment.success','user.registered','order.cancelled'].map(e=>(
            <label key={e} className="flex items-center gap-1.5 text-xs bg-muted px-2.5 py-1.5 rounded-full cursor-pointer"><input type="checkbox" defaultChecked className="rounded accent-violet-600" />{e}</label>
          ))}</div>
        </div>
      </div>
      <Card><CardHeader className="pb-3"><CardTitle className="text-sm">{T('بوابات الدفع','Payment Gateways',lang)}</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {[['paypal','PayPal'],['stripe','Stripe'],['tap','Tap']].map(([k,l])=>(
            <div key={k} className="flex items-center justify-between"><span className="text-sm">{l}</span><Toggle on={s[k as keyof typeof s] as boolean} onToggle={()=>tog(k)} /></div>
          ))}
        </CardContent></Card>
      <FormField label={T('مزود الذكاء الاصطناعي','AI Provider',lang)}>
        <Select defaultValue="openai"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
          {['OpenAI','Anthropic','Google AI',T('معطل','Disabled',lang)].map(p=><SelectItem key={p} value={p.toLowerCase()}>{p}</SelectItem>)}
        </SelectContent></Select>
      </FormField>
      <Dialog open={genKeyOpen} onOpenChange={setGenKeyOpen}><DialogContent>
        <DialogHeader><DialogTitle>{T('إنشاء مفتاح API','Generate API Key',lang)}</DialogTitle>
          <DialogDescription>{T('أدخل اسم المفتاح الجديد','Enter a name for the new key',lang)}</DialogDescription></DialogHeader>
        <FormField label={T('اسم المفتاح','Key Name',lang)}><Input placeholder={T('مثال: الإنتاج','e.g. Production',lang)} /></FormField>
        <DialogFooter><Button variant="outline" onClick={()=>setGenKeyOpen(false)}>{T('إلغاء','Cancel',lang)}</Button>
          <Button className="bg-violet-600 hover:bg-violet-700 text-white" onClick={()=>{setGenKeyOpen(false);toast.success(T('تم إنشاء المفتاح','Key generated',lang))}}>{T('إنشاء','Generate',lang)}</Button></DialogFooter>
      </DialogContent></Dialog>
    </>),
    maintenance: w(<>
      {maintenance && <div className="flex items-center gap-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3 text-sm text-amber-700 dark:text-amber-400">
        <Info className="h-4 w-4 shrink-0" /><span>{T('وضع الصيانة مفعّل - لن يتمكن المستخدمون من الوصول','Maintenance mode is ON - users cannot access the platform',lang)}</span>
      </div>}
      <div className="flex items-center justify-between">
        <div><p className="text-sm font-medium">{T('وضع الصيانة','Maintenance Mode',lang)}</p><p className="text-xs text-muted-foreground">{T('تعطيل الوصول للمنصة مؤقتاً','Temporarily disable platform access',lang)}</p></div>
        <Toggle on={maintenance} onToggle={()=>setMaintenance(!maintenance)} color="amber" />
      </div>
      <FormField label={T('رسالة الصيانة','Maintenance Message',lang)}><Textarea defaultValue={T('الموقع قيد الصيانة، سنعود قريباً','Site is under maintenance, we will be back soon',lang)} rows={3} /></FormField>
      <Separator />
      <div className="flex items-center justify-between">
        <div><p className="text-sm font-medium">{T('إصدار النظام','System Version',lang)}</p><p className="text-xs text-muted-foreground">v2.4.1</p></div>
        <ActionBtn icon={RefreshCw} label={T('التحقق من التحديثات','Check Updates',lang)} onClick={()=>toast.info(T('النظام محدّث','System is up to date',lang))} variant="outline" />
      </div>
    </>),
    system: w(<>
      <Card><CardContent className="p-4"><div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
        {[
          [T('إصدار التطبيق','App Version',lang),'v2.4.1'],['Next.js','16.0.0'],['Node.js','22.x'],
          [T('البيئة','Environment',lang),'Production'],[T('قاعدة البيانات','Database',lang),'PostgreSQL 16'],
          [T('التخزين المؤقت','Cache',lang),'Redis 7'],[T('التخزين','Storage',lang),'S3'],
          [T('وقت التشغيل','Uptime',lang),'42d 7h 13m'],[T('آخر نشر','Last Deploy',lang),'2025-06-10 14:30'],
          [T('الاتصالات','Connections',lang),'127'],[T('الذاكرة','Memory',lang),'4.2 / 8 GB'],
          [T('المعالج','CPU',lang),'23%'],
        ].map(([label,value])=>(
          <div key={label as string} className="flex items-center justify-between py-1 border-b border-muted/50 last:border-0">
            <span className="text-muted-foreground">{label as string}</span>
            <Badge variant="secondary" className="font-mono text-xs">{value as string}</Badge>
          </div>
        ))}
      </div></CardContent></Card>
    </>),
  }

  return (
    <div className="space-y-6">
      <PageTitle title={T('الإعدادات','Settings',lang)} action={<Badge className="bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400 border-violet-200 dark:border-violet-800 text-xs">{T('إعدادات النظام','System Settings',lang)}</Badge>} />
      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map(tab => {
          const Icon = TAB_ICONS[tab.key]
          return (
            <Button key={tab.key} variant={activeTab===tab.key?'default':'outline'}
              className={`text-xs rounded-full px-4 whitespace-nowrap shrink-0 gap-1.5 ${activeTab===tab.key?'bg-violet-600 hover:bg-violet-700 text-white':''}`}
              onClick={()=>setActiveTab(tab.key)}>
              <Icon className="h-3.5 w-3.5" />{T(tab.ar,tab.en,lang)}
            </Button>
          )
        })}
      </div>
      {tabs[activeTab]}
    </div>
  )
}