import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { branchKeys } from "@/modules/branches/queries"
import { branchesApi } from "@/modules/branches/service"
import { customerKeys } from "@/modules/customers/queries"
import { customersApi } from "@/modules/customers/service"
import { useAppSettings } from "@/modules/settings"
import { errorToast } from "@/shared/api/errors"
import { printDocument } from "@/shared/print/print"
import { useSession } from "@/shared/session/session"
import type { Quote } from "../types"
import { quoteDoc } from "./quoteDoc"

export function usePrintQuote() {
  const qc = useQueryClient()
  const { t } = useTranslation()
  const settings = useAppSettings()
  const { branch } = useSession()
  return useMutation({
    mutationFn: async (quote: Quote) => {
      const id = branch.id
      const [details, customer] = await Promise.all([
        id ? qc.fetchQuery({ queryKey: branchKeys.detail(id), queryFn: () => branchesApi.get(id) }).catch(() => undefined) : undefined,
        quote.customerid ? qc.fetchQuery({ queryKey: customerKeys.detail(quote.customerid), queryFn: () => customersApi.get(quote.customerid!) }).catch(() => undefined) : undefined,
      ])
      await printDocument(quoteDoc(quote, {
        branch: details, customer,
        isExempt: settings.taxSetting?.taxSetting === "Exempt",
        showPaymentMethods: settings.paymentTab?.showPaymentMethods !== false,
        showPaidAndRemaining: settings.paymentTab?.showPaidAndRemainingAmount !== false,
        showBranchName: settings.printRollTab?.showBranchNameInPrint === true,
        showHeaderAndFooter: settings.printA4Tab?.showHeaderAndFooterInPrint !== false,
        blue: settings.printA4Tab?.a4InvoiceType === "Design2",
        design: settings.printA4Tab?.a4InvoiceType === "Design3" || settings.printA4Tab?.a4InvoiceType === "Design4" ? settings.printA4Tab?.a4InvoiceType as "Design3" | "Design4" : undefined,
        methodLabel: (method) => t(`sales.methods.${method}`),
      }))
    },
    onError: (error) => errorToast(error, "quotes.printFailed"),
  })
}
