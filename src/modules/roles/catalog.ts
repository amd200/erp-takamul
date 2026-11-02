/**
 * Every permission a role can hold, laid out as the current system's role editor shows them: sections, each holding
 * its pages, each page its actions, and some actions split by item type. `value` is the exact string the server stores
 * (Arabic, "<group>.<action>"); `label` is a key under "rolePerms" in the translations. This file is the only place
 * those strings are written down; the tree, the role list and the form only read it.
 */
export type PermissionLeaf = { id: string; label: string; value: string }
/** An action is one checkbox (`value`), or a folder of checkboxes (`subs`) such as direct / raw / prepared items. */
export type PermissionAction = { id: string; label: string; value: string } | { id: string; label: string; subs: PermissionLeaf[] }
export type PermissionPage = { id: string; label: string; actions: PermissionAction[] }
/** A section; `actions` are the ones that sit straight under it with no page of their own. */
export type PermissionSection = { id: string; label: string; pages: PermissionPage[]; actions?: PermissionAction[] }

export const PERMISSION_CATALOG: PermissionSection[] = [
  {
    id: "dashbord", label: "dashboard",
    pages: [
      { id: "statistics", label: "statistics", actions: [
        { id: "view_sales", label: "total_sales", value: "الإحصائيات.اجمالي المبيعات" },
        { id: "view_expenses", label: "total_expenses", value: "الإحصائيات.اجمالي المصروفات " },
        { id: "view_purchases", label: "total_purchases", value: "الإحصائيات.اجمالي المشتريات" },
        { id: "view_profit", label: "total_profit", value: "الإحصائيات.اجمالي الربح " },
      ] },
    ],
  },
  {
    id: "products", label: "products",
    pages: [
      { id: "products_list", label: "products_list", actions: [
        { id: "view", label: "view", subs: [
          { id: "view_direct", label: "direct", value: "المنتجات.عرض الاصناف المباشرة" },
          { id: "view_raw", label: "raw", value: "المنتجات.عرض الخامات" },
          { id: "view_variant", label: "variant", value: "المنتجات.عرض الاصناف المتفرعه" },
          { id: "view_ready", label: "prepared", value: "المنتجات.عرض الاصناف المجهزة" },
        ] },
        { id: "edit", label: "edit", subs: [
          { id: "edit_direct", label: "direct", value: "المنتجات.تعديل مباشر" },
          { id: "edit_raw", label: "raw_materials", value: "المنتجات.تعديل مواد خام" },
          { id: "edit_variant", label: "variant", value: "المنتجات.تعديل متفرعة" },
          { id: "edit_ready", label: "prepared", value: "المنتجات.تعديل جاهزة" },
        ] },
        { id: "delete", label: "delete", subs: [
          { id: "delete_direct", label: "direct", value: "المنتجات.حذف" },
          { id: "delete_raw", label: "raw", value: "المنتجات.حذف" },
          { id: "delete_variant", label: "variant", value: "المنتجات.حذف" },
          { id: "delete_ready", label: "prepared", value: "المنتجات.حذف" },
        ] },
      ] },
      { id: "products_add", label: "add_product", actions: [
        { id: "add", label: "add", subs: [
          { id: "add_direct", label: "direct", value: "المنتجات.إضافة مباشرة" },
          { id: "add_raw", label: "raw", value: "المنتجات.إضافة مواد خام" },
          { id: "add_variant", label: "variant", value: "المنتجات.إضافة متفرعة" },
          { id: "add_ready", label: "prepared", value: "المنتجات.إضافة جاهزة" },
        ] },
      ] },
      { id: "print_barcode", label: "print_barcode", actions: [
        { id: "view", label: "view", value: "المنتجات.طباعه باركود " },
      ] },
      { id: "stock_adjustments", label: "quantity_adjustments", actions: [
        { id: "view", label: "view", value: "المخزون.عرض" },
        { id: "add", label: "add", value: "المخزون.تعديل جماعي" },
        { id: "edit", label: "edit", value: "المخزون.تعديل تسوية" },
        { id: "delete", label: "delete", value: "المخزون.حذف تسوية" },
      ] },
      { id: "product_categories", label: "product_categories", actions: [
        { id: "view", label: "view", value: "تصنيفات المنتجات.عرض" },
        { id: "add", label: "add", value: "تصنيفات المنتجات.إضافة" },
        { id: "edit", label: "edit", value: "تصنيفات المنتجات.تعديل" },
        { id: "delete", label: "delete", value: "تصنيفات المنتجات.حذف" },
      ] },
      { id: "units", label: "units", actions: [
        { id: "view", label: "view", value: "وحدات القياس.عرض" },
        { id: "add", label: "add", value: "وحدات القياس.إضافة" },
        { id: "edit", label: "edit", value: "وحدات القياس.تعديل" },
        { id: "delete", label: "delete", value: "وحدات القياس.حذف" },
      ] },
      { id: "additions", label: "additions", actions: [
        { id: "view", label: "view", value: "الإضافات.عرض" },
        { id: "add", label: "add", value: "الإضافات.إضافة" },
        { id: "edit", label: "edit", value: "الإضافات.تعديل" },
        { id: "delete", label: "delete", value: "الإضافات.حذف" },
      ] },
    ],
  },
  {
    id: "sales", label: "sales",
    pages: [
      { id: "invoices_a4", label: "invoices_a4", actions: [
        { id: "view", label: "view", value: "مبيعات.عرض" },
        { id: "add", label: "add", value: "مبيعات.إضافة فاتورة ضريبية" },
      ] },
      { id: "invoices_pos", label: "invoices_pos", actions: [
        { id: "view", label: "view", value: "مبيعات.عرض فاتورة ضريبة مبسطة" },
        { id: "add", label: "add", value: "مبيعات.ضريبية مبسطة" },
      ] },
      { id: "gift_cards", label: "gift_cards", actions: [
        { id: "view", label: "view", value: "بطاقات الهدايا.عرض" },
        { id: "add", label: "add", value: "بطاقات الهدايا.إضافة" },
        { id: "edit", label: "edit", value: "بطاقات الهدايا.تعديل" },
        { id: "delete", label: "delete", value: "بطاقات الهدايا.حذف" },
      ] },
      { id: "sales_returns", label: "returns", actions: [
        { id: "view", label: "view", value: "مرتجعات البيع.عرض" },
        { id: "add", label: "add", value: "مرتجعات البيع.إضافة" },
      ] },
      { id: "debit_notes", label: "debit_notes", actions: [
        { id: "view", label: "view", value: "إشعارات المدين.عرض" },
        { id: "add", label: "add", value: "إشعارات المدين.إضافة" },
        { id: "edit", label: "edit", value: "إشعارات المدين.تعديل" },
        { id: "delete", label: "delete", value: "إشعارات المدين.حذف" },
      ] },
    ],
  },
  {
    id: "quotations", label: "quotes",
    pages: [
      { id: "quotations_list", label: "quotes_list", actions: [
        { id: "view", label: "view", value: "عروض الأسعار.عرض" },
        { id: "edit", label: "edit", value: "عروض الأسعار.تعديل" },
        { id: "delete", label: "delete", value: "عروض الأسعار.حذف" },
      ] },
      { id: "quotations_add", label: "add_quote", actions: [
        { id: "add", label: "add", value: "عروض الأسعار.إضافة" },
      ] },
    ],
  },
  {
    id: "purchases", label: "purchases",
    pages: [
      { id: "purchases_list", label: "purchases_list", actions: [
        { id: "view", label: "view", value: "أوامر الشراء.عرض" },
        { id: "edit", label: "edit", value: "أوامر الشراء.تعديل" },
        { id: "delete", label: "delete", value: "أوامر الشراء.إلغاء" },
      ] },
      { id: "purchases_add", label: "add_purchase", actions: [
        { id: "add", label: "add", value: "أوامر الشراء.إضافة" },
      ] },
    ],
  },
  {
    id: "users", label: "users",
    pages: [
      { id: "users_list", label: "users_list", actions: [
        { id: "view", label: "view", value: "المستخدمين.عرض" },
        { id: "add", label: "add", value: "المستخدمين.إضافة" },
        { id: "edit", label: "edit", value: "المستخدمين.تعديل" },
        { id: "delete", label: "delete", value: "المستخدمين.حذف" },
      ] },
      { id: "pos_devices_list", label: "pos_devices", actions: [
        { id: "view", label: "view", value: "اجهزة اصدار الفواتير.عرض" },
        { id: "add", label: "add", value: "اجهزة اصدار الفواتير.إضافة" },
        { id: "edit", label: "edit", value: "اجهزة اصدار الفواتير.تعديل" },
        { id: "delete", label: "delete", value: "اجهزة اصدار الفواتير.حذف" },
      ] },
      { id: "certificates", label: "certificates", actions: [
        { id: "view", label: "view", value: "الشهادات.عرض" },
      ] },
      { id: "roles", label: "permissions", actions: [
        { id: "view", label: "view_permissions", value: "الأدوار.عرض" },
        { id: "add", label: "add_permissions", value: "الأدوار.إضافة" },
        { id: "edit", label: "edit_permissions", value: "الأدوار.تعديل" },
        { id: "delete", label: "delete_permissions", value: "الأدوار.حذف" },
      ] },
      { id: "employees", label: "employees", actions: [
        { id: "view", label: "view", value: "الموظفين.عرض" },
        { id: "add", label: "add", value: "الموظفين.إضافة" },
        { id: "edit", label: "edit", value: "الموظفين.تعديل" },
        { id: "delete", label: "delete", value: "الموظفين.حذف" },
      ] },
    ],
  },
  {
    id: "shifts", label: "shifts",
    pages: [
      { id: "shifts_list", label: "shifts_list", actions: [
        { id: "view", label: "view", value: "الورديات.عرض" },
        { id: "view_all", label: "view_all_shifts", value: "الورديات.عرض كل الورديات" },
        { id: "add", label: "open", value: "الورديات.فتح" },
        { id: "edit", label: "close", value: "الورديات.قفل" },
        { id: "close_others", label: "close_other_users_shifts", value: "الورديات.غلق الورديات" },
      ] },
    ],
  },
  {
    id: "customers", label: "customers",
    pages: [
      { id: "customers_list", label: "customers_list", actions: [
        { id: "view", label: "view", value: "العملاء.عرض" },
        { id: "add", label: "add", value: "العملاء.إضافة" },
        { id: "edit", label: "edit", value: "العملاء.تعديل" },
        { id: "delete", label: "delete", value: "العملاء.تعطيل" },
      ] },
      { id: "collections", label: "receipt_vouchers", actions: [
        { id: "view", label: "view", value: "معاملات العملاء.عرض" },
        { id: "add", label: "add", value: "معاملات العملاء.إضافة" },
        { id: "edit", label: "edit", value: "معاملات العملاء.تعديل" },
        { id: "delete", label: "delete", value: "معاملات العملاء.حذف" },
      ] },
    ],
  },
  {
    id: "suppliers", label: "suppliers",
    pages: [
      { id: "suppliers_list", label: "suppliers_list", actions: [
        { id: "view", label: "view", value: "الموردين.عرض" },
        { id: "add", label: "add", value: "الموردين.إضافة" },
        { id: "edit", label: "edit", value: "الموردين.تعديل" },
        { id: "delete", label: "delete", value: "الموردين.حذف" },
      ] },
      { id: "supplier_transactions", label: "payment_vouchers", actions: [
        { id: "view", label: "view", value: "معاملات الموردين.عرض" },
        { id: "add", label: "add", value: "معاملات الموردين.إضافة" },
        { id: "edit", label: "edit", value: "معاملات الموردين.تعديل" },
        { id: "delete", label: "delete", value: "معاملات الموردين.حذف" },
      ] },
    ],
  },
  {
    id: "treasury", label: "treasuries",
    pages: [
      { id: "treasury_list", label: "treasuries_list", actions: [
        { id: "view", label: "view", value: "الخزائن.عرض" },
        { id: "add", label: "add", value: "الخزائن.إضافة" },
        { id: "edit", label: "edit", value: "الخزائن.تعديل" },
        { id: "delete", label: "delete", value: "الخزائن.حذف" },
      ] },
      { id: "treasury_statement", label: "treasury_statement", actions: [
        { id: "view", label: "view", value: "الخزائن.عرض الكشف" },
      ] },
      { id: "internal_transfers", label: "internal_transfers", actions: [
        { id: "view", label: "view", value: "الخزائن.عرض التحويلات" },
        { id: "add", label: "add", value: "الخزائن.إضافة تحويل" },
        { id: "edit", label: "edit", value: "الخزائن.تعديل تحويل" },
        { id: "delete", label: "delete", value: "الخزائن.حذف تحويل" },
      ] },
    ],
  },
  {
    id: "branches", label: "branches",
    pages: [
      { id: "branches_list", label: "branches_list", actions: [
        { id: "view", label: "view", value: "الفروع.عرض" },
        { id: "add", label: "add", value: "الفروع.إضافة" },
        { id: "edit", label: "edit", value: "الفروع.تعديل" },
      ] },
    ],
  },
  {
    id: "reservations", label: "reservations",
    pages: [],
    actions: [
      { id: "view", label: "view", value: "الحجوزات.عرض" },
    ],
  },
  {
    id: "order_requests", label: "order_management",
    pages: [],
    actions: [
      { id: "view", label: "view", value: "إدارة الطلبات.عرض" },
    ],
  },
  {
    id: "warehouses", label: "warehouses",
    pages: [],
    actions: [
      { id: "view", label: "view", value: "المستودعات.عرض" },
      { id: "add", label: "add", value: "المستودعات.إضافة" },
      { id: "edit", label: "edit", value: "المستودعات.تعديل" },
      { id: "delete", label: "delete", value: "المستودعات.حذف" },
    ],
  },
  {
    id: "expenses", label: "expenses",
    pages: [],
    actions: [
      { id: "view", label: "view", value: "المصروفات.عرض" },
      { id: "add", label: "add", value: "المصروفات.إضافة" },
      { id: "edit", label: "edit", value: "المصروفات.تعديل" },
      { id: "delete", label: "delete", value: "المصروفات.حذف" },
    ],
  },
  {
    id: "items", label: "items",
    pages: [],
    actions: [
      { id: "view", label: "view", value: "البنود.عرض" },
      { id: "add", label: "add", value: "البنود.إضافة" },
      { id: "edit", label: "edit", value: "البنود.تعديل" },
      { id: "delete", label: "delete", value: "البنود.حذف" },
    ],
  },
  {
    id: "reports", label: "reports",
    pages: [
      { id: "items_reports", label: "item_reports", actions: [
        { id: "inventory", label: "inventory_report", value: "التقارير.جرد الاصناف" },
        { id: "stockAlerts", label: "stock_alerts_report", value: "التقارير.تنبيهات المخزون" },
        { id: "movement", label: "item_movement_report", value: "التقارير.حركة صنف" },
        { id: "topSelling", label: "top_selling_report", value: "التقارير.الاصناف الاكثر مبيعا" },
      ] },
      { id: "sales_reports", label: "sales_reports", actions: [
        { id: "productsSales", label: "products_sales_report", value: "التقارير.مبيعات الاصناف" },
        { id: "daily", label: "sales_by_days", value: "التقارير.مبيعات على مستوى الايام" },
        { id: "invoices", label: "sales_by_invoices", value: "التقارير.مبيعات على مستوى ارقام الفواتير" },
        { id: "returns", label: "sales_returns_report", value: "التقارير.مرتجع المبيعات" },
        { id: "employee", label: "sales_by_employee_report", value: "التقارير.مبيعات موظف" },
        { id: "sales", label: "sales_by_item_report", value: "التقارير.مبيعات صنف" },
      ] },
      { id: "purchase_reports", label: "purchase_reports", actions: [
        { id: "daily", label: "purchases_by_days", value: "التقارير.مشتريات على مستوى الايام" },
        { id: "invoices", label: "purchases_by_invoices", value: "التقارير.مشتريات على مستوى ارقام الفواتير" },
        { id: "purchases", label: "purchases_by_item_report", value: "التقارير.مشتريات صنف" },
        { id: "products_purchases", label: "products_purchases_report", value: "التقارير.مشتريات الاصناف" },
      ] },
      { id: "customer_reports", label: "customer_reports", actions: [
        { id: "list", label: "customer_statement_report", value: "التقارير.العملاء" },
      ] },
      { id: "supplier_reports", label: "supplier_reports", actions: [
        { id: "list", label: "supplier_statement_report", value: "التقارير.الموردين" },
      ] },
      { id: "expenses_reports", label: "expense_reports", actions: [
        { id: "list", label: "expense_report", value: "التقارير.المصروفات" },
      ] },
      { id: "profits_reports", label: "profit_reports", actions: [
        { id: "list", label: "profit_report", value: "التقارير. الارباح" },
      ] },
    ],
  },
  {
    id: "settings", label: "settings",
    pages: [
      { id: "general_settings", label: "system_settings", actions: [
        { id: "update_general", label: "update_general_settings", value: "الإعدادات.تعديل الإعدادات العامة" },
        { id: "update_tobacco", label: "update_tobacco_tax", value: "الإعدادات.تعديل رسوم التبغ" },
        { id: "update_tax", label: "update_tax_settings", value: "الإعدادات.تعديل الضريبة" },
        { id: "update_location", label: "update_location_settings", value: "الإعدادات.تعديل الموقع" },
        { id: "update_sales", label: "update_sales_settings", value: "الإعدادات.تعديل المبيعات" },
        { id: "update_whatsapp", label: "update_whatsapp_settings", value: "الإعدادات.تعديل واتساب" },
        { id: "update_email", label: "update_email_settings", value: "الإعدادات.تعديل البريد الإلكتروني" },
      ] },
      { id: "sales_settings", label: "sales_settings", actions: [
        { id: "sales_general", label: "sales_settings_tab_general", subs: [
          { id: "returned_items", label: "show_returned_items_details", value: "الإعدادات.المبيعات.إظهار تفاصيل المرتجعات" },
          { id: "show_order_device", label: "show_order_device_number", value: "الإعدادات.المبيعات.إظهار رقم جهاز الطلب" },
          { id: "debit_note", label: "enable_debit_note", value: "الإعدادات.المبيعات.تمكين الإشعار المدين" },
        ] },
        { id: "sales_salons", label: "sales_settings_tab_salons", subs: [
          { id: "beauty_theme", label: "beauty_theme", value: "الإعدادات.المبيعات.ثيم صالون التجميل" },
          { id: "service_employee_sales", label: "show_service_employee_sales", value: "الإعدادات.المبيعات.إظهار مبيعات موظف الخدمة" },
          { id: "service_employee", label: "show_employee_service", value: "الإعدادات.المبيعات.إظهار موظف الخدمة" },
          { id: "default_service_employee", label: "default_service_employee", value: "الإعدادات.المبيعات.موظف الخدمة الافتراضي" },
        ] },
        { id: "sales_shifts", label: "shifts", subs: [
          { id: "returns_in_shift_print", label: "show_returns_in_shift_print", value: "الإعدادات.المبيعات.إظهار المرتجعات في تقرير الوردية" },
        ] },
        { id: "sales_sale", label: "sales_settings_tab_sale", subs: [
          { id: "invoice_type", label: "salesScreenInvoiceType", value: "الإعدادات.المبيعات.نوع فاتورة شاشة البيع" },
          { id: "order_type", label: "show_ordertype", value: "الإعدادات.المبيعات.إظهار نوع الطلب" },
          { id: "order_type_on_save", label: "select_order_type_during_save", value: "الإعدادات.المبيعات.اختيار نوع الطلب عند الحفظ" },
          { id: "table_on_save", label: "select_table_number_during_save", value: "الإعدادات.المبيعات.اختيار رقم الطاولة عند الحفظ" },
          { id: "takeaway", label: "takeaway_option", value: "الإعدادات.المبيعات.سفري" },
          { id: "tables", label: "dine_in_option", value: "الإعدادات.المبيعات.محلي" },
          { id: "delivery", label: "delivery_option", value: "الإعدادات.المبيعات.توصيل" },
          { id: "item_quantity_tab", label: "show_item_quantity_tab", value: "الإعدادات.المبيعات.إظهار تبويب الكمية" },
          { id: "item_price_tab", label: "show_item_price_tab", value: "الإعدادات.المبيعات.إظهار تبويب السعر" },
          { id: "item_additions_tab", label: "show_item_additions_tab", value: "الإعدادات.المبيعات.إظهار تبويب الإضافات" },
        ] },
        { id: "sales_invoice", label: "sales_settings_invoice_group", subs: [
          { id: "sales_order_start_number", label: "show_order_number", value: "الإعدادات.المبيعات.إظهار رقم الطلب" },
          { id: "prep_customer", label: "show_customer_name_in_preparation_ticket", value: "الإعدادات.المبيعات.إظهار اسم العميل في بون التجهيز" },
          { id: "prep_invoice", label: "show_invoice_number_in_preparation_ticket", value: "الإعدادات.المبيعات.إظهار رقم الفاتورة في بون التجهيز" },
          { id: "branch_name", label: "show_branch_name_in_print", value: "الإعدادات.المبيعات.إظهار اسم الفرع في الطباعة" },
          { id: "branch_short_name", label: "show_branch_short_name_in_invoice", value: "الإعدادات.المبيعات.إظهار الاسم المختصر للفرع" },
        ] },
        { id: "sales_payment", label: "sales_settings_tab_payment", subs: [
          { id: "payment_methods", label: "show_payment_methods", value: "الإعدادات.المبيعات.إظهار طرق الدفع" },
          { id: "paid_remaining", label: "show_paid_and_remaining_amount", value: "الإعدادات.المبيعات.إظهار المدفوع والمتبقي" },
          { id: "payment_screen_type", label: "payment_screen_type", value: "الإعدادات.المبيعات.نوع شاشة الدفع" },
          { id: "default_purchases_vault", label: "default_purchase_payment_method", value: "الإعدادات.المبيعات.خزينة المشتريات الافتراضية" },
          { id: "default_sales_vault", label: "default_sales_payment_method", value: "الإعدادات.المبيعات.خزينة المبيعات الافتراضية" },
        ] },
        { id: "sales_roll_printing", label: "sales_settings_tab_roll_printing", subs: [
          { id: "print_count", label: "sales_print_count", value: "الإعدادات.المبيعات.عدد نسخ الطباعة" },
        ] },
        { id: "sales_customers", label: "customer_settings", subs: [
          { id: "default_customer", label: "default_customer", value: "الإعدادات.المبيعات.العميل الافتراضي" },
        ] },
        { id: "sales_preparation", label: "sales_settings_tab_preparation", subs: [
          { id: "preparation_screen", label: "enable_preparation_screen", value: "الإعدادات.المبيعات.شاشة التحضير" },
          { id: "preparation_notification_sound", label: "enable_preparation_notification_sound", value: "الإعدادات.المبيعات.صوت إشعار شاشة التحضير" },
          { id: "customer_orders", label: "show_customares_salses_order", value: "الإعدادات.المبيعات.شاشة طلبات العملاء" },
        ] },
        { id: "sales_appearance", label: "sales_settings_tab_appearance", subs: [
          { id: "item_name_size", label: "item_name_size", value: "الإعدادات.المبيعات.حجم خط اسم الصنف" },
          { id: "item_price_size", label: "item_price_size", value: "الإعدادات.المبيعات.حجم خط سعر الصنف" },
          { id: "category_size", label: "حجم خط التصنيفات", value: "الإعدادات.المبيعات.حجم خط التصنيفات" },
          { id: "sub_item_name_size", label: "sub_item_name_size", value: "الإعدادات.المبيعات.حجم خط اسم الصنف المتفرع" },
          { id: "sub_item_price_size", label: "حجم خط اسم الصنف المتفرع", value: "الإعدادات.المبيعات.حجم خط سعر الصنف المتفرع" },
        ] },
        { id: "sales_category_discounts", label: "category_discounts", value: "الإعدادات.المبيعات.خصومات التصنيفات" },
        { id: "sales_items", label: "items_settings", subs: [
          { id: "update_items", label: "update_items_settings", value: "الإعدادات.تعديل الأصناف" },
          { id: "show_item_in_one_line", label: "show_item_in_one_line", value: "الإعدادات.المبيعات.إضافة الصنف كسطر جديد" },
          { id: "allow_sale_zero_stock", label: "sell_if_zero", value: "الإعدادات.المبيعات.البيع بدون رصيد" },
          { id: "cost_price", label: "show_coast_price", value: "الإعدادات.المبيعات.إظهار سعر التكلفة" },
        ] },
        { id: "sales_barcode", label: "barcode_scale", value: "الإعدادات.تعديل الباركود" },
      ] },
    ],
  },
]
