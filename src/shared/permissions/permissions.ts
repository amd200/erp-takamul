/** Permission keys, grouped like the current system's role editor. Labels live in i18n under "perms.<key>". */
export const P = {
  products: { view: "products.view", add: "products.add", edit: "products.edit", delete: "products.delete", import: "products.import", export: "products.export" },
  barcode: { print: "barcode.print" },
  stock: { view: "stock.view", adjust: "stock.adjust", delete: "stock.delete" },
  categories: { view: "categories.view", manage: "categories.manage" },
  units: { view: "units.view", manage: "units.manage" },
  additions: { view: "additions.view", manage: "additions.manage" },
  sales: {
    view: "sales.view", pos: "sales.pos", add: "sales.add", payments: "sales.payments", notes: "sales.notes", zatca: "sales.zatca",
    returnsView: "sales.returnsView", returnsAdd: "sales.returnsAdd", debitView: "sales.debitView", debitAdd: "sales.debitAdd",
  },
  users: { view: "users.view", add: "users.add", edit: "users.edit", delete: "users.delete" },
  roles: { view: "roles.view", manage: "roles.manage" },
  posDevices: { view: "posDevices.view", add: "posDevices.add", edit: "posDevices.edit", delete: "posDevices.delete" },
  certificates: { view: "certificates.view", delete: "certificates.delete" },
  employees: { view: "employees.view", add: "employees.add", edit: "employees.edit", delete: "employees.delete" },
  customers: { view: "customers.view", add: "customers.add", edit: "customers.edit", delete: "customers.delete" },
  suppliers: { view: "suppliers.view", add: "suppliers.add", edit: "suppliers.edit", delete: "suppliers.delete" },
  quotes: { view: "quotes.view", add: "quotes.add", edit: "quotes.edit", delete: "quotes.delete" },
  purchases: { view: "purchases.view", add: "purchases.add", edit: "purchases.edit", cancel: "purchases.cancel" },
  branches: { view: "branches.view", add: "branches.add", edit: "branches.edit", delete: "branches.delete" },
  warehouses: { view: "warehouses.view", add: "warehouses.add", edit: "warehouses.edit", delete: "warehouses.delete" },
  reservations: { view: "reservations.view" },
  orderRequests: { view: "orderRequests.view" },
  shifts: { view: "shifts.view", open: "shifts.open", close: "shifts.close" },
  vouchers: { receipts: "vouchers.receipts", payments: "vouchers.payments" },
  expenses: { view: "expenses.view", add: "expenses.add", edit: "expenses.edit", delete: "expenses.delete" },
  expenseItems: { view: "expenseItems.view", manage: "expenseItems.manage" },
  treasuries: { view: "treasuries.view", manage: "treasuries.manage", move: "treasuries.move", statement: "treasuries.statement", transfers: "treasuries.transfers" },
  statistics: { sales: "statistics.sales", purchases: "statistics.purchases", expenses: "statistics.expenses", profit: "statistics.profit" },
  reports: {
    items: "reports.items", sales: "reports.sales", purchases: "reports.purchases", customers: "reports.customers",
    suppliers: "reports.suppliers", expenses: "reports.expenses", profits: "reports.profits",
  },
  settings: {
    company: "settings.company", sales: "settings.sales", printing: "settings.printing", operations: "settings.operations",
    items: "settings.items", partners: "settings.partners", barcode: "settings.barcode", integrations: "settings.integrations", zatca: "settings.zatca",
  },
} as const

type Leaves<T> = T extends string ? T : { [K in keyof T]: Leaves<T[K]> }[keyof T]
export type Permission = Leaves<typeof P>
export type PermissionGroup = keyof typeof P

/** The role editor's layout: menu sections, each holding the permission groups of its pages. */
export const PERMISSION_SECTIONS: { section: string; groups: PermissionGroup[] }[] = [
  { section: "items", groups: ["products", "barcode", "stock", "categories", "units", "additions"] },
  { section: "sales", groups: ["sales"] },
  { section: "users", groups: ["users", "roles", "posDevices", "certificates", "employees"] },
  { section: "quotes", groups: ["quotes"] },
  { section: "purchases", groups: ["purchases"] },
  { section: "shifts", groups: ["shifts"] },
  { section: "customers", groups: ["customers"] },
  { section: "suppliers", groups: ["suppliers"] },
  { section: "bonds", groups: ["vouchers"] },
  { section: "treasuries", groups: ["treasuries"] },
  { section: "expenses", groups: ["expenses", "expenseItems"] },
  { section: "branches", groups: ["branches"] },
  { section: "warehouses", groups: ["warehouses"] },
  { section: "reservations", groups: ["reservations"] },
  { section: "orders", groups: ["orderRequests"] },
  { section: "statistics", groups: ["statistics"] },
  { section: "reports", groups: ["reports"] },
  { section: "settings", groups: ["settings"] },
]

export const ALL_PERMISSIONS = Object.values(P).flatMap((g) => Object.values(g)) as Permission[]
export const groupPermissions = (g: PermissionGroup) => Object.values(P[g]) as Permission[]
