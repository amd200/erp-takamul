import { useState } from "react"
import { FileText, ShoppingCart, Truck, UserPlus, Users } from "lucide-react"
import { useTranslation } from "react-i18next"
import { DataTable, type Column } from "@/components/DataTable"
import { cn } from "@/lib/utils"
import { formatDay, formatMoney } from "@/lib/format"
import { P } from "@/shared/permissions/permissions"
import { useCan } from "@/shared/permissions/usePermission"
import type { SalesOrderDto } from "@/modules/sales/types"
import type { Quote } from "@/modules/quotes/types"
import type { Supplier } from "@/modules/suppliers/types"
import type { Customer } from "@/modules/customers/types"
import type { RecentPurchase } from "../types"
import { useRecentCustomers, useRecentPurchases, useRecentQuotes, useRecentSales, useRecentSuppliers } from "../queries"

type Tab = "sales" | "purchases" | "quotes" | "suppliers" | "customers"

const paidOf = (r: SalesOrderDto) => r.payments?.reduce((s, p) => s + p.amount, 0) ?? 0

/** Paid / partly paid / refunded / on credit, worked out from the payments as the current system does. */
function PaymentState({ row }: { row: SalesOrderDto }) {
  const { t } = useTranslation()
  const paid = Math.round(paidOf(row) * 100)
  const isPaid = paid >= Math.round((row.grandTotal ?? 0) * 100)
  const isPartial = paid > 0 && !isPaid
  const isRefunded = (row.paymentStatus as unknown) === 4 || row.paymentStatus === "Refunded"
  return (
    <span className={cn("inline-flex items-center rounded-md px-2 py-1 text-xs font-medium",
      isPaid ? "bg-[#00e6821a] text-[#09ad95]" : isPartial ? "bg-[#fef3c7] text-[#f59e0b]" : isRefunded ? "bg-[#fee2e2] text-[#ef4444]" : "bg-[#f50b0b1a] text-[#b40b09]")}>
      {t(isPaid ? "home.pay.paid" : isPartial ? "home.pay.partial" : isRefunded ? "home.pay.refunded" : "home.pay.unpaid")}
    </span>
  )
}

/** "Recent operations": the five latest sales, purchases, quotes, suppliers and customers, one tab each. */
export function RecentTransactions() {
  const { t, i18n } = useTranslation()
  const can = useCan()
  const day = (v?: string | null) => formatDay(v, i18n.language)

  const allowed: Record<Tab, boolean> = {
    sales: can([P.sales.view, P.sales.pos]),
    purchases: can(P.purchases.view),
    quotes: can(P.quotes.view),
    suppliers: can(P.suppliers.view),
    customers: can(P.customers.view),
  }
  const tabs: { id: Tab; icon: typeof ShoppingCart }[] = [
    { id: "sales", icon: ShoppingCart }, { id: "purchases", icon: Truck }, { id: "quotes", icon: FileText },
    { id: "suppliers", icon: Users }, { id: "customers", icon: UserPlus },
  ]
  const [active, setActive] = useState<Tab>(() => tabs.find((x) => allowed[x.id])?.id ?? "sales")

  // Both kinds of invoice when the user may see both, otherwise only the kind they may see.
  const both = can(P.sales.view) && can(P.sales.pos)
  const orderType = both ? undefined : can(P.sales.view) ? "A4" : can(P.sales.pos) ? "POS" : undefined
  const sales = useRecentSales(orderType, allowed.sales)
  const purchases = useRecentPurchases(allowed.purchases)
  const quotes = useRecentQuotes(allowed.quotes)
  const suppliers = useRecentSuppliers(allowed.suppliers)
  const customers = useRecentCustomers(allowed.customers)

  if (!Object.values(allowed).some(Boolean)) return null

  const salesCols: Column<SalesOrderDto>[] = [
    { id: "number", header: t("home.col.invoiceNumber"), cell: (r) => r.orderNumber },
    { id: "date", header: t("home.col.date"), cell: (r) => day(r.orderDate) },
    { id: "customer", header: t("home.col.customerName"), cell: (r) => r.customerName },
    { id: "userName", header: t("home.col.userName"), cell: (r) => r.createdBy },
    { id: "total", header: t("home.col.totalAmount"), cell: (r) => formatMoney(r.grandTotal ?? 0) },
    { id: "status", header: t("home.col.paymentStatus"), cell: (r) => <PaymentState row={r} /> },
    { id: "paid", header: t("home.col.paidAmount"), cell: (r) => formatMoney(paidOf(r)) },
  ]
  const purchaseCols: Column<RecentPurchase>[] = [
    { id: "number", header: t("home.col.invoiceNumber"), cell: (r) => r.purchaseOrderNumber },
    { id: "date", header: t("home.col.date"), cell: (r) => day(r.orderDate) },
    { id: "supplier", header: t("home.col.supplierName"), cell: (r) => r.supplierName },
    { id: "total", header: t("home.col.invoiceTotal"), cell: (r) => formatMoney(r.grandTotal ?? 0) },
  ]
  const quoteCols: Column<Quote>[] = [
    { id: "number", header: t("home.col.quoteNumber"), cell: (r) => r.quotationNumber },
    { id: "date", header: t("home.col.date"), cell: (r) => day(r.quotationDate) },
    { id: "customer", header: t("home.col.customerName"), cell: (r) => r.customerName },
    { id: "total", header: t("home.col.totalAmount"), cell: (r) => formatMoney(r.grandTotal ?? 0) },
  ]
  const supplierCols: Column<Supplier>[] = [
    { id: "name", header: t("home.col.name"), width: "60%", cell: (r) => r.supplierName },
    { id: "phone", header: t("home.col.phone"), width: "40%", cell: (r) => r.phone },
  ]
  const customerCols: Column<Customer>[] = [
    { id: "name", header: t("home.col.name"), width: "60%", cell: (r) => r.customerName },
    { id: "phone", header: t("home.col.phone"), width: "40%", cell: (r) => r.phone },
  ]
  const table = { empty: null, emptyText: t("home.noData"), pager: false } as const

  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm fill-mode-backwards animate-in fade-in slide-in-from-bottom-5" style={{ animationDelay: "0.5s" }}>
      <div className="border-b bg-(--bg-main)/50 p-3">
        <h2 className="mb-3 text-base font-bold text-(--text-main)">{t("home.recent")}</h2>
        <div className="flex gap-2 overflow-x-auto [scrollbar-width:none]">
          {tabs.filter((x) => allowed[x.id]).map(({ id, icon: Icon }) => (
            <button key={id} type="button" onClick={() => setActive(id)}
              className={cn("flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors",
                active === id ? "bg-primary text-primary-foreground shadow-sm" : "border bg-card text-(--text-main) hover:bg-(--bg-main)")}>
              <Icon size={16} />
              {t(`home.tabs.${id}`)}
            </button>
          ))}
        </div>
      </div>

      <div className="p-2">
        {active === "sales" && allowed.sales && <DataTable {...table} rows={sales.data ?? []} loading={sales.isLoading} columns={salesCols} rowKey={(r) => r.id} />}
        {active === "purchases" && allowed.purchases && <DataTable {...table} rows={purchases.data ?? []} loading={purchases.isLoading} columns={purchaseCols} rowKey={(r) => r.id} />}
        {active === "quotes" && allowed.quotes && <DataTable {...table} rows={quotes.data ?? []} loading={quotes.isLoading} columns={quoteCols} rowKey={(r) => r.id} />}
        {active === "suppliers" && allowed.suppliers && <DataTable {...table} rows={suppliers.data ?? []} loading={suppliers.isLoading} columns={supplierCols} rowKey={(r) => r.id} />}
        {active === "customers" && allowed.customers && <DataTable {...table} rows={customers.data ?? []} loading={customers.isLoading} columns={customerCols} rowKey={(r) => r.id} />}
      </div>
    </div>
  )
}
