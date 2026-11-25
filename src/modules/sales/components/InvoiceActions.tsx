import { Fragment, type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { useMutation } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import { DollarSign, Download, Eye, FileDown, FileSpreadsheet, FileText, Mail, MessageCircle, MoreHorizontal, PlusCircle, Printer, RefreshCw, RotateCcw, ScrollText, Warehouse, FileCheck } from "lucide-react"
import { useTranslation } from "react-i18next"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useCan } from "@/shared/permissions/usePermission"
import { P } from "@/shared/permissions/permissions"
import { useAppSettings } from "@/modules/settings"
import { errorToast } from "@/shared/api/errors"
import { invoicesApi } from "../service"
import { useSendInvoice } from "../queries"
import { useInvoiceOutput } from "../print/useInvoiceOutput"
import type { Channel, SalesOrderDto } from "../types"

type FileKind = "xml" | "xlsx" | "pdfa3"
const fetchFile = (kind: FileKind, id: number) => (kind === "xml" ? invoicesApi.downloadXml(id) : kind === "xlsx" ? invoicesApi.downloadExcel(id) : invoicesApi.downloadPdfA3(id))

/** The invoice row menu, item for item and in the same order and conditions as the current system (A4 and POS invoice lists). */
export function InvoiceActions({ invoice, channel, onPayments, onNotes, onZatcaResponse, onPreview }: { invoice: SalesOrderDto; channel: Channel; onPayments: () => void; onNotes: () => void; onZatcaResponse: () => void; onPreview: () => void }) {
  const { t } = useTranslation()
  const can = useCan()
  const settings = useAppSettings()
  const ops = settings.operationsTab
  const enableDebitNote = ops?.enableDebitNote
  const zatca = settings.taxSetting?.taxSetting === "SecondStage"
  const send = useSendInvoice()
  const output = useInvoiceOutput()
  const download = useMutation({
    mutationFn: async (kind: FileKind) => ({ kind, blob: await fetchFile(kind, invoice.id) }),
    onSuccess: ({ kind, blob }) => {
      const a = document.createElement("a")
      a.href = URL.createObjectURL(blob)
      a.download = kind === "pdfa3" ? `Invoice_Zatca_${invoice.id}.pdf` : `${invoice.orderNumber}.${kind}`
      a.click()
      URL.revokeObjectURL(a.href)
    },
    onError: (e) => errorToast(e, "sales.downloadFailed"),
  })
  const canReturn = ops?.allowSalesReturn && can(P.sales.returnsAdd)
  const canAddDebitNote = enableDebitNote && can(P.sales.debitAdd)

  const item = "flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground"
  const spin = (kind: FileKind, icon: ReactNode) => (download.isPending && download.variables === kind ? <RefreshCw className="animate-spin" size={14} /> : icon)

  // Each group is a list of items; hidden items are dropped and separators only go between groups that still have items.
  const groups: ReactNode[][] = [
    [
      ops?.allowPrintInvoiceA4 && <DropdownMenuItem key="a4" className={item} disabled={output.isPending} onSelect={() => output.mutate({ invoice, as: "print" })}><FileText size={14} />{t("sales.menu.printA4")}</DropdownMenuItem>,
      ops?.allowPrintInvoiceA5 && <DropdownMenuItem key="a5" className={item} disabled={output.isPending} onSelect={() => output.mutate({ invoice, as: "print", paper: "a5" })}><FileText size={14} />{t("sales.menu.printA5")}</DropdownMenuItem>,
      ops?.allowPrintInvoiceRoll && <DropdownMenuItem key="roll" className={item} disabled={output.isPending} onSelect={() => output.mutate({ invoice, as: "print", paper: "roll" })}><Printer size={14} />{t("sales.menu.printRoll")}</DropdownMenuItem>,
     <DropdownMenuItem key="payments" className={item} onSelect={onPayments}><DollarSign size={14} />{t("sales.menu.payments")}</DropdownMenuItem>,
    ],
    [ops?.allowEditInvoiceNotes && <DropdownMenuItem key="notes" className={item} onSelect={onNotes}><FileText size={14} />{t("sales.menu.notes")}</DropdownMenuItem>],
    [
      canReturn && <DropdownMenuItem key="return" asChild><Link to={`/sales/returns/create?invoice=${invoice.id}`} className={item}><RotateCcw size={14} />{t("sales.menu.return")}</Link></DropdownMenuItem>,
      canAddDebitNote && <DropdownMenuItem key="debit" asChild><Link to={`/sales/debit-notes/create?invoice=${invoice.id}`} className={item}><PlusCircle size={14} />{t("sales.menu.debitNote")}</Link></DropdownMenuItem>,
      ops?.isStockVoucher && <DropdownMenuItem key="stock" className={item} disabled={output.isPending} onSelect={() => output.mutate({ invoice, as: "print", voucher: "stock" })}><Warehouse size={14} />{t("sales.menu.stockVoucher")}</DropdownMenuItem>,
      ops?.isClaimVoucher && <DropdownMenuItem key="claim" className={item} disabled={output.isPending} onSelect={() => output.mutate({ invoice, as: "print", voucher: "claim" })}><FileCheck size={14} />{t("sales.menu.claimVoucher")}</DropdownMenuItem>,
    ],
    [
      ops?.allowDownloadInvoicePdfA4 && <DropdownMenuItem key="pdfa4" className={item} disabled={output.isPending} onSelect={() => output.mutate({ invoice, as: "pdf" })}><FileDown size={14} />{t("sales.menu.downloadPdfA4")}</DropdownMenuItem>,
      ops?.allowDownloadInvoicePdfRoll && <DropdownMenuItem key="pdfroll" className={item} disabled={output.isPending} onSelect={() => output.mutate({ invoice, as: "pdf", paper: "roll" })}>{channel === "POS" ? <Printer size={14} /> : <Download size={14} />}{t("sales.menu.downloadPdfRoll")}</DropdownMenuItem>,
      ops?.allowPrintA3 && <DropdownMenuItem key="pdfa3" className={item} disabled={download.isPending} onSelect={() => download.mutate("pdfa3")}>{spin("pdfa3", <FileDown size={14} />)}{t("sales.menu.pdfa3")}</DropdownMenuItem>,
      ops?.allowExportExcel && <DropdownMenuItem key="excel" className={item} disabled={download.isPending} onSelect={() => download.mutate("xlsx")}><FileSpreadsheet size={14} />{t("sales.menu.excel")}</DropdownMenuItem>,
    ],
    [
      ops?.emailSending && <DropdownMenuItem key="email" className={item}><Mail size={14} />{t(channel === "POS" ? "sales.menu.emailPos" : "sales.menu.email")}</DropdownMenuItem>,
      ops?.whatsappSending && <DropdownMenuItem key="whatsapp" className={item}><MessageCircle size={14} />{t("sales.menu.whatsapp")}</DropdownMenuItem>,
    ],
    zatca ? [
      ops?.allowResendInvoiceToZatca && <DropdownMenuItem key="resend" className={item} disabled={send.isPending} onSelect={() => send.mutate(invoice.id)}><RefreshCw size={14} />{t("sales.menu.resend")}</DropdownMenuItem>,
      ops?.allowViewZatcaResponse && <DropdownMenuItem key="zatca" className={item} onSelect={onZatcaResponse}><ScrollText size={14} />{t("sales.menu.zatcaResponse")}</DropdownMenuItem>,
      ops?.allowDownloadZatcaResponseXml && <DropdownMenuItem key="xml" className={item} disabled={download.isPending} onSelect={() => download.mutate("xml")}>{spin("xml", <Download size={14} />)}{t("sales.menu.zatcaXml")}</DropdownMenuItem>,
      ops?.allowDownloadZatcaResponseExcel && <DropdownMenuItem key="zxlsx" className={item} disabled={download.isPending} onSelect={() => download.mutate("xlsx")}>{spin("xlsx", <Download size={14} />)}{t("sales.menu.zatcaExcel")}</DropdownMenuItem>,
    ] : [],
  ].map((g) => g.filter(Boolean)).filter((g) => g.length > 0)

  return (
    <div className="flex items-center justify-end gap-1">
    <Button type="button" variant="ghost" size="icon" aria-label={t("sales.menu.preview")} onClick={onPreview}><Eye /></Button>
    {groups.length > 0 && (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="ghost" size="icon" aria-label={t("common.actions")}><MoreHorizontal /></Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52 p-1">
        {groups.map((g, i) => <Fragment key={i}>{i > 0 && <DropdownMenuSeparator />}{g}</Fragment>)}
      </DropdownMenuContent>
    </DropdownMenu>
    )}
    </div>
  )
}
