import { useMutation, useQueryClient } from "@tanstack/react-query"
import { voucherNumber } from "../types"
import i18n from "@/shared/i18n"
import { errorToast } from "@/shared/api/errors"
import { downloadPdf, printDocument } from "@/shared/print"
import { useSession } from "@/shared/session/session"
import { branchKeys } from "@/modules/branches/queries"
import { branchesApi } from "@/modules/branches/service"
import { useAppSettings } from "@/modules/settings"
import type { Voucher } from "../types"
import { voucherDoc } from "./voucherDoc"

type Output = { voucher: Voucher; treasuryName: string; as: "print" | "pdf" }

/** Prints a voucher or saves it as PDF. The branch (name, tax number, logo) is fetched first; the sheet still prints without it. */
export function useVoucherOutput() {
  const qc = useQueryClient()
  const { branch } = useSession()
  const copies = Number(useAppSettings().vouchersPrintTab?.voucherPrintCount) || 1
  return useMutation({
    mutationFn: async ({ voucher, treasuryName, as }: Output) => {
      const b = branch.id ? await qc.fetchQuery({ queryKey: branchKeys.detail(branch.id), queryFn: () => branchesApi.get(branch.id!) }).catch(() => undefined) : undefined
      const doc = voucherDoc(voucher, { branch: b, treasuryName, copies, lang: i18n.language === "ar" || i18n.language === "bn" ? i18n.language : "en" })
      if (as === "pdf") await downloadPdf(doc, voucherNumber(voucher))
      else await printDocument(doc)
    },
    onError: (e, { as }) => errorToast(e, as === "pdf" ? "vouchers.pdfFailed" : "vouchers.printFailed"),
  })
}
