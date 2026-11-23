import { Banknote, BarChart3, Building, CalendarDays, ClipboardList, CornerUpLeft, Coins, Landmark, LayoutDashboard, Package, RefreshCw, Settings, Share2, ShoppingCart, Store, Truck, User, Users, type LucideIcon } from "lucide-react";
import { P, type Permission } from "@/shared/permissions/permissions";
import type { Settings as AppSettings } from "@/modules/settings";

export type NavChild = { key: string; to: string; perm?: Permission; /** Shown only when the branch settings allow it. */ when?: (s: AppSettings) => boolean | undefined };
export type NavItem = { key: string; icon: LucideIcon; to?: string; perm?: Permission; children?: NavChild[] };

/**
 * The menu tree of the current system; labels are i18n keys under "nav.".
 * Built: items, sales, users, customers, suppliers, vouchers, treasuries, expenses, reports, settings; other sections point to /soon until they are designed.
 */
export const NAV: NavItem[] = [
  { key: "home", icon: LayoutDashboard, to: "/" },
  {
    key: "items",
    icon: Package,
    children: [
      { key: "itemsList", to: "/products", perm: P.products.view },
      { key: "addItem", to: "/products/create", perm: P.products.add },
      { key: "barcode", to: "/products/barcode", perm: P.barcode.print },
      { key: "adjustments", to: "/products/quantity-adjustments", perm: P.stock.view },
      { key: "categories", to: "/products/groups", perm: P.categories.view },
      { key: "units", to: "/products/units", perm: P.units.view },
      { key: "additions", to: "/products/additions", perm: P.additions.view },
    ],
  },
  {
    key: "sales",
    icon: ShoppingCart,
    children: [
      { key: "invoicesA4", to: "/sales/invoices", perm: P.sales.view },
      { key: "invoicesPos", to: "/sales/pos-invoices", perm: P.sales.pos },
      { key: "returns", to: "/sales/returns", perm: P.sales.returnsView },
      { key: "debitNotes", to: "/sales/debit-notes", perm: P.sales.debitView, when: (s) => s.operationsTab?.enableDebitNote },
    ],
  },
  {
    key: "quotes",
    icon: Share2,
    children: [
      { key: "quotesList", to: "/quotes", perm: P.quotes.view },
      { key: "addQuote", to: "/quotes/create", perm: P.quotes.add },
    ],
  },
  {
    key: "purchases",
    icon: CornerUpLeft,
    children: [
      { key: "purchasesList", to: "/purchases", perm: P.purchases.view },
      { key: "addPurchase", to: "/purchases/create", perm: P.purchases.add, when: (s) => s.purchasesScreenTab?.posPurcherstype !== "POS2" },
      { key: "addPurchaseScreen", to: "/pos3", perm: P.purchases.add, when: (s) => s.purchasesScreenTab?.posPurcherstype === "POS2" },
    ],
  },
  {
    key: "users",
    icon: Users,
    children: [
      { key: "usersList", to: "/users", perm: P.users.view },
      { key: "posDevices", to: "/pos-devices", perm: P.posDevices.view },
      { key: "certificates", to: "/certificates", perm: P.certificates.view, when: (s) => s.taxSetting?.taxSetting !== "Exempt" },
      { key: "roles", to: "/roles", perm: P.roles.view },
      { key: "employees", to: "/employees", perm: P.employees.view },
    ],
  },
  { key: "shifts", icon: RefreshCw, children: [{ key: "shiftsList", to: "/shifts", perm: P.shifts.view }] },
  { key: "customers", icon: User, children: [{ key: "customersList", to: "/customers", perm: P.customers.view }] },
  { key: "suppliers", icon: Truck, children: [{ key: "suppliersList", to: "/suppliers", perm: P.suppliers.view }] },
  {
    key: "bonds",
    icon: Coins,
    children: [
      { key: "receipt", to: "/vouchers/receipts", perm: P.vouchers.receipts },
      { key: "payment", to: "/vouchers/payments", perm: P.vouchers.payments },
    ],
  },
  {
    key: "treasuries",
    icon: Landmark,
    children: [
      { key: "treasuriesList", to: "/treasuries", perm: P.treasuries.view },
      { key: "treasuryStatement", to: "/treasuries/statement", perm: P.treasuries.statement },
      { key: "transfers", to: "/treasuries/transfers", perm: P.treasuries.transfers },
    ],
  },
  { key: "branches", icon: Building, children: [{ key: "branchesList", to: "/branches", perm: P.branches.view }] },
  { key: "warehouses", icon: Store, children: [{ key: "warehousesList", to: "/warehouses", perm: P.warehouses.view }] },
  { key: "reservations", icon: CalendarDays, to: "/reservations", perm: P.reservations.view },
  { key: "orders", icon: ClipboardList, to: "/orders", perm: P.orderRequests.view },
  {
    key: "expenses",
    icon: Banknote,
    children: [
      { key: "expensesList", to: "/expenses", perm: P.expenses.view },
      { key: "expenseItems", to: "/expenses/items", perm: P.expenseItems.view },
    ],
  },
  {
    key: "reports",
    icon: BarChart3,
    children: [
      { key: "repItems", to: "/reports/category/items", perm: P.reports.items },
      { key: "repSales", to: "/reports/category/sales", perm: P.reports.sales },
      { key: "repPurchases", to: "/reports/category/purchases", perm: P.reports.purchases },
      { key: "repCustomers", to: "/reports/category/customers", perm: P.reports.customers },
      { key: "repSuppliers", to: "/reports/category/suppliers", perm: P.reports.suppliers },
      { key: "repExpenses", to: "/reports/category/expenses", perm: P.reports.expenses },
      { key: "repProfits", to: "/reports/category/profits", perm: P.reports.profits },
    ],
  },
  {
    key: "settings",
    icon: Settings,
    children: [
      { key: "siteSettings", to: "/settings/system" },
      { key: "salesSettings", to: "/settings/sales" },
    ],
  },
];
