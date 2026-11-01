import { Receipt, RotateCcw } from "lucide-react"
import { useTranslation } from "react-i18next"
import { currentBranchId } from "@/modules/partners/mappers"
import { salesReturns, type SalesReturnRow } from "../api"
import { dayText, money } from "../output"
import { PagedReport, slice } from "../PagedReport"

/** The sales returns between two dates, laid out as in the current system. The server sends them in one list; they are paged here. */
export default function SalesReturnsReport() {
  const { t } = useTranslation()
  return (
    <PagedReport<SalesReturnRow, { rows: SalesReturnRow[]; all: Awaited<ReturnType<typeof salesReturns>> }>
      id="sales-returns" title={t("oldReports.sales_returns_report")} icon={RotateCcw}
      filterText={(a) => `${t("oldReports.from")}: ${a.from} | ${t("oldReports.to")}: ${a.to}`}
      read={async (a, page, size) => {
        const all = await salesReturns({ BranchId: currentBranchId(), From: a.from, To: a.to })
        return { rows: slice(all.items, page, size), all }
      }}
      rowsOf={(r) => r.rows} totalOf={(r) => r.all.totalCount} rowKey={(r) => r.returnInvoiceNumber}
      cards={(r) => [
        { title: t("oldReports.total_returns"), value: money(r?.all.totalReturnAmount), suffix: t("oldReports.sar"), color: "red", icon: RotateCcw },
        { title: t("oldReports.total_invoices"), value: (r?.all.totalCount ?? 0).toLocaleString("en-US"), color: "blue", icon: Receipt },
      ]}
      columns={[
        { id: "date", header: t("oldReports.date"), cell: (r) => <span className="text-sm">{dayText(r.returnDate)}</span> },
        { id: "number", header: t("oldReports.return_number"), cell: (r) => <span dir="ltr" className="text-sm font-bold">{r.returnInvoiceNumber}</span> },
        { id: "invoice", header: t("oldReports.sales_invoice_number"), cell: (r) => <span dir="ltr" className="text-sm font-bold">{r.originalInvoiceNumber}</span> },
        { id: "customer", header: t("oldReports.customer_name"), cell: (r) => r.customerName },
        { id: "total", header: t("oldReports.total_amount"), cell: (r) => <span dir="ltr" className="text-sm font-bold text-primary">{money(r.returnTotal)}</span> },
        { id: "reason", header: t("oldReports.reason"), cell: (r) => r.reason },
      ]}
      outColumns={[
        { header: t("oldReports.date"), value: (r) => dayText(r.returnDate) },
        { header: t("oldReports.return_number"), value: (r) => r.returnInvoiceNumber },
        { header: t("oldReports.sales_invoice_number"), value: (r) => r.originalInvoiceNumber },
        { header: t("oldReports.customer_name"), value: (r) => r.customerName },
        { header: t("oldReports.total_amount"), value: (r) => money(r.returnTotal) },
        { header: t("oldReports.reason"), value: (r) => r.reason },
      ]} />
  )
}
