import { DollarSign, FileText, Receipt, TrendingUp } from "lucide-react"
import { useTranslation } from "react-i18next"
import { currentBranchId } from "@/modules/partners/mappers"
import { useAppSettings } from "@/modules/settings"
import { purchaseInvoices, type PurchaseInvoiceRow } from "../api"
import { dayText, money } from "../output"
import { PagedReport } from "../PagedReport"

/** Purchases by invoice number, laid out as in the current system. */
export default function PurchasesByInvoiceReport() {
  const { t } = useTranslation()
  const exempt = useAppSettings().taxSetting?.taxSetting === "Exempt"
  const sar = t("oldReports.sar")
  return (
    <PagedReport<PurchaseInvoiceRow, Awaited<ReturnType<typeof purchaseInvoices>>>
      id="purchases-by-invoice" title={t("oldReports.purchases_by_invoice")} icon={FileText} withFiscal
      filterText={(a) => `${t("oldReports.fiscal_year")}: ${a.fiscalYear} | ${t("oldReports.from")}: ${a.from} | ${t("oldReports.to")}: ${a.to}`}
      read={(a, page, size) => purchaseInvoices({ branchid: currentBranchId(), from: a.from, to: a.to, Page: page, PageSize: size })}
      rowsOf={(r) => r.items} totalOf={(r) => r.totalCount} rowKey={(r) => r.invoiceNumber}
      cards={(r) => [
        { title: t("oldReports.total_invoices"), value: (r?.totals.totalInvoices ?? 0).toLocaleString("en-US"), icon: Receipt, color: "blue" },
        ...(!exempt ? [
          { title: t("oldReports.total_purchases_excl_tax"), value: money(r?.totals.totalSubTotal), suffix: sar, icon: TrendingUp, color: "orange" as const },
        ] : []),
        { title: t("oldReports.grand_total_with_tax"), value: money(r?.totals.grandTotal), suffix: sar, icon: DollarSign, color: "teal" },
      ]}
      columns={[
        { id: "date", header: t("oldReports.date"), cell: (r) => <span className="text-sm">{dayText(r.invoiceDate)}</span> },
        { id: "number", header: t("oldReports.invoice_number"), cell: (r) => <span className="text-sm font-bold">{r.invoiceNumber}</span> },
        ...(!exempt ? [
          { id: "sub", header: t("oldReports.total_purchases_excl_tax"), cell: (r: PurchaseInvoiceRow) => <span className="text-sm font-medium">{money(r.subTotal)}</span> },
        ] : []),
        { id: "total", header: t("oldReports.grand_total_with_tax"), cell: (r) => <span className="text-sm font-bold text-primary">{money(r.grandTotal)}</span> },
      ]}
      outColumns={[
        { header: t("oldReports.date"), value: (r) => dayText(r.invoiceDate) },
        { header: t("oldReports.invoice_number"), value: (r) => r.invoiceNumber },
        ...(!exempt ? [{ header: t("oldReports.total_purchases_excl_tax"), value: (r: PurchaseInvoiceRow) => money(r.subTotal) }] : []),
        { header: t("oldReports.grand_total_with_tax"), value: (r) => money(r.grandTotal) },
      ]} />
  )
}
