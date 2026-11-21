import { useState } from "react"
import { Receipt, Users } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useCustomers, useSuppliers } from "@/modules/lookups/service"
import { currentBranchId } from "@/shared/auth/currentBranchId"
import { customerSalesDetails, supplierPurchaseDetails, type PartyInvoice } from "./api"
import { dayText } from "./output"
import { PagedReport } from "./PagedReport"
import { SelectFilter } from "./SelectFilter"

type Line = { key: string; date: string; invoiceNumber: string; productName: string; quantity: number }

/** The items one customer bought (or one supplier sold) between two dates, one line per item; the server pages by invoice. */
export function PartyItemsReport({ party }: { party: "customer" | "supplier" }) {
  const { t } = useTranslation()
  const customer = party === "customer"
  const { data: customers = [] } = useCustomers()
  const { data: suppliers = [] } = useSuppliers()
  const options = customer ? customers.map((c) => ({ value: String(c.id), label: c.customerName })) : suppliers.map((s) => ({ value: String(s.id), label: s.supplierName }))
  const [id, setId] = useState("")
  const [applied, setApplied] = useState("")
  const name = options.find((o) => o.value === applied)?.label ?? ""
  const lines = (r: { items: PartyInvoice[] }): Line[] =>
    r.items.flatMap((inv) => (inv.items.length ? inv.items : [{ productName: "", quantity: 0 }]).map((l, i) => ({ key: `${inv.invoiceId}-${i}`, date: inv.date, invoiceNumber: inv.invoiceNumber, productName: l.productName, quantity: l.quantity })))

  const extra = <SelectFilter label={t(customer ? "oldReports.customer_name" : "oldReports.supplier_name")} value={id} onChange={setId} options={options} placeholder={t(customer ? "oldReports.select_customer" : "oldReports.select_supplier")} />
  return (
    <PagedReport<Line, Awaited<ReturnType<typeof customerSalesDetails>>>
      id={customer ? "customer-item-sales" : "supplier-item-purchases"} title={t(customer ? "oldReports.customer_item_sales_report" : "oldReports.supplier_item_purchases_report")} icon={Users}
      extra={extra} dep={applied} enabled={!!applied}
      onSearch={() => setApplied(id)} onClear={() => { setId(""); setApplied("") }}
      filterText={(a) => `${t(customer ? "oldReports.customer_name" : "oldReports.supplier_name")}: ${name} | ${t("oldReports.from")}: ${a.from} | ${t("oldReports.to")}: ${a.to}`}
      read={(a, page, size) => customer
        ? customerSalesDetails({ branchid: currentBranchId(), customerId: applied, from: a.from, to: a.to, Page: page, PageSize: size })
        : supplierPurchaseDetails({ branchid: currentBranchId(), supplierId: applied, from: a.from, to: a.to, Page: page, PageSize: size })}
      rowsOf={lines} totalOf={(r) => r.totalCount} rowKey={(r) => r.key}
      cards={(r) => [{ title: t("oldReports.total_invoices"), value: (r?.totalCount ?? 0).toLocaleString("en-US"), icon: Receipt, color: "blue" }]}
      columns={[
        { id: "date", header: t("oldReports.date"), cell: (r) => <span className="text-sm whitespace-nowrap">{dayText(r.date)}</span> },
        { id: "number", header: t("oldReports.invoice_number"), cell: (r) => <span className="text-sm font-medium">{r.invoiceNumber}</span> },
        { id: "item", header: t("oldReports.item_name"), cell: (r) => <span className="text-sm font-medium">{r.productName || "-"}</span> },
        { id: "qty", header: t("oldReports.quantity"), cell: (r) => <span className="text-sm tabular-nums">{r.quantity}</span> },
      ]}
      outColumns={[
        { header: t("oldReports.date"), value: (r) => dayText(r.date) },
        { header: t("oldReports.invoice_number"), value: (r) => r.invoiceNumber },
        { header: t("oldReports.item_name"), value: (r) => r.productName || "-" },
        { header: t("oldReports.quantity"), value: (r) => r.quantity },
      ]} />
  )
}
