import type { Permission } from "@/shared/permissions/permissions"

/**
 * The backend's permission strings are Arabic and finer-grained than the screens here, so each
 * permission this app checks lists the backend strings that grant it (any one is enough).
 * "<group>.الكل" ("all") grants every action of that group, and the SuperAdmin role grants everything.
 * This is the only place that knows the backend's wording.
 */
const g = (group: string, ...actions: string[]) => actions.map((a) => `${group}.${a}`)

export const BACKEND_PERMISSIONS: Record<Permission, string[]> = {
  "products.view": g("المنتجات", "عرض", "عرض الاصناف المباشرة", "عرض الخامات", "عرض الاصناف المجهزة", "عرض الاصناف المتفرعه"),
  "products.add": g("المنتجات", "إضافة", "إضافة مباشرة", "إضافة مواد خام", "إضافة متفرعة", "إضافة جاهزة"),
  "products.edit": g("المنتجات", "تعديل", "تعديل مباشر", "تعديل مواد خام", "تعديل متفرعة", "تعديل جاهزة"),
  "products.delete": g("المنتجات", "حذف"),
  "products.import": g("المنتجات", "إضافة"),
  "products.export": g("المنتجات", "عرض"),
  "barcode.print": g("المنتجات", "طباعه باركود"),
  "stock.view": g("المخزون", "عرض", "عرض التسويات"),
  "stock.adjust": g("المخزون", "تعديل جماعي", "تعديل تسوية"),
  "stock.delete": g("المخزون", "حذف تسوية"),
  "categories.view": g("تصنيفات المنتجات", "عرض"),
  "categories.manage": g("تصنيفات المنتجات", "إضافة", "تعديل", "حذف"),
  "units.view": g("وحدات القياس", "عرض"),
  "units.manage": g("وحدات القياس", "إضافة", "تعديل", "حذف"),
  "additions.view": g("الإضافات", "عرض"),
  "additions.manage": g("الإضافات", "إضافة", "تعديل", "حذف"),

  "sales.view": g("مبيعات", "عرض"),
  "sales.pos": g("مبيعات", "عرض فاتورة ضريبة مبسطة"),
  "sales.add": g("مبيعات", "إضافة", "إضافة فاتورة ضريبية"),
  "sales.payments": g("مبيعات", "تعديل"),
  "sales.notes": g("مبيعات", "تعديل"),
  "sales.zatca": g("مبيعات", "تأكيد"),
  "sales.returnsView": g("مرتجعات البيع", "عرض"),
  "sales.returnsAdd": g("مرتجعات البيع", "إضافة"),
  "sales.debitView": g("إشعارات المدين", "عرض"),
  "sales.debitAdd": g("إشعارات المدين", "إضافة"),

  "users.view": g("المستخدمين", "عرض"),
  "users.add": g("المستخدمين", "إضافة"),
  "users.edit": g("المستخدمين", "تعديل"),
  "users.delete": g("المستخدمين", "حذف"),
  "roles.view": g("الأدوار", "عرض"),
  "roles.manage": g("الأدوار", "إضافة", "تعديل", "حذف"),
  "posDevices.view": g("اجهزة اصدار الفواتير", "عرض"),
  "posDevices.add": g("اجهزة اصدار الفواتير", "إضافة"),
  "posDevices.edit": g("اجهزة اصدار الفواتير", "تعديل"),
  "posDevices.delete": g("اجهزة اصدار الفواتير", "حذف"),
  "certificates.view": g("الشهادات", "عرض"),
  "certificates.delete": g("اجهزة اصدار الفواتير", "حذف"),
  "employees.view": g("الموظفين", "عرض"),
  "employees.add": g("الموظفين", "إضافة"),
  "employees.edit": g("الموظفين", "تعديل"),
  "employees.delete": g("الموظفين", "حذف"),

  "quotes.view": g("عروض الأسعار", "عرض"),
  "quotes.add": g("عروض الأسعار", "إضافة"),
  "quotes.edit": g("عروض الأسعار", "تعديل"),
  "quotes.delete": g("عروض الأسعار", "حذف"),
  "purchases.view": g("أوامر الشراء", "عرض"),
  "purchases.add": g("أوامر الشراء", "إضافة"),
  "purchases.edit": g("أوامر الشراء", "تعديل"),
  "purchases.cancel": g("أوامر الشراء", "إلغاء"),
  "branches.view": g("الفروع", "عرض"),
  "branches.add": g("الفروع", "إضافة"),
  "branches.edit": g("الفروع", "تعديل"),
  "warehouses.view": g("المستودعات", "عرض", "عرض بالفرع"),
  "warehouses.add": g("المستودعات", "إضافة"),
  "warehouses.edit": g("المستودعات", "تعديل"),
  "warehouses.delete": g("المستودعات", "حذف"),
  "reservations.view": g("الحجوزات", "عرض"),
  "orderRequests.view": g("إدارة الطلبات", "عرض"),
  "shifts.view": g("الورديات", "عرض", "عرض كل الورديات"),
  "shifts.open": g("الورديات", "فتح"),
  "shifts.close": g("الورديات", "قفل", "غلق الورديات"),

  "customers.view": g("العملاء", "عرض"),
  "customers.add": g("العملاء", "إضافة"),
  "customers.edit": g("العملاء", "تعديل"),
  "customers.delete": g("العملاء", "تعطيل"),
  "suppliers.view": g("الموردين", "عرض"),
  "suppliers.add": g("الموردين", "إضافة"),
  "suppliers.edit": g("الموردين", "تعديل"),
  "suppliers.delete": g("الموردين", "حذف"),
  "vouchers.receipts": [...g("معاملات العملاء", "عرض", "إضافة")],
  "vouchers.payments": [...g("معاملات الموردين", "عرض", "إضافة")],
  "expenses.view": g("المصروفات", "عرض"),
  "expenses.add": g("المصروفات", "إضافة", "تسجيل في الوردية المفتوحة"),
  "expenses.edit": g("المصروفات", "تعديل"),
  "expenses.delete": g("المصروفات", "حذف"),
  "expenseItems.view": g("البنود", "عرض"),
  "expenseItems.manage": g("البنود", "إضافة", "تعديل", "حذف"),
  "treasuries.view": g("الخزائن", "عرض"),
  "treasuries.manage": g("الخزائن", "إضافة", "تعديل", "حذف"),
  "treasuries.move": g("الخزائن", "إيداع", "سحب"),
  "treasuries.statement": g("الخزائن", "عرض الكشف"),
  "treasuries.transfers": g("الخزائن", "عرض التحويلات", "تحويل", "إضافة تحويل"),

  "statistics.sales": g("الإحصائيات", "اجمالي المبيعات"),
  "statistics.purchases": g("الإحصائيات", "اجمالي المشتريات"),
  "statistics.expenses": g("الإحصائيات", "اجمالي المصروفات "),
  "statistics.profit": g("الإحصائيات", "اجمالي الربح "),

  "reports.items": g("التقارير", "الاصناف الاكثر مبيعا", "حركة صنف", "جرد الاصناف", "تنبيهات المخزون", "مبيعات صنف", "مشتريات صنف"),
  "reports.sales": g("التقارير", "مبيعات على مستوى الايام", "مبيعات على مستوى ارقام الفواتير", "مبيعات الاصناف", "مرتجع المبيعات", "صافي المبيعات", "مبيعات موظف"),
  "reports.purchases": g("التقارير", "مشتريات على مستوى الايام", "مشتريات على مستوى ارقام الفواتير", "مشتريات الاصناف"),
  "reports.customers": g("التقارير", "العملاء"),
  "reports.suppliers": g("التقارير", "الموردين"),
  "reports.expenses": g("التقارير", "المصروفات"),
  "reports.profits": g("التقارير", "الارباح"),

  "settings.company": g("الإعدادات", "تعديل الإعدادات العامة", "تعديل الضريبة", "تعديل رسوم التبغ"),
  "settings.sales": g("الإعدادات", "تعديل المبيعات", "تعديل الموقع"),
  "settings.printing": g("الإعدادات", "تعديل المبيعات"),
  "settings.operations": g("الإعدادات", "تعديل المبيعات"),
  "settings.items": g("الإعدادات", "تعديل الأصناف"),
  "settings.partners": g("الإعدادات", "تعديل الموقع"),
  "settings.barcode": g("الإعدادات", "تعديل الباركود"),
  "settings.integrations": g("الإعدادات", "تعديل واتساب", "تعديل البريد الإلكتروني"),
  "settings.zatca": g("الإعدادات", "تعديل الضريبة"),
}

// The backend sometimes leaves a stray space at the end of a permission string.
const norm = (s: string) => s.trim().replace(/\s+/g, " ")

/** The permissions of this app that a user's backend permission list grants. */
export function grantedPermissions(backend: string[], isSuperAdmin: boolean): Set<Permission> {
  const all = Object.keys(BACKEND_PERMISSIONS) as Permission[]
  if (isSuperAdmin) return new Set(all)
  const held = new Set(backend.map(norm))
  const groups = new Set([...held].filter((p) => p.endsWith(".الكل")).map((p) => p.slice(0, -".الكل".length)))
  const granted = (s: string) => held.has(norm(s)) || groups.has(norm(s).split(".")[0])
  return new Set(all.filter((p) => BACKEND_PERMISSIONS[p].some(granted)))
}
