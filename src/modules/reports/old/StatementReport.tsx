import { useState } from "react"
import { Banknote, Users, Wallet } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useCustomers, useSuppliers } from "@/modules/lookups/service"
import { customerStatement, supplierStatement, type StatementRow } from "./api"
import { dayText, money } from "./output"
import { PagedReport } from "./PagedReport"
import { ALL, SelectFilter } from "./SelectFilter"

/** An account statement (customer or supplier): the party, the operation type and the dates, then the movements with a running balance. */
export function StatementReport({ party }: { party: "customer" | "supplier" }) {
  const { t } = useTranslation()
  const customer = party === "customer"
  const { data: customers = [] } = useCustomers()
  const { data: suppliers = [] } = useSuppliers()
  const options = customer ? customers.map((c) => ({ value: String(c.id), label: c.customerName })) : suppliers.map((s) => ({ value: String(s.id), label: s.supplierName }))
  const types = customer
    ? [{ value: "Sales", label: t("oldReports.type_sales") }, { value: "Collections", label: t("oldReports.type_collections") }, { value: "Returns", label: t("oldReports.type_returns") }]
    : [{ value: "Purchases", label: t("oldReports.type_purchases") }, { value: "Payments", label: t("oldReports.type_payments") }]
  const [id, setId] = useState("")
  const [type, setType] = useState(ALL)
  const [applied, setApplied] = useState({ id: "", type: ALL })
  const sar = t("oldReports.sar")
  const name = options.find((o) => o.value === applied.id)?.label ?? ""

  const extra = (
    <>
      <SelectFilter label={t(customer ? "oldReports.customer_name" : "oldReports.supplier_name")} value={id} onChange={setId} options={options} placeholder={t(customer ? "oldReports.select_customer" : "oldReports.select_supplier")} />
      <SelectFilter label={t("oldReports.operation_type")} value={type} onChange={setType} options={types} placeholder={t("oldReports.select_type")} all />
    </>
  )
  return (
    <PagedReport<StatementRow, Awaited<ReturnType<typeof customerStatement>>>
      id={customer ? "customer-statement" : "supplier-statement"} title={t(customer ? "oldReports.customer_account_statement" : "oldReports.supplier_account_statement")} icon={Users}
      extra={extra} dep={applied} enabled={!!applied.id}
      onSearch={() => setApplied({ id, type })} onClear={() => { setId(""); setType(ALL); setApplied({ id: "", type: ALL }) }}
      filterText={(a) => `${t(customer ? "oldReports.customer_name" : "oldReports.supplier_name")}: ${name} | ${t("oldReports.from")}: ${a.from} | ${t("oldReports.to")}: ${a.to}`}
      read={(a, page, size) => {
        const p = { from: a.from, to: a.to, Page: page, PageSize: size, type: applied.type === ALL ? undefined : applied.type }
        return customer ? customerStatement({ ...p, customerId: applied.id }) : supplierStatement({ ...p, supplierId: applied.id })
      }}
      rowsOf={(r) => r.items} totalOf={(r) => r.totalCount} rowKey={(r, i) => `${r.docNumber}-${i}`} exportAll
      cards={(r) => [
        { title: t("oldReports.total_debtor"), value: money(r?.totalDebit), suffix: sar, icon: Wallet, color: "orange" },
        { title: t(customer ? "oldReports.total_collections" : "oldReports.total_payments"), value: money(r?.totalCredit), suffix: sar, icon: Banknote, color: "teal" },
        { title: t("oldReports.total_debit"), value: money(r?.closingBalance), suffix: sar, icon: Wallet, color: "blue" },
      ]}
      columns={[
        { id: "date", header: t("oldReports.date"), cell: (r) => <span className="text-sm whitespace-nowrap">{dayText(r.date)}</span> },
        { id: "type", header: t("oldReports.type"), cell: (r) => <span className="text-sm font-medium">{r.transactionType}</span> },
        { id: "ref", header: t("oldReports.reference"), cell: (r) => <span className="text-sm font-medium">{r.docNumber}</span> },
        { id: "debit", header: t("oldReports.debtor"), cell: (r) => <span className="text-sm text-red-500">{r.debit > 0 ? money(r.debit) : "-"}</span> },
        { id: "credit", header: t("oldReports.creditor"), cell: (r) => <span className="text-sm text-green-600">{r.credit > 0 ? money(r.credit) : "-"}</span> },
        { id: "balance", header: t("oldReports.balance"), cell: (r) => <span className={`text-sm font-semibold ${r.balance >= 0 ? "text-blue-600" : "text-red-500"}`}>{money(r.balance)}</span> },
      ]}
      outColumns={[
        { header: t("oldReports.date"), value: (r) => dayText(r.date) },
        { header: t("oldReports.type"), value: (r) => r.transactionType },
        { header: t("oldReports.reference"), value: (r) => r.docNumber },
        { header: t("oldReports.debtor"), value: (r) => (r.debit > 0 ? money(r.debit) : "-") },
        { header: t("oldReports.creditor"), value: (r) => (r.credit > 0 ? money(r.credit) : "-") },
        { header: t("oldReports.balance"), value: (r) => money(r.balance) },
      ]} />
  )
}
