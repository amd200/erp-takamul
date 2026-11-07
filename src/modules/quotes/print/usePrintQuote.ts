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
import { quoteDetailOptions } from "../queries"
import { quoteDoc } from "./quoteDoc"

export function usePrintQuote() {
  const qc = useQueryClient()
  const { t } = useTranslation()
  const settings = useAppSettings()
  const { branch } = useSession()
  return useMutation({
    mutationFn: async (id: number) => {
      const branchId = branch.id
      const branchDetails = branchId
        ? qc.fetchQuery({ queryKey: branchKeys.detail(branchId), queryFn: () => branchesApi.get(branchId) }).catch(() => undefined)
        : undefined
      const quote = await qc.fetchQuery(quoteDetailOptions(id))
      const customerId = quote.customerid
      const [details, customer] = await Promise.all([
        branchDetails,
        customerId ? qc.fetchQuery({ queryKey: customerKeys.detail(customerId), queryFn: () => customersApi.get(customerId) }).catch(() => undefined) : undefined,
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
