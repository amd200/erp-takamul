import { useMutation, useQueryClient } from "@tanstack/react-query"
import { errorToast } from "@/shared/api/errors"
import { downloadPdf, printDocument } from "@/shared/print"
import { useAppSettings } from "@/modules/settings"
import { shiftKeys } from "../keys"
import { shiftsApi } from "../service"
import { shiftReportDoc } from "./shiftReportDoc"

type Output = { id: number; as: "print" | "pdf" }

/** Prints a shift's report or saves it as PDF; the report is fetched first unless it is already loaded. */
export function useShiftReportOutput() {
  const qc = useQueryClient()
  const s = useAppSettings()
  const withVouchers = !!s.shiftsTab?.enableShiftStatement
  const showReturns = !!s.shiftsTab?.showReturnsInShiftPrint
  const showExpenses = !!s.shiftsTab?.showExpensesInShiftReport
  const exempt = s.taxSetting?.taxSetting === "Exempt"
  const byEmployee = s.salonsTab?.showServiceEmployeeSales === true
  return useMutation({
    mutationFn: async ({ id, as }: Output) => {
      const report = await qc.fetchQuery({ queryKey: shiftKeys.report(id), queryFn: () => shiftsApi.report(id) })
      const doc = shiftReportDoc(report, { showReturns, showExpenses, withVouchers, byEmployee, exempt })
      if (as === "pdf") await downloadPdf(doc, `shift-${id}`)
      else await printDocument(doc)
    },
    onError: (e, { as }) => errorToast(e, as === "pdf" ? "shifts.pdfFailed" : "shifts.printFailed"),
  })
}
