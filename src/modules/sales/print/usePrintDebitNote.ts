import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { branchKeys } from "@/modules/branches/queries"
import { branchesApi } from "@/modules/branches/service"
import { customerKeys } from "@/modules/customers/queries"
import { customersApi } from "@/modules/customers/service"
import { useAppSettings } from "@/modules/settings"
import { errorToast } from "@/shared/api/crudQueries"
import { printDocument } from "@/shared/print/print"
import { useSession } from "@/shared/session/session"
import { salesKeys } from "../queries"
import { debitNotesApi, invoicesApi } from "../service"
import type { DebitNoteDto } from "../types"
import { debitNoteDoc } from "./debitNoteDoc"

export function usePrintDebitNote() {
  const qc = useQueryClient()
  const { t } = useTranslation()
  const settings = useAppSettings()
  const { branch } = useSession()
  return useMutation({
    mutationFn: async ({ note, paper }: { note: DebitNoteDto; paper: "a4" | "roll" }) => {
      // List rows can omit payment details; read the note itself before printing.
      const fullNote = await debitNotesApi.get(note.id)
      const branchId = branch.id
      // The linked invoice supplies the customer id, not the printed items or amounts.
      const [details, source] = await Promise.all([
        branchId ? qc.fetchQuery({ queryKey: branchKeys.detail(branchId), queryFn: () => branchesApi.get(branchId) }).catch(() => undefined) : undefined,
        fullNote.salesOrderId ? qc.fetchQuery({ queryKey: salesKeys.invoice(fullNote.salesOrderId), queryFn: () => invoicesApi.get(fullNote.salesOrderId!) }).catch(() => undefined) : undefined,
      ])
      const customerId = source?.customerId
      const customer = customerId ? await qc.fetchQuery({ queryKey: customerKeys.detail(customerId), queryFn: () => customersApi.get(customerId) }).catch(() => undefined) : undefined
      await printDocument(debitNoteDoc(fullNote, paper, {
        branch: details, customer,
        isExempt: settings.taxSetting?.taxSetting === "Exempt",
        showPaymentMethods: settings.paymentTab?.showPaymentMethods !== false,
        showPaidAndRemaining: settings.paymentTab?.showPaidAndRemainingAmount !== false,
        showBranchName: settings.printRollTab?.showBranchNameInPrint === true,
        showHeaderAndFooter: settings.printA4Tab?.showHeaderAndFooterInPrint !== false,
        blue: settings.printA4Tab?.a4InvoiceType === "Design2",
        design: settings.printA4Tab?.a4InvoiceType === "Design3" || settings.printA4Tab?.a4InvoiceType === "Design4" ? settings.printA4Tab?.a4InvoiceType as "Design3" | "Design4" : undefined,
        grid: settings.printRollTab?.invoiceDesign3 === true,
        showUnits: settings.itemsTab?.enablePieceAndCartonSystem === true,
        methodLabel: (method) => t(`sales.methods.${method}`),
      }))
    },
    onError: (error) => errorToast(error, "sales.debitPrintFailed"),
  })
}
