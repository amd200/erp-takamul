import { useMutation } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import { DollarSign, Download, FileDown, FileSpreadsheet, FileText, Mail, MessageCircle, MoreHorizontal, PlusCircle, Printer, RefreshCw, RotateCcw } from "lucide-react"
import { useTranslation } from "react-i18next"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useCan } from "@/shared/permissions/usePermission"
import { P } from "@/shared/permissions/permissions"
import { useAppSettings } from "@/modules/settings"
import { errorToast } from "@/shared/api/crudQueries"
import { invoicesApi } from "../service"
import { useSendInvoice } from "../queries"
import { useInvoiceOutput } from "../print/useInvoiceOutput"
import type { SalesOrderDto } from "../types"

/** Every action the current system offers on an invoice row, grouped so the menu stays scannable. */
export function InvoiceActions({ invoice, onPayments, onNotes }: { invoice: SalesOrderDto; onPayments: () => void; onNotes: () => void }) {
  const { t } = useTranslation()
  const can = useCan()
  const settings = useAppSettings()
  const enableDebitNote = settings.generalTab?.enableDebitNote
  const taxSetting = settings.taxSetting?.taxSetting
  const send = useSendInvoice()
  const output = useInvoiceOutput()
  const download = useMutation({
    mutationFn: async (kind: "xml" | "xlsx") => ({ kind, blob: await (kind === "xml" ? invoicesApi.downloadXml(invoice.id) : invoicesApi.downloadExcel(invoice.id)) }),
    onSuccess: ({ kind, blob }) => {
      const a = document.createElement("a")
      a.href = URL.createObjectURL(blob)
      a.download = `${invoice.orderNumber}.${kind}`
      a.click()
      URL.revokeObjectURL(a.href)
    },
    onError: (e) => errorToast(e, "sales.downloadFailed"),
  })
  const canReturn = can(P.sales.returnsAdd)
  const canAddDebitNote = enableDebitNote && can(P.sales.debitAdd)

  const item = "flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-700"
  const zatca = taxSetting === "SecondStage"

  // One flat list in the same order as the current system, gated the same way.
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" aria-label={t("common.actions")} className="btn-minimal-action btn-compact-action"><MoreHorizontal size={18} /></button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52 p-1">
        <DropdownMenuItem className={item} disabled={output.isPending} onSelect={() => output.mutate({ invoice, as: "print" })}><FileText size={14} />{t("sales.actions.printA4")}</DropdownMenuItem>
        <DropdownMenuItem className={item} disabled={output.isPending} onSelect={() => output.mutate({ invoice, as: "print", paper: "a5" })}><FileText size={14} />{t("sales.actions.printA5")}</DropdownMenuItem>
        <DropdownMenuItem className={item} disabled={output.isPending} onSelect={() => output.mutate({ invoice, as: "print", paper: "roll" })}><Printer size={14} />{t("sales.actions.printRoll")}</DropdownMenuItem>
        {can(P.sales.payments) && <DropdownMenuItem className={item} onSelect={onPayments}><DollarSign size={14} />{t("sales.actions.payments")}</DropdownMenuItem>}
        {can(P.sales.notes) && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem className={item} onSelect={onNotes}><FileText size={14} />{t("sales.actions.notes")}</DropdownMenuItem>
          </>
        )}
        {(canReturn || canAddDebitNote) && (
          <>
            <DropdownMenuSeparator />
            {canReturn && <DropdownMenuItem asChild><Link to={`/sales/returns/create?invoice=${invoice.id}`} className={item}><RotateCcw size={14} />{t("sales.actions.return")}</Link></DropdownMenuItem>}
            {canAddDebitNote && <DropdownMenuItem asChild><Link to={`/sales/debit-notes/create?invoice=${invoice.id}`} className={item}><PlusCircle size={14} />{t("sales.actions.debitNote")}</Link></DropdownMenuItem>}
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem className={item} disabled={output.isPending} onSelect={() => output.mutate({ invoice, as: "pdf" })}><FileDown size={14} />{t("sales.actions.downloadPdfA4")}</DropdownMenuItem>
        <DropdownMenuItem className={item} disabled={output.isPending} onSelect={() => output.mutate({ invoice, as: "pdf", paper: "roll" })}><Download size={14} />{t("sales.actions.downloadPdfRoll")}</DropdownMenuItem>
        <DropdownMenuItem className={item} disabled={download.isPending} onSelect={() => download.mutate("xlsx")}><FileSpreadsheet size={14} />{t("sales.actions.excel")}</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className={item}><Mail size={14} />{t("sales.actions.email")}</DropdownMenuItem>
        <DropdownMenuItem className={item}><MessageCircle size={14} />{t("sales.actions.whatsapp")}</DropdownMenuItem>
        {zatca && can(P.sales.zatca) && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem className={item} disabled={send.isPending} onSelect={() => send.mutate(invoice.id)}><RefreshCw size={14} />{t("sales.actions.resend")}</DropdownMenuItem>
            <DropdownMenuItem className={item} disabled={download.isPending} onSelect={() => download.mutate("xml")}><Download size={14} />{t("sales.actions.xml")}</DropdownMenuItem>
            <DropdownMenuItem className={item} disabled={download.isPending} onSelect={() => download.mutate("xlsx")}><Download size={14} />{t("sales.actions.excel")}</DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
