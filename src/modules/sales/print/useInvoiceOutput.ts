import QRCode from "qrcode"
import { useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { errorToast } from "@/shared/api/errors"
import { downloadPdf, printDocument } from "@/shared/print"
import { useSession } from "@/shared/session/session"
import { branchKeys } from "@/modules/branches/keys"
import { branchesApi } from "@/modules/branches/service"
import { customerKeys } from "@/modules/customers/keys"
import { customersApi } from "@/modules/customers/service"
import { eyeText } from "@/modules/customers/form"
import { EYE_FIELDS, type Customer } from "@/modules/customers/types"
import { fetchProduct } from "@/modules/products/lookup"
import { useAppSettings, useCurrency } from "@/modules/settings"
import { invoicesApi } from "../service"
import { editorLineOf, orderTotals } from "../totals"
import type { PaymentMethod, SalesOrderDto } from "../types"
import type { PrintInvoice } from "./printInvoice"
import { invoiceA4Doc } from "./invoiceA4Doc"
import { invoiceA5Doc } from "./invoiceA5Doc"
import { invoiceRollDoc, type InvoiceRollOptions } from "./invoiceRollDoc"
import type { Settings } from "@/modules/settings/types"
import type { Branch } from "@/modules/branches/types"
import { claimVoucherDoc, stockVoucherDoc } from "./voucherDocs"

type Output = "print" | "pdf" | "preview"

/** Barcodes of the products on the invoice: only those items are read (by id, cached), not the whole catalog. */
async function barcodesOf(qc: QueryClient, invoice: SalesOrderDto) {
  const ids = [...new Set((invoice.items ?? []).map((l) => l.productId))]
  // An item that cannot be read only loses its barcode; the invoice still prints.
  const products = await Promise.all(ids.map((id) => fetchProduct(qc, id).catch(() => null)))
  return new Map(products.flatMap((p) => (p && p.barcode ? [[p.id, p.barcode] as const] : [])))
}

/** The customer's own eye measurements, when there are any to print. */
const measurementOf = (c: Customer | undefined) => (c && EYE_FIELDS.some((k) => String(c[k] ?? "").trim() !== "") ? eyeText(c) : null)
type Paper = "a4" | "a5" | "roll"

/**
 * The 80mm roll's options from the settings, the same for every place that draws an invoice on the roll (the cashier's
 * print and PDF, the customer's /qr page), so they all look exactly alike.
 */
export const rollOptionsOf = (settings: Settings, o: { branch: Branch | undefined; customer: Customer | undefined; currency: string; methodLabel: (m: string) => string }): InvoiceRollOptions => ({
  ...o,
  isExempt: settings.taxSetting?.taxSetting === "Exempt",
  showPaymentMethods: settings.paymentTab?.showPaymentMethods !== false,
  showPaidAndRemaining: settings.paymentTab?.showPaidAndRemainingAmount !== false,
  showBranchName: settings.printRollTab?.showBranchNameInPrint === true,
  grid: settings.printRollTab?.invoiceDesign3 === true,
  showUnits: settings.itemsTab?.enablePieceAndCartonSystem === true,
})

/** The saved invoice as the layouts print it: the server's own totals and line amounts. */
export const printInvoiceOf = (o: SalesOrderDto): PrintInvoice => ({
  id: o.id, number: o.orderNumber ?? "", date: o.orderDate ?? "", customerName: o.customerName ?? "", warehouseName: o.warehouseName ?? "",
  employeeName: o.employeeName ?? null, createdBy: o.createdBy ?? "", notes: o.notes ?? "",
  lines: (o.items ?? []).map((l) => ({ ...editorLineOf(l), amounts: { discount: l.discountValue ?? 0, tax: l.taxAmount ?? 0, total: l.lineTotal ?? 0 } })),
  totals: orderTotals(o),
  payments: (o.payments ?? []).map((p) => ({ method: p.paymentMethod as PaymentMethod, amount: p.amount })),
  paid: o.totalPaid ?? 0,
})

/** Prints an invoice on A4 or saves it as PDF (or, with `as: "preview"`, returns the document to show on screen). The invoice, branch and customer details it needs are fetched first. */
export function useInvoiceOutput() {
  const qc = useQueryClient()
  const { t } = useTranslation()
  const settings = useAppSettings()
  const currency = useCurrency()
  const { branch } = useSession()
  return useMutation({
    mutationFn: async ({ invoice: row, as, paper = "a4", voucher }: { invoice: { id: number }; as: Output; paper?: Paper; voucher?: "stock" | "claim" }) => {
      // A list row may carry only the summary, so the full invoice (its lines and payments) is read first.
      const invoice = await invoicesApi.get(row.id)
      const doc0 = printInvoiceOf(invoice)
      // Missing branch or customer details only blank those boxes; the invoice still prints.
      const [b, c] = await Promise.all([
        branch.id ? qc.fetchQuery({ queryKey: branchKeys.detail(branch.id), queryFn: () => branchesApi.get(branch.id!) }).catch(() => undefined) : undefined,
        invoice.customerId ? qc.fetchQuery({ queryKey: customerKeys.detail(invoice.customerId), queryFn: () => customersApi.get(invoice.customerId!) }).catch(() => undefined) : undefined,
      ])
      if (voucher) {
        const opts = { branch: b, customerPhone: c?.mobile || c?.phone }
        return printDocument(voucher === "stock" ? stockVoucherDoc(invoice, opts) : claimVoucherDoc(invoice, opts))
      }
      const isExempt = settings.taxSetting?.taxSetting === "Exempt"
      // Same as the old app: use the stored QR text, else ask the backend to generate it; a failure only leaves the QR box empty.
      const qrText = isExempt ? "" : invoice.zatcaQRCode || (await invoicesApi.generateQr(row.id).then((r) => r?.qrCode ?? "").catch(() => ""))
      const qrImage = qrText ? await QRCode.toDataURL(qrText).catch(() => null) : null
      const showPaymentMethods = settings.paymentTab?.showPaymentMethods !== false
      const showPaidAndRemaining = settings.paymentTab?.showPaidAndRemainingAmount !== false
      const showBranchName = settings.printRollTab?.showBranchNameInPrint === true
      const methodLabel = (m: string) => t(`sales.methods.${m}`)
      const doc = paper === "a5"
        ? invoiceA5Doc(doc0, { branch: b, customer: c, isExempt, qrImage, barcodes: await barcodesOf(qc, invoice), measurement: measurementOf(c), methodLabel })
        : paper === "roll"
        ? invoiceRollDoc(doc0, rollOptionsOf(settings, { branch: b, customer: c, currency, methodLabel }))
        : invoiceA4Doc(doc0, { branch: b, customer: c, isExempt, qrImage, showPaymentMethods, showPaidAndRemaining, showBranchName, showHeaderAndFooter: settings.printA4Tab?.showHeaderAndFooterInPrint !== false, blue: settings.printA4Tab?.a4InvoiceType === "Design2", design: settings.printA4Tab?.a4InvoiceType === "Design3" || settings.printA4Tab?.a4InvoiceType === "Design4" ? settings.printA4Tab?.a4InvoiceType as "Design3" | "Design4" : undefined, methodLabel })
      // Preview: hand the finished document back; the caller shows it on screen instead of printing.
      if (as === "preview") return doc
      if (as === "pdf") await downloadPdf(doc, doc0.number)
      else await printDocument(doc, paper === "roll" ? settings.print?.defultPrinter : null)
    },
    onError: (e, { as }) => errorToast(e, as === "pdf" ? "sales.pdfFailed" : as === "preview" ? "sales.previewFailed" : "sales.printFailed"),
  })
}
