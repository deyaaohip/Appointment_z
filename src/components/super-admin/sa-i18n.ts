import { useAppStore } from '@/stores/app-store'

export type Lang = 'ar' | 'en'

// ─── Comprehensive translations for all 14 dashboard pages ───
interface T {
  // Shared
  noResults: string
  save: string
  cancel: string
  confirm: string
  actions: string
  status: string
  search: string
  filter: string
  all: string
  view: string
  edit: string
  delete: string
  close: string
  loading: string
  showingOf: string

  // Overview
  overviewTitle: string
  totalTenants: string
  totalUsers: string
  revenue: string
  totalBookings: string
  active: string
  thisMonth: string
  last30Days: string
  comparedToLastMonth: string
  revenueByPlan: string
  recentActivity: string
  activeTenants: string
  details: string
  perMonth: string

  // Tenants
  tenantMgmt: string
  addTenant: string
  tenantSearch: string
  allStatuses: string
  trial: string
  suspended: string
  tenant: string
  plan: string
  bookings: string
  tenantRevenue: string
  addTenantDlg: string
  editTenantDlg: string
  deleteTenantDlg: string
  deleteTenantDesc: string
  nameAr: string
  nameEn: string
  email: string
  country: string
  added: string
  updated: string
  deleted: string
  enterTenantName: string
  enterValidEmail: string
  tenantDetails: string
  tenantSuspended: string
  tenantActivated: string
  confirmSuspend: string
  confirmActivate: string

  // Users
  userMgmt: string
  addUser: string
  userSearch: string
  user: string
  role: string
  addUserDlg: string
  editUserDlg: string
  deleteUserDlg: string
  name: string
  enterNameAndEmail: string
  userSuspended: string
  userActivated: string
  changeStatus: string
  suspendUser: string
  activateUser: string
  owner: string
  manager: string
  receptionist: string
  accountant: string

  // Plans
  plansTitle: string
  createPlan: string
  mostPopular: string
  free: string
  tenants: string
  managePlan: string
  monthly: string
  editPlanDlg: string
  willOpenPlanEditor: string
  willOpenCreatePlan: string

  // Billing
  billingTitle: string
  createInvoice: string
  payments: string
  pending: string
  paid: string
  overdue: string
  failed: string
  invoiceNo: string
  amount: string
  date: string
  download: string
  willCreateInvoice: string
  downloadingInvoice: string
  viewingInvoice: string

  // Roles
  rolesTitle: string
  addRole: string
  permissions: string
  users: string
  addRoleDlg: string
  roleName: string
  roleNameEn: string
  description: string
  create: string
  roleCreated: string

  // Audit
  auditTitle: string
  export: string
  info: string
  success: string
  warning: string
  error: string
  level: string
  message: string
  source: string
  logExported: string

  // Notifications
  notificationsTitle: string
  sendNotif: string
  template: string
  type: string
  sent: string
  send: string
  sendNotifDlg: string
  title: string
  content: string
  target: string
  everyone: string
  activeUsers: string
  trialUsers: string
  notifSent: string
  editTemplate: string
  testSent: string

  // Reports
  reportsTitle: string
  generate: string
  lastGenerated: string
  generating: string
  downloading: string

  // System
  systemTitle: string
  refresh: string
  systemLog: string
  refreshed: string

  // Servers
  serversTitle: string
  addServer: string
  restart: string
  requests: string
  addServerDlg: string
  serverName: string
  region: string
  serverAdded: string
  restarting: string
  serverDetails: string

  // Database
  dbTitle: string
  backup: string
  dbSize: string
  tables: string
  avgResponse: string
  backups: string
  resourceUsage: string
  backupList: string
  automatic: string
  manual: string
  backingUp: string
  downloadingBackup: string

  // Security
  securityTitle: string
  securitySettings: string
  twoFactor: string
  twoFactorDesc: string
  ipWhitelist: string
  ipWhitelistDesc: string
  bruteForce: string
  bruteForceDesc: string
  sessionTimeout: string
  sessionTimeoutDesc: string
  auditLogging: string
  auditLoggingDesc: string
  dataEncryption: string
  dataEncryptionDesc: string
  suspiciousAttempts: string
  ipAddress: string
  time: string
  location: string
  unknown: string
  settingUpdated: string

  // Settings
  settingsTitle: string
  saveSettings: string
  generalSettings: string
  platformName: string
  supportEmail: string
  currency: string
  timezone: string
  advancedSettings: string
  maxTenants: string
  backupFreq: string
  maintenanceMode: string
  maintenanceModeDesc: string
  openRegistration: string
  openRegistrationDesc: string
  hourly: string
  daily: string
  weekly: string
  settingsSaved: string

  // Pagination
  prev: string
  next: string
  page: string

  // Sort
  sortAsc: string
  sortDesc: string

  // Overview audit additions
  expiredSubs: string
  pendingRequests: string
  monthlyRevenue: string
  recentPayments: string
  systemNotifications: string
  quickActions: string

  // CLIQ Payment Gateway
  cliqTitle: string
  cliqSettings: string
  cliqEnabled: string
  cliqEnabledDesc: string
  cliqBankName: string
  cliqAccountHolder: string
  cliqAlias: string
  cliqInstructions: string
  cliqQrCode: string
  cliqSupportContact: string
  cliqUploadQr: string
  cliqPending: string
  cliqApproved: string
  cliqRejected: string
  cliqInfoRequested: string
  cliqReferenceNo: string
  cliqCustomer: string
  cliqSubmissionDate: string
  cliqScreenshot: string
  cliqNotes: string
  cliqApprove: string
  cliqReject: string
  cliqRequestInfo: string
  cliqApproveDesc: string
  cliqRejectDesc: string
  cliqApprovedMsg: string
  cliqRejectedMsg: string
  cliqInfoRequestedMsg: string
  cliqRejectionReason: string
  cliqEnterReason: string
  cliqInfoRequestPrompt: string
  cliqNoScreenshot: string
  cliqTotalPending: string
  cliqTotalApproved: string
  cliqTotalRejected: string
  cliqNoPayments: string
  cliqPaymentMethod: string
  cliqTransferInfo: string
  cliqTransferComplete: string
  cliqReferenceRequired: string
  cliqDuplicateRef: string
  cliqSubmitPayment: string
  cliqPaymentSubmitted: string
  cliqWaitingVerification: string
  cliqResubmit: string
  cliqAuditApprove: string
  cliqAuditReject: string
  cliqAuditInfo: string

  // Super Admin labels
  superAdmin: string
  superAdminDashboard: string
  profile: string
  preferences: string
  signOut: string

  // Sidebar sections
  mainSection: string
  managementSection: string
  systemSection: string

  // Sidebar nav items
  navOverview: string
  navTenants: string
  navUsers: string
  navPlans: string
  navBilling: string
  navRoles: string
  navAudit: string
  navNotifications: string
  navReports: string
  navSystem: string
  navServers: string
  navDatabase: string
  navSecurity: string
  navSettings: string
  navCliq: string

  // Report names
  reportRevenue: string
  reportRevenueDesc: string
  reportGrowth: string
  reportGrowthDesc: string
  reportSecurity: string
  reportSecurityDesc: string
  reportPerformance: string
  reportPerformanceDesc: string
  reportUsers: string
  reportUsersDesc: string
  reportBilling: string
  reportBillingDesc: string
  reportTypeFinancial: string
  reportTypeOperational: string
  reportTypeSecurity: string
  reportTypeTechnical: string

  // Notification templates
  notifWelcome: string
  notifPayment: string
  notifSuspend: string
  notifWeekly: string
  notifTypeEmail: string
  notifTypeEmailSms: string

  // System gauge labels
  gaugeApi: string
  gaugeDatabase: string
  gaugeMemory: string
  gaugeDisk: string
  gaugeCdn: string
  gaugeWorker: string
  gaugeConnections: string
  gaugeCpu: string
  gaugeUptime: string

  // Confirm dialog descriptions
  confirmDeleteUser: string
  confirmDeleteServer: string
  confirmDeleteRole: string
  confirmDeleteTemplate: string

  // Actions
  serverRestarted: string
  serverDeleted: string
  roleDeleted: string
  roleUpdated: string
  userDeleted: string
  reportGenerated: string
  reportDownloaded: string
  planDetails: string
  editRoleDlg: string

  // Excel export
  exportExcel: string

  // Subscription management
  extendSubscription: string
  extendSubscriptionDlg: string
  durationMonths: string
  subscriptionExtended: string
  subscriptionActivated: string
  subscriptionStatus: string
  subscriptionEnd: string
  months: string

  // CLIQ new payment
  newCliqPayment: string
  newCliqPaymentDlg: string
  customerName: string
  customerEmail: string
  referenceNumber: string
  notes: string
  cliqNewPaymentSuccess: string
  cliqInfoRequested2: string
}

const ar: T = {
  // Shared
  noResults: 'لا توجد نتائج',
  save: 'حفظ',
  cancel: 'إلغاء',
  confirm: 'تأكيد',
  actions: 'إجراءات',
  status: 'الحالة',
  search: 'بحث',
  filter: 'تصفية',
  all: 'الكل',
  view: 'عرض',
  edit: 'تعديل',
  delete: 'حذف',
  close: 'إغلاق',
  loading: 'جاري التحميل...',
  showingOf: 'عرض {current} من {total} {entity}',
  // Overview
  overviewTitle: 'نظرة عامة على المنصة',
  totalTenants: 'إجمالي المستأجرين',
  totalUsers: 'إجمالي المستخدمين',
  revenue: 'الإيرادات (د.أ)',
  totalBookings: 'إجمالي الحجوزات',
  active: 'نشط',
  thisMonth: 'هذا الشهر',
  last30Days: 'آخر 30 يوم',
  comparedToLastMonth: 'مقارنة بالشهر السابق',
  revenueByPlan: 'الإيرادات حسب الباقة',
  recentActivity: 'آخر النشاطات',
  activeTenants: 'المستأجرون النشطون',
  details: 'تفاصيل',
  perMonth: 'د.أ / شهر',
  // Tenants
  tenantMgmt: 'إدارة المستأجرين',
  addTenant: 'إضافة مستأجر',
  tenantSearch: 'بحث بالاسم أو البريد الإلكتروني...',
  allStatuses: 'جميع الحالات',
  trial: 'تجريبي',
  suspended: 'معلق',
  tenant: 'المستأجر',
  plan: 'الباقة',
  bookings: 'الحجوزات',
  tenantRevenue: 'الإيرادات',
  addTenantDlg: 'إضافة مستأجر',
  editTenantDlg: 'تعديل المستأجر',
  deleteTenantDlg: 'حذف المستأجر',
  deleteTenantDesc: 'هل أنت متأكد من حذف "{name}"؟ لا يمكن التراجع عن هذا الإجراء.',
  nameAr: 'الاسم (عربي)',
  nameEn: 'الاسم (إنجليزي)',
  email: 'البريد الإلكتروني',
  country: 'البلد',
  added: 'تم إضافة: {name}',
  updated: 'تم التحديث',
  deleted: 'تم الحذف',
  enterTenantName: 'يرجى إدخال اسم المستأجر',
  enterValidEmail: 'يرجى إدخال بريد إلكتروني صالح',
  tenantDetails: 'تفاصيل: {name}',
  tenantSuspended: 'تم تعليق المستأجر',
  tenantActivated: 'تم تفعيل المستأجر',
  confirmSuspend: 'تعليق "{name}"؟',
  confirmActivate: 'تفعيل "{name}"؟',
  // Users
  userMgmt: 'إدارة المستخدمين',
  addUser: 'إضافة مستخدم',
  userSearch: 'بحث بالاسم أو البريد...',
  user: 'المستخدم',
  role: 'الدور',
  addUserDlg: 'إضافة مستخدم',
  editUserDlg: 'تعديل المستخدم',
  deleteUserDlg: 'حذف المستخدم',
  name: 'الاسم',
  enterNameAndEmail: 'يرجى إدخال الاسم والبريد',
  userSuspended: 'تم تعليق المستخدم',
  userActivated: 'تم تفعيل المستخدم',
  changeStatus: 'تغيير الحالة',
  suspendUser: 'تعليق "{name}"',
  activateUser: 'تفعيل "{name}"',
  owner: 'مالك',
  manager: 'مدير',
  receptionist: 'موظف استقبال',
  accountant: 'محاسب',
  // Plans
  plansTitle: 'الباقات والاشتراكات',
  createPlan: 'إنشاء باقة',
  mostPopular: 'الأكثر شعبية',
  free: 'مجاني',
  tenants: 'مستأجر',
  managePlan: 'إدارة الباقة',
  monthly: 'شهرياً',
  editPlanDlg: 'تعديل الباقة',
  editRoleDlg: 'تعديل الدور',
  roleUpdated: 'تم تحديث الدور',
  roleDeleted: 'تم حذف الدور',
  userDeleted: 'تم حذف المستخدم',
  willOpenPlanEditor: 'سيتم فتح تعديل الباقة',
  willOpenCreatePlan: 'سيتم فتح نموذج إنشاء باقة جديدة',
  serverRestarted: 'تم إعادة تشغيل الخادم',
  serverDeleted: 'تم حذف الخادم',
  reportGenerated: 'تم توليد التقرير',
  reportDownloaded: 'جاري تنزيل التقرير...',
  planDetails: 'تفاصيل الباقة',
  // Billing
  billingTitle: 'الفواتير والمدفوعات',
  createInvoice: 'إنشاء فاتورة',
  payments: 'المدفوعات',
  pending: 'معلق',
  paid: 'مدفوع',
  overdue: 'متأخر',
  failed: 'فاشل',
  invoiceNo: 'رقم الفاتورة',
  amount: 'المبلغ',
  date: 'التاريخ',
  download: 'تنزيل',
  willCreateInvoice: 'سيتم إنشاء فاتورة جديدة',
  downloadingInvoice: 'تنزيل {id}',
  viewingInvoice: 'عرض {id}',
  // Roles
  rolesTitle: 'الأدوار والصلاحيات',
  addRole: 'إضافة دور',
  permissions: 'صلاحية',
  users: 'مستخدم',
  addRoleDlg: 'إضافة دور جديد',
  roleName: 'اسم الدور',
  roleNameEn: 'الاسم (إنجليزي)',
  description: 'الوصف',
  create: 'إنشاء',
  roleCreated: 'تم إنشاء الدور',
  // Audit
  auditTitle: 'سجل العمليات',
  export: 'تصدير',
  info: 'معلومة',
  success: 'نجاح',
  warning: 'تحذير',
  error: 'خطأ',
  level: 'المستوى',
  message: 'الرسالة',
  source: 'المصدر',
  logExported: 'تم تصدير السجل',
  // Notifications
  notificationsTitle: 'الإشعارات',
  sendNotif: 'إرسال إشعار',
  template: 'القالب',
  type: 'النوع',
  sent: 'مرات الإرسال',
  send: 'إرسال',
  sendNotifDlg: 'إرسال إشعار',
  title: 'العنوان',
  content: 'المحتوى',
  target: 'الفئة',
  everyone: 'الجميع',
  activeUsers: 'النشطون',
  trialUsers: 'التجريبية',
  notifSent: 'تم الإرسال',
  editTemplate: 'تعديل القالب',
  testSent: 'تم إرسال اختبار',
  // Reports
  reportsTitle: 'التقارير',
  generate: 'توليد',
  lastGenerated: 'آخر توليد:',
  generating: 'جاري التوليد...',
  downloading: 'جاري التنزيل...',
  // System
  systemTitle: 'صحة النظام',
  refresh: 'تحديث',
  systemLog: 'سجل النظام',
  refreshed: 'تم التحديث',
  // Servers
  serversTitle: 'الخوادم',
  addServer: 'إضافة خادم',
  restart: 'إعادة تشغيل',
  requests: 'الطلبات',
  addServerDlg: 'إضافة خادم',
  serverName: 'اسم الخادم',
  region: 'المنطقة',
  serverAdded: 'تم إضافة الخادم',
  restarting: 'إعادة تشغيل الخادم',
  serverDetails: 'تفاصيل الخادم',
  // Database
  dbTitle: 'قاعدة البيانات',
  backup: 'نسخ احتياطي',
  dbSize: 'حجم القاعدة',
  tables: 'عدد الجداول',
  avgResponse: 'متوسط الاستجابة',
  backups: 'النسخ الاحتياطية',
  resourceUsage: 'استخدام الموارد',
  backupList: 'النسخ الاحتياطية',
  automatic: 'تلقائي',
  manual: 'يدوي',
  backingUp: 'جاري النسخ الاحتياطي...',
  downloadingBackup: 'جاري التنزيل...',
  // Security
  securityTitle: 'الأمان',
  securitySettings: 'إعدادات الأمان',
  twoFactor: 'المصادقة الثنائية',
  twoFactorDesc: 'تطلب رمز تحقق إضافي عند تسجيل الدخول',
  ipWhitelist: 'القائمة البيضاء لـ IP',
  ipWhitelistDesc: 'السماح فقط بعناوين IP المعتمدة',
  bruteForce: 'حماية القوة الغاشمة',
  bruteForceDesc: 'حظر تلقائي بعد 5 محاولات فاشلة',
  sessionTimeout: 'انتهاء الجلسة',
  sessionTimeoutDesc: 'إنهاء الجلسة بعد 30 دقيقة من عدم النشاط',
  auditLogging: 'تسجيل العمليات',
  auditLoggingDesc: 'تسجيل جميع العمليات الحساسة',
  dataEncryption: 'تشفير البيانات',
  dataEncryptionDesc: 'تشفير البيانات الحساسة في التخزين',
  suspiciousAttempts: 'محاولات الدخول المشبوهة',
  ipAddress: 'عنوان IP',
  time: 'الوقت',
  location: 'الموقع',
  unknown: 'مجهول',
  settingUpdated: 'تم تحديث الإعداد',
  // Settings
  settingsTitle: 'إعدادات المنصة',
  saveSettings: 'حفظ الإعدادات',
  generalSettings: 'الإعدادات العامة',
  platformName: 'اسم المنصة',
  supportEmail: 'بريد الدعم',
  currency: 'العملة',
  timezone: 'المنطقة الزمنية',
  advancedSettings: 'إعدادات متقدمة',
  maxTenants: 'الحد الأقصى للمستأجرين',
  backupFreq: 'تكرار النسخ الاحتياطي',
  maintenanceMode: 'وضع الصيانة',
  maintenanceModeDesc: 'تعطيل الوصول مؤقتاً',
  openRegistration: 'التسجيل المفتوح',
  openRegistrationDesc: 'السماح بالتسجيل الذاتي',
  hourly: 'كل ساعة',
  daily: 'يومياً',
  weekly: 'أسبوعياً',
  settingsSaved: 'تم حفظ الإعدادات',
  // Pagination
  prev: 'السابق',
  next: 'التالي',
  page: 'صفحة',
  // Sort
  sortAsc: 'تصاعدي',
  sortDesc: 'تنازلي',
  // Super Admin labels
  superAdmin: 'مدير النظام',
  superAdminDashboard: 'لوحة تحكم مدير النظام',
  profile: 'الملف الشخصي',
  preferences: 'التفضيلات',
  signOut: 'تسجيل الخروج',
  // Sidebar sections
  mainSection: 'الرئيسية',
  managementSection: 'الإدارة',
  systemSection: 'النظام',
  // Sidebar nav items
  navOverview: 'نظرة عامة',
  navTenants: 'إدارة المستأجرين',
  navUsers: 'إدارة المستخدمين',
  navPlans: 'الباقات والاشتراكات',
  navBilling: 'الفواتير والمدفوعات',
  navRoles: 'الأدوار والصلاحيات',
  navAudit: 'سجل العمليات',
  navNotifications: 'الإشعارات',
  navReports: 'التقارير',
  navSystem: 'صحة النظام',
  navServers: 'الخوادم',
  navDatabase: 'قاعدة البيانات',
  navSecurity: 'الأمان',
  navSettings: 'إعدادات المنصة',
  navCliq: 'مدفوعات CLIQ',
  // Overview audit additions
  expiredSubs: 'اشتراكات منتهية',
  pendingRequests: 'طلبات معلقة',
  monthlyRevenue: 'إيرادات الشهر',
  recentPayments: 'المدفوعات الأخيرة',
  systemNotifications: 'إشعارات النظام',
  quickActions: 'إجراءات سريعة',
  // CLIQ Payment Gateway
  cliqTitle: 'مدفوعات CLIQ',
  cliqSettings: 'إعدادات الدفع CLIQ',
  cliqEnabled: 'تفعيل دفع CLIQ',
  cliqEnabledDesc: 'السماح للعملاء بالدفع عبر تحويل CLIQ',
  cliqBankName: 'اسم البنك',
  cliqAccountHolder: 'صاحب الحساب',
  cliqAlias: 'CLIQ Alias',
  cliqInstructions: 'تعليمات الدفع',
  cliqQrCode: 'رمز QR (اختياري)',
  cliqSupportContact: 'معلومات الدعم',
  cliqUploadQr: 'رفع رمز QR',
  cliqPending: 'قيد التحقق',
  cliqApproved: 'مقبول',
  cliqRejected: 'مرفوض',
  cliqInfoRequested: 'مطلوب معلومات',
  cliqReferenceNo: 'رقم المرجع',
  cliqCustomer: 'العميل',
  cliqSubmissionDate: 'تاريخ التقديم',
  cliqScreenshot: 'لقطة الشاشة',
  cliqNotes: 'ملاحظات',
  cliqApprove: 'قبول الدفعة',
  cliqReject: 'رفض الدفعة',
  cliqRequestInfo: 'طلب معلومات',
  cliqApproveDesc: 'هل أنت متأكد من قبول هذا الدفع؟ سيتم تفعيل الاشتراك تلقائياً.',
  cliqRejectDesc: 'هل أنت متأكد من رفض هذا الدفع؟',
  cliqApprovedMsg: 'تم قبول الدفعة وتفعيل الاشتراك',
  cliqRejectedMsg: 'تم رفض الدفعة',
  cliqInfoRequestedMsg: 'تم طلب معلومات إضافية من العميل',
  cliqRejectionReason: 'سبب الرفض',
  cliqEnterReason: 'أدخل سبب الرفض',
  cliqInfoRequestPrompt: 'ما هي المعلومات الإضافية المطلوبة؟',
  cliqNoScreenshot: 'لم يتم رفع لقطة',
  cliqTotalPending: 'إجمالي المعلق',
  cliqTotalApproved: 'إجمالي المقبول',
  cliqTotalRejected: 'إجمالي المرفوض',
  cliqNoPayments: 'لا توجد مدفوعات CLIQ',
  cliqPaymentMethod: 'CLIQ (تحويل بنكي)',
  cliqTransferInfo: 'معلومات التحويل',
  cliqTransferComplete: 'قم بإتمام التحويل ثم أدخل رقم المرجع',
  cliqReferenceRequired: 'رقم المرجع مطلوب',
  cliqDuplicateRef: 'رقم المرجع مستخدم مسبقاً',
  cliqSubmitPayment: 'تقديم إثبات الدفع',
  cliqPaymentSubmitted: 'تم تقديم إثبات الدفع بنجاح. سيتم مراجعته من قبل الإدارة.',
  cliqWaitingVerification: 'في انتظار التحقق من الدفعة',
  cliqResubmit: 'إعادة تقديم',
  cliqAuditApprove: 'تم قبول دفع CLIQ',
  cliqAuditReject: 'تم رفض دفع CLIQ',
  cliqAuditInfo: 'تم طلب معلومات إضافية لدفع CLIQ',
  // Reports
  reportRevenue: 'تقرير الإيرادات الشهري',
  reportRevenueDesc: 'ملخص شامل للإيرادات حسب المستأجر والباقة',
  reportGrowth: 'تقرير النمو',
  reportGrowthDesc: 'معدلات النمو في المستأجرين والحجوزات',
  reportSecurity: 'تقرير الأمان',
  reportSecurityDesc: 'محاولات الدخول والتهديدات الأمنية',
  reportPerformance: 'تقرير الأداء',
  reportPerformanceDesc: 'أداء الخوادم وAPI واستجابة النظام',
  reportUsers: 'تقرير المستخدمين',
  reportUsersDesc: 'نشاط المستخدمين وتوزيع الأدوار',
  reportBilling: 'تقرير الفواتير',
  reportBillingDesc: 'ملخص الفواتير والمدفوعات المتأخرة',
  reportTypeFinancial: 'مالي',
  reportTypeOperational: 'تشغيلي',
  reportTypeSecurity: 'أمني',
  reportTypeTechnical: 'تقني',
  // Notification templates
  notifWelcome: 'ترحيب مستأجر جديد',
  notifPayment: 'تذكير بالدفع',
  notifSuspend: 'إشعار تعليق الحساب',
  notifWeekly: 'تقرير أسبوعي',
  notifTypeEmail: 'بريد إلكتروني',
  notifTypeEmailSms: 'بريد + SMS',
  // System gauge labels
  gaugeApi: 'API',
  gaugeDatabase: 'قاعدة البيانات',
  gaugeMemory: 'الذاكرة',
  gaugeDisk: 'القرص',
  gaugeCdn: 'CDN',
  gaugeWorker: 'العامل',
  gaugeConnections: 'الاتصالات',
  gaugeCpu: 'المعالج',
  gaugeUptime: 'وقت التشغيل',
  // Confirm dialog descriptions
  confirmDeleteUser: 'هل أنت متأكد من حذف "{name}"؟',
  confirmDeleteServer: 'هل أنت متأكد من حذف هذا الخادم؟',
  confirmDeleteRole: 'هل أنت متأكد من حذف هذا الدور؟',
  confirmDeleteTemplate: 'هل أنت متأكد من حذف هذا القالب؟',

  // Excel export
  exportExcel: 'تصدير Excel',

  // Subscription management
  extendSubscription: 'تمديد الاشتراك',
  extendSubscriptionDlg: 'تمديد اشتراك المستأجر',
  durationMonths: 'مدة الاشتراك (أشهر)',
  subscriptionExtended: 'تم تمديد الاشتراك بنجاح',
  subscriptionActivated: 'تم تفعيل الاشتراك',
  subscriptionStatus: 'حالة الاشتراك',
  subscriptionEnd: 'ينتهي في',
  months: 'أشهر',

  // CLIQ new payment
  newCliqPayment: 'طلب دفع جديد',
  newCliqPaymentDlg: 'إرسال طلب دفع CLIQ',
  customerName: 'اسم العميل',
  customerEmail: 'البريد الإلكتروني',
  referenceNumber: 'رقم المرجع',
  notes: 'ملاحظات',
  cliqNewPaymentSuccess: 'تم إرسال طلب الدفع بنجاح',
  cliqInfoRequested2: 'طلب معلومات',
}

const en: T = {
  noResults: 'No results found',
  save: 'Save',
  cancel: 'Cancel',
  confirm: 'Confirm',
  actions: 'Actions',
  status: 'Status',
  search: 'Search',
  filter: 'Filter',
  all: 'All',
  view: 'View',
  edit: 'Edit',
  delete: 'Delete',
  close: 'Close',
  loading: 'Loading...',
  showingOf: 'Showing {current} of {total} {entity}',
  overviewTitle: 'Platform Overview',
  totalTenants: 'Total Tenants',
  totalUsers: 'Total Users',
  revenue: 'Revenue (JOD)',
  totalBookings: 'Total Bookings',
  active: 'Active',
  thisMonth: 'This Month',
  last30Days: 'Last 30 Days',
  comparedToLastMonth: 'vs. previous month',
  revenueByPlan: 'Revenue by Plan',
  recentActivity: 'Recent Activity',
  activeTenants: 'Active Tenants',
  details: 'Details',
  perMonth: 'JOD / month',
  tenantMgmt: 'Tenant Management',
  addTenant: 'Add Tenant',
  tenantSearch: 'Search by name or email...',
  allStatuses: 'All Statuses',
  trial: 'Trial',
  suspended: 'Suspended',
  tenant: 'Tenant',
  plan: 'Plan',
  bookings: 'Bookings',
  tenantRevenue: 'Revenue',
  addTenantDlg: 'Add Tenant',
  editTenantDlg: 'Edit Tenant',
  deleteTenantDlg: 'Delete Tenant',
  deleteTenantDesc: 'Are you sure you want to delete "{name}"? This action cannot be undone.',
  nameAr: 'Name (Arabic)',
  nameEn: 'Name (English)',
  email: 'Email',
  country: 'Country',
  added: 'Added: {name}',
  updated: 'Updated',
  deleted: 'Deleted',
  enterTenantName: 'Please enter a tenant name',
  enterValidEmail: 'Please enter a valid email',
  tenantDetails: 'Details: {name}',
  tenantSuspended: 'Tenant suspended',
  tenantActivated: 'Tenant activated',
  confirmSuspend: 'Suspend "{name}"?',
  confirmActivate: 'Activate "{name}"?',
  userMgmt: 'User Management',
  addUser: 'Add User',
  userSearch: 'Search by name or email...',
  user: 'User',
  role: 'Role',
  addUserDlg: 'Add User',
  editUserDlg: 'Edit User',
  deleteUserDlg: 'Delete User',
  name: 'Name',
  enterNameAndEmail: 'Please enter name and email',
  userSuspended: 'User suspended',
  userActivated: 'User activated',
  changeStatus: 'Change Status',
  suspendUser: 'Suspend "{name}"',
  activateUser: 'Activate "{name}"',
  owner: 'Owner',
  manager: 'Manager',
  receptionist: 'Receptionist',
  accountant: 'Accountant',
  plansTitle: 'Plans & Subscriptions',
  createPlan: 'Create Plan',
  mostPopular: 'Most Popular',
  free: 'Free',
  tenants: 'tenants',
  managePlan: 'Manage Plan',
  monthly: 'monthly',
  editPlanDlg: 'Edit Plan',
  editRoleDlg: 'Edit Role',
  roleUpdated: 'Role updated',
  roleDeleted: 'Role deleted',
  userDeleted: 'User deleted',
  willOpenPlanEditor: 'Plan editor will open',
  willOpenCreatePlan: 'Create plan form will open',
  serverRestarted: 'Server restarted',
  serverDeleted: 'Server deleted',
  reportGenerated: 'Report generated',
  reportDownloaded: 'Downloading report...',
  planDetails: 'Plan Details',
  billingTitle: 'Billing & Payments',
  createInvoice: 'Create Invoice',
  payments: 'Payments',
  pending: 'Pending',
  paid: 'Paid',
  overdue: 'Overdue',
  failed: 'Failed',
  invoiceNo: 'Invoice No.',
  amount: 'Amount',
  date: 'Date',
  download: 'Download',
  willCreateInvoice: 'New invoice form will open',
  downloadingInvoice: 'Downloading {id}',
  viewingInvoice: 'Viewing {id}',
  rolesTitle: 'Roles & Permissions',
  addRole: 'Add Role',
  permissions: 'permissions',
  users: 'users',
  addRoleDlg: 'Add New Role',
  roleName: 'Role Name',
  roleNameEn: 'Name (English)',
  description: 'Description',
  create: 'Create',
  roleCreated: 'Role created',
  auditTitle: 'Audit Logs',
  export: 'Export',
  info: 'Info',
  success: 'Success',
  warning: 'Warning',
  error: 'Error',
  level: 'Level',
  message: 'Message',
  source: 'Source',
  logExported: 'Log exported',
  notificationsTitle: 'Notifications',
  sendNotif: 'Send Notification',
  template: 'Template',
  type: 'Type',
  sent: 'Sent',
  send: 'Send',
  sendNotifDlg: 'Send Notification',
  title: 'Title',
  content: 'Content',
  target: 'Target',
  everyone: 'Everyone',
  activeUsers: 'Active',
  trialUsers: 'Trial',
  notifSent: 'Notification sent',
  editTemplate: 'Edit template',
  testSent: 'Test sent',
  reportsTitle: 'Reports',
  generate: 'Generate',
  lastGenerated: 'Last generated:',
  generating: 'Generating...',
  downloading: 'Downloading...',
  systemTitle: 'System Health',
  refresh: 'Refresh',
  systemLog: 'System Log',
  refreshed: 'Refreshed',
  serversTitle: 'Servers',
  addServer: 'Add Server',
  restart: 'Restart',
  requests: 'Requests',
  addServerDlg: 'Add Server',
  serverName: 'Server Name',
  region: 'Region',
  serverAdded: 'Server added',
  restarting: 'Restarting server',
  serverDetails: 'Server details',
  dbTitle: 'Database',
  backup: 'Backup',
  dbSize: 'Database Size',
  tables: 'Tables',
  avgResponse: 'Avg Response',
  backups: 'Backups',
  resourceUsage: 'Resource Usage',
  backupList: 'Backups',
  automatic: 'Automatic',
  manual: 'Manual',
  backingUp: 'Backing up...',
  downloadingBackup: 'Downloading...',
  securityTitle: 'Security',
  securitySettings: 'Security Settings',
  twoFactor: 'Two-Factor Authentication',
  twoFactorDesc: 'Require an additional verification code on login',
  ipWhitelist: 'IP Whitelist',
  ipWhitelistDesc: 'Allow only approved IP addresses',
  bruteForce: 'Brute Force Protection',
  bruteForceDesc: 'Auto-block after 5 failed attempts',
  sessionTimeout: 'Session Timeout',
  sessionTimeoutDesc: 'End session after 30 minutes of inactivity',
  auditLogging: 'Audit Logging',
  auditLoggingDesc: 'Log all sensitive operations',
  dataEncryption: 'Data Encryption',
  dataEncryptionDesc: 'Encrypt sensitive data in storage',
  suspiciousAttempts: 'Suspicious Login Attempts',
  ipAddress: 'IP Address',
  time: 'Time',
  location: 'Location',
  unknown: 'Unknown',
  settingUpdated: 'Setting updated',
  settingsTitle: 'Platform Settings',
  saveSettings: 'Save Settings',
  generalSettings: 'General Settings',
  platformName: 'Platform Name',
  supportEmail: 'Support Email',
  currency: 'Currency',
  timezone: 'Timezone',
  advancedSettings: 'Advanced Settings',
  maxTenants: 'Max Tenants',
  backupFreq: 'Backup Frequency',
  maintenanceMode: 'Maintenance Mode',
  maintenanceModeDesc: 'Temporarily disable access',
  openRegistration: 'Open Registration',
  openRegistrationDesc: 'Allow self-registration',
  hourly: 'Hourly',
  daily: 'Daily',
  weekly: 'Weekly',
  settingsSaved: 'Settings saved',
  prev: 'Previous',
  next: 'Next',
  page: 'Page',
  sortAsc: 'Ascending',
  sortDesc: 'Descending',
  superAdmin: 'Super Admin',
  superAdminDashboard: 'Super Admin Dashboard',
  profile: 'Profile',
  preferences: 'Preferences',
  signOut: 'Sign Out',
  mainSection: 'Main',
  managementSection: 'Management',
  systemSection: 'System',
  navOverview: 'Overview',
  navTenants: 'Tenants',
  navUsers: 'Users',
  navPlans: 'Plans',
  navBilling: 'Billing',
  navRoles: 'Roles',
  navAudit: 'Audit Logs',
  navNotifications: 'Notifications',
  navReports: 'Reports',
  navSystem: 'System Health',
  navServers: 'Servers',
  navDatabase: 'Database',
  navSecurity: 'Security',
  navSettings: 'Settings',
  navCliq: 'CLIQ Payments',
  // Overview audit additions
  expiredSubs: 'Expired Subscriptions',
  pendingRequests: 'Pending Requests',
  monthlyRevenue: 'Monthly Revenue',
  recentPayments: 'Recent Payments',
  systemNotifications: 'System Notifications',
  quickActions: 'Quick Actions',
  // CLIQ Payment Gateway
  cliqTitle: 'Pending CLIQ Payments',
  cliqSettings: 'CLIQ Payment Settings',
  cliqEnabled: 'Enable CLIQ Payment',
  cliqEnabledDesc: 'Allow customers to pay via CLIQ bank transfer',
  cliqBankName: 'Bank Name',
  cliqAccountHolder: 'Account Holder Name',
  cliqAlias: 'CLIQ Alias',
  cliqInstructions: 'Payment Instructions',
  cliqQrCode: 'QR Code (Optional)',
  cliqSupportContact: 'Support Contact',
  cliqUploadQr: 'Upload QR Code',
  cliqPending: 'Pending Verification',
  cliqApproved: 'Approved',
  cliqRejected: 'Rejected',
  cliqInfoRequested: 'Info Requested',
  cliqReferenceNo: 'Reference Number',
  cliqCustomer: 'Customer',
  cliqSubmissionDate: 'Submission Date',
  cliqScreenshot: 'Screenshot',
  cliqNotes: 'Notes',
  cliqApprove: 'Approve Payment',
  cliqReject: 'Reject Payment',
  cliqRequestInfo: 'Request Info',
  cliqApproveDesc: 'Are you sure? The subscription will be activated automatically.',
  cliqRejectDesc: 'Are you sure you want to reject this payment?',
  cliqApprovedMsg: 'Payment approved and subscription activated',
  cliqRejectedMsg: 'Payment rejected',
  cliqInfoRequestedMsg: 'Additional information requested from customer',
  cliqRejectionReason: 'Rejection Reason',
  cliqEnterReason: 'Enter rejection reason',
  cliqInfoRequestPrompt: 'What additional information is needed?',
  cliqNoScreenshot: 'No screenshot uploaded',
  cliqTotalPending: 'Total Pending',
  cliqTotalApproved: 'Total Approved',
  cliqTotalRejected: 'Total Rejected',
  cliqNoPayments: 'No CLIQ payments',
  cliqPaymentMethod: 'CLIQ (Bank Transfer)',
  cliqTransferInfo: 'Transfer Information',
  cliqTransferComplete: 'Complete the transfer then enter the reference number',
  cliqReferenceRequired: 'Reference number is required',
  cliqDuplicateRef: 'This reference number is already used',
  cliqSubmitPayment: 'Submit Payment Proof',
  cliqPaymentSubmitted: 'Payment proof submitted successfully. It will be reviewed by administration.',
  cliqWaitingVerification: 'Waiting for payment verification',
  cliqResubmit: 'Resubmit',
  cliqAuditApprove: 'CLIQ payment approved',
  cliqAuditReject: 'CLIQ payment rejected',
  cliqAuditInfo: 'CLIQ payment: additional info requested',
  reportRevenue: 'Monthly Revenue Report',
  reportRevenueDesc: 'Comprehensive revenue summary by tenant and plan',
  reportGrowth: 'Growth Report',
  reportGrowthDesc: 'Growth rates in tenants and bookings',
  reportSecurity: 'Security Report',
  reportSecurityDesc: 'Login attempts and security threats',
  reportPerformance: 'Performance Report',
  reportPerformanceDesc: 'Server, API performance and system response',
  reportUsers: 'User Report',
  reportUsersDesc: 'User activity and role distribution',
  reportBilling: 'Billing Report',
  reportBillingDesc: 'Invoice and overdue payments summary',
  reportTypeFinancial: 'Financial',
  reportTypeOperational: 'Operational',
  reportTypeSecurity: 'Security',
  reportTypeTechnical: 'Technical',
  notifWelcome: 'New Tenant Welcome',
  notifPayment: 'Payment Reminder',
  notifSuspend: 'Account Suspension Notice',
  notifWeekly: 'Weekly Report',
  notifTypeEmail: 'Email',
  notifTypeEmailSms: 'Email + SMS',
  // System gauge labels
  gaugeApi: 'API',
  gaugeDatabase: 'Database',
  gaugeMemory: 'Memory',
  gaugeDisk: 'Disk',
  gaugeCdn: 'CDN',
  gaugeWorker: 'Worker',
  gaugeConnections: 'Connections',
  gaugeCpu: 'CPU',
  gaugeUptime: 'Uptime',
  // Confirm dialog descriptions
  confirmDeleteUser: 'Are you sure you want to delete "{name}"?',
  confirmDeleteServer: 'Are you sure you want to delete this server?',
  confirmDeleteRole: 'Are you sure you want to delete this role?',
  confirmDeleteTemplate: 'Are you sure you want to delete this template?',

  // Excel export
  exportExcel: 'Export Excel',

  // Subscription management
  extendSubscription: 'Extend Subscription',
  extendSubscriptionDlg: 'Extend Tenant Subscription',
  durationMonths: 'Duration (Months)',
  subscriptionExtended: 'Subscription extended successfully',
  subscriptionActivated: 'Subscription activated',
  subscriptionStatus: 'Subscription Status',
  subscriptionEnd: 'Expires on',
  months: 'months',

  // CLIQ new payment
  newCliqPayment: 'New Payment',
  newCliqPaymentDlg: 'Submit CLIQ Payment Request',
  customerName: 'Customer Name',
  customerEmail: 'Customer Email',
  referenceNumber: 'Reference Number',
  notes: 'Notes',
  cliqNewPaymentSuccess: 'Payment request submitted successfully',
  cliqInfoRequested2: 'Request Info',
}

const translations: Record<Lang, T> = { ar, en }

export function useT() {
  const { locale } = useAppStore()
  return translations[locale as Lang] || ar
}