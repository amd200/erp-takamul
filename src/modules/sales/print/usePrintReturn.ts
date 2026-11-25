import QRCode from "qrcode"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { branchKeys } from "@/modules/branches/keys"
import { branchesApi } from "@/modules/branches/service"
import { customerKeys } from "@/modules/customers/keys"
import { customersApi } from "@/modules/customers/service"
import { useAppSettings } from "@/modules/settings"
import { errorToast } from "@/shared/api/errors"
import { printDocument } from "@/shared/print/print"
import { useSession } from "@/shared/session/session"
import { returnsApi } from "../service"
import type { SalesReturnDto } from "../types"
import { rollFlagsOf } from "./invoiceRollDoc"
import { returnDoc } from "./returnDoc"

export function usePrintReturn() {
  const qc = useQueryClient()
  const { t } = useTranslation()
  const settings = useAppSettings()
  const { branch } = useSession()
  return useMutation({
    mutationFn: async ({ ret, paper }: { ret: SalesReturnDto; paper: "a4" | "roll" }) => {
      // List rows can omit details; read the return itself before printing.
      const full = await returnsApi.get(ret.id)
      const branchId = full.branchId ?? branch.id
      const customerId = full.customerId
      const [details, customer] = await Promise.all([
        branchId ? qc.fetchQuery({ queryKey: branchKeys.detail(branchId), queryFn: () => branchesApi.get(branchId) }).catch(() => undefined) : undefined,
        customerId ? qc.fetchQuery({ queryKey: customerKeys.detail(customerId), queryFn: () => customersApi.get(customerId) }).catch(() => undefined) : undefined,
      ])
      const isExempt = settings.taxSetting?.taxSetting === "Exempt"
      const qrImage = !isExempt && full.zatcaQRCode ? await QRCode.toDataURL(full.zatcaQRCode).catch(() => null) : null
      await printDocument(returnDoc(full, paper, {
        branch: details, customer, isExempt, qrImage,
        showPaymentMethods: settings.paymentTab?.showPaymentMethods !== false,
        showPaidAndRemaining: settings.paymentTab?.showPaidAndRemainingAmount !== false,
        showBranchName: settings.printRollTab?.showBranchNameInPrint === true,
        showHeaderAndFooter: settings.printA4Tab?.showHeaderAndFooterInPrint !== false,
        blue: settings.printA4Tab?.a4InvoiceType === "Design2",
        design: settings.printA4Tab?.a4InvoiceType === "Design3" || settings.printA4Tab?.a4InvoiceType === "Design4" ? settings.printA4Tab?.a4InvoiceType as "Design3" | "Design4" : undefined,
        ...rollFlagsOf(settings),
        methodLabel: (method) => t(`sales.methods.${method}`, { defaultValue: method }),
      }))
    },
    onError: (error) => errorToast(error, "sales.returnPrintFailed"),
  })
}
