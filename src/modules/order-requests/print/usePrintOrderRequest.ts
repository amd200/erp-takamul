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
import { orderRequestsApi } from "../service"
import { rollOptionsOf } from "@/modules/sales/print/invoiceRollDoc"
import { orderRequestDoc } from "./orderRequestDoc"

export function usePrintOrderRequest() {
  const qc = useQueryClient()
  const { t } = useTranslation()
  const settings = useAppSettings()
  const { branch } = useSession()
  return useMutation({
    mutationFn: async (id: number) => {
      // The list row has no items; read the order itself before printing.
      const order = await orderRequestsApi.get(id)
      const branchId = branch.id
      const customerId = order.customerId
      const [details, customer] = await Promise.all([
        branchId ? qc.fetchQuery({ queryKey: branchKeys.detail(branchId), queryFn: () => branchesApi.get(branchId) }).catch(() => undefined) : undefined,
        customerId ? qc.fetchQuery({ queryKey: customerKeys.detail(customerId), queryFn: () => customersApi.get(customerId) }).catch(() => undefined) : undefined,
      ])
      // An order has no payments, so none are printed.
      await printDocument(orderRequestDoc(order, {
        ...rollOptionsOf(settings, { branch: details, customer, methodLabel: (method) => t(`sales.methods.${method}`, { defaultValue: method }) }),
        showPaymentMethods: false, showPaidAndRemaining: false, showUnits: false,
      }))
    },
    onError: (error) => errorToast(error, "orderRequests.printFailed"),
  })
}
