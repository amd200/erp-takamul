import {
  ArrowLeftRight, Barcode, Building2, CalendarDays, ClipboardList, DollarSign, FileText, Folder, HandCoins, LayoutGrid, List, ListChecks, Package, PlusCircle,
  RefreshCcw, Settings, Shield, ShoppingCart, SlidersHorizontal, Truck, User, Wallet, WalletCards, Wrench, type LucideIcon,
} from "lucide-react"

/** The icon the current system puts beside each page's title, by address; the longest matching address wins. */
const ICONS: [string, LucideIcon][] = [
  ["/products/create", PlusCircle], ["/products/barcode", Barcode], ["/products/quantity-adjustments", SlidersHorizontal], ["/products/groups", Folder],
  ["/products/units", Wrench], ["/products/additions", Folder], ["/products", List],
  ["/sales/pos-invoices", RefreshCcw], ["/sales/invoices", FileText], ["/sales/returns", FileText], ["/sales/debit-notes", FileText], ["/sales", ShoppingCart],
  ["/quotes", List], ["/purchases", List], ["/roles", Shield], ["/users", List], ["/shifts", List], ["/customers", List], ["/suppliers", LayoutGrid],
  ["/vouchers/receipts", HandCoins], ["/vouchers/payments", Truck],
  ["/treasuries/statement", WalletCards], ["/treasuries/transfers", ArrowLeftRight], ["/treasuries", Wallet],
  ["/branches", Building2], ["/warehouses", List], ["/reservations", CalendarDays], ["/orders", ClipboardList],
  ["/expenses/items", ListChecks], ["/expenses", DollarSign], ["/reports/category/customers", User], ["/reports/category/suppliers", Truck], ["/reports/category/items", Package],
  ["/reports", ShoppingCart], ["/settings", Settings],
]

export function pageIcon(pathname: string): LucideIcon | undefined {
  return ICONS.filter(([p]) => pathname === p || pathname.startsWith(`${p}/`)).sort((a, b) => b[0].length - a[0].length)[0]?.[1]
}
